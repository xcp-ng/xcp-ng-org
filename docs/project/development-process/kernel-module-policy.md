# Kernel module policy

Our policity about kernel modules.

In XCP-ng, there is only one version of the kernel that is supported at a given time. There's also an [alternate kernel](../../../installation/hardware#-alternate-kernel) available for troubleshooting. The policy differs whether the kernel modules are for XCP-ng's supported kernel or for an alternate kernel.

## What are kernel modules?
See [https://en.wikipedia.org/wiki/Loadable_kernel_module](https://en.wikipedia.org/wiki/Loadable_kernel_module)

They can be loaded (or unloaded) dynamically into the kernel to provide more functionality: device drivers, filesystem drivers, etc.

## Definitions: supported modules, alternate modules, additional modules

A base installation of XCP-ng comes with:
* a Linux kernel (the `kernel` RPM), including lots of modules already,
* several kernel modules packaged as separate RPMs (example: `broadcom-bnxt-en` for the `bnxt_en` kernel module). Most of those are drivers for hardware devices. Those RPMs either provide drivers that are not included in the base kernel, or updated versions. They are pulled as dependencies of the `vendor-drivers` RPM. Those packages that are installed by default will be designated as **supported modules** in what follows.

Through our RPM repositories (configured by default on the hosts for `yum` to install from them), we may also provide:
* **official updates** for **supported modules**
* **alternate modules**, which are alternate versions of the officially supported modules. The supported modules can either be built-in kernel modules or modules provided through supported separate RPMs such as the `qlogic-netxtreme2` RPM. Their name is usually the same as the package they override, with an added `-alt` suffix (example: `broadcom-bnxt-en-alt`). Alternate versions can be installed for better support of recent hardware or in the hope that bugs in the supported drivers have been fixed in newer versions. They won't remove the supported drivers from the system, but the kernel will load the alternate ones instead. **Warning**: *they receive less testing than the supported modules*.
* **additional (or "extra") modules** for **additional features** (can be experimental). Example: `kmod-zfs-4.4.0+10` for ZFS support in the `4.4.0+10` kernel, or `ceph-module` for CephFS support. To know whether such a module is experimental or is fully supported, read its description or search the wiki.

## Module Updates

This section discusses the kind of updates kernel modules can receive during the maintenance cycle of a given release of XCP-ng (e.g. XCP-ng 8.2). For information about the general update process, see [Updates Howto](../../../management/updates).

Updates for *supported modules* are offered automatically when one updates their host. In order to avoid risks of regression, they are usually only updated if there's an important bug to fix, or a security issue with them... Until the next upgrade of XCP-ng.

Updates for *alternate modules* are offered only if the given alternate modules are installed on the host. We may update to a newer version of the modules at any time, so use them if you believe that for your hardware or system, *newer is better* even if that means that their version changes from time to time.

Updates for *additional modules* are offered only if the given additional modules are installed on the host. We may update them to a newer version of the module at any time - more likely if the module is considered experimental, less likely if it's supported officially.

## Module package naming conventions

We'll now discuss naming conventions for packages that provide kernel modules. This is mostly targeted at packagers, but can also be useful to users who wish to understand the naming schemes. We've tried to make it simple and to use meaningful naming conventions, but legacy and the variety of situations led to a mixed result, so hold on!

### Supported or additional module RPMs

Both supported modules and additional modules share the same package naming schemes.

#### Vendor driver RPMs inherited from XenServer

Those are packages that are pulled by the `vendor-drivers` RPM.

Inherited from XenServer, the naming convention is `{vendor}-{module-name}`. Example: `bnxt_en.ko` => `broadcom-bnxt-en`. Note that the underscore character in the `bnxt_en.ko` driver gets replaced by a dash in the RPM name: `bnxt-en`. And `.ko` is omitted. Another accepted scheme if unambiguous, also inherited from XenServer, is `{vendor}-{device-name}`, for example `qlogic-netxtreme2`.

Only supported modules are in this case.

#### Common case

The modules whose name does not come from XenServer RPMs follow this base naming scheme:

`{module-name}-module`.  Example: `ceph.ko` => `ceph-module`.

If the RPM contains several modules (to be avoided), then find an unambiguous name and add the `modules` suffix:

`{unambiguous-name}-modules`. No example available at the day of writing.

#### Exceptions: `kmod` packages

When we import third-party RPMs that build kernel modules, we may choose to keep the original names in order to minimize spec file changes. Examples that fall in that category: `kmod-zfs-{kernel_version}` and `kmod-spl-{kernel_version}`. Their name depends on the version of the kernel. In XCP-ng 8.2, they are named `kmod-zfs-4.19.0+1` and `kmod-spl-4.19.0+1`.

### Alternate modules

Alternate modules (see their definition at the beginning of this document) can either override a built-in module or one that is provided as a separate *supported* or *additional* module RPM.

Alternate module packages that override a built-in kernel module will follow the "common case" convention described above for supported or additional modules, but we'll add `-alt` at the end of the name:

`{module-name}-module-alt`. Example: `ceph-module-alt` (fictitious).

Alternate module packages that override a supported or additional module are named after the package whose module they override, with a `-alt` suffix:

`{original-name}-alt`.

Examples:
* `broadcom-bnxt-en-alt`
* `tn40xx-module-alt` (fictitious)

## Versioning of the RPMs

Since we only support one version of the kernel, we don't need to include the kernel version in the package name in addition to the module version. So the `Version` tag of the RPM is that of the module.

Example: `broadcom-bnxt-en-alt-1.9.2-5.xcpng.x86_64.rpm` is the `bnxt_en` module in version 1.9.2.

Another case is when we backport a module from a newer kernel but the module itself has no version. In this case, then we'll use the version of the kernel it is coming from as the module version.

Example `ceph-module-4.4.176` is a version of the `ceph` module extracted from kernel 4.4.176 and provided as an additional module for the currently supported kernel (4.4.0+10 at the time of writing).

Exceptions: the abovementioned `kmod`-packages such as `kmod-zfs-4.4.0+10-0.7.11-1.el7.centos.x86_64.rpm` include the kernel version in the name. In this example the kernel version is `4.4.0+10` and the module version is `0.7.11`.

## Where the modules are installed on the system

Intended mostly for packagers, this section can also be useful to users.

Kernel modules can be present in several places. In XCP-ng, we use the following:
* **built-in modules** are in a subdirectory of `/usr/lib/modules/{kernel_version}/kernel`
* `/lib/modules/{kernel_version}/updates` is reserved for:
  * driver RPM packages inherited from XenServer (e.g. `broadcom-bnxt-en`)
  * official updates of kernel built-in modules if those updates are provided as separate RPMs instead of a kernel update.
* additional modules are installed in `/lib/modules/{kernel_version}/extra`
* alternate optional versions of the default modules are installed in `/lib/modules/{kernel_version}/override`. This is not a standard directory for modules, so we alter the configuration of `depmod` to give the priority to modules in this directory. See "`depmod` configuration for alternate modules" below.

We can have up to three versions of the same module on the system, one from the kernel, one from XCP-ng's set of supported or additional modules, and one alternate modules that overrides both:
```
/usr/lib/modules/4.4.0+10/kernel/drivers/net/ethernet/broadcom/bnxt/bnxt_en.ko
/usr/lib/modules/4.4.0+10/updates/bnxt_en.ko
/usr/lib/modules/4.4.0+10/override/bnxt_en.ko
```

### `depmod` configuration for alternate modules

With `depmod`'s default configuration, the `/usr/lib/modules/{kernel_version}/override/` directory is not taken into account. We need to modify its configuration so that modules we install in the `override` directory are preferred.

**Since XCP-ng 8.0**, this is done automatically at installation time, by modifying `/etc/depmod.d/dist.conf`.

The default configuration is:
```
# override default search ordering for kmod packaging
search updates extra built-in weak-updates
```

And becomes:
```
# override default search ordering for kmod packaging
search override updates extra built-in weak-updates
```

This makes `depmod` search in the `override` module directory before trying other module directories, for all modules.

## How to use alternate or additional modules

First, a warning: alternate modules and additional modules are provided as a convenience, but they do not get the same amount of testing as the modules that are installed by default or through updates. So keep that in mind, test, and be ready to uninstall them if any issue arises.

### How to find alternate or additional modules

#### List available alternate modules
You can list the available RPMs for alternate modules with the command below, that will search for packages whose name ends in `-alt`. Only packages that are not currently installed or have an available update will be listed.
```
yum list available | grep -e '-alt.x86_64'
```

#### List available additional modules
You can list the available RPMs for alternate modules with the command below, that will search for packages whose name ends in `-module`, or begins with `kmod-` and contains the current kernel version. Only packages that are not currently installed or have an available update will be listed.
```
yum list available | grep -e '-module.x86_64' -e '^kmod-.*-'$(uname -r)
```

#### Get more information about a package

To get more information about one of the listed packages, use `yum info`:
```
yum info {package-name}
```

### How to install
```
yum install {package-name}
```

Installing the RPM will make the module available and give it priority in most cases. It will not unload any version that is already running on your system (check with `lsmod`) if there's one, nor load the new one. This is normal. Do **not** remove the RPM that contains the supported module. The chain of dependencies would lead you to remove the `xcp-ng-deps` meta package, which is necessary for updates and upgrades.

Check that the new module has been taken into account by `depmod`: `modinfo {module_name}`, e.g. `modinfo bnxt_en`. It gives the path to the module and its version.

Example output:
```
filename:       /lib/modules/4.4.0+10/override/bnxt_en.ko
version:        1.9.2-214.0.150.0
description:    Broadcom BCM573xx network driver
license:        GPL
[...]
```

If the module is expected to be loaded automatically at boot, **reboot** to check that it does. Look at the output of `dmesg` for messages indicating that the appropriate version of the module was loaded.

### How to load the new module without a reboot

As we said, if the module is expected to load at boot, we advise to reboot ultimately. However, you may want to test the driver before rebooting. Or maybe it's a driver that is not supposed to be loaded manually.

**Unload the running module if there's one**

When there's already a version of the module running, there is no way to load a new driver without unloading the old one, so be prepared for issues to arise if the module is in use for important tasks (disks, network, ...).

Now that you've been warned:
```
modprobe -rv {module_name}
```

**Load the new module**
```
modprobe -v {module_name}
```

### How to remove an additional or an alternate module

```
yum remove {package-name}
```

In the case of an alternate module, we have made it so that you can simply uninstall the RPM and the base supported module will get used instead at next reboot or manual unload/reload of the module. After uninstalling the RPM, follow the same steps as when you installed it (described above): `modinfo`, reboot, check `dmesg`...

In the case of an additional module, uninstalling the RPM will simply leave your system without that module, but shouldn't remove it from the currently loaded modules until next reboot or until you unload it.

## Kernel modules for alternate kernels

The policy for [alternate kernels](../../../installation/hardware#-alternate-kernel) is simpler, because there are no alternate modules (with the meaning of *alternate modules* as described earlier). There's just the kernel's built-in modules and possibly additional or updated modules in `/lib/modules/{kernel_version}/updates`. This means that when an alternate kernel is updated, people who have installed it will get the update through the standard updates process. There's no support for cherry-picking specific versions of previous packages we may have released in the past. If there's a bug, please open a bug report. To avoid bugs, please take part in the testing phase.

RPMs that provide modules for an alternate kernel must follow these conventions:
* The name must always end with `-kernel{MAJOR.MINOR}` (we don't include the patch version because we won't provide two competing kernel packages for the same MAJOR + MINOR versions).
* The remaining part of the naming convention is the same as that of packages that provide modules for the main supported kernel:
  * `{inherited-name-from-XS}-kernel{MAJOR.MINOR}`
  * `{name}-module-kernel{MAJOR.MINOR}`
  * "kmod" packages
* Modules are installed in `/lib/modules/{kernel_version}/updates` or `/lib/modules/{kernel_version}/extra` whether they are updates for built-in modules (if that situation happens) or additional packages.
* `Requires` the appropriate alternate kernel package.
