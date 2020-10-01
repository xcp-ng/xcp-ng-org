# Storage in XCP-ng

Storage in XCP-ng is a quite large topic. This section is dedicated to it. Keywords are:

* SR: Storage Repository, the place for your VM disks (VDI SR)
* VDI: a virtual disk
* ISO SR: special SR only for ISO files (in read only)

Please take in consideration that Xen API (XAPI) via their storage module (`SMAPI`) is doing all the heavy lifting on your storage. **You don't need to format drives manually**.

:::tip
We encourage people to use file based SR (local ext, NFS, XOSAN…) because it's easier to deal with. If you want to know more, read the rest.
:::

## Storage types

There's 2 types of storage:

* Thin Provisioned: you only use the space your VM has filled with data
* Thick Provisioned: you use the space of your VMs disk(s) size.

<table>
  <tr>
    <th>Type of Storage Repository</th>
    <th>Name</th>
    <th>Thin Provisioned</th>
    <th>Thick Provisioned</th>
  </tr>
  <tr>
    <td rowspan="6">file based</td>
    <td>local Ext</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>NFS</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>File</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>XOSAN</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>ZFS</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td>CephFS</td>
    <td>X</td>
    <td></td>
  </tr>
  <tr>
    <td rowspan="3">block based</td>
    <td>local LVM</td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>iSCSI</td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>HBA</td>
    <td></td>
    <td>X</td>
  </tr>
</table>

:::warning
Cost of thick provisioned is relatively high when you do snapshots (used for backup). If you can use ext or NFS instead, you'll save a LOT of space.
:::

### Local

Local SR is using a disk or a partition of your local disk, to create a space for your VM disks. Local LVM will use logical volumes, whereas Local ext will create an `ext4` filesystem and put `.vhd` files in it.

:::tip
The concept is simple: tell XCP-ng on the disk or partition you want to use, and it will do everything for you! Don't do anything yourself (no need to create a logical volume or a filesystem)
:::

In [Xen Orchestra](management.md#xen-orchestra):

![](https://xcp-ng.org/assets/img/screenshots/createSRlocal.png)

Via `xe` CLI for a local EXT SR (where `sdaX` is a partition, but it can be the entire device eg `sdc`):

```
xe sr-create host-uuid=<host UUID> type=ext content-type=user name-label="Local Ext" device-config:device=/dev/sdaX
```

### ZFS

ZFS is also local, but you'll need to create your ZFS pool and volumes yourself, eg on partition `sda4`:

```
zpool create -o ashift=12 -m /mnt/zfs tank /dev/sda4
```

Now you can create the SR on top of it:

```
xe sr-create host-uuid=<HOST_UUID> type=zfs content-type=user name-label=LocalZFS device-config:location=/mnt/zfs/
```

For better performances, you can disable sync with `zfs set sync=disabled tank`.

:::tip
Please report any problem (performances or whatever) you might encounter in ZFS. [Our forum](https://xcp-ng.org/forum) is here for that!
:::

### NFS

In Xen Orchestra, go in the "New" menu entry, then Storage, and select NFS. Follow instructions from there.

### iSCSI

In Xen Orchestra, go in the "New" menu entry, then Storage, and select iSCSI. Follow instructions from there.

### HBA

You can add an HBA storage with `xe`:

```
xe sr-create content-type=user shared=true type=lvmohba name-label=MyHBAStorage device-config:SCSIid=<the SCSI id>
```

If you have a problem with the SCSIid, you can use this alternative, carefuly selecting the right drive, and checking it's visible on all hosts with the same name:

```
xe sr-create content-type=user shared=true type=lvmohba name-label=MyHBAStorage device-config:device=/dev/<HBA drive>
```

### Glusterfs

You can use this driver to connect to an existing Gluster storage, and configure it as a shared SR for all your hosts in the pool. For example, a Gluster storage with 3 nodes (`192.168.1.11`, `192.168.1.12` and `192.168.1.13`) and a volume name called `glustervolume`:

```
xe sr-create content-type=user type=glusterfs name-label=GlusterSharedStorage shared=true device-config:server=192.168.1.11:/glustervolume device-config:backupservers=192.168.1.12:192.168.1.13
```

It will be thin provisioned!

### CephFS

You can use this driver to connect to an existing Ceph storage filesystem, and configure it as a shared SR for all your hosts in the pool. This driver uses `mount.ceph` from `ceph-common` package of `centos-release-ceph-jewel` repo. So user needs to install it before creating the SR. Without it, the SR creation would fail with an error like below
```
Error code: SR_BACKEND_FAILURE_47
Error parameters: , The SR is not available [opterr=ceph is not installed],
```

Installation steps
```
# yum install centos-release-ceph-jewel --enablerepo=extras
# yum install ceph-common --enablerepo=base
```

Create `/etc/ceph/admin.secret` with your access secret for CephFS.
```
# cat /etc/ceph/admin.secret
AQBX21dfVMJtBhAA2qthmLyp7Wxz+T5YgoxzeQ==
```

Now you can create the SR where `server` is your mon ip.
```
# xe sr-create type=cephfs name-label=ceph device-config:server=172.16.10.10 device-config:serverpath=/xcpsr device-config:options=name=admin,secretfile=/etc/ceph/admin.secret
```

:::tip
* For `serverpath` it would be good idea to use an empty folder from the CephFS instead of `/`.
* You may specify `serverport` option if you are using any other port than 6789.
:::

### XOSANv2

XOSANv2 is an hyperconvergence solution. In short, your local storage are combined into a big shared storage.

:::tip
XOSANv2 is coming soon in XCP-ng. Hang on!
:::

## ISO SR

You might wonder: how to upload an ISO? Unlike other solutions, you need to create a dedicated "space" for those, a specific ISO SR. To create one, it's pretty easy: in Xen Orchestra, go into "New/Storage" and select "ISO SR":

![](https://xcp-ng.org/assets/img/screenshots/createSRISO.png)

Usually, you can use a NFS or SMB share. But if you don't have any of those, you can rely on a local ISO SR that you create yourself:

1. Select "Local" instead of NFS/SMB
2. Enter a path that already exists on your physical host

That's it!

:::tip
Don't forget to rescan your SR after adding ISO files. Rescan is done automatically every 10 minutes otherwise
:::

## Storage API

Current storage stack on XCP-ng is called `SMAPIv1`. VHD format is used, which has a limitation to 2TiB max. So it means that your VM disk can't be larger than 2TiB, using this format.

### Why using VHD format?

For historical reasons. When it was decided, it was the only acceptable format being able to deal with copy on write, delta capabilities and merge possibilities. Thanks to VHD format, you have:

* snapshot support
* delta backup
* fast clone VM
* live storage migration

### Using RAW format

Alternatively, you can decide to use a disk without 2TiB limitation, thanks to RAW format. However, the price to pay is to lose all VHD features.

To create a large VDI on a file based SR, it's trivial, for example:

```
xe vdi-create type=user sm-config:type=raw virtual-size=5TiB sr-uuid=<SR_UUID> name-label=test
```

On a block based storage, it's a bit more complicated:

1. Create a small disk first: `xe vdi-create type=user sm-config:type=raw virtual-size=1GiB sr-uuid=<SR_UUID> name-label=test`
2. Extend it with `lvextend -L+5T /dev/VG_<whateverUUID>/LV-<VDI_UUID>`
3. Rescan SR

:::warning
You won't be able to live storage migrate this disk or snapshot it anymore. Outside this, it will work very well
:::

### SMAPIv3: the future

`SMAPIv1` is the historical storage interface, and now a big spaghetti monster. That's why Citrix decided to create a new one, called `SMAPIv3`: it's far more flexible, and also support (partially) the `qcow2` format. This format got the same concepts as VHD, but without its limitations.

Also, the storage API is far more agnostic and the code is better. So what's the catch? Problem is there's no Open Source implementation of `SMAPIv3`, also the current API state isn't really complete (doesn't support a lot of features). However, XCP-ng team is working on it too, because it's clearly the future!

## Coalesce

Coalesce process is an operation happening in your hosts as soon a snapshot is removed.

When you make a snapshot, a "base copy" is created (in read only), the "active" disk will live its own life, same for the freshly created snapshot. Example here: A is the parent, B the current/active disk and C is the snapshot:

![](https://xen-orchestra.com/blog/content/images/2017/05/legendsnap.png)

![](https://xen-orchestra.com/blog/content/images/2017/05/snapshot1.png)

That's OK. But what about creating a new snapshot on B after some data are written?

You got this:

![](https://xen-orchestra.com/blog/content/images/2017/05/beforemerge.png)

When you make XO backup on regular basis, old/unused snapshots will be removed automatically. This will also happen if you create/delete snapshots manually. So in our case, C will disappear. And without this snapshot, XCP-ng will coalesce A and B:

![](https://xen-orchestra.com/blog/content/images/2017/05/parent.png)

This process will take some time to finish (especially if you VM stays up and worst if you have a lot of writes on its disks).

**What about creating snapshot (ie call backup jobs) faster than XCP-ng can coalesce?** Well, the chain will continue to grow. And more you have disks to merge, longer it will take.

You will hit a wall, 2 options here:

* if your VM disks are small enough, you could reach the max chain length (30)
* if your VM disks are big, you'll hit the SR space limit before.

### Xen Orchestra protection

Luckily, Xen Orchestra is able to detect an uncoalesced chain. It means it won't trigger a backup job for a VM if its disks are not coalesced yet: it will be skipped.

But more than that, Xen Orchestra is also able to show you uncoalesced disk in the SR view, in the Advanced tab.

More about this exclusive feature on <https://xen-orchestra.com/blog/xenserver-coalesce-detection-in-xen-orchestra/>
