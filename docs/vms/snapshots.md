---
sidebar_position: 4
---

# Snapshots

A snapshot captures the state of a VM at a point in time: its disks, and optionally its RAM. Snapshots are the base of quick rollbacks ("let me try this upgrade…") and of delta backups.

:::warning
Snapshots are **not backups**: they live on the same SR as the VM. If the storage is lost, snapshots are lost with it. For real backups (full, delta, replicated, off-site…), use [Xen Orchestra backup](../management/backup.md).
:::

## How they work {#how-they-work}

XCP-ng disks are copy-on-write: taking a snapshot freezes the current disk state as a read-only parent, and the VM continues writing into a new child disk. This makes snapshot creation almost instant, but it has consequences:

<Schema label="A disk chain after two snapshots · the VM writes only into the active leaf" legend={[["#7a8699", "read-only parents"], ["#56c288", "active disk"]]} maxWidth="640px">
<svg viewBox="0 0 600 170" role="img" aria-label="A chain of disks: the base image, then snapshot 1, then snapshot 2, then the active disk receiving the VM's writes; each links to its parent">
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="60" width="120" height="46" rx="8"/>
    <rect x="170" y="60" width="120" height="46" rx="8"/>
    <rect x="320" y="60" width="120" height="46" rx="8"/>
  </g>
  <rect x="470" y="60" width="110" height="46" rx="8" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.85"/>
  <g fontSize="12" fill="#c6d2e1" textAnchor="middle">
    <text x="80" y="80">base disk</text>
    <text x="230" y="80">snapshot 1</text>
    <text x="380" y="80">snapshot 2</text>
  </g>
  <text x="525" y="80" fontSize="12" fill="#56c288" textAnchor="middle">active disk</text>
  <g fontSize="10" fill="#7a8699" textAnchor="middle">
    <text x="80" y="96">full data</text>
    <text x="230" y="96">changes only</text>
    <text x="380" y="96">changes only</text>
    <text x="525" y="96">new writes</text>
  </g>
  <g stroke="#7a8699" strokeWidth="1.5" fill="none">
    <path d="M170 83 L 148 83 M148 83 l 8 -4 v 8 z"/>
    <path d="M320 83 L 298 83 M298 83 l 8 -4 v 8 z"/>
    <path d="M470 83 L 448 83 M448 83 l 8 -4 v 8 z"/>
  </g>
  <text x="240" y="53" fontSize="10.5" fill="#7a8699" textAnchor="middle">reads fall through the chain until the data is found</text>
  <path d="M525 30 C 525 40, 525 48, 525 58" stroke="#56c288" strokeWidth="1.6" fill="none"/>
  <text x="525" y="22" fontSize="11" fill="#56c288" textAnchor="middle">VM writes</text>
  <text x="300" y="150" fontSize="10.5" fill="#7a8699" textAnchor="middle">deleting a snapshot merges its changes into its neighbor (coalesce) before space returns</text>
</svg>
</Schema>

* Each snapshot extends the disk chain; a long chain slightly degrades I/O performance.
* Snapshots consume space on the SR (on thick-provisioned SRs like LVM/iSCSI/HBA, a snapshot can reserve up to the full disk size).
* Deleting a snapshot doesn't free space immediately: the [coalesce process](../storage/storage.md#coalesce) has to merge the chain in the background first.

## Take a snapshot {#take-a-snapshot}

Two flavors:

* **Disk-only snapshot**: captures the disks. Works on a running or halted VM.
* **Snapshot with RAM** (also called *checkpoint*): additionally saves the VM's memory. Reverting resumes the VM exactly where it was, running. Requires working [guest tools](vms.md#guest-tools) and takes longer.

From Xen Orchestra: VM → **Snapshots** tab → new snapshot (with an option to also snapshot the RAM). With `xe`:

<Terminal shell title="root@xcp-ng-host — Take a snapshot">{`
xe vm-snapshot vm="my-vm" new-name-label="before-upgrade"
xe vm-checkpoint vm="my-vm" new-name-label="before-upgrade-with-ram"
`}</Terminal>

:::tip
In Xen Orchestra you can exclude specific disks from snapshots (and backups) by naming convention: putting `[NOSNAP]` (snapshots) or `[NOBAK]` (backups and their snapshots) in the disk's name. Very useful for large scratch/data disks. On XCP-ng 8.3, disk exclusion is supported natively by the snapshot API, which XO uses.
:::

## Revert to a snapshot {#revert-to-a-snapshot}

Reverting replaces the VM's current state with the snapshot's state. **Everything written since the snapshot is lost.**

From Xen Orchestra: Snapshots tab → revert. With `xe`:

<Terminal shell title="root@xcp-ng-host — Revert to a snapshot">{`
xe snapshot-list snapshot-of=<vm-uuid>
xe snapshot-revert snapshot-uuid=<snapshot-uuid>
`}</Terminal>

After reverting, the VM is halted (or suspended for a RAM snapshot; resume it to continue exactly where it was). The snapshot itself survives the revert, so you can revert again later.

## Delete a snapshot {#delete-a-snapshot}

From Xen Orchestra: Snapshots tab → delete. With `xe`:

<Terminal shell title="root@xcp-ng-host — Delete a snapshot">{`
xe snapshot-uninstall snapshot-uuid=<snapshot-uuid>
`}</Terminal>

Space is reclaimed asynchronously by the [coalesce process](../storage/storage.md#coalesce): expect a delay (and storage I/O activity) before the SR usage drops. If space never comes back, check that coalesce isn't stuck.

## Scheduled (rolling) snapshots {#scheduled-rolling-snapshots}

Use Xen Orchestra's **Rolling Snapshot** backup jobs: take a snapshot of selected VMs on a schedule and keep the N most recent ones. This gives you automatic short-term rollback points at near-zero cost. See the [XO backup documentation](https://docs.xen-orchestra.com/xo5/rolling_snapshots) for details, and remember the warning above: schedule real backups too.

## Other things you can do with a snapshot {#other-things-you-can-do-with-a-snapshot}

* [Create a template](templates.md#create-a-custom-template) from it (golden image without stopping the source VM).
* Create a full VM from it: `xe snapshot-copy snapshot-uuid=<uuid> new-name-label="restored-vm"` (or from Xen Orchestra, "create VM from snapshot").
* Export it as an XVA file: `xe snapshot-export-to-template snapshot-uuid=<uuid> filename=snap.xva` (see [import and export](import-export.md)).
