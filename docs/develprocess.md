# Development Process Tour

In this document, we will try to give you an overview of the development process as well as guides or pointers to help take part in it.

## What XCP-ng is made of

XCP-ng is a collection of components, that put together create a complete turnkey virtualization solution that you can install to bare-metal servers. Those components are packaged in the [RPM](http://rpm.org) format.

As usual in the Free Software world, we stand *on the shoulders of giants*:
* **CentOS**: many RPM packages come from the [CentOS](https://www.centos.org/) Linux distribution, which in turn is based on Red Hat's [RHEL](https://en.wikipedia.org/wiki/Red_Hat_Enterprise_Linux), mostly based itself on the work of the [Fedora](https://getfedora.org/) project, all based on the work of all the developers who wrote the [FLOSS](https://en.wikipedia.org/wiki/Free/Libre_Open_Source_Software) software that is packaged in those Linux distributions. Examples: glibc, GNU coreutils, openssh, crontabs, iptables, openssl and many, many more.
* **EPEL**: a few packages come from [EPEL](https://fedoraproject.org/wiki/EPEL).
* **XenServer**: most packages that make XCP-ng what it is have been rebuilt from source RPMs released by the [XenServer](https://xenserver.org/) project, with or without modifications. This includes xen, a patched Linux kernel, the Xen API, and many others. This also includes redistributable drivers or tools from third party vendors.
* **XCP-ng**: the remaining packages are additions (or replacements of closed-source components) to the original XenServer distribution.

## Release process overview
Let's first discuss the RPM repository structure and define stable and development releases. Then we'll see development and packaging aspects.

### XCP-ng's RPM repositories
*A new repository structure has been introduced with XCP-ng 8.0, which is what this section will cover. For the structure used in XCP-ng 7.5 and 7.6, see <https://xcp-ng.org/forum/topic/185/structure-of-the-rpm-repositories>.*

First, the *goals* behind the RPM repository structure are:
* Allow fast release of fixes to the maintained stable releases.
* Allow users to test future updates before they are pushed to everyone, to help validate them.
* Allow users to upgrade from an older XCP-ng to the latest release with a simple yum update (as long as we don't cross major release borders. 7.4 to 7.6 is supported. 7.6 to 8.0 isn't).
* Have a place where additional packages from XCP-ng's core team or from the community can be made available even after the release.

You can browse the repository structure at <https://updates.xcp-ng.org/>

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
* bugfix or security updates (see [Updates Howto](updates.md)),
* occasionally, updates that bring enhancements without changing the behaviour you know and without regressions,
* any optional extra RPMs provided by XCP-ng's packagers *after the release*,
* any additional build dependency we had to add to build the above RPMs.

Note that having lots of additional packages in `base` and `updates` does not mean that they will get installed to your system when you update. They only get installed:
* if you voluntarily install them (`yum install ...`),
* or when pulled as a dependency of another update (in which case we do want that).

### Stable release vs development release
This is very common: released stable versions only get non-disruptive updates during their support lifetime: bug fixes and security fixes. Those are first published to the `testing` RPM repository and then moved to the `updates` RPM repository so that it is offered to all users (see [Updates Howto](updates.md)). We also allow ourselves to add features to an existing stable version as optional packages, or as updates to existing packages provided that we can do it without creating risks of regression. Example: we added support for `zstd` compression for VM exports to an already released XCP-ng 7.6.

On the contrary, the development version (aka the next stable release) can get any kind of breaking change until the day of release. Packages are then usually directly pushed to the `base` repository.

### How a RPM package is built for XCP-ng
There are two sides of the coin: **development** and **RPM packaging**. For a given RPM package that does not come from CentOS or EPEL, we always provide packaging work. We can also provide development work, depending on the package, either as contributors to an upstream project, or as our own upstream.

Here are the usual steps. We will expand on them afterwards:
* **Development**
  * **Develop**: happens on a software git repository as in any software project. Example: <https://github.com/xcp-ng/xcp-emu-manager>. Skip if we are not the upstream developer for that software and are not contributing to it yet.
  * **Release**: decide that your software is good to be released as part of XCP-ng, either as an update to an existing release of XCP-ng or in the next release. Create a tag in the git repository. Example: <https://github.com/xcp-ng/xcp-emu-manager/releases/tag/v0.0.9>. Skip if we are not the upstream developer for that software.
* **Packaging**
  * **Create or update RPM specs** and commit them to appropriate repository in the ['xcp-ng-rpms' github organization](https://github.com/xcp-ng-rpms/). Example: <https://github.com/xcp-ng-rpms/xcp-emu-manager>.
  * **Add or update patches** to be applied above the upstream source tarball to that same repository.
  * **Submit build** to the build system ([koji](https://koji.xcp-ng.org/)).
  * **Publish the build** to the appropriate RPM repository (`testing` for stable releases, `base` for development release of XCP-ng)
* **Installer ISO image generation**: in the case of a development release of XCP-ng, when all the above has been done for all the RPMs, generate an ISO image with the installer and the required RPMs.

### Where discussion happens
Usually discussion will happen:
* On [GitHub issues](https://github.com/xcp-ng/xcp/issues).
* In [the forum](https://xcp-ng.org/forum/).
* Over IRC: `#xcp-ng` and `#xcp-ng-devel` on irc.freenode.net.

Then depending on the package, we'll bring the discussion to upstream channels whenever needed.

## Development

Development in the context of the XCP-ng project means either to contribute to existing upstream projects, such as the Xen API ([XAPI](https://github.com/xapi-project/xen-api/), the [Xen project](https://xenproject.org/) and many other components of XCP-ng, or to develop new software specifically for the XCP-ng project.

### Contribution to upstream projects
Development (as in "write code") in XCP-ng project is mostly made of contributions to upstream projects such as <https://github.com/xapi-project/>, <https://wiki.xenproject.org/wiki/Submitting_Xen_Project_Patches> or <https://github.com/xenserver/>.

For some pieces of upstream software, we have GitHub "forks" at <https://github.com/xcp-ng>. For others we contribute directly without a GitHub fork and apply the patches directly on the RPMs at <https://github.com/xcp-ng-rpms/>.

### Components we **are** the upstream for
Components for which we are the main developers.

Our policy is to upstream everything if possible. However, there are some exceptions:
* Components that have no "upstream" open source equivalent. `xcp-emu-manager` (<https://github.com/xcp-ng/xcp-emu-manager>) is such a component that we had to write from scratch because the corresponding component in XenServer, `emu-manager`, is closed-source.
* Bits specific to the act of building XCP-ng (various scripts, branding stuff...). The main example is <https://github.com/xcp-ng/xcp>.

### How to help at development
It all depends on your skills and areas of interest so it's hard to tell specifically in advance. It usually starts with a feature that you want, or a bug that is annoying you. Alternatively, having a look at the open GitHub issues and picking one (<https://github.com/xcp-ng/xcp/issues>) can be a way to get started. Even if you don't know where to start, just come and talk with us (see [Where discussion happens](#where-discussion-happens) above).

## Tags, maintenance branches in our code repositories

We need a few conventions to work together. The following describes the naming conventions for branches and tags in our code repositories, that is repositories located at <https://github.com/xcp-ng>. Repositories used for RPM packaging, at <https://github.com/xcp-ng-rpms/>, use different conventions not discussed here.

The objectives of the branch and tag naming conventions are:
* always being able to know how to name tags and maintenance branches, depending on the situation
* easily identify maintenance branches for a given release of XCP-ng, based on their name
* know what branch to develop the next version on
* for our tags and branches that have been developed from upstream branches or tags, document the upstream branch names through our branch and tag naming

The first question to ask ourselves is: **who is the upstream for the software**?

### 1. We are upstream

We decide when to release a new version, and we decide the versioning.

Examples: `xcp-emu-manager`, `uefistored`...

Common case:
* Tags: `vMAJOR.MINOR.PATCH` (`v1.1.2`, `v1.2.0`...)
* Maintenance branch if needed: `VERSION-XCPNGVERSION`.
  * We don't need to create the maintenance branch in advance. Not all software gets hotfixes.
  * `VERSION` is the version we branched from:
    * If possible `MAJOR.MINOR` (`1.1`, `1.2`)
    * ... Unless we tagged the project in a way that would make this ambiguous. In that case, `MAJOR.MINOR.PATCH` (`1.1.1`, `1.1.2`...).
  * `XCPNGVERSION` is the two-digit version of XCP-ng: `8.1`, `8.2`...
  * Examples: `1.1.2-8.0`, `1.2-8.2`...
* Next release developed on: `master`

If for any reason we decide to release a newer version of the software as a maintenance update, then:
* We stop updating the existing maintenance branch
* Further hotfixes would come from a new maintenance branch created from the appropriate tag.

Special case: if VERSION and XCPNGVERSION are always the same (example: `xcp-ng-release`), then:
* Tags: `vXCPNGVERSIONFULL` (`v8.2.0`)
* Maintenance branch if needed: `XCPNGVERSION` (`8.2`)

### 2. We are downstream

We do not decide how and when new versions and released, and how they are numbered. So we need to somewhat mix the upstream versioning with our own branch names and versioning. For maintenance branches and tags related to an XCP-ng release, notably.

Examples: `host-installer`, `sm`...

Common case:
* Tags:
  * We tag when we release a new version of XCP-ng: `vUPSTREAMVERSION-XCPNGVERSIONFULL` (`v1.29.0-8.2.0`)
  * Then we use the maintenance branch but don't tag anymore (each build pushed to koji already acts as a sort of tag). If we *really* wanted to tag for patch updates from the maintenance branch, we could increment neither `UPSTREAMVERSION` nor `XCPNGVERSIONFULL` so we'd have to add yet another suffix, e.g. `v1.29.0-8.2.0-3.1` where `3.1` would be the `Release` tag from the hotfix RPM.
* Maintenance branch: `UPSTREAMVERSION-XCPNGVERSION` (`1.29.0-8.2`)
  * When we are downstream we always create a maintenance branch for a given XCP-ng release
* Next release developed:
  * **Upstream first!**
  * If we really need to diverge a little from upstream, on a temporary dev branch `dev-NEXTXCPNGVERSION` (e.g. `dev-8.3`), based either on the current maintenance branch, or on a branch that is likely to be the one used in the next release (we don't always know!)
  * Next maintenance branch directly (e.g. `1.45.0-8.3`) once the upstream SRPMs have been released

If for any reason we decide to release a newer version of the software as a maintenance update, then we'd create new tag and a new maintenance branch that match `UPSTREAMVERSION` (that changes) and `XCPNGVERSIONFULL` (that doesn't change)

Special case: if the upstream version and the XCP-ng version are always the same (example: `host-installer`), then:
  * Tags: `vXCPNGVERSIONFULL` (`v8.2.0`)
  * Maintenance branch: `XCPNGVERSION` (`8.2`)

#### About upstream branches

* If we get the sources from XS SRPMs, then we import them to a branch named `XS` and tag `XS-XSVERSIONFULL` (`XS-8.2.0`). Example: `host-installer`.
* If we forked a git repository, we don't need to push the upstream branches or tags to our own fork. However it could be a good habit to track maintenance or hotfix branches for changes.

#### Special case: `qemu-dp`

`qemu-dp` both *has* an upstream git repository and at the same time it *hasn't*:
* The SRPM's source tarball comes from upstream `qemu`.
* Additional patches by XenServer team come from a private git repository, so all we have is patches in the SRPM.

We chose to base our `qemu-dp` repository on a fork of the upstream `qemu` [repository mirror on github](https://github.com/qemu/qemu), with additional branches:
* To track XS patches, for each XS release:
  * Branch `UPSTREAMVERSION-XS-XSVERSION` (`2.12.0-XS-8.2`), created from the `v2.12.0` upstream tag, and patches from the SRPM applied as commits on top.
  * Tag `vUPSTREAMVERSION-XS-XSVERSIONFULL` (`v2.12.0-XS-8.2.0`) created from the commit of the above branch that corresponds to the initial release of XSVERSIONFULL.
* For XCP-ng maintenance, for each release:
  * Branch `UPSTREAMVERSION-XCPNGVERSION` (`2.12.0-8.2`), branched from tag `vUPSTREAMVERSION-XS-XSVERSIONFULL` (`v2.12.0-XS-8.2.0`)
  * We tag when we release a new version of XCP-ng: `vUPSTREAMVERSION-XCPNGVERSIONFULL` (`v2.12.0-8.2.0`). Can be identical to the XS tag.
* For XCP-ng development (new features):
  * **Upstream first** if can be done. Not easy when there's no repo for XenServer patches.
  * If we really need to diverge a little from upstream, on a temporary dev branch `dev-NEXTXCPNGVERSION` (e.g. `dev-8.3`), based either on the current maintenance branch, or on a branch that is likely to be the one used in the next release (we don't always know!)
  * Next maintenance branch directly (e.g. `2.12.0-8.3`) once the upstream SRPMs have been released

## RPM packaging

Creating packages that can be installed on the user's system is called **packaging**.

### Introduction to RPM
RPM is the package format used by Fedora, Red Hat, CentOS, Mageia, OpenSUSE and other Linux distributions. It is also what we use in XCP-ng. A RPM package contains the files to be installed, metadata such as version and dependencies, and various scripts executed during installation, upgrade, uninstallation or other events.

A RPM is built from a source RPM (SRPM), which is usually made of:
* A specification file ("spec file", extension `.spec`) that defines everything about the build: build dependencies, version, release, changelog, build commands, installation, what sources to use, patches to apply, run-time dependencies, scripts (post-install, pre-install, etc.) and more.
* Upstream sources (usually a single `.tar.gz` file), unmodified from the upstream release unless there's a very good reason (such as stripping out non-free components).
* Patches to be applied to the upstream sources.

A given source RPM can be built in various environments (distributions, arches), so the **build environment** is also something that defines a RPM. The best build environment is one that matches your target. Linux distributions always start with a clean minimal build root in which build dependencies declared by the SRPM are installed before starting the build. We do exactly the same.

One source RPM can produce several RPMs, named differently from the source RPM itself. Example available at <https://koji.xcp-ng.org/buildinfo?buildID=663> (see the 'RPMs' section).

More about RPM:
* <https://en.wikipedia.org/wiki/RPM_Package_Manager>
* <https://rpm.org/documentation.html>

### Where to find our source RPMs
Two places.

1. As SRPM files (`.src.rpm`), they are all available in our RPM repositories at <https://updates.xcp-ng.org/>. Example: <https://updates.xcp-ng.org/8/8.2/base/Source/SPackages/>.

2. All RPMs built by us have been built from one of the git repositories at <https://github.com/xcp-ng-rpms/>, containing the spec file and sources. The name of the repository matches that of the source package. `git-lfs` is required for cloning from and committing to them, because we use it to store the source tarballs.

### Packaging guidelines

See [RPM Packaging guidelines](https://github.com/xcp-ng/xcp/wiki/RPM-Packaging-guidelines).

## Build system
Sources and spec files for RPMs is one thing, but one needs a build environment to turn them into installable RPMs.

:::tip
What follows is important if you want to understand how our official RPMs are built, or intend to contribute to the packaging.

However, for local builds meant for testing your changes (e.g. add a few patches to see how the component behaves with them), check the [Local RPM build](#local-rpm-build) section.
:::

### Enter Koji
When building RPMs, many things can and must be automated. This is what a build system is for. Ours is [Koji](https://koji.xcp-ng.org/), which [comes from the Fedora project](https://pagure.io/koji).

Features:
* Takes a link to a git commit as input for the build and then handles everything: creation of a new buildroot, installation of the build dependencies, RPM build.
* Build history, logs, produced artifacts.
* XML-RPC APIs we can use in scripts.
* Public web interface (mostly informative).
* Portable command line client written in python.
* User authentication and credentials.

And with a bit of scripting or additional components:
* GPG signing of RPMs.
* Creation of RPM repositories.

### Koji's concepts
(see also <https://pagure.io/docs/koji/> though its howto is very Fedora-centric)

In order to understand how Koji works, one needs to explain a few concepts: packages, builds, RPMs and tags.

#### Packages, builds and RPMs

* **RPM**: a **RPM** designates a specific RPM file: `xenopsd-0.150.5-1.1.xcpng8.2.x86_64.rpm`. This is what we install in XCP-ng ultimately.
* **Build**: that RPM belongs to a **build**, which groups a Source RPM (SRPM) with all the RPMs it produced, and is identified by the name of the SRPM, without the `.src.rpm` part: `xenopsd-0.66.0-1.1.xcpng`.
* **Package**: the build belongs to a **package**: `xenopsd`. A package has no associated files in itself: it's just the parent of all builds that belong to it, in Koji's database.

This can be seen in the information page for a given build: <https://koji.xcp-ng.org/buildinfo?buildID=2080>. The package is visible as "Package Name" (you can click on it to see the package view) and the RPMs (Source RPM and regular RPMs) are visible under the "RPMs" section.

Represented as a tree:
```
package
├── build: package-version-release
│   ├── Source RPM: package-version-release.src.rpm
│   ├── RPM: package-version-release.arch.rpm
│   ├── (RPM: package-foo-version-release.arch.rpm)
│   └── (RPM: package-bar-version-release.arch.rpm)
├── another build: package-anotherversion-release
│   ├── Source RPM: package-anotherversion-release.src.rpm
│   ├── RPM: package-anotherversion-release.arch.rpm
│   ├── (RPM: package-foo-anotherversion-release.arch.rpm)
│   └── (RPM: package-bar-anotherversion-release.arch.rpm)
├── yet another build...
...
```

Take the time to assimilate this, because it will be used in the rest of this document.

#### Tags

The way to define the workflow in koji is by defining **tags**. This is the tricky part which the official documentation did not allow me to understand well, so I had to ask from experienced users of Koji.

I'll try to explain.

*Packages* can be associated with tags. For example we tagged the [xenopsd](https://koji.xcp-ng.org/packageinfo?packageID=409) package with tag `V8.2` in order to signify "this package is present in XCP-ng 8.2". It does not achieve much per se but it is necessary for what follows: tagging builds.

*Builds* can be associated with tags too, and that is much more useful. However you cannot tag a build if the package the build belongs to is not tagged itself with that tag, so we need to tag packages first. Or with a tag that is a parent of the latter. Oh yeah, did I mention that tags can inherit other tags? An example will help: tag `v8.2-updates` inherits its ancestor tag `V8.2`. Since `xenopsd` belongs to `V8.2`, we can tag the [`xenopsd-0.150.5-1.1.xcpng8.2`](https://koji.xcp-ng.org/buildinfo?buildID=2080) build with tag `v8.2-updates`.

In our Koji, here's the inheritance chain of tags (example release taken: 8.2):
```
V8.2 (packages)
  v8.2-base (builds)
    v8.2-updates (builds)
      v8.2-testing (builds)
```
* `V8.2` is associated to all the packages used in XCP-ng 8.2, either as installed packages on servers or as build dependencies in Koji. Notice the capslock V which is a convention we follow to identify tags that are specifically associated with *packages*, not *builds*.
* `v8.2-base` inherits `V8.2` so we were able to associate it to all the builds in base XCP-ng 8.x. The `base` RPM repository for 8.2 is exported from this tag.
* `v8.2-updates` inherits `v8.2-base` which means it contains all builds from `v8.2-base` plus builds specifically tagged `v8.2-updates`. Those are exported to the `updates` RPM repository for 8.2.
* `v8.2-testing` inherits `v8.2-updates` so it contains all builds from `v8.2-base`, all builds from `v8.2-updates` and builds specifically tagged `v8.2-testing`. Why? So that any new build targeted at `v8.2-testing` can pull its build dependencies from released updates rather than just from the older packages in the base repository. Builds specifically tagged `v8.2-testing` are exported to the `testing` RPM repository for 8.2.

#### Build targets
When you ask Koji to start a build, you **must** specify a build target.

Actually, in the examples above, `xenopsd-0.150.5-1.1.xcpng8.2` was automatically tagged `v8.2-testing` by koji when it was built because of another concept of Koji: **build targets**. That was not a manual operation (however, we moved it manually afterwards to `v8.2-updates`, once the testing was over). The only builds that we tag manually are packages imported from CentOS or EPEL. Everything that is built by Koji gets a tag depending on the *build target*'s destination tag.

A build target is defined by:
* a name
* a build tag
* a destination tag

Example:
* build **target** name: `v8.2-testing`
* build tag: `v8.2-testing`
* destination tag: `v8.2-testing`

(Yeah, sorry, we named the target the same as the tags it relies on. We hope it will not be confusing). So, this build target will pull dependencies from an internal (to Koji) RPM repository that contains all the RPMs from builds that belong to the `v8.2-testing` tag (including those inherited from `v8.2-base` and `v8.2-updates`). Then once a build task finishes, it will tag the resulting build with the destination tag we defined for the target, here `v8.2-testing`. Here build tag and destination tag are the same, so this means that any build with the `v8.2-testing` target will be itself added to the `v8.2-testing` tag immediately after the build, so the next builds with the same target will be able to use it as a build dependency (chained builds).

Another (fictitious) example:
* build target name: `v8.x-sandbox`
* build tag: `v8.x-testing`
* destination tag: `v8.x-sandbox`

This is just to show that build tag and destination tag **can** be different. Build dependencies will be pulled from `v8.x-testing` and the result will be put in `v8.x-sandbox`. This means that builds to the sandbox will never use packages that are already in the sandbox as build dependencies. Why would we do that? To guarantee that builds made in the sandbox are never influenced by other builds made there, possibly by other users. This is a fictitious situation, just to illustrate the concepts of build tag and destination tag.

### Build and release process
Here's how to update a package in XCP-ng, step by step. This process requires writing rights on the git repository corresponding to the package at <https://github.com/xcp-ng-rpms/> and submit rights in Koji. Others are invited to fork one the repositories at <https://github.com/xcp-ng-rpms/>, [build RPMs locally in our build container](#local-rpm-build), and then create pull requests. Reading the steps below will still be useful to you to help make appropriate changes.

This applies only to packages that we build in Koji. There are also packages that are not built in Koji. Most packages from CentOS, for example, are imported directly from CentOS into our Koji instance.

Let's go:

#### 0. Install and setup Koji
In order not to overload this section with information, the instructions are available in another section of this document: [Koji initial setup](#koji-initial-setup).

#### 1. Package
* Make sure `git-lfs` is installed.
* Clone or update your local copy of the relevant repository at <https://github.com/xcp-ng-rpms/> (one per package).
* Switch to the branch that corresponds to the release of XCP-ng you target, e.g. `git checkout 8.2` for XCP-ng 8.2. If you target several releases of XCP-ng, you'll have to make your changes to several branches and start several builds.
* Create a temporary work branch from that branch.
* Make your changes to the `.spec` file, sources and/or patches. Follow the [RPM Packaging Guidelines](https://github.com/xcp-ng/xcp/wiki/RPM-Packaging-guidelines).
* Commit and push

#### 2. Test build
* Choose a [build target](https://koji.xcp-ng.org/buildtargets). If the target release is an already released XCP-ng that is in maintenance phase, you will choose `v{VERSION}-testing`, for example `v8.2-testing`. For a development release of XCP-ng, you'll probably choose `v{VERSION}-base` instead.
* Use Koji's `--scratch` option to build the RPMs without pushing them to any RPM repository.
  * `koji build --scratch {BUILD_TARGET} git+https://github.com/xcp-ng-rpms/{PACKAGE_NAME}?#{COMMIT_HASH}`
    * For a useful history, `{COMMIT_HASH}` must be a commit hash, not a branch name. Commit hashes are stable, branches are moving targets.
* If it fails, consult the build logs in [Koji's web interface](https://koji.xcp-ng.org/).
* Ask for help if the build error is something that you can't act upon.
* Once you got a successful build, test it in your test environment (for example a nested XCP-ng VM or better yet a test pool). Look at the list of built RPMs, identify those that are updates to RPMs on the system, and install them. If additional RPMs produced by the build deserve testing, test them too.

#### 3. Review and merge
* If you created several commits, consider squashing them into one unless it really makes sense to keep a separate history. If having several commits resulted from trials and errors, it's usually better to squash them into one single clean commit with a descriptive commit message.
* If you are the official maintainer for that package, rebase your work branch on top of the target branch (e.g. `git rebase 8.2`), then merge your branch on the target branch. This will result in your commits being the last on top of the target branch even if someone pushed other commits to that branch while you were working.
* If you are not the official maintainer, **create a pull request**. Your commit message should already explain why the change is needed. In addition to that, **link to the successful build result**, tell which RPMs you have **tested** from the build (no need to test `-devel` packages at this stage) and what you have tested. Even when a package requires some specific configuration or hardware, you can usually check that installing it causes no packaging conflicts, and no obvious runtime regression. If it is an update, you can also check that the update applies cleanly, that scripts or configuration reloading tasks that are meant to fire during the update are executed, etc.

#### 4. Official build
* The official maintainer for the package has the responsibility to start an official build in koji (once without `--scratch`), because the result will be pushed to public RPM repositories as testing RPMs.
* Check that the build was successful
* Wait a few minutes for the RPMs to reach the RPM repositories at <https://updates.xcp-ng.org/>

#### 5. Post-build tasks
* Test that you can update a host from the repositories: look at the list of built RPMs, identify those that are updates to RPMs on the system, and update them with `yum update {PACKAGE1} {PACKAGE2} {...} --enablerepo='xcp-ng-testing'`.
* Check for obvious regressions (breakages in basic functionalities).

Then, if it is an **update candidate** for an existing package:
* If the update targets several releases (for example `8.x` and `8.x+1`), test for each release.
* Announce the update candidate and ask for testers:
  * Message to <https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing>
    * Why the update
    * List of updated RPMs
    * Command to install them.
    * Command to downgrade in case of issues.
    * What to test.
    * Is a reboot required...
  * For better visibility of the update candidate, also create a GitHub issue, such as <https://github.com/xcp-ng/xcp/issues/154>. Add it to the [team board](https://github.com/orgs/xcp-ng/projects/2) in column "Update candidate".

### Special case: new packages
Importing new packages requires extra steps.

**TODO**

### Special case: packages not built by us
Most packages imported from CentOS or EPEL are not built by our Koji instance. We import the source RPM and the built RPMs directly.

**TODO**

Bits of information can be inferred from [Import-RPM-build-dependencies-from-CentOS-and-EPEL](https://github.com/xcp-ng/xcp/wiki/Import-RPM-build-dependencies-from-CentOS-and-EPEL)

### Other tags
In a previous section, I've tried to explain what tags are used for in Koji. We use them also for something else. We probably even misuse them.

Once a day, we run a job that makes sure every *build* in our Koji instance is tagged with one of the following tags:
* `built-by-xcp`: RPMs built by our build system.
* `built-by-xs`: RPMs built by Citrix's internal build system. This one is meant to disappear progressively as we rebuild more and more of those packages.
* `built-by-centos`: imported unmodified from CentOS.
* `built-by-epel`: imported unmodified from EPEL.

In addition to this, when we import RPMs from CentOS or EPEL we tag their *builds* with tags that contain the version of CentOS they come from, or the date they've been imported from EPEL:
* `centos-{VERSION}`, for example `centos-7.5`.
* `epel-{MAJOR_VERSION}-{DATE}`, for example `epel-7-2019-01-30`

Example: <https://koji.xcp-ng.org/buildinfo?buildID=655>

All those tags have no purpose in Koji's workflow. They are just useful pieces of information for us.

### RPM signing
We automatically sign the RPMs built by or imported to Koji before exporting them towards the RPM repositories.

[More information about RPM signing](mirrors.md#security).

### Repository generation
Handled by a cron job on koji's server. Then the repository is synchronised to <https://updates.xcp-ng.org/>.

## Local RPM build
Koji, the build system, is used only for official builds or update candidates. For daily development or community builds, we provide a simpler build environment using docker.

### `xcp-ng-build-env`
We provide a build environment that can run locally on your computer: <https://github.com/xcp-ng/xcp-ng-build-env>. It revolves around docker containers and a few convenience scripts. This is what we use for development, before we send the actual changes to our official build system, `koji`.

### Guide to local RPM rebuild
With some prior knowledge about development and RPM packaging, the documentation of <https://github.com/xcp-ng/xcp-ng-build-env> should be enough to get you started. However, in what follows, we provide a step by step guide for anyone to become accustomed to the process.

#### Requirements

* Docker. There are plenty of guides on the internet for your specific OS, so we won't cover this part here.
* A local clone of <https://github.com/xcp-ng/xcp-ng-build-env>.
* Container images built using its `build.sh` script. One per XCP-ng release. Example: `./build.sh 8.2` if your target is XCP-ng 8.2.
* [git-lfs](https://git-lfs.github.com/). It is required to be able to fetch the RPM sources from our repositories at <https://github.com/xcp-ng-rpms/>.

#### Get the sources for the RPM

Every RPM built by us has its sources located in a repository at <https://github.com/xcp-ng-rpms/>.

Example: <https://github.com/xcp-ng-rpms/xen>.

* After double-checking that you have installed `git-lfs`, locally clone the repository you want to work on.
* Checkout the branch that corresponds to your target. For XCP-ng 8.2, select the `8.2` branch.

#### Build the RPM

You probably want to bring modifications to the RPM definitions before you rebuild it, but let's first focus on getting a successful build. Then we'll allow ourselves to do modifications.

* Start the container. We use the `/path/to/xcp-ng-build-env/run.py` script for that.
  * Check the supported options with `/path/to/xcp-ng-build-env/run.py --help`
  * We'll want the following options:
    * `--branch` (`-b`): this selects the target. Example: `--branch 8.2` for XCP-ng 8.2. The corresponding container image must have been built before you can use it.
    * `--volume` (`-v`): we need to 'mount' your working directory into the container using this option. Else the container won't have access to any persistent data. Example: `-v ~/workdir:/data` will make your local `~/workdir` directory available to the container under the local `/data` path.
    * `--rm`: destroy the running container when exited. Can save disk space because you won't have to remember to clean up old containers manually.
* From within the container:
  * Enter the directory containing the sources for the RPM you had cloned earlier from <https://github.com/xcp-ng-rpms/>. Example: `cd /data/git/xen`.
  * Install the build dependencies in the container: `sudo yum-builddep SPECS/*.spec -y`.
  * Build the RPM: `rpmbuild -ba SPECS/*.spec --define "_topdir $(pwd)"`. This `_topdir` strange thing is necessary to make rpmbuild accept to work in the current directory rather than in its default working directory, `~/rpmbuild`.
* When the build completes, new directories are created: `RPMS/` and `SRPMS/`, that contain the build results. In a container started with the appropriate `-v` switch, the build results will be instantly available outside the container too.

:::tip
**The handy `--local` option**: it is a convenience parameter for `run.py` that automates most of the above. From the directory containing the local clone (on your local system, outside the container), simply run: `/path/to/xcp-ng-build-env/run.py -b X.Y --local . --rm -n` and it will automatically download the build dependencies and build the package.

The additional `-n` switch means "don't exit when finished", which will let you use the initialized container (with all the build dependencies already installed) without having to restart from scratch. The local directory is mounted in the container at `~/rpmbuild/`.
:::

#### Modify the RPM

Now that we know that we are able to build it, let's modify it. Here, you need basic knowledge about [RPM packaging](https://rpm-packaging-guide.github.io/). Check also our [Packaging Guidelines](#packaging-guidelines).

Basically, all the sources and patches are in the `SOURCES/` directory, and the definitions and rules are in the spec file located in `SPECS/`.

We can't cover every situation here, so we will address a simple case: add patches to a package.

* Add the patches in the `SOURCES/` directory
* Modify the spec file (`SPECS/name_of_package.spec`):
  * Add `PatchX` tags that reference the patches (where X is the number of the patch). If there already are patches, you'll usually choose a higher number. Example: `Patch1: packagename-2.1-fix-some-stuff.backport.patch`.
  * Update the `Release` tag. To clearly identify your build as a custom build, do not increase the release, but rather add a suffix to it. Example: `1%{?dist}` would become `1.0.fixstuff.1%{?dist}`. The first `0` is a way to make sure your build always has a lower release than any subsequent official update to the RPM. Then a short string that identifies your custom build (`fixstuff`). Then a digit, starting at 1, that you are free to increment at each iteration, if you do several successive builds.
  * A new changelog entry in the spec file. Not strictly necessary for the build, but it's always a good habit to update it with details about the changes, especially if you are likely to forget why you had installed it in the first place, or if you share your build RPMs with other users.

Then follow the same steps as before to build the RPM.

### An XCP-ng host as a build environment
You can also turn any XCP-ng host (preferrably installed in a VM. Don't sacrifice a physical host for that) into a build environment: all the tools and build dependencies are available from the default RPM repositories for XCP-ng, or from CentOS and EPEL repositories.

You won't benefit from the convenience scripts from [xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env) though.

## Local XAPI build

This document explains how to locally build the [XAPI](https://github.com/xcp-ng/xen-api).

Here are the steps:
- First, set up a build env:
    - Install the following packages: `dlm-devel` `gmp` `gmp-devel` `libffi-devel` `openssl-devel` `pciutils-devel` `systemd-devel` `xen-devel` `xxhash-devel`.
    - Install [`opam`](https://opam.ocaml.org/doc/Install.html) to set up a build env.
    - Run `opam init`.
    - Run `opam switch create toolstack 4.08.1`, this sets up an opam `switch` which is a virtual ocaml env.
    - Run `opam repo add xs-opam https://github.com/xapi-project/xs-opam.git`, this adds the [`xs-opam` repo](https://github.com/xapi-project/xs-opam.git) to your env.
    - Run `opam repo remove default`, this removes the the default repo from your env as we only want the `xs-opam` one.
    - Run `opam depext -vv -y xs-toolstack`, this installs the dependency needed to build `xs-toolstack`
    - Run `opam install xs-toolstack -y`, this installs the toolstack to build the xapi in your env.

- Build the XAPI:
    - Go to the dir where your `xen-api` code base is.
    - Run `opam install . --deps-only -t`, this installs the dependencies the build needs.
    - Run `./configure`
    - Now you can run `make`, `make install` or `make test`

## Kernel module policy

In XCP-ng, there is only one version of the kernel that is supported at a given time. There's also an [alternate kernel](hardware.md#alternate-kernel) available for troubleshooting. The policy differs whether the kernel modules are for XCP-ng's supported kernel or for an alternate kernel.

### What are kernel modules?
See <https://en.wikipedia.org/wiki/Loadable_kernel_module>

They can be loaded (or unloaded) dynamically into the kernel to provide more functionality: device drivers, filesystem drivers, etc.

### Definitions: supported modules, alternate modules, additional modules

A base installation of XCP-ng comes with:
* a Linux kernel (the `kernel` RPM), including lots of modules already,
* several kernel modules packaged as separate RPMs (example: `broadcom-bnxt-en` for the `bnxt_en` kernel module). Most of those are drivers for hardware devices. Those RPMs either provide drivers that are not included in the base kernel, or updated versions. They are pulled as dependencies of the `vendor-drivers` RPM. Those packages that are installed by default will be designated as **supported modules** in what follows.

Through our RPM repositories (configured by default on the hosts for `yum` to install from them), we may also provide:
* **official updates** for **supported modules**
* **alternate modules**, which are alternate versions of the officially supported modules. The supported modules can either be built-in kernel modules or modules provided through supported separate RPMs such as the `qlogic-netxtreme2` RPM. Their name is usually the same as the package they override, with an added `-alt` suffix (example: `broadcom-bnxt-en-alt`). Alternate versions can be installed for better support of recent hardware or in the hope that bugs in the supported drivers have been fixed in newer versions. They won't remove the supported drivers from the system, but the kernel will load the alternate ones instead. **Warning**: *they receive less testing than the supported modules*.
* **additional (or "extra") modules** for **additional features** (can be experimental). Example: `kmod-zfs-4.4.0+10` for ZFS support in the `4.4.0+10` kernel, or `ceph-module` for CephFS support. To know whether such a module is experimental or is fully supported, read its description or search the wiki.

### Module Updates

This section discusses the kind of updates kernel modules can receive during the maintenance cycle of a given release of XCP-ng (e.g. XCP-ng 8.2). For information about the general update process, see [Updates Howto](updates.md).

Updates for *supported modules* are offered automatically when one updates their host. In order to avoid risks of regression, they are usually only updated if there's an important bug to fix, or a security issue with them... Until the next upgrade of XCP-ng.

Updates for *alternate modules* are offered only if the given alternate modules are installed on the host. We may update to a newer version of the modules at any time, so use them if you believe that for your hardware or system, *newer is better* even if that means that their version changes from time to time.

Updates for *additional modules* are offered only if the given additional modules are installed on the host. We may update them to a newer version of the module at any time - more likely if the module is considered experimental, less likely if it's supported officially.

### Module package naming conventions

We'll now discuss naming conventions for packages that provide kernel modules. This is mostly targeted at packagers, but can also be useful to users who wish to understand the naming schemes. We've tried to make it simple and to use meaningful naming conventions, but legacy and the variety of situations led to a mixed result, so hold on!

#### Supported or additional module RPMs

Both supported modules and additional modules share the same package naming schemes.

##### Vendor driver RPMs inherited from XenServer

Those are packages that are pulled by the `vendor-drivers` RPM.

Inherited from XenServer, the naming convention is `{vendor}-{module-name}`. Example: `bnxt_en.ko` => `broadcom-bnxt-en`. Note that the underscore character in the `bnxt_en.ko` driver gets replaced by a dash in the RPM name: `bnxt-en`. And `.ko` is omitted. Another accepted scheme if unambiguous, also inherited from XenServer, is `{vendor}-{device-name}`, for example `qlogic-netxtreme2`.

Only supported modules are in this case.

##### Common case

The modules whose name does not come from XenServer RPMs follow this base naming scheme:

`{module-name}-module`.  Example: `ceph.ko` => `ceph-module`.

If the RPM contains several modules (to be avoided), then find an unambiguous name and add the `modules` suffix:

`{unambiguous-name}-modules`. No example available at the day of writing.

##### Exceptions: `kmod` packages

When we import third-party RPMs that build kernel modules, we may choose to keep the original names in order to minimize spec file changes. Examples that fall in that category: `kmod-zfs-{kernel_version}` and `kmod-spl-{kernel_version}`. Their name depends on the version of the kernel. In XCP-ng 8.2, they are named `kmod-zfs-4.19.0+1` and `kmod-spl-4.19.0+1`.

#### Alternate modules

Alternate modules (see their definition at the beginning of this document) can either override a built-in module or one that is provided as a separate *supported* or *additional* module RPM.

Alternate module packages that override a built-in kernel module will follow the "common case" convention described above for supported or additional modules, but we'll add `-alt` at the end of the name:

`{module-name}-module-alt`. Example: `ceph-module-alt` (fictitious).

Alternate module packages that override a supported or additional module are named after the package whose module they override, with a `-alt` suffix:

`{original-name}-alt`.

Examples:
* `broadcom-bnxt-en-alt`
* `tn40xx-module-alt` (fictitious)

### Versioning of the RPMs

Since we only support one version of the kernel, we don't need to include the kernel version in the package name in addition to the module version. So the `Version` tag of the RPM is that of the module.

Example: `broadcom-bnxt-en-alt-1.9.2-5.xcpng.x86_64.rpm` is the `bnxt_en` module in version 1.9.2.

Another case is when we backport a module from a newer kernel but the module itself has no version. In this case, then we'll use the version of the kernel it is coming from as the module version.

Example `ceph-module-4.4.176` is a version of the `ceph` module extracted from kernel 4.4.176 and provided as an additional module for the currently supported kernel (4.4.0+10 at the time of writing).

Exceptions: the abovementioned `kmod`-packages such as `kmod-zfs-4.4.0+10-0.7.11-1.el7.centos.x86_64.rpm` include the kernel version in the name. In this example the kernel version is `4.4.0+10` and the module version is `0.7.11`.

### Where the modules are installed on the system

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

#### `depmod` configuration for alternate modules

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

### How to use alternate or additional modules

First, a warning: alternate modules and additional modules are provided as a convenience, but they do not get the same amount of testing as the modules that are installed by default or through updates. So keep that in mind, test, and be ready to uninstall them if any issue arises.

#### How to find alternate or additional modules

##### List available alternate modules
You can list the available RPMs for alternate modules with the command below, that will search for packages whose name ends in `-alt`. Only packages that are not currently installed or have an available update will be listed.
```
yum list available | grep -e '-alt.x86_64'
```

##### List available additional modules
You can list the available RPMs for alternate modules with the command below, that will search for packages whose name ends in `-module`, or begins with `kmod-` and contains the current kernel version. Only packages that are not currently installed or have an available update will be listed.
```
yum list available | grep -e '-module.x86_64' -e '^kmod-.*-'$(uname -r)
```

##### Get more information about a package

To get more information about one of the listed packages, use `yum info`:
```
yum info {package-name}
```

#### How to install
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

#### How to load the new module without a reboot

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

#### How to remove an additional or an alternate module

```
yum remove {package-name}
```

In the case of an alternate module, we have made it so that you can simply uninstall the RPM and the base supported module will get used instead at next reboot or manual unload/reload of the module. After uninstalling the RPM, follow the same steps as when you installed it (described above): `modinfo`, reboot, check `dmesg`...

In the case of an additional module, uninstalling the RPM will simply leave your system without that module, but shouldn't remove it from the currently loaded modules until next reboot or until you unload it.

### Kernel modules for alternate kernels

The policy for [alternate kernels](hardware.md#alternate-kernel) is simpler, because there are no alternate modules (with the meaning of *alternate modules* as described earlier). There's just the kernel's built-in modules and possibly additional or updated modules in `/lib/modules/{kernel_version}/updates`. This means that when an alternate kernel is updated, people who have installed it will get the update through the standard updates process. There's no support for cherry-picking specific versions of previous packages we may have released in the past. If there's a bug, please open a bug report. To avoid bugs, please take part in the testing phase.

RPMs that provide modules for an alternate kernel must follow these conventions:
* The name must always end with `-kernel{MAJOR.MINOR}` (we don't include the patch version because we won't provide two competing kernel packages for the same MAJOR + MINOR versions).
* The remaining part of the naming convention is the same as that of packages that provide modules for the main supported kernel:
  * `{inherited-name-from-XS}-kernel{MAJOR.MINOR}`
  * `{name}-module-kernel{MAJOR.MINOR}`
  * "kmod" packages
* Modules are installed in `/lib/modules/{kernel_version}/updates` or `/lib/modules/{kernel_version}/extra` whether they are updates for built-in modules (if that situation happens) or additional packages.
* `Requires` the appropriate alternate kernel package.

## ISO modification

This page aims at guiding you through the modification of the installation ISO images, and also serves as documentation on their internals.

Obviously, a modified installation image is not an official installation image anymore, so it's harder to provide support for that. However, it can still be useful in some cases and we also hope that letting you know how to modify the installer will help getting useful contributions on its [code base](https://github.com/xcp-ng/host-installer).

### Extract an existing ISO image

```
mkdir tmpmountdir/
mount -o loop filename.iso tmpmountdir/ # as root
cp -a tmpmountdir/ iso
umount tmpmountdir/ # as root
```

Now you have the contents of the ISO image in the `iso/` directory. Note that everything in the directory is read-only at this stage, so you will need to change the file permissions or be root to modify the files.

For example:
```
chmod a+w iso/ -R
```

### Contents of the installation ISO image

We'll only list the files that are used during an installation or upgrade. The other files in the ISO are documentation or additional tools.

* `boot/`: stage 1 of the installer: initial boot then loads the second stage
* `EFI/`: used to boot on UEFI
* `install.img`: stage 2 of the installer. This file actually contains a complete Linux filesystem. In that filesystem, the installer comes from the `host-installer` RPM package. More about that below.
* `Packages/`: all the RPMs that will be installed on the system
* `repodata/`: yum metadata about the RPMs
* `.treeinfo`: often forgotten when one copies the contents of the ISO for network installation, this hidden file contains necessary metadata about XCP-ng and its version

### Modify the installer itself

The steps to modify the installer are:
* (extract the ISO image, see above)
* extract install.img
* modify the files it contains (a whole Linux filesystem)
* rebuild install.img
* (rebuild the ISO image, see below)

#### Extract install.img

```
cd iso/
mkdir install
cd install
bunzip2 < ../install.img | cpio -idm
cd ..
```

#### Navigate in the installer's filesystem

If you want to use commands in the installer's filesystem context, as root:
```
chroot install/
```
To use `yum` or `rpm`, you'll also need to mount `urandom` in your chrooted dir.
From outside the chroot run:
```
touch install/dev/urandom
mount /dev/urandom install/dev/urandom # As root!
```
Then useful commands will be available to you in the context of that filesystem, such as `rpm`, `yum`, etc.

For example, you can list all RPMs present in that "system":
```
rpm -qa | sort
```

Exit chroot with `exit` or Ctrl + D.

#### Alter the filesystem

Using chroot as explained above, you can easily remove, add or update RPMs in the installer's filesystem.

:::warning
This modifies the installer filesystem, not the host!
To modify the installed RPMs on a host see [change the list of installed RPMs](#change-the-list-of-installed-rpms).
:::

Example use cases:
* Update drivers: replace an existing driver module (*.ko) with yours, or, if you have built a RPM with that driver, install it. For example, you could rebuild a patched `qlogic-qla2xxx` RPM package and install it instead of the one that is included by default. Note that this will *not* install the newer driver on the final installed XCP-ng. We're only in the context of the system that runs during the installation phase, here.
* Modify the installer itself to fix a bug or add new features (see below)

#### Modify the installer code itself

The installer is a `python` program that comes from the `host-installer`. In chroot, you can easily locate its files with:
```
rpm -ql host-installer
```
Most of them are in `/opt/xensource/installer/`

Our git repository for the installer is: <https://github.com/xcp-ng/host-installer>. Feel free to create pull requests for your enhancements or bug fixes.

#### Build a new `install.img` with your changes

From the `iso/` directory
```
cd install/
find . | cpio -o -H newc | bzip2 > ../install.img # as root!
rm install/ -rf # as root too. Or move it somewhere else. We don't want it in the final ISO.
```

Then you can either read the next section or jump to "Build a new ISO image with your changes".

### Change the list of installed RPMs

You may want the installer to install more packages, or updated packages.

Read [the usual warnings about the installation of third party RPMs on XCP-ng.](https://github.com/xcp-ng/xcp/wiki/Updates-Howto#be-cautious-with-third-party-repositories-and-packages)

To achieve this:
* Change the RPMs in the `Packages/` directory. If you add new packages, be careful about dependencies, else they'll fail to install and the whole installation process will fail.
* If you need to add new RPMs not just replace existing ones, they need to be pulled by another existing RPM as dependencies. If there's none suitable, you can add the dependency to the [xcp-ng-deps RPM](https://github.com/xcp-ng-rpms/xcp-ng-deps).
* Update `repodata/`
  ```
  rm repodata/ -rf
  createrepo_c . -o .
  ```

### Build a new ISO image with your changes

From the `iso/` directory:
```
OUTPUT=/path/to/destination/iso/file # change me
VERSION=8.2 # change me
genisoimage -o $OUTPUT -v -r -J --joliet-long -V "XCP-ng $VERSION" -c boot/isolinux/boot.cat -b boot/isolinux/isolinux.bin \
            -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e boot/efiboot.img -no-emul-boot .
isohybrid --uefi $OUTPUT
```

## Commit message conventions

### Foreword

XCP-ng and Xen Orchestra are made of many different projects and components. This document is an attempt at defining a minimal, common set of rules for git commit messages we want to follow in the context of those projects. They should be generic and consensual enough that we can follow them for our internal commits, but also when contributing upstream (while following the upstream project's rules, of course).

Individual projects part of XCP-ng or Xen Orchestra can also define additional rules and exceptions. For example, Xen Orchestra developers follow [additional rules coming from the AngularJS guidelines](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y).

### Goals

The main goals behind the commit message rules are:

* consistency among our repositories,
* easier code review,
* easier code archeology (Good commit messages help a lot when trying to understand a piece of code, especially to answer this essential question: *WHY*?),
* following a set of largely accepted conventions in Free and Open Source Software development,
* be good citizens when contributing to upstream projects.

There could be more goals, but they are not covered by the minimal set of rules in this document. For example: permitting scripting changelog generation, with a separation between security fixes, features and bug fixes. This is left for each individual project to define.

### Structure of a commit message

The widely accepted structure is:

```
Short subject
                             [blank line]
Body:
description
of the
changes
(why and what)
                             [blank line]
Footer
```

### First line: short subject

Here's a challenge: it must remain really short (50 characters is the convention, but in this minimal set of rules we'll allow up to 70 characters), but also ideally answer three essential questions:

* Is it a feature, a bugfix, a security fix, a refactoring, a documentation update, etc. (*type*)?
* What component is modified, if this information is relevant (*scope*)?
* What changed? If contains a verb (recommended), must be in the imperative form (*short change description*).

Why must it be short? So that it fits well in the various tools that display just the first commit history: `git log --oneline`, `gitk`, GitHub, GitLab, etc.

And for the same reason it must be descriptive enough, because there are many situations where only the first line of each commit message is displayed, when browsing the history.

Starts with a capital letter unless the first word is a component name or the subject follows a structured convention that uses lowercase keywords to start the subject. No ending dot.

#### Structured subjects vs free structure

Depending on a project's conventions, the format of the first line can be left free, or structured. This document does not enforce one way or the other. Check what conventions the project follows.

An example of structure: `type(scope): short change description`. Example commit subject taken from Xen Orchestra: `feat(xo-server-netbox): optionally allow self-signed certificates`. The first part means that the commit adds a feature to the xo-server-netbox component. If the scope is not relevant, it can be omitted: `type: short change description`.

On the other side, here's an example of a commit subject that doesn't follow a structured convention but still conveys enough information: `Unify documentation style and document all plugins`. The type is documentation, the scope is all plugins, and the change is style unification and added documentation to all plugins.

When there's no structured convention, ask yourself: are the type, the scope and the change obvious in the subject I wrote?

### Second line: blank

Nothing on that line. Period. No exceptions.

### Message body: commit description

This part gets easily forgotten, but it's really important. You don't know who will read your commit, when (could be in ten years from now), what knowledge they will have about the project or about the code. Maybe they're someone from the support that has only minimal knowledge in the programming language. Maybe they're a project manager. Maybe it's a developer who took over this component after you left. And often enough, it will just be yourself scratching your head and asking yourself: "Why the h\*\*\* did I make this change???".

So, here's your opportunity to save someone's day in the future, and maybe yours.

That's why the description must clearly explain:

* The **context** of the change
* **Why** it was needed in the first place (motivation for the change)
* **Why** you chose the solution you chose
* **What** the change is. Contrasts with previous behaviour. Don't paraphrase the code: your description can be higher level. But don't expect people to read your code in order to understand your description either.

To emphasize more on this, here are rules extracted from [this guide about good commit messages](https://www.freecodecamp.org/news/writing-good-commit-messages-a-practical-guide/):

> * Use the body to explain what changes you have made and why you made them
> * Do not assume the reviewer understands what the original problem was, ensure you add it.
> * Do not think your code is self-explanatory

The description is also an introduction, a guide, for people who will review your code before they accept it (or not) in their project. GitHub's interface does not make it straightforward for reviewers to read the commit messages before they review the code, but some reviewers still go for the commit message before anything (and some other review tools give commit messages a better place and allow to comment them as part of the review).

For good examples, go look at the commit history [from the Xen project](http://xenbits.xenproject.org/gitweb/?p=xen.git;a=log;h=HEAD) or [from the linux kernel project](https://github.com/torvalds/linux/commits/master). At first, maybe you'll think "Wow, those commit messages are really verbose, why don't they just rely on the code to understand the changes?". But it's done precisely for the reasons exposed above and is necessary for projects of that scope and gathering so many different contributors, some of which just contribute once then disappear.

Verbs that describe what you did are in the imperative form. Lines should not be longer than 70 characters.

### Message footer

#### Referencing issues

Whenever possible, reference public issues or forum threads. No specific wording enforced. It can be for example any of the following, unless the project you are committing to enforces stricter rules:

* `Related to ...`
* `See ...`
* `References: ...`
* `Refs: ...`
* (`Fixes: ...`)
* (`Closes: ...`)
* Etc.

Be careful with "Fixes" or "Closes", because they can automatically close issues when the commit is merged. But what if we want the issues to be closed only when the fix or feature has been fully tested, or publically released? Check the project's processes.

#### Developer Certificate of Origin (DCO)

As a member of the Linux Foundation, XCP-ng asks every contributor to certify that they are allowed to contribute the code or documentation they submit to us. See <contributing.md#developer-certificate-of-origin-dco> for details. This is enforced for every repository under the GitHub `xcp-ng` and `xcp-ng-rpms` organizations.

## Tests

> This is a perpetual draft page. Feel free to improve.

Do you want to contribute?
Please help us to test new feature and new releases.
For every release it's important to check if everything works correctly on different hardware.

Not everyone can test everything, but everything must get tested in the end.

If anything goes wrong, try to isolate [the logs](https://github.com/xcp-ng/xcp/wiki/Logfiles) related to that failure (and what happened just before), and try to identify a way to reproduce if possible. You can also [create a full status report](https://github.com/xcp-ng/xcp/wiki/Logfiles#produce-a-status-report) to let someone else try to identify the issue.

Give priority to tests on actual hardware, but if you don't have any hardware available for those, then [testing in a nested environment](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29) is useful too.

### Basic tests

- verify installation
- verify connectivity with your interfaces
- verify connectivity to Shared Storages
- verify creation of a new Linux VM (install guest tools)
- verify creation of a new Windows VM (install guest tools)
- verify basic VM functionality (start, reboot, suspend, shutdown)
- verify migration of a VM from an host to another
- verify migration of a VM from an old host to (this) release one
- verify migration of a VM from a newest host to the old one (this test should be fail)
- verify change of the pool master from an host to another
- [check your logs](https://github.com/xcp-ng/xcp/wiki/Logfiles) for uncommon info or warnings.
- (add more here...)

### Installer

* installation, upgrade
* net-install with GPG check on
* installation with answer file
* compatibility with driver disks from Citrix?
* backup restore

### Live migration tests

Live migration needs to be tested, with or without storage motion (ie. moving the VM disk data to another storage repository). It is both a very important feature and something that can break in subtle ways, especially across different versions of XenServer or XCP-ng.

**TODO: create (and link to) a page dedicated to live migration and known issues, gotchas or incompatibilities, especially across different releases and/or during pool upgrade.**

Mixed combinations of:
* (PV-)HVM Linux
* PV Linux
* (PV-)HVM Windows
* ...

and

* VMs created in older releases and carried over several upgrades
* recent VMs
* VMs imported from other hypervisors

and

* very small VMs
* large VMs

and

* VMs with high CPU / memory / I/O usage (can be done on Linux using various options of the `stress` command). Example to be adapted and modified: `stress --io 4 --hdd 2 --vm 6 --vm-keep --vm-bytes 1000M`

and

* live migration using a shared repository (no storage migration)
* live migration with storage migration using local storage repositories
* live migration with storage migration using network repositories (or network to local / local to network)

and

* migration within a pool
* cross-pool migration, same versions
* migration from earlier releases, during pool upgrade (see below)
* migration from earlier releases, cross-pool (see below)

#### From earlier releases, during pool upgrade

This one is the most important and not the easiest to test. During a pool upgrade, the hosts of your pool have heterogeneous versions of XAPI, Xen and other components, and many features are disabled. This is a situation that is meant to be as short as possible. When live migration fails at this stage, it is never a nice situation.
**That's why this is the kind of live migration that requires the most testing**.

Note: if you don't have the hardware and VMs to test this, you can create a virtual pool using [nested virtualization](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29).

If anything fails and you absolutely need to move forward, we advise to produce and save a full [status report](https://github.com/xcp-ng/xcp/wiki/Logfiles#produce-a-status-report) on both hosts involved before continuing.

Testing the upgrade from the N-1 release is very important. Testing from older releases is important too because the likeliness of a breakage is higher.

#### From earlier releases, cross-pool

Another way to upgrade from an old XenServer or XCP-ng is to create a brand new pool and live-migrate the VMs cross-pool.
Upgrading XCP-ng from an earlier release or from XenServer often requires live migrating VMs.

Some bugs detected in the past during our tests when migrating from old versions of XenServer have been closed by its developers because the source host was running a version of XenServer from which upgrades were not supported anymore.

We try to overcome these whenever possible, but bugs that require patching the old host cannot be fixed.

### Cold migration tests

Live migration is important, but let's not forget to test "cold" migration (migration of shutdown VMs).

Mixed combinations of:
* (PV-)HVM Linux
* PV Linux
* (PV-)HVM Windows
* ...

and

* VMs created in older releases and carried over several upgrades
* recent VMs
* VMs imported from other hypervisors

and

* very small VMs
* large VMs

and

* local storage to local storage
* local storage to network storage and conversely
* network storage to network storage

and

* migration within a pool
* cross-pool migration, same versions
* migration from earlier releases, cross-pool

# Performance Tests

- compare speed of write/read of disks in the old and in the new release
- compare speed of interfaces in the old and in the new release
- (add more here...)

### Example Storage Performance Tests Using fio

#### Random write test for IOP/s, i.e. lots of small files

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4k --iodepth=64 --size=4G --readwrite=randwrite --ramp_time=4
```

#### Random Read test for IOP/s, i.e. lots of small files

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4k --iodepth=64 --size=4G --readwrite=randread --ramp_time=4
```


#### Sequential write test for throughput, i.e. one large file

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4M --iodepth=64 --size=4G --readwrite=write --ramp_time=4
```

#### Sequential Read test for throughput, i.e. one large file

```shell
sync;fio --randrepeat=1 --ioengine=libaio --direct=1 --gtod_reduce=1 --name=test --filename=test --bs=4M --iodepth=64 --size=4G --readwrite=read --ramp_time=4
```

### VM Export / Import

* Export using ZSTD compression
* Import using ZSTD compression
* Export using gzip compression
* Import using gzip compression

### Guest tools and drivers

* Linux VM created on an older pool, with older guest tools not updated
* Update existing Linux guest tools
* Installation of guest tools on new Linux VM
* Windows VM from an upgraded pool, with older guest drivers not updated
* Update existing Windows guest drivers
* Installation of guest drivers on new Windows VM


## Koji initial setup

### Certificates
Once accepted as a proven packager or as an apprentice, you will receive your connection certificate as well as the server's CA public certificate:
```
client.crt # your certificate
serverca.crt
clientca.crt
```

Copy them to `~/.koji/` (create it if it doesn't exist yet).
Make sure not to lose them and to not let anyone put their hands on them.

You may also receive a browser certificate for the connection to Koji's web interface. It has little use, though. Unless you have admin rights, the only actions available are cancelling and resubmitting builds, which you can already do with the `koji` CLI tool.
```
{login}_browser_certificate.p12
```
You need to import it into your web browser's certificate store and then use it when you log in to <https://koji.xcp-ng.org/>

### Installing koji
If your Linux distribution provides `koji` in its repositories (e.g. Fedora, CentOS or Mageia), simply install it from there. Else you can either run it from a container, or clone it from <https://pagure.io/koji>, then run it from there with something like `PYTHONPATH=$(realpath .):/usr/lib/python3.5/site-packages/ cli/koji help`. If it fails, you probably need to install additional python dependencies.

### Configuring koji
Put this in `~/.koji/config`:
```
[koji]

;url of XMLRPC server
server = https://kojihub.xcp-ng.org

;url of web interface
weburl = http://koji.xcp-ng.org

;url of package download site
topurl = http://koji.xcp-ng.org/kojifiles

;path to the koji top directory
topdir = /mnt/koji

; configuration for SSL authentication

;client certificate
cert = ~/.koji/client.crt

;certificate of the CA that issued the HTTP server certificate
serverca = ~/.koji/serverca.crt
```

In some cases, we've found that the configuration file in ~/.koji was not used. Solution: `cp ~/.koji /etc/koji.conf`.

### Test your connection
`koji moshimoshi`. If it greats you (in any language), then your connection to the server works.

### Useful commands

Just a quick list. Make sure to have read and understood [Development process tour](develprocess.md).

* Get help about the commands: `koji help` or `koji {command name} --help`.
* Start a build: `koji build [--scratch] {target} {SCM URL}`
* List the builds in a tag: `koji list-tagged {tag name}`
