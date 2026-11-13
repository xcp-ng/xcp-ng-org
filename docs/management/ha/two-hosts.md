---
sidebar_position: 1
---

# High availability with two hosts

You can enable [high availability (HA)](index.md) on a pool with only 2 hosts. It works, but it is not the same as HA with 3 hosts or more.

With 2 hosts, a majority cannot be formed in the event of a partition. Each host relies on the HA statefile, on a shared SR on external storage connected to both hosts (for example LVMoISCSI or NFS), to determine whether the other is still active. In the event of a tie, the host with the lower UUID remains active. If a host loses access to the HA statefile, it fences itself, unless the other host has lost it too: then neither fences, and HA does not fail over.

:::warning
We strongly recommend at least 3 hosts for production HA. With only 2 hosts, it is easier to fence a machine by mistake, and you can only tolerate 1 host failure. XOSTOR cannot be used as the heartbeat SR on a 2-host pool: it is not external storage, and it needs at least 3 hosts (see [XOSTOR prerequisites](../../xostor/xostor.md#prerequisites)). Always use maintenance mode before planned reboots or updates. Read the warnings on the main [High availability](index.md) page before you rely on this setup.
:::

## 2 hosts vs 3+ hosts {#2-hosts-vs-3-hosts}

HA always uses 2 heartbeat paths:

* **Network**: hosts tell each other they are alive (`xhad` over the management network)
* **Storage**: each host writes into the shared `ha-statefile` on the heartbeat SR

Whatever the pool size, a host that loses access to the HA statefile fences as soon as another host it can still reach on the network has access to it. A majority of hosts only matters on a network partition, and with 2 hosts there is no majority: the lowest host UUID breaks the tie.

| | 2 hosts | 3+ hosts |
|---|---------|----------|
| Quorum | HA statefile on external storage is the tie-breaker | Peer majority decides on a network partition; the HA statefile decides on storage loss |
| How many hosts you can lose | 1, if the survivor has enough free RAM to restart the protected VMs. After that, no more HA capacity | More than 1, if the remaining hosts have enough free RAM to restart the protected VMs (see [Maximum host failure number](index.md#maximum-host-failure-number)) |
| HA statefile access lost on 1 host | That host self-fences | That host self-fences |
| HA statefile access lost on all hosts | No safe failover; VMs stay where they are | Still no clean takeover for everyone |
| Management network cut | Equal partition: the host with the lowest UUID survives, the other fences | Majority side can survive; minority often fences |
| Pool master dies | Survivor becomes master, then restarts protected VMs | Same, with more candidates |

## `xhad` and XAPI {#xhad-and-xapi}

`xhad` handles network and storage heartbeats, the survival rule, the liveset and fencing. When the pool master is lost, `xhad` proposes a new master and XAPI promotes that host. XAPI also reads the liveset and restarts protected VMs.

## Common failure cases {#common-failures}

Assume HA is on, both hosts share the heartbeat SR, and at least one VM is protected. The examples on the main HA page walk through the same situations with two hosts, **lab1** and **lab2**.

### Power loss on 1 host {#power-loss}

[Pull the power plug](index.md#pull-the-power-plug): the survivor still has access to the HA statefile, takes over if needed, and restarts protected VMs. When you power the failed host back on, it rejoins the pool with no VMs running: HA does not move the protected VMs back, so migrate them yourself if needed. Whether the failed host was master or slave does not change the outcome, only how long the master takeover takes.

If the failed host was the pool master, it comes back as a slave of the new master on its own, as long as HA is still enabled when it boots. See [Bring a failed host back](index.md#bring-back).

### HA statefile access lost on 1 host {#storage-lost-one-host}

[Pull the storage cable](index.md#pull-the-storage-cable): that host can no longer update the statefile and self-fences, even if the network still works. The other host keeps the liveset and restarts protected VMs.

### HA statefile access lost on both hosts {#storage-lost-both-hosts}

Neither host can use the statefile (they may still see each other on the network). No host fences and no VM moves. If the VM disks are on the same SR as the statefile, the VMs are frozen until the storage is reachable again.

This state is fragile: while it lasts, any further failure (a host crash or a network cut between the hosts) fences both hosts. Restore storage access as soon as possible, or disable HA.

### Management network lost on 1 host {#network-lost}

[Pull the network cable](index.md#pull-the-network-cable) between the two hosts: both keep access to the HA statefile, so you get an equal-sized partition. The side with the **lowest host UUID** survives; the other self-fences. Which side of the link you break does not change that: only the UUID order decides who stays up. The survivor can restart protected VMs that lived on the fenced host.

### `xapi` dies, `xhad` stays up {#xapi-crash}

If `xapi` crashes, systemd restarts it: no fence, no failover, VMs stay put. If `xhad`'s own health check of `xapi` fails, it restarts `xapi` once; if that fails, or if `xapi` fails again within 24 hours, the host fences.

A recovered `xapi` crash alone is not an HA failover. Do not restart toolstacks while HA is enabled. See [Updates/maintenance](index.md#updatesmaintenance).

### `xhad` dies {#xhad-dies}

From the other host, heartbeats and statefile updates stop. It looks like the peer disappeared: liveset update, possible new master, VM restart. If `xhad` crashes or is killed with `SIGKILL`, the watchdog fences the host: it reboots.

Never stop `xhad` by hand: a plain `kill` (`SIGTERM`) shuts it down cleanly without rebooting the host, so the other host sees it as gone and may restart its protected VMs while they are still running there.

## Bring a failed host back {#bring-back}

Follow the steps on the [main HA page](index.md#bring-back). With 2 hosts, the survivor is the only master candidate: the fenced host always comes back as its slave, and HA cannot tolerate another failure until it has rejoined.

## Example scenarios using an NFS SR {#nfs-example-scenarios}

We validate 2-host HA on real hardware with an automated test suite. Each scenario below checks the behaviors described above (and in [Host failure](index.md#host-failure)) against this setup, so you can compare it with your own.

### Setup {#setup}

* **XCP-ng 8.3**, **2 physical hosts** in one pool, with out-of-band power control to switch a powered-off host back on
* **One network per host**, used for both management and NFS (no dedicated storage network)
* **One shared NFS SR** (NFSv3 over TCP, on an external NAS) used for both the protected VM disks and the HA statefile
* **One small protected VM** (restart priority `restart`), started on the host that will fail

Because VM disks and the statefile live on the **same** SR, losing NFS on a host always cuts storage for both HA and the VMs. Storage loss is simulated by dropping NFS traffic on a host, and a network split by dropping all traffic between the two hosts.

Most scenarios are run with the fault on the master and again on the slave. The network split is run once: an equal split always keeps the lowest host UUID, so the protected VM is started on the host that will fence.

After each scenario, the failed host is brought back as described in [Bring a failed host back](index.md#bring-back), then HA is disabled as described in [Disable HA](index.md#disable-ha). The test code is in [`tests/ha`](https://github.com/xcp-ng/xcp-ng-tests/tree/master/tests/ha) in the xcp-ng-tests repository.

### Scenarios covered {#scenarios-covered}

| What we break | What we expect |
|---------------|----------------|
| Hard power-off of one host | The other host takes over if needed and the protected VM restarts there. Powered back on, the host rejoins as a slave. |
| Kill the HA daemon (`xhad`) on one host | That host is fenced (it reboots); the survivor restarts the VM. The host rejoins as a slave after its reboot. |
| Kill the toolstack (`xapi`) on one host | A new `xapi` process starts; **no** host reboots, the master does not change, and the VM keeps running where it was. |
| NFS unreachable from **one** host | That host self-fences; the VM moves to the survivor. Once the block is removed, the host rejoins as a slave. |
| NFS unreachable from **both** hosts for longer than the HA timeout | No host reboots, roles are unchanged, HA stays enabled, and the VM does not move. The VM is frozen until NFS is reachable again, because its disk is on the same SR. |
| Management network unreachable between the two hosts | Equal partition: lowest host UUID survives; the other fences; the protected VM restarts on the survivor. Once the network is back, the fenced host rejoins. |
| Management network and NFS unreachable from **one** host | That host loses both the peer and the statefile, so it is fenced whatever its UUID; the VM moves to the survivor. Once both are back, the host rejoins. |

## See also {#see-also}

* [High availability](index.md)
* [HA troubleshooting](../../troubleshooting/troubleshooting-ha.md)
