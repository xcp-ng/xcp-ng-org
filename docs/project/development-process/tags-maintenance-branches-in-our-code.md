# Tags, maintenance branches in our code repositories

The way we use tags and branches.

We need a few conventions to work together. The following describes the naming conventions for branches and tags in our code repositories, that is repositories located at [https://github.com/xcp-ng](https://github.com/xcp-ng). Repositories used for RPM packaging, at [https://github.com/xcp-ng-rpms/](https://github.com/xcp-ng-rpms/), use different conventions not discussed here.

The objectives of the branch and tag naming conventions are:
* always being able to know how to name tags and maintenance branches, depending on the situation
* easily identify maintenance branches for a given release of XCP-ng, based on their name
* know what branch to develop the next version on
* for our tags and branches that have been developed from upstream branches or tags, document the upstream branch names through our branch and tag naming

The first question to ask ourselves is: **who is the upstream for the software**?

## 1. We are upstream

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

## 2. We are downstream

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

### About upstream branches

* If we get the sources from XS SRPMs, then we import them to a branch named `XS` and tag `XS-XSVERSIONFULL` (`XS-8.2.0`). Example: `host-installer`.
* If we forked a git repository, we don't need to push the upstream branches or tags to our own fork. However it could be a good habit to track maintenance or hotfix branches for changes.

### Special case: `sm`

#### How to create a new branch after a XCP-ng release?

- Find the tag of the new sm release in the upstream repo and check it out.
- Create a new `UPSTREAMVERSION-XCPNGVERSION` (example: `2.46.11-8.3`) branch.
- Rebase or cherry-pick our own commits from our current maintenance branch for the previous release (example: `2.30.4-8.2`) and resolve conflicts carefully. Reorganize commits if needed for the most consistent history possible. Of course, drop patches that were already merged upstream.

#### How to synchronize a maintenance branch with the upstream?

The upstream repository doesn't contain the maintenance branches that are the basis for Citrix Hypervisor hotfixes. So the process is a bit more complicated for us, as we first need to create a branch whose contents match the contents of the tar.gz in the hotfix SRPM, and tag this as a reference for generating our patches for the RPM.

- Create a new maintenance branch, following the `UPSTREAMVERSION-XCPNGVERSION` naming convention, from the tag that matches the current (before the hotfix) version of `sm` in our RPM.
  - If it's the first `sm` hotfix for this release of XCP-ng, then start from the upstream tag
  - Else start from the tag that we had to create for the previous hotfix because upstream didn't provide one. Follow the `vUPSTREAMVERSION-xcpng` naming convention. Example: `v2.30.4-xcpng`.
- Cherry-pick upstream commits into this branch using the SRPM changelog of the upstream hotfix.
- Check if we have the same source code between the SRPM and our branch using `diff -urq <sources> <upstream sources>`.
- When our branch exactly matches the contents of the hotfix's tarball, tag it as `vUPSTREAMVERSION-xcpng`. This tag will be used to checkout for the next maintenance update, and as the base reference to generate patches for our RPM.
- At last, we can apply our specific commits on top: rebase or cherry-pick them from the previous maintenance branch for this release (example: `2.30.3-8.2`) and resolve conflicts carefully. Of course, drop patches that were already merged upstream.

### Special case: `qemu-dp`

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
