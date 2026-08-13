---
sidebar_position: 5
heading_emoji:
  the-different-migration-types: mortar_board
  requirements-and-limitations: white_check_mark
  migrate-within-a-pool: rocket
  migrate-to-another-pool: earth_africa
  when-something-blocks-the-migration: health_worker
---

# VM migration

Moving VMs between hosts, SRs and pools, live when possible.

## The different migration types {#the-different-migration-types}

* **Live migration** (same pool, shared storage): only the VM's memory and execution state move to another host. Takes seconds to minutes, no service interruption beyond a sub-second switchover.
* **Live migration with storage** ("storage motion"): additionally copies the VM's disks: between SRs, between hosts using only local storage, or **between pools**. Much longer (the whole disk is streamed), still without stopping the VM.
* **Warm migration**: a Xen Orchestra feature for cases where live migration isn't possible (very different source and destination versions, CPU incompatibility…): the VM is replicated while running, then briefly suspended and switched over. See [migrating from older releases](../installation/upgrade.md#migrate-vms-from-older-xenserverxcp-ng).
* **Cold migration**: the VM is halted; only disks move. Most robust, works across anything. See [moving disks](../storage/manage-srs.md#move-a-disk-to-another-sr) and [export/import](import-export.md).

## Requirements and limitations {#requirements-and-limitations}

* **CPU compatibility**: within a pool, [CPU leveling](../management/hosts-pools.md#heterogeneous-pools) guarantees live migration works between members. Across pools, the destination CPUs must be the same vendor and offer the features the VM currently uses (moving to a newer CPU generation usually works; the reverse may not).
* **Memory**: the destination host needs enough free RAM for the VM.
* **Attached hardware**: VMs using [PCI passthrough, physical GPUs/vGPU or USB passthrough](../compute.md) cannot live migrate: the physical device can't follow. Detach first, or migrate cold.
* **Guest tools**: strongly recommended (and required for a healthy storage motion): see [guest tools](vms.md#guest-tools).
* For storage motion, the destination SR needs space for the **full** disk size, and the disk chain gets flattened on arrival (snapshots don't follow the VM).

:::tip
On XCP-ng 8.3, you can speed up migrations on constrained networks by enabling [migration compression](../management/hosts-pools.md#migration-compression), and choose which network migrations use (Xen Orchestra: pool advanced settings → default migration network).
:::

## Migrate within a pool {#migrate-within-a-pool}

From Xen Orchestra: VM → **Migrate** action (or drag and drop the VM onto a host in the Home view). With `xe`:

<Terminal shell title="root@xcp-ng-host — Migrate within a pool">{`
xe vm-migrate vm="my-vm" host=<destination-host> live=true
`}</Terminal>

If the disks are on local storage (or you want to change SR at the same time), add a disk mapping and XAPI performs storage motion:

<Terminal shell title="root@xcp-ng-host — Migrate within a pool">{`
xe vm-migrate vm="my-vm" host=<destination-host> vdi:<vdi-uuid>=<destination-sr-uuid> live=true
`}</Terminal>

## Migrate to another pool {#migrate-to-another-pool}

From Xen Orchestra, the same **Migrate** dialog lets you pick any connected pool as destination, with per-disk SR mapping and per-interface network mapping. With `xe`:

```
xe vm-migrate vm="my-vm" remote-master=<destination-coordinator-ip> \
  remote-username=root remote-password=<password> \
  host-uuid=<destination-host-uuid> \
  vdi:<vdi-uuid>=<destination-sr-uuid> \
  vif:<vif-uuid>=<destination-network-uuid> live=true
```

Cross-pool migration is a disk copy under the hood: plan for the transfer time, and avoid concurrent backup jobs on the same VM.

## When something blocks the migration {#when-something-blocks-the-migration}

* `xe host-get-vms-which-prevent-evacuation uuid=<host-uuid>` explains why VMs can't leave a host (used by [maintenance mode](../management/hosts-pools.md#maintenance-mode)).
* "Not enough memory": free RAM on the destination, or lower the VM's [dynamic memory](vms.md#dynamic-memory).
* CPU feature errors on cross-pool moves: use warm migration (above) or a cold move.
* See also [VDI migration caveats](../storage/manage-srs.md#move-a-disk-to-another-sr) for storage-motion specifics.
