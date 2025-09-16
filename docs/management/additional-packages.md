---
sidebar_position: 4
---

# Additional packages

The controller domain (dom0) is a privileged Linux VM, part of which is compatible with RHEL/CentOS packages.

It may be useful to add more packages to it, with precaution. The XCP-ng project offers some in its repositories, and other packages can be installed from CentOS, EPEL, or even third party repositories, but at the user's own risks.

:::note
Best effort support is provided for additional packages provided by the XCP-ng project. No support is provided for other additional packages, even if installed from our repositories, as they contain build dependencies not supposed to be installed in production.
* [supported list for XCP-ng 8.3](http://reports.xcp-ng.org/8.3/extra_installable.txt)
:::

## 📜 Rules

### 1. Never enable additional repositories

The [update process](../../management/updates) for XCP-ng assumes that **only XCP-ng repositories are enabled**. If you enable more repositories, updates may get pulled from there and overwrite XCP-ng packages and thus **break your system**.

**Warning**: some third party repositories are auto-enabled when installed. This is the case of EPEL, for example. Installing `epel-release` (the common way to enable it on CentOS) will automatically enable it. To avoid this, EPEL repositories are already added at system installation on XCP-ng, but they are *disabled*.

*But then, how to install from such additional repositories?*

You simply need to learn `yum`'s `--enablerepo` switch. Very handy, it enables one or more repositories **only for the current execution of the command**, without enabling the repo system-wide.

See section *How to install* below for practical details.

To disable a repository, edit `/etc/yum.repos.d/name_of_repo.repo` and set `enabled=0` where the value is `1`.

### 2. Prefer additional packages from XCP-ng's own repositories

We offer a number of additional packages ranging from ZFS support, [newer drivers](../../installation/hardware#-alternate-drivers) or [newer kernel](../../installation/hardware#-alternate-kernel), to small utilities such as `vim`, `joe`, `iperf`, `mc`, etc.).

A regularly updated list of such utilities is available at [http://reports.xcp-ng.org/8.3/extra_installable.txt](http://reports.xcp-ng.org/8.3/extra_installable.txt) for XCP-ng 8.3.

The packages from this list are supported on a best-effort basis.

The repositories are already enabled by default. Install with `yum install name_of_package`. For example: `yum install zfs`.

In some cases, packages may be listed in the above list but not available yet in the default repositories. This means they are still undergoing tests and reside in the `xcp-ng-testing` repository. If you want to test them, add `--enablerepo=xcp-ng-testing` to the installation command.

:::warning
Anything installed outside this list of packages is at your own risk, even if that comes from XCP-ng repositories.
:::

### 3. Do not overwrite existing packages from the system

Some third party repositories - including CentOS repositories and EPEL - contain packages that have a higher version number than ours. `yum` will tend to want to install them over our packages. Always check that it is not trying to overwrite one of our installed packages.

### 4. Keep your dom0 minimal

The controller domain is not an all-purpose Linux system. It must remain minimal to do what it is meant to do efficiently, and also to ensure that every component installed receives relevant security fixes.
* Avoid bloat (do not attempt to transform it into a Linux workstation. Use a VM instead.)
* Avoid CPU or RAM-intensive programs
* Avoid software that pulls in many dependencies
* Avoid any software that may interfere with the existing
* Avoid software that widens the attack surface on your hosts

### 5. Known Security Risks in additional packages

:::tip
Additional packages are not meant to be in the base installation. They are only present for convenience. Unless considered truly critical, the security updates on these packages is best effort.
:::

#### wpa_supplicant

The `wpa_supplicant` package is provided for homelab and testing purposes only. Wi-Fi is not supported for production environments, therefore vulnerabilities in `wpa_supplicant` are not treated as critical. If you are using Wi-Fi anyway, be aware of these known, unpatched vulnerabilities:

- [CVE-2023-52160](https://www.cvedetails.com/cve/CVE-2023-52160): A configuration that does not verify the TLS certificate when using PEAP can allow authentication bypass.
- [CVE-2019-9494](https://www.cvedetails.com/cve/CVE-2019-9494),[CVE-2019-9495](https://www.cvedetails.com/cve/CVE-2019-9495), [CVE-2022-23303](https://www.cvedetails.com/cve/CVE-2022-23303), [CVE-2022-23304](https://www.cvedetails.com/cve/CVE-2022-23304): SAE and EAP-PWD are vulnerable to side channel attacks as a result of cache access patterns leakage.
- [CVE-2021-27803](https://www.cvedetails.com/cve/CVE-2021-27803): Improper handling of P2P provision discovery requests may lead to security issues, including Denial of Service, and possibly arbitrary code execution.
- [CVE-2019-16275](https://www.cvedetails.com/cve/CVE-2019-16275): An attacker can send specially crafted 802.11 frames to trigger a Denial of Service (DoS) condition.
- [CVE-2019-11555](https://www.cvedetails.com/cve/CVE-2019-11555): Improper validation of EAP-PWD fragmentation reassembly could lead to a Denial of Service.
- [CVE-2019-9496](https://www.cvedetails.com/cve/CVE-2019-9496):  An invalid authentication sequence could result in Denial of Service.
- [CVE-2019-9497](https://www.cvedetails.com/cve/CVE-2019-9497), [CVE-2019-9498](https://www.cvedetails.com/cve/CVE-2019-9498), [CVE-2019-9499](https://www.cvedetails.com/cve/CVE-2019-9499):  These vulnerabilities may allow an attacker to complete EAP-PWD authentication without knowing the password.

#### mc ((Midnight Commander)

- [CVE-2021-36370](https://www.cvedetails.com/cve/CVE-2021-36370): When establishing an SFTP connection, the fingerprint of the server is neither checked nor displayed, therefore a user will not be able to verify its authenticity.

### 6. Ask before

If you have [pro support](https://xcp-ng.com), ask there. As part of the support, additional supported packages - such as new drivers - may be provided. Else ask the community on the [forum](https://xcp-ng.org/forum/).

## 🦮 How to install

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

:::warning
CentOS 7 reached its end of life, so installing additional packages from its repositories is even more at your own risk now. Let us know what packages from there you really can't use XCP-ng without, so that we may consider providing them in our supported repositories (with security fixes when needed).
:::

### From EPEL repositories

On XCP-ng, the EPEL repos are already installed but are disabled, on purpose. Install from them with:
```
yum install name_of_package --enablerepo=epel
```

Sometimes you'll need extra dependencies from CentOS. Replace the command with:
```
yum install name_of_package --enablerepo=epel,base,updates
```

And as above make sure no package from the system will get overwritten in the process.

:::warning
EPEL 7 reached its end of life at the same time as CentOS 7, so installing additional packages from its repositories is even more at your own risk now. Let us know what packages from there you really can't use XCP-ng without, so that we may consider providing them in our supported repositories.
:::

### From other third party repositories

1. Avoid that if possible
2. Be extra cautious
3. After installing the repository, disable it right away (`enabled=0` in repo file)
4. install packages with: `yum install name_of_package --enablerepo=name_of_repo`

And as usual make sure it won't overwrite existing packages...

## 📦 Up to date additional packages

If you installed from XCP-ng repositories, [they will be updated like the rest of the XCP-ng system](../../management/updates).

If you installed from any other repository, including CentOS and EPEL, you need to update them (and their dependencies) manually

## ♻️ System upgrade

See [upgrade section](../../installation/upgrade) for a discussion of the differences between "Installer upgrade" and "`yum`-style upgrade".

Installer upgrade will reinstall the system from scratch and just keep your configuration related to XCP-ng (network, VMs, SRs, etc.). Anything else will have to be re-done.

An upgrade using `yum` directly will try to update or keep the packages that you installed. Packages installed from XCP-ng repositories should get updated seamlessly. Packages from other repositories will not get updated: they may be left in place (then you'll have to update them yourselves if needed), removed (due to package conflicts or because they are obsoleted by packages from the updated XCP-ng) or even make the upgrade fail until they are manually removed.
