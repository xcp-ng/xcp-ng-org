# Dom0 memory

Dom0 memory management.

:::tip
Dom0 is another word to talk about the *privileged domain*, also known as the *Control Domain*.
:::

Issues can arise when the control domain is lacking memory, that's why we advise to be generous with it whenever possible. Default values from the installer may be too low for your setup. In general it depends on the amount of VM's and their workload. If constraints do not allow you to follow the advice below, you can try to set lower values.

In any case:
* monitor RAM usage in the control domain
* if issues arise (failed live migration for example), [look at the logs](../../troubleshooting/log-files) for messages related to lack of memory

## Recommended values

* we advise to give at least 2GiB of RAM for Dom0. Below that your XCP-ng may experience performance issues or other weird errors.
* up to 64GiB RAM on your machine, at least 4GiB RAM for Dom0
* an host with 128GiB or more should use 8GiB RAM for Dom0

:::caution
Note: If you use ZFS, assign at least 16GB RAM to avoid swapping. ZFS (in standard configuration) uses half the Dom0 RAM as cache!
:::

## Current RAM usage

You can use `htop` to see how much RAM is currently used in the dom0. Alternatively, you can have Netdata to show you past values.

## Change dom0 memory

Example with 4 GiB:

`/opt/xensource/libexec/xen-cmdline --set-xen dom0_mem=4096M,max:4096M`

Do not mess the units and make sure to set the same value as base value and as max value.

Reboot to apply.