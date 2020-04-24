# XCP-ng 8.1

XCP-ng 8.1 is the latest release of XCP-ng. It's available as an installable ISO [at this place](https://updates.xcp-ng.org/isos/8.1/)

You can download alternatively:
* `xcp-ng-8.1.0-2.iso`
* `xcp-ng-8.1.0-2-netinstall.iso` (need an internet connection)

For previous releases, please check previous release section.

## Release information

* Released on 2020-03-31.
* Based on Citrix Hypervisor 8.1.
* Base version of CentOS in dom0: 7.5
* [Xen 4.13](https://wiki.xenproject.org/wiki/Xen_Project_4.13_Feature_List).
* Kernel 4.19, with patches. Latest kernel hotfix from CH 8.1 at the date of release included in the release.

See also: [Known Issues](knowissues.md).

## Upgrade from previous releases

Since XCP-ng 8.1.0 is a minor release, both upgrade methods are supported:
* From the installation ISO
* From command line using `yum` (**from XCP-ng 8.0 only!**)

Refer to the upgrade howto: https://github.com/xcp-ng/xcp/wiki/Upgrade-Howto

## Upgrade from beta or RC

Just use `yum update` or Xen Orchestra as if you were [installing updates to a stable release](https://github.com/xcp-ng/xcp/wiki/Updates-Howto).

## What changed since 8.0

### Highlight from Citrix Hypervisor changes

Full release notes at https://docs.citrix.com/en-us/citrix-hypervisor/whats-new.html

Citrix announces:
*  "Improved performance for VM imports and exports that use the XVA format" thanks to the use of a very efficient hash algorithm. Tests made with a 20G VM did not show any difference. According to the announcement the bigger the VM, the bigger the gains. One can suppose that the gain is only visible with large VMs.
* "Storage performance improvements"
* "New Windows I/O drivers with improved performance"
* UEFI support for guests is not experimental anymore
  * In XCP-ng, support for Secure Boot is *NOT INCLUDED* because it relies on Proprietary packages. We'll be raising the issue with the Xen community to see how to provide a FOSS implementation.
* Support for **AMD EPYC 7xx2(P)** added

Other changes:
* Windows drivers delivered through Windows Update should now work well with non-english locales. Source: From https://bugs.xenserver.org/browse/XSO-951.
* `chrony` replaces `ntp` for time synchronisation
* **PV guests are not supported anymore**
  * templates for creating PV guests have been removed
  * existing guests will still run... For now...
  * it is advised to convert them to HVM guests
  * a compatibility layer should be provided in the future for PV guests that really can't be converted. But really anyone who can convert to HVM, should
  * due to how 32-bit PV guests work, keeping them functioning on newer hardware with newer features comes with an increasing performance cost, and the linux kernel is also about to drop support for 32-bit PV guests
  * **Security issues related to PV guests may be or not be fixed. There is no guarantee about fixes.**
* Dynamic Memory Control (DMC) is deprecated and will be removed in the future.
* VSS and quiesced snapshots support is removed, because it never worked correctly and caused more harm than good. Note that Windows guest tools version 9 (the default for recent versions of Windows if you install Citrix drivers) already removed VSS support, even for older versions of CH / XCP-ng
* For new local storage repositories using the EXT filesystem, it now defaults to `ext4`. 
  * Applies only to new SRs. Existing local EXT3 storage repositories remains as EXT3.
  * The transition from our experimental `ext4` storage driver is not automatic.
  * Instructions for transitioning written in a specific section below.
  * Our `sm-additional-drivers` package updated to refuse to create new experimental `ext4` SRs since ext4 is already the default with the `ext` driver.

### XCP-ng specific changes

#### Backups with RAM

XCP-ng 8.1 embeds the XAPI (XenServer/XCP-ng API) modification required to support VM backups with their RAM. This new feature is at the same time available directly in Xen Orchestra.

In short, you are now able to backup and restore a VM, with its context, the whole RAM. It's like an hibernation: during the backup, VM is paused to save its RAM to a special disk (larger the RAM, longer the pause). Then, the content is sent to the backup repository.

You can restore it anytime later on another host, and resume it as if nothing happened. From the VM perspective, its uptime will be kept. Combined with Xen Orchestra Continuous Replication, you can also send your VM data and memory every XX hours to another XCP-ng host or pool, and resume it as soon you need it.

For more information and use cases, you can check [this Devblog](https://xen-orchestra.com/blog/devblog-6-backup-ram/) written by our developer Benjamin.

#### Installer improvements in 8.1

Our installer now offers two new installation options. In BIOS mode, access them with F2 when offered the choice. In UEFI mode, see the added boot menu entries.
* First new option: boot the installer with a 2G RAM limit instead of the 8G default. This is a workaround for installation issues on hardware with Ryzen CPUs. Though those are Desktop-class CPUs and not supported officially in the HCL, we tried to make it easier to workaround the infamous "installer crashes on Ryzen" issue.
* Second new option: boot the installer with our [alternate kernel](https://github.com/xcp-ng/xcp/wiki/Alternate-kernel) (kernel-alt). That kernel, built and maintained by @r1 for the team, is based on the main kernel, with all upstream kernel.org patches from the LTS 4.19 branch applied. It should be very stable by construction **but it receives less testing**. That option is there for cases when the main kernel and drivers have issues, so that you can quickly test if kernel.org patches have fixed it already. It will also install the alternate kernel in addition to the main kernel as a convenience. **If kernel-alt fixes issues for you, the most important thing to do is to tell us so that we may fix the main kernel!**

#### New leaf coalesce logic with dynamic limits

We have backported patches from `sm`'s master branch, that implement a new, smarter, logic for leaf coalescing.

Those interested in the patches, see https://github.com/xcp-ng-rpms/sm/commit/ed1a55d727846cf5777c8258e6a8f3b068e8a35b (python code).

#### Changes regarding our specific packages

* ZFS updated to 0.8.3.
* [Alternate kernel](https://github.com/xcp-ng/xcp/wiki/Alternate-kernel) updated to version 4.19.108. Installing it now automatically adds a new boot entry in grub's configuration, to make testing easier. Default entry remains that of the main kernel.
* `netdata-ui` still available from our repositories and also as a feature in Xen Orchestra.
  * r1 contributed a fix to netdata project to bring support for Xen 4.13
  * stormi made netdata cache be RAM-only to workaround an upstream bug that could make the disk cache grow forever
* Updated zstd to 1.4.4.
* Experimental support for XFS in local storage repository still available through the `sm-additional-drivers` package.

#### Status of Windows guest tools

Plans are laid out for simpler installation and maintenance of Windows guest tools. Unfortunately, we haven't found resources yet to implement them so the current state remains that of 8.0. ***If you're a developer on the Windows platforms, we're hiring! (full time or part time, contracts or hires) - Contact us.***

However we have updated the [documentation about the guest tools](https://github.com/xcp-ng/xcp/wiki/Guest-Tools), which is hopefully now clearer now!

#### Other changes

* Fixed netxtreme drivers (`bnx2x` module) that crashed with some models.

## Alternate kernel

We provide an "alternate Linux kernel" on XCP-ng 8.0 and above, named `kernel-alt`. It is kernel 4.19, as the main kernel, but with all updates from the linux 4.19 branch applied. By construction, it should thus be stable. However it **receives less testing** so we cannot fully guarantee against regressions (any detected regression we'd work on a fix quickly, of course). We also backport security fixes from the main kernel to the alternate kernel when needed.

This kernel is mainly targeted at:
* Testing whether kernel.org fixes situations where the main kernel and drivers have issues on specific hardware.
* Allowing a system to work temporarily when the main kernel has an issue regarding your specific hardware, until we can fix the main kernel. **For this to happen, you need to tell us if you are in a situation where the main kernel doesn't work whereas the alternate kernel does!**

Report issues [here](https://github.com/xcp-ng/xcp/issues).

### In XCP-ng 8.1

#### During system installation
* In BIOS mode, press F2 at early boot stage when offered the choice then type `install-alt`.
* In UEFI mode, select the boot option mentioning the alternate kernel from the grub menu.

This will boot the installer with the alternate kernel and also install the alternate kernel on the system in addition to the main one (but will not make the alternate kernel the default boot option for the installed system).

#### Installation on an existing system
You can install it using

```
yum install kernel-alt
```

This will install the kernel and add a grub boot menu entry to boot from it. It will **not** default to it unless you change the default in `grub.cfg` (/boot/grub/grub.cfg` or `/boot/efi/EFI/xenserver/grub.cfg` depending on whether you are in BIOS mode or UEFI mode).

There may also be a newer release of kernel-alt in testing:

```
yum install kernel-alt --enablerepo=xcp-ng-testing
```

#### Uninstall
Boot the main kernel, then:
```
yum remove kernel-alt
```

This will remove the added grub entry automatically too and set default boot to main kernel if needed.


### In XCP-ng 8.0

Things are a bit more manual.

#### Install

```
yum install kernel-alt --enablerepo=xcp-ng-testing
```

#### Configure boot
Create grub entry at 0 (`/boot/grub/grub.cfg` or `/boot/efi/EFI/xenserver/grub.cfg`) and adapt the values to your system:

```
menuentry 'XCP-ng alt' {
        search --label --set root root-bdtixc
        multiboot2 /boot/xen.gz com1=115200,8n1 dom0_mem=1232M,max:1232M watchdog ucode=scan dom0_max_vcpus=1-4 crashkernel=256M,below=4G console=com1,vga vga=mode-0x0311 nmi=ignore
        module2 /boot/vmlinuz-4.19.68-xen root=LABEL=root-bdtixc ro nolvm hpet=disable xencons=hvc console=hvc0 console=tty0 vga=785 plymouth.ignore-serial-consoles nmi=ignore
        module2 /boot/initrd-4.19.68-xen.img
}
```

Pay special attention to "--set root **root-bdtixc**" and "root=LABEL=**root-bdtixc**" to match it with your root label.

Reboot and you are set!

#### Uninstall

Remove the grub entry:

```
menuentry 'XCP-ng alt' {
        search --label --set root root-bdtixc
        multiboot2 /boot/xen.gz com1=115200,8n1 dom0_mem=1232M,max:1232M watchdog ucode=scan dom0_max_vcpus=1-4 crashkernel=256M,below=4G console=com1,vga vga=mode-0x0311 nmi=ignore
        module2 /boot/vmlinuz-4.19.68-xen root=LABEL=root-bdtixc ro nolvm hpet=disable xencons=hvc console=hvc0 console=tty0 vga=785 plymouth.ignore-serial-consoles nmi=ignore
        module2 /boot/initrd-4.19.68-xen.img
}
```

Then reboot. If you want to remove it completely:

```
yum remove kernel-alt
```

## Alternate drivers

XCP-ng occasionnally provides alternate drivers for users who have issues with the main drivers installed with XCP-ng.

Those driver packages can be installed alongside the main packages and will take precedence gracefully.

Note: there is another way, albeit more experimental, to use alternate drivers: [[use our experimental alternate kernel|Alternate Kernel]].

In this section we provide instructions that are common to all the provided drivers. 

Just replace `package-name` with the actual package name.

### Installation
```
yum install package-name
```

### Activation

The simplest way is to `reboot`.

Else, if you know the module name, you can unload it from the kernel and reload it.
```
modprobe -r module-name
modprobe -v module-name
```

### Uninstallation

If the driver does not work as intended, just remove the package from the system and follow the "Activation" steps above.
```
yum remove package-name
```

### Updates

The alternate drivers may get updated to newer versions when the system is updated or upgraded. If that causes regressions, please open a bug report.

### System Upgrades

Upgrades **using the installation ISO** will not retain the alternate driver package, so remember to re-install it after the upgrade if it's still needed (the main driver may have been updated too and make the alternate driver useless in your case).

Upgrades **using the `yum` method** will retain the alternate driver package, unless we stop providing it (usually, because the main driver will have been updated too). If the alternate driver is retained, it may have changed versions, so you may still need to consider going back to the main driver. If after an upgrade no driver works correctly for your system anymore, open a bug report.

### Network drivers

This list is maintained for the latest release of XCP-ng. Those packages may be or not be available for older releases.

Packages: 
* `bnxt_en` driver: `broadcom-bnxt-en-alt`

Update: in 8.1 more are available. List to be updated.

## Misc

### Announcement about our former experimental ext4 SR driver

It is now deprecated in 8.1. For a good reason: in XCP-ng 8.1 and above, following upstream changes, the ext driver now formats new SRs as EXT4. Existing SRs are untouched (so remain formatted as EXT3).

There is no easy way to convert an existing SR created with our driver, so those using it will need to move the VDIs out (to another SR or to export them), destroy the SR and create an EXT SR instead. Make sure to do this on XCP-ng 8.1. See instructions below.

The sm-additional-drivers package remains available in XCP-ng 8.1 in order to ease the transition. However We've broken the sr-create command on purpose. Any attempt to create a SR of type ext4 will result in an error with a message that explains that you need to use the ext type instead.

Our experimental driver will be completely removed in a later release, possibly XCP-ng 8.2.

#### Migrate from experimental EXT4 Storage Repositories

Our former experimental `ext4` storage driver is deprecated, because the official `ext` storage driver now defaults to ext4 for new storage repositories. XCP-ng 8.1 still has support for the experimental `ext4` driver for existing storage repositories, but:
* In a future release, that driver will be removed and associated SRs will not work anymore.
* In XCP-ng 8.1, the driver will refuse to create new `ext4` storage repositories.

It is highly recommended to convert any existing storage repository that uses the `ext4` experimental storage driver. This is done by moving the VMs out of the SR, destroying it and recreating it with the `ext` type.

See "Destroy and re-create a local SR" below.

#### Convert an existing EXT3 storage repository to EXT4

The safest option to convert an EXT3 local storage repository to EXT4 is to move the VMs out, destroy the SR and re-create it on XCP-ng 8.1 with the `ext` type.

See "Destroy and re-create a local SR" below.

#### Destroy and re-create a local SR

* Upgrade the pool to XCP-ng 8.1
* Then for each host with a local storage that needs being re-created, starting with the pool master:
  * If the local SR to be destroyed is using the experimental `ext4` driver, install the `sm-additional-drivers` package on the host and restart the toolstack: `yum install sm-additional-drivers -y && xe-toolstack-restart`.
  * Back-up your VMs.
  * Move the VMs from that local SR towards another SR, or export them then delete them (Note: an export will not retain the snapshots).
  * Check that the SR is now empty.
  * Note the *SR uuid* (visible in Xen Orchestra, or in the output of `xe sr-list`).
  * Find the associated PBD: `xe pbd-list sr-uuid={SR-UUID}`
    * Note the *PBD uuid*.
    * Note the associated device (e.g. `/dev/sdb`).
  * Unplug the PBD: `xe pbd-unplug uuid={PBD-UUID}`
  * Destroy the SR: `xe sr-destroy uuid={SR-UUID}`
  * Create the new SR:
    * `xe sr-create type=ext name-label="Local EXT storage" host-uuid={HOST-UUID} device-config:device={DEVICE}`
    * Example: `xe sr-create type=ext name-label="Local EXT storage" host-uuid=c9800783-5202-4ccb-87fd-ff8ced6c935f device-config:device=/dev/sdb`
* When you have handled all the servers of the pool, then for each host, if you had installed the `sm-additional-drivers` package, remove it (unless you also have XFS SRs): `yum remove sm-additional-drivers xfsprogs`.

## Known issues

Those are known issues inherited from Citrix Hypervisor.

See [Citrix Hypervisor's known issues](https://docs.citrix.com/en-us/citrix-hypervisor/whats-new/known-issues.html) (link only valid for the latest release of Citrix Hypervisor). Most apply to XCP-ng.

Some exceptions:
* The errors due to to `xapi-wait-init-complete.service` not being enabled were already fixed during XCP-ng 8.1's beta phase.
* Issues related to Citrix-specific things like licenses or GFS2 do not apply to XCP-ng.
* Though not mentioned yet in their known issues (as of 2020-03-30), an update of CH 8.0 to CH 8.1 using the update ISO fails at enabling the `chronyd` service. In XCP-ng 8.1, updated from 8.0 using `yum`, we fixed that issue before the release.

## Other known issues

Those are "original" issues or unconfirmed on Citrix Hypervisor.

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

## Old issues to sort

As every hand-updated list, this list below can quickly become obsolete or incomplete, so also check this: https://github.com/xcp-ng/xcp/issues

Some hardware related issues are also described in [this page](https://github.com/xcp-ng/xcp/wiki/Hardware-Compatibility-List-(HCL)).

### Cross-pool live migration from XenServer < 7.1

Live migrating a VM from an old XenServer can sometimes end with an error, with the following consequences:
* The VM reboots
* It gets duplicated: the same VM uuid (and usually its VDIs too) is present both on the sender and the receiver host. Remove it from the receiver host.

Would require a hotfix to the old XenServer, but since those versions are not supported anymore, Citrix won't develop one.

Reference: https://bugs.xenserver.org/browse/XSO-938

### Dell servers do not get the best partitioning

Due to the presence of the diagnostic partition on Dell servers, the installer does not create all partitions, so for example there's no dedicated /var/log partition (side-effect: log rotation switches to aggressive mode, so old logs are deleted quickly, sometimes even the same day!).

Reference: https://github.com/xcp-ng/xcp/issues/149

### Installation on software RAID may fail on previously used disks

Sometimes the presence of old `mdadm` metadata on the disks cause the installer to fail creating the software RAID. Zeroing the disks fixes it.

Reference: https://github.com/xcp-ng/xcp/issues/107

### Installer crashes on some hardware with AMD Ryzen APUs

The installer for XCP-ng 8.0 gives an error on some hardware. Reducing the maximum amount of memory allocated to the installer workarounds it.

Reference: https://github.com/xcp-ng/xcp/issues/206

### XCP-ng Center 7.4.0 and newer

No help files (https://github.com/xcp-ng/xenadmin/issues/20)

### Boot process stalled between splash screen and xconsole in XCP-ng < 8.0

Host boot process is stalled by 70 seconds between splash screen and xconsole. At that point some non critical messages from dmesg are shown e.g.:

```
mce: Unable to init device /dev/mcelog (rc: -16)
systemd[1]: Failed to insert module 'autofs4'
sd 0:1:0:0: [sda] No Caching mode page found
sd 0:1:0:0: [sda] Assuming drive cache: write through
```

Stall is caused by a faulty `ntpdate.service`. If this bothers you too much, you can speed up the boot process by running `systemctl disable ntpdate.service` (`ntpd.service` is still enabled which should handle clock syncing).

Reference: https://github.com/xcp-ng/xcp/issues/216

This is fixed in XCP-ng 8.0

### Some people report difficulties booting Windows XP VMs
Others report success instead.

* https://xcp-ng.org/forum/topic/1361/windows-xp-guest-wont-boot-after-upgrade-von-xenserver-6-5-to-xcp-ng-7-6
* https://github.com/xcp-ng/xcp/issues/247

Not exactly a bug since XP is not officially supported as a guest OS, but some people still need those VMs for legacy lock-in software and/or hardware.