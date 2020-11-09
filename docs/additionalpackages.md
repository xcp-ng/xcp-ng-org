# Additional packages

The controller domain (dom0) is a privileged Linux VM, based on CentOS.

It may be useful to add more packages to it, with precaution. The XCP-ng project offers some in its repositories, and other packages can be installed from CentOS, EPEL, or even third party repositories.

## Rules

### 1. Never enable additional repositories

The [update process](updates.md) for XCP-ng assumes that **only XCP-ng repositories are enabled**. If you enable more repositories, updates may get pulled from there and overwrite XCP-ng packages and thus **break your system**.

**Warning**: some third party repositories are auto-enabled when installed. This is the case of EPEL, for example. Installing `epel-release` (the common way to enable it on CentOS) will automatically enable it. To solve this, EPEL repositories are added at system installation since XCP-ng 8.0, but they are *disabled*.

*But then, how to install from such additional repositories?*

You simply need to learn `yum`'s `--enablerepo` switch. Very handy, it enables one or more repositories **only for the current execution of the command**, without enabling the repo system-wide.

See section *How to install* below for practical details.

To disable a repository, edit `/etc/yum.repos.d/name_of_repo.repo` and set `enabled=0` where the value is `1`.

### 2. Prefer additional packages from XCP-ng's own repositories

We offer a number of additional packages ranging from ZFS support, [newer drivers](hardware.md#alternate-drivers) or [newer kernel](hardware.md#alternate-kernel), to small utilities such as `vim`, `joe`, `iperf`, `mc`, etc.).

A list of such utilities is available at <https://github.com/xcp-ng/xcp/issues/56#issuecomment-480337976>. It is a wishlist from the community. The "action" column will tell you if the utility is available in XCP-ng repositories.

Packages installed from our repositories are:
* tested
* maintained (security/bugfix updates)

:::warning
Anything installed from outside XCP-ng repositories is at your own risk
:::

### 3. Do not overwrite existing packages from the system

Some repositories contain packages that have a higher version number than ours. `yum` will tend to want to install them over our packages. Always check that it is not trying to overwrite on of our packages.

### 4. Keep your dom0 minimal

The controller domain is not an all-purpose Linux system. It must remain minimal to do what it is meant to do efficiently.
* Avoid bloat (do not attempt to transform it into a Linux workstation. Use a VM instead.)
* Avoid CPU or RAM-intensive programs
* Avoid software that pulls in many dependencies
* Avoid any software that may interfere with the existing

### 5. Ask before

If you have [pro support](https://xcp-ng.com), ask there. As part of the support, additional supported packages may be provided. Else ask the community on the [forum](https://xcp-ng.org/forum/).

## How to install

Before doing any change, start keeping track somewhere of any change you bring to the system. This will help for:
* support
* knowing what packages you need to update regularly for security fixes or bugfixes
* reinstalling them after a system upgrade via the installation ISO

### From XCP-ng repositories

`yum install name_of_package`

### From CentOS repositories

The CentOS repos are already installed but are disabled, on purpose. Install from them with:
```
yum install name_of_package --enablerepo=base,updates
```

Make sure it will not try to overwrite system packages with updates from CentOS. XCP-ng uses fixed or modified versions of some CentOS packages whereas the CentOS repos point at the latest.

### From EPEL repositories

On XCP-ng 8.0, the EPEL repos are already installed but are disabled, on purpose. Install from them with:
```
yum install name_of_package --enablerepo=epel
```

Sometimes you'll need extra dependencies from CentOS. Replace the command with:
```
yum install name_of_package --enablerepo=epel,base,updates
```

And as above make sure no package from the system will get overwritten in the process.

On XCP-ng 7.6:
* `yum install epel-release --enablerepo=extras`
* then edit `/etc/yum.repos.d/epel.repo` and set `enabled=0`
* then `yum install name_of_package --enablerepo=epel`

### From other third party repositories

1. Avoid that if possible
2. Be extra cautious
3. After installing the repository, disable it right away (`enabled=0` in repo file)
4. install packages with: `yum install name_of_package --enablerepo=name_of_repo`

And as usual make sure it won't overwrite existing packages...

## Up to date additional packages

If you installed from XCP-ng repositories, [they will be updated like the rest of the XCP-ng system](updates.md).

If you installed from any other repository, including CentOS and EPEL, you need to update them (and their dependencies) manually

## System upgrade

See [upgrade section](upgrade.md) for a discussion of the differences between "Installer upgrade" and "`yum`-style upgrade".

Installer upgrade will reinstall the system from scratch and just keep your configuration related to XCP-ng (network, VMs, SRs, etc.). Anything else will have to be re-done.

`yum-style` upgrade will try to update or keep the packages that you installed. Packages installed from XCP-ng repositories should get updated seamlessly. Packages from other repositories will not get updated: they may be left in place (then you'll have to update them yourselves if needed), removed (due to package conflicts or because they are obsoleted by packages from the updated XCP-ng) or even make the upgrade fail until they are manually removed.