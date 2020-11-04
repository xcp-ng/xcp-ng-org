# Long Term Support Release (LTSR)

:::warning
Current LTSR status is NOT yet released, it's still a Release Candidate! See [our XCP-ng 8.2 LTS RC blog post](https://xcp-ng.org/blog/2020/10/30/xcp-ng-8-2-release-candidate/) for more details.
:::

XCP-ng 8.2 is current LTS release. [Download the installation ISO](http://mirrors.xcp-ng.org/isos/8.1/xcp-ng-8.2.0.iso).

SHA256 checksums, GPG signatures and net-install ISO are available [here](https://xcp-ng.org/#easy-to-install).

:::tip
LTS means **Long Term Support**: this version is supported for 5 years, and even more for specific Extended Lifetime Support.
:::

## LTSR objectives

Using the LTSR version is relevant if:

* you want to be sure the system will stay stable
* you want to have all security fixes without doing major upgrades every year
* you want a predictable migration path on a longer timeframe
* you don't care about new features coming for the next years

![](../assets/img/lts.png)

If you prefer to get latest improvements, go for our [current release](currentrelease.md).

## Release information

* Released on 2020-11-16
* Based on Citrix Hypervisor 8.2
* Base version of CentOS in dom0: 7.5
* [Xen 4.13](https://wiki.xenproject.org/wiki/Xen_Project_4.13_Feature_List)
* Kernel 4.19, with patches. Latest kernel hotfix from CH 8.2 at the date of release included in the release

## Install
See [Installation](install.md).

## Upgrade from previous releases

Despite being an LTS, you can upgrade from any previous 8.x easily. Both upgrade methods are supported:
* From the installation ISO
* From command line using `yum` (**from XCP-ng 8.0 or 8.1 only!**)

Refer to the [Upgrade Howto](upgrade.md).

:::tip
Note for testers: to upgrade from XCP-ng 8.2 beta or RC, just use `yum update` or Xen Orchestra as if you were [installing updates to a stable release](updates.md).
:::

## What changed since 8.1

### Highlight from Citrix Hypervisor changes

Full release notes at <https://docs.citrix.com/en-us/citrix-hypervisor/whats-new.html>

Citrix announces:
* Increased configuration limits (up to 6TiB RAM and 448 CPUs)
* Enable and disable read caching
* Install a TLS certificate


Other changes:
* TODO

### XCP-ng specific changes

#### Fully Open Source UEFI implementation

A complete reimplementation of the UEFI support in XCP-ng was built, because Citrix one was closed source until recently. It was also very interesting to work on that and learn tons of things. This project will be also pushed to be upstream in Xen itself!

#### Openflow controller access

We automated the configuration needed by the user to allow communication with the Openflow controller in Xen Orchestra.

Learn more about the VIFs network traffic control in Xen Orchestra in [this dedicated devblog](https://xen-orchestra.com/blog/vms-vif-network-traffic-control/).

We also backported this feature to XCP-ng 8.1 as this improvements was already supported by older XCP-ng version.

#### Core scheduling (experimental)

A new XAPI method allowing you to choose the frequency of the core scheduler was written. This feature will allow you to use hyperthreading with extra bits of security, in particular regarding side channel attacks (as Spectre, Meltdown, Fallout...). 

You will have the option to select different granularity: CPU, core or socket, depending on the performance/security ratio you are looking for.

#### Changes regarding our specific packages

* TODO

#### Status of Windows guest tools

Plans are laid out for simpler installation and maintenance of Windows guest tools. Unfortunately, we haven't found resources yet to implement them so the current state remains that of 8.1. ***If you're a developer on the Windows platforms, we're hiring! (full time or part time, contracts or hires) - Contact us.***

However we have updated the [documentation about the guest tools](guests.md), which is hopefully clearer now!

#### Other changes

* TODO

## Misc

* TODO

## Known issues

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

Forum thread: <https://xcp-ng.org/forum/topic/2849/post-8-1-upgrade-boot-fails-and-restore-fails>

## Citrix Hypervisor's known issues

In general, issues inherited from Citrix Hypervisor and already described in their documentation are not repeated in ours, unless we need to increase the visibility of said issues.

See [Citrix Hypervisor's known issues](https://docs.citrix.com/en-us/citrix-hypervisor/whats-new/known-issues.html) (link only valid for the latest release of Citrix Hypervisor). Most apply to XCP-ng.

Some exceptions to those CH 8.1 known issues:
* The errors due to to `xapi-wait-init-complete.service` not being enabled were already fixed during XCP-ng 8.1's beta phase.
* Issues related to Citrix-specific things like licenses or GFS2 do not apply to XCP-ng.
* Though not mentioned yet in their known issues (as of 2020-03-30), an update of CH 8.0 to CH 8.1 using the update ISO fails at enabling the `chronyd` service. In XCP-ng 8.1, updated from 8.0 using `yum`, we fixed that issue before the release.

## Older known issues to sort

As every hand-updated list, this list below can quickly become obsolete or incomplete, so also check this: <https://github.com/xcp-ng/xcp/issues>

Some hardware-related issues are also described in [this page](hardware.md).

### Cross-pool live migration from XenServer < 7.1

Live migrating a VM from an old XenServer can sometimes end with an error, with the following consequences:
* The VM reboots
* It gets duplicated: the same VM uuid (and usually its VDIs too) is present both on the sender and the receiver host. Remove it from the receiver host.

Would require a hotfix to the old XenServer, but since those versions are not supported anymore, Citrix won't develop one.

Reference: [XSO-938](https://bugs.xenserver.org/browse/XSO-938)

### Dell servers do not get the best partitioning

Due to the presence of the diagnostic partition on Dell servers, the installer does not create all partitions, so for example there's no dedicated /var/log partition (side-effect: log rotation switches to aggressive mode, so old logs are deleted quickly, sometimes even the same day!).

Reference: <https://github.com/xcp-ng/xcp/issues/149>

### Installation on software RAID may fail on previously used disks

Sometimes the presence of old `mdadm` metadata on the disks cause the installer to fail creating the software RAID. Zeroing the disks fixes it.

Reference: <https://github.com/xcp-ng/xcp/issues/107>

### Installer crashes on some hardware with AMD Ryzen APUs

The installer for XCP-ng 8.0 gives an error on some hardware. Reducing the maximum amount of memory allocated to the installer workarounds it.
The installer offers extra options to boot with only 2 G of RAM (usually solves the issue) or using an alternate kernel.

Reference: <https://github.com/xcp-ng/xcp/issues/206>
