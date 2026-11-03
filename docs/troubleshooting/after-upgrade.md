# After Upgrade

## The Server stays in Maintenance Mode {#the-server-stays-in-maintenance-mode}

### Causes and Solutions
* You enabled the maintenance mode and forgot about it.
    * No big deal, just exit maintenance mode :-)
* The server is still booting.
    * Take your time and let it boot up :-) this sometimes takes a while, but typically not longer than some minutes.
* A Storage Repository (SR) could not be attached.
    * Check the corresponding disk(s), network(s) and setting(s). Follow the [3-Step-Guide](../#the-3-step-guide).
* There is a serious problem.
    * Follow the 3-Step-Guide.

***

## XAPI doesn't start after an upgrade with an older ISO {#xapi-doesnt-start-after-an-upgrade-with-an-older-iso}

### Symptoms

* `xsconsole` reports that XAPI isn't running, and shows "No interfaces present", although the network of the host works: `ip a` lists the network cards, and the management bridge (`xenbr0` for example) has its IP address.
* Xen Orchestra, XO Lite and `xe` can't connect to the host.
* `systemctl status xapi` shows `failed (Result: start-limit)`: systemd tried to start XAPI several times, then gave up.
* `/var/log/xensource.log` contains a `DBCache_NotFound` exception.

To find this exception, run:

<Terminal shell title="root@xcp-ng-host — Find why XAPI doesn't start">{`
grep "failed with exception" /var/log/xensource.log | tail -5
`}</Terminal>

The output contains lines like this one. The table and column names depend on the XAPI versions involved:

```
xapi: [error||0 |Xapi.watchdog|backtrace] server_init D:34e3d0d1f096 failed with exception Db_exn.DBCache_NotFound("missing column", "Certificate", "purpose")
```

### Cause

The installation ISO used for the upgrade is older than the updates that were installed on the host before the upgrade.

The upgrade keeps the XAPI database of the host, but reinstalls the XAPI version of the ISO. The database was written by a more recent XAPI. When that XAPI changed the database format, for example by adding a field, the older XAPI can't load the database, and stops.

For example, the `purpose` field of certificates exists in XAPI 26.1.19, but not in XAPI 26.1.11. Upgrading a host updated to XAPI 26.1.19 with an ISO that installs XAPI 26.1.11 produces the error above.

### Solution

Install the updates on the host, then reboot it. The network of the host still works without XAPI, so `yum` can download the updates:

<Terminal shell title="root@xcp-ng-host — Install the updates">{`
yum update
reboot
`}</Terminal>

The updated XAPI knows the fields in the database, and starts normally. See [the updates section](../../management/updates) for more details about updates.

If you can't update the host, you can restore the system as it was before the upgrade: boot the installation ISO, and choose to restore the backup of your previous installation. The ISO upgrade saves this backup on the backup partition of the host.

To avoid this issue, read the warning about the ISO version in [the upgrade procedure](../../installation/upgrade#upgrade-via-installation-iso-recommended) before an upgrade.

***

## Some of my VMs do not start {#some-of-my-vms-do-not-start}

With the following error: "This operation cannot be performed because the specified virtual disk could not be found."

### Cause
It's mostly related to an inserted ISO that is no longer accessible.

### Solution
Eject the ISO on those VMs.

***

## Missing scripts/tools after upgrade {#missing-scriptstools-after-upgrade}

### Cause

XCP-ng ISO upgrade is a reinstall that saves only your XAPI database (Settings/VM Metadata).
But it also creates a full backup of your previous XCP-ng/XenServer installation on a second partition, in most cases it's /dev/sda2.

### Solution

To access the backup (with all your tools and modifications) just mount the backup partition (mostly /dev/sda2) and copy your data back.

***

## After upgrading my XCP-ng host is unstable, network card freezes, kernel errors, etc. {#after-upgrading-my-xcp-ng-host-is-unstable-network-card-freezes-kernel-errors-etc}

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
* Maybe we (or upstream XenServer) removed/updated something.
    * Please check our [Hardware Compatibility List (HCL)](../../installation/hardware).
    * Follow the [3-Step-Guide](../#the-3-step-guide).
