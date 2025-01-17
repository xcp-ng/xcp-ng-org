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

Simply pausing the agent and doing a reboot will make the XenTools to install succesfully. After a succesfull installation, enabling the SentinelOne agent again is possible without any other issues regarding the tools or drivers.