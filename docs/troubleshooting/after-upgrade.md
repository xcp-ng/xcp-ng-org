# After Upgrade

## The Server stays in Maintenance Mode

### Causes and Solutions
* You enabled the maintenance mode and forgot about it.
    * No big deal, just exit maintenance mode :-)
* The server is still booting.
    * Take your time and let him boot up :-) this takes sometimes some time, but typically not longer than some minutes.
* A Storage Repository (SR) could not be attached.
    * Check the corresponding disk(s), network(s) and setting(s). Follow the [3-Step-Guide](#general).
* There is a serious problem.
    * Follow the 3-Step-Guide.

***

## Some of my VMs do not start. Error: "This operation cannot be performed because the specified virtual disk could not be found."

### Cause
It's mostly related to an inserted ISO that is no longer accessible.

### Solution
Eject the ISO on those VMs.

***

## I had some scripts/tools installed and after the upgrade all is gone! Help!

### Cause
XCP-ng ISO upgrade is a reinstall that saves only your XAPI database (Settings/VM Metadata).
But it also creates a full backup of your previous XCP-ng/XenServer installation on a second partition, in most cases it's /dev/sda2.

### Solution
To access the backup (with all your tools and modifications) just mount the backup partition (mostly /dev/sda2) and copy your data back.

***

## After upgrading my XCP-ng host is unstable, network card freezes, kernel errors, etc.

### Causes and Solutions

* Maybe your hardware got an issue
    * Check caps on your mainboard
    * Check power supply
    * Check cables
    * Check drives SMART values with something like `smartctl -A /dev/sda` ([Smartmontools](https://www.smartmontools.org))
    * Check memory with something like [Memtest86+](https://www.memtest.org)
* Maybe your firmware got an issue
    * update BIOS
    * update network card firmware
    * update RAID controller / HBA firmware
    * update system firmware
* Maybe we (or upstream Citrix XenServer) removed/updated something.
    * Please check our [Hardware Compatibility List (HCL)](../installation/hardware).
    * Follow the [3-Step-Guide](#general).