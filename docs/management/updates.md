---
sidebar_position: 3
---

# Updates

This page details how to keep your XCP-ng system updated (bug fixes and security fixes) between [upgrades](../../installation/upgrade).

## Support cycle

We maintain two releases in parallel:
* The LTS Release (currently `8.2`).
* The Standard release, on a best-effort basis (currently also `8.2`, until a future `8.3` release).

If your version is lower than `8.2`, it will not receive updates anymore. To keep benefiting from bugfixes and security fixes you need to [upgrade](../../installation/upgrade).

:::tip
Exceptionally, XCP-ng 8.1 will continue to receive support until either XCP-ng 8.3 is available or until March 31 2021, whichever comes first. The general rule is to offer a transition period for you to upgrade after each new Standard release, a few months in general.
:::

## Prerequisites

### Access to the repository

Your dom0 system must either have access to the internet, or to a local mirror. In the second case, make sure to update the `baseurl` values in `/etc/yum.repos.d/xcp-ng.repo` to make them point at the local mirror, and keep the mirror regularly synced.

### Be cautious with third party repositories and packages

If you have enabled third party repositories (CentOS, EPEL...) in the past, make sure to **disable** them before updating. Otherwise, core packages from your dom0 system can be overwritten with versions of packages that have not been tested in the context of XCP-ng, or lack specific patches.

Set `enabled=0` in the relevant files in `/etc/yum.repos.d/`. Warning: when added manually, the EPEL repository is automatically enabled. Make sure to disable it right away and then use this syntax to install packages from it: `yum install packagename --enablerepo='epel'`.

In any case, installing extra packages from outside the XCP-ng repositories can lead to various issues, including update or system upgrade problems, so make sure to:
* install only packages that are known not to have any adverse effect on XCP-ng (when in doubt, [ask on the forum](https://xcp-ng.org/forum/));
* check the dependencies pulled by such packages: they must not overwrite existing packages in XCP-ng;
* know that you are doing it at your own risk and be prepared to fix any issues that would arise, especially unforeseen upgrade issues (we can't test upgrade scenarios where unknown packages are installed on the system).

More at [Additional packages](../../management/additional-packages).

## Get information about the updates

Every update is first tested and discussed on [this forum thread](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing), which we highly recommend to subscribe to (activate e-mail notifications in your forum settings if you want to be notified of new messages). You will thus know about coming updates in advance and be able to help us validate them. Sometimes updates are **delayed** because of lack of feedback there.

Important updates - especially security updates - are announced [on the blog](https://xcp-ng.org/blog/) and the most important ones are also announced through [the newsletter](https://xcp-ng.us13.list-manage.com/subscribe?u=f1ab72021fb8816f4d5e72773&id=4d17393549).

A comprehensive list of updates is available on our build system's web interface. Click the package names for details:

#### Updates for XCP-ng 8.2

* [List of official **updates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=42&order=-build_id&latest=1)
* [List of **update candidates** and other **testing** packages](https://koji.xcp-ng.org/builds?inherited=0&tagID=43&order=-build_id&latest=1)

#### Updates for XCP-ng 8.1

* [List of official **updates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=36&order=-build_id&latest=1)
* [List of **update candidates** and other **testing** packages](https://koji.xcp-ng.org/builds?inherited=0&tagID=37&order=-build_id&latest=1)

#### Updates for XCP-ng 8.0

* [List of official **updates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=27&order=-build_id&latest=1)
* [List of **update candidates** and other **testing** packages](https://koji.xcp-ng.org/builds?inherited=0&tagID=28&order=-build_id&latest=1)

## Precautions

* Disable HA during the whole update process to avoid accidental fencing.
* Avoid applying updates while XAPI tasks are running (`xe task-list`).
* Some updates may probe SCSI devices. If your devices are sensitive to that kind of thing, plug them off before updating (see [this unfortunate story](https://github.com/xcp-ng/xcp/issues/232) of dead tape robots).
* As a precaution, it may be a good idea to disconnect passed-through devices before applying the update.
* If a reboot is required and you want to avoid downtime, you will probably move your VMs from host to host. One common mistake (favoured by the default values in some VM templates) is to give a VM a very low dynamic minimum RAM value. XCP-ng will reduce the VMs total RAM to that dynamic minimum during the live migration. If the limit is too low, this may lead to killed processes or even a crashed system inside the VM due to the memory pressure, thus requiring a reboot of the VM.
* If among the to-be-updated packages you see `xcp-ng-pv-tools`, make sure to unmount the guest tools ISO from all running VMs before the update (it is done automatically during the update for VMs that are turned off). If the guest tools are still mounted at the time of the update, the VDI will point at a non-existing ISO image after the update. The VMs that have that VDI mounted will then fail to migrate or restart due to the missing VDI.
*Some people systematically run `xe vm-cd-eject --multiple` to eject all virtual CDs/DVDs from the VMs before updating and/or migrating.*
* Do not update from an interactive shell that was directly started from the XCP-ng console (`xsconsole`), nor from the host's remote console that is available through the VNC protocol in Xen Orchestra or XCP-ng Center. The update process may restart those, kill the current shell and thus kill the update process which would leave the system in an unclean state (duplicate RPMs).

## How to apply the updates

### From command line

#### 1. Check prerequisites and precautions above

#### 2. Install the updates

Run this on each server, starting with the pool master:
```
yum update
```

#### 3. Restart the XAPI toolstack on every host

```
xe-toolstack-restart
```
This way some changes are taken into account without even rebooting. Even if you plan to reboot, it's good to do this first to avoid live migration issues that could happen in some cases during the update process. Start with the pool master. Check that no task is currently running (`xe task-list`) before restarting the toolstack. Any running task would be interrupted and cancelled.

#### 4. Consider rebooting the hosts, starting with the pool master

See below "[When to reboot?](#when-to-reboot)".

### From Xen Orchestra

#### 1. Check prerequisites and precautions above

#### 2. Install the updates

Xen Orchestra can install the patches to all the servers in a pool at once.
[See this blog post](https://xen-orchestra.com/blog/xcp-ng-updates-from-xen-orchestra/#updatesviaxenorchestra).

#### 3. Restart the XAPI toolstack on every host

As explained above in the *From command line* section.

#### 4. Consider rebooting the hosts, starting with the pool master

As a precaution, Xen Orchestra will always tell you that a reboot is required after an update. See below "When to reboot?" to decide whether you want to obey it or not.

## When to reboot?

There is currently no way for XCP-ng to automatically tell you if a reboot is required.

The safest way is to reboot every time an update is installed (*pool master* **first**).

Else base your decision on an educated guess. Look at the list of the updated packages (`yum update` always tells you. If you missed it, see `/var/log/yum.log`) and then decide:
* Was there a kernel update? Reboot. Those are usually security fixes that require a reboot.
* Were `xen-hypervisor` and/or other `xen-*` packages updated? Reboot too.
* Other low-level packages may require a reboot too, for example `glibc`.
* If you don't reboot, check that no task is currently running and restart the XAPI toolstack (`xe-toolstack-restart`).

All updates are announced on [https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing) along with information about what steps are required after installing the update (reboot, toolstack restart, service restart...).

## XCP-ng 7.5/7.6 and live migrations

Since the component that handles live migrations in XenServer is closed-source, we had to write our own. However, it took several tries before we reached a fully functional replacement, that's why only hosts that have had the latest updates of the `xcp-emu-manager` package have the fully working replacement. Previous versions will or will not manage to migrate your VMs, depending on various contextual factors, including the VM's load.

So, if you plan to live-migrate VMs as part of the update process (if some of the installed updates require a reboot of the hosts), then you should do this first to ensure migration will be smooth:

* Install the latest update for `xcp-emu-manager` if there's one, on every host. Either from Xen Orchestra's patch management, or from command line directly on the hosts: `yum update xcp-emu-manager`.
* Restart the XAPI toolstack on each host: `xe-toolstack-restart`. No need to reboot.

Now you can proceed with the rest of the updates and evacuate the hosts one by one (starting with the master) before rebooting it, if the update requires it.
