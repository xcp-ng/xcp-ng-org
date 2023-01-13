# XCP-ng 8.3



## Release information

* Released on TODO
* Based on Xenserver 8 Stream
* Base version of CentOS in dom0: 7.5
* Xen TODO + patches
* Kernel 4.19 + patches
* Supported until TODO

## Install

See [Installation](install.md).

## Upgrade from previous releases

TODO 

## What changed since 8.2 LTS

### Highlight from Citrix Hypervisor changes
Full release notes at TODO

Main changes announced by Citrix:
* vTPM and Windows 11 support
* TODO

Other changes:
* TODO

**The rest, below, is about changes specific to XCP-ng, or designed/developed with Vates and included in Citrix Hypervisor.**

### Installer

#### Authenticity checks of the packages to be installed and their metadata

TODO

Context: how 8.2.1 worked, what was checked, what wasn't.

What changes in 8.3: what's checked now by default, answerfile and command line options, UI changes (checkbox removed)

When you might need to disable the checks: custom ISO with unsigned RPMs or unsigned repodata
