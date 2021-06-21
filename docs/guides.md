# Guides

This section is grouping various guides regarding XCP-ng use cases.

## pfSense / OPNsense VM

pfSense and OPNsense do work great in a VM, but there are a few extra steps that need to be taken first.

### 1. Create VM as normal.

* When creating the VM, choose the `other install media` VM template
* Continue through the installer like normal

### 2. Install Guest Utilities

There are 2 ways of doing that, either using the CLI (pfSense or OPNsense) or the Web UI (pfSense).

Option 1 via console/ssh:  
Now that you have the VM running, we need to install guest utilities and tell them to run on boot. SSH (or other CLI method) to the VM and perform the following:

```
pkg install xe-guest-utilities
echo 'xenguest_enable="YES"' >> /etc/rc.conf.local
ln -s /usr/local/etc/rc.d/xenguest /usr/local/etc/rc.d/xenguest.sh
service xenguest start
```

Option 2 is via webgui (only for pfSense):
Open management page under http(s)://your-configured-ip and go to:  
*System -> Firmware -> Plugins*  
Scroll down to **os-xen** and let the gui do the steps needed. Next: Reboot the system to have the guest started (installer doesn't do that):  
*Power -> Reboot*

Guest Tools are now installed and running, and will automatically run on every boot of the VM.

### 3. Disable TX Checksum Offload

Now is the most important step: we must disable tx checksum offload on the virtual xen interfaces of the VM. This is because network traffic between VMs in a hypervisor is not populated with a typical ethernet checksum, since they only traverse server memory and never leave over a physical cable. The majority of operating systems know to expect this when virtualized and handle ethernet frames with empty checksums without issue. However `pf` in FreeBSD does not handle them correctly and will drop them, leading to broken performance.

The solution is to simply turn off checksum-offload on the virtual xen interfaces for pfSense in the TX direction only (TX towards the VM itself). Then the packets will be checksummed like normal and `pf` will no longer complain.

:::tip
Disabling checksum offloading is only necessary for virtual interfaces. When using [PCI Passthrough](https://github.com/xcp-ng/xcp/wiki/PCI-Passtrough) to provide a VM with direct access to physical or virtual (using [SR-IOV](https://en.wikipedia.org/wiki/Single-root_input/output_virtualization)) devices it is unnecessary to disable tx checksum offloading on any interfaces on those devices.
:::

:::warning
Many guides on the internet for pfSense in Xen VMs will tell you to uncheck checksum options in the pfSense web UI, or to also disable RX offload on the Xen side. These are not only unnecessary, but some of them will make performance worse.
 :::

#### Using Xen Orchestra

- Head to the "Network" tab of your VM : in the advanced settings (click the blue gear icon) for each adapter, disable TX checksumming.
- Restart the VM.

That's it !

#### Using CLI

SSH to dom0 on your XCP-NG hypervisor and run the following:

First get the UUID of the VM to modify:

```
xe vm-list
```
Find your pfSense / OPNsense VM in the list, and copy the UUID. Now stick the UUID in the following command:

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
If you ever add more virtual NICs to your VM, you will need to go back and do the same steps for these interfaces as well.
:::

## XCP-ng in a VM

This page details how to install XCP-ng as a guest VM inside different hypervisors to test the solution before a bare-metal installation.

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

This document will describe how to configure a VLAN trunk port for use in a VM running on xcp-ng.  The typical use case for this is you want to run your network's router as a VM and your network has multiple vlans.

With some help from others in the [forums](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm/11), I was able to get a satisfactory solution implemented using [pfSense](https://pfsense.org) and so this document will discuss how to implement this solution using pfSense as your router.  In theory, the same solution should apply to other router solutions, but it is untested.  Feel free to update this document with your results.

### Two Approaches

There are two approaches to vlans in xcp-ng.  The first is to create a vif for each VLAN you want your router to route traffic for then attach the vif to your VM.  The second is to pass through a trunk port from dom0 onto your router VM.

#### Multiple VIFs

By far, this is the easiest solution and perhaps the "officially supported" approach for xcp-ng.  When you do this, dom0 handles all the VLAN tagging for you and each vif is just presented to your router VM as a separate virtual network interface.  It's like you have a bunch of separate network cards installed on your router where each represents a different VLAN and is essentially attached to a VLAN access (untagged) port on your switch.  There is nothing special for you to do, this _just works_.  If you require 7 vifs or less for your router then this might be the easiest approach.

The problem with this approach is when you have many vlans you want to configure on your router.  If you read through the thread I linked to at the top of this page you'll notice the discussion about where I was unable to attach more than 7 vifs to my pfSense VM.  XO nor XCP-ng Center allow you to attach more than seven.  This appears to be some kind of limit somewhere in Xen.  Other users have been able to attach more than 7 vifs via CLI, however when I tried to do this myself my pfSense VM became unresponsive once I added the 8th vif.  More details on that problem are discussed in the thread.

Another problem with this approach, perhaps only specific to pfSense, is that when you attach many vifs, you must disable tx offloading on each and every vif otherwise you'll have all kinds of problems.  This was definitely a red flag for me.  Initially I'm starting with 7 vlans and 9 networks total with short term requirements for at least another 3 vlans for sure and then who knows how many down the road.  In this approach, every time you have to create a new VLAN by adding a vif to the VM, you will have to reboot the VM.

Having to reboot my network's router every time I need to create a new VLAN is not ideal for the environment I'm working in; especially because in the current production environment running VMware, we do not need to reboot the router VM to create new vlans.  (FWIW, I've come to xcp-ng as the IT department has asked me to investigate possibly replacing our VMware env with XCP-ng.  I started my adventures with xcp-ng by diving in head first at home and replacing my home environment, previously ESXi, with xcp-ng.  Now I'm in the early phases of working with xcp-ng in the test lab at work.)

In conclusion, if you have seven or fewer vifs and you're fairly confident that you'll never need to exceed seven vifs then this approach is probably the path of least resistance.  On the other hand, if you know you'll need more than seven or fairly certain you will some day.  Or you're in an environment where you need to be able to create vlans on the fly then you'll probably want to proceed with the alternative below.

This document is about the alternative approach, but a quick summary of how this solution works in xcp-ng:
* Make sure the pif connected to your xcp-ng server is carrying all the required tagged vlans
* Within XO or XCP Center, create multiple networks off of the pif, adding the VLAN tag as needed for each VLAN
* For each VLAN you want your router to route for, add a vif for that specific VLAN to the VM
* For pfSense, disable tx offloading for each vif added and reboot the VM.  This [page](https://github.com/xcp-ng/xcp/wiki/pfSense-in-a-VM) will fully explain all of the config changes required when running pfSense in xcp-ng.

### Adding VLAN Trunk to VM

The alternative approach involves attaching the VLAN trunk port directly to your router VM, and handling the VLANs in pfSense directly. This has the biggest advantage of not requiring a VM reboot each time you need to setup a new VLAN. However note you will need to manually edit a configuration file in pfSense every time it is upgraded. The physical interface you are using to trunk VLANs into the pfSense VM should also not be the same physical interface that your xcp-ng management interface is on. This is because one of the steps required is setting the physical interface MTU to 1504, and this will potentially cause MTU mismatches if xen is using this same physical interface for management traffic (1504-byte sized packets being sent from the xen management interface to your MTU 1500 network).

The problem we face with this solution is that, at least in pfSense, the xn driver used for the paravirtualization in FreeBSD does not support 802.1q tagging.  So we have to account for this ourselves both in dom0 and in the pfSense VM.  Once you're aware of this limitation, it actually isn't a big deal to get it all working but it just never occurred to me that a presumably relatively modern network driver would not support 802.1q.

Anyway, the first step is to modify the MTU setting of the **pif** that is carrying your tagged vlans into the xcp-ng server from 1500 to 1504.  The extra 4 bytes is, of course, the size of the VLAN tagging within each frame.  **Warning:** You're going to have to detach or shutdown any VMs that are currently using this interface.  For this example, let's say it's `eth1` that is the pif carrying all our tagged traffic.


1. List all your networks
```
xe network-list
```
2. Set MTU on the relevant network(s)
```
xe network-param-set uuid=xxx MTU=1504
```
3. Reboot your XCP-ng host to apply the MTU change on the physical network cards


Once this is done, attach a new vif to your pfSense VM and select `eth1` as the network.  This will attach the VLAN trunk to pfSense.  Boot up pfSense and disable tx offloading, etc. on the vif, reboot as necessary then login to pfSense.

Configure the interface within pfSense by also increasing the MTU value to 1504.  Again, the xn driver does not support VLAN tagging, so we have to deal with it ourselves.  **NOTE:** You only increase the MTU on the **parent interface** only in both xcp-ng **and** pfSense.  The MTU for vlans will always be 1500.

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

* [Forums: My initial question and discussion about VLAN trunk support](https://xcp-ng.org/forum/topic/729/how-to-connect-vlan-trunk-to-vm)
* [pfSense interface does not support VLANs](https://forum.netgate.com/topic/112359/xenserver-vlan-doesn-t-supporting-eth-device-for-vlan)
* [pfSense: Adding VLAN support for Xen xn interfaces](https://eliasmoraispereira.wordpress.com/2016/10/05/pfsense-virtualizacao-com-xenserver-criando-vlans/)

## TLS certificate for XCP-ng

After installing XCP-ng, access to xapi via XCP-ng Center or XenOrchestra is protected by TLS with a [self-signed certificate](https://en.wikipedia.org/wiki/Self-signed_certificate) : this means that you have to either verify the certificate signature before allowing the connection (comparing against signature shown on the console of the server), either work on trust-on-first-use basis (i.e. assume that the first time you connect to the server, nobody is tampering with the connection).

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

## Dom0 memory

:::tip
Dom0 is another word to talk about the *privileged domain*, also known as the *Control Domain*.
:::

Issues can arise when the control domain is lacking memory, that's why we advise to be generous with it whenever possible. Default values from the installer may be too low for your setup. In general it depends on the amount of VM's and their workload. If constraints do not allow you to follow the advice below, you can try to set lower values.

In any case:
* monitor RAM usage in the control domain
* if issues arise (failed live migration for example), [[look at the logs](troubleshooting.md#log-files) for messages related to lack of memory

### Recommended values

* we advise to give at least 2GiB of RAM for Dom0. Below that your XCP-ng may experience performance issues or other weird errors.
* up to 64GiB RAM on your machine, at least 4GiB RAM for Dom0
* an host with 128GiB or more should use 8GiB RAM for Dom0

:::warning
Note: If you use ZFS, assign at least 16GB RAM to avoid swapping. ZFS (in standard configuration) uses half the Dom0 RAM as cache!
:::

### Current RAM usage

You can use `htop` to see how much RAM is currently used in the dom0. Alternatively, you can have Netdata to show you past values.

### Change dom0 memory

Example with 4 GiB:

`/opt/xensource/libexec/xen-cmdline --set-xen dom0_mem=4096M,max:4096M`

Do not mess the units and make sure to set the same value as base value and as max value.

Reboot to apply.

## Autostart VM on boot

A VM can be started at XCP-ng boot itself, it's called **Auto power on**. We have two ways to configure it: using Xen Orchestra or via the CLI.

### With Xen Orchestra

In Xen Orchestra we can just enable a toggle in VM "Advanced" view, called **Auto power on**. Everything will be set accordingly.

![](../assets/img/autopoweron1.png)


### With the CLI

1. Determine the UUID of the pool for which we want to enable Auto Start. To do this, run the console command on the server:

```
# xe pool-list
uuid ( RO) : <VM_UUID>
```

2. Allow autostart of virtual machines at the pool level with the found UUID command:
`# xe pool-param-set uuid=<VM_UUID> other-config:auto_poweron=true`

Now we enable autostart at the virtual machine level.
3. Execute the command to get the UUID of the virtual machine:

```
# xe vm-list
    uuid ( RO)           : <VM_UUID>
    name-label ( RW)     : VM
    power-state ( RO)    : running
```

4. Enable autostart for each virtual machine with the UUID found: 
`# xe vm-param-set uuid=<VM_UUID> other-config:auto_poweron=true`

5. Checking the output 
`# xe vm-param-list uuid=<VM_UUID> | grep other-config`


## Software RAID Storage Repository

XCP-ng has support for creating a software RAID for the operating system but it is limited to RAID level 1 (mirrored drives) and by the size of the drives used.  It is strictly intended for hardware redundancy and doesn't provide any additional storage beyond what a single drive provides.

These instructions describe how to add more storage to XCP-ng using software RAID and show measures that need to be taken to avoid problems that may happen when booting.

These instructions assume you are starting with a server already installed with software RAID and have no other storage repositories defined except what may be on the existing RAID.

### Example System

The example system we're demonstrating here is a small server using 5 identical 1TB hard drives.  XCP-ng has already been installed in a software RAID configuration using 2 of the 5 drives.  There is already a default "Local storage" repository configured as part of the XCP-ng setup on the existing RAID 1 drive pair.

Before starting the installation, all partitions were removed from the drives and the drives were overwritten with zeroes.

So before starting out, here is an overview of the already configured system:

```
[09:51 XCP-ng ~]# cat /proc/partitions
major minor  #blocks  name

   8        0  976762584 sda
   8       16  976762584 sdb
   8       32  976762584 sdc
   8       64  976762584 sde
   8       48  976762584 sdd
   9      127  976762432 md127
 259        0   18874368 md127p1
 259        1   18874368 md127p2
 259        2  933245487 md127p3
 259        3     524288 md127p4
 259        4    4194304 md127p5
 259        5    1048576 md127p6
 252        0  933232640 dm-0

[09:51 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1]
md127 : active raid1 sdb[1] sda[0]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

unused devices: <none>
```

The 5 drives are in place as sda through sde and as can be seen from the list are exactly the same size.  The RAID 1 drive pair is set up as the XCP-ng default of a partitioned RAID 1 array md127 using drives sda and sdb and is in a healthy state.

### Building the Second RAID

We have 3 remaining identical drives, sdc, sdd, and sde and we're going to create a RAID 5 array using them in order to maximize the amount of space.  We'll create this using the mdadm command like this:

```
[10:02 XCP-ng ~]# mdadm --create /dev/md0 --run --level=5 --bitmap=internal --assume-clean --raid-devices=3 --metadata=1.2 /dev/sdc /dev/sdd /dev/sde
mdadm: array /dev/md0 started.
```

Here, we've made sure to use the assume-clean and metadata=1.2 options.  The assume-clean option prevents the RAID assembly process from initializing the content of the parity blocks on the drives which saves a lot of time when assembling the RAID for the first time.

The metadata=1.2 option forces the RAID array metadata to a position close to the beginning of each drive in the array.  This is most important for RAID 1 arrays but useful for others and prevents the component drives of the RAID array from being confused for separate individual drives by any process that tries to examine the drives for automatic mounting or other use.

Checking the status of the drives in the system should show the newly added RAID array.

```
[10:20 XCP-ng ~]# cat /proc/partitions
major minor  #blocks  name

   8        0  976762584 sda
   8       16  976762584 sdb
   8       32  976762584 sdc
   8       64  976762584 sde
   8       48  976762584 sdd
   9      127  976762432 md127
 259        0   18874368 md127p1
 259        1   18874368 md127p2
 259        2  933245487 md127p3
 259        3     524288 md127p4
 259        4    4194304 md127p5
 259        5    1048576 md127p6
 252        0  933232640 dm-0
   9        0 1953260544 md0
[10:39 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1] [raid6] [raid5] [raid4]
md0 : active raid5 sde[2] sdd[1] sdc[0]
      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
      bitmap: 0/8 pages [0KB], 65536KB chunk

md127 : active raid1 sdb[1] sda[0]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

unused devices: <none>
```

Here we can see that the new RAID 5 array is in place as array md0, is using drives sdc, sdd, and sde and is healthy.  As expected for a 3 drive RAID 5 array, it is providing about twice as much available space as a single drive.

### Building the Storage Repository

Now we create a new storage repository on the new RAID array like this:

```
[11:21 XCP-ng ~]# xe sr-create name-label="RAID storage" type=ext device-config:device=/dev/md0 shared=false content-type=user
2acc2807-1c44-a757-0b79-3834dbcf1a79
```

What we have now is a second storage repository named "RAID storage" using thin-provisioned EXT filesystem storage.  It will show up and can be used within Xen Orchestra or XCP-ng Center and should behave like any other storage repository.

At this point, we'd expect that the system could just be used as is, virtual machines stored in the new RAID storage repository and that we can normally shut down and restart the system and expect things to work smoothly.

Unfortunately, we'd be wrong.

### Unstable RAID Arrays When Booting

What really happens when XCP-ng boots with a software RAID is that code in the Linux kernel and in the initrd file will attempt to find and automatically assemble any RAID arrays in the system.  When there is just the single md127 RAID 1 array, the process works pretty well.  Unfortunately, the system seems to break down where there are more drives, more arrays, and more complex arrays.

This causes several problems in the system, mainly due to the system not correctly finding and adding all component drives to each array or not starting arrays which do not have all components added but could otherwise start successfully.

A good example here would be the md0 RAID 5 array we just created.  Rebooting the system in the state it is in now will often or even usually work without problems.  The system will find both drives of the md127 RAID 1 boot array and all three drives of the md0 RAID 5 storage array, assemble the arrays and start them running.

Sometimes what happens is that the system either does not find all of the parts of the RAID or does not assemble them correctly or does not start the array.  When that happens the md0 storage array will not start and looking at the /proc/mdstat array status will show the array as missing one or two of the three drives or will show all three drives but not show them as running.  Another common problem is that the array is assembled with enough drives to run, two out of three drives in our case, but does not start.  This can also happen if the array has a failed drive at boot even if there are enough remaining drives to start and run the array.

This can also happen to the md127 boot array where it will show with only one of the two drives in place and running.  If it does not start and run at all, we will fail to get a normal boot of the system and likely be tossed into an emergency shell instead of the normal boot process.  This is usually not consistent and another reboot will start the system.  This can even happen when the boot RAID is the only RAID array in the system but fortunately that rarely happens.

So what can we do about this?  Fortunately, we can give the system more information about what RAID arrays are in the system and specify that they should be started up at boot.

### Stabilizing the RAID Boot Configuation: The mdadm.conf File

The first thing we need to do is give the system more information on what RAID arrays exist and how they're put together.  The way to do this is by creating a raid configuration file /etc/mdadm.conf.

The mdadm.conf file created for this system is here:

```
[13:02 XCP-ng ~]# cat /etc/mdadm.conf
AUTO +all
MAILADDR root
DEVICE /dev/sda /dev/sdb /dev/sdc /dev/sdd /dev/sde
ARRAY /dev/md0  metadata=1.2 UUID=53461f34:2414371e:820f9514:008b6458
ARRAY /dev/md127  metadata=1.0 UUID=09871a29:26fa7ce1:0c9b040a:60f5cabf
```

Each system and array will have different UUID identifiers so the numbers we have here are specific to this exmple.  The UUID identifiers here will not work for another system.  For each system, we'll need a way to get them to include in the mdadm.conf file.  The best way is using the mdadm command itself while the arrays are running like this: 

```
[13:06 XCP-ng ~]# mdadm --examine --scan
ARRAY /dev/md/0  metadata=1.2 UUID=53461f34:2414371e:820f9514:008b6458 name=XCP-ng:0
ARRAY /dev/md/127  metadata=1.0 UUID=09871a29:26fa7ce1:0c9b040a:60f5cabf name=localhost:127
```

Notice that this is output in almost exactly the same format as shown in the mdadm.conf file above.  The UUID numbers are important and we'll need them again later.

If we don't want to type in the entire file, we can create the file like this.

```
echo 'AUTO +all' > /etc/mdadm.conf
echo 'MAILADDR root' >> /etc/mdadm.conf
echo 'DEVICE /dev/sda /dev/sdb /dev/sdc /dev/sdd /dev/sde' >> /etc/mdadm.conf
mdadm --examine --scan >> /etc/mdadm.conf
```
And then edit the file to change the format of the array names from /dev/md/0 to /dev/md0 and remove the name= parameters from each line.  This isn't strictly necessary but keeps the array names in the file consistent with what is reported in /proc/mdstat and /proc/partitions and avoids giving each array another name (in our case those names would be localhost:127 and XCP-ng:0).

So what do these lines do?  The first line instructs the system to allow or attempt automatic assembly for all arrays defined in the file.  The second specifies to report errors in the system by email to the root user.  The third is a list of all drives in the system participating in RAID arrays.  Not all drives need to be specified on a single DEVICE line.  Drives can be split among multiple lines and we could even have one DEVICE line for each drive.  The last two are descriptions of each array in the system.

This file gives the system a description of what arrays are configured in the system and what drives are used to create them but doesn't specify what to do with them.  The system should be able to use this information at boot for automatic assembly of the arrays.  Booting with the mdadm.conf file in place is more reliable but still runs into same problems as before.

### Stabilizing the RAID Boot Configuation: The initrd Configuration

The other thing we need to do is give the system some idea of what to do with the RAID arrays at boot time.  The way to do this is by adding instructions for the dracut program creating the initrd file to enable all RAID support, use the mdadm.conf file we created, and to start the arrays at boot time.

We can specify additional command line parameters to the dracut command which creates the initrd file to ensure that kernel RAID modules are loaded, the mdadm.conf file is used and so on but there are a lot of them.  A better way to do it is to create a list of parameters that will be used automatically by dracut every time it is run to create a new initrd file.

The place to create the file is in the folder /etc/dracut.conf.d.  Any file with commands in that folder will be read and used by dracut when creating a new initrd file.  We create a file dracut_mdraid.conf in that folder that looks like this:

```
[14:11 XCP-ng ~]# cat /etc/dracut.conf.d/dracut_mdraid.conf
mdadmconf="yes"
use_fstab="yes"
add_dracutmodules+=" mdraid "
add_drivers+=" md_mod raid0 raid1 raid456 raid10 "
add_device+=" /dev/md0 "
add_device+=" /dev/md127 "
kernel_cmdline+=" rd.auto=1 "
kernel_cmdline+=" rd.md=1 "
kernel_cmdline+=" rd.md.conf=1 "
kernel_cmdline+=" rd.md.uuid=53461f34:2414371e:820f9514:008b6458 "
kernel_cmdline+=" rd.md.uuid=09871a29:26fa7ce1:0c9b040a:60f5cabf "
```

This file contains two sets of instructions for dracut, some that affect how the initrd file is built and what is done at boot and the rest which are passed to the Linux kernel at boot.  

The first set instructs dracut to consider the mdadm.conf file we created earlier and also to include a copy of it in the initrd file, add dracut support for mdraid, include the kernel modules for mdraid support, and specificlly support the two RAID devices by name.

The second set instucts the booting Linux kernel to support automaic RAID assembly, support mdraid and the mdraid configuration and also to search for and start the two RAID arrays via their UUID identifiers.  These are the same UUID identifiers that we included in the mdadm.conf file and, like the UUID identifiers there, are specific to each array and system. 

Something to note when creating the file is to allow extra space between command line parameters.  That is why most of the lines have extra space before and after parameters within the quotes.

### Building and Testing the New intrd File

Now that we have all of this extra configuration, we need to get the system to include it for use at boot.  To do that we use the dracut command to create a new initrd file like this:

```
dracut --force -M /boot/initrd-$(uname -r).img $(uname -r)
```

This creates a new initrd file with the correct name matching the name of the Linux kernel and prints a list of modules included in the initrd file.  Printing the list isn't necessary but is handy to see that dracut is making progress as it runs.

When the system returns to the command line, it's time to test.  We'll reboot the system from the console or from within Xen Orchestra or XCP-ng Center.  If all goes well, the system should boot normally and correctly find and mount all 5 drives into the two RAID arrays.  The easiest way to tell that is looking at the /proc/mdstat file.

```
[14:36 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1] [raid6] [raid5] [raid4]
md127 : active raid1 sda[0] sdb[1]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

md0 : active raid5 sdc[0] sde[2] sdd[1]
      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
      bitmap: 3/8 pages [12KB], 65536KB chunk

unused devices: <none>
```

We can see that both arrays are active and healthy with all drives accounted for.  Examining the storage repositories using Xen Orchestra, XCP-ng, or xe commands shows that both the Local storage and RAID storage repositories are available.

### Troubleshooting

The most common problems in this process stem from one of a few things.

One common cause of problems is using the wrong type of drives.  Just like when using drives for installation of XCP-ng, it is important to use drives that either have or emulate 512 byte disk sectors.  Drives that use 4K byte disk blocks will not work unless they are 512e disks which emulate having 512 byte sectors.  It is generally not a good idea to mix types of drives such as one 512n (native 512 byte sectors) and two 512e drives but should be possible to do in an emergency.

The second is that the drives were not empty before including them into the system.  If there are any traces of RAID configuration or file systems on the drives, we could have problems with interference between those and the new configurations we're creating on the drives when creating the RAID array or the EXT filesystem (or LVM if you use that for the storage array).

The way to avoid this problem is to make sure the drives are thoroughly wiped before starting the process.  This can be done from the command line with the dd command like this:

```
dd if=/dev/zero of=/dev/sde bs=1M
```
This writes zeroes to every block on the drive and will wipe any traces of previous filesystems or RAID configurations.

Sometimes only one drive has a problem when assembling the RAID and we'll see a working RAID with one drive missing.  We'll assume that our md0 RAID was assembled correctly except that it is missing drive /dev/sde.  In that case, it should be possible to add the missing drive into the array like this:

```
mdadm --add /dev/md0 /dev/sde
```

If the drive is added to the RAID array correctly, we should start to see a lot of disk activity and we should be able to monitor the progress of it by looking at the /proc/mdstat file.

If the drive will not add to the array due to something left over on the drive, we should get an error from mdadm indicating the problem.  In that case we should be able to use the dd command to wipe out the one drive as above and then attempt to add it into the array.

The other possibility is that the RAID array is created correctly but XCP-ng will not create a storage repository on it because some previous content of the drives is causing a problem.  It should be possible to recover from this by writing zeroes to the entire array without needing to rebuild it like this:

```
dd if=/dev/zero of=/dev/md0 bs=1M
```

After the probably very lengthy process of zeroing out the array, it should be possible to try again to create a storage repository on the RAID array.

Another common cause for problems is a problem with either the mdadm.conf or dracut_mdraid.conf files.  Often when there is a problem with one of those files, the system will boot but fail to assemble or start the RAID arrays.  The boot RAID array will usually be found and assembled automatically but other RAID arrays may not.

The best thing to do in this case is to check over the contents of the mdadm.conf and dracut_mdraid.conf files.  Look for mistyped or missing quotes in the dracut_mdraid.conf or missing spaces inside the quotes for those lines that have them.  Look for incorrect or mistyped UUID identifiers for the RAID arrays in both files.  The UUID identifiers should match the identifiers you get using the mdadm --examine --scan command and also match between the mdadm.conf file and the dracut_mdraid.conf file.  If any errors are found and corrected, rebuild the initrd file using the dracut command.

In an extreme case, it should even be possible to delete and re-create those files using the normal instructions and rebuild the initrd file again.  It should also be possible but slightly more risky to remove the files and re-create the initrd file then reboot and attempt to re-create the files and initrd again after rebooting.

Another possible but rare problem is caused by drives that shift their identifications from one system boot to the next.  A drive that has one name such as sdf on one boot might be different such as sdc on a different boot.  This is usually due to problems with the system BIOS or drivers and can also be caused by some hardware problems such as a drive taking wildly different amounts of time to start up from one boot to the next.  It it also more common with some types of storage such as NVMe storage.

This type of problem is very difficult to diagnose and correct.  It may be possible to resolve it using different BIOS or setup configurations in the host system or by updating BIOS or controller firmware.

### More and Different

So what if we don't have or don't want a system that's identical to the one we just built in these instructions?  Here are some of the possible and normal variations of software RAID under XCP-ng.

#### Different Sized and Shaped RAID Arrays

We might want to create a RAID array with more or fewer drives or a different RAID level.  Common types would be a two drive RAID 1 array or a 4 drive RAID 5, 6 or 10 array.  Those cases are very easy to accomodate by changing the parameters when building the RAID array, altering the level= or raid-devices= parameters and the list of drives on the mdadm --create command line.  The only other consideration is to make sure the drives used are accounted for in a DEVICE line in the mdadm.conf file.

The number of drives in a specific level of RAID array can also affect the performance of the array.  A good rule of thumb for RAID 5 or 6 arrays is to have a number of drives that is a power of two (2, 4, 8, etc.) plus the number of extra drives where space is used for parity information, one drive for RAID 5 and two drives for RAID 6.  The RAID 5 array we created in the example system meets that recommendation by having 3 drives.  A 5 drive RAID5 array, or 4 or 6 drive RAID 6 arrays would as well.  A good rule of thumb for RAID 10 arrays is to have an even number of drives.  For RAID 10 in Linux an even number of drives is not a requirement as it is on other types of systems.  In addition, it may be possible to get better performance by creating a 2 drive RAID 10 array instead of a 2 drive RAID 1 array.

#### Different Sized Drives

We might need to create a RAID array where our drives are not identical and each drive has a different number of available blocks.  This might come up if we need to create a RAID array but have two of one type of drive and one of another such as two WD drives and one Seagate or two 1TB drives and one that is 1.5TB or 2TB.

The easiest solution to creating a working RAID array in this situation is to partition the drives and create a RAID array using the partitions instead of using the entire drive.

To do this, we get the sizes of the disks in the system by examining the /proc/partitions file.  Starting with the smallest of the disks to be used in the array, use gdisk or sgdisk to create a single partition of type fd00 (Linux RAID) using the maximum space available.  Examine and record the size of the partition created and save the changes.  Repeat the process with the remaining drives to be used except use the size of the partition created on the first drive instead of the maximum space available.

This should leave you with drives that each have a single partition and all of the partitions are the same size even though the drives are not.

When creating the RAID array and the mdadm.conf file, use the name of the disk partition instead of the name of the disk.  In our example system, we would create the array using /dev/sdc1, /dev/sdd1, and /dev/sde1 instead of /dev/sdc, /dev/sdd, and /dev/sde and also make the same substitutions on DEVICE lines in the mdadm.conf file.

It should also be possible to create the partitions on the drives outside of the XCP-ng system using a bootable utility disk that contains partitioning utilities such as gparted.

#### More Than One Additional Array

We might want to create more than one extra RAID array and storage repository.  This is also easy to accomodate in a similar way to using a different number of drives in the array.  We can easily create another RAID array and another storage repository onto a different set of drives by changing the parameters of the mdadm --create command line and xe sr-create command line.

As an example assume that we have 3 more drives /dev/sdf, /dev/sdg, and /dev/sdh and want to create a second RAID 5 array and another storage repository.  We create another RAID 5 array, this time md1 like this:

```
[16:45 XCP-ng ~]# mdadm --create /dev/md1 --run --level=5 --bitmap=internal --assume-clean --raid-devices=3 --metadata=1.2 /dev/sdf /dev/sdg /dev/sdh
mdadm: array /dev/md1 started.
```

We then create another storage repository as we did previously making sure to give it a different name and use /dev/md1 instead of /dev/md0 in the command line.

We also need to make sure that the mdadm.conf file has DEVICE lines containing the three drives /dev/sdf, /dev/sdg, and /dev/sdh and an ARRAY line containing /dev/md1 and its UUID in addition to the other drives and arrays md127 and md0.  We also need to make sure that the dracut_mdraid.conf file contains a kernel_cmdline+= line specifying the rd.md.uuid= with the UUID of the md1 array that matches what is in the mdadm.conf file in addition to the other two similar lines in that file.

It is important that each RAID array has a different name as the system will not allow you to create a RAID array with the name of one that already exists.  Normally, you would just continue on with different RAID device names such as md1, md2, md3, etc.  It is also important to use different names for each storage repository such as "RAID storage", "RAID storage 2" and so on.
