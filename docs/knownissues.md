## Known issues from Citrix Hypervisor

See [Citrix Hypervisor's known issues](https://docs.citrix.com/en-us/citrix-hypervisor/whats-new/known-issues.html) (link only valid for the latest release of Citrix Hypervisor). Most apply to XCP-ng.

Some exceptions:
* The errors due to to `xapi-wait-init-complete.service` not being enabled were already fixed during XCP-ng 8.1's beta phase.
* Issues related to Citrix-specific things like licenses or GFS2 do not apply to XCP-ng.
* Though not mentioned yet in their known issues (as of 2020-03-30), an update of CH 8.0 to CH 8.1 using the update ISO fails at enabling the `chronyd` service. In XCP-ng 8.1, updated from 8.0 using `yum`, we fixed that issue before the release.

## Other known issues

### Host unreachable with nVIDIA GPU

After an upgrade or fresh installation on hosts having an nVIDIA GPU.

*TL;DR: the startup process for hosts that have a nVIDIA GPU stalls and the host is unusable. No data lost. Update available for affected users. Updated installation ISOs and online repositories avoid the issue for anyone downloading after 2020-04-06.*

Despite active `beta` and `RC` phases, it's only after the official release that several users have started reporting cases of hosts that were unreachable from management clients (Xen Orchestra, XCP-ng Center) and couldn't start any VMs.

It turns out that the XAPI (a core component of XCP-ng) needs `gpumon`, a binary that can only be built using a proprietary (from what I remember. One would need to check the license) nVIDIA developement toolkit. XAPI's start process stalls without an error message if there's an nVIDIA GPU.

We have reported the issue to its developers at Citrix because it seems to us that an open source piece of software, part of a Linux Foundation project, should not have runtime requirements on closed-source software.

This issue has forced us to add the `gpumon` package to XCP-ng although it's not used for anything but allowing XAPI to start correctly.

We want to thank our community of users who was very helpful in helping us identify, debug and fix this issue quickly, through an update and new installation ISOs.

**If you are affected:**
* Did you upgrade using the installation ISO? If yes, the safest is to rollback to the on-disk backup using the installation ISO then download a new, fixed, ISO (`xcp-ng-8.1.0-2`) from [xcp-ng.org](https://xcp-ng.org) and upgrade again.
* Else, or if reverting to the backup would make you lose important changes to your setup:
  * [Update your hosts](https://github.com/xcp-ng/xcp/wiki/Updates-Howto) and reboot.
  * There may be consequences of the failed first boot after an upgrade:
    * Network issues requiring an emergency network reset
    * Disconnected Storage Repositories needing manual reconnection
    * Missing removable media from VMs
    * Possibly others that haven't been reported yet

### Slow boot times when the ntp server cannot be reached
If the ntp server can't be reached, the `chrony-wait` service may stall the boot process for several minutes before it gives up:
* up to 10 minutes if you installed with `xcp-ng-8.1.0.iso`, or with yum update before 2020-04-03;
* up to 2 minutes only if you installed with `xcp-ng-8.1.0-2.iso`, with yum update after 2020-04-03, or have updated your host after 2020-04-03.

Reported to Citrix: https://bugs.xenserver.org/browse/XSO-981

We must stress that it is important that all your hosts have accurate date and time and so be able to connect an ntp server.

### `yum update` from 8.0 to 8.1 from within a VNC console

`yum update` from 8.0 to 8.1 from within a VNC console kills the console it is running into, and thus kills the upgrade process while it's running and leaves the package database in an unclean state, with duplicates.

Avoid running `yum update` in the host's remote console. Prefer ssh. If you really have no other solution, use `screen` or `tmux`.

See [this forum thread](https://xcp-ng.org/forum/topic/2822/xcp-ng-8-0-upgrade-to-8-1-via-yum-warning).

### Backup partition restore from installer fails on UEFI hosts
Context: the installer creates a backup of the root partition when you upgrade. It also allows to restore that backup when a backup is found.

On UEFI hosts, the backup restore function of the installer fails with the following error message: `setEfiBootEntry() takes exactly 5 arguments (4 given)`. This is [a bug inherited from Citrix Hypervisor 8.1](https://bugs.xenserver.org/browse/XSO-984).

Consequences: although the root filesystem is correctly restored, the system is unbootable.

Workaround:
* Make a disk backup of the disk that contains the system, just in case.
* Boot the XCP-ng 8.1 installer, and select the `shell` boot entry.
* Once you get a shell prompt follow these steps (adapt to your situation regarding partition layout, device names and labels):
```
# get information about the disks:
blkid

# create mount points
mkdir /mnt/root
mkdir /mnt/efi
# mount the / partition in /mnt/root
mount /dev/sda1 /mnt/root
# mount the EFI boot partition
mount /dev/sda4 /mnt/efi

# restore bootloader in EFI partition
cp -r /mnt/root/boot/efi/EFI /mnt/efi
umount /mnt/efi

# set the partition labels according to fstab:
# 1. take note of the partition labels used in fstab,
#    for example root-abcdef, BOOT-ABCDEF, logs-abcdef and swap-abcdef
cat /mnt/root/etc/fstab
umount /mnt/root

# 2. set root partition label (adapt device name and label)
e2label /dev/sda1 root-abcdef

# 3. set EFI boot partition label (adapt device name and label)
fatlabel /dev/sda4 BOOT-ABCDEF

# 4. set logs partition label (adapt device name and label)
e2label /dev/sda5 logs-abcdef

# 5. set swap partition label (adapt device name and label)
swaplabel -L swap-abcdef /dev/sda6
```
* remove installation media then reboot

Forum thread: https://xcp-ng.org/forum/topic/2849/post-8-1-upgrade-boot-fails-and-restore-fails 