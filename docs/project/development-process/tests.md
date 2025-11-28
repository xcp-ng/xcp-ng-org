---
sidebar_position: 12
---

# Tests

How and what to test in XCP-ng.

> This is a perpetual draft page. Feel free to improve.

Do you want to contribute?
Please help us to test new feature and new releases.
For every release it's important to check if everything works correctly on different hardware.

Not everyone can test everything, but everything must get tested in the end.

If anything goes wrong, try to isolate [the logs](../../troubleshooting/log-files.md) related to that failure (and what happened just before), and try to identify a way to reproduce if possible. You can also [create a full status report](../../troubleshooting/log-files.md#produce-a-status-report) to let someone else try to identify the issue.

Give priority to tests on actual hardware, but if you don't have any hardware available for those, then [testing in a nested environment](../compute.md#-nested-virtualization) is useful too.

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
- [check your logs](../../troubleshooting/log-files.md) for uncommon info or warnings.
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

Note: if you don't have the hardware and VMs to test this, you can create a virtual pool using [nested virtualization](../../compute.md#-nested-virtualization).

If anything fails and you absolutely need to move forward, we advise to produce and save a full [status report](../../troubleshooting/log-files.md#produce-a-status-report) on both hosts involved before continuing.

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

## Test the Xen hypervisor itself

The Xen hypervisor, which is at the core of XCP-ng, will benefit from being tested on a wide range of hardware. There exist test suites for this. You don't need to run them on every host you own if they are truly identical, but it's good to run them on as wide a range of hardware as possible.

Be aware that some of the tests may sometimes cause the host to crash, so don't test on production hosts.

:::tip Feedback
Please report any issue or unexpected result on [the forum](https://xcp-ng.org/forum/).
:::

### XTF

The first test suite is **XTF** (stands for Xen Test Framework)

Enable HVM FEP on the host. This is not mandatory but if you don't, several tests that require it will be skipped:
```
/opt/xensource/libexec/xen-cmdline --set-xen hvm_fep
reboot
```

Note: this debug setting is not recommended for production.

Build XTF
```
yum install gcc git -y
git clone git://xenbits.xen.org/xtf.git
cd xtf
make -j8
```

(Optional, protects your host from a crash if its hardware is vulnerable to [XSA-304](https://xenbits.xen.org/xsa/advisory-304.html)) Switch EPT superpages to secure mode:
```
xl set-parameters ept=no-exec-sp
```

Run the tests
```
# self test
./xtf-runner selftest -q --host
# all tests
# -q stands for quiet. Remove one or both if you want to see details.
./xtf-runner -aqq --host
# check return code. Should be "3" which means "no failures but some tests were skipped":
echo $?
```

Switch back EPT superpages to fast mode, if needed
```
xl set-parameters ept=exec-sp
```

There will be a few SKIPPED tests, but there shouldn't be many.

Known skipped tests:
* `test-hvm32-umip`, `test-hvm64-umip`: skipped if the CPU is not recent enough to support UMIP.
* `test-pv64-xsa-167`: tests PV superpages, support for which was removed long ago from Xen. Always skips.
* `test-pv64-xsa-182`: skipped in default configuration.
* `test-pv64-xsa-444`: will skip if DBEXT (an AMD feature) support is not present. So skips on all Intel systems.

You can ignore skipped tests which belong to this list.

### xen-dom0-tests

The `xen-dom0-tests` RPM provides several test programs from the Xen Project.

Install:
```
yum install xen-dom0-tests
```

Read `/usr/share/xen-dom0-tests-metadata.json`, then, for each test listed in it, run the corresponding binary found in `/usr/libexec/xen/bin/` and check the return code.

For example:

```
/usr/libexec/xen/bin/test-cpu-policy
# check return code. Must be 0, otherwise this means there was a failure.
echo $?
```

Here is a `bash` snippet which automates this process. It requires python3 and thus will only work on XCP-ng 8.3 or above.

```
python3 << EOF && echo -e "\nALL TESTS PASSED" || (echo -e "\nSOMETHING WENT WRONG" && exit 1)
import json, subprocess
for test in json.loads(open("/usr/share/xen-dom0-tests-metadata.json").read())["tests"]:
    print(f"\n*** {test} ***")
    subprocess.check_call([f"/usr/libexec/xen/bin/{test}"])
EOF
```
