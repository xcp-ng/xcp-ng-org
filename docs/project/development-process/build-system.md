# Build system

Details on our build system.

Sources and spec files for RPMs is one thing, but one needs a build environment to turn them into installable RPMs.

:::tip
What follows is important if you want to understand how our official RPMs are built, or intend to contribute to the packaging.

However, for local builds meant for testing your changes (e.g. add a few patches to see how the component behaves with them), check the [Local RPM build](../local-rpm-build) section.
:::

## Enter Koji

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

## Koji's concepts

(see also [https://pagure.io/docs/koji/](https://pagure.io/docs/koji/) though its howto is very Fedora-centric)

In order to understand how Koji works, one needs to explain a few concepts: packages, builds, RPMs and tags.

### Packages, builds and RPMs

* **RPM**: a **RPM** designates a specific RPM file: `xenopsd-0.150.5-1.1.xcpng8.2.x86_64.rpm`. This is what we install in XCP-ng ultimately.
**Build**: that RPM belongs to a **build**, which groups a Source RPM (SRPM) with all the RPMs it produced, and is identified by the name of the SRPM, without the `.src.rpm` part: `xenopsd-0.150.5-1.1.xcpng8.2`.
* **Package**: the build belongs to a **package**: `xenopsd`. A package has no associated files in itself: it's just the parent of all builds that belong to it, in Koji's database.

This can be seen in the information page for a given build: [https://koji.xcp-ng.org/buildinfo?buildID=2080](https://koji.xcp-ng.org/buildinfo?buildID=2080). The package is visible as "Package Name" (you can click on it to see the package view) and the RPMs (Source RPM and regular RPMs) are visible under the "RPMs" section.

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

### Tags

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

### Build targets
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

## Build and release process
Here's how to update a package in XCP-ng, step by step. This process requires writing rights on the git repository corresponding to the package at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/) and submit rights in Koji. Others are invited to fork one the repositories at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/), [build RPMs locally in our build container](#local-rpm-build), and then create pull requests. Reading the steps below will still be useful to you to help make appropriate changes.

This applies only to packages that we build in Koji. There are also packages that are not built in Koji. Most packages from CentOS, for example, are imported directly from CentOS into our Koji instance.

Let's go:

### 0. Install and setup Koji
In order not to overload this section with information, the instructions are available in another section of this document: [Koji initial setup](#koji-initial-setup).

### 1. Package
* Make sure `git-lfs` is installed.
* Clone or update your local copy of the relevant repository at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/) (one per package).
* Switch to the branch that corresponds to the release of XCP-ng you target, e.g. `git checkout 8.2` for XCP-ng 8.2. If you target several releases of XCP-ng, you'll have to make your changes to several branches and start several builds.
* Create a temporary work branch from that branch.
* Make your changes to the `.spec` file, sources and/or patches. Follow the [RPM Packaging Guidelines](https://github.com/xcp-ng/xcp/wiki/RPM-Packaging-guidelines).
* Commit and push

### 2. Test build
* Choose a [build target](https://koji.xcp-ng.org/buildtargets). If the target release is an already released XCP-ng that is in maintenance phase, you will choose `v{VERSION}-testing`, for example `v8.2-testing`. For a development release of XCP-ng, you'll probably choose `v{VERSION}-base` instead.
* Use Koji's `--scratch` option to build the RPMs without pushing them to any RPM repository.
  * `koji build --scratch {BUILD_TARGET} git+https://github.com/xcp-ng-rpms/{PACKAGE_NAME}?#{COMMIT_HASH}`
    * For a useful history, `{COMMIT_HASH}` must be a commit hash, not a branch name. Commit hashes are stable, branches are moving targets.
* If it fails, consult the build logs in [Koji's web interface](https://koji.xcp-ng.org/).
* Ask for help if the build error is something that you can't act upon.
* Once you got a successful build, test it in your test environment (for example a nested XCP-ng VM or better yet a test pool). Look at the list of built RPMs, identify those that are updates to RPMs on the system, and install them. If additional RPMs produced by the build deserve testing, test them too.

### 3. Review and merge
* If you created several commits, consider squashing them into one unless it really makes sense to keep a separate history. If having several commits resulted from trials and errors, it's usually better to squash them into one single clean commit with a descriptive commit message.
* If you are the official maintainer for that package, rebase your work branch on top of the target branch (e.g. `git rebase 8.2`), then merge your branch on the target branch. This will result in your commits being the last on top of the target branch even if someone pushed other commits to that branch while you were working.
* If you are not the official maintainer, **create a pull request**. Your commit message should already explain why the change is needed. In addition to that, **link to the successful build result**, tell which RPMs you have **tested** from the build (no need to test `-devel` packages at this stage) and what you have tested. Even when a package requires some specific configuration or hardware, you can usually check that installing it causes no packaging conflicts, and no obvious runtime regression. If it is an update, you can also check that the update applies cleanly, that scripts or configuration reloading tasks that are meant to fire during the update are executed, etc.

### 4. Official build
* The official maintainer for the package has the responsibility to start an official build in koji (once without `--scratch`), because the result will be pushed to public RPM repositories as testing RPMs.
* Check that the build was successful
* Wait a few minutes for the RPMs to reach the RPM repositories at [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/)

### 5. Post-build tasks
* Test that you can update a host from the repositories: look at the list of built RPMs, identify those that are updates to RPMs on the system, and update them with `yum update {PACKAGE1} {PACKAGE2} {...} --enablerepo='xcp-ng-testing'`.
* Check for obvious regressions (breakages in basic functionalities).

Then, if it is an **update candidate** for an existing package:
* If the update targets several releases (for example `8.x` and `8.x+1`), test for each release.
* Announce the update candidate and ask for testers:
  * Message to [https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing)
    * Why the update
    * List of updated RPMs
    * Command to install them.
    * Command to downgrade in case of issues.
    * What to test.
    * Is a reboot required…

## Special case: new packages
Importing new packages requires extra steps.

**TODO**

## Special case: packages not built by us
Most packages imported from CentOS or EPEL are not built by our Koji instance. We import the source RPM and the built RPMs directly.

**TODO**

Bits of information can be inferred from [Import-RPM-build-dependencies-from-CentOS-and-EPEL](https://github.com/xcp-ng/xcp/wiki/Import-RPM-build-dependencies-from-CentOS-and-EPEL)

## Other tags
In a previous section, I've tried to explain what tags are used for in Koji. We use them also for something else. We probably even misuse them.

Once a day, we run a job that makes sure every *build* in our Koji instance is tagged with one of the following tags:
* `built-by-xcp`: RPMs built by our build system.
* `built-by-xs`: RPMs built by Citrix's internal build system. This one is meant to disappear progressively as we rebuild more and more of those packages.
* `built-by-centos`: imported unmodified from CentOS.
* `built-by-epel`: imported unmodified from EPEL.

In addition to this, when we import RPMs from CentOS or EPEL we tag their *builds* with tags that contain the version of CentOS they come from, or the date they've been imported from EPEL:
* `centos-{VERSION}`, for example `centos-7.5`.
* `epel-{MAJOR_VERSION}-{DATE}`, for example `epel-7-2019-01-30`

Example: [https://koji.xcp-ng.org/buildinfo?buildID=655](https://koji.xcp-ng.org/buildinfo?buildID=655)

All those tags have no purpose in Koji's workflow. They are just useful pieces of information for us.

## RPM signing
We automatically sign the RPMs built by or imported to Koji before exporting them towards the RPM repositories.

[More information about RPM signing](../../../project/mirrors#security).

## Repository generation
Handled by a cron job on koji's server. Then the repository is synchronised to [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/).
