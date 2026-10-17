# Dom0 memory

Dom0 memory management.

:::tip
Dom0 is another word to talk about the *privileged domain*, also known as the *Control Domain*.
:::

Issues can arise when the control domain is lacking memory, that's why we advise to be generous with it whenever possible. Default values from the installer may be too low for your setup. In general it depends on the number of VMs and their workload. If constraints do not allow you to follow the advice below, you can try to set lower values.

In any case:
* monitor RAM usage in the control domain
* if issues arise (failed live migration for example), [look at the logs](../../troubleshooting/log-files) for messages related to lack of memory

## Installer default {#installer-default}

At installation, XCP-ng gives Dom0 **1 GiB plus 5% of the host's RAM, capped at 8 GiB** (the same formula as XenServer). The cap is reached on hosts with about 144 GiB of RAM: past that point, the default no longer grows with the host, and you need to raise it yourself on large hosts.

## Recommended values {#recommended-values}

| Host RAM | Dom0 RAM |
| --- | --- |
| Any host | 2 GiB minimum. Below that, expect performance issues or odd errors |
| Up to 64 GiB | 4 GiB |
| 64 to 128 GiB | 8 GiB |
| More than 128 GiB | 16 GiB |
| 1 TiB and more | 32 GiB |

Dom0 memory needs grow with the number of VMs on the host and with the I/O they generate: every virtual disk and network interface is served by a backend running in Dom0. On a host that runs many VMs, or that handles heavy backup or migration traffic (backup exports, [NBD](../networking/networking.md#nbd-backup-network) transfers, live migrations), move up one row in the table above.

:::warning
If you use [ZFS](../storage/storage.md) (offered as-is, without official support), assign at least 16 GiB to Dom0 to avoid swapping: in its standard configuration, ZFS uses half of the Dom0 RAM as cache.
:::

## Current RAM usage {#current-ram-usage}

You can use `htop` to see how much RAM is currently used in the dom0. Alternatively, you can have Netdata to show you past values.

## Change dom0 memory {#change-dom0-memory}

Example with 4 GiB:

<Terminal shell title="root@xcp-ng-host — Change dom0 memory">{`
/opt/xensource/libexec/xen-cmdline --set-xen dom0_mem=4096M,max:4096M
`}</Terminal>

Do not mix up the units and make sure to set the same value as base value and as max value.

Reboot to apply.
