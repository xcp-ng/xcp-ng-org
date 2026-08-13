---
sidebar_position: 2
---

# SR and VDI management

Everyday operations on storage repositories (SRs) and virtual disks (VDIs): renaming, detaching, reattaching, growing, moving disks between SRs and reclaiming space.

:::tip
All of these operations are available from [Xen Orchestra](../management/manage-at-scale/xo-web-ui.md) with a few clicks (SR view and VM → Disks tab). The `xe` commands are given for scripting, troubleshooting, or when you work directly on a host.
:::

## :mortar_board: Quick recap of the objects {#quick-recap-of-the-objects}

* **SR** (Storage Repository): where virtual disks live.
* **VDI** (Virtual Disk Image): one virtual disk.
* **PBD** (Physical Block Device): the *connection* between one host and one SR: how the host accesses the storage.
* **VBD** (Virtual Block Device): the *connection* between a VDI and a VM.

<Schema label="Storage object model · PBDs connect hosts to SRs, VBDs connect VDIs to VMs" legend={[["#4a90e2", "host side"], ["#56c288", "VM side"]]} maxWidth="680px">
<svg viewBox="0 0 620 240" role="img" aria-label="Two hosts each connect to the shared SR through their own PBD; inside the SR live VDIs, and each VDI is attached to a VM through a VBD">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="24" width="130" height="50" rx="8"/>
    <rect x="20" y="160" width="130" height="50" rx="8"/>
    <rect x="240" y="20" width="180" height="200" rx="8"/>
    <rect x="470" y="24" width="130" height="50" rx="8"/>
    <rect x="470" y="160" width="130" height="50" rx="8"/>
  </g>
  <g fontSize="12.5" fill="#c6d2e1" textAnchor="middle">
    <text x="85" y="53">host 1</text>
    <text x="85" y="189">host 2</text>
    <text x="535" y="49">VM A</text>
    <text x="535" y="185">VM B</text>
  </g>
  <text x="330" y="44" fontSize="13" fill="#c6d2e1" textAnchor="middle">SR</text>
  <text x="330" y="60" fontSize="10" fill="#7a8699" textAnchor="middle">storage repository</text>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.8">
    <rect x="262" y="76" width="136" height="34" rx="5"/>
    <rect x="262" y="120" width="136" height="34" rx="5"/>
    <rect x="262" y="164" width="136" height="34" rx="5"/>
  </g>
  <g fontSize="11" fill="#56c288" textAnchor="middle">
    <text x="330" y="97">VDI · system disk A</text>
    <text x="330" y="141">VDI · data disk A</text>
    <text x="330" y="185">VDI · system disk B</text>
  </g>
  <g stroke="#4a90e2" strokeWidth="1.6" fill="none">
    <path d="M150 49 C 190 49, 200 90, 238 100"/>
    <path d="M150 185 C 190 185, 200 160, 238 150"/>
  </g>
  <g fontSize="10.5" fill="#4a90e2">
    <text x="168" y="52">PBD</text>
    <text x="168" y="196">PBD</text>
  </g>
  <g stroke="#56c288" strokeWidth="1.6" fill="none">
    <path d="M398 93 C 430 93, 440 49, 468 49"/>
    <path d="M398 137 C 430 137, 445 60, 468 55"/>
    <path d="M398 181 C 430 181, 440 185, 468 185"/>
  </g>
  <g fontSize="10.5" fill="#56c288">
    <text x="428" y="80">VBD</text>
    <text x="430" y="130">VBD</text>
    <text x="428" y="200">VBD</text>
  </g>
</svg>
</Schema>

More details in the [storage overview](storage.md) and in the [architecture page](../project/architecture.md#storage).

## :card_index: SR operations {#sr-operations}

### Rename an SR

<Terminal shell title="root@xcp-ng-host — Rename an SR">{`
xe sr-param-set uuid=<sr-uuid> name-label="New name"
`}</Terminal>

### Choose the default SR

The default SR of a pool is where new disks land when no SR is explicitly chosen (and where suspend/crash dump data goes):

<Terminal shell title="root@xcp-ng-host — Choose the default SR">{`
xe pool-param-set uuid=<pool-uuid> default-SR=<sr-uuid>
`}</Terminal>

### Rescan an SR

A scan refreshes XAPI's view of the SR contents (e.g. after copying a VHD/QCOW2 file into a file-based SR, or to trigger garbage collection):

<Terminal shell title="root@xcp-ng-host — Rescan an SR">{`
xe sr-scan uuid=<sr-uuid>
`}</Terminal>

### Detach an SR (keep the data)

Detaching unplugs the SR from the hosts without touching its contents. VMs using it must be shut down first.

<Terminal shell title="root@xcp-ng-host — Detach an SR (keep the data)">{`
xe pbd-list sr-uuid=<sr-uuid>            # one PBD per host
xe pbd-unplug uuid=<pbd-uuid>            # repeat for each PBD
xe sr-forget uuid=<sr-uuid>              # remove the SR from the pool database
`}</Terminal>

`sr-forget` only removes the SR *record*; the data stays on the storage and the SR can be reattached later, here or on another pool.

### Reattach a forgotten SR

Reintroduce the SR under its original UUID, then recreate a PBD per host with the right `device-config` for your storage type, and plug them:

<Terminal shell title="root@xcp-ng-host — Reattach a forgotten SR">{`
xe sr-introduce uuid=<original-sr-uuid> type=nfs name-label="My NFS SR" content-type=user
xe pbd-create host-uuid=<host-uuid> sr-uuid=<original-sr-uuid> device-config:server=<ip> device-config:serverpath=<path>
xe pbd-plug uuid=<pbd-uuid>
`}</Terminal>

The `device-config` keys depend on the SR type (`server`/`serverpath` for NFS, `target`/`targetIQN`/`SCSIid` for iSCSI…). If you're not sure about the values, look at an existing PBD of the same kind with `xe pbd-param-list`, or probe the storage with `xe sr-probe`. The same PBD destroy/recreate logic is used to [modify an existing SR connection](storage.md#how-to-modify-an-existing-sr-connection).

### Destroy an SR

:::warning
`sr-destroy` **erases the SR contents** on the storage side (formats the disk/LUN). If you only want to disconnect the storage, use the detach procedure above instead.
:::

<Terminal shell title="root@xcp-ng-host — Destroy an SR">{`
xe pbd-unplug uuid=<pbd-uuid>            # for each PBD
xe sr-destroy uuid=<sr-uuid>
`}</Terminal>

### Grow a block-based SR after enlarging the LUN

For iSCSI/HBA SRs, when you enlarge the LUN on the storage array side:

1. Rescan the sessions on each host, e.g. `iscsiadm -m session --rescan` (with [multipathing](multipathing.md), also run `multipathd resize map <map>` so the multipath device picks up the new size).
2. Run `xe sr-scan uuid=<sr-uuid>`: the SR grows to use the new space.

This is done live, with no impact on running VMs.

### Discover what the storage offers (probe)

Before creating an SR, `sr-probe` asks the storage what's available, using the same `device-config` keys as `sr-create`. Xen Orchestra does this for you in the New SR wizard.

<Terminal shell title="root@xcp-ng-host — Discover what the storage offers…">{`
# List the IQNs of an iSCSI target, then the LUNs behind one
xe sr-probe type=lvmoiscsi device-config:target=<ip>
xe sr-probe type=lvmoiscsi device-config:target=<ip> device-config:targetIQN=<iqn>

# List the exports of an NFS server
xe sr-probe type=nfs device-config:server=<ip>
`}</Terminal>

The command answers in XML, listing what to feed into the next step (or into `sr-introduce` when [reattaching](#reattach-a-forgotten-sr)).

## :floppy_disk: VDI operations {#vdi-operations}

### Find your disks

<Terminal shell title="root@xcp-ng-host — Find your disks">{`
xe vm-disk-list vm=<vm-name-label>       # disks of one VM
xe vdi-list sr-uuid=<sr-uuid>            # all disks on an SR
`}</Terminal>

### Create and attach a new disk to a VM

From Xen Orchestra: VM → **Disks** → **New disk**. With `xe`:

<Terminal shell title="root@xcp-ng-host — Create and attach a new disk to…">{`
xe vdi-create sr-uuid=<sr-uuid> name-label="data disk" virtual-size=50GiB
xe vbd-create vm-uuid=<vm-uuid> vdi-uuid=<vdi-uuid> device=1
xe vbd-plug uuid=<vbd-uuid>              # hot-plug into a running VM
`}</Terminal>

### Grow a disk

Disks can only be **grown**, never shrunk (see the [shrink guide](../guides/shrink_virtual_drive.md) for the copy-based workaround). From Xen Orchestra, edit the disk size in the VM's Disks tab; with `xe`:

<Terminal shell title="root@xcp-ng-host — Grow a disk">{`
xe vdi-resize uuid=<vdi-uuid> disk-size=100GiB
`}</Terminal>

Afterwards, enlarge the partition and filesystem *inside* the guest: the VM only sees a bigger disk, not a bigger filesystem.

:::info
Maximum VDI size is 2 TiB with the VHD format. Starting with XCP-ng 8.3 and the QCOW2 format, much larger disks are possible: see the [QCOW2 FAQ](qcow2_faq.md).
:::

### Move a disk to another SR

* **VM halted** ("cold" migration): from Xen Orchestra, VM → Disks → migrate the VDI to another SR; works between any SR types.
* **VM running** (live storage migration): also from the Disks tab of the running VM, or:

<Terminal shell title="root@xcp-ng-host — Move a disk to another SR">{`
xe vdi-pool-migrate uuid=<vdi-uuid> sr-uuid=<destination-sr-uuid>
`}</Terminal>

Things to know about live VDI migration:

* The whole disk is copied while the VM runs, so it takes time and I/O bandwidth; the destination needs enough free space.
* Avoid running it at the same time as a backup job on the same VM.
* Moving a disk collapses its snapshot chain on the destination; leftover space on the source is reclaimed by the [coalesce process](storage.md#coalesce).

This is also the building block of cross-pool VM migration with storage: see [VM migration](../vms/vm-migration.md).

### Export / import a single disk

Individual VDIs can be exported to a file and reimported (handy to move a data disk around or to keep a raw copy). From Xen Orchestra, use the disk's export button. With `xe`:

<Terminal shell title="root@xcp-ng-host — Export / import a single disk">{`
xe vdi-export uuid=<vdi-uuid> filename=disk.vhd format=vhd
xe vdi-import uuid=<destination-vdi-uuid> filename=disk.vhd format=vhd
`}</Terminal>

(For `vdi-import`, create the destination VDI first, at least as big as the source.)

## :broom: Reclaim space {#reclaim-space}

Deleting VMs, disks and snapshots frees space:

* On **LVM-based SRs** (local LVM, iSCSI, HBA), the space is freed immediately at the SR level when the deletion and subsequent [coalesce](storage.md#coalesce) complete. To also tell the **storage array** that the blocks are free (thin-provisioned arrays), trigger a TRIM/UNMAP pass: in Xen Orchestra, SR view → advanced → **Reclaim space**, or:

<Terminal shell title="root@xcp-ng-host — Reclaim space">{`
xe host-call-plugin host-uuid=<host-uuid> plugin=trim fn=do_trim args:sr_uuid=<sr-uuid>
`}</Terminal>

* On **file-based SRs** (local EXT/XFS, NFS…), disk files are sparse: space returns to the filesystem once deletion and coalesce are done.

If space doesn't come back after deleting snapshots, the coalesce process probably hasn't finished (or is stuck): see the [coalesce section](storage.md#coalesce) to check its status.

## :gear: Disk I/O tuning {#disk-io-tuning}

The dom0 I/O scheduler used for an SR's physical devices can be changed if you have a specific workload profile (default is fine for most cases):

<Terminal shell title="root@xcp-ng-host — Disk I/O tuning">{`
xe sr-param-set uuid=<sr-uuid> other-config:scheduler=noop
`}</Terminal>

Replug the SR's PBDs (or reboot) for the change to take effect. `noop` is generally the best choice on flash storage and smart arrays.

Individual disks can also be prioritized against each other (only meaningful on local storage, with a scheduler that honors priorities):

<Terminal shell title="root@xcp-ng-host — Disk I/O tuning">{`
xe vbd-param-set uuid=<vbd-uuid> qos_algorithm-type=ionice
xe vbd-param-set uuid=<vbd-uuid> qos_algorithm-params:sched=be qos_algorithm-params:class=2
`}</Terminal>

`sched` accepts `rt` (real-time), `be` (best-effort) or `idle`; `class` ranks 0 (highest) to 7 within `rt`/`be`. Replug the VBD to apply.
