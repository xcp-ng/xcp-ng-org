---
sidebar_position: 1
---

# High availability with two hosts

You can enable [high availability (HA)](index.md) on a pool with only 2 hosts. It works, but it is not the same as HA with 3 hosts or more.

With 2 hosts there is no majority of peers. The shared heartbeat SR becomes the tie-breaker: the host that can still write the statefile can claim the other one is gone. If neither host can reach that SR, HA will not do a clean failover.

:::warning
We strongly recommend at least 3 hosts for production HA. With only 2 hosts, it is easier to fence a machine by mistake, and you can only tolerate 1 host failure. Always use maintenance mode before planned reboots or updates. Read the warnings on the main [High availability](index.md) page before you rely on this setup.
:::

## 2 hosts vs 3+ hosts {#2-hosts-vs-3-hosts}

HA always uses 2 heartbeat paths:

* **Network**: hosts tell each other they are alive (`xhad` over the management network)
* **Storage**: each host writes into the shared `ha-statefile` on the heartbeat SR

On 3+ hosts, a server that loses storage but can still talk to a majority of the pool can often stay up. On 2 hosts, "majority" does not help in the same way: you only have 1 peer. Losing the heartbeat SR on one side almost always means that host will fence.

| | 2 hosts | 3+ hosts |
|---|---------|----------|
| Quorum | Heartbeat SR is the tie-breaker | Peer majority can keep a host alive if storage is lost but network remains |
| How many hosts you can lose | 1 (then no more HA capacity) | Often more than 1, if RAM and the plan allow it |
| Heartbeat SR lost on 1 host | That host usually self-fences | May stay up if it still has majority contact |
| Heartbeat SR lost on all hosts | No safe failover; VMs stay where they are | Still no clean takeover for everyone |
| Management network cut | Easy to fence when a host is alone | Majority side can survive; minority often fences |
| Pool master dies | Survivor becomes master, then restarts protected VMs | Same, with more candidates |

:::info
On a healthy 2-host pool with enough free RAM on the survivor, `xe pool-ha-compute-max-host-failures-to-tolerate` returns 1. If the survivor cannot run the protected VMs, it returns 0. See [Maximum host failure number](index.md#maximum-host-failure-number).
:::

## `xhad` and XAPI {#xhad-and-xapi}

`xhad` handles network and storage heartbeats, the survival rule, the liveset and fencing. XAPI reads the liveset, elects a new pool master if needed, and restarts protected VMs.

On a real failure, the survivor stops seeing the peer (or the peer fails the survival rule), the failed host leaves the liveset, XAPI picks that up, and protected VMs come back on the remaining capacity. If the dead host was the pool master, the survivor becomes master first. This usually takes a few minutes, not seconds. See the **lab1** / **lab2** examples in [Host failure](index.md#host-failure).

## Common failure cases {#common-failures}

Assume HA is on, both hosts share the heartbeat SR, and at least one VM is protected. The lab walkthroughs on the main HA page use the same situations with concrete hosts (**lab1** / **lab2**).

### Power loss on 1 host {#power-loss}

[Pull the power plug](index.md#pull-the-power-plug): the survivor still has the statefile, takes over if needed, and restarts protected VMs. When you power the failed host back, it rejoins empty. Whether the failed host was master or slave does not change the outcome, only how long master election takes.

### Heartbeat storage lost on 1 host {#storage-lost-one-host}

[Pull the storage cable](index.md#pull-the-storage-cable): that host can no longer update the statefile and usually self-fences. The other host keeps the liveset and restarts protected VMs. With only 2 hosts there is no peer majority to hide behind, so this case is brutal.

### Heartbeat storage lost on both hosts {#storage-lost-both-hosts}

Neither host can use the statefile (they may still see each other on the network). Nobody can safely claim ownership, so expect no fence and no VM move. Without the SR, HA will not guess: that is a hard limit of the 2-host design.

### Management network lost on 1 host {#network-lost}

[Pull the network cable](index.md#pull-the-network-cable): the isolated host often starts fencing. The peer that still has storage heartbeat continues and can restart protected VMs.

### `xapi` dies, `xhad` stays up {#xapi-crash}

`xhad` tries to restart the toolstack. If that works: no fence, no failover, VMs stay put. If restart keeps failing, the host may eventually self-fence.

A recovered `xapi` crash alone is not an HA failover. Do not restart toolstacks while HA is enabled. See [Updates/maintenance](index.md#updatesmaintenance).

### `xhad` dies {#xhad-dies}

From the other host, heartbeats and statefile updates stop. It looks like the peer disappeared: liveset update, possible master election, VM restart. The broken side is usually fenced or rebooted by the watchdog / fence path.

## See also {#see-also}

* [High availability](index.md)
* [HA troubleshooting](../../troubleshooting/troubleshooting-ha.md)
