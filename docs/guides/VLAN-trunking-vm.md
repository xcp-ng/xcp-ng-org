# VLAN Trunking in a VM

How to configure a VLAN trunk?

This document will describe how to configure a VLAN trunk port for use in a VM running on xcp-ng. The typical use case for this is you want to run your network's router as a VM and your network has multiple vlans.

With some help from others in the [forums](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm/11), I was able to get a satisfactory solution implemented using [pfSense](https://pfsense.org) and so this document will discuss how to implement this solution using pfSense as your router. In theory, the same solution should apply to other router solutions, but it is untested. Feel free to update this document with your results.

## Two Approaches

There are two approaches to vlans in xcp-ng. The first is to create a vif for each VLAN you want your router to route traffic for then attach the vif to your VM. The second is to pass through a trunk port from dom0 onto your router VM.

### Multiple VIFs

By far, this is the easiest solution and perhaps the "officially supported" approach for xcp-ng. When you do this, dom0 handles all the VLAN tagging for you and each vif is just presented to your router VM as a separate virtual network interface. It's like you have a bunch of separate network cards installed on your router where each represents a different VLAN and is essentially attached to a VLAN access (untagged) port on your switch. There is nothing special for you to do, this _just works_. If you require 7 vifs or less for your router then this might be the easiest approach.

The problem with this approach is when you have many vlans you want to configure on your router. If you read through the thread I linked to at the top of this page you'll notice the discussion about where I was unable to attach more than 7 vifs to my pfSense VM. XO nor XCP-ng Center allow you to attach more than seven. This appears to be some kind of limit somewhere in Xen. Other users have been able to attach more than 7 vifs via CLI, however when I tried to do this myself my pfSense VM became unresponsive once I added the 8th vif. More details on that problem are discussed in the thread.

Another problem with this approach, perhaps only specific to pfSense, is that when you attach many vifs, you must disable TX offloading on each and every vif otherwise you'll have all kinds of problems. This was definitely a red flag for me. Initially I'm starting with 7 vlans and 9 networks total with short term requirements for at least another 3 vlans for sure and then who knows how many down the road. In this approach, every time you have to create a new VLAN by adding a vif to the VM, you will have to reboot the VM.

Having to reboot my network's router every time I need to create a new VLAN is not ideal for the environment I'm working in; especially because in the current production environment running VMware, we do not need to reboot the router VM to create new vlans. (FWIW, I've come to xcp-ng as the IT department has asked me to investigate possibly replacing our VMware env with XCP-ng. I started my adventures with xcp-ng by diving in head first at home and replacing my home environment, previously ESXi, with xcp-ng. Now I'm in the early phases of working with xcp-ng in the test lab at work.)

In conclusion, if you have seven or fewer vifs and you're fairly confident that you'll never need to exceed seven vifs then this approach is probably the path of least resistance. On the other hand, if you know you'll need more than seven or fairly certain you will some day. Or you're in an environment where you need to be able to create vlans on the fly then you'll probably want to proceed with the alternative below.

This document is about the alternative approach, but a quick summary of how this solution works in xcp-ng:
* Make sure the pif connected to your xcp-ng server is carrying all the required tagged vlans
* Within XO or XCP Center, create multiple networks off of the pif, adding the VLAN tag as needed for each VLAN
* For each VLAN you want your router to route for, add a vif for that specific VLAN to the VM
* For pfSense, disable TX offloading for each vif added and reboot the VM. This [page](pfsense.md) will fully explain all of the config changes required when running pfSense in xcp-ng.

## Adding VLAN Trunk to VM

The alternative approach involves attaching the VLAN trunk port directly to your router VM, and handling the VLANs in pfSense directly. This has the biggest advantage of not requiring a VM reboot each time you need to setup a new VLAN. However note you will need to manually edit a configuration file in pfSense every time it is upgraded. The physical interface you are using to trunk VLANs into the pfSense VM should also not be the same physical interface that your xcp-ng management interface is on. This is because one of the steps required is setting the physical interface MTU to 1504, and this will potentially cause MTU mismatches if xen is using this same physical interface for management traffic (1504-byte sized packets being sent from the xen management interface to your MTU 1500 network).

The problem we face with this solution is that, at least in pfSense, the xn driver used for the paravirtualization in FreeBSD does not support 802.1q tagging. So we have to account for this ourselves both in dom0 and in the pfSense VM. Once you're aware of this limitation, it actually isn't a big deal to get it all working but it just never occurred to me that a presumably relatively modern network driver would not support 802.1q.

Anyway, the first step is to modify the MTU setting of the **pif** that is carrying your tagged vlans into the xcp-ng server from 1500 to 1504. The extra 4 bytes is, of course, the size of the VLAN tagging within each frame. **Warning:** You're going to have to detach or shutdown any VMs that are currently using this interface. For this example, let's say it's `eth1` that is the pif carrying all our tagged traffic.


1. List all your networks
```
xe network-list
```
2. Set MTU on the relevant network(s)
```
xe network-param-set uuid=xxx MTU=1504
```
3. Reboot your XCP-ng host to apply the MTU change on the physical network cards


Once this is done, attach a new vif to your pfSense VM and select `eth1` as the network. This will attach the VLAN trunk to pfSense. Boot up pfSense and disable TX offloading, etc. on the vif, reboot as necessary then login to pfSense.

Configure the interface within pfSense by also increasing the MTU value to 1504. Again, the xn driver does not support VLAN tagging, so we have to deal with it ourselves. **NOTE:** You only increase the MTU on the **parent interface** only in both xcp-ng **and** pfSense. The MTU for vlans will always be 1500.

Finally, along the same lines, since the xn driver does not support 802.1q, pfSense will not allow you to create vlans on any interface using the xn driver. We have to modify pfSense to allow us to do this.

From a shell in pfSense, edit `/etc/inc/interfaces.inc` and modify the `is_jumbo_capable` function at around line 6761. Edit it so it reads like so:

```
function is_jumbo_capable($iface) {
        $iface = trim($iface);
        $capable = pfSense_get_interface_addresses($iface);

        if (isset($capable['caps']['vlanmtu'])) {
                return true;
        }

        // hack for some lagg modes missing vlanmtu, but work fine w/VLANs
        if (substr($iface, 0, 4) == "lagg") {
                return true;
        }

        // hack for Xen xn interfaces
        if (substr($iface, 0, 2) == "xn")
                return true;

        return false;
}
```
:::tip
This modification is based on pfSense 2.4.4p1, ymmv. However, I copied this mod from [here](https://eliasmoraispereira.wordpress.com/2016/10/05/pfsense-virtualizacao-com-xenserver-criando-vlans/), which was based on pfSense 2.3.x, so this code doesn't change often.
:::

Keep in mind that you will need to reapply this mod anytime you upgrade pfSense.

That's it, you're good to go!  Go to your interfaces > assignments in pfSense, select the VLANs tab and create your vlans. Everything should work as expected.

## Links/References

* [Forums: My initial question and discussion about VLAN trunk support](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm)
* [pfSense interface does not support VLANs](https://forum.netgate.com/topic/112359/xenserver-vlan-doesn-t-supporting-eth-device-for-vlan)
* [pfSense: Adding VLAN support for Xen xn interfaces](https://eliasmoraispereira.wordpress.com/2016/10/05/pfsense-virtualizacao-com-xenserver-criando-vlans/)