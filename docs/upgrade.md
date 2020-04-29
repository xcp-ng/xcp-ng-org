# Upgrade

This page details how to upgrade to the latest version of XCP-ng from a previous release. Eg. 7.4 to 7.6 or 8.0 to 8.1.

For updates that don't change the version numbers (bugfixes, security fixes), see [updates section](updates.md).

:::tip
There are 3 upgrade methods, detailed below:
* Using the installation ISO (recommended).
* Using the installation ISO when you can't boot from it: remote upgrade.
* From command line a.k.a. yum-style upgrade. Only for point version upgrades.
:::

## Release Notes & Known Issues

Read the [release notes](currentrelease.md) and [known issues](currentrelease.md#known-issues) for every version that is higher than your current version. They may provide additional instructions for specific situations. Also **please read the following warnings below**:

:::warning
* Always upgrade and reboot the pool master **FIRST**
* DON'T use the `Maintenance Mode` in XCP-ng Center. It moves the pool master to another host, which has to be avoided in the upgrading procedure.
* If HA (High Availability) is enabled, disable it before upgrading.
* Eject CDs from your VMs before upgrading [to avoid issues](https://xcp-ng.org/forum/topic/174/upgrade-from-xenserver-7-1-did-not-work): `xe vm-cd-eject --multiple`.
* [Update your pool with the latest updates](updates.md) **before** upgrading, and reboot or restart the toolstack, depending on the nature of the installed updates.
* [Install the latest updates](updates.md) **after** upgrading.
:::

:::warning
* When upgrading from *XCP-ng 7.5 or lower* or from *XenServer*, **it is very important to make sure clustering is not enabled on your pool**. It's a functionality that relies on proprietary software and that is not available in XCP-ng, and having it enabled before the upgrade will lead to XAPI being unable to start due to unexpected data in the database. If it is enabled or you already upgraded, see [this comment](https://github.com/xcp-ng/xcp/issues/94#issuecomment-437838544).
:::

## Upgrade via installation ISO (recommended)

This is the standard XCP-ng way. With this method, note that you can upgrade by "jumping" versions if you want (eg from 7.5 to 8.0 directly) without needing intermediate upgrade.

It will backup your system to the backup partition and reinstall the system from scratch on the system partition. Your XCP-ng configuration (VMs, storage repositories and so on) is retained.

**Any additional changes made by you to the system will be lost, so you will have to make them again. Including: changes to `/etc`, additional users created and their homes, local ISO SRs...**

Steps:
1. Download an installation ISO from the [download page](https://xcp-ng.org/download/). Choose either the standard installer or the network installer.
2. [Check the authenticity and the integrity of the downloaded ISO](mirrors.md#check-an-iso-image).
3. Follow the installation procedure on the [download page](https://xcp-ng.org/download/).
4. When offered the choice, choose to upgrade your existing XCP-ng installation.
5. After the upgrade completed, reboot your host.
6. Then [install the updates](updates.md) that have been released after the installation ISO was created, and reboot. They can fix bugs and/or security issues.

Once installed, **keep the system regularly updated** (see [updates section](updates.md)).

If you can't boot from the ISO, see the next section.

### Using the installation when you can't boot from it: remote upgrade

This is an alternate method if you can't boot from the installation ISO.

If you do not have access to your server or remote KVM in order to upgrade using the interactive ISO installer, you can initiate an automatic reboot and upgrade process using the following procedure:

* Unpack/extract the XCP-ng ISO to a folder on an HTTP server. Make sure not to miss the hidden .treeinfo file (common mistake if you `cp` the files with `*`).
* Get the UUID of your host by running the below command:
  ```
  xe host-list
  ```
* Using that host UUID, as well as the URL to the folder hosting the unpacked XCP-ng ISO, run the following command to test access:
  ```
  xe host-call-plugin plugin=prepare_host_upgrade.py host-uuid=750d9176-6468-4a08-8647-77a64c09093e fn=testUrl args:url=http://<ip-address>/xcp-ng/unpackedexample/
  ```
  The returned output must be true to continue.
* Now tell the host to automatically boot to the ISO and upgrade itself on next reboot (using the UUID and URL from before):
  ```
  xe host-call-plugin plugin=prepare_host_upgrade.py host-uuid=750d9176-6468-4a08-8647-77a64c09093e fn=main args:url=http://<ip-address>/xcp-ng/unpackedexample/
  ```
  The output should also be true. It has created a temporary entry in the grub bootloader which will automatically load the upgrade ISO on the next boot. It then automatically runs the XCP-ng upgrade with no user intervention required. It will also backup your existing XenServer dom0 install to the secondary backup partition, just like the normal upgrade.
* To start the process, just tell the host to reboot. It is best to watch the progress by using KVM if it's available, but if not, it should proceed fine and boot into upgraded XCP-ng in 10 to 20 minutes.
* Then [install the updates](updates.md) that have been released after the installation ISO was created, and reboot. They can fix bugs and/or security issues.

Note: it has been brought to our attention that [a DHCP server may be necessary during the upgrade](https://xcp-ng.org/forum/topic/2480/unattended-upgrade-requires-dhcp).

Once upgraded, **keep the system regularly updated** (see [Updates Howto](updates.md)).

## From command line

A.k.a. yum-style upgrade.

:warning: **Supported across minor releases (e.g. from 7.4 to 7.6), but not supported across major releases (e.g. from 7.6 to 8.0).** :warning:

Though it's been successfully tested by numerous people, this method is still considered *riskier* than using the installation ISO:
- this upgrade method **does not create a backup of your system**, unlike an upgrade via the installation ISO, so there's no possible return to the previous version (unless reinstalling it from scratch and reconfiguring it).
- there are more things that can go wrong when you upgrade lots of packages one by one than when you reinstall from scratch (which is what the installation ISO does, without losing your data of course).
- additional packages installed by the user on the system from CentOS, EPEL or third party repositories can sometimes make the upgrade fail.

On the plus side, it's a lot *faster* provided you have a decent internet connection or a local mirror, and changes you have made to the host are retained.

Once upgraded, **keep your system regularly updated** (see [Updates Howto](updates.md)) until the next upgrade.

### Prerequisites

#### Access to the repository (obviously)

Your dom0 system must either have access to updates.xcp-ng.org, or to a local mirror. In the second case, make sure to update the `baseurl` values in `/etc/yum.repos.d/xcp-ng.repo` to make them point at the local mirror, and keep the mirror up to date, of course.

#### Be cautious with third party repositories and packages

If you have enabled third party repositories (CentOS, EPEL...) in the past, make sure to **disable** them before updating. Otherwise, core packages from your dom0 system can be overwritten with versions of packages that have not been tested in the context of XCP-ng, or lack specific patches.

Set `enabled=0` in the relevant files in `/etc/yum.repos.d/`. Warning: when added, the EPEL repository is automatically enabled. Make sure to disable it right away and use this syntax instead to install anything from it: `yum install packagename --enablerepo='epel'`.

In any case, installing extra packages from outside the XCP-ng repositories can lead to various issues, including update or system upgrade problems, so make sure to:
* install only packages that are known not to have any adverse effect on XCP-ng (when in doubt, [ask on the forum](https://xcp-ng.org/forum/) or check with your [pro support](https://xcp-ng.com/));
* check the dependencies pulled by such packages: they must not overwrite existing packages in XCP-ng;
* know that you are doing it at your own risk and be prepared to fix any issues that would arise, especially unforeseen upgrade issues (we can't test upgrade scenarios where unknown packages are installed on the system).

More at [Additional packages](additionalpackages.md).

#### Precautions

The [precautions that apply to regular updates](updates.md#precautions) also apply to the upgrade process.

Check them carefully.

#### Upgrade instructions

If for some reason you want to upgrade to the unsupported XCP-ng 7.6 from an earlier release, see [Yum Upgrade towards XCP ng 7.6](https://github.com/xcp-ng/xcp/wiki/Yum-Upgrade-towards-XCP-ng-7.6).

:warning: **Proceed one host at a time. Do not `yum update` all hosts at once to "save time".** :warning:

:warning: **ALWAYS START WITH THE POOL MASTER.** :warning:

Let's start: open a terminal to your XCP-ng server, as root.

#### 0. Migrate the VMs to another host or shutdown or suspend them

#### 1. Download and verify the yum `.repo` file
We will download the repository file that will tell yum where to download the packages from, and we will verify its authenticity and its integrity.

* Define the target version, replacing X and Y as appropriate:
  ```
  export VER=X.Y
  ```

  Example:
  ```
  export VER=8.1
  ```

In the commands below your shell will automatically replace `$VER` with the value that you defined.

* Download the files
  ```
  # the repository file
  wget https://updates.xcp-ng.org/8/xcp-ng-$VER.repo -O xcp-ng-$VER.repo
  # sums and signatures to verify it
  wget https://updates.xcp-ng.org/8/SHA256SUMS -O SHA256SUMS
  wget https://updates.xcp-ng.org/8/SHA256SUMS.asc -O SHA256SUMS.asc
  ```
* Follow the steps to [check the integrity and origin of the repository file](mirrors.md#check-a-downloaded-file) (optional)
* Install the verified repository file so that yum uses it.
  ```
  cp xcp-ng-$VER.repo /etc/yum.repos.d/xcp-ng.repo
  # help yum taking the change into account immediately
  yum clean metadata
  ```

#### 2. Upgrade the system's packages

```
yum update
```

#### 3. Check the configuration files
When `rpm` needs to update configuration files that you had modified previously, there's a conflict of changes. There exists two strategies:
* either keep your file and write the new configuration file as `yourfile.rpmnew`.
* or overwrite your file with the new one and save it as `yourfile.rpmsave`.
For a given configuration file, only one of those can be created, depending on whether the RPM defines that it's more important to keep the user configuration or to put the new configuration in place. If you haven't made any change to the configuration file or the RPM does not bring any change during the update, then neither will be created.

So, after an upgrade using `yum`, you need to look for `.rpmnew` and `.rpmsave` files, update the related configuration files accordingly if needed, and delete those `.rpmnew` and `.rpmsave` files in order to keep things clean for when you will need to do this again after the next upgrade.
If you haven't modified configuration files that `rpm` wants to update, there will be nothing to do.

/!\ There is an exception: always ignore the `/etc/cron.d/logrotate.cron.rpmsave` file. Citrix team named that file this way so that it is ignored by cron. It is used only with legacy partitioning, where no `/var/log` partition exists, and triggers a very aggressive log rotation. Leave it alone.

```
# Find conflicting configuration files, excluding logrotate.cron.rpmsave
find /etc \( -name "*.rpmnew" -or -name "*.rpmsave" ! -name "logrotate.cron.rpmsave" \)
```

#### 4. Reboot the host


## Upgrade from XenServer

See the [dedicated Wiki section](https://github.com/xcp-ng/xcp/wiki/Upgrade-from-XenServer).

## Migrate VMs from older XenServer/XCP-ng

### Live migration

Live migration **should work** from any older XenServer/XCP-ng toward the latest release. However, there's some cases where it doesn't. For example, XenServer (and XCP-ng) 7.6 has a regression that makes live migration with storage motion crash guests that are based on the "Other installation media" template when the source host has a version lower than 7.6 ([reported here to Citrix](https://bugs.xenserver.org/browse/XSO-924)). But **this bug has been fixed in latest XCP-ng 7.6 updates**.

### Alternative VM migration solutions

* clone/copy your VM before trying to live migrate. In case it fails, you won't have any surprise
* offline migration is the safest if you can afford VM downtime
* an hybrid solution is to use Xen Orchestra continous replication to avoid downtime
* restore Xen Orchestra backup on latest XCP-ng version will also work

