# High availability (HA)

High Availability (HA) is designed to automatically restart protected virtual machines in case a host fails. While this helps improve resilience, there are situations where HA may behave unexpectedly, prevent actions from completing, or make recovery more complex.

This page provides guidance on how to understand and resolve common HA-related issues.

To know more on high availability in general and how to set it up with XCP-ng, see the general [High availability](/management/ha/) section. For two-host pools specifically (quorum, fencing, differences with larger pools), see [HA with two hosts](/management/ha/two-hosts/).

---

## My host rebooted. Why did it reboot? {#my-host-rebooted-why-did-it-reboot}

If a host configured for high availability reboots unexpectedly, it might have: 

- self-fenced, or:
- been asked by another host to reboot

Check the host's logs to verify if any of these events happened, in particular `/var/log/xha.log`.

## I can't reach my host! {#i-cant-reach-my-host}

### Disabling HA

If a host becomes unreachable, a first step is to disable HA on your environment.

To do this, run the following commands:

<Terminal title="root@xcp-ng-host — Disabling HA">{`
xe host-emergency-ha-disable force=true
xe-toolstack-restart
`}</Terminal>

Your host will reboot with high availability disabled. This will let you:

- Verify the overall stability of your environment
- Investigate further what caused your issue with HA

:::warning
`xe host-emergency-ha-disable` does not release the HA statefile and metadata VDIs that the host keeps attached. If the host can still rejoin the pool, prefer bringing it back with HA enabled and then running `xe pool-ha-disable`: see [Bring a failed host back](/management/ha/#bring-back). Otherwise, see [I can't disable HA or destroy the heartbeat SR](#cant-disable-ha-or-destroy-heartbeat-sr).
:::

### Changing pool coordinators

If a host cannot connect to the pool coordinator, you might want to turn it into a new pool coordinator. This way, when the other hosts reboot, they will connect to the new pool coordinator, disabling high availability in the process.

To make your host reboot as a pool coordinator, run:

<Terminal shell title="root@xcp-ng-host — Changing pool coordinators">{`
xe pool-emergency-transition-to-master uuid=<host uuid>
`}</Terminal>

To tell your host the location of your pool coordinator, run:

<Terminal shell title="root@xcp-ng-host — Changing pool coordinators">{`
xe pool-emergency-reset-master master-address=<new pool coordinator hostname>
`}</Terminal>

### Re-enabling HA

Once your issue has been sorted out **and** if you still need HA, then feel free to enable HA again. To do this, run the following command on your pool:

<Terminal shell title="root@xcp-ng-host — Re-enabling HA">{`
xe pool-ha-enable heartbeat-sr-uuid=<sr uuid>
`}</Terminal>

## I can't disable HA or destroy the heartbeat SR {#cant-disable-ha-or-destroy-heartbeat-sr}

You may see one of these:

- `xe pool-ha-disable` fails with `The uuid you supplied was invalid` and `type: VDI`.
- The heartbeat SR cannot be unplugged or destroyed: `SR_BACKEND_FAILURE_74`, `NFS unmount error [opterr=umount failed with return code 16]`.
- HA is disabled, but `/etc/xensource/static-vdis/` on a host still has entries.

### Cause

While HA is enabled, each host keeps the HA statefile and metadata VDIs attached, and attaches them again at every boot (they are listed in `/etc/xensource/static-vdis/`). `xe pool-ha-disable` releases them, but only on the hosts that are up at that moment. `xe host-emergency-ha-disable` does not release them.

So a host that was down when HA was disabled, or that was recovered with `xe host-emergency-ha-disable`, keeps those VDIs attached. They hold the SR mount. If the VDIs are deleted afterwards, the entries point to VDIs that no longer exist, and `xe pool-ha-disable` fails on them.

### Solution

To avoid it, disable HA only when every host is up and in the pool: see [Disable HA](/management/ha/#disable-ha).

If this already happened, ask on the [XCP-ng Forum](https://xcp-ng.org/forum) or contact [Pro support](https://xcp-ng.com) before changing anything on the hosts.
