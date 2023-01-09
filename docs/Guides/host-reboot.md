# Reboot or shutdown a host

How to properly handle host power cycle?

## General case

The proper way to reboot or shutdown a host is:

1. **Disable** the host so that no new VM can be started on this host and so that the rest of the pool knows that the host was disabled on purpose.

   From command line: `xe host-disable host={hostname}`.

2. **Migrate** the VMs running on the host to other hosts in the pool, or shut them down.

3. **Reboot** or **shutdown**.

   Can be done from XO, or from command line: `xe host-reboot|host-shutdown host={hostname}`.

4. (After a reboot or host startup) **Move VMs back** to the host if appropriate. There is no need to re-enable the host: it is done automatically when it starts.

:::warning
Step 1 is especially important if [High Availability](ha.md) is enforced on your pool. You don't want the other hosts to believe that a host crashed or self-fenced - and take consecutive action - when it's actually planned maintenance. Alternatively, you can also disable HA on the pool for the duration of the maintenance operations to avoid issues caused by HA.
:::

## With "agile" VMs

If all your VMs are "agile", that is, they're not tied to local storage or local devices (device pass-through), and if there are enough resources on other hosts in the pool, the above can be simplified as:

1. ***Put the host into maintenance mode** from Xen Orchestra. This will disable the host, then evacuate its VMs automatically to other hosts.

   If you prefer to do it from command line, this is equivalent to: `xe host-disable host={hostname}` then `xe host-evacuate host={hostname}`.

2. **Reboot** or **shutdown**

   Can be done from XO, or from command line: `xe host-reboot|host-shutdown host={hostname}`.

3. (After a reboot or host startup) **Move VMs back** to the host if appropriate. There is no need to re-enable the host: it is done automatically when it starts.
