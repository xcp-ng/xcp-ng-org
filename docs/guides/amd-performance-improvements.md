# Network traffic performance on AMD processors

This page details performance improvements on AMD processors and how to deploy the fixes on your pool.

## What's the "AMD EPYC performance" story?

This issue was first identified on EPYC processors in 2024, which is why it was first called the "AMD EPYC performance issue". However, it affects all AMD processors, not just the EPYC product line.

The performance issue on AMD processors was characterized by low bandwidth on internal VM-to-VM traffic (inside the same host) and VM-to-host-network traffic, especially when compared with Intel processors.
Network traffic is efficient for many workloads, but not the most demanding ones.

As with most performance issues, this case is complicated. The issue can stem from multiple causes, but at least one bottleneck has been eliminated.

## Fix 1 (significant): uncached grant-tables

### Technical description of the issue and its fix

Due to differences between processor architectures and Xen's isolation, grant-tables in Xen were not cached the same way on Intel and AMD CPUs. This patch fixes the location of the grant-tables mapping: it moves caching from `Uncached` mode to `Writeback` mode.

Finally, with help from the XenServer team, we realized that a specific data structure wasn't cached, which severely reduces performance.

However, this fix is _not_ useful on current Intel processors. You can enable it on Intel processors anyway, since the changes are not known to cause any regression.

### How to enable the fix

:::warning
The fix is only available on XCP-ng 8.3 with `xapi` >= 25.6.0-1.11.xcpng8.3 and `xen` >= 4.17.5-15.2.xcpng8.3
:::

Xenopsd supports a new option, allowing the grant-tables to be mapped as `writeback` instead of `uncacheable`.

Guests need their kernel to support the feature that enables the fix (See partial list below). Windows and BSD guests were not affected by the performance problem solved by this change.

The change has to be opt-in, so that users:
- know of the change
- know how to revert the change (should side-effects occur in edge cases)

* To enable the fix pool-wide, create a file named `/etc/xenopsd.conf.d/amd-gnttab-wb.conf` with the following line:

```
xen-platform-pci-bar-uc=false
```

1. Restart the toolstack on the host: `xe-toolstack-restart`
2. Add the configuration and restart the toolstack on every other host of the pool
3. **Stop and start VMs** to apply the configuration during the new boot (a simple reboot is not enough).

This configuration will become default in a few months, with a future update to XCP-ng 8.3.

There's more work to be done to improve performance on AMD EPYC servers, but it is significant progress!

### How to validate the fix on Linux guests

Use the [`check_grant_table_cacheability.py`](https://github.com/xcp-ng/xcp/blob/master/scripts/amd_perf/check_grant_table_cacheability.py) script:

```
$ wget https://raw.githubusercontent.com/xcp-ng/xcp/refs/heads/master/scripts/amd_perf/check_grant_table_cacheability.py
$ sudo python3 ./check_grant_table_cacheability.py
'xen-platform-pci' PCI IO mem address is 0xFB000000
Grant table cacheability fix is ACTIVE.
```

### OS support

**Ready:**
Linux distributions with recent enough kernels or distros that apply fixes from the mainline LTS kernels are OK.

**Not ready:**

Older distros.

Some currently-supported LTS distros don't have the patch yet. Specifically: RHEL 8 and 9 and their derivatives.

**Will never be ready:**

End-of-Life distros will never be updated and therefore, will never benefit from this improvement.


Guest kernel version determines whether the performance fix is supported or not. All kernel versions **equal to or newer than 5.19** support it. LTS kernels include 5.15.189+.

* Debian:
  * Debian 11 "Bullseye" (5.10 -> _EOL_)
  * Debian 12 "Bookworm" (6.1 -> **OK**)
* Ubuntu:
  * 20.04 LTS "Focal Fossa" (5.4: _EOL_)
  * 22.04 LTS "Jammy Jellyfish" (5.15: _SOON_, HWE 6.8: **OK**)
  * 24.04 LTS "Noble Numbat" (6.8 & HWE 6.14: **OK**)
* openSUSE Leap:
  * 15.5 (5.14: _EOL_)
  * 15.6 (6.4: **OK**)
* SUSE Enterprise (LTSS):
  * SLE15 SP3 - LTSS (5.3: _Not upstream_)
  * SLE15 SP4/5 - LTSS (5.14: _Not upstream_)
  * SLE15 SP6+ (**OK**)
* RHEL (+derivates):
  * 8 (4.19: _EOL_)
  * 9 (5.14: _Not upstream_)
  * 10 (6.12: **OK**)
* Fedora: All supported: **OK** (37+)
* Alpine Linux: All supported: **OK** (v3.18+)


* _EOL_ = distro is End-of-Life
* _Not upstream_ = not covered by Linux stable project
* _SOON_: Distro needs to update its kernel


## Fix 2: spurious interrupts

### Technical description of the issue and its fix

Spurious interrupts are interrupts that arise for no reason —there is no work to do.
To avoid denial-of-service, xen devices front-ends implement security measures to avoid spurious interrupts from the backends. To do that, front-ends put interrupt handlers on hold for a short period of time. With this delay, front-ends can hopefully mitigate the flood of spurious interruptions caused by the backend.

Sadly, the spurious interrupts weren't caused by the backend. They were caused by another part of the code, which consumes packets outside of the interrupt handler.

The real cause was fixed upstream. Don't hesitate to read the full [commit message](https://lore.kernel.org/all/20250721093316.23560-1-anthoine.bourgeois@vates.tech/) for more technical details.

### How to enable the fix

This issue occurred only on the front-end side. This means that the only way to improve network bandwidth is to upgrade the guest kernel, which limits spurious interrupts.

Fix 1 (on grant-tables) and fix 2 work independently from each other. You can apply them both.
The fixes don't guarantee better performance for every processor model (See [Future improvements below](#future-improvments-and-leads)) but we didn't detect any regression when applying them.
The fix is not specific to AMD —it can improve internal network performance on Intel processors too.

### OS support

Since the fix is very recent, no distribution includes it yet.

However, the fix is upstream in the Linux kernel (v6.17) and LTS kernels are up-to-date.
Here are the LTS kernels that have been fixed:
* v5.10.241
* v5.15.190
* v6.1.149
* v6.6.103
* v6.12.43
* v6.15.11
* v6.16.2

## Future improvements and leads

The last improvement does not work on every platform, so the story may not be over yet. At least one bottleneck remains.

The investigation goes on.
