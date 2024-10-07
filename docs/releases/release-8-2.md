---
sidebar_position: 2
---

# XCP-ng 8.2 LTS

XCP-ng 8.2 is an [LTS Release](../../../releases#lts-releases). [Download the installation ISO](https://mirrors.xcp-ng.org/isos/8.2/xcp-ng-8.2.1-20231130.iso?https=1).

SHA256 checksums, GPG signatures and net-install ISO are available [here](https://xcp-ng.org/#easy-to-install).

:::info
LTS means **Long Term Support**: this version is supported for 5 years, and even more for specific Extended Lifetime Support.
:::

## Release information

* Released on 2020-11-18
* Based on Citrix Hypervisor 8.2
* Base version of CentOS in dom0: 7.5
* Xen 4.13.1 + patches
* Kernel 4.19 + patches
* Supported until 2025-06-25

## Install

See [Installation](../../../installation/install-xcp-ng).

## Upgrade from previous releases

Despite being an LTS, you can upgrade from previous releases. Both upgrade methods are supported:
* From the installation ISO
* From command line using `yum` (**from XCP-ng 8.0 or 8.1 only!**)

Refer to the [Upgrade Howto](../../../installation/upgrade).

## What changed since 8.1

### Highlight from Citrix Hypervisor changes

Full release notes at [https://docs.citrix.com/en-us/citrix-hypervisor/whats-new.html](https://docs.citrix.com/en-us/citrix-hypervisor/whats-new.html)

Main changes announced by Citrix:
* Maximum host RAM raised to 6 TB and maximum number of logical processors per host raised to 448 CPUs.
* Support for installing TLS certificates on hosts (see https://docs.citrix.com/en-us/citrix-hypervisor/hosts-pools.html#install-a-tls-certificate-on-your-server)
* TLS 1.2 protocol enforced for HTTPS traffic, and between XCP-ng components. Support for legacy SSL mode and TLS 1.0/1.1 protocols have been removed.
* Support for SLES 12 SP5 and Ubuntu 20.04 added
* Support for Windows 7, Windows Server 2008 SP2 and Windows Server 2008 R2 SP1 removed. They may still work, but are not supported officially nor tested anymore by Citrix. Consider upgrading.

Other changes:
  * Bug fixed for hosts configured with DHCP. `xcp-networkd` used not to send the hostname along with the DHCP request. Fix contributed by XCP-ng team.
  * [Backup restore fixed for UEFI hosts](https://bugs.xenserver.org/browse/XSO-984). Bug reported by XCP-ng community.

**The rest, below, is about changes specific to XCP-ng.**

### Fully Open Source UEFI implementation

A complete [reimplementation of the UEFI support in XCP-ng](https://github.com/xcp-ng/uefistored) was written, because Citrix' one was closed source until recently. It was also very interesting to work on that and learn tons of things. This project will be also pushed to be upstream in Xen itself!

This will also allow us to offer Secure Boot support for VMs in the near future.

### Openflow controller access

We automated the configuration needed by the user to allow communication with the Openflow controller in Xen Orchestra.

Learn more about the VIFs network traffic control in Xen Orchestra in [this dedicated devblog](https://xen-orchestra.com/blog/vms-vif-network-traffic-control/).

We also backported this feature to XCP-ng 8.1 as this improvements was already supported by older XCP-ng version.

### Core scheduling (experimental)

As you probably know, Hyper Threading defeats all mitigations of CPU vulnerabilities related to side-channel attacks (as Spectre, Meltdown, Fallout...). That's why it was required to disable it as part of the mitigations. The reason is that with Hyper Threading enabled you can't protect a VM's vCPUs from attacks originating from other VMs that have workloads scheduled on the same physical core.

With Core Scheduling, you now have another solution: you can choose to leave Hyper Threading enabled and ask the scheduler to always group vCPUs of a given VM together on the same physical core(s). This will remove the vulnerability to a class of attacks from other VMs, but will leave the VM processes vulnerables to attacks from malevolent processes from within itself. To be usedonly with entirely trusted workloads.

A new XAPI method allowing you to choose the frequency of the core scheduler was written. You will have the option to select different granularity: CPU, core or socket, depending on the performance/security ratio you are looking for.

### New storage drivers
We added three new experimental storage drivers: `zfs`, `glusterfs` and `cephfs`.

We also decided to include all SR drivers by default in XCP-ng now, including experimental ones. We do not, however, install all the dependencies on dom0 by default: `xfsprogs`, `gluster-server`, `ceph-common`, `zfs`... They need to be installed using `yum` for you to use the related SR drivers. Check the documentation for each storage driver.

#### `zfs`
We already provided `zfs` packages in our repositories before, but there was no dedicated SR driver. Users would use the `file` driver, which has a major drawback: if the zpool is not active, that driver may believe that the SR suddenly became empty, and drop all VDI metadata.

So we developed a dedicated `zfs` SR driver that checks whether `zfs` is present before drawing such conclusions.

See [Transition to the new ZFS SR driver](#transition-to-the-new-zfs-sr-driver) if you were already using ZFS in XCP-ng before the 8.2 release.

=> [ZFS SR Documentation](../../../storage#zfs)

#### `glusterfs`
Use this driver to connect to an existing Gluster storage as a shared SR.

=> [GlusterFS SR Documentation](../../../storage#glusterfs)

#### `cephfs`
Use this driver to connect to an existing Ceph storage through the CephFS storage interface.

=> [CephFS SR Documentation](../../../storage#cephfs)

### Guest tools ISO
Not really a change from XCP-ng 8.1, but rather a change from Citrix Hypervisor 8.2: they dropped the guest tools ISO, replaced by downloads from their website. We chose to retain the feature and still provide a guest tools ISO that you can mount to your VMs. Many thanks go to the [XAPI](https://github.com/xapi-project/xen-api/) developers who have accepted to keep the related source code in the XAPI project for us to keep using, rather than deleteing it.

### Other changes

* We replaced Citrix's `gpumon` package, not built by us, by a mock build of `gpumon` sources, without the proprietary nvidia developer kit. For you as users, this changes nothing. For us, it means getting rid of a package that was not built by the XCP-ng build system.
* [Alternate kernel](../../installation/hardware#-alternate-kernel) updated to version 4.19.142.
* Intel's `e1000e` driver updated to version 3.8.4 in order to support more devices.
* Cisco's `enic` and `fnic` drivers updated to offer better device support and compatibility.
* `rsyslog` (logging daemon) synced from latest CentOS 7.8 security and bugfix update because several memory leaks have been patched in it.
* `zstd` updated to 1.4.5

### Additional packages updated or added

[Additional packages](../../management/additional-packages) are packages made available by the XCP-ng team directly in our RPM repositories, for easy installation and update on XCP-ng hosts.

* `zfs` updated to 0.8.5
* `glusterfs` 8.1 added to the XCP-ng repositories
* New [additional driver package](../../management/additional-packages): `r8125-module`, for the `r8125` Realtek device driver.
* [Alternate driver package](../../installation/hardware#-alternate-drivers) `intel-igb-alt` updated to version 5.4.6.

### Misc

#### Status of XCP-ng Center

The community-maintained XCP-ng Center client is [now available for download](https://github.com/xcp-ng/xenadmin/releases/tag/v20.04.01.33). However, it is not a recommended client to use because it was modified for 8.2 support without any specific QA or validation. Keep in mind that the officially supported clients - all fully Open Source - are [documented on this page](../../management).

:::note
Although we host XCP-ng Center on our GitHub organisation and authorized its contributors to use the XCP-ng logo, we remind our users that - as documented [in the official docs](../../management#xcp-ng-center) and on its [download page](https://github.com/xcp-ng/xenadmin/releases) - **XCP-ng Center is not officially supported by the XCP-ng project**.
:::

#### Transition to the new ZFS SR driver

If you created a storage repository before upgrading to XCP-ng 8.2, be it manually or using Xen Orchestra's SR creation form, its type will be `file`. As explained [above](#zfs), this leaves you at risk of losing your VM metadata, so we strongly advise to transition to the new `zfs` SR driver.

There exists no easy way to convert an existing storage repository from a given type, so the conversion procedure is:
* Upgrade the pool to XCP-ng 8.2
* Then for each host with a local ZFS storage that needs being re-created, starting with the pool master:
  * Install the `zfs` package if not installed already (`yum install zfs`).
  * Back-up your VMs from the existing ZFS SR.
  * Move the VMs from that local SR towards another SR, or export them then delete them.
  * Check that the SR is now empty.
  * Note the *SR uuid* (visible in Xen Orchestra, or in the output of `xe sr-list`).
  * Find the associated PBD: `xe pbd-list sr-uuid={SR-UUID}`
    * Note the *PBD uuid*.
    * Note the associated location (e.g. `/zfs/vol0`).
  * Unplug the PBD: `xe pbd-unplug uuid={PBD-UUID}`
  * Destroy the SR: `xe sr-destroy uuid={SR-UUID}`
  * [Create the ZFS SR](../../../storage#zfs)
  * Move or import the VMs back to the new SR

#### Status of Windows guest tools

Plans are laid out for simpler installation and maintenance of Windows guest tools. Unfortunately, we haven't found people yet to implement them so the current state remains that of 8.1. ***If you're a developer on the Windows platforms, we're hiring! (full time or part time, contracts or hires) - Contact us.***

Using the Windows guest tools is [documented here](../../../vms#windows).

## Update: what's new in XCP-ng 8.2.1

XCP-ng 8.2.1 was released as a maintenance update for XCP-ng 8.2 LTS, which has its own version number because it also comes with updated installation images.

XCP-ng 8.2.1 is still XCP-ng 8.2 LTS. It's the same, that just reached a new numbered milestone.

The update brought a few enhancements such as [Guest Secure Boot](../../guides/guest-UEFI-Secure-Boot#guest-uefi-secure-boot), support for Rocket Lake CPUs, or better log rotation.

They are detailed in the [Release announcement for XCP-ng 8.2.1](https://xcp-ng.org/blog/2022/02/28/xcp-ng-8-2-1-update/).

## Known issues

### `yum update` from within a VNC console

`yum update` to 8.2 from within a VNC console can kill the console it is running into, and thus kill the upgrade process while it's running and leave the package database in an unclean state, with duplicates.

Avoid running `yum update` in the host's remote console. Prefer ssh. If you really have no other solution, use `screen` or `tmux`.

See [this forum thread](https://xcp-ng.org/forum/topic/2822/xcp-ng-8-0-upgrade-to-8-1-via-yum-warning).

### Network performance of FreeBSD VMs

A security patch from the Xen project has caused the speed of network traffic originating in FreeBSD VMs - such as pfSense - to drop dramatically (by a factor of ~5 in our tests).

After debugging it [with the help of users on our forum](https://xcp-ng.org/forum/topic/3774/poor-pfsense-wan-speeds-after-xcp-ng-updates), we have [reported it to the Xen project](https://lists.xen.org/archives/html/xen-devel/2021-01/msg01122.html) then helped Xen developers find the exact cause of the regression, which was fixed, and [we released an update with the fix](https://xcp-ng.org/blog/2021/02/26/february-2021-security-updates/).

An up to date XCP-ng 8.2 will not be affected anymore.

### Missing files in `/etc/modprobe.d` after an upgrade

When a host is upgraded to XCP-ng 8.2 using the installation ISO, two files are missing in the resulting system:
* `/etc/modprobe.d/blacklist-bridge.conf`
* `/etc/modprobe.d/disable-ipv6.conf`

We reported the issue to Citrix: [https://bugs.xenserver.org/browse/XSO-991](https://bugs.xenserver.org/browse/XSO-991)

There are no known consequences of having those files missing, except possible slightly increased memory usage.

Reference: [https://github.com/xcp-ng/xcp/issues/457](https://github.com/xcp-ng/xcp/issues/457)

### UEFI Windows compatibility

**Solved.**

Overall testing and user feedback regarding UEFI Windows compatibility during the pre-release testing phases was good.

However, there remained specific situations where some Windows VMs had trouble starting. This had been observed on some VMs after a backup restore or a VM copy.

A fix was found and released as an official update to XCP-ng 8.2.

Reference: [https://github.com/xcp-ng/xcp/issues/454](https://github.com/xcp-ng/xcp/issues/454)

### Citrix Hypervisor's known issues

In general, issues inherited from Citrix Hypervisor and already described in their documentation are not repeated in ours, unless we need to increase the visibility of said issues.

See [Citrix Hypervisor's known issues](https://docs.citrix.com/en-us/citrix-hypervisor/whats-new/known-issues.html) (link only valid for the latest release of Citrix Hypervisor). Most apply to XCP-ng.

Some exceptions to those Citrix Hypervisor known issues:
* Issues related to Citrix-specific things like licenses or GFS2 do not apply to XCP-ng.

### Older known issues

As every hand-updated list, this list below can quickly become obsolete or incomplete, so also check this: [https://github.com/xcp-ng/xcp/issues](https://github.com/xcp-ng/xcp/issues)

Some hardware-related issues are also described in [this page](../../installation/hardware).

#### Cross-pool live migration from XenServer < 7.1

Live migrating a VM from an old XenServer can sometimes end with an error, with the following consequences:
* The VM reboots
* It gets duplicated: the same VM uuid (and usually its VDIs too) is present both on the sender and the receiver host. Remove it from the receiver host.

Would require a hotfix to the old XenServer, but since those versions are not supported anymore, Citrix won't develop one.

Reference: [XSO-938](https://bugs.xenserver.org/browse/XSO-938)

#### Dell servers do not get the best partitioning

Due to the presence of the diagnostic partition on Dell servers, the installer does not create all partitions, so for example there's no dedicated /var/log partition (side-effect: log rotation switches to aggressive mode, so old logs are deleted quickly, sometimes even the same day!).

Reference: [https://github.com/xcp-ng/xcp/issues/149](https://github.com/xcp-ng/xcp/issues/149)

#### Installation on software RAID may fail on previously used disks

Sometimes the presence of old `mdadm` metadata on the disks cause the installer to fail creating the software RAID. Zeroing the disks fixes it.

Reference: [https://github.com/xcp-ng/xcp/issues/107](https://github.com/xcp-ng/xcp/issues/107)

#### Installer crashes on some hardware with AMD Ryzen APUs

The installer gives an error on some hardware. Reducing the maximum amount of memory allocated to the installer workarounds it.
The installer offers extra options to boot with only 2 G of RAM (usually solves the issue) or using an alternate kernel.

Reference: [https://github.com/xcp-ng/xcp/issues/206](https://github.com/xcp-ng/xcp/issues/206)
