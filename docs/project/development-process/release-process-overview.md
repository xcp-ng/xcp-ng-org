# Release process overview

How we make a release process.

Let's first discuss the RPM repository structure and define stable and development releases. Then we'll see development and packaging aspects.

## XCP-ng's RPM repositories
*A new repository structure has been introduced with XCP-ng 8.0, which is what this section will cover. For the structure used in XCP-ng 7.5 and 7.6, see [https://xcp-ng.org/forum/topic/185/structure-of-the-rpm-repositories](https://xcp-ng.org/forum/topic/185/structure-of-the-rpm-repositories).*

First, the *goals* behind the RPM repository structure are:
* Allow fast release of fixes to the maintained stable releases.
* Allow users to test future updates before they are pushed to everyone, to help validate them.
* Allow users to upgrade from an older XCP-ng to the latest release with a simple yum update (as long as we don't cross major release borders. 7.4 to 7.6 is supported. 7.6 to 8.0 isn't).
* Have a place where additional packages from XCP-ng's core team or from the community can be made available even after the release.

You can browse the repository structure at [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/)

Here's a tree that represents the structure:
```
.
├── 7
│   ├── 7.4
│   ├── 7.5
│   └── 7.6
└── 8
    ├── 8.0
    │   ├── base
    │   │   ├── Source
    │   │   │   ├── repodata
    │   │   │   └── SPackages
    │   │   │       └── source-RPMs-are-here.src.rpm
    │   │   └── x86_64
    │   │       ├── Packages
    │   │       │   └── RPMs-are-here.rpm
    │   │       └── repodata
    │   ├── testing
    │   └── updates
    │
    ├── 8.1
    ├── 8.2
    └── ...
```
`base` is enabled by default. It contains:
* the RPMs as they were in the installation ISO for XCP-ng 8.0,
* any optional extra RPMs provided by XCP-ng's packagers,
* all the build dependencies needed to build all of the above.

`testing` is disabled by default. It contains:
* bugfix or security update candidates, being tested,
* experimental RPMs that we are not ready to move to `updates` yet,
* any additional build dependency we had to add to build the above RPMs.

`updates` is enabled by default. It contains:
* bugfix or security updates (see [Updates Howto](../../../management/updates)),
* occasionally, updates that bring enhancements without changing the behaviour you know and without regressions,
* any optional extra RPMs provided by XCP-ng's packagers *after the release*,
* any additional build dependency we had to add to build the above RPMs.

Note that having lots of additional packages in `base` and `updates` does not mean that they will get installed to your system when you update. They only get installed:
* if you voluntarily install them (`yum install ...`),
* or when pulled as a dependency of another update (in which case we do want that).

## Stable release vs development release
This is very common: released stable versions only get non-disruptive updates during their support lifetime: bug fixes and security fixes. Those are first published to the `testing` RPM repository and then moved to the `updates` RPM repository so that it is offered to all users (see [Updates Howto](../../../management/updates)). We also allow ourselves to add features to an existing stable version as optional packages, or as updates to existing packages provided that we can do it without creating risks of regression. Example: we added support for `zstd` compression for VM exports to an already released XCP-ng 7.6.

On the contrary, the development version (aka the next stable release) can get any kind of breaking change until the day of release. Packages are then usually directly pushed to the `base` repository.

## How a RPM package is built for XCP-ng
There are two sides of the coin: **development** and **RPM packaging**. For a given RPM package that does not come from CentOS or EPEL, we always provide packaging work. We can also provide development work, depending on the package, either as contributors to an upstream project, or as our own upstream.

Here are the usual steps. We will expand on them afterwards:
* **Development**
  * **Develop**: happens on a software git repository as in any software project. Example: [https://github.com/xcp-ng/xcp-emu-manager](https://github.com/xcp-ng/xcp-emu-manager). Skip if we are not the upstream developer for that software and are not contributing to it yet.
  * **Release**: decide that your software is good to be released as part of XCP-ng, either as an update to an existing release of XCP-ng or in the next release. Create a tag in the git repository. Example: [https://github.com/xcp-ng/xcp-emu-manager/releases/tag/v0.0.9](https://github.com/xcp-ng/xcp-emu-manager/releases/tag/v0.0.9). Skip if we are not the upstream developer for that software.
* **Packaging**
  * **Create or update RPM specs** and commit them to appropriate repository in the ['xcp-ng-rpms' github organization](https://github.com/xcp-ng-rpms/). Example: [https://github.com/xcp-ng-rpms/xcp-emu-manager](https://github.com/xcp-ng-rpms/xcp-emu-manager).
  * **Add or update patches** to be applied above the upstream source tarball to that same repository.
  * **Submit build** to the build system ([koji](https://koji.xcp-ng.org/)).
  * **Publish the build** to the appropriate RPM repository (`testing` for stable releases, `base` for development release of XCP-ng)
* **Installer ISO image generation**: in the case of a development release of XCP-ng, when all the above has been done for all the RPMs, generate an ISO image with the installer and the required RPMs.

## Where discussion happens
Usually discussion will happen:
* On [GitHub issues](https://github.com/xcp-ng/xcp/issues).
* In [the forum](https://xcp-ng.org/forum/).
* Over IRC: <irc://irc.oftc.net/#xcp-ng> and <irc://irc.oftc.net/#xcp-ng-dev>
* On [Discord](https://discord.gg/Hr98F6wRvx).

Then depending on the package, we'll bring the discussion to upstream channels whenever needed.