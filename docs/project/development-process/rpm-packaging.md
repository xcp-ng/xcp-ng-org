---
sidebar_position: 5
---

# RPM packaging

Creating packages that can be installed on the user's system is called **packaging**.

## Introduction to RPM
RPM is the package format used by Fedora, Red Hat, CentOS, Mageia, OpenSUSE and other Linux distributions. It is also what we use in XCP-ng. A RPM package contains the files to be installed, metadata such as version and dependencies, and various scripts executed during installation, upgrade, uninstallation or other events.

A RPM is built from a source RPM (SRPM), which is usually made of:
* A specification file ("spec file", extension `.spec`) that defines everything about the build: build dependencies, version, release, changelog, build commands, installation, what sources to use, patches to apply, run-time dependencies, scripts (post-install, pre-install, etc.) and more.
* Upstream sources (usually a single `.tar.gz` file), unmodified from the upstream release unless there's a very good reason (such as stripping out non-free components).
* Patches to be applied to the upstream sources.

A given source RPM can be built in various environments (distributions, arches), so the **build environment** is also something that defines a RPM. The best build environment is one that matches your target. Linux distributions always start with a clean minimal build root in which build dependencies declared by the SRPM are installed before starting the build. We do exactly the same.

One source RPM can produce several RPMs, named differently from the source RPM itself. Example available at [https://koji.xcp-ng.org/buildinfo?buildID=663](https://koji.xcp-ng.org/buildinfo?buildID=663) (see the 'RPMs' section).

More about RPM:
* [https://en.wikipedia.org/wiki/RPM_Package_Manager](https://en.wikipedia.org/wiki/RPM_Package_Manager)
* [https://rpm.org/documentation.html](https://rpm.org/documentation.html)

## Where to find our source RPMs
Two places.

1. As SRPM files (`.src.rpm`), they are all available in our RPM repositories at [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/). Example: [https://updates.xcp-ng.org/8/8.2/base/Source/SPackages/](https://updates.xcp-ng.org/8/8.2/base/Source/SPackages/).

2. All RPMs built by us have been built from one of the git repositories at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/), containing the spec file and sources. The name of the repository matches that of the source package. `git-lfs` is required for cloning from and committing to them, because we use it to store the source tarballs.

## Packaging guidelines

See [RPM Packaging guidelines](https://github.com/xcp-ng/xcp/wiki/RPM-Packaging-guidelines).