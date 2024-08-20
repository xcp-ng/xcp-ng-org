
# XOSTOR documentation

## LINSTOR/DRBD global documentation in the context of XCP-ng

### What is LINSTOR?

`LINSTOR` is an open-source software developed by `LINBIT`. It was designed to manipulate a set of resources on several machines and to replicate them via `DRBD` block devices while allowing high performance. `XOSTOR` is a `LinstorSR` SMAPI driver developed by Vates, which allows volume replication in an XCP-ng pool and provides a web UI in XOA.

### How does it work?

LINSTOR is made of two main components:
- A controller, declared on a machine of the XCP-ng pool. There is only one per pool and it can run on a master or a slave. The controller is a daemon that receives commands across the pool's network to manipulate the volumes, network, configuration...
- Satellites which are the other machines of the pool. They send commands to the controller and the controller's state to the host.

Communication between the satellites and the controller is done via the TCP/IP protocol. A newly created LINSTOR SR will use the XAPI management interface by default.

A Python API is available to communicate with LINSTOR and is used in the driver. Otherwise, a CLI tool is available: `linstor`.

### DRBD

Earlier, we have described what constituted an XCP-ng pool with LINSTOR: a controller and its satellites. Now, let's explain what the volumes are based on.
Each volume created via a LINSTOR command appears as a `DRBD` (Distributed Replicated Block Device). Like LINSTOR, this tool is also developed by LINBIT and is officially available in the Linux kernel.

DRBD is a solution to share a resource across multiple machines, using a replication parameter. In XCP-ng, it's a `/dev/drbdXXX` volume accessible on several hosts where `XXXX` is the `device minor number`. For each XCP-ng VDI (Virtual Disk Image), there is a DRBD volume.

#### Resources & Volumes

DRBD has a `device minor number`, but also a `resource name` which helps to understand what the resource corresponds to.

The path to a DRBD resource follows this pattern:
```
> realpath /dev/drbd/by-res/<RESOURCE_NAME>/<VOLUME_ID>
/dev/drbd<DRBD_MINOR>
```

You may notice the use of a `<VOLUME_ID>` here.
A DRBD is a set of volumes that form a group. Within the same DRBD resource, each volume will share the same attributes. Several volumes can be useful for breaking down information while sharing the context of the same DRBD resource. In our case, we only use one volume per DRBD resource, meaning that the `VOLUME_ID` will always be 0. By abuse of language, it's therefore possible that we use the terms resource and volume interchangeably in this documentation.

#### Roles/Locks

The ability of a machine to access a DRBD path `/dev/drbdXXX` depends on the role of the DRBD resource. A resource can be `Primary` or `Secondary`:
- A `Primary` resource is accessible on a host for READ and WRITE operations.
- A `Secondary` resource only receives requests from the `Primary`. It's used to replicate the data and improve reading performance simultaneously. Only the DRBD kernel module can access this volume's data and it can't be written or read by any other process.

A DRBD Primary can be seen as a lock on a resource. This lock is global to a machine, not specific to a process.
At first, all instances of a DRBD are in the Secondary role. There are two main ways for a DRBD to become Primary:
- By taking the Primary role if the resource is indeed Secondary on all machines with the command `drbdadm primary <RESOURCE_NAME>`. Change the parameter and run the command `drbdadm secondary <RESOURCE_NAME>` when you no longer want to read or write on this resource.
- By using the default configuration of a DRBD resource: a call to a C function like `fopen("/dev/drbd1001", "r+")` gives `Primary` access to a resource. If the resource is opened on another machine, an `EROFS` errno code is returned. If the resource contains a partition, a call to the `mount` command also allows to obtain a lock.

TLDR, when a volume is primary, it's like a lock: other instances of this same volume cannot be opened on other machines. The volume/lock must be released to give access to other hosts.

#### Diskless and Diskful

Usually, when a resource is replicated through DRBD, we assume that it only exists in 1, 2 or 3 copies. In other words, in a pool that has at least 4 hosts, a host may not have a copy of a resource locally. In this case scenario, it is however possible to access a resource's data using a device like `/dev/drbdXXXX`. When data is written or read, network requests are sent to the hosts that have a replication of this volume. This volume type is called `diskless` and a DRBD which has local data is called `diskful`.

Like a diskful, when a diskless is opened, it takes the primary lock.

#### Where is the data stored?

The data is stored in a lower-level storage located in a layer below the DRBDs.
In the driver, an `LVM group` is built on one or more physical disks. Each machine in a pool doesn't need a physical disk to be able to use LINSTOR/DRBD.

:::tip
We recommend using the same types of drives (processor, disk) on every machine that has them.
:::

### Concepts of LINSTOR

We saw that DRBD is a set of resources and volumes. These notions also exist in LINSTOR, with additional elements on top of DRBD.

#### Node

A node is an object that contains important information about a host such as:
  - Its name, which must be identical to the hostname.
  - Its type: controller, satellite, combined, auxiliary. In our implementation, we always use combined nodes which can be controller and/or satellite because if the current controller of a pool has a problem, we want to be able to start one elsewhere. Without this, we would no longer be able to launch LINSTOR commands.
  - The IP address and port that are used by the satellites/controller. By default, the XAPI management IP is used.

CLI example:
```
> linstor node list
╭──────────────────────────────────────────────────────────╮
┊ Node    ┊ NodeType ┊ Addresses                  ┊ State  ┊
╞══════════════════════════════════════════════════════════╡
┊ r620-s1 ┊ COMBINED ┊ 172.16.210.14:3366 (PLAIN) ┊ Online ┊
┊ r620-s2 ┊ COMBINED ┊ 172.16.210.15:3366 (PLAIN) ┊ Online ┊
┊ r620-s3 ┊ COMBINED ┊ 172.16.210.16:3366 (PLAIN) ┊ Online ┊
╰──────────────────────────────────────────────────────────╯
```

#### Storage Pool

A storage pool is a LINSTOR object that represents the physical storage layer of a pool node. In practice, it is an LVM layer below DRBD.

CLI example:
```
> linstor storage-pool list
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ StoragePool                      ┊ Node    ┊ Driver   ┊ PoolName                  ┊ FreeCapacity ┊ TotalCapacity ┊ CanSnapshots ┊ State ┊ SharedName                               ┊
╞════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ DfltDisklessStorPool             ┊ r620-s1 ┊ DISKLESS ┊                           ┊              ┊               ┊ False        ┊ Ok    ┊ r620-s1;DfltDisklessStorPool             ┊
┊ DfltDisklessStorPool             ┊ r620-s2 ┊ DISKLESS ┊                           ┊              ┊               ┊ False        ┊ Ok    ┊ r620-s2;DfltDisklessStorPool             ┊
┊ DfltDisklessStorPool             ┊ r620-s3 ┊ DISKLESS ┊                           ┊              ┊               ┊ False        ┊ Ok    ┊ r620-s3;DfltDisklessStorPool             ┊
┊ xcp-sr-linstor_group_thin_device ┊ r620-s1 ┊ LVM_THIN ┊ linstor_group/thin_device ┊   859.10 GiB ┊    931.28 GiB ┊ True         ┊ Ok    ┊ r620-s1;xcp-sr-linstor_group_thin_device ┊
┊ xcp-sr-linstor_group_thin_device ┊ r620-s2 ┊ LVM_THIN ┊ linstor_group/thin_device ┊   829.77 GiB ┊    931.28 GiB ┊ True         ┊ Ok    ┊ r620-s2;xcp-sr-linstor_group_thin_device ┊
┊ xcp-sr-linstor_group_thin_device ┊ r620-s3 ┊ LVM_THIN ┊ linstor_group/thin_device ┊   758.99 GiB ┊    931.28 GiB ┊ True         ┊ Ok    ┊ r620-s3;xcp-sr-linstor_group_thin_device ┊
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

In the XCP-ng LINSTOR driver, only two backends are supported: `LVM` (thick provisioning) and `LVM_THIN` (thin provisioning).

In this example, the name of the storage pool used on each node is: `xcp-sr-linstor_group_thin_device`. The special storage pool `DfltDisklessStorPool` is used to manage diskless DRBDs.

#### Resource Group

A resource group is another LINSTOR object and it can be seen as a container of resources. The managed resources are influenced by the group's properties. The most important property is the `PlaceCount` which defines for each resource, the number of copies that must be present in the pool.

A change in a property has a direct impact on the existing resources. For example, increasing a place count will create new duplications on other hosts.

CLI example:
```
> linstor rg list
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceGroup                    ┊ SelectFilter                                     ┊ VlmNrs ┊ Description ┊
╞════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ DfltRscGrp                       ┊ PlaceCount: 2                                    ┊        ┊             ┊
╞┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╡
┊ xcp-ha-linstor_group_thin_device ┊ PlaceCount: 3                                    ┊ 0      ┊             ┊
┊                                  ┊ StoragePool(s): xcp-sr-linstor_group_thin_device ┊        ┊             ┊
┊                                  ┊ DisklessOnRemaining: False                       ┊        ┊             ┊
╞┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╡
┊ xcp-sr-linstor_group_thin_device ┊ PlaceCount: 2                                    ┊ 0      ┊             ┊
┊                                  ┊ StoragePool(s): xcp-sr-linstor_group_thin_device ┊        ┊             ┊
┊                                  ┊ DisklessOnRemaining: False                       ┊        ┊             ┊
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

In an XCP-ng context, we use a single storage pool (xcp-sr-linstor_group_thin_device) containing two resource groups:
- xcp-ha-linstor_group_thin_device
- xcp-sr-linstor_group_thin_device

 The first group is used both as the heartbeat volume required by the HA and as the drbd1000 volume which contains the LINSTOR database. This database contains the information displayed via the `linstor` command. As these volumes are vital for the SR's survival, the replication is forced to 3.
 The second group is used for all volumes created by a user and the replication count is configurable from 1 to 3.

#### Resource, Volume & Definitions

In comparison to DRBD, the info about the resource and volume also has a `definition` in LINSTOR. A resource cannot exist without a definition and it describes the most common attributes of each copy of the resource, regardless of the number of replications.

Examples of resource and volume definitions:
```
> linstor rd list
╭───────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceName                                    ┊ Port ┊ ResourceGroup                    ┊ State ┊
╞═══════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-persistent-database                         ┊ 7000 ┊ xcp-ha-linstor_group_thin_device ┊ ok    ┊
┊ xcp-persistent-ha-statefile                     ┊ 7001 ┊ xcp-ha-linstor_group_thin_device ┊ ok    ┊
┊ xcp-persistent-redo-log                         ┊ 7002 ┊ xcp-ha-linstor_group_thin_device ┊ ok    ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ 7003 ┊ xcp-sr-linstor_group_thin_device ┊ ok    ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ 7010 ┊ xcp-sr-linstor_group_thin_device ┊ ok    ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ 7021 ┊ xcp-sr-linstor_group_thin_device ┊ ok    ┊
╰───────────────────────────────────────────────────────────────────────────────────────────────────╯
> linstor vd list
╭───────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceName                                    ┊ VolumeNr ┊ VolumeMinor ┊ Size       ┊ Gross ┊ State ┊
╞═══════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-persistent-database                         ┊ 0        ┊ 1000        ┊ 1 GiB      ┊       ┊ ok    ┊
┊ xcp-persistent-ha-statefile                     ┊ 0        ┊ 1001        ┊ 2 MiB      ┊       ┊ ok    ┊
┊ xcp-persistent-redo-log                         ┊ 0        ┊ 1002        ┊ 256 MiB    ┊       ┊ ok    ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ 0        ┊ 1003        ┊ 2.01 GiB   ┊       ┊ ok    ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ 0        ┊ 1010        ┊ 100.21 GiB ┊       ┊ ok    ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ 0        ┊ 1021        ┊ 100.25 GiB ┊       ┊ ok    ┊
╰───────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

In XCP-ng, we always use only one volume for one resource, so the `VolumeNr` column only contains 0s.
It is possible to retrieve DRBD paths with this info.
For example for the HA statefile volume, we have:
```
/dev/drbd/by-res/xcp-persistent-ha-statefile/0 # where 0 is the VolumeNr
/dev/drbd1001 # where 1001 is the VolumeMinor
```

A resource is an instance of a definition. There are usually at least three resources per definition and each has its properties: the node where it is located, its usage, state and creation date.

Examples of resources and volumes:
```
> linstor r list
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceName                                    ┊ Node    ┊ Port ┊ Usage  ┊ Conns ┊      State ┊ CreatedOn           ┊
╞══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-persistent-database                         ┊ r620-s1 ┊ 7000 ┊ InUse  ┊ Ok    ┊   UpToDate ┊ 2023-06-13 18:40:06 ┊
┊ xcp-persistent-database                         ┊ r620-s2 ┊ 7000 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2023-06-13 18:40:04 ┊
┊ xcp-persistent-database                         ┊ r620-s3 ┊ 7000 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2023-06-13 18:40:04 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s1 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:18 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s2 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:14 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s3 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:18 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s1 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:27 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s2 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:23 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s3 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:28 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s1 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s2 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s3 ┊ 7003 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2023-10-19 14:59:56 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s1 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s3 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s1 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s2 ┊ 7021 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2024-02-16 15:42:10 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s3 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s1 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s2 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s3 ┊ 7012 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-16 13:44:04 ┊
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
> linstor v list
╭───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ Node    ┊ Resource                                        ┊ StoragePool                      ┊ VolNr ┊ MinorNr ┊ DeviceName    ┊  Allocated ┊ InUse  ┊      State ┊
╞═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ r620-s1 ┊ xcp-persistent-database                         ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1000 ┊ /dev/drbd1000 ┊  67.54 MiB ┊ InUse  ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-persistent-database                         ┊ DfltDisklessStorPool             ┊     0 ┊    1000 ┊ /dev/drbd1000 ┊            ┊ Unused ┊   Diskless ┊
┊ r620-s3 ┊ xcp-persistent-database                         ┊ DfltDisklessStorPool             ┊     0 ┊    1000 ┊ /dev/drbd1000 ┊            ┊ Unused ┊   Diskless ┊
┊ r620-s1 ┊ xcp-persistent-ha-statefile                     ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1001 ┊ /dev/drbd1001 ┊      1 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-persistent-ha-statefile                     ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1001 ┊ /dev/drbd1001 ┊      1 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s3 ┊ xcp-persistent-ha-statefile                     ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1001 ┊ /dev/drbd1001 ┊      1 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s1 ┊ xcp-persistent-redo-log                         ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1002 ┊ /dev/drbd1002 ┊   2.50 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-persistent-redo-log                         ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1002 ┊ /dev/drbd1002 ┊   2.50 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s3 ┊ xcp-persistent-redo-log                         ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1002 ┊ /dev/drbd1002 ┊   2.50 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s1 ┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1003 ┊ /dev/drbd1003 ┊ 163.47 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1003 ┊ /dev/drbd1003 ┊ 163.47 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s3 ┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ DfltDisklessStorPool             ┊     0 ┊    1003 ┊ /dev/drbd1003 ┊            ┊ Unused ┊ TieBreaker ┊
┊ r620-s1 ┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1010 ┊ /dev/drbd1010 ┊ 728.63 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s3 ┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1010 ┊ /dev/drbd1010 ┊ 728.63 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s1 ┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1021 ┊ /dev/drbd1021 ┊  10.27 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ DfltDisklessStorPool             ┊     0 ┊    1021 ┊ /dev/drbd1021 ┊            ┊ Unused ┊   Diskless ┊
┊ r620-s3 ┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1021 ┊ /dev/drbd1021 ┊  10.27 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s1 ┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1012 ┊ /dev/drbd1012 ┊  10.27 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s2 ┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ xcp-sr-linstor_group_thin_device ┊     0 ┊    1012 ┊ /dev/drbd1012 ┊  10.27 MiB ┊ Unused ┊   UpToDate ┊
┊ r620-s3 ┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ DfltDisklessStorPool             ┊     0 ┊    1012 ┊ /dev/drbd1012 ┊            ┊ Unused ┊ TieBreaker ┊
╰───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

### DRBD/LINSTOR Resource State

A DRBD/LINSTOR resource can be in several states, the main ones are:
- UpToDate: No issue with the resource!
- DUnknown: Communication issue getting the resource's state. An incorrect IP address, a problem with the network or with a satellite can cause this.
- Inconsistent: This can happen on replications when a new resource is created or during a new synchronization.
- Diskless: The resource doesn't store the data locally but has a DRBD path to read/write, using the network.
- TieBreaker: To protect against loss of quorum, each diskful and diskless DRBD acts as a tie-breaker. The reason for displaying this state using the `linstor r list` is because there is a specific case when it is explicitly visible: when a resource is not available on a host. No diskful nor diskless means no `/dev/drbdXXXX` path.

For more info, please visit [this page](https://linbit.com/drbd-user-guide/drbd-guide-9_0-en/#s-disk-states).

#### drbd-reactor

Several services are necessary for LINSTOR to work properly on XCP-ng. The most trivial are the `linstor-controller` and the `linstor-satellite` services. 

:::warning
Never manually start a controller on a pool where an SR is already configured. There is a reason for this and it's called high availability: a controller must always be available. If a host that was running the controller is rebooted, another machine will start another controller. A daemon called `drbd-reactor` automatically handles the startup process.
:::

The `drbd-reactor` is a daemon implemented to react to DRBD events and respond using scripts.

It has a modified configuration on XCP-ng so that it can always be restarted in the event of a problem:
```
/etc/systemd/system/drbd-reactor.service.d/override.conf
```

It is configured using:

- A modification of the satellite configuration:
```
> cat /etc/systemd/system/linstor-satellite.service.d/override.conf
[Service]
Environment=LS_KEEP_RES=^xcp-persistent*

[Unit]
After=drbd.service
```

As noted in the shared database section, the controller uses a DRBD volume containing the LINSTOR database instead of a simple local folder on a host. This database must be accessible after a reboot, meaning that `/dev/drbd/by-res/xcp-persistent-database/0` must be accessible on at least one machine (normally 3, since this volume is always replicated 3 times). A path like that is generated using a DRBD resource config file. These configurations are automatically created by LINSTOR itself and they are not persistent: they are recreated each time the controller is started after a pool reboot. The only way to keep a DRBD config file at boot is to use the `LS_KEEP_RES` environment variable to indicate it to LINSTOR.

- A `drbd-reactor` configuration that uses the linbit promoter plugin:
```
> cat /etc/drbd-reactor.d/sm-linstor.toml
[[promoter]]

[promoter.resources.xcp-persistent-database]
start = [ "var-lib-linstor.service", "linstor-controller.service" ]
```
This plugin allows the running of resources when a resource has a quorum and is not primary. In our case, we start `var-lib-linstor.service` which mounts the database `/dev/drbd1000` on `/var/lib/linstor`. If successful, we can start the controller. Only one host can mount the database since only one primary is on the resource. Quick reminder: when a resource is mounted on a host, it takes the primary lock.

For more info regarding the promoter plugin, you can visit [this page](https://github.com/LINBIT/drbd-reactor/blob/0620ff875370ad26a61c149fa6f02a19d66f45cd/doc/promoter.md).

- The `/etc/systemd/system/var-lib-linstor.service` config file that contains:
```
[Unit]
Description=Mount filesystem for the LINSTOR controller

[Service]
Type=oneshot
ExecStart=/bin/mount -w /dev/drbd/by-res/xcp-persistent-database/0 /var/lib/linstor
ExecStop=/opt/xensource/libexec/safe-umount /var/lib/linstor
RemainAfterExit=true
```

## Howto and Questions

## Installation

### Prerequisites

- At least 3 hosts: DRBD uses a quorum algorithm that needs at least 3 reachable machines to correctly replicate resources and avoid the risk of split-brain.
- A dedicated 10G or higher network interface for DRBD. It's possible to use the same interface used for host management (XAPI) but it's recommended to use a dedicated interface.
- At least 1 disk on any machine of the pool (case without replication). Otherwise, any number of disks can be used on a machine. However, to be consistent, we recommend using the same model and number for each machine that has disks.
- The replication/place count must be equal to 1, 2 or 3.

:::important
Only XCP-ng 8.2.1 is currently supported and with a maximum of 7 machines per pool.
:::

## Update

See this documentation: [RPU](/management/updates/#rolling-pool-update-rpu).

## Global questions

### The linstor command does not work!?

If you get the following output, this is not necessarily abnormal:
```
> linstor r list
Error: Unable to connect to linstor://localhost:3370: [Errno 99] Cannot assign requested address
```

There can only be one controller running on a pool at a time. If you get this error, there are two possibilities:
- Either there is a problem and the `linstor-controller` service is not started anywhere.
- Or you should rerun the command on another machine.

:::tip
It's possible to provide the command with a comma separated list of IPs, eliminating the need to manually try each host.
```
linstor --controllers=<IP_LIST> r list
```

Example on a pool with 3 machines:
```
linstor --controllers=172.16.210.84,172.16.210.85,172.16.210.86 r list
```

:::
Important: the `--controllers` parameter should always be just after the command name and before the action.
:::

### How to list LINSTOR resources and interpret this output?

Command:
```
linstor r list
```

Output example:
```
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceName                                    ┊ Node    ┊ Port ┊ Usage  ┊ Conns ┊      State ┊ CreatedOn           ┊
╞══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-persistent-database                         ┊ r620-s1 ┊ 7000 ┊ InUse  ┊ Ok    ┊   UpToDate ┊ 2023-06-13 18:40:06 ┊
┊ xcp-persistent-database                         ┊ r620-s2 ┊ 7000 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-06-13 18:40:04 ┊
┊ xcp-persistent-database                         ┊ r620-s3 ┊ 7000 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-06-13 18:40:04 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s1 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:18 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s2 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:14 ┊
┊ xcp-persistent-ha-statefile                     ┊ r620-s3 ┊ 7001 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:18 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s1 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:27 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s2 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:23 ┊
┊ xcp-persistent-redo-log                         ┊ r620-s3 ┊ 7002 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-03-20 16:01:28 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s1 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s2 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s3 ┊ 7003 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2023-10-19 14:59:56 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s1 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s3 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s1 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s2 ┊ 7021 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2024-02-16 15:42:10 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s3 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s1 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s2 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s3 ┊ 7012 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-16 13:44:04 ┊
┊ xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a ┊ r620-s1 ┊ 7023 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-12 23:32:25 ┊
┊ xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a ┊ r620-s2 ┊ 7023 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-12 23:32:26 ┊
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

Remarks regarding special volumes:
- `xcp-persistent-database` is an important resource that contains the LINSTOR database, i.e. the list of volumes, nodes, etc. It's this DRBD resource that is mounted on `/var/lib/linstor` before the controller starts.
- `xcp-persistent-ha-statefile` & `xcp-persistent-redo-log` are special volumes used by the HA.
- All other resources start with `xcp-volume-<UUID>` where the UUID is an internal identifier different from the XAPI VDI UUIDs.

### How to get a quick view of the resource status of a pool?

You can use the following commands to find out the status of a pool:
```
linstor n list
linstor r list
```

They return the state of the nodes and resources. If nothing is written in RED, it probably means that there is no damage to the data. However, this does not mean that there are no problems elsewhere. To prevent issues from happening, you can run this command:
```
linstor advise r
```

It returns recommendations about resources that might have problems later.
For example, you can have an output like this:
```
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ Resource                                        ┊ Issue                                                                  ┊ Possible fix                                                                                  ┊
╞══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-volume-8791c6e9-a17b-4eec-878a-3e1bdd3d2273 ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-8791c6e9-a17b-4eec-878a-3e1bdd3d2273 ┊
┊ xcp-volume-6818e3f6-a129-4b76-b330-33dc86e7cf02 ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-6818e3f6-a129-4b76-b330-33dc86e7cf02 ┊
┊ xcp-volume-98076e75-63e3-4582-80e6-79fe698308e3 ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-98076e75-63e3-4582-80e6-79fe698308e3 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊
┊ xcp-volume-ac5df7a3-9cc2-45ee-98e3-d86cbd235c72 ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-ac5df7a3-9cc2-45ee-98e3-d86cbd235c72 ┊
┊ xcp-volume-e480eec9-97c3-44ea-b070-1c1dff72aacd ┊ Resource has 2 replicas but no tie-breaker, could lead to split brain. ┊ linstor rd ap --drbd-diskless --place-count 1 xcp-volume-e480eec9-97c3-44ea-b070-1c1dff72aacd ┊
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

### Map LINSTOR resource names to XAPI VDI UUIDs

Resource UUIDs are different from VDI UUIDs. The output of `linstor r list` gives the resource name but it doesn't give an understanding about relationships between LINSTOR volumes and XAPI VDI UUIDs:
```
╭──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceName                                    ┊ Node    ┊ Port ┊ Usage  ┊ Conns ┊      State ┊ CreatedOn           ┊
╞══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ xcp-persistent-database                         ┊ r620-s1 ┊ 7000 ┊ InUse  ┊ Ok    ┊   UpToDate ┊ 2023-06-13 18:40:06 ┊
┊ xcp-persistent-database                         ┊ r620-s2 ┊ 7000 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2023-06-13 18:40:04 ┊
┊ xcp-persistent-database                         ┊ r620-s3 ┊ 7000 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2023-06-13 18:40:04 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s1 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s2 ┊ 7003 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-19 14:59:57 ┊
┊ xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf ┊ r620-s3 ┊ 7003 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2023-10-19 14:59:56 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s1 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967 ┊ r620-s3 ┊ 7010 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2023-10-24 10:42:40 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s1 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s2 ┊ 7021 ┊ Unused ┊ Ok    ┊   Diskless ┊ 2024-02-16 15:42:10 ┊
┊ xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815 ┊ r620-s3 ┊ 7021 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:11 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s1 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s2 ┊ 7012 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 13:44:05 ┊
┊ xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4 ┊ r620-s3 ┊ 7012 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-16 13:44:04 ┊
┊ xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a ┊ r620-s1 ┊ 7023 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-12 23:32:25 ┊
┊ xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a ┊ r620-s2 ┊ 7023 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-12 23:32:26 ┊
┊ xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a ┊ r620-s3 ┊ 7023 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-12 23:32:26 ┊
┊ xcp-volume-35c8b8e3-a1b7-4372-8ee8-43969221fabc ┊ r620-s1 ┊ 7008 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:04 ┊
┊ xcp-volume-35c8b8e3-a1b7-4372-8ee8-43969221fabc ┊ r620-s2 ┊ 7008 ┊ Unused ┊ Ok    ┊   UpToDate ┊ 2024-02-16 15:42:04 ┊
┊ xcp-volume-35c8b8e3-a1b7-4372-8ee8-43969221fabc ┊ r620-s3 ┊ 7008 ┊ Unused ┊ Ok    ┊ TieBreaker ┊ 2024-02-16 15:42:04 ┊
╰──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```

To better understand the mapping of UUIDs, we developed a tool called `linstor-kv-tool`.

Usage:
```
linstor-kv-tool --dump-volumes -u <HOSTNAME> -g <GROUP_NAME> | grep '/volume-name":'
```

- `<HOSTNAME>` is the IP of the host on which the controller is running. If you are currently connected to it, you can use `localhost`.
- `<GROUP_NAME>` is the LINSTOR group used by the pool.

To know which group to specify, you can use the command:
```
linstor resource-group list
```

Output example:
```
╭────────────────────────────────────────────────────────────────────────────────────────────────────────────╮
┊ ResourceGroup                    ┊ SelectFilter                                     ┊ VlmNrs ┊ Description ┊
╞════════════════════════════════════════════════════════════════════════════════════════════════════════════╡
┊ DfltRscGrp                       ┊ PlaceCount: 2                                    ┊        ┊             ┊
╞┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╡
┊ xcp-ha-linstor_group_thin_device ┊ PlaceCount: 3                                    ┊ 0      ┊             ┊
┊                                  ┊ StoragePool(s): xcp-sr-linstor_group_thin_device ┊        ┊             ┊
┊                                  ┊ DisklessOnRemaining: False                       ┊        ┊             ┊
╞┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╡
┊ xcp-sr-linstor_group_thin_device ┊ PlaceCount: 2                                    ┊ 0      ┊             ┊
┊                                  ┊ StoragePool(s): xcp-sr-linstor_group_thin_device ┊        ┊             ┊
┊                                  ┊ DisklessOnRemaining: True                        ┊        ┊             ┊
╰────────────────────────────────────────────────────────────────────────────────────────────────────────────╯
```
The group name is the value of `StoragePool(s)`.

Output example of the `linstor-kv-tool` command:
```
> linstor-kv-tool --dump-volumes -u localhost -g xcp-sr-linstor_group_thin_device | grep '/volume-name":'
  "xcp/volume/0e7a20d9-04ce-4306-8229-02a76a407ae6/volume-name": "xcp-volume-289c3fb5-67ec-49b1-b5a8-71ebe379ee2a",
  "xcp/volume/2369e1b9-2166-4e3a-b61d-50d539fce51b/volume-name": "xcp-volume-13f2bcc0-c010-4637-9d10-d670f68a4ff4",
  "xcp/volume/28e44535-b463-4606-9f35-b8d701640f9d/volume-name": "xcp-volume-35c8b8e3-a1b7-4372-8ee8-43969221fabc",
  "xcp/volume/296fcf08-fb39-42eb-81b5-6208b8425f1b/volume-name": "xcp-volume-01611aa8-688b-470a-92ee-21c56de16cdf",
  "xcp/volume/5798a276-b3eb-45f1-bdda-4abc296b25dc/volume-name": "xcp-volume-10d2c269-35ef-4948-b7f0-dcd8db9b7815",
  "xcp/volume/b947f6ae-3403-4e07-b002-d159b11d988f/volume-name": "xcp-volume-07f73f51-95ea-4a82-ba03-ef65dfbfb967"
```

Output format:
```
  "xcp/volume/<VDI_UUID>/volume-name": "<LINSTOR_VOLUME_NAME>"
```

### How a LINSTOR SR capacity is calculated?

If you cannot create a VDI due to an error of it being too large, even though it's smaller than the size of the SR in XO's view, there is an explanation:
- The maximum size of a VDI that can be created is not necessarily equal to the SR capacity.
- The SR capacity in the XOSTOR context is the maximum size that can be used to store _all_ VDI data.

Exception: if the replication count is equal to the number of hosts, the SR capacity is equal to the max VDI size, i.e. the capacity of the smallest disk in the pool.

This formula can be used to compute the SR capacity:
```
sr_capacity = smallest_host_disk_capacity * host_count / replication_count
```

For a pool of 3 hosts for example, with a replication count of 2 and a disk of 200 GiB on each host, the formula gives an SR capacity equal to 300 GiB.
Consider the following:
- It's not possible to create a VDI greater than 200 GiB because the replication is not block-based but volume-based.
- If you create a volume of 200 GiB it means that 400 of the 600 GiB are physically used. However, the remaining disk of 200 GiB cannot be used because it cannot be replicated on two different disks.
- If you create 3 volumes of 100 GiB: the SR is filled. In this case, you have 300 GiB of unique data and a replication of 300 GiB.

### How to use a specific network for DRBD requests?

To use a specific network to handle the DRBD traffic, a new interface must be created on each host:
```
linstor node interface create <NODE_NAME> <INTERFACE_NAME> <IP>
```

`<INTERFACE_NAME>` is arbitrary; you can choose any name. Then, specify an existing IP on the host you have assigned to a network / NIC in XCP-ng.

To set this new interface as active, use the following:
```
linstor node set-property <NODE_NAME> PrefNic <INTERFACE_NAME>
```

Repeat this command for every node.

### How to change a hostname/node name?

:::tip
The node name should _always_ be the same as the hostname. If the hostname is changed, the node name must be modified and vice versa.
:::

There is no easy way to do this, the trick is to create a new node and remove the old one. Here are the steps to follow:

1. Create a new node:
```
linstor node create --node-type Combined <NODE_NAME> <IP>
```

2. Evacuate the old node to preserve the replication count:
```
linstor node evacuate <OLD_NAME>
```

3. Change the hostname:
```
xe host-set-hostname-live host-uuid=<HOST_UUID> host-name=<HOST_NAME>
```

4. Restart the services on each host:
```
systemctl stop linstor-controller
systemctl restart linstor-satellite
```

5. Make sure that the resources of the deleted node have been replicated on the remaining host and verify with `linstor r list` that all resources are up to date. Then, delete the node and create a storage pool for the new node:
```
linstor node delete <OLD_NAME>
```

```
# For thin:
linstor storage-pool create lvmthin <NODE_NAME> <SP_NAME> <VG_NAME>

# For thick:
linstor storage-pool create lvm <NODE_NAME> <SP_NAME> <VG_NAME>

# Example:
# linstor storage-pool create lvmthin r620-s4 xcp-sr-linstor_group_thin_device linstor_group/thin_device
```

:::tip
To verify the Storage Pool, you can use:
```
linstor sp list
```
:::

6. Recreate the diskless/diskful resources (if necessary).

 Use `linstor advise r` to see the commands to execute.

### How to use a specific network for satellites?

Doing this is not recommended. To guarantee a certain robustness of the pool, the best choice is to use the XAPI management interface.  
But if you are sure of what you are doing:

```
linstor node interface modify <NODE_NAME> <INTERFACE_NAME> --active
```

Documentation on Network Interface Cards management on [this page](https://linbit.com/drbd-user-guide/linstor-guide-1_0-en/#s-managing_network_interface_cards).

### What to do if you're unable to mount the database volume (drbd1000) after a wrong network interface configuration or IP change?

Feel free to follow steps 1 to 5 described below:

#### 1. Reset resource file config

Check the node list using `linstor node list` on the node where the controller is running.
If there is no controller, use `drbdsetup status xcp-persistent-database` to see the state of the database on each host. In the case of split-brain, use the corresponding documentation.
Otherwise, to change the IPs manually, open this file on a machine of the pool:
```
nano /var/lib/linstor.d/xcp-persistent-database.res
```

You should  have a similar configuration in the file:
```
    connection
    {
        host r620-s1 address ipv4 172.16.210.83:7000;
        host r620-s2 address ipv4 172.16.210.84:7000;
    }

    connection
    {
        host r620-s1 address ipv4 172.16.210.83:7000;
        host r620-s3 address ipv4 172.16.210.85:7000;
    }
```

For each entry, modify the IPs to use the XAPI management interface of each hostname.  
Save and repeat this modification on each host.

Restart `drbd-reactor` on each machine, using this command:
```
systemctl restart drbd-reactor
```

Reboot the hosts if the controller doesn't restart.

After this point, the controller should be running. Find it and list the resources:
```
linstor r list
```

If the array is empty, execute:
```
systemctl stop linstor-controller
```

The controller will restart on the current machine or another one.  
Check again the resource list.

#### 2. Reset the active satellite connection

Verify the node list:
```
linstor n list
```

If you have a similar result, there is still something wrong:
```
╭───────────────────────────────────────────────────────────╮
┊ Node    ┊ NodeType ┊ Addresses                  ┊ State   ┊
╞═══════════════════════════════════════════════════════════╡
┊ r620-s1 ┊ COMBINED ┊ 172.16.210.83:3366 (PLAIN) ┊ Unknown ┊
┊ r620-s2 ┊ COMBINED ┊ 172.16.210.84:3366 (PLAIN) ┊ Unknown ┊
┊ r620-s3 ┊ COMBINED ┊ 172.16.210.85:3366 (PLAIN) ┊ Unknown ┊
╰───────────────────────────────────────────────────────────╯
```

Verify the interfaces using:
```
linstor node interface list r620-s1
```

If you don't have "StltCon" in the first column for the default interface (or if this interface is missing), the active connection should be reset:
```
╭────────────────────────────────────────────────────────────────╮
┊ r620-s1 ┊ NetInterface ┊ IP            ┊ Port ┊ EncryptionType ┊
╞════════════════════════════════════════════════════════════════╡
┊ +       ┊ default      ┊ 172.16.210.83 ┊ 3366 ┊ PLAIN          ┊
╰────────────────────────────────────────────────────────────────╯
```

Try using this command for each host interface (replace `r620-s1` using the right hostname):
```
linstor node interface modify r620-s1 default --active
```

Verify every interface of each node again.

#### 3. H2 modification to reset active connection and use default interface

If you cannot modify the connections using:
```
linstor node interface modify <HOSTNAME> default --active
```

You probably have a similar error:
```
ERROR:
Description:
    Modification of netInterface 'default' on node 'r620-s1' failed due to an unknown exception.
Details:
    Node: 'r620-s1', NetIfName: default'
Show reports:
    linstor error-reports show 660585D7-00000-000000
```

In this situation, the LINSTOR database should be modified manually.  
Copy the database to another directory:
```
mkdir /root/linstor-db/
cp /var/lib/linstor/linstordb.mv.db /root/linstor-db/linstordb.mv.db.backup
cp /root/linstor-db/linstordb.mv.db.backup /root/linstor-db/linstordb.mv.db
```

Connect to the DB backup using:
```
java -cp /usr/share/linstor-server/lib/h2*.jar org.h2.tools.Shell -url jdbc:h2:/root/db/linstordb -user linstor -password linstor
# Note: you can also use a web interface with:
# java -jar /usr/share/linstor-server/lib/h2-1.4.197.jar -web -webAllowOthers -tcp -tcpAllowOthers
# But the server must be reachable without the support tunnel or using additional bind commands, so easier to use the CLI...
```

##### 4. Modify node properties

Now we can execute a few commands to verify the database state. Check the node properties first:
```
SELECT * FROM LINSTOR.PROPS_CONTAINERS WHERE PROPS_INSTANCE LIKE '/NODE%';
```

A valid configuration should return something similar to this:
```
PROPS_INSTANCE | PROP_KEY        | PROP_VALUE
/NODES/R620-S1 | CurStltConnName | default
/NODES/R620-S1 | NodeUname       | r620-s1
/NODES/R620-S1 | PrefNic         | default
/NODES/R620-S2 | CurStltConnName | default
/NODES/R620-S2 | NodeUname       | r620-s2
/NODES/R620-S2 | PrefNic         | default
/NODES/R620-S3 | CurStltConnName | default
/NODES/R620-S3 | NodeUname       | r620-s3
/NODES/R620-S3 | PrefNic         | default
(9 rows, 4 ms)
```

In this context:
- `CurStltConnName` is the satellite connection used by a node.
- `PrefNic` is the preferred network used by a DRBD resource on this node.

The goal is to reset the satellite and DRBD connections to use the `default` interface.

If the `CurStltConnName` is not equal to `default` for each node, use:
```
UPDATE LINSTOR.PROPS_CONTAINERS
SET PROP_VALUE = 'default'
WHERE PROPS_INSTANCE LIKE '/NODE%' AND PROP_KEY = 'CurStltConnName';
```

Same for the preferred NIC:
```
UPDATE LINSTOR.PROPS_CONTAINERS
SET PROP_VALUE = 'default'
WHERE PROPS_INSTANCE LIKE '/NODE%' AND PROP_KEY = 'PrefNic';
```

You can add the missing info if a node entry is absent (for `NodeUname`, `CurStltConnName` or `PrefNic`). For example to configure a `r620-s4` node:
```
INSERT INTO LINSTOR.PROPS_CONTAINERS
VALUES ('/NODES/R620-S4', 'NodeUname', 'r620-s4');
INSERT INTO LINSTOR.PROPS_CONTAINERS
VALUES ('/NODES/R620-S4', 'CurStltConnName', 'default');
INSERT INTO LINSTOR.PROPS_CONTAINERS
VALUES ('/NODES/R620-S4', 'PrefNic', 'default');
```

:::warning  
The value of `PROPS_INSTANCE` must be in capital letters, in this example: `/NODES/R620-S4`.
:::

To remove a bad node, for example `r620-s4`:
```
DELETE FROM LINSTOR.PROPS_CONTAINERS
WHERE PROPS_INSTANCE = '/NODES/R620-S4';
```

##### 5. Modify interface IPs

The default config should now be set for each node.
The last thing to do is to verify the IP addresses of the default interfaces.

To list them:
```
SELECT * FROM LINSTOR.NODE_NET_INTERFACES;
```

Output example:
```
UUID                                 | NODE_NAME | NODE_NET_NAME | NODE_NET_DSP_NAME | INET_ADDRESS  | STLT_CONN_PORT | STLT_CONN_ENCR_TYPE
25bf886f-2325-42df-a888-c7c88f48d722 | R620-S1   | DEFAULT       | default           | 192.16.210.14 | 3366           | PLAIN
bb739364-2aeb-421c-96fa-c1eae934b192 | R620-S3   | DEFAULT       | default           | 172.16.210.16 | 3366           | PLAIN
62f19c69-77b5-43cf-ba68-0a68149ab7ff | R620-S2   | DEFAULT       | default           | 172.16.210.15 | 3366           | PLAIN
e0d79792-b20c-4dd9-a76c-cd7921a70f05 | R620-S1   | STORAGE       | storage           | 192.168.1.48  | null           | null
19fc1fcb-507c-4524-b6fe-a697a4a068ca | R620-S2   | STORAGE       | storage           | 192.168.1.49  | null           | null
b2d8e90c-7ce2-46aa-bd50-c5dd3bdae85b | R620-S3   | STORAGE       | storage           | 192.168.1.50  | null           | null
```

If an IP is incorrect for the default interface, you can modify it. Example for the `R620-S1` node:
```
UPDATE LINSTOR.NODE_NET_INTERFACES
SET INET_ADDRESS = '172.16.210.14'
WHERE UUID = '25bf886f-2325-42df-a888-c7c88f48d722';
```

After all these changes, you can exit. If SQL transactions have been used, do not forget to commit:
```
COMMIT;
```

Then, you can override the LINSTOR database:
```
cp /root/linstor-db/linstordb.mv.db /var/lib/linstor/linstordb.mv.db
```

Finally, you can stop the controller on the host currently running.
`drbd-reactor` will restart it and you should have a valid database again.

Check using:
```
linstor n list
linstor r list
```

### What to do when a node is in an EVICTED state?

A controller can mark a node as EVICTED if the LINSTOR default configuration is used and a satellite offline for 60 minutes. The DRBD resources are then replicated on the remaining nodes as a protection against data loss. The following command is usually enough to re-import the evicted machine:
```
linstor node restore <NODE_NAME>
```

If the machine has to be removed:
```
linstor node lost <NODE_NAME>
```

The next step is to remove the machine from the pool using XAPI commands.  
Or using `xsconsole`: "Resource Pool Configuration" => "Remove This Host from the Pool".

Note: iptables config must also be modified to remove LINSTOR port rules (edit `/etc/sysconfig/iptables` then `service iptables restart` to apply the changes).

For more info:
- https://linbit.com/blog/linstors-auto-evict/
- https://linbit.com/drbd-user-guide/linstor-guide-1_0-en/#s-linstor-auto-evict
