# QCOW2 FAQ

## Glossary

- VDI: Virtual Disk Image. This is a VM’s disk, seen from the hypervisor.
- SR: Storage Repository. Storage space managed by XCP-ng to store VDIs.
- image format: there exist several formats to store a VM disk’s data. VHD, QCOW2 and VMDK are all such image formats. Historically, XCP-ng only supported the VHD image format (as well as raw data, which means no image format). It now supports a new image format in addition to VHD: QCOW2.

## Quick summary

- Supported on almost all existing SRs types (not linstor and smb VDI)
- Not needed to create a new SR
- Maximum size a bit under 16TiB (16340 GiB, will change in the future but will be different depending on SR types)
- VHD stays default for now, it will automatically create QCOW2 if a VDI bigger than 2040GiB is created
- A SR can have QCOW2 and VHD co-existing

## What’s QCOW2?

QCOW2 is the name of a virtual disk image format coming from the open source QEMU project. Contrarily to the VHD disk image format, historically used by XCP-ng, QCOW2 is not limited to 2 TiB per disk.

## What SR types support QCOW2?

XCP-ng supports a variety of storage types (SR types), and our engineers added support for the QCOW2 image format to most existing SR types: EXT, NFS, LVM, LVMoISCSI, LVMoHBA, …

However, QCOW2 is **not supported on LinstorSR** (XOSTOR) nor on SMBSR (VDI stored in Samba shares, not recommended anyway).

## No large disks on XOSTOR?

The current version of XOSTOR is built on a technical stack (SMAPIv1) which makes it very challenging and not advisable to add support for a new image format such as QCOW2.

Our plan is to add support for large disks in a future iteration of XOSTOR, built on the next stack (SMAPIv3).

## Must I create new SRs to create large disks?

Not necessarily. Existing SRs whose type supports QCOW2 can manage both VHD and QCOW2 at the same time. See below how to manage image formats on SRs.

## What’s the maximum disk size?

The current limit is set to 16 TiB. It’s not a technical limit, it’s a limit that we corresponds to what we tested. We will raise it progressively in the future.

We’ll be able to go up to 64 TiB before meeting a new technical limit related to live migration support, that we will adress at this point.

The theoretical maximum is even higher. We’re not limited by the image format anymore.

## What available storage space do I need to have on my SR to have large QCOW2 disks to support snapshots?

Depending on a thin or thick allocated SR type, the answer is the same as VHD.
A thin allocated is almost free, just a bit of data for the metadata of a few new VDI.

For thick allocated, you need the space for the base copy, the snapshot and the active disk.

What SR (Storage Repository) types support the QCOW2 disk format

## Can we have multiple types of VDIs (VHD and QCOW2) on the same SR?

Yes, it’s supported, any existing SR supporting QCOW2 will be able to create QCOW2 beside VHD after installing the new `sm` package

## What happen in Live migration scenarios?

`preferred-image-formats` on the PBD of the master of a SR will choose the destination format in case of a migration.

| source          | preferred-image-formats vhd | preferred-image-formats qcow2 | preferred-image-formats vhd,qcow2 | preferred-image-formats qcow2,vhd | None (will depend on system default) currently: vhd,qcow2 |
| :---            | :---                        | :---                          | :---                              | :---                              | :---                                                                                   |
| VDI \>2TiB      | X                           | qcow2                         | qcow2                             | qcow2                             | qcow2                                                                                  |
| VDI \<2TiB      | vhd                         | qcow2                         | vhd                               | qcow2                             | vhd                                                                                    |

## Can we create QCOW2 VDI from XO?

XO hasn’t yet added the possibility to choose the image format at the VDI creation.
But if you try to create a VDI bigger than 2TiB on a SR without any preferred image formats configuration or if preferred image formats contains QCOW2, it will create a QCOW2.

## Can we change the cluster size?

Yes, on File based SR, you can create a QCOW2 with a different cluster size with the command:

```bash
cd /var/run/sr-mount/<SR UUID>/
qemu-img create -f qcow2 -o cluster_size=2M $(uuidgen).qcow2 10G
xe sr-scan uuid=<SR UUID> # to introduce it in the XAPI
```

The `qemu-img` command will print the name, the VDI is `<VDI UUI>.qcow2` from the output.

We have not exposed the cluster size in any API call, which would allow you to create these VDIs more easily.
And migrating the VDI on another SR will make it take the default cluster size (since it's recreating a new VDI on destination).

## Can you create a SR which only ever manages QCOW2 disks? How?

Yes, you can by setting the `preferred-image-formats` parameter to only `qcow2` (and the same is true for `vhd`).

## Can you convert an existing SR so that it only manages QCOW2 disks? If so, and it had VHDs, what happens to them?

You can modify a SR to manage QCOW2 by modifying the `preferred-image-formats` parameter of the PBD’s `device-config`.

Modifying the PBD necessitates to delete it and recreate it with the new parameter. This implies stopping access to all VDIs of the SR on the master (you can for shared SR migrate all VMs with VDIs on other hosts in the pool and temporarily stop the PBD of the master to recreate it, the parameter only need to be set on the PBD of the master).

If the SR had VHDs, they will continue to exist and be usable but won’t be automatically transformed in QCOW2.

## Can I resize my VDI above 2 TiB?

A disk in VHD format can’t be resized above 2 TiB, no automatic format change is implemented.
It is technically possible to resize above 2 TiB following a migration that would have transferred the VDI to QCOW2.

## Is there any thing to do to enable the new feature?

Installing updated packages that supports QCOW2 is enough to enable the new feature (packages: xapi, sm, blktap).
Creating a VDI bigger than 2 TiB will create a QCOW2 VDI instead of failing.

## Can I create QCOW2 disks lesser than 2 TiB?

Yes, but you need to create it manually while setting `sm-config:image-format=qcow2` or configure preferred image formats on the SR.

## Is QCOW2 format the default format now? Is it the best practice?

We kept VHD as the default format in order to limit the impact on production. In the future, QCOW2 will become the default image format for new disks, and VHD will be progressively deprecated.
