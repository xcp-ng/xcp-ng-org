# Development process tour

In this document, we will try to give you an overview of the development process as well as guides or pointers to help take part in it.

## What XCP-ng is made of

XCP-ng is a collection of components, that put together create a complete turnkey virtualization solution that you can install to bare-metal servers. Those components are packaged in the [RPM](http://rpm.org) format.

As usual in the Free Software world, we stand *on the shoulders of giants*:
* **CentOS**: many RPM packages come from the [CentOS](https://www.centos.org/) linux distribution, which in turn is based on Red Hat's [RHEL](https://en.wikipedia.org/wiki/Red_Hat_Enterprise_Linux), mostly based itself on the work of the [Fedora](https://getfedora.org/) project, all based on the work of all the developers who wrote the [FLOSS](https://en.wikipedia.org/wiki/Free/Libre_Open_Source_Software) software that is packaged in those linux distributions. Examples: glibc, GNU coreutils, openssh, crontabs, iptables, openssl and many, many more.
* **EPEL**: a few packages come from [EPEL](https://fedoraproject.org/wiki/EPEL).
* **XenServer**: most packages that make XCP-ng what it is have been rebuilt from source RPMs released by the [XenServer](https://xenserver.org/) project, with or without modifications. This includes xen, a patched linux kernel, the Xen API, and many others. This also includes redistributable drivers or tools from third party vendors.
* **XCP-ng**: the remaining packages are additions (or replacements of closed-source components) to the original XenServer distribution.

## Release process overview
Let's first discuss the RPM repository structure and define stable and development releases. Then we'll see development and packaging aspects.

### XCP-ng's RPM repositories
*A new repository structure has been introduced with XCP-ng 8.0, which is what this section will cover. For the structure used in XCP-ng 7.5 and 7.6, see https://xcp-ng.org/forum/topic/185/structure-of-the-rpm-repositories.*

First, the *goals* behind the RPM repository structure are:
* Allow fast release of fixes to the maintained stable releases.
* Allow users to test future updates before they are pushed to everyone, to help validate them.
* Allow users to upgrade from an older XCP-ng to the latest release with a simple yum update (as long as we don't cross major release borders. 7.4 to 7.6 is supported. 7.6 to 8.0 isn't).
* Have a place where additional packages from XCP-ng's core team or from the community can be made available even after the release.

You can browse the repository structure at https://updates.xcp-ng.org/

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
    └── 8.1
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
* bugfix or security updates (see [[Updates Howto]]),
* occasionnally, updates that bring enhancements without changing the behaviour you know and without regressions,
* any optional extra RPMs provided by XCP-ng's packagers *after the release*,
* any additional build dependency we had to add to build the above RPMs.

Note that having lots of additional packages in `base` and `updates` does not mean that they will get installed to your system when you update. They only get installed:
* if you voluntarily install them (`yum install ...`),
* or when pulled as a dependency of another update (in which case we do want that).

### Stable release vs development release
This is very common: released stable versions only get non-disruptive updates during their support lifetime: bug fixes and security fixes. Those are first published to the `testing` RPM repository and then moved to the `updates` RPM repository so that it is offered to all users (see [[Updates Howto]]). We also allow ourselves to add features to an existing stable version as optional packages, or as updates to existing packages provided that we can do it without creating risks of regression. Example: we added support for `zstd` compression for VM exports to an already released XCP-ng 7.6.

On the contrary, the development version (aka the next stable release) can get any kind of breaking change until the day of release. Packages are then usually directly pushed to the `base` repository.

### How a RPM package is built for XCP-ng
There are two sides of the coin: **development** and **RPM packaging**. For a given RPM package that does not come from CentOS or EPEL, we always provide packaging work. We can also provide development work, depending on the package, either as contributors to an upstream project, or as our own upstream.

Here are the usual steps. We will expand on them afterwards:
* **Develop**: happens on a software git repository as in any software project. Example: https://github.com/xcp-ng/xcp-emu-manager. Skip if we are not the upstream developer for that software and are not contributing to it yet.
* **Release**: decide that your software is good to be released as part of XCP-ng, either as an update to an existing release of XCP-ng or in the next release. Create a tag in the git repository. Example: https://github.com/xcp-ng/xcp-emu-manager/releases/tag/v0.0.9. Skip if we are not the upstream developer for that software.
* **Create or update RPM specs** and commit them to the appropriate repository at https://github.com/xcp-ng-rpms/
* **Add or update patches** to be applied above the upstream source tarball to that same repository.
* **Submit build** to the build system (koji).
* **Publish the build** to the appropriate RPM repository (`testing` for stable releases, `base` for developement release of XCP-ng)
* In the case of a developement release of XCP-ng, when all the above has been done for all the RPMs, generate an ISO image with the installer and the required RPMs.

### Where discussion happens
Usually discussion will happen:
* On [github issues]( (https://github.com/xcp-ng/xcp/issues)).
* In [the forum](https://xcp-ng.org/forum/).
* Over IRC: `#xcp-ng` and `#xcp-ng-devel` on irc.freenode.net.

Then depending on the package, we'll bring the discussion to upstream channels whenever needed.

## Development

### Contribution to upstream projects
Development (as in "write code") in XCP-ng project is mostly made of contributions to upstream projects such as https://github.com/xapi-project/, https://wiki.xenproject.org/wiki/Submitting_Xen_Project_Patches or https://github.com/xenserver/. 

For some pieces of upstream software, we have github "forks" at https://github.com/xcp-ng/xcp. For others we contribute directly without a "fork" and apply the patches directly on the RPMs at https://github.com/xcp-ng-rpms/.

### Components we **are** the upstream for
Our policy is to upstream everything if possible. However, there are some exceptions:
* Components that have no "upstream" open source equivalent. `xcp-emu-manager` (https://github.com/xcp-ng/xcp-emu-manager) is such a component that we had to write from scratch because the corresponding component in XenServer, `emu-manager`, is closed-source.
* Bits specific to the act of building XCP-ng (various scripts, branding stuff...). The main example is https://github.com/xcp-ng/xcp.

### How to help at development
It all depends on your skills and areas of interest so it's hard to tell specifically in advance. Having a look at the open github issues and pick one (https://github.com/xcp-ng/xcp/issues) could definitely help. Else, maybe there's a specific topic that you would want to help improve. Even if you don't know where to start, just come and talk with us (see "Where discussion happens" above).

## RPM packaging

Creating packages that can be installed on the user's system is called **packaging**. 

### Introduction to RPM
RPM is the package format used by Fedora, Red Hat, CentOS, Mageia, OpenSUSE and other linux distributions. It is also what we use in XCP-ng. A RPM package contains the files to be installed, metadata such as version and dependencies, and various scripts executed during installation, upgrade, uninstallation or other events.

A RPM is built from a source RPM (SRPM), which is usually made of:
* A specification file ("spec file") that defines everything about the build: build dependencies, version, release, changelog, build commands, installation, what sources to use, patches to apply, run-time dependencies, scripts (post-install, pre-install, etc.) and more.
* Upstream sources (usually a single `.tar.gz` file), unmodified unless there's a very good reason (such as stripping out non-free components).
* Patches to be applied to the upstream sources.

A given source RPM can be built in various environments (distribution, arches), so the build environment is also something that defines a RPM. The best build environment is one that matches your target. Linux distributions always start with a clean minimal build root in which dependencies declared by the SRPM are installed before starting the build. We do exactly the same.

One source RPM can produce several RPMs, named differently from the source RPM itself. Example available at https://koji.xcp-ng.org/buildinfo?buildID=663 (see the 'RPMs' section).

More about RPM:
* https://en.wikipedia.org/wiki/RPM_Package_Manager
* https://rpm.org/documentation.html

### Where to find our source RPMs
Two places.

1. As SRPM files (`.src.rpm`), they are all available in our RPM repositories at https://updates.xcp-ng.org/. Example: https://updates.xcp-ng.org/7/7.6/base/Source/SPackages/.

2. All RPMs built by us have been built from a git repository at https://github.com/xcp-ng-rpms/ containing the spec file and sources. The name of the repository matches that of the source package. `git-lfs` is required for cloning and committing, because we use it to store the source tarballs.

### Packaging guidelines

See [[RPM Packaging guidelines]].

## Build system

### Enter Koji
When building RPMs, many things can and must be automated. This is what a build system is for. Ours is [Koji](https://koji.xcp-ng.org/), which [comes from the Fedora project](https://pagure.io/koji).

Features:
* Takes a link to a git commit as input for the build and then handles everything: creation of a new buildroot, installation of the build dependencies, RPM build.
* Build history, logs, produced artifacts.
* XML-RPC APIs we can use in scripts.
* Public web interface (mostly informative).
* Portable command line client written in python.
* User authentication and credentials.

And with a bit of scripting:
* GPG signing of RPMs.
* Creation of RPM repositories.

### Koji's concepts
(see also https://pagure.io/docs/koji/ though its howto is very Fedora-centric)

In order to understand how Koji works, one needs to explain a few concepts: packages, builds, RPMs and tags.

#### Packages, builds and RPMs

* **RPM**: a **RPM** designates a specific RPM file: `xenopsd-0.66.0-1.1.xcpng.x86_64.rpm`.
* **Build**: that RPM belongs to a **build**, which groups a SRPM with all the RPMs it produced, and is identified by the name of the SRPM, without the `.src.rpm` part: `xenopsd-0.66.0-1.1.xcpng`.
* **Package**: the build belongs to a **package**: `xenopsd`.

This can be seen in this build information page: https://koji.xcp-ng.org/buildinfo?buildID=663. The package is visible as "Package Name" (you can click on it to see the package view) and the RPMs (SRPM and regular RPMs) are visible under the "RPMs" section.

Take the time to assimilate this, because it will be used in the rest of this document.

#### Tags

The way to define the workflow in koji is by defining **tags**. This is the tricky part which the official documentation did not allow me to understand well, so I had to ask from experienced users of Koji.

I'll try to explain.

*Packages* (as defined above) can be associated with tags. For example we tagged the [xenopsd](https://koji.xcp-ng.org/packageinfo?packageID=409) package with tag `V7.6` in order to signify "this package is present in XCP-ng 7.6". It does not achieve much per se but it is necessary for what follows: tagging builds.

*Builds* (as defined above) can be associated with tags too, and that is much more useful. However you cannot tag a build if the package the build belongs to is not tagged itself with that tag, so we need to tag packages first. Or with a tag that is a parent of the latter. Oh yeah, did I mention that tags can inherit other tags? An example will help: tag `v7.6-testing` inherits its ancestor tag `V7.6`. Since `xenopsd` belongs to `V7.6`, we can tag the `xenopsd-0.66.0-1.1.xcpng` build with tag `v7.6-testing`.

In our Koji, here's the inheritance chain of tags for a fictitious 8.x release: 
```
V8.x (packages)
  v8.x-base (builds)
    v8.x-updates (builds)
      v8.x-testing (builds)
```
* `V8.x` is associated to all the packages used in XCP-ng 8.x, either as installed packages on servers or as build dependencies in Koji. Notice the capslock V which is a convention I'll try to follow to identify tags that are specifically associated to *packages*, not *builds*.
* `v8.x-base` inherits `V8.x` so we were able to associate it to all the builds in base XCP-ng 8.x. The `base` RPM repository for 8.x is exported from this tag.
* `v8.x-updates` inherits `v8.x-base` which means it contains all builds from `v8.x-base` plus builds specifically tagged `v8.x-updates`. Those are exported to the `updates` RPM repository for 8.x.
* `v8.x-testing` inherits `v8.x-updates` so it contains all builds from `v8.x-base`, all builds from `v8.x-updates` and builds specifically tagged `v8.x-testing`. Why? As we will see below with build targets, this allows to make any released update taken into account when pulling dependencies for building packages in `v8.x-testing`. Builds specifically tagged `v8.x-testing` are exported to the `testing` RPM repository for 8.x.

#### Build targets
When you ask Koji to start a build, you **must** specify a build target.

Actually, in the examples above `xenopsd-0.66.0-1.1.xcpng` was automatically tagged `v7.6-testing` by koji when it was built because of another concept of Koji: **build targets**. That was not a manual operation. From XCP-ng 8.0 onwards, the only builds that we tag manually are packages imported from CentOS or EPEL. Everything that is built by Koji gets a tag depending on the *build target*'s destination tag.

A build target is defined by:
* a name
* a build tag
* a destination tag

Example: 
* build target name: `v8.x-testing` 
* build tag: `v8.x-testing`
* destination tag: `v8.x-testing`

(Yeah, sorry, I named the target the same as the tags it relies on, I hope it will not confuse you). So, this build target will pull dependencies from an internal RPM repository that contains all the RPMs from builds that belong to the `v8.x-testing` tag (including those inherited from `v8.x-base` and `v8.x-updates`). Then once a build task finishes, it will tag the resulting build with the destination tag, here `v8.x-testing`. Here build tag and destination tag are the same, so this means that any build with the `v8.x-testing` target will be itself added to the `v8.x-testing` tag immediately after the build, so the next builds with the same target will be able to use it as a dependency (chained builds).

Another (fictitious) example: 
* build target name: `v8.x-sandbox` 
* build tag: `v8.x-testing`
* destination tag: `v8.x-sandbox`

Here build tag and destination tag are different. Possible cause: we don't want packages built by other people in the sandbox to influence our own builds to it. This is a fictitious situation just to explain the concepts of build tag and destination tag.

### Build and release process
Here's how to update a package in XCP-ng, step by step. This process requires writing rights on the git repository corresponding to the package at https://github.com/xcp-ng-rpms/ and submit rights in Koji. Others are invited to fork one the repositories at https://github.com/xcp-ng-rpms/, test their builds with https://github.com/xcp-ng/xcp-ng-build-env and then create pull requests. Reading the steps below will still be useful to you to help make appropriate changes.

This applies only to packages that we build in Koji. Most packages from CentOS, for example, are not built in Koji: SRPMs and RPMs are imported directly from CentOS into our Koji instance.

Let's go:
#### 1. Package
* Make sure `git-lfs` is installed.
* Clone or update your local copy of the relevant repository at https://github.com/xcp-ng-rpms/ (one per package).
* Switch to the branch that corresponds to the release of XCP-ng you target, e.g. `git checkout 7.6` for XCP-ng 7.6. If you target several releases of XCP-ng, you'll have to make your changes to several branches and start several builds.
* Create a temporary work branch from that branch.
* Make your changes to the `.spec` file, sources and/or patches. Follow the [[RPM Packaging Guidelines]].
* Commit and push

#### 2. Test build
* Choose a [build target](https://koji.xcp-ng.org/buildtargets). If the target release is an already released XCP-ng that is in maintenance phase, you will choose `v{VERSION}-testing`, for example `v7.6-testing`. For a development release of XCP-ng, you'll probably choose `v{VERSION}-base` instead.
* Use Koji's `--scratch` option to build the RPMs without pushing them to any RPM repository.
  * `koji build --scratch {BUILD_TARGET} git+https://github.com/xcp-ng-rpms/{PACKAGE_NAME}?#{COMMIT_HASH}`
    * For a useful history, `{COMMIT_HASH}` must be a commit hash, not a branch name. Commit hashes are stable, branches are a moving target.
* If it fails, consult the build logs in [Koji's web interface](https://koji.xcp-ng.org/).
* Ask for help if the build error is something that you can't act upon.
* Once you got a successful build, test it in your test environment (for example a nested XCP-ng VM or better yet a test pool). Look at the list of built RPMs, identify those that are updates to RPMs on the system, and install them. If additional RPMs produced by the build deserve testing, test them too.

#### 3. Review and merge
* If you created several commits, consider squashing them into one unless it really makes sense to keep a separate history. If having several commits resulted from trials and errors, it's usually better to squash them into one single clean commit with a descriptive commit message.
* If you are the official maintainer for that package, rebase your work branch on top of the target branch (e.g. `git rebase 7.6`), then merge your branch on the target branch. This will result in your commits being the last on top of the target branch even if someone pushed other commits to that branch while you were working.
* If you are not the official maintainer, **create a pull request**. Your commit message should already explain why the change is needed. In addition to that, **link to the successful build result**, tell which RPMs you have **tested** from the build (no need to test `-devel` packages at this stage) and what you have tested. Even when a package requires some specific configuration or hardware, you can usually check that installing it causes no packaging conflicts, and no obvious runtime regression. If it is an update, you can also check that the update applies cleanly, that scripts or configuration reloading tasks that are meant to fire during the update are executed, etc.

#### 4. Official build
* The official maintainer for the package has the responsibility to start an official build in koji (once without `--scratch`), because the result will be pushed to public RPM repositories as testing RPMs.
* Check that the build was successful
* Wait a few minutes for the RPMs to reach the RPM repositories at https://updates.xcp-ng.org/

#### 5. Post-build tasks
* Test that you can update a host from the repositories: look at the list of built RPMs, identify those that are updates to RPMs on the system, and update them with `yum update {PACKAGE1} {PACKAGE2} {...} --enablerepo='xcp-ng-testing'` (or `--enablerepo='xcp-ng-updates_testing'` for XCP-ng <= 7.6).
* Check for obvious regressions (breakages in basic functionalities).

Then, if it is an **update candidate** for an existing package:
* If the update targets several releases (for example `8.x` and `8.x+1`), test for each release.
* Announce the update candidate and ask for testers:
  * Message to https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing
    * Why the update
    * List of updated RPMs
    * Command to install them.
    * Command to downgrade in case of issues.
    * What to test.
    * Is a reboot required...
  * For better visibility of the update candidate, also create a github issue, such as https://github.com/xcp-ng/xcp/issues/154. Add it to the [team board](https://github.com/orgs/xcp-ng/projects/2) in column "Update candidate".

### Special case: new packages
Importing new packages requires extra steps, described at [[How to add new packages to XCP-ng]].

### Special case: packages not built by us
Most packages imported from CentOS or EPEL are not built by our Koji instance. We import the source RPM and the built RPMs directly.

**TODO**

Bits of information can be inferred from [[Import-RPM-build-dependencies-from-CentOS-and-EPEL]]

### Other tags
In a previous section, I've tried to explain what tags are used for in Koji. We use them also for something else. We probably even mis-use them.

Once a day, we run a job that makes sure every *build* in our Koji instance is tagged with one of the following tags:
* `built-by-xcp`: RPMs built by our build system.
* `built-by-xs`: RPMs built by Citrix's internal build system. This one is meant to disappear progressively as we rebuild more and more of those packages.
* `built-by-centos`: imported unmodified from CentOS.
* `built-by-epel`: imported unmodified from EPEL.

In addition to this, when we import RPMs from CentOS or EPEL we tag their *builds* with tags that contain the version of CentOS they come from, or the date they've been imported from EPEL:
* `centos-{VERSION}`, for example `centos-7.5`.
* `epel-{MAJOR_VERSION}-{DATE}`, for example `epel-7-2019-01-30`

Example: https://koji.xcp-ng.org/buildinfo?buildID=655

All those tags have no purpose in Koji's workflow. They are just useful pieces of information for us.

### RPM signing
We automatically sign the RPMs built by or imported to Koji before exporting them towards the RPM repositories.

[More information about RPM signing](https://github.com/xcp-ng/xcp/wiki/How-to-check-the-authenticity-of-files-downloaded-from-XCP-mirrors).

### Repository generation
Handled by a cron job on koji's server. Then the repository is synchronised to https://updates.xcp-ng.org/.

## Build env

A tool for easy local builds: `xcp-ng-build-env`

:::tip
TODO
:::

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
    - Run `opam install . --deps-only -t`, this installs the dependecies the build needs.
    - Run `./configure`
    - Now you can run `make`, `make install` or `make test`

## Kernel module policy

In XCP-ng, there is only one version of the kernel that is supported at a given time, and possible experimental [[alternate kernels|Alternate kernel]] provided. The policy differs whether the kernel modules are for XCP-ng's supported kernel or for an alternate kernel.

### What are kernel modules?
See https://en.wikipedia.org/wiki/Loadable_kernel_module

They can be loaded (or unloaded) dynamically into the kernel to provide more functionality: device drivers, filesystem drivers, etc.

### Definitions: supported modules, alternate modules, additional modules

A base installation of XCP-ng comes with:
* a linux kernel (the `kernel` RPM), including lots of modules already,
* several kernel modules packaged as separate RPMs (example: `broadcom-bnxt-en` for the `bnxt_en` kernel module). Most of those are drivers for hardware devices. Those RPMs either provide drivers that are not included in the base kernel, or updated versions. They are pulled as dependencies of the `vendor-drivers` RPM. Those packages that are installed by default will be designated as **supported modules** in what follows.

Through our RPM repositories (configured by default on the hosts for `yum` to install from them), we may also provide:
* **official updates** for **supported modules**
* **alternate modules**, which are alternate versions of the officially supported modules. The supported modules can either be built-in kernel modules or modules provided through supported separate RPMs such as the `qlogic-netxtreme2` RPM. Their name is usually the same as the package they override, with an added `-alt` suffix (example: `broadcom-bnxt-en-alt`). Alternate versions can be installed for better support of recent hardware or in the hope that bugs in the supported drivers have been fixed in newer versions. They won't remove the supported drivers from the system, but the kernel will load the alternate ones instead. **Warning**: *they receive less testing than the supported modules*.
* **additional (or "extra") modules** for **additional features** (can be experimental). Example: `kmod-zfs-4.4.0+10` for ZFS support in the `4.4.0+10` kernel, or `ceph-module` for CephFS support. To know whether such a module is experimental or is fully supported, read its description or search the wiki.

### Module Updates

This section discusses the kind of updates kernel modules can receive during the maintenance cycle of a given release of XCP-ng (e.g. XCP-ng 7.6). For information about the general update process, see [[Updates Howto]].

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

When we import third-party RPMs that build kernel modules, we may choose to keep the original names in order to minimize spec file changes. Examples that fall in that category: `kmod-zfs-{kernel_version}` and `kmod-spl-{kernel_version}`. Their name depends on the version of the kernel. In XCP-ng 7.6, they are named `kmod-zfs-4.4.0+10` and `kmod-spl-4.4.0+10`.

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

**Process for XCP-ng 7.6**

In order to avoid a system-wide configuration change in XCP-ng 7.6 after the initial release, each alternate module needs to modify `depmod`'s configuration relative to this module so that a version in the `override` directory is preferred:
* name of the file: `/etc/depmod.d/{module_name}-{kernel_version_stripped}.conf`
  * `module_name` is the module name without its `.ko` extension
  * `kernel_version_stripped` is the kernel version as reported by `uname -r`, but anything after and including a `+` sign is removed. So `4.4.0+10` becomes `4.4.0`.  
  Example from the `broadcom-bnxt-en-alt` package for kernel 4.4.0+10: `/etc/depmod.d/bnxt_en-4.4.0.conf`
* contents: 
  ```
  override {module_name} {kernel_version_stripped} override
  ```
  It means that for the module {module} in the kernel {kernel_version_stripped}, any version of the module found in `/lib/modules/{kernel_version}/override` will get the priority. See `man depmod.d`.

  Example from the `broadcom-bnxt-en-alt` package for kernel 4.4.0+10:
  ```
  override bnxt_en 4.4.0 override
  ```

See an example spec file: https://github.com/xcp-ng-rpms/broadcom-bnxt-en-alt/blob/7.6/SPECS/broadcom-bnxt-en-alt.spec

**Intended process for XCP-ng 8.0**

In XCP-ng 8.0, we will simplify all this and change the main `depmod` configuration in `/etc/depmod.d/dist.conf`.

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

This will make `depmod` search in the `override` module directory before trying other module directories, for all modules.

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

The policy for [[alternate kernels|Alternate Kernel]] is simpler, because there are no alternate modules (with the meaning of *alternate modules* as described earlier). There's just the kernel's built-in modules and possibly additional or updated modules in `/lib/modules/{kernel_version}/updates`. This means that when an alternate kernel is updated, people who have installed it will get the update through the standard updates process. There's no support for cherry-picking specific versions of previous packages we may have released in the past. If there's a bug, please open a bug report. To avoid bugs, please take part in the testing phase.

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
* `install.img`: stage 2 of the installer. This file actually contains a complete linux filesystem. In that filesystem, the installer comes from the `host-installer` RPM package. More about that below.
* `Packages/`: all the RPMs that will be installed on the system
* `repodata/`: yum medata about the RPMs
* `.treeinfo`: often forgotten when one copies the contents of the ISO for network installation, this hidden file contains necesseray metadata about XCP-ng and its version

### Modify the installer itself

The steps to modify the installer are:
* (extract the ISO image, see above)
* extract install.img
* modify the files it contains (a whole linux filesystem)
* rebuild install.img
* (rebuild the ISO image, see below)

### Extract install.img

```
cd iso/
mkdir install
cd install
bunzip2 < ../install.img | cpio -idm
cd ..
```

### Navigate in the installer's filesystem

If you want to use commands in the installer's filesystem context, as root:
```
chroot install/
```
Then useful commands will be available to you in the context of that filesystem, such as `rpm`, `yum`, etc.

For example, you can list all RPMs present in that "system":
```
rpm -qa | sort
```

Exit chroot with `exit` or Ctrl + D.

### Alter the filesystem

Using chroot as explained above, you can easily remove, add or update RPMs in the installer's filesystem.

Example use cases:
* Update drivers: replace an existing driver module (*.ko) with yours, or, if you have built a RPM with that driver, install it. For example, you could rebuild a patched `qlogic-qla2xxx` RPM package and install it instead of the one that is included by default. Note that this will *not* install the newer driver on the final installed XCP-ng. We're only in the context of the system that runs during the installation phase, here.
* Modify the installer itself to fix a bug or add new features (see below)

### Modify the installer code itself

The installer is a `python` program that comes from the `host-installer`. In chroot, you can easily locate its files with:
```
rpm -ql host-installer
```
Most of them are in `/opt/xensource/installer/`

Our git repository for the installer is: https://github.com/xcp-ng/host-installer. Feel free to create pull requests for your enhancements or bug fixes.

### Build a new `install.img` with your changes

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
* Copy the file called `repodata/{varying_checksum_here}-groups.xml to a temporary location such as `/tmp/groups.xml`
* Modify it to add or remove RPMs from the groups. There are two groups and both will be installed, so it's not very important if you don't know which one to modify. Just pick one. You don't need to add all the dependencies: they will be pulled automatically if you made them available in `Packages/`.
* Update `repodata/`
  ```
  rm repodata/ -rf
  createrepo_c . -o . -g /tmp/groups.xml
  ```

### Build a new ISO image with your changes

From the `iso/` directory:
```
OUTPUT=/path/to/destination/iso/file # change me
VERSION=7.6 # change me
genisoimage -o $OUTPUT -v -r -J --joliet-long -V "XCP-ng $VERSION" -c boot/isolinux/boot.cat -b boot/isolinux/isolinux.bin \
            -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e boot/efiboot.img -no-emul-boot .         
isohybrid --uefi $OUTPUT
```
