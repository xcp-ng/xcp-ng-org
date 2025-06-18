# High availability (HA)

High Availability (HA) is designed to automatically restart protected virtual machines in case a host fails. While this helps improve resilience, there are situations where HA may behave unexpectedly, prevent actions from completing, or make recovery more complex.

This page provides guidance on how to understand and resolve common HA-related issues.

To know more on high availability in general and how to set it up with XCP-ng, see the general [High availability](/management/ha/) section.

---

## My host rebooted. Why did it reboot?

If a host configured for high availability reboots unexpectedly, it might have: 

- self-fenced, or:
- been asked by another host to reboot

Check the host's logs to verify if any of these events happened, in particular `/var/log/xha.log`.

## I can't reach my host!

### Disabling HA

If a host becomes unreachable, a first step is to disable HA on your environment.

To do this, run the following commands:

```
xe host-emergency-ha-disable force=true
xe-toolstack-restart
```

Your host will reboot with high availability disabled. This will let you:

- Verify the overall stability of your environment
- Investigate further what caused your issue with HA

### Changing pool coordinators

If a host cannot connect to the pool coordinator, you might want to turn it into a new pool coordinator. This way, when the other hosts reboot, they will connect to the new pool coordinator, disabling high availability in the process.

To make your host reboot as a pool coordinator, run:

```
xe pool-emergency-transition-to-master uuid=<host uuid>
```

To tell your host the location of your pool coordinator, run:

```
xe pool-emergency-reset-master master-address=<new pool coordinator hostname>
```

### Re-enabling HA

Once your issue has been sorted out **and** if you still need HA, then feel free to enable HA again. To do this, run the following command on your pool:

```
xe pool-ha-enable heartbeat-sr-uuid=<sr uuid>
```