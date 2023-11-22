# XCP-ng in a VM

How to run XCP-ng in a VM?

This page details how to install XCP-ng as a guest VM inside different hypervisors to test the solution before a bare-metal installation.

:::warning
This practice is not recommended for production, nested virtualization has only tests/labs purpose.
:::

Here is the list of hypervisors on which you can try XCP-ng :

* [XCP-ng](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29/#nested-xcp-ng-using-xcp-ng)
* [VMware ESXi & Workstation](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-vmware-esxi-and-workstation)
* [Hyper-V 2016](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-microsoft-hyper-v-windows-10---windows-server-2016)
* [QEMU/KVM](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-(Nested-Virtualization)#nested-xcp-ng-using-qemukvm)
* [Virtualbox](https://www.virtualbox.org) (Nested Virtualisation implemented only in v6.1.x and above - [https://www.virtualbox.org/ticket/4032](https://www.virtualbox.org/ticket/4032))

## Nested XCP-ng using XCP-ng

* create a new VM from CentOS 7 template with minimum 2 vCPU and 4GB RAM
* change disk size to 100GB
* enable nested virtualisation with the special command on CLI: `xe vm-param-set uuid=<UUID> platform:exp-nested-hvm=true`
* default NIC type of Realtek may create stability issue for nested XCP-NG, change it to Intel e1000 : `xe vm-param-set uuid=<UUID> platform:nic_type="e1000"`
* install/use it like normal :-)

## Nested XCP-ng using Xen

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

## Nested XCP-ng using VMware (ESXi and Workstation)

_The following steps can be performed under VMware Workstation Pro, the settings will remain the same but the configuration will be slightly different. We will discuss this point at the end of this section about VMware._

### Networking settings

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


### XCP-ng virtual machine settings

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
     * **LSI Logic SAS** controller is chosen to maximize at possible the compatibility and the performance. vNVMe
       controller works too, it can reduce CPU overhead and latency. **PVSCSI controller won't work**.
     * **Unlike the PVSCSI controller, the VMXNET3 controller works with XCP-ng**. It will be useful if heavy network
       loads are planned between different XCP-ng virtual machines (XOSAN)

   * Finally, install XCP-ng as usual, everything should work as expected. After installation, your XCP-ng virtual machine
     is manageable from XCP-ng Center or Xen Orchestra.

     ![XCP-ng Center Final](https://image.noelshack.com/fichiers/2018/36/3/1536152208-6.png)

   * You can then create a virtual machine and test how it works (network especially).

### Configuration under VMware Workstation Pro 14/15

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


## Nested XCP-ng using Microsoft Hyper-V (Windows 10 - Windows Server 2016)


_The following steps can be performed with Hyper-V on Windows 10 (version 1607 minimum) and Windows Server 2016 (Hyper-V Server also). The settings will remain the same for both OS._

**This feature is not available with Windows 8 and Windows Server 2012/2012 R2 AND an Intel CPU is required (AMD not supported yet).**

Unlike VMware, you must first create the virtual machine to configure nested virtualization. Indeed, under Hyper-V, the configuration of the nested virtualization is a parameter to be applied to the virtual machine, it is not a global configuration of the hypervisor.

### XCP-ng virtual machine settings

The configuration of the virtual machine uses legacy components. Indeed XenServer / XCP-ng does not have the necessary drivers to work on a "modern" Hyper-V virtual hardware . **The consequences are that the performance of this XCP-ng virtual machine will be poor.**

The VM settings :
* **VM Generation** : 1 (even if the latest versions of CentOS work in Gen 2)
* **Memory** : 4GB minimum
* **Disk Controller** : IDE
* **Dynamic Memory** : Disabled (even if activated, the hypervisor will disable it in case of nested virtualization)
* **Network Controller** : Legacy Network Card

### CPU and Network settings

* Once the virtual machine is created, it is possible to enable nested virtualization for this virtual machine. Open a PowerShell Administrator prompt :

   `Set-VMProcessor -VMName <Your XCP-ng VM name> -ExposeVirtualizationExtensions $true`

* Then, it will be about configuring the network to allow guest virtual machines to access to the outside network.

    `Get-VMNetworkAdapter -VMName <Your XCP-ng VM name> | Set-VMNetworkAdapter -MacAddressSpoofing On`

    **Important : This settings has to be applied even if you use the NAT Default Switch (since Windows 10 1709)**

* After these configurations, you should be able to manage this XCP-ng host from XCP-ng Center or from a Xen Orchestra instance.

![Windows Server on XCP-ng under Hyper-V](http://image.noelshack.com/fichiers/2018/39/5/1538145459-2.png)

## Nested XCP-ng using QEMU/KVM

_The following steps can be performed using QEMU/KVM on a Linux host, Proxmox or oVirt._

Like VMware, you must first enable the nested virtualization feature on your host before creating your XCP-ng virtual machine.

### Configure KVM nested virtualization (Intel)

* Check if your CPU support virtualization and EPT (Intel)

   On most Linux distributions :

    `egrep -wo 'vmx|ept' /proc/cpuinfo `

   EPT is required to run nested XS/XCP-ng : [https://xcp-ng.org/forum/topic/550/shadow-paging-disable](https://xcp-ng.org/forum/topic/550/shadow-paging-disable)

* If everything is OK, you can check if the nested virtualization is already activated.

     `$ cat /sys/module/kvm_intel/parameters/nested`

  If the command returns "Y", nested virtualization is activated, if not, you should activate it (next steps).

* Firstly, check if you don't have any virtual machine running. Then, unload the KVM module using root user or sudo :

    `# modprobe -r kvm_intel`

* Activate nested virtualization feature :

    `# modprobe kvm_intel nested=1`

* Nested virtualization is enabled until the host is rebooted. To enable it permanently, add the following line to the `/etc/modprobe.d/kvm.conf` file:

    `options kvm_intel nested=1`

### Configure KVM nested virtualization (AMD)

On recent kernels, when enabling AMD virtualization in the BIOS, it should enable nested virtualization without any further configuration. Verify that `cat /sys/module/kvm_amd/parameters/nested` returns `1`.

### XCP-ng virtual machine settings

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