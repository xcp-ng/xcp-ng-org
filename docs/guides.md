# Guides

This section is grouping various guides regarding XCP-ng use cases.

## pfSense VM

pfSense works great in a VM, but there are a few extra steps that need to be taken first.

### 1. Create VM as normal.

* When creating the VM, choose the `other install media` VM template
* Continue through the pfSense installer like normal

### 2. Install Guest Utilities

Now that you have a pfSense VM running, we need to install guest utilities and tell them to run on boot. SSH (or other CLI method) to the pfSense VM and perform the following:

```
pkg install xe-guest-utilities
echo 'xenguest_enable="YES"' >> /etc/rc.conf.local
ln -s /usr/local/etc/rc.d/xenguest /usr/local/etc/rc.d/xenguest.sh
service xenguest start
```

Guest Tools are now installed and running, and will automatically run on every boot of the VM.

### 3. Disable TX Checksum Offload

Now is the most important step: we must disable tx checksum offload on the virtual xen interfaces of the VM. This is because network traffic between VMs in a hypervisor is not populated with a typical ethernet checksum, since they only traverse server memory and never leave over a physical cable. The majority of operating systems know to expect this when virtualized and handle ethernet frames with empty checksums without issue. However `pf` in FreeBSD does not handle them correctly and will drop them, leading to broken performance.

The solution is to simply turn off checksum-offload on the virtual xen interfaces for pfSense in the TX direction only (TX towards the VM itself). Then the packets will be checksummed like normal and `pf` will no longer complain.

:::tip
Disabling checksum offloading is only necessary for virtual interfaces. When using [PCI Passtrough](https://github.com/xcp-ng/xcp/wiki/PCI-Passtrough) to provide a VM with direct access to physical or virtual (using [SR-IOV](https://en.wikipedia.org/wiki/Single-root_input/output_virtualization)) devices it is unnecessary to disable tx checksum offloading on any interfaces on those devices.
:::

:::warning
Many guides on the internet for pfSense in Xen VMs will tell you to uncheck checksum options in the pfSense web UI, or to also disable RX offload on the Xen side. These are not only unnecessary, but some of them will make performance worse.
 :::

#### Using XenOrchestra

- Head to the "Network" tab of your VM : in the advanced settings, you can enable TX checksumming.
- Restart the VM.

That's it !

#### Using CLI

SSH to dom0 on your XCP-NG hypervisor and run the following:

First get the UUID of your pfSense VM:

```
xe vm-list
```
Find your pfsense VM in the list, and copy the UUID. Now stick the UUID in the following command:

```
xe vif-list vm-uuid=08fcfc01-bda4-21b5-2262-741da6f5bfb0
```

This will list all the virtual interfaces assigned to the VM:

```
uuid ( RO)            : 789358b4-54c8-87d3-bfb3-0b7721e4661b
         vm-uuid ( RO): 57a27650-6dab-268e-1200-83ee17ee3a55
          device ( RO): 1
    network-uuid ( RO): 5422a65f-4ff0-0f8c-e8c3-a1e926934eed


uuid ( RO)            : a9380705-8da2-4bf7-bbb0-f167d8f0d645
         vm-uuid ( RO): 57a27650-6dab-268e-1200-83ee17ee3a55
          device ( RO): 0
    network-uuid ( RO): 4f7e43ef-d28a-29bd-f933-68f5a8f36241
```

For each interface, you need to take the UUID (the one at the top labeled `uuid ( RO)`) and insert it in the `xe vif-param-set uuid=xxx other-config:ethtool-tx="off"` command. So for our two virtual interfaces the commands to run would look like this:

```
xe vif-param-set uuid=789358b4-54c8-87d3-bfb3-0b7721e4661b other-config:ethtool-tx="off"
xe vif-param-set uuid=a9380705-8da2-4bf7-bbb0-f167d8f0d645 other-config:ethtool-tx="off"
```

That's it! For this to take effect you need to fully shut down the VM then power it back on. Then you are good to go!

:::tip
If you ever add more virtual NICs to your pfSense VM, you will need to go back and do the same steps for these interfaces as well.
:::

## Test XCP-ng in a VM

This page details how to install XCP-ng under the differents market hypervisors, in order to test the solution before a bare-metal installation.

:::warning
This practice is not recommended for production, nested virtualization has only tests/labs purpose.
:::

Here is the list of hypervisors on which you can try XCP-ng :

* [XCP-ng](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29/#nested-xcp-ng-using-xcp-ng)
* [VMware ESXi & Workstation](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-vmware-esxi-and-workstation)
* [Hyper-V 2016](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-microsoft-hyper-v-windows-10---windows-server-2016)
* [QEMU/KVM](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-qemukvm)
* [Virtualbox](https://www.virtualbox.org) (Nested Virtualisation implemented only in v6.1.x and above - <https://www.virtualbox.org/ticket/4032>)

### Nested XCP-ng using XCP-ng

* create a new VM from CentOS 7 template with minimum 2 vCPU and 4GB RAM
* change disk size to 100GB
* enable nested virtualisation with the special command on CLI: `xe vm-param-set uuid=<UUID> platform:exp-nested-hvm=true`
* default NIC type of realtek may create stability issue for nested XCP-NG, change it to intel e1000 : `xe vm-param-set uuid=<UUID> platform:nic_type="e1000"`
* install/use it like normal :-)

### Nested XCP-ng using Xen

It's a pretty standard HVM, but you need to use a `vif` of `ioemu` type. Check this configuration example:

```
builder='hvm'
memory = 4096
name = 'xcp-ng'
vcpus=6
pae=1
acpi=1
apic=1
vif = [ 'mac=xx:xx:xx:xx:xx:xx,type=ioemu,bridge=virbr0' ]
disk = [ 'file:/foo/bar/xcp-ng.img,hdc,w', 'file:/foo/bar/xcp-ng/xcp-ng-8.1.0-2.iso,hdb:cdrom,r' ]
boot='dc'
vnc=1
serial='pty'
tsc_mode='default'
viridian=0
usb=1
usbdevice='tablet'
gfx_passthru=0
localtime=1
xen_platform_pci=1
pci_power_mgmt=1
stdvga = 0
serial = 'pty'
hap=1
nestedhvm=1
on_poweroff = 'destroy'
on_reboot   = 'destroy'
on_crash    = 'destroy'
```

### Nested XCP-ng using VMware (ESXi and Workstation)

_The following steps can be performed under VMware Workstation Pro, the settings will remain the same but the configuration will be slightly different. We will discuss this point at the end of this section about VMware._

#### Networking settings

The first step, and without a doubt the most important step, will be to modify the virtual network configuration of our ESXi host. Without this configuration, the network will not work for your virtual machines running on your nested XCP-ng.

   * Start by going to the network settings of your ESXi host.

     ![ESXi Networking Panel](https://image.noelshack.com/fichiers/2018/36/3/1536147884-1.png)

   * Then select the **port group** on which your XCP-ng virtual machine will be connected. By default, this concerns the
     vSwitch0 and the '**VM Network**' group port.

     Click on the "Edit Settings" button to edit the parameters of this port group.

     **Here is the default settings** :

     ![ESXi Port Group Settings](https://image.noelshack.com/fichiers/2018/36/3/1536148176-2.png)

   * Click on the **Accept** checkbox for Promiscuous mode.
   * Save this settings by using the Save button at the bottom of the window.

   A little explanation from the VMware documentation website : [Promiscuous mode under VMware ESXi](https://docs.vmware.com/en/VMware-vSphere/6.0/com.vmware.vsphere.security.doc/GUID-92F3AB1F-B4C5-4F25-A010-8820D7250350.html)

   **These settings can be done at the vSwitch itself (same configuration menu). By default, the group port inherits the vSwitch settings on which it is configured. It all depends on the network configuration you want to accomplish on your host.**


#### XCP-ng virtual machine settings

Once your host's network is set up, we'll look at configuring the XCP-ng virtual machine.

   * Create a virtual machine and move to the "Customize settings" section. Here a possible virtual machine configuration :

     ![XCP-ng VM settings](https://image.noelshack.com/fichiers/2018/36/3/1536149747-4.png)

   * Then edit the CPU settings and check the "**Expose hardware assisted virtualization to the guest OS**" box in the
     "**Hardware Virtualization**" line.

     ![CPU Advanced settings - XCP-ng VM](https://image.noelshack.com/fichiers/2018/36/3/1536150139-5.png)

     _Enable virtualized CPU performance counters can be checked if necessary_ : [VMware CPU Performance Counters ](https://kb.vmware.com/s/article/2030221)

   * For the other virtual machine settings, some explanations :
     * Dual CPU sockets for improving vCPU performance.
     * **The virtual disk must be at least 60 GB in size to install XCP-ng !**
     * **LSI Logic SAS** controller is choosen to maximize at possible the compatibility and the performance. vNVMe
       controller works too, it can reduce CPU overhead and latency. **PVSCSI controller won't work**.
     * **Unlike the PVSCSI controller, the VMXNET3 controller works with XCP-ng**. It will be useful if heavy network
       loads are planned between different XCP-ng virtual machines (XOSAN)

   * Finally, install XCP-ng as usual, everything should work as expected. After installation, your XCP-ng virtual machine
     is manageable from XCP-ng Center or Xen Orchestra.

     ![XCP-ng Center Final](https://image.noelshack.com/fichiers/2018/36/3/1536152208-6.png)

   * You can then create a virtual machine and test how it works (network especially).

#### Configuration under VMware Workstation Pro 14/15

   * Create a XCP-ng virtual machine like in ESXi.
   * Check the following CPU setting : **Virtualize Intel VT-x/EPT or AMD-V/RVI**

     ![Workstation Pro CPU Settings](https://image.noelshack.com/fichiers/2018/36/3/1536153480-8-1.png)

   * An additional option is to be added to the virtual machine's .vmx file. You will also add the option to enable
     promiscuous mode for the virtual machine.

     **hypervisor.cpuid.v0 = "FALSE"** : Addition to the checked CPU option on Workstation
     **ethernet0.noPromisc = "FALSE"** : Enable Promiscuous Mode

     _**Be careful, 'ethernet0' is the name of the bridged network interface of my virtual machine, remember to check that it's the same name in your .vmx file (search the 'ethernet' string using your favorite text editor).**_


   * If you want to use the VMXNET3 card, this is possible. For this you must also modify the .vmx file of your XCP-ng virtual machine.

     Replace _**ethernet0.virtualDev = "e1000"**_ by _**ethernet0.virtualDev = "vmxnet3"**_

   * Check if the virtual machine correctly works by trying to connect using XCP-ng Center and by creating a virtual machine on your nested XCP-ng.


### Nested XCP-ng using Microsoft Hyper-V (Windows 10 - Windows Server 2016)


_The following steps can be performed with Hyper-V on Windows 10 (version 1607 minimum) and Windows Server 2016 (Hyper-V Server also). The settings will remain the same for both OS._

**This feature is not available with Windows 8 and Windows Server 2012/2012 R2 AND an Intel CPU is required (AMD not supported yet).**

Unlike VMware, you must first create the virtual machine to configure nested virtualization. Indeed, under Hyper-V, the configuration of the nested virtualization is a parameter to be applied to the virtual machine, it is not a global configuration of the hypervisor.

#### XCP-ng virtual machine settings

The configuration of the virtual machine uses legacy components. Indeed XenServer / XCP-ng does not have the necessary drivers to work on a "modern" Hyper-V virtual hardware . **The consequences are that the performance of this XCP-ng virtual machine will be poor.**

The VM settings :
* **VM Generation** : 1 (even if the latest versions of CentOS work in Gen 2)
* **Memory** : 4GB minimum
* **Disk Controller** : IDE
* **Dynamic Memory** : Disabled (even if activated, the hypervisor will disable it in case of nested virtualization)
* **Network Controller** : Legacy Network Card

#### CPU and Network settings

* Once the virtual machine is created, it is possible to enable nested virtualization for this virtual machine. Open a PowerShell Administrator prompt :

   `Set-VMProcessor -VMName <Your XCP-ng VM name> -ExposeVirtualizationExtensions $true`

* Then, it will be about configuring the network to allow guest virtual machines to access to the outside network.

    `Get-VMNetworkAdapter -VMName <Your XCP-ng VM name> | Set-VMNetworkAdapter -MacAddressSpoofing On`

    **Important : This settings has to be applied even if you use the NAT Default Switch (since Windows 10 1709)**

* After these configurations, you should be able to manage this XCP-ng host from XCP-ng Center or from a Xen Orchestra instance.

![Windows Server on XCP-ng under Hyper-V](http://image.noelshack.com/fichiers/2018/39/5/1538145459-2.png)

### Nested XCP-ng using QEMU/KVM

_The following steps can be performed using QEMU/KVM on a Linux host, Proxmox or oVirt._

Like VMware, you must first enable the nested virtualization feature on your host before creating your XCP-ng virtual machine.

#### Configure KVM nested virtualization (Intel)

* Check if your CPU support virtualization and EPT (Intel)

   On most Linux distributions :

    `egrep -wo 'vmx|ept' /proc/cpuinfo `

   EPT is required to run nested XS/XCP-ng : <https://xcp-ng.org/forum/topic/550/shadow-paging-disable>

* If everything is OK, you can check if the nested virtualization is already activated.

     `$ cat /sys/module/kvm_intel/parameters/nested`

  If the command returns "Y", nested virtualization is activated, if not, you should activate it (next steps).

* Firstly, check if you don't have any virtual machine running. Then, unload the KVM module using root user or sudo :

    `# modprobe -r kvm_intel`

* Activate nested virtualization feature :

    `# modprobe kvm_intel nested=1`

* Nested virtualization is enabled until the host is rebooted. To enable it permanently, add the following line to the `/etc/modprobe.d/kvm.conf` file:

    `options kvm_intel nested=1`

#### Configure KVM nested virtualization (AMD)

On recent kernels, when enabling AMD virtualization in the BIOS, it should enable nested virtualization without any further configuration. Verify that `cat /sys/module/kvm_amd/parameters/nested` returns `1`.

#### XCP-ng virtual machine settings

The configuration of the virtual machine will use mostly emulated components for disks and network. VirtIO drivers are not include in the XS/XCP-ng kernel.

The VM settings :

* **CPU configuration** : host-model or host-passthrough (mandatory, prefer host-passthrough)
* **Boot loader**: use BIOS rather than UEFI. The installation may complete successfully but it may not boot up.
* **Memory** : 4GB minimum / 8GB recommended
* **Disk Controller** : LSI Logic SCSI
* **Disk**: at least 50GiB
* **Network** : E1000

Finally, install/use XCP-ng !

![XOA on KVM](http://image.noelshack.com/fichiers/2018/44/7/1541350058-xoa.png)

## VLAN Trunking in a VM

This document will describe how to configure a vlan trunk port for use in a vm running on xcp-ng.  The typical use case for this is you want to run your network's router as a vm and your network has multiple vlans.

With some help from others in the [forums](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm/11), I was able to get a satisfactory solution implemented using [pfSense](https://pfsense.org) and so this document will discuss how to implement this solution using pfSense as your router.  In theory, the same solution should apply to other router solutions, but it is untested.  Feel free to update this document with your results.

### Two Approaches

There are two approaches to vlans in xcp-ng.  The first is to create a vif for each vlan you want your router to route traffic for then attach the vif to your vm.  The second is to pass through a trunk port from dom0 onto your router vm.

#### Multiple VIFs

By far, this is the easiest solution and perhaps the "officially supported" approach for xcp-ng.  When you do this, dom0 handles all the vlan tagging for you and each vif is just presented to your router vm as a separate virtual network interface.  It's like you have a bunch of separate network cards installed on your router where each represents a different vlan and is essentially attached to a vlan access (untagged) port on your switch.  There is nothing special for you to do, this _just works_.  If you require 7 vifs or less for your router then this might be the easiest approach.

The problem with this approach is when you have many vlans you want to configure on your router.  If you read through the thread I linked to at the top of this page you'll notice the discussion about where I was unable to attach more than 7 vifs to my pfSense vm.  XO nor XCP-ng Center allow you to attach more than seven.  This appears to be some kind of limit somewhere in Xen.  Other users have been able to attach more than 7 vifs via cli, however when I tried to do this myself my pfSense vm became unresponsive once I added the 8th vif.  More details on that problem are discussed in the thread.

Another problem with this approach, perhaps only specific to pfSense, is that when you attach many vifs, you must disable tx offloading on each and every vif otherwise you'll have all kinds of problems.  This was definitely a red flag for me.  Initially I'm starting with 7 vlans and 9 networks total with short term requirements for at least another 3 vlans for sure and then who knows how many down the road.  In this approach, every time you have to create a new vlan by adding a vif to the vm, you will have to reboot the vm.

Having to reboot my network's router every time I need to create a new vlan is not ideal for the environment I'm working in; especially because in the current production environment running VMWare, we do not need to reboot the router vm to create new vlans.  (fwiw, I've come to xcp-ng as the IT department has asked me to investigate possibly replacing our VMWare env with XCP-ng.  I started my adventures with xcp-ng by diving in head first at home and replacing my home environment, previously ESXi, with xcp-ng.  Now I'm in the early phases of working with xcp-ng in the test lab at work.)

In conclusion, if you have seven or fewer vifs and you're fairly confident that you'll never need to exceed seven vifs then this approach is probably the path of least resistance.  On the other hand, if you know you'll need more than seven or fairly certain you will some day.  Or you're in an environment where you need to be able to create vlans on the fly then you'll probably want to proceed with the alternative below.

This document is about the alternative approach, but a quick summary of how this solution works in xcp-ng:
* Make sure the pif connected to your xcp-ng server is carrying all the required tagged vlans
* Within XO or XCP Center, create multiple networks off of the pif, adding the vlan tag as needed for each vlan
* For each vlan you want your router to route for, add a vif for that specific vlan to the vm
* For pfSense, disable tx offloading for each vif added and reboot the vm.  This [page](https://github.com/xcp-ng/xcp/wiki/pfSense-in-a-VM) will fully explain all of the config changes required when running pfSense in xcp-ng.

### Adding VLAN Trunk to VM

The alternative approach involves attaching the vlan trunk port directly to your router VM, and handling the VLANs in pfSense directly. This has the biggest advantage of not requiring a vm reboot each time you need to setup a new vlan. However note you will need to manually edit a configuration file in pfSense every time it is upgraded. The physical interface you are using to trunk VLANs into the pfSense VM should also not be the same physical interface that your xcp-ng management interface is on. This is because one of the steps required is setting the physical interface MTU to 1504, and this will potentially cause MTU mismatches if xen is using this same physical interface for management traffic (1504-byte sized packets being sent from the xen management interface to your MTU 1500 network).

The problem we face with this solution is that, at least in pfSense, the xn driver used for the paravirtualization in FreeBSD does not support 802.1q tagging.  So we have to account for this ourselves both in dom0 and in the pfSense vm.  Once you're aware of this limitation, it actually isn't a big deal to get it all working but it just never occurred to me that a presumably relatively modern network driver would not support 802.1q.

Anyway, the first step is to modify the MTU setting of the **pif** that is carrying your tagged vlans into the xcp-ng server from 1500 to 1504.  The extra 4 bytes is, of course, the size of the vlan tagging within each frame.  **Warning:** You're going to have to detach or shutdown any vms that are currently using this interface.  For this example, let's say it's `eth1` that is the pif carrying all our tagged traffic.


1. List all your networks
```
xe network-list
```
2. Set MTU on the relevant network(s)
```
xe network-param-set uuid=xxx MTU=1504
```
3. Reboot your XCP-ng host to apply the MTU change on the physical network cards


Once this is done, attach a new vif to your pfSense vm and select `eth1` as the network.  This will attach the vlan trunk to pfSense.  Boot up pfSense and disable tx offloading, etc. on the vif, reboot as necessary then login to pfSense.

Configure the interface within pfSense by also increasing the MTU value to 1504.  Again, the xn driver does not support vlan tagging, so we have to deal with it ourselves.  **NOTE:** You only increase the MTU on the **parent interface** only in both xcp-ng **and** pfSense.  The MTU for vlans will always be 1500.

Finally, along the same lines, since the xn driver does not support 802.1q, pfSense will not allow you to create vlans on any interface using the xn driver.  We have to modify pfSense to allow us to do this.

From a shell in pfSense, edit `/etc/inc/interfaces.inc` and modify the `is_jumbo_capable` function at around line 6761.  Edit it so it reads like so:

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
This modification is based on pfSense 2.4.4p1, ymmv.  However, I copied this mod from [here](https://eliasmoraispereira.wordpress.com/2016/10/05/pfsense-virtualizacao-com-xenserver-criando-vlans/), which was based on pfSense 2.3.x, so this code doesn't change often.
:::

Keep in mind that you will need to reapply this mod anytime you upgrade pfSense.

That's it, you're good to go!  Go to your interfaces > assignments in pfSense, select the VLANs tab and create your vlans.  Everything should work as expected.

### Links/References

* [Forums: My initial question and discussion about vlan trunk support](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm)
* [pfSense interface does not support VLANs](https://forum.netgate.com/topic/112359/xenserver-vlan-doesn-t-supporting-eth-device-for-vlan)
* [pfSense: Adding VLAN support for Xen xn interfaces](https://eliasmoraispereira.wordpress.com/2016/10/05/pfsense-virtualizacao-com-xenserver-criando-vlans/)

## TLS certificate for XCP-ng

After installing XCP-ng, access to xapi via XCP-ng center or XenOrchestra is protected by TLS with a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate) : this means that you have to either verify the certificate signature before allowing the connection (comparing against signature shown on the console of the server), either work on trust-on-first-use basis (i.e. assume that the first time you connect to the server, nobody is tampering with the connection).

If you would like to replace this certificate by a valid one, either from an internal Certificate Authority or from a public one, you'll find here some indications on how to do that.

Note that if you use an non-public certificate authority and XenOrchestra, you have [additional configuration to specify on XenOrchestra side](https://xen-orchestra.com/docs/configuration.html#custom-certificate-authority)

:::warning
This indication is valid for XCP-ng up to v8.1. Version 8.2 is expected to improve deployment of new certificates, like [Citrix did for XenServer 8.2](https://docs.citrix.com/en-us/citrix-hypervisor/hosts-pools.html#install-a-tls-certificate-on-your-server).
:::

### Generate certificate signing request

You can use the auto-generated key to create a certificate signing request :

```
openssl req -new -key /etc/xensource/xapi-ssl.pem -subj '/CN=XCP-ng hypervisor/' -out xcp-ng.csr
```

### Install the certificate chain

The certificate, intermediate certificates (if needed), certificate authority and private key are stored in `/etc/xensource/xapi-ssl.pem`, in that order. You have to replace all lines before `-----BEGIN RSA PRIVATE KEY-----̀` with the certificate and the chain you got from your provider, using your favorite editor (`nano` is present on XCP-ng by default).

Then, you have to restart xapi :
```
systemctl restart xapi
```
