# Windows Agent / PV-Tools

## "Windows Management Agent failed to install" directly after installing it

### Cause
There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

### Solution
Resolved with version 8.2.2.200-RC1 and newer.

***

## The Management Agent Installer was executed, but the PV-Drivers are not installed in the Device Manager

### Causes and Solutions
#### Cause a) There can be leftovers from old Citrix XenServer Client Tools.
1. remove any xen*.* files from `C:\Windows\system32` like
    * xenbus_coinst_7_2_0_51.dll
    * xenvbd_coinst_7_2_0_40.dll
    * xenbus_monitor_8_2_1_5.exe
    * and similiar `xen*_coinst` and `xen*_monitor` files
2. remove any leftover `XenServer` devices from device manager, also display hidden `XenServer` devices and remove them!
    * To show hidden devices in Device Manager: `View -> Show Hidden Devices`

#### Cause b) There was an issue with the installing of the drivers certificate, so the drivers did not load silently

Resolved with version 8.2.2.200-RC1 and newer.

***

## Upgrading from XenTools 6.x to XCP-ng-Client-Tools-for-Windows-8.2.1-beta1 and get the error message "Windows Management Agent failed to install" directly after installing it

### Cause and solution:

There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

Resolved with version 8.2.2.200-RC1 and newer.

***

## Client Tools installed but XCP-ng Center says that I/O is optimized but my network card is not (correctly) installed and the Management Agent is (also) not working.

#### Cause

There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

### Possible Solutions

* Resolved with version 8.2.2.200-RC1 and newer.

* Clean your system from `Citrix Client Tools` _AND_ `XCP-ng Client Tools` to create a clean state.
* Then install the Client Tools from scratch.

[This Guide](../VMs#upgrade-from-citrix-xenserver-client-tools) may help you through the process.