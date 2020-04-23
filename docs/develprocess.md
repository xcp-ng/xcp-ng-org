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

## RPM packaging for XCP-ng

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

## Our build system

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

## A tool for easy local builds: `xcp-ng-build-env`

TODO