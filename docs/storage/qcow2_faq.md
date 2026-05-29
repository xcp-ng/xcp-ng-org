---
sidebar_position: 2
---

# QCOW2 FAQ

## What’s QCOW2?

QCOW2 is the name of a virtual disk image format coming from the open source QEMU project. Contrarily to the VHD disk image format, historically used by XCP-ng, QCOW2 is not limited to 2 TiB per disk.

## Quick summary

For those who will only read this.

- Support for QCOW2 was added to XCP-ng on 2026-05-05 via its regular updates.
- Supports disks up to 16,381 GiB, and more in the future.
- Supported on almost all existing <abbr title="Storage Repository">SR</abbr> types (except `linstor` and `smb`).
- Not needed to create a new <abbr title="Storage Repository">SR</abbr> to create QCOW2 disks. A <abbr title="Storage Repository">SR</abbr> can have QCOW2 and VHD co-existing.
- VHD stays the default for now, a QCOW2 disk will automatically be created when asking for the creation of a VDI bigger than 2040GiB.

## Glossary

- VDI: Virtual Disk Image. This is a VM’s disk, seen from the hypervisor.
- <abbr title="Storage Repository">SR</abbr>: Storage Repository. Storage space managed by XCP-ng to store VDIs.
- image format: there exist several formats to store a VM disk’s data. VHD, QCOW2 and VMDK are all such image formats. Historically, XCP-ng only supported the VHD image format (as well as raw data, which means no image format). It now supports a new image format in addition to VHD: QCOW2.

## About image formats

Before entering the FAQ itself, let's talk about image formats.

`vhd` and `qcow2` are image formats.

By default, <abbr title="Storage Repository">SR</abbr> types which support QCOW2 use `vhd,qcow2` as their preferred image formats. This means that they'll first try to create VHD VDIs, and only create QCOW2 VDIs when you ask for a disk size which is bigger than what VHD can support.

Other possible values, set at <abbr title="Storage Repository">SR</abbr> creation or by re-creating their <abbr title="Physical Block Device">PBD</abbr>, are:
* `qcow2,vhd`: will always prefer QCOW2, unless you specifically ask for VHD
* `qcow2`: will only create QCOW2 VDIs
* `vhd`: will only create VHD VDIs

### Configure a new <abbr title="Storage Repository">SR</abbr>'s preferred-image-formats

Configuring the preferred image format for new SRs can be done in Xen Orchestra’s <abbr title="Storage Repository">SR</abbr> creation form.

You can also add the parameter at the <abbr title="Storage Repository">SR</abbr> creation on the command line with `xe`.

Example:

```
xe sr-create name-label="test-lvmsr" type=lvm device-config:device=/dev/nvme1n1 device-config:preferred-image-formats=qcow2
```

### Configure an existing <abbr title="Storage Repository">SR</abbr>'s preferred-image-formats

As said above, by default, an existing <abbr title="Storage Repository">SR</abbr> has `vhd,qcow2` as its preferred image formats. This is our recommended default at the moment.

To tell an existing <abbr title="Storage Repository">SR</abbr> that it must prefer the `qcow2` image format for new disks, it is necessary to unplug, destroy, recreate and re-plug its <abbr title="Physical Block Device">PBD</abbr> with the added parameter in the device-config: https://docs.xcp-ng.org/storage/#-how-to-modify-an-existing-sr-connection

In order to unplug the <abbr title="Physical Block Device">PBD</abbr>, any VMs with a VDI on the <abbr title="Storage Repository">SR</abbr> will have to be stopped, or the VDI moved temporarily to another <abbr title="Storage Repository">SR</abbr>.

This operation will not affect the contents of the SR. The PDB object represents the connection to the SR, not its contents.


## FAQ

Now let's enter the FAQ itself.

### What <abbr title="Storage Repository">SR</abbr> types support QCOW2?

XCP-ng supports a variety of storage types (<abbr title="Storage Repository">SR</abbr> types), and our engineers added support for the QCOW2 image format to most existing <abbr title="Storage Repository">SR</abbr> types: EXT, NFS, <abbr title="Logical Volume Manager">LVM</abbr>, LVMoISCSI, LVMoHBA, …

However, QCOW2 is **not supported on LinstorSR** (<abbr title="Xen Orchestra Storage">XOSTOR</abbr>) nor on SMBSR (VDI stored in Samba shares, not recommended anyway).

### No large disks on <abbr title="Xen Orchestra Storage">XOSTOR</abbr>?

The current version of <abbr title="Xen Orchestra Storage">XOSTOR</abbr> is built on a technical stack (<abbr title="Storage Manager API">SMAPI</abbr>v1) which makes it very challenging and not advisable to add support for a new image format such as QCOW2.

Our plan is to add support for large disks in a future iteration of <abbr title="Xen Orchestra Storage">XOSTOR</abbr>, built on the next stack (<abbr title="Storage Manager API">SMAPI</abbr>v3).

### Must I create new SRs to create large disks?

Not necessarily. Existing SRs whose type supports QCOW2 can manage both VHD and QCOW2 at the same time. See below how to manage image formats on SRs.

### What’s the maximum disk size for a VDI?

The current limit is set to 16,381 GiB. It's currently the maximum that can fit on a EXT <abbr title="Storage Repository">SR</abbr>, and we set this limit for all <abbr title="Storage Repository">SR</abbr> types to allow migration between SRs. We will raise it progressively in the future.

It's also the maximum disk size that we test routinely before releasing updates.

We’ll be able to go up to 64 TiB before meeting a new technical limit related to live migration support.

The theoretical maximum is even higher. We’re not limited by the image format anymore.

### How to create a QCOW2 VDI

Xen Orchestra hasn’t added yet the possibility to choose the image format at the VDI creation.

However, if you try to create a VDI bigger than 2040 GiB on a <abbr title="Storage Repository">SR</abbr> without any preferred image formats configuration, or if the preferred image formats contains QCOW2, it will create a QCOW2.

This only works on <abbr title="Storage Repository">SR</abbr> types which support QCOW2.

Alternatively, you can specify the image format on the command line:

```
xe vdi-create sr-uuid=<SR UUID> virtual-size=5TiB name-label="My QCOW2 VDI" sm-config:image-format=qcow2
```

### Can you create a <abbr title="Storage Repository">SR</abbr> which only ever manages QCOW2 disks? How?

Yes, you can by setting the `preferred-image-formats` parameter to `qcow2` (and the same is true for `vhd`).

You can do so directly in the <abbr title="Storage Repository">SR</abbr> creation form of Xen Orchestra.

Here's also a command line example:
```
xe sr-create name-label="test-lvmsr" type=lvm device-config:device=/dev/nvme1n1 device-config:preferred-image-formats=qcow2
```

### Can I create QCOW2 disks smaller than 2 TiB?

By default, a <abbr title="Storage Repository">SR</abbr> will create VHD for such disks, unless:
- either you configure the <abbr title="Storage Repository">SR</abbr> so that it only manages QCOW2 disks;
- or you create the VDI manually, via command line, by adding `sm-config:image-format=qcow2` to the `xe vdi-create` operation.

### Is QCOW2 format the default format now? Is it the best practice?

We kept VHD as the default format in order to limit the impact on production. In the future, QCOW2 will become the default image format for new disks, and VHD will be progressively deprecated.

### Can I resize my VHD VDI above 2 TiB?

A disk in VHD format can’t be resized above 2 TiB. No automatic format change is implemented.

You first need to convert the VDI to QCOW2.

### How to convert a VHD VDI into a QCOW2 VDI?

The most straightforward way at the moment is to migrate the VDI towards a <abbr title="Storage Repository">SR</abbr> whose preferred image format is `qcow2`, so that the VDI is automatically converted.

### What happens in storage migration scenarios?

During a storage migration from a <abbr title="Storage Repository">SR</abbr> to another <abbr title="Storage Repository">SR</abbr>, the destination format is chosen by the destination <abbr title="Storage Repository">SR</abbr>, following the same rules as for the creation of a new disk (this can be used to convert from one format to another). That is, the value of `preferred-image-formats` on the <abbr title="Physical Block Device">PBD</abbr> of the <abbr title="Storage Repository">SR</abbr> (read on the master host in case of a shared <abbr title="Storage Repository">SR</abbr>) the master of a <abbr title="Storage Repository">SR</abbr> decides the destination format. The size of the VDI also plays a role: if the first preferred format is VHD but the disk is too big, then QCOW2 will be selected.

| source          | preferred-image-formats vhd | preferred-image-formats qcow2 | preferred-image-formats vhd,qcow2 | preferred-image-formats qcow2,vhd | None (will depend on system default) currently: vhd,qcow2 |
| :---            | :---                        | :---                          | :---                              | :---                              | :---                                                                                   |
| VDI \>2TiB      | X                           | qcow2                         | qcow2                             | qcow2                             | qcow2                                                                                  |
| VDI \<2TiB      | vhd                         | qcow2                         | vhd                               | qcow2                             | vhd                                                                                    |

### Can you convert an existing <abbr title="Storage Repository">SR</abbr> so that it only manages QCOW2 disks? If so, and it had VHDs, what happens to them?

You can modify a <abbr title="Storage Repository">SR</abbr> to make it exclusively manage QCOW2 VDIs by modifying the `preferred-image-formats` parameter of the <abbr title="Physical Block Device">PBD</abbr>’s `device-config`.

Modifying the <abbr title="Physical Block Device">PBD</abbr> necessitates to delete it and recreate it with the new parameter. This implies stopping access to all VDIs of the <abbr title="Storage Repository">SR</abbr> on the master (you can for shared <abbr title="Storage Repository">SR</abbr> migrate all VMs with VDIs on other hosts in the pool and temporarily stop the <abbr title="Physical Block Device">PBD</abbr> of the master to recreate it, the parameter only need to be set on the <abbr title="Physical Block Device">PBD</abbr> of the master).

If the <abbr title="Storage Repository">SR</abbr> had VHDs, they will continue to exist and be usable but won’t be automatically transformed in QCOW2.

### What available storage space do I need on my <abbr title="Storage Repository">SR</abbr> for large QCOW2 disks to support snapshots?

Depending on a thin or thick allocated <abbr title="Storage Repository">SR</abbr> type, the answer is the same as VHD.

A thin allocated is almost free, just a bit of data for the metadata of a few new VDI.

For thick allocated disks, you need the space for the base copy, the snapshot and the active disk.

### Can we change the QCOW2 cluster size?

Yes, on File based <abbr title="Storage Repository">SR</abbr>, you can create a QCOW2 with a different cluster size with the command:

```bash
cd /var/run/sr-mount/<SR UUID>/
qemu-img create -f qcow2 -o cluster_size=2M $(uuidgen).qcow2 10G
xe sr-scan uuid=<SR UUID> # to introduce it in the XAPI
```

The `qemu-img` command will print the name, the VDI is `<VDI UUI>.qcow2` from the output.

We have not exposed the cluster size in any API call, which would allow you to create these VDIs more easily.

And migrating the VDI on another <abbr title="Storage Repository">SR</abbr> will make it take the default cluster size (since it's recreating a new VDI on destination).
