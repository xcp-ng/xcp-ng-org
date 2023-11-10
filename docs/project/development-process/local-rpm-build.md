# Local RPM build

How to build RPMs locally.

Koji, the build system, is used only for official builds or update candidates. For daily development or community builds, we provide a simpler build environment using docker.

## `xcp-ng-build-env`
We provide a build environment that can run locally on your computer: [https://github.com/xcp-ng/xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env). It revolves around docker containers and a few convenience scripts. This is what we use for development, before we send the actual changes to our official build system, `koji`.

## Guide to local RPM rebuild
With some prior knowledge about development and RPM packaging, the documentation of [https://github.com/xcp-ng/xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env) should be enough to get you started. However, in what follows, we provide a step by step guide for anyone to become accustomed to the process.

### Requirements

* Docker. There are plenty of guides on the internet for your specific OS, so we won't cover this part here.
* A local clone of [https://github.com/xcp-ng/xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env).
* Container images built using its `build.sh` script. One per XCP-ng release. Example: `./build.sh 8.2` if your target is XCP-ng 8.2.
* [git-lfs](https://git-lfs.github.com/). It is required to be able to fetch the RPM sources from our repositories at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/).

### Get the sources for the RPM

Every RPM built by us has its sources located in a repository at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/).

Example: [https://github.com/xcp-ng-rpms/xen](https://github.com/xcp-ng-rpms/xen).

* After double-checking that you have installed `git-lfs`, locally clone the repository you want to work on.
* Checkout the branch that corresponds to your target. For XCP-ng 8.2, select the `8.2` branch.

### Build the RPM

You probably want to bring modifications to the RPM definitions before you rebuild it, but let's first focus on getting a successful build. Then we'll allow ourselves to do modifications.

* Start the container. We use the `/path/to/xcp-ng-build-env/run.py` script for that.
  * Check the supported options with `/path/to/xcp-ng-build-env/run.py --help`
  * We'll want the following options:
    * `--branch` (`-b`): this selects the target. Example: `--branch 8.2` for XCP-ng 8.2. The corresponding container image must have been built before you can use it.
    * `--volume` (`-v`): we need to 'mount' your working directory into the container using this option. Else the container won't have access to any persistent data. Example: `-v ~/workdir:/data` will make your local `~/workdir` directory available to the container under the local `/data` path.
    * `--rm`: destroy the running container when exited. Can save disk space because you won't have to remember to clean up old containers manually.
* From within the container:
  * Enter the directory containing the sources for the RPM you had cloned earlier from [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/). Example: `cd /data/git/xen`.
  * Install the build dependencies in the container: `sudo yum-builddep SPECS/*.spec -y`.
  * Build the RPM: `rpmbuild -ba SPECS/*.spec --define "_topdir $(pwd)"`. This `_topdir` strange thing is necessary to make rpmbuild accept to work in the current directory rather than in its default working directory, `~/rpmbuild`.
* When the build completes, new directories are created: `RPMS/` and `SRPMS/`, that contain the build results. In a container started with the appropriate `-v` switch, the build results will be instantly available outside the container too.

:::tip
**The handy `--local` option**: it is a convenience parameter for `run.py` that automates most of the above. From the directory containing the local clone (on your local system, outside the container), simply run: `/path/to/xcp-ng-build-env/run.py -b X.Y --local . --rm -n` and it will automatically download the build dependencies and build the package.

The additional `-n` switch means "don't exit when finished", which will let you use the initialized container (with all the build dependencies already installed) without having to restart from scratch. The local directory is mounted in the container at `~/rpmbuild/`.
:::

### Modify the RPM

Now that we know that we are able to build it, let's modify it. Here, you need basic knowledge about [RPM packaging](https://rpm-packaging-guide.github.io/). Check also our [Packaging Guidelines](#packaging-guidelines).

Basically, all the sources and patches are in the `SOURCES/` directory, and the definitions and rules are in the spec file located in `SPECS/`.

We can't cover every situation here, so we will address a simple case: add patches to a package.

* Add the patches in the `SOURCES/` directory
* Modify the spec file (`SPECS/name_of_package.spec`):
  * Add `PatchX` tags that reference the patches (where X is the number of the patch). If there already are patches, you'll usually choose a higher number. Example: `Patch1: packagename-2.1-fix-some-stuff.backport.patch`.
  * Update the `Release` tag. To clearly identify your build as a custom build, do not increase the release, but rather add a suffix to it. Example: `1%{?dist}` would become `1.0.fixstuff.1%{?dist}`. The first `0` is a way to make sure your build always has a lower release than any subsequent official update to the RPM. Then a short string that identifies your custom build (`fixstuff`). Then a digit, starting at 1, that you are free to increment at each iteration, if you do several successive builds.
  * A new changelog entry in the spec file. Not strictly necessary for the build, but it's always a good habit to update it with details about the changes, especially if you are likely to forget why you had installed it in the first place, or if you share your build RPMs with other users.

Then follow the same steps as before to build the RPM.

## An XCP-ng host as a build environment
You can also turn any XCP-ng host (preferrably installed in a VM. Don't sacrifice a physical host for that) into a build environment: all the tools and build dependencies are available from the default RPM repositories for XCP-ng, or from CentOS and EPEL repositories.

You won't benefit from the convenience scripts from [xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env) though.
