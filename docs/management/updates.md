---
sidebar_position: 3
---

# Updates

This page details how to keep your XCP-ng system updated (bug fixes and security fixes) between [upgrades](../../installation/upgrade).

## ⚡ Quick start

If you want to manage your XCP-ng updates, we suggest that you use Xen Orchestra. It's the fastest & easiest way to keep your infrastructure up-to-date. See the [dedicated section](updates.md#from-xen-orchestra). If you want to learn more about Xen Orchestra, also check the [management section](management.md).

:::info
All our updates are explained in details inside a dedicated blog post. Don't forget to visit https://xcp-ng.org/blog or to directly explore all articles with the tag updates: https://xcp-ng.org/blog/tag/update/
:::

## ♻️ Support cycle

We maintain one or several releases in parallel:
* LTS releases (currently `8.3`).
* Non-LTS releases, which receive rolling updates (currently none, as `8.3` is now a LTS).

If your version is lower than `8.3`, it will not receive updates anymore. To keep benefiting from bugfixes and security fixes you need to [upgrade](../../installation/upgrade).

## ℹ️ Prerequisites

### Access to the repository

Your dom0 system must either have access to the internet, or to a local mirror. In the second case, make sure to update the `baseurl` values in `/etc/yum.repos.d/xcp-ng.repo` to make them point at the local mirror, and keep the mirror regularly synced.

#### Proxy configuration

If your hosts require a proxy to access the repositories, you have several options depending on your needs:

For all yum repositories:
- Set `proxy=<proxy_url>` in the `[main]` section of `/etc/yum.conf`

For specific repositories:
- Set `proxy=<proxy_url>` in the relevant repository section within files located in `/etc/yum.repos.d`

Set a system-wide proxy that will be used for everything, not only yum:
- Export the `http_proxy` and `https_proxy` variables in `/etc/environment`:
```bash
export http_proxy=<proxy_url>
export https_proxy=<proxy_url>
```

:::warning
These changes will be remain intact through standard updates, but they will be lost if you upgrade to a new major version.
:::

### Be cautious with third party repositories and packages

If you have enabled third party repositories (CentOS, EPEL...) in the past, make sure to **disable** them before updating. Otherwise, core packages from your dom0 system can be overwritten with versions of packages that have not been tested in the context of XCP-ng, or lack specific patches.

Set `enabled=0` in the relevant files in `/etc/yum.repos.d/`. Warning: when added manually, the EPEL repository is automatically enabled. Make sure to disable it right away and then use this syntax to install packages from it: `yum install packagename --enablerepo='epel'`.

In any case, installing extra packages from outside the XCP-ng repositories can lead to various issues, including update or system upgrade problems, so make sure to:
* install only packages that are known not to have any adverse effect on XCP-ng (when in doubt, [ask on the forum](https://xcp-ng.org/forum/));
* check the dependencies pulled by such packages: they must not overwrite existing packages in XCP-ng;
* know that you are doing it at your own risk and be prepared to fix any issues that would arise, especially unforeseen upgrade issues (we can't test upgrade scenarios where unknown packages are installed on the system).

More at [Additional packages](../../management/additional-packages).

## 💡 Get information about the updates

Every update is first tested and discussed on a forum thread dedicated to update candidates for a given XCP-ng release. We highly recommend to subscribe to these threads (activate e-mail notifications in your forum settings if you want to be notified of new messages). You will thus know about coming updates in advance and be able to help us validate them. No one would like updates to be delayed because of lack of feedback there.

* [XCP-ng 8.3 updates announcements and testing](https://xcp-ng.org/forum/topic/9964/xcp-ng-8-3-updates-announcements-and-testing)

Important updates - especially security updates - are announced [on the blog](https://xcp-ng.org/blog/) and the most important ones are also announced through [the newsletter](https://xcp-ng.us13.list-manage.com/subscribe?u=f1ab72021fb8816f4d5e72773&id=4d17393549).

A comprehensive list of updates is available on our build system's web interface. Click the package names for details:

#### Updates for XCP-ng 8.3

* [List of official **updates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=65&order=-build_id&latest=1)
* [List of immediate **update candidates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=91&order=-build_id&latest=1)
* [List of **testing** packages prepared for a future update](https://koji.xcp-ng.org/builds?inherited=0&tagID=66&order=-build_id&latest=1)

#### Updates for XCP-ng 8.2

:::note
XCP-ng 8.2 is EOL. This 8.2-specific information is retained solely to assist with the transition from 8.2 to a supported release.
:::

* [List of official **updates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=42&order=-build_id&latest=1)
* [List of immediate **update candidates**](https://koji.xcp-ng.org/builds?inherited=0&tagID=89&order=-build_id&latest=1)
* [List of **testing** packages prepared for a future update](https://koji.xcp-ng.org/builds?inherited=0&tagID=43&order=-build_id&latest=1)

## 🚸 Precautions

* Disable HA during the whole update process to avoid accidental fencing (automatically handled by [Xen Orchestra RPU](updates.md#from-xen-orchestra))
* Avoid applying updates while XAPI tasks are running (`xe task-list`).
* Some updates may probe SCSI devices. If your devices are sensitive to that kind of thing, plug them off before updating (see [this unfortunate story](https://github.com/xcp-ng/xcp/issues/232) of dead tape robots).
* As a precaution, it may be a good idea to disconnect passed-through devices before applying the update.
* If a reboot is required and you want to avoid downtime, you will probably move your VMs from host to host. One common mistake (favoured by the default values in some VM templates) is to give a VM a very low dynamic minimum RAM value. XCP-ng will reduce the VMs total RAM to that dynamic minimum during the live migration. If the limit is too low, this may lead to killed processes or even a crashed system inside the VM due to the memory pressure, thus requiring a reboot of the VM.
* If among the to-be-updated packages you see `xcp-ng-pv-tools`, make sure to unmount the guest tools ISO from all running VMs before the update (it is done automatically during the update for VMs that are turned off). If the guest tools are still mounted at the time of the update, the VDI will point at a non-existing ISO image after the update. The VMs that have that VDI mounted will then fail to migrate or restart due to the missing VDI.
*Some people systematically run `xe vm-cd-eject --multiple` to eject all virtual CDs/DVDs from the VMs before updating and/or migrating.*
* Do not update from an interactive shell that was directly started from the XCP-ng console (`xsconsole`), nor from the host's remote console that is available through the VNC protocol in Xen Orchestra or XCP-ng Center. The update process may restart those, kill the current shell and thus kill the update process which would leave the system in an unclean state (duplicate RPMs).

## 🦮 How to apply the updates

### From command line

#### 1. Before install

Check prerequisites and precautions above.

#### 2. Additional steps regarding XOSTOR SRs

LINSTOR expects that we always use satellites and controllers with the same version.
Without precautions and after a reboot of a just updated host, it's possible that a machine can no longer communicate with other hosts through LINSTOR satellites.

To avoid problems, it is strongly recommended to update all satellites, controllers packages of each host without rebooting:
```
yum update linstor-satellite linstor-controller
```

After updating all hosts without reboot:
```
systemctl stop linstor-controller # "stop" is not a typo, it will auto restart the controller.
systemctl restart linstor-satellite
```

Then you can follow the next CLI instructions to manually update the pool.

#### 3. Install the updates

Run this on each server, starting with the pool master:
```
yum update
```

#### 4. Restart the XAPI toolstack on every host

```
xe-toolstack-restart
```
This way some changes are taken into account without even rebooting. Even if you plan to reboot, it's good to do this first to avoid live migration issues that could happen in some cases during the update process. Start with the pool master. Check that no task is currently running (`xe task-list`) before restarting the toolstack. Any running task would be interrupted and cancelled.

#### 5. Consider rebooting the hosts, starting with the pool master

See below "[When to reboot?](#-when-to-reboot)".

### From Xen Orchestra

If you are using a pool with at least 2 hosts and a shared storage, you can rely on the "Rolling Pool Update" feature, doing all the heavy lifting for you. Alternatively, you can update hosts individually.

#### Rolling Pool Update (RPU)

Also known as RPU, **this is the advised way to update your pool**. By just clicking on one button, Xen Orchestra will automatically move VMs around, apply updates and reboot the hosts, without any service interruption. The following button is available in the Pool view, on "Patches" tab:

![XO's Rolling Pull Update button.](../../assets/img/rpubutton.png)

:::info
This powerful and fully automated mechanism requires some prerequisites: all your VMs disks must be on a one (or more) shared storage. Also, high-availability will be automatically disabled, as the XO load balancer plugin and backup jobs. Everything will be enabled back when it's done!
:::

##### XOSTOR support

Rolling Pool Updates (RPUs) can now handle pools that utilize XOSTOR. If there is no LINSTOR Storage Repository (SR), the RPU proceeds as usual. However, if a LINSTOR SR is present, and the prerequisites below are met, the update process includes additional steps to ensure compatibility before performing the standard rolling update.

:::warning

**Prerequisites**

Rolling Pool Updates (RPUs) can handle pools that utilize XOSTOR, if:

- your host uses `xcp-ng-xapi-plugins-1.12.0` or a later version.\
    To verify your XAPI plugins version, run `rpm -q xcp-ng-xapi-plugins` on your host.
- XO is on version 5.105 or later

**What about older versions?**

What happens with older versions of the XAPI plugins is that, after rebooting a recently updated host, it might no longer be able to communicate with other hosts through LINSTOR satellites. In fact, LINSTOR expects that we always use satellites and controllers with the same version.

To avoid problems, it is strongly recommended to update the satellites, controllers packages of each host without rebooting:
```
yum update linstor-satellite linstor-controller
```

After updating all hosts without reboot:
```
systemctl stop linstor-controller # "stop" is not a typo, it will auto restart the controller.
systemctl restart linstor-satellite
```

Then you can follow the instructions in the documentation to manually update the pool.
:::

![XO's pool Patches tab showing the Rolling pool update button being clicked on.](../../assets/img/rpu1.png)

#### Pool updates

If you can't use RPU (Rolling Pool Updates), you can still use "Install pool patches" button. This will simply install updates on all hosts on your pool and restart the toolstack, **without doing any host reboot**:

![XO's Install pool patches buton.](../../assets/img/updatebutton.png)

:::info
Restarting the toolstack won't have any impact on your running VMs. However, **most updates will require a reboot** to be applied, that you should execute during a scheduled maintenance.
:::

You can see hosts that will require a reboot via a small blue triangle:

![Hosts list, some with an exclamation mark icon, mouse over one of them showing the popup "Reboot to apply updates".](../../assets/img/xo5patching.png)

#### Host updates

:::warning
We do NOT recommend to install updates to individual hosts. Obviously except if they are alone in their own pool. Running hosts in the same pool with different level of updates should be avoided as possible. We leave that option in case you have a specific need, but again, we discourage that usage as possible. Note that even a host alone in its pool can be updated via the "Pool update" button!
:::

## 🏁 When to reboot?

There is currently no way for XCP-ng to automatically tell you if a reboot is required.

The safest way is to reboot every time an update is installed (*pool master* **first**).

Else base your decision on an educated guess. Look at the list of the updated packages (`yum update` always tells you. If you missed it, see `/var/log/yum.log`) and then decide:
* Was there a kernel update? Reboot. Those are usually security fixes that require a reboot.
* Were `xen-hypervisor` and/or other `xen-*` packages updated? Reboot too.
* Other low-level packages may require a reboot too, for example `glibc`.
* If you don't reboot, check that no task is currently running and restart the XAPI toolstack (`xe-toolstack-restart`).

All updates are announced on [https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing) along with information about what steps are required after installing the update (reboot, toolstack restart, service restart...).

## 🔥 XCP-ng 7.5/7.6 and live migrations

Since the component that handles live migrations in XenServer is closed-source, we had to write our own. However, it took several tries before we reached a fully functional replacement, that's why only hosts that have had the latest updates of the `xcp-emu-manager` package have the fully working replacement. Previous versions will or will not manage to migrate your VMs, depending on various contextual factors, including the VM's load.

So, if you plan to live-migrate VMs as part of the update process (if some of the installed updates require a reboot of the hosts), then you should do this first to ensure migration will be smooth:

* Install the latest update for `xcp-emu-manager` if there's one, on every host. Either from Xen Orchestra's patch management, or from command line directly on the hosts: `yum update xcp-emu-manager`.
* Restart the XAPI toolstack on each host: `xe-toolstack-restart`. No need to reboot.

Now you can proceed with the rest of the updates and evacuate the hosts one by one (starting with the master) before rebooting it, if the update requires it.
