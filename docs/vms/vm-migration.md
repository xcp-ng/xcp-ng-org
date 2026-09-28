---
sidebar_position: 5
---

# VM migration

Moving VMs between hosts, SRs and pools, live when possible.

## The different migration types {#the-different-migration-types}

* **Live migration** (same pool, shared storage): moves the VM's memory and execution state to another host without shutting it down. Takes seconds to minutes.
* **Live migration with storage** ("storage motion"): additionally copies the VM's disks: between SRs, between hosts using only local storage, or **between pools**. Much longer (the whole disk is streamed), still without stopping the VM.
* **Warm migration**: a Xen Orchestra feature for cases where live migration isn't possible (very different source and destination versions, CPU incompatibility…). Makes use of the XO replication feature and shuts down the VM to finalize the migration. See [migrating from older releases](../installation/upgrade.md#migrate-vms-from-older-xenserverxcp-ng).
* **Cold migration**: the VM is halted; only disks move. Most robust, works across anything. See [moving disks](../storage/manage-srs.md#move-a-disk-to-another-sr) and [export/import](import-export.md).

## Requirements and limitations {#requirements-and-limitations}

* **CPU compatibility**: within a pool, [CPU leveling](../management/hosts-pools.md#heterogeneous-pools) guarantees live migration works between members. Across pools, the destination CPUs must be the same vendor and offer the features the VM currently uses (moving to a newer CPU generation usually works; the reverse may not).
* **Memory**: the destination host needs enough free RAM for the VM.
* **Attached hardware**: VMs using [PCI passthrough, physical GPUs/vGPU or USB passthrough](../compute.md) cannot live migrate: the physical device can't follow. Detach first, or migrate cold.
* **Guest tools**: strongly recommended (and required for a healthy storage motion): see [guest tools](vms.md#guest-tools).
* For storage motion, the destination SR needs space for the **full** disk size, and the disk chain gets flattened on arrival (snapshots don't follow the VM).

## Live migration performance {#live-migration-performance}

When live migrating a VM, its state is transferred to the destination host and loaded into a new VM. In order to resume the destination VM in the same state as the source VM, Xen's approach is to not allow the state to change while the transfer is finalized and the new VM is activated. The result is a few seconds of downtime or more depending on the VM and hosts activity during migration. Steps done during this phase include:

* Sending the VM memory modified during the last transfer iteration to the destination host
* Saving, transferring and restoring the VM devices state
* Plugging and activating virtual disks and network interfaces to the destination VM

The VM state itself is a data stream written to a file and transferred over the network. The stream encryption/decryption and optional compression/decompression currently involve separate processes in the source and destination hosts. This stresses their CPUs and I/O data paths, which can slow down the migration. Busy VMs push the hosts CPUs harder which can elongate the time spent in each of these steps.

### Best practices

While a few seconds of VM downtime at the end of a live migration is expected behaviour and cannot be worked around, here are recommendations to keep it as low as possible:

* **Work with performance factors**: migrating during lower periods of VM RAM and I/O usage should be the priority. Limiting the number of virtual disks attached to the VM will help reduce both the downtime and overall migration time.
* **Enable migration compression** (when applicable): the downtime during the final VM memory transfer iteration can increase significantly with VM RAM usage. Migration networks with a throughput of 10Gb/s or less can benefit from [migration compression](../management/hosts-pools.md#migration-compression).

:::tip
On XCP-ng 8.3, you can specify the migration network (Xen Orchestra: pool advanced settings → default migration network).
:::

Reducing migration downtime and reducing the overall migration time are two distinct objectives. Our focus is on improving each step of the downtime phase. Ongoing efforts in the upstream Xen project to improve memory transfer speed are being evaluated for inclusion in XCP-ng.

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
