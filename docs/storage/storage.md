---
sidebar_position: 1
---

# Storage in XCP-ng

Storage in XCP-ng is quite a large topic. This section is dedicated to it.

:::tip
Looking for day-2 operations (detach/reattach an SR, resize or move virtual disks, reclaim space)? See [SR and VDI management](manage-srs.md).
:::

Keywords are:

* SR: Storage Repository, the place for your VM disks (VDI SR)
* VDI: a virtual disk
* ISO SR: special SR only for ISO files (in read only)

Please take into consideration, that Xen API (XAPI) via their storage module (`SMAPI`) is doing all the heavy lifting on your storage. **You don't need to format drives manually**.

:::tip
We encourage people to use file based SR (local ext, NFS, XOSTOR…) because it's easier to deal with. If you want to know more, read the rest.
:::

## 📑 Storage types {#storage-types}

There are two types of storage:

* Thin Provisioned: you only use the space your VM has filled with data.
* Thick Provisioned: you use the space of your VMs disk(s) size.

In addition to this, storage can be either local or shared between hosts of a pool.

There are storage types that are officially supported, and others that are provided as-is, in the hope that they are useful to you. Actually, we do maintain them too, but they receive less testing than the officially supported ones.


<table>
  <tr>
    <th>Type of Storage Repository</th>
    <th>Name</th>
    <th>Thin Provisioned</th>
    <th>Shared Storage</th>
    <th>Officially Supported</th>
  </tr>
  <tr>
    <td rowspan="10">file based</td>
    <td>Local EXT</td>
    <td>X</td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>Software RAID</td>
    <td>X</td>
    <td></td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>NFS</td>
    <td>X</td>
    <td>X</td>
    <td>X</td>
  </tr>
  <tr>
    <td>File</td>
    <td>X</td>
    <td></td>
    <td>X (use with caution)</td>
  </tr>
  <tr>
    <td>XOSTOR</td>
    <td>X</td>
    <td>X</td>
    <td>X</td>
  </tr>
  <tr>
    <td>ZFS</td>
    <td>X</td>
    <td></td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>XFS</td>
    <td>X</td>
    <td></td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>GlusterFS</td>
    <td>X</td>
    <td>X</td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>CephFS</td>
    <td>X</td>
    <td>X</td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>MooseFS</td>
    <td>X</td>
    <td>X</td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td rowspan="6">block based</td>
    <td>Local LVM</td>
    <td></td>
    <td></td>
    <td>X</td>
  </tr>
  <tr>
    <td>iSCSI</td>
    <td></td>
    <td>X</td>
    <td>X</td>
  </tr>
  <tr>
    <td>HBA</td>
    <td></td>
    <td>X</td>
    <td>X</td>
  </tr>
  <tr>
    <td>Ceph iSCSI gateway</td>
    <td></td>
    <td>X</td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>CephRBD</td>
    <td></td>
    <td>X</td>
    <td>**No. Provided as-is**</td>
  </tr>
  <tr>
    <td>Fibre Channel</td>
    <td></td>
    <td>X</td>
    <td>X</td>
  </tr>
</table>

:::warning
Cost of thick provisioning is relatively high when you do snapshots (used for backup). If you can use a thin provisioned storage instead, such as Local EXT or NFS, you'll save a LOT of space.
:::

### Local

A local SR is using a disk or a partition of your local disk, to create a space for your VM disks. Local LVM will use logical volumes, whereas Local EXT will create an `ext4` filesystem and put `.vhd` files in it.

:::tip
The concept is simple: tell XCP-ng which disk or partition you want to use, and it will do everything for you! Don't do anything yourself (no need to create a logical volume or a filesystem).
:::

:::warning
As XCP-ng will handle everything for you, be aware that the device or partition will be formatted.

* Don't create a SR over a device or partition that contains important data.
* If you want to attach an existing SR to your pool, don't create a new local SR over it, else your virtual disks will be deleted. Instead, use the `xe sr-introduce` command. Further explanation can be found in the official XenServer documentation: https://support.citrix.com/external/article?articleUrl=CTX121896-how-to-introduce-a-local-storage-repository-in-xenserver
:::

In [Xen Orchestra](../management#manage-at-scale):

![Adding a new local ext SR in XO.](https://xcp-ng.org/assets/img/screenshots/createSRlocal.png)

Via `xe` CLI for a local EXT SR (where `sdaX` is a partition, but it can be the entire device e.g. `sdc`):

<Terminal shell title="root@xcp-ng-host — Local">{`
xe sr-create host-uuid=<host UUID> type=ext content-type=user name-label="Local Ext" device-config:device=/dev/sdaX
`}</Terminal>

In addition to the two main, rock-solid, local storages (EXT and LVM), XCP-ng offers storage drivers for other types of local storage (ZFS, XFS, etc.).

### Software RAID

Local, with ```mdadm```. Not recommended.

See our [community-contributed guide](../guides/software-RAID-SR/).

:::tip
We strongly recommend using a hardware RAID system instead of software RAID.
:::

:::warning
**Software RAID storage integration is offered as-is** and does not come with official support.

We do not provide support for issues resulting from the choice of software RAID for storage repositories.
:::

### NFS

Shared, thin-provisioned storage. Efficient, recommended for ease of maintenance and space savings.

First, you need to create the NFS share. There are plenty of options: dedicated hardware, dedicated software solutions (e.g. TrueNAS) or manual administration on your favorite OS. Be aware of NFS user mapping: To ensure correct access rights, read the provider's documentation.

For a VDI NFS SR, the share needs to be read-write then, on the server side, adjust the export option, especially those related to NFS user mapping. XO uses the root user to mount the share.

:::tip
Your host will initially mount the top-level NFS share you provide (for example, `/share/xen`). XCP-ng will then automatically create and mount a dedicated subdirectory for the SR (for example, `/share/xen/515982ab-476e-17b7-0e61-e68fef8d7d31`).

Make sure your NFS server or appliance is set to allow sub-directory mounts, or adding the SR will fail. In FreeNAS or TrueNAS, this checkbox is called "All dirs" in the NFS share properties.
:::

#### In Xen Orchestra

Go in the "New" menu entry, then Storage, and select NFS. Follow instructions from there.  

#### In CLI

Example:

<Terminal shell title="root@xcp-ng-host — NFS">{`
xe sr-create type=nfs name-label=<SR_DESCRIPTION> shared=true device-config:server=<NFS_SERVER_IP> device-config:serverpath=</PATH/TO/SHARE>
`}</Terminal>

You will get the SR UUID in response.

See [`sr-create` docs](../appendix/cli_reference.md#sr-create) for more details.

### File

Local, thin-provisioned. Not recommended.

The `file` storage driver allows you to use any local directory as storage. 

Example:

<Terminal shell title="root@xcp-ng-host — File">{`
xe sr-create host-uuid=<host UUID> type=file content-type=user name-label="Local File SR" device-config:location=/path/to/storage
`}</Terminal>

Avoid using it with mount points for remote storage: if for some reason the filesystem is not mounted when the SR is scanned for virtual disks, the `file` driver will believe that the SR is empty and drop all VDI metadata for that storage.

### Fibre Channel

Fibre Channel is not a storage type per se, but rather a high-speed network technology and transport protocol used to connect computer data storage to Storage Area Networks (SANs). In XCP-ng, it is managed as a block storage type via hardware Host Bus Adapters (HBAs).

:::warning
While Fibre Channel is fully supported, for newer deployments we generally recommend evaluating modern alternatives such as iSCSI or NFS, which offer greater flexibility and simpler maintenance.
:::

For requirements and step-by-step installation instructions, see [Fibre Channel HBA Multipathing](./multipathing#fibre-channel-hba).

### XOSTOR

Shared, thin-provisioned storage.

XOSTOR is an hyperconvergence solution. In short, your local storage are combined into a big shared storage.

The detailed documentation is available on [this dedicated page](../xostor/xostor.md).


### ZFS

:::warning
**ZFS storage integration is offered as-is** and does not come with official support.
:::

Local, thin-provisioned. Available since XCP-ng 8.2.

:::tip
[Additional package](../management/additional-packages) required and available in our repositories: `zfs`.
Then either reboot or run `modprobe -v zfs` to load the kernel module.
:::

Due to the variety of parameters of ZFS, the SR driver does not automate everything. You need to create your ZFS pool and volumes yourself, e.g. on partition `sda4`:

<Terminal shell title="ZFS">{`
zpool create -o ashift=12 -m /mnt/zfs tank /dev/sda4
`}</Terminal>

<Terminal shell title="ZFS">{`
zfs create tank/zfssr
`}</Terminal>

Now you can create the SR on top of it:

<Terminal shell title="root@xcp-ng-host — ZFS">{`
xe sr-create host-uuid=<HOST_UUID> type=zfs content-type=user name-label=LocalZFS device-config:location=/mnt/zfs/zfssr
`}</Terminal>

:::tip
Please report any problems (performance or otherwise) you might encounter with ZFS. [Our forum](https://xcp-ng.org/forum) is here for that!
:::

:::warning
Note: If you use ZFS, assign at least 16GB RAM to avoid swapping. ZFS (in standard configuration) uses half the Dom0 RAM as cache!
:::

#### ZFS Knowledge & status

Feel free to look at these links for more advanced explanations:

* Wikipedia: [https://en.wikipedia.org/wiki/ZFS](https://en.wikipedia.org/wiki/ZFS)
* OpenZFS Basics: [https://www.youtube.com/watch?v=MsY-BafQgj4](https://www.youtube.com/watch?v=MsY-BafQgj4)

You can monitor your ZFS pool using:

```
# Get the global status.
zpool status

# More info concerning the performance.
zpool iostat -v 1
```

#### ZFS module parameters

To get the list of supported parameters, you can execute:

<Terminal shell title="ZFS module parameters">{`
man zfs-module-parameters
`}</Terminal>

It's possible to write/read parameters on the fly. For example:

```
# Read zfs_txg_timeout param.
cat /sys/module/zfs/parameters/zfs_txg_timeout
5
# Write zfs_txg_timeout param.
echo 10 > /sys/module/zfs/parameters/zfs_txg_timeout
```

#### Better performance (advanced options)

There are many options to increase the performance of ZFS SRs:

* Modify the module parameter `zfs_txg_timeout`: Flush dirty data to disk at least every N seconds (maximum txg duration). By default 5.
* Disable sync to disk: `zfs set sync=disabled tank/zfssr`
* Turn on compression (it's cheap but effective): `zfs set compress=lz4 tank/zfssr`
* Disable accesstime log: `zfs set atime=off tank/zfssr`

Check ZFS documentation to understand the pros and cons of each optimization.

### XFS

:::warning
**XFS storage integration is offered as-is** and does not come with official support.
:::

Local, thin-provisioned storage.

:::tip
[Additional package](../management/additional-packages) required and available in our repositories: `xfsprogs`.
:::

Works in the same way as the Local EXT storage driver: you hand it a device and it will format it and prepare it for your VMs automatically.

Via `xe` CLI for a local XFS SR (where `sdaX` is a partition, but it can be the entire device e.g. `sdc`):

<Terminal shell title="root@xcp-ng-host — XFS">{`
xe sr-create host-uuid=<host UUID> type=xfs content-type=user name-label="Local XFS" device-config:device=/dev/sdaX
`}</Terminal>

### Glusterfs

Shared, thin-provisioned storage. Available since XCP-ng 8.2.

:::warning
**Glusterfs storage integration is offered as-is** and does not come with official support.
:::

:::tip
[Additional package](../management/additional-packages) required and available in our repositories: `glusterfs-server`.
:::

You can use this driver to connect to an existing [Gluster storage](https://docs.gluster.org/en/latest/) volume and configure it as a shared SR for all your hosts in the pool. For example, a Gluster storage with 3 nodes (`192.168.1.11`, `192.168.1.12` and `192.168.1.13`) and a volume name called `glustervolume` will be thin provisioned with the command:

<Terminal shell title="root@xcp-ng-host — Glusterfs">{`
xe sr-create content-type=user type=glusterfs name-label=GlusterSharedStorage shared=true device-config:server=192.168.1.11:/glustervolume device-config:backupservers=192.168.1.12:192.168.1.13
`}</Terminal>

### CephFS

Shared, thin-provisioned storage. Available since XCP-ng 8.2.

:::warning
- **CephFS storage integration is offered as-is** and does not come with official support.
- This way of using Ceph requires installing `ceph-common` inside dom0 from outside the official XCP-ng repositories. It is reported to be working by some users, but isn't recommended officially (see [Additional packages](../management/additional-packages)). You will also need to be careful about system updates and upgrades.
:::

You can use this driver to connect to an existing Ceph storage filesystem, and configure it as a shared SR for all your hosts in the pool. This driver uses `mount.ceph` from `ceph-common` package of `centos-release-ceph-nautilus` repo. So user needs to install it before creating the SR. Without it, the SR creation would fail with an error like below
```
Error code: SR_BACKEND_FAILURE_47
Error parameters: , The SR is not available [opterr=ceph is not installed],
```

Since most of the Centos repositories have been deprecated, you need to add the Vault repository before installing.

<Terminal title="CephFS">{`
nano /etc/yum.repos.d/CentOS-Vault.repo

# Vault
[Vault-base]
name=Vault - CentOS-$releasever - Base
baseurl=http://vault.centos.org/centos/$releasever/os/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever

[Vault-updates]
name=Vault - CentOS-$releasever - Updates
baseurl=http://vault.centos.org/centos/$releasever/updates/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever

[Vault-extras]
name=Vault - CentOS-$releasever - Extras
baseurl=http://vault.centos.org/centos/$releasever/extras/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever
`}</Terminal>

After that follow installation steps

<Terminal shell title="root@xcp-ng-host — Vault">{`
yum install centos-release-ceph-nautilus --enablerepo=Vault-extras
yum-config-manager --disable centos-nfs-ganesha28 centos-ceph-nautilus
# Fix the repo file so that it points at vault.centos.org
sed -i -e '/^mirrorlist=/d' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
sed -i -e 's/#baseurl=/baseurl=/' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
sed -i -e 's/mirror\.centos\.org/vault.centos.org/' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
# install
yum install ceph-common --enablerepo=centos-ceph-nautilus,Vault-base
`}</Terminal>

Create `/etc/ceph/admin.secret` with your access secret for CephFS.

<Terminal title="install">{`
cat /etc/ceph/admin.secret
AQBX21dfVMJtBhAA2qthmLyp7Wxz+T5YgoxzeQ==
`}</Terminal>

Now you can create the SR where `server` is your mon ip.

<Terminal shell title="root@xcp-ng-host — cat /etc/ceph/admin.secret">{`
xe sr-create type=cephfs name-label=ceph device-config:server=172.16.10.10 device-config:serverpath=/xcpsr device-config:options=name=admin,secretfile=/etc/ceph/admin.secret
`}</Terminal>

:::tip
* For `serverpath` it would be good idea to use an empty folder from the CephFS instead of `/`.
* You may specify `serverport` option if you are using any other port than 6789.
* Do not use admin keyring for production, but make a separate key with only necessary privileges https://docs.ceph.com/en/latest/rados/operations/user-management/
:::

### MooseFS

Shared, thin-provisioned storage. Available since XCP-ng 8.2.

MooseFS is a fault-tolerant, highly available, highly performing, scaling-out, network distributed file system.  It is POSIX compliant and acts like any other Unix-like file system.
SR driver was contributed directly by MooseFS Development Team.

:::warning
- **MooseFS storage integration is provided as-is** and does not come with official support.
- The MooseFS client is not included with XCP-ng, so it must be installed on dom0 from the official MooseFS repository.
- By default, the MooseFS repository will be set as enabled. This means that any system update will also update the MooseFS client. Please, consider disabling the repository after installation.
:::

Installation steps

<Terminal shell title="MooseFS">{`
curl "https://ppa.moosefs.com/RPM-GPG-KEY-MooseFS" > /etc/pki/rpm-gpg/RPM-GPG-KEY-MooseFS
curl "http://ppa.moosefs.com/MooseFS-3-el7.repo" > /etc/yum.repos.d/MooseFS.repo
yum install moosefs-client
`}</Terminal>

:::tip
- By default, the `moosefs` storage driver is not enabled and must be whitelisted in XAPI's configuration.
- The list of accepted storage drivers is defined in `/etc/xapi.conf` but we must *never* modify this file directly. Instead, copy the `sm-plugins` definition from it, add `moosefs` to the line, and write the resulting line to a new `/etc/xapi.conf.d/99-enable-moosefs.conf` file.
- ⚠️ XAPI only takes the last definition of `sm-plugins` it reads into account. Files are read in alphabetical order. If there's already a configuration file in `/etc/xapi.conf.d` (to enable another additional storage driver), take it into consideration when you write your new definition of `sm-plugins`.
:::

Now when the MooseFS client is installed you can connect to an existing [MooseFS cluster](https://moosefs.com/support/#documentation) and create a shared SR for all hosts in the pool.

<Terminal shell title="root@xcp-ng-host — MooseFS">{`

xe sr-create type=moosefs name-label=MooseFS-SR content-type=user shared=True device-config:masterhost=mfsmaster.host.name device-config:masterport=9421 device-config:rootpath=/xcp-ng
`}</Terminal>

Basically, to connect the driver to our cluster we have to know two parameters:
- masterhost - MooseFS master host name or IP, default mfsmaster
- masterport - MooseFS master port, default 9421

We also suggest to use a folder on the MooseFS cluster as a root path rather than using the direct path of the cluster.

### iSCSI

Shared, thick-provisioned storage.

For an iSCSI multipath configuration, please follow [these steps](../../storage/multipathing/#iscsi) first.

In Xen Orchestra, go in the "New" menu entry, then Storage, and select iSCSI. Follow instructions from there.

### HBA

Shared, thick-provisioned storage.

For a Fibre Channel multipath configuration, please follow [these steps](../../storage/multipathing/#fibre-channel-hba) first.

You can add a Host Bus Adapter (HBA) storage device with `xe`:

<Terminal shell title="root@xcp-ng-host — HBA">{`
xe sr-create content-type=user shared=true type=lvmohba name-label=MyHBAStorage device-config:SCSIid=<the SCSI id>
`}</Terminal>

This is great for passing through full hardware disks, such as an entire hard disk.

If you have a problem with the SCSIid, you can use this alternative, carefully selecting the right drive, and checking it's visible on all hosts with the same name:

<Terminal shell title="root@xcp-ng-host — HBA">{`
xe sr-create content-type=user shared=true type=lvmohba name-label=MyHBAStorage device-config:device=/dev/<HBA drive>
`}</Terminal>

### Ceph iSCSI gateway

:::warning
**Experimental** - This needs reliable testing to ensure no block corruption happens in regular use. No official support is provided.
:::

This is at this moment the only way to connect to Ceph with no modifications of dom0, it's possible to create multiple Ceph iSCSI gateways following this: [https://docs.ceph.com/docs/master/rbd/iscsi-target-cli/](https://docs.ceph.com/docs/master/rbd/iscsi-target-cli/)

Ceph iSCSI gateway node(s) sits outside dom0, probably another Virtual or Physical machine. The packages referred in the URL are to be installed on iSCSI gateway node(s). For XCP-ng dom0, no modifications are needed as it would use LVMoISCSISR (lvmoiscsi) driver to access the iSCSI LUN presented by these gateways.

For some reason the chap authentication between gwcli and XCP-ng doesn't seem to be working, so it's recommended to disable it (in case you use no authentication a dedicated network for storage should be used to ensure some security).

IMPORTANT: User had many weird glitches with iSCSI connection via ceph gateway in lab setup (3 gateways and 3 paths on each host) after several days of using it. So please keep in mind that this setup is experimental and unstable. This would have to be retested on recent XCP-ng.

### Ceph RBD

:::warning
- **Ceph RBD storage integration is provided as-is** and does not come with official support.
- This way of using Ceph requires installing `ceph-common` inside dom0 from outside the official XCP-ng repositories. It is reported to be working by some users, but isn't recommended officially (see [Additional packages](../management/additional-packages)). You will also need to be careful about system updates and upgrades.
:::

You can use this to connect to an existing Ceph storage over RBD, and configure it as a shared SR for all your hosts in the pool. This driver uses LVM (lvm) as generic driver and expects that the Ceph RBD volume is already connected to one or more hosts.

Known issue: this SR is not allowed to be used for HA state metadata due to LVM backend restrictions within XAPI drivers, so if you want to use HA, you will need to create another type of storage for HA metadata

Since most of the Centos repositories have been deprecated, you need to add the Vault repository before installing.

<Terminal title="Ceph RBD">{`
nano /etc/yum.repos.d/CentOS-Vault.repo

# Vault
[Vault-base]
name=Vault - CentOS-$releasever - Base
baseurl=http://vault.centos.org/centos/$releasever/os/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever

[Vault-updates]
name=Vault - CentOS-$releasever - Updates
baseurl=http://vault.centos.org/centos/$releasever/updates/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever

[Vault-extras]
name=Vault - CentOS-$releasever - Extras
baseurl=http://vault.centos.org/centos/$releasever/extras/$basearch/
enabled=0
gpgcheck=1
gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-$releasever
`}</Terminal>

After that follow installation steps

<Terminal shell title="root@xcp-ng-host — Vault">{`
yum install centos-release-ceph-nautilus --enablerepo=Vault-extras
yum-config-manager --disable centos-nfs-ganesha28 centos-ceph-nautilus
# Fix the repo file so that it points at vault.centos.org
sed -i -e '/^mirrorlist=/d' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
sed -i -e 's/#baseurl=/baseurl=/' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
sed -i -e 's/mirror\.centos\.org/vault.centos.org/' /etc/yum.repos.d/CentOS-Ceph-Nautilus.repo
# install
yum install ceph-common --enablerepo=centos-ceph-nautilus,Vault-base
`}</Terminal>

Create `/etc/ceph/keyring` with your access secret for Ceph.

<Terminal title="install">{`
cat /etc/ceph/keyring
[client.admin]
key = YOUR-SECRET-KEY
`}</Terminal>

Create `/etc/ceph/ceph.conf` as your matching setup.

<Terminal title="cat /etc/ceph/keyring">{`
cat /etc/ceph/ceph.conf
[global]
mon_host = mon-ip-1:6789,mon-ip-2:6789,mon-ip-3:6789

[client.admin]
keyring = /etc/ceph/keyring
`}</Terminal>

Create the RBD image.

<Terminal shell title="install">{`
rbd create --size 300G --image-feature layering pool/xen1
`}</Terminal>

Mount the RBD image on your host.

```
# Map it to all xen hosts in your pool
rbd map pool/xen1
```

To automatically mount the RBD image, you can configure the `/etc/rbdmap` ( see [RBDMap documentation ](https://docs.ceph.com/en/reef/man/8/rbdmap/) ) as follows:

<Terminal title="Map it to all xen hosts in your pool">{`
cat /etc/ceph/rbdmap
# RbdDevice		Parameters
pool/xen1
`}</Terminal>

And then, enable the `rbdmap` service to mount automatically the image at boot.

<Terminal shell title="RbdDevice		Parameters">{`
systemctl enable --now rbdmap
`}</Terminal>

The CEPH RBD SR is built on top of an LVM Block device (your RBD image). You need to adapt the LVM configuration in order to be able to detect the newly created LVM VG created by XCP-NG.

You need to place this `devices` configuration for both:
- /etc/lvm/lvmlocal.conf
- /etc/lvm/master/lvmlocal.conf

```
...
devices {
	types = [ "scini", 16, "rbd", 1024 ]
	scan = [ "/dev/disk/by-id", "/dev/rbd" ]
}
...
```

:::warning
This configuration must be re-applied after each [XCP-NG Upgrade](/installation/upgrade/) / reinstall.

[Updates](/management/updates/) should not affect the LVM configuration.
:::

Create the CephRBD SR.

<Terminal shell title="root@xcp-ng-host — RbdDevice		Parameters">{`
# create a shared LVM
xe sr-create name-label='CEPH' shared=true device-config:device=/dev/rbd/rbd/xen1 type=lvm content-type=user
`}</Terminal>

You will probably want to configure ceph further so that the block device is mapped on reboot.

For the full discussion about Ceph in XCP-ng, see this forum thread: [https://xcp-ng.org/forum/topic/4/ceph-on-xcp-ng](https://xcp-ng.org/forum/topic/4/ceph-on-xcp-ng)

:::tip
* Do not use admin keyring for production, but make a separate key with only necessary privileges [https://docs.ceph.com/en/latest/rados/operations/user-management/](https://docs.ceph.com/en/latest/rados/operations/user-management/)
:::

### LargeBlock SR

:::warning
Largeblock SR is a workaround for 4KiB disks not working on VDI creation with normal SR types.
:::

To create a LargeBlock SR, the same parameters needed for a EXT SR are needed with the SR type changed to `largeblock`.

<Terminal shell title="root@xcp-ng-host — LargeBlock SR">{`
xe sr-create host-uuid=<host UUID> type=largeblock content-type=user name-label="Local largeblock" device-config:device=/dev/sdaX
`}</Terminal>

The largeblock SR creates a translation layer to align the device on 512 sector size using a loop device and creates a EXT SR on this emulated device.
It's needed to work around an issue with VHD alignment that creates an error on VHD creation on the native 4KiB device.

## 💿 ISO SR {#iso-sr}

You might be wondering how to upload an ISO. Unlike other solutions, you need to create a dedicated "space" for these, a specific ISO SR. To create an ISO SR, you have 2 possibilities:
- Shared: A shared ISO SR is on a VM or on a dedicated storage server. It's accessible with an IP address, like 192.168.1.100 via SMB or NFS.
- Local (not recommended for production): A local ISO SR is a directory created directly on the dom0 host. It's only accessible on the host where the directory was created.

### Create a Shared ISO SR

First, you need to create the NFS share. There are plenty of options: dedicated hardware, dedicated software solutions (e.g. TrueNAS) or manual administration on your favorite OS. Be aware of NFS 
_user mapping_: to ensure correct access rights, read the provider's documentation. 

For an _ISO SR_, the share only needs to be read-only.

Then, in Xen Orchestra go into "New/Storage" and select "ISO SR":

![Adding a shared ISO SR to a host via XO.](https://xcp-ng.org/assets/img/screenshots/createSRISO.png)

### Create a Local ISO SR

From the CLI:

1. Create a directory on the local filesystem to storage your ISOs
2. Copy/move ISOs to this new location
3. Create the ISO SR using xe sr-create
4. You can add or update ISOs later by placing them into the directory you created in step 1
5. Rescan the SR if you change the files stored in the ISO directory

Here's an example of how to create a Local ISO SR named "ISO Repository" that will be stored in /opt/var/iso_repository:

```
mkdir -p /opt/var/iso_repository

xe sr-create name-label="ISO Repository" type=iso device-config:location=/opt/var/iso_repository device-config:legacy_mode=true content-type=iso
a6732eb5-9129-27a7-5e4a-8784ac45df27 # this is the output

xe sr-scan uuid=a6732eb5-9129-27a7-5e4a-8784ac45df27
```
If your host is in a pool of several hosts, you need to add the `host-uuid` parameter to the `xe sr-create` command above. You can retrieve the host UUID with `xe host-list`.

You can then upload your ISO in /opt/var/iso_repository/

On Xen Orchestra, go into "New/Storage" and select "ISO SR"

* Select "Local" instead of NFS/SMB
* Enter the path created before
* Upload ISOs on your host to the same path

![Adding a local ISO SR to a host via XO.](https://xcp-ng.org/assets/img/screenshots/createLocalSRISO.png)

:::warning
A local ISO SR will only be available on the host where it was created. Also, the dom0 filesystem is small with only about 15gb of space free for extra storage!
:::

That's it!

:::tip
Don't forget to rescan your SR after adding, changing, or deleting ISO files. Rescan is done automatically every 10 minutes otherwise.
:::

## 📡 Storage API {#storage-api}

Current storage stack on XCP-ng is called `SMAPIv1`. The VHD format is used, which has a maximum file size limitation of 2TiB. This means that when using this format your VM disk can't be larger than 2TiB.

### Why use VHD format?

Mostly for historical reasons. When standardization on [VHD](https://en.wikipedia.org/wiki/VHD_(file_format)) was decided, it was the only acceptable format that supported [copy on write](https://en.wikipedia.org/wiki/Copy-on-write), delta capabilities, and merge possibilities. Thanks to VHD format, you have:

* snapshot support
* delta backup
* fast clone VM
* live storage migration

### Using RAW format

Alternatively, you can decide to use a disk without 2TiB limitation, thanks to RAW format. However, the price to pay is to lose all VHD features.

To create a large VDI on a file based SR, it's trivial, for example:

<Terminal shell title="root@xcp-ng-host — Using RAW format">{`
xe vdi-create type=user sm-config:type=raw virtual-size=5TiB sr-uuid=<SR_UUID> name-label=test
`}</Terminal>

On a block based storage, it's a bit more complicated:

1. Create a small disk first: `xe vdi-create type=user sm-config:type=raw virtual-size=1GiB sr-uuid=<SR_UUID> name-label=test`
2. Extend it with `lvextend -L+5T /dev/VG_<whateverUUID>/LV-<VDI_UUID>`
3. Rescan SR

:::warning
You won't be able to live migrate storage on this disk or snapshot it anymore. Outside of this, it will work very well.
:::

### SMAPIv3: the future

`SMAPIv1` is the historical storage interface, and now a big spaghetti monster. That's why Citrix decided to create a new one, called `SMAPIv3`: it's far more flexible, and also support (partially) the `qcow2` format. This format has the same concepts as VHD, but without its limitations.

Also, the storage API is far more agnostic and the code is better. So what's the catch? Problem is there's no Open Source implementation of `SMAPIv3`, also the current API state isn't really complete (doesn't support a lot of features). However, XCP-ng team is working on it too, because it's clearly the future!

## 🪄 Coalesce {#coalesce}

Coalesce process is an operation happening in your hosts as soon a snapshot is removed.

When you make a snapshot, a "base copy" is created (in read only), the "active" disk will live its own life, same for the freshly created snapshot. Example here: A is the parent, B the current/active disk and C is the snapshot:

![Legend of parent (solid line), active (dotted line) and snapshot (dashed line).](https://xen-orchestra.com/blog/content/images/2017/05/legendsnap.png)

![Active and Snapshot points to parent.](https://xen-orchestra.com/blog/content/images/2017/05/snapshot1.png)

That's OK. But what about creating a new snapshot on B after some data are written?

You got this:

![Previous active (B), becomes a parent, and an active (D) and snapshot (E) are now pointing to B.](https://xen-orchestra.com/blog/content/images/2017/05/beforemerge.png)

When you make XO backup on regular basis, old/unused snapshots will be removed automatically. This will also happen if you create/delete snapshots manually. So in our case, C will disappear. And without this snapshot, XCP-ng will coalesce A and B:

![On the left (before coalesce), C has been removed, an arrow in the middle indicates the change happening through coalesce, and on the right (after coalesce), parent becomes A+B with active (D) and snapshot (E) points to it.](https://xen-orchestra.com/blog/content/images/2017/05/parent.png)

This process will take some time to finish (especially if you VM stays up and worst if you have a lot of writes on its disks).

**What about creating snapshot (ie call backup jobs) faster than XCP-ng can coalesce?** Well, the chain will continue to grow. And more you have disks to merge, longer it will take.

You will hit a wall, 2 options here:

* if your VM disks are small enough, you could reach the max chain length (30).
* if your VM disks are big, you'll hit the SR space limit before.

### Xen Orchestra protection

Luckily, Xen Orchestra is able to detect an uncoalesced chain. It means it won't trigger a backup job for a VM if its disks are not coalesced yet: it will be skipped.

But more than that, Xen Orchestra is also able to show you uncoalesced disk in the SR view, in the Advanced tab.

More about this exclusive feature on [https://xen-orchestra.com/blog/xenserver-coalesce-detection-in-xen-orchestra/](https://xen-orchestra.com/blog/xenserver-coalesce-detection-in-xen-orchestra/)

## 🦮 How to modify an existing SR connection {#how-to-modify-an-existing-sr-connection}

The link between a host and an SR is called the `PBD`. A PBD basically stores **how** to access a storage repository (like the path to the drive or to an NFS share).

If you want to change how an SR is accessed (for example, if your NFS SR changed its IP), you must destroy and recreate the `PBD` with the new values. Let's use our example where an NFS SR has changed to a new IP:

0. Double check you don't have running VMs on this SR. This is crucial as this operation cannot be performed live.
1. Get the SR UUID (in XO, SR view, click on your NFS SR, the UUID is visible then)
2. On your host console/terminal, find all the `PBD` UUIDs for this SR:
`xe sr-param-get param-name=PBDs uuid=<SR UUID>`
3. For each `PBD` UUID, run  `xe pbd-param-list uuid=<PBD UUID>` and copy the output to a text editor so you have them "saved" elsewhere. Each record has the host UUID and SR UUID, which will be needed to recreate them. It will also contain the `device-config`, which is required to indicate how to access it (the NFS path).
4. Now you need to edit this `device-config` field with the new values. In our example, I will change my `device-config` from `serverpath: /mnt/xen; server: 192.168.1.2` to `serverpath: /mnt/xen; server: 192.168.1.5` to reflect the new NFS IP. Have this text ready for the next commands.
5. Remove each of these old PBDs with `xe pbd-destroy uuid=<PBD UUID>`.
6. Recreate each of them using your new `device-config`, for example here: `xe pbd-create host-uuid=<HOST UUID> sr-uuid=<SR UUID> device-config:server=192.168.1.5 device-config:serverpath=/mnt/xen`. Note the new IP address entered vs the previous PBD configuration.
7. When you're done and all PBDs are recreated, you can reconnect (in XO, SR view, "reconnect to all hosts" or do a `xe pbd-plug uuid=<PBD UUID` for each of them). Once reconnected, you can start your VMs as if nothing happened.
