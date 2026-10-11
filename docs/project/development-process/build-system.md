---
sidebar_position: 6
---

# Build system

Details on our build system.

Sources and spec files for RPMs is one thing, but one needs a build environment to turn them into installable RPMs.

:::tip
What follows is important if you want to understand how our official RPMs are built, or intend to contribute to the packaging.

However, for local builds meant for testing your changes (e.g. add a few patches to see how the component behaves with them), check the [Local RPM build](../local-rpm-build) section.
:::

## Enter Koji {#enter-koji}

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

## Koji's concepts {#kojis-concepts}

(see also [https://pagure.io/docs/koji/](https://pagure.io/docs/koji/) though its howto is very Fedora-centric)

In order to understand how Koji works, one needs to explain a few concepts: packages, builds, RPMs and tags.

### Packages, builds and RPMs

* **RPM**: a **RPM** designates a specific RPM file: `xenopsd-26.1.19-1.2.xcpng8.3.x86_64.rpm`. This is what we install in XCP-ng ultimately.
* **Build**: that RPM belongs to a **build**, which groups a Source RPM (SRPM) with all the RPMs it produced, and is identified by the name of the SRPM, without the `.src.rpm` part: `xapi-26.1.19-1.2.xcpng8.3`. As this example shows, an RPM's name can differ from the name of its build: in XCP-ng 8.3, `xenopsd` is one of the many RPMs produced by the `xapi` source RPM.
* **Package**: the build belongs to a **package**: `xapi`. A package has no associated files in itself: it's just the parent of all builds that belong to it, in Koji's database.

This can be seen in the information page for a given build: [https://koji.xcp-ng.org/buildinfo?buildID=6237](https://koji.xcp-ng.org/buildinfo?buildID=6237). The package is visible as "Package Name" (you can click on it to see the package view) and the RPMs (Source RPM and regular RPMs) are visible under the "RPMs" section.

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

*Packages* can be associated with tags. For example we tagged the [xapi](https://koji.xcp-ng.org/packageinfo?packageID=387) package with tag `V8.3` in order to signify "this package is present in XCP-ng 8.3". It does not achieve much per se but it is necessary for what follows: tagging builds.

*Builds* can be associated with tags too, and that is much more useful. However you cannot tag a build if the package the build belongs to is not tagged itself with that tag, so we need to tag packages first. Or with a tag that is a parent of the latter. Oh yeah, did I mention that tags can inherit other tags? An example will help: tag `v8.3-updates` inherits (indirectly) its ancestor tag `V8.3`. Since `xapi` belongs to `V8.3`, we can tag the [`xapi-26.1.19-1.2.xcpng8.3`](https://koji.xcp-ng.org/buildinfo?buildID=6237) build with tag `v8.3-updates`.

In our Koji, here's the inheritance chain of the main tags (example release taken: 8.3):
```
V8.3 (packages)
  v8.3-base (builds)
    v8.3-updates (builds)
      v8.3-candidates (builds)
        v8.3-testing (builds)
          v8.3-ci (builds)
            v8.3-incoming (builds)
```
* `V8.3` is associated to all the packages used in XCP-ng 8.3, either as installed packages on servers or as build dependencies in Koji. Notice the capital V which is a convention we follow to identify tags that are specifically associated with *packages*, not *builds*.
* `v8.3-base` inherits `V8.3` so we were able to associate it to all the builds in base XCP-ng 8.3. The `base` RPM repository for 8.3 is exported from this tag, which is now locked.
* `v8.3-updates` inherits `v8.3-base` which means it contains all builds from `v8.3-base` plus builds specifically tagged `v8.3-updates`. Those are exported to the `updates` RPM repository for 8.3.
* Each of the following tags inherits the previous one, and adds the builds specifically tagged with it. Builds tagged with `v8.3-candidates`, `v8.3-testing`, `v8.3-ci` and `v8.3-incoming` are exported to the `candidates`, `testing`, `ci` and `incoming` RPM repositories for 8.3.

Why such a chain? So that a build made at the bottom of the chain, in `v8.3-incoming`, can pull its build dependencies from everything above it: released updates, and the builds that are already on their way to users. A new build enters at `v8.3-incoming`, then moves up the chain until it is released in `v8.3-updates`. Not every build stops at every level: for example, the `xapi` build used above went from `v8.3-incoming` to `v8.3-ci`, then directly to `v8.3-updates`. Moving a build means removing one tag from it and adding another: the build itself doesn't change.

A few other 8.3 tags branch off this chain:
* `v8.3-fasttrack` inherits `v8.3-candidates`. As the name suggests, it is meant for builds that must not wait behind the content of `v8.3-testing`, `v8.3-ci` and `v8.3-incoming`.
* `v8.3-lab` inherits `v8.3-updates`. It is exported to the `lab` RPM repository, for experimental packages.
* `v8.3-v-*` tags (for example `v8.3-v-linstor` or `v8.3-v-qcow2`) hold builds for a specific feature or component, developed in parallel to the main chain.
* `v8.3-u-*` tags (for example `v8.3-u-brs1`) are user tags: mostly personal tags for developers, plus a few shared pre-build tags such as `v8.3-u-prebuild`. They inherit `v8.3-incoming`, and each is exported to a user RPM repository. You can find the list of these repositories in [https://koji.xcp-ng.org/repos/user/8/8.3/xcpng-users.repo](https://koji.xcp-ng.org/repos/user/8/8.3/xcpng-users.repo).

### Build targets
When you ask Koji to start a build, you **must** specify a build target.

Actually, in the examples above, `xapi-26.1.19-1.2.xcpng8.3` was automatically tagged `v8.3-incoming` by Koji when it was built because of another concept of Koji: **build targets**. That was not a manual operation (however, we moved it manually afterwards to `v8.3-ci`, then to `v8.3-updates` once the testing was over). The only builds that we tag manually are packages imported from CentOS or EPEL. Everything that is built by Koji gets a tag depending on the *build target*'s destination tag.

A build target is defined by:
* a name
* a build tag
* a destination tag

Example:
* build **target** name: `v8.3-incoming`
* build tag: `v8.3-incoming`
* destination tag: `v8.3-incoming`

(Yeah, sorry, we named the target the same as the tags it relies on. We hope it will not be confusing). So, this build target will pull dependencies from an internal (to Koji) RPM repository that contains all the RPMs from builds that belong to the `v8.3-incoming` tag (including those inherited from all the tags above it). Then once a build task finishes, it will tag the resulting build with the destination tag we defined for the target, here `v8.3-incoming`. Here build tag and destination tag are the same, so this means that any build with the `v8.3-incoming` target will be itself added to the `v8.3-incoming` tag immediately after the build, so the next builds with the same target will be able to use it as a build dependency (chained builds).

For XCP-ng 8.3, the [build targets](https://koji.xcp-ng.org/buildtargets) are `v8.3-incoming`, `v8.3-ci`, `v8.3-fasttrack`, `v8.3-lab`, the `v8.3-v-*` targets and the `v8.3-u-*` user targets. All of them use the same tag as build tag and destination tag. There are no targets for `v8.3-testing`, `v8.3-candidates` or `v8.3-updates`: builds only reach those tags by being moved there.

Another (fictitious) example:
* build target name: `v8.x-sandbox`
* build tag: `v8.x-testing`
* destination tag: `v8.x-sandbox`

This is just to show that build tag and destination tag **can** be different. Build dependencies will be pulled from `v8.x-testing` and the result will be put in `v8.x-sandbox`. This means that builds to the sandbox will never use packages that are already in the sandbox as build dependencies. Why would we do that? To guarantee that builds made in the sandbox are never influenced by other builds made there, possibly by other users. This is a fictitious situation, just to illustrate the concepts of build tag and destination tag.

## Build and release process {#build-and-release-process}
Here's how to update a package in XCP-ng, step by step. This process requires writing rights on the git repository corresponding to the package at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/) and submit rights in Koji. Others are invited to fork one of the repositories at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/), [build RPMs locally in our build container](../local-rpm-build), and then create pull requests. Reading the steps below will still be useful to you to help make appropriate changes.

This applies only to packages that we build in Koji. There are also packages that are not built in Koji. Most packages from CentOS, for example, are imported directly from CentOS into our Koji instance.

Let's go:

### 0. Install and setup Koji
In order not to overload this section with information, the instructions are available in another section of this document: [Koji initial setup](../koji-initial-setup).

### 1. Package
* Make sure `git-lfs` is installed.
* Clone or update your local copy of the relevant repository at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/) (one per package).
* Switch to the branch that corresponds to the release of XCP-ng you target, e.g. `git checkout 8.3` for XCP-ng 8.3. The `master` branch is for the next major release. If you target several releases of XCP-ng, you'll have to make your changes to several branches and start several builds.
* Create a temporary work branch from that branch.
* Make your changes to the `.spec` file, sources and/or patches. Follow the [RPM Packaging Guidelines](https://github.com/xcp-ng/xcp/wiki/RPM-Packaging-guidelines).
* Commit and push

### 2. Test build
* Choose a [build target](https://koji.xcp-ng.org/buildtargets). For XCP-ng 8.3, use `v8.3-incoming`.
* Use Koji's `--scratch` option to build the RPMs without tagging them or pushing them to any RPM repository.
  * `koji build --scratch {BUILD_TARGET} git+https://github.com/xcp-ng-rpms/{PACKAGE_NAME}?#{COMMIT_HASH}`
    * For a useful history, `{COMMIT_HASH}` must be a commit hash, not a branch name. Commit hashes are stable, branches are moving targets.
* Developers who have a user target (`v8.3-u-*`) can build there instead of using `--scratch`: the result is published to their user RPM repository, which makes it easy to install on test hosts. The [`koji_build.py`](https://github.com/xcp-ng/xcp/blob/master/scripts/koji/koji_build.py) helper script from the `xcp-ng/xcp` repository refuses to build to a user target unless you pass `--test-build` or `--pre-build`. Both add a suffix to the release so that the build never conflicts with an official one.
* If it fails, consult the build logs in [Koji's web interface](https://koji.xcp-ng.org/).
* Ask for help if the build error is something that you can't act upon.
* Once you got a successful build, test it in your test environment (for example a nested XCP-ng VM or better yet a test pool). Look at the list of built RPMs, identify those that are updates to RPMs on the system, and install them. If additional RPMs produced by the build deserve testing, test them too.

### 3. Review and merge
* If you created several commits, consider squashing them into one unless it really makes sense to keep a separate history. If having several commits resulted from trials and errors, it's usually better to squash them into one single clean commit with a descriptive commit message.
* If you are the official maintainer for that package, rebase your work branch on top of the target branch (e.g. `git rebase 8.3`), then merge your branch on the target branch. This will result in your commits being the last on top of the target branch even if someone pushed other commits to that branch while you were working.
* If you are not the official maintainer, **create a pull request**. Your commit message should already explain why the change is needed. In addition to that, **link to the successful build result**, tell which RPMs you have **tested** from the build (no need to test `-devel` packages at this stage) and what you have tested. Even when a package requires some specific configuration or hardware, you can usually check that installing it causes no packaging conflicts, and no obvious runtime regression. If it is an update, you can also check that the update applies cleanly, that scripts or configuration reloading tasks that are meant to fire during the update are executed, etc.

### 4. Official build
* The official maintainer for the package has the responsibility to start an official build in Koji (once without `--scratch`) with the `v8.3-incoming` target, because the result will be pushed to public RPM repositories. The commit must be the last commit of the `8.3` branch: `koji_build.py` enforces this for the `v8.3-incoming`, `v8.3-ci` and `v8.3-fasttrack` targets.
* Check that the build was successful
* Wait a few minutes for the RPMs to reach the RPM repositories at [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/)

### 5. Post-build tasks
* Test that you can update a host from the repositories: look at the list of built RPMs, identify those that are updates to RPMs on the system, and update them with `yum update {PACKAGE1} {PACKAGE2} {...} --enablerepo='xcp-ng-incoming'`.
* Check for obvious regressions (breakages in basic functionalities).

Then, if it is an **update candidate** for an existing package:
* If the update targets several releases (for example `8.x` and `8.x+1`), test for each release.
* Announce the update candidate and ask for testers. Testers usually install update candidates with `yum update --enablerepo=xcp-ng-testing,xcp-ng-candidates`:
  * Message to [https://xcp-ng.org/forum/topic/9964/xcp-ng-8-3-updates-announcements-and-testing](https://xcp-ng.org/forum/topic/9964/xcp-ng-8-3-updates-announcements-and-testing)
    * Why the update
    * List of updated RPMs
    * Command to install them.
    * Command to downgrade in case of issues.
    * What to test.
    * Is a reboot required…

## Special case: new packages {#special-case-new-packages}
Importing new packages requires extra steps.

**TODO**

## Special case: packages not built by us {#special-case-packages-not-built-by-us}
Most packages imported from CentOS or EPEL are not built by our Koji instance. We import the source RPM and the built RPMs directly.

**TODO**

Bits of information can be inferred from [Import-RPM-build-dependencies-from-CentOS-and-EPEL](https://github.com/xcp-ng/xcp/wiki/Import-RPM-build-dependencies-from-CentOS-and-EPEL)

## Other tags {#other-tags}
In a previous section, I've tried to explain what tags are used for in Koji. We use them also for something else. We probably even misuse them.

Once a day, we run a job that makes sure every *build* in our Koji instance is tagged with one of the following tags:
* `built-by-xcp-ng`: RPMs built by our build system.
* `built-by-xs`: RPMs built by XenServer's internal build system. This one is meant to disappear progressively as we rebuild more and more of those packages.
* `built-by-centos`: imported unmodified from CentOS.
* `built-by-epel`: imported unmodified from EPEL.
* `built-by-almalinux`: imported unmodified from AlmaLinux.
* `built-by-linbit`: RPMs built by LINBIT (LINSTOR and DRBD).

In addition to this, when we import RPMs from CentOS or EPEL we tag their *builds* with tags that contain the version of CentOS they come from, or the date they've been imported from EPEL:
* `centos-{VERSION}`, for example `centos-7.5`.
* `epel-{MAJOR_VERSION}-{DATE}`, for example `epel-7-2019-01-30`

Example: [https://koji.xcp-ng.org/buildinfo?buildID=655](https://koji.xcp-ng.org/buildinfo?buildID=655)

All those tags have no purpose in Koji's workflow. They are just useful pieces of information for us.

## RPM signing {#rpm-signing}
We automatically sign the RPMs built by or imported to Koji before exporting them towards the RPM repositories.

[More information about RPM signing](../../../project/mirrors#security).

## Repository generation {#repository-generation}
Handled by a cron job on koji's server. Then the repository is synchronized to [https://updates.xcp-ng.org/](https://updates.xcp-ng.org/).
