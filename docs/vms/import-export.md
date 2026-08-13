---
sidebar_position: 6
---

# Import and export VMs

Moving VMs in and out of XCP-ng as files: full VMs (XVA, OVA) or individual disks (VHD, VMDK…).

:::tip
Coming from VMware, Hyper-V, KVM or another hypervisor? There's a dedicated page: [migrate to XCP-ng](../installation/migrate-to-xcp-ng.md), including XO's V2V tool for live VMware conversions.
:::

## :package: Formats {#formats}

* **XVA**: the native format. A single streamable file containing the VM's metadata *and* its disks. Best fidelity (everything is preserved), best performance, and works between any XCP-ng/XAPI-based hosts. Use it whenever both sides are XCP-ng.
* **OVA/OVF**: the interchange format, when the other side is *not* XCP-ng. An OVA is an archive with the disks and a hardware description; interpretation varies between vendors, so expect to double-check VM settings after import.
* **Disk images** (VHD, VMDK, raw): import/export a single disk rather than a whole VM. Attach the imported disk to a VM you create yourself.

## :inbox_tray: Import {#import}

### XVA

From Xen Orchestra: **New** → **Import**, pick the file. With `xe`:

<Terminal shell title="root@xcp-ng-host — XVA">{`
xe vm-import filename=my-vm.xva sr-uuid=<destination-sr-uuid>
`}</Terminal>

Add `preserve=true` to keep the original MAC addresses (beware of duplicates if the original VM still runs somewhere!).

### OVA

From Xen Orchestra: **New** → **Import** accepts `.ova` files directly, shows the parsed hardware description and lets you adjust it before creating the VM. After import, install the [guest tools](vms.md#guest-tools) and check boot mode, NICs and disks.

### Single disks

From Xen Orchestra: **New** → **Import** → **Disk** imports a VHD or VMDK file into an SR of your choice; then attach it to a VM ([how](../storage/manage-srs.md#create-and-attach-a-new-disk-to-a-vm)). With `xe`, see [vdi-import](../storage/manage-srs.md#export--import-a-single-disk).

## :outbox_tray: Export {#export}

### XVA

From Xen Orchestra: VM → **Export** (with optional compression; zstd is a good default: much smaller files for a modest CPU cost). With `xe`:

<Terminal shell title="root@xcp-ng-host — XVA">{`
xe vm-export vm="my-vm" filename=my-vm.xva
`}</Terminal>

The VM should be halted; to export a *running* VM's state, take a [snapshot](snapshots.md) and export that instead:

<Terminal shell title="root@xcp-ng-host — XVA">{`
xe snapshot-export-to-template snapshot-uuid=<snapshot-uuid> filename=my-vm.xva
`}</Terminal>

### OVA

From Xen Orchestra: VM → **Export** and choose the OVA format. Use it only when the destination isn't XCP-ng.

### Single disks

From Xen Orchestra, each disk in the VM's Disks tab has an export button (VHD). See also [exporting VDIs with xe](../storage/manage-srs.md#export--import-a-single-disk).

## :repeat: Not what you're looking for? {#not-what-youre-looking-for}

* Moving a VM between two **connected** pools? Use [live migration](vm-migration.md), no intermediate file needed.
* Recurring exports for safety? That's a backup job. See [backup](../management/backup.md): Xen Orchestra does scheduled full/delta backups, replication and more.
