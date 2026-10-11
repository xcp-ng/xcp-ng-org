---
sidebar_position: 7
---

# Local RPM build

How to build RPMs locally.

Koji, the build system, is used only for official builds or update candidates. For daily development or community builds, we provide a simpler build environment based on containers.

## `xcp-ng-build-env` {#xcp-ng-build-env}
We provide a build environment that can run locally on your computer: [https://github.com/xcp-ng/xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env). It consists of container images (one per XCP-ng release) and a command line tool, `xcp-ng-dev`, that starts a container with the right options. This is what we use for development, before we send the actual changes to our official build system, `koji`.

The container images reproduce the build environment of an XCP-ng release: the CentOS base, the XCP-ng RPM repositories for that release, and the usual RPM build tools. Prebuilt images are published on the GitHub container registry as `ghcr.io/xcp-ng/xcp-ng-build-env:<version>`. Use `ghcr.io/xcp-ng/xcp-ng-build-env:8.3` for XCP-ng 8.3.

## Guide to local RPM rebuild {#guide-to-local-rpm-rebuild}
With some prior knowledge about development and RPM packaging, the documentation of [https://github.com/xcp-ng/xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env) should be enough to get you started. The following steps walk you through the whole process for XCP-ng 8.3.

### Requirements

* Docker or Podman. If both are installed, `xcp-ng-dev` uses Docker. To force one of them, set the `XCPNG_OCI_RUNNER` environment variable to `docker` or `podman`.
* [git-lfs](https://git-lfs.com/). It is required to fetch the source tarballs from our repositories at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/). Without it, the build can't find the sources.
* The `xcp-ng-dev` tool, installed with [uv](https://docs.astral.sh/uv/) or [pipx](https://pipx.pypa.io/):

  ```sh
  uv tool install --from git+https://github.com/xcp-ng/xcp-ng-build-env xcp-ng-dev
  # or
  pipx install git+https://github.com/xcp-ng/xcp-ng-build-env
  ```

  To update it later, run the same `uv` command again, or the `pipx` command with `--force`.

### Get the container image {#get-the-container-image}

`xcp-ng-dev` pulls the image from `ghcr.io` automatically the first time you use it, so there is nothing to do in most cases. To fetch the latest version of the image explicitly:

```sh
docker pull ghcr.io/xcp-ng/xcp-ng-build-env:8.3
# or
podman pull ghcr.io/xcp-ng/xcp-ng-build-env:8.3
```

You only need to build the image yourself if you work on the build environment itself. Clone the repository, then run its build script with the target XCP-ng version:

```sh
git clone https://github.com/xcp-ng/xcp-ng-build-env
cd xcp-ng-build-env
./container/build.sh 8.3
```

The script tags the result as `ghcr.io/xcp-ng/xcp-ng-build-env:8.3`, and `xcp-ng-dev` uses that local image instead of pulling one. Docker and Podman store images separately, so build the image with the runner you will use.

### Get the sources for the RPM

Every RPM built by us has its sources located in a repository at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/).

Example: [https://github.com/xcp-ng-rpms/xen](https://github.com/xcp-ng-rpms/xen).

* After double-checking that you have installed `git-lfs`, locally clone the repository you want to work on.
* Checkout the branch that corresponds to your target. For XCP-ng 8.3, select the `8.3` branch.

```sh
git clone https://github.com/xcp-ng-rpms/xen.git
cd xen
git checkout 8.3
```

### Build the RPM

You probably want to bring modifications to the RPM definitions before you rebuild it, but let's first focus on getting a successful build. Then we'll allow ourselves to do modifications.

From the directory that contains the local clone (outside any container), run:

```sh
xcp-ng-dev container build 8.3 xen/
```

`8.3` selects the container image, and `xen/` is the directory that contains `SPECS/` and `SOURCES/` (it defaults to the current directory). The tool mounts that directory in the container, installs the build dependencies of the spec file, and runs `rpmbuild`. When the build completes, the results are in the `RPMS/` and `SRPMS/` subdirectories of your clone. Any previous `BUILD`, `BUILDROOT`, `RPMS` or `SRPMS` directories there are removed first.

Useful options (see `xcp-ng-dev container build --help` for the full list):
* `-n` (`--no-exit`): drop into a shell in the container when the build finishes, instead of exiting. Handy to debug a failed build: the build dependencies are already installed.
* `-o` (`--output-dir`): copy the RPMs and SRPMs to another directory.
* `-a` (`--enablerepo`): enable additional XCP-ng repositories before installing build dependencies, for example `--enablerepo=xcp-ng-incoming`.
* `--define`: pass a macro definition to `rpmbuild`.
* `-v` (`--volume`): mount additional directories, with the same syntax as `docker run -v`.
* `--no-rm`: keep the container after it exits (by default, it is destroyed).

To work manually in the build environment, start a shell instead: `xcp-ng-dev container shell 8.3`. Combine it with `-v` to make your working directories available inside the container, for example `-v ~/workdir:/data`.

:::tip
`xcp-ng-dev` can also build with `mock`, the tool Koji uses, instead of a container: `xcp-ng-dev mock build v8.3-incoming xen/`. Here the argument is a Koji tag rather than an image version. This requires `mock` and a configured `koji` client on your machine (see [Koji initial setup](../koji-initial-setup)).
:::

### Modify the RPM

Now that we know that we are able to build it, let's modify it. Here, you need basic knowledge about [RPM packaging](https://rpm-packaging-guide.github.io/). Check also our [Packaging Guidelines](../rpm-packaging/#packaging-guidelines).

Basically, all the sources and patches are in the `SOURCES/` directory, and the definitions and rules are in the spec file located in `SPECS/`.

We can't cover every situation here, so we will address a simple case: add patches to a package.

* Add the patches in the `SOURCES/` directory
* Modify the spec file (`SPECS/name_of_package.spec`):
  * Add `PatchX` tags that reference the patches (where X is the number of the patch). If there already are patches, you'll usually choose a higher number. Example: `Patch1: packagename-2.1-fix-some-stuff.backport.patch`.
  * Update the `Release` tag. To clearly identify your build as a custom build, do not increase the release, but rather add a suffix to it. Example: `1%{?dist}` would become `1.0.fixstuff.1%{?dist}`. The first `0` is a way to make sure your build always has a lower release than any subsequent official update to the RPM. Then a short string that identifies your custom build (`fixstuff`). Then a digit, starting at 1, that you are free to increment at each iteration, if you do several successive builds.
  * A new changelog entry in the spec file. Not strictly necessary for the build, but it's always a good habit to update it with details about the changes, especially if you are likely to forget why you had installed it in the first place, or if you share your build RPMs with other users.

Then follow the same steps as before to build the RPM.

## An XCP-ng host as a build environment {#an-xcp-ng-host-as-a-build-environment}
You can also turn any XCP-ng host (preferably installed in a VM: don't sacrifice a physical host for that) into a build environment: all the tools and build dependencies are available from the default RPM repositories for XCP-ng, or from CentOS and EPEL repositories.

You won't benefit from the convenience of [xcp-ng-build-env](https://github.com/xcp-ng/xcp-ng-build-env) though.
