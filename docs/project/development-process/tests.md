# Tests

How and what to test in XCP-ng.

> This is a perpetual draft page. Feel free to improve.

Do you want to contribute?
Please help us to test new feature and new releases.
For every release it's important to check if everything works correctly on different hardware.

Not everyone can test everything, but everything must get tested in the end.

If anything goes wrong, try to isolate [the logs](https://github.com/xcp-ng/xcp/wiki/Logfiles) related to that failure (and what happened just before), and try to identify a way to reproduce if possible. You can also [create a full status report](https://github.com/xcp-ng/xcp/wiki/Logfiles#produce-a-status-report) to let someone else try to identify the issue.

Give priority to tests on actual hardware, but if you don't have any hardware available for those, then [testing in a nested environment](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29) is useful too.

## Basic tests

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

## Installer

* installation, upgrade
* net-install with GPG check on
* installation with answer file
* compatibility with driver disks from Citrix?
* backup restore

## Live migration tests

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

### From earlier releases, during pool upgrade

This one is the most important and not the easiest to test. During a pool upgrade, the hosts of your pool have heterogeneous versions of XAPI, Xen and other components, and many features are disabled. This is a situation that is meant to be as short as possible. When live migration fails at this stage, it is never a nice situation.
**That's why this is the kind of live migration that requires the most testing**.

Note: if you don't have the hardware and VMs to test this, you can create a virtual pool using [nested virtualization](https://github.com/xcp-ng/xcp/wiki/Testing-XCP-ng-in-Virtual-Machine-%28Nested-Virtualization%29).

If anything fails and you absolutely need to move forward, we advise to produce and save a full [status report](https://github.com/xcp-ng/xcp/wiki/Logfiles#produce-a-status-report) on both hosts involved before continuing.

Testing the upgrade from the N-1 release is very important. Testing from older releases is important too because the likeliness of a breakage is higher.

### From earlier releases, cross-pool

Another way to upgrade from an old XenServer or XCP-ng is to create a brand new pool and live-migrate the VMs cross-pool.
Upgrading XCP-ng from an earlier release or from XenServer often requires live migrating VMs.

Some bugs detected in the past during our tests when migrating from old versions of XenServer have been closed by its developers because the source host was running a version of XenServer from which upgrades were not supported anymore.

We try to overcome these whenever possible, but bugs that require patching the old host cannot be fixed.

## Cold migration tests

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
