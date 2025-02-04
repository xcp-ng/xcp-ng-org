# Windows Agent / PV-Tools

Common issues with Windows PV tools.

## Windows Management Agent failed to install

### Cause
There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

### Solution
Resolved with version 8.2.2.200-RC1 and newer.

***

## PV-Drivers missing in the Device Manager

### Cause

If despite running the Windows tools installer, there's no devices visible in the device manager, it's likely because there's some leftovers from old Citrix XenServer Client Tools.

### Solutions

#### Leftovers from old Citrix XenServer Client Tools.
1. remove any xen*.* files from `C:\Windows\system32` like
    * xenbus_coinst_7_2_0_51.dll
    * xenvbd_coinst_7_2_0_40.dll
    * xenbus_monitor_8_2_1_5.exe
    * and similiar `xen*_coinst` and `xen*_monitor` files
2. remove any leftover `XenServer` devices from device manager, also display hidden `XenServer` devices and remove them!
    * To show hidden devices in Device Manager: `View -> Show Hidden Devices`

#### There was an issue with the installing of the drivers certificate, so the drivers did not load silently

Resolved with version 8.2.2.200-RC1 and newer.

***

## Network PV drivers aren't working.

### Cause

If the tools are installed, while XCP-ng Center says that I/O is optimized, but the network card is not correctly installed and the Management Agent is also not working. There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

### Possible Solutions

* Resolved with version 8.2.2.200-RC1 and newer.

* Clean your system from `Citrix Client Tools` _AND_ `XCP-ng Client Tools` to create a clean state.
* Then install the Client Tools from scratch.

[This Guide](../../vms#%EF%B8%8F-guest-tools) may help you through the process.

## Not all PV drivers are correctly installed

![](https://xcp-ng.org/forum/assets/uploads/files/1713455051057-02dc1378-09e6-4600-a1b3-9a1be2cbdecc-image.png)

### Cause

It's possible that some antivirus blocks the end of the installation of the PV drivers. We've seen this happening with SentinelOne AV already (see [this thread](https://xcp-ng.org/forum/post/76098)).

### Solution

Simply pausing the agent and rebooting will allow the PV drivers to install successfully.
After a successful installation, enabling the SentinelOne agent again is possible without any other issues regarding the tools or drivers.

## Low storage performance on Windows

### Cause

Virtual disks on Windows VMs may perform poorly if the system power profile is not set to Performance.

### Workaround

As reported by [nesting4lyfe2024](https://xcp-ng.org/forum/user/nesting4lyfe2024), [marcoi](https://xcp-ng.org/forum/user/marcoi) and [wiseowl](https://xcp-ng.org/forum/user/wiseowl) on the XCP-ng forum ([link](https://xcp-ng.org/forum/topic/10375/slow-windows-11-guest-vm-virtual-disk-performance-on-r730-w-h730-controller-but-all-other-oses-are-fast-normal)).

Set your BIOS power profile to "Performance" or "Performance Per Watt (OS)".
Consult your motherboard manual for details; for example, on Dell systems with iDRAC Enterprise, this setting may be found at Configuration - BIOS Settings - System Profile Settings - System Profile:

<div style={{textAlign: 'center'}}>
![](../../static/img/performance-setting.png)
</div>

## Windows bug check 0x3B (SYSTEM_SERVICE_EXCEPTION) on systems with newer Intel CPUs

### Cause

Intel CPUs codenamed Rocket Lake, Sapphire Rapids and newer provide the **Architectural LBR** feature, which Windows depends on.
Xen's support of this CPU feature is incomplete, which causes Windows to crash when using certain applications (e.g. Blue Iris: [forum link](https://xcp-ng.org/forum/topic/8873/windows-blue-iris-xcp-ng-8-3), [GitHub issue](https://github.com/xcp-ng/xcp/issues/565)).

### Workaround

Stop the VM, run the following command on the host then restart the VM:

```
xe vm-param-add uuid=<VM's UUID> param-name=platform msr-relaxed=true
```
