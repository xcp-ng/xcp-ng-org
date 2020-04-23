 XCP-ng computer is dedicated entirely to the task of running XCP-ng and hosting VMs, and is not used for other applications.

::: warning
Installing third-party software directly in the control domain of XCP-ng is not supported. The exception is for software supplied in the current repositories. If want to add an extra package inside XCP-ng please [ask here](https://github.com/xcp-ng/xcp/issues/56).
:::

## XCP-ng system requirements

Although XCP-ng is usually deployed on server-class hardware, XCP-ng is also compatible with many models of workstations and laptops. For more information, see the [Hardware Compatibility List (HCL)](hcl.md).

The following section describes the recommended XCP-ng hardware specifications.

XCP-ng must be a **64-bit x86** server-class machine devoted to hosting VMs. XCP-ng creates an optimized and hardened Linux partition with a Xen-enabled kernel. This kernel controls the interaction between the virtualized devices seen by VMs and the physical hardware.

XCP-ng can use:

* Up to 5 TB of RAM
* Up to 16 physical NICs
* Up to 288 logical processors per host.

> Note
The maximum number of logical processors supported differs by CPU. For more information, see the [Hardware Compatibility List (HCL)](hcl.md).


The system requirements for XCP-ng are:

## CPUs

One or more 64-bit x86 CPUs, 1.5 GHz minimum, 2 GHz or faster multicore CPU recommended.

To support VMs running Windows or more recent versions of Linux, you require an Intel VT or AMD-V 64-bit x86-based system with one or more CPUs.

> Note: To run Windows VMs or more recent versions of Linux, enable hardware support for virtualization on XCP-ng. Virtualization support is an option in the BIOS. It is possible that your BIOS might have virtualization support disabled. For more information, see your BIOS documentation.

To support VMs running supported paravirtualized Linux, you require a standard 64-bit x86-based system with one or more CPUs.

## RAM

2 GB minimum, 4 GB or more recommended

## Disk space

* Locally attached storage (PATA, SATA, SCSI) with 46 GB of disk space minimum, 70 GB of disk space recommended.
* SAN via HBA (not through software) when installing with multipath boot from SAN.


For a detailed list of compatible storage solutions, see the [Hardware Compatibility List (HCL)](hcl.md).
Network

100 Mbit/s or faster NIC. One or more Gb, or 10 Gb NICs is recommended for faster P2V and export/import data transfers and VM live migration.

We recommend that you use multiple NICs for redundancy. The configuration of NICs differs depending on the storage type. For more information, see the vendor documentation.

XCP-ng requires an IPv4 network for management and storage traffic.

> Notes: Ensure that the time setting in the BIOS of your server is set to the current time in UTC. In some support cases, serial console access is required for debug purposes. When setting up XCP-ng configuration, we recommend that you configure serial console access. For hosts that do not have physical serial port or where suitable physical infrastructure is not available, investigate whether you can configure an embedded management device. For example, Dell DRAC or HP iLO. For more information about setting up serial console access, see CTX228930 - How to Configure Serial Console Access on XenServer and later.

## Supported guest OS

For a list of supported VM operating systems, see Guest operating system support.
Pool requirements

A resource pool is a homogeneous or heterogeneous aggregate of one or more servers, up to a maximum of 64. Before you create a pool or join a server to an existing pool, ensure that all servers in the pool meet the following requirements.
Hardware requirements

All of the servers in a XCP-ng resource pool must have broadly compatible CPUs, that is:

* The CPU vendor (Intel, AMD) must be the same on all CPUs on all servers.
* To run HVM virtual machines, all CPUs must have virtualization enabled.

## Other requirements

In addition to the hardware prerequisites identified previously, there are some other configuration prerequisites for a server joining a pool:

* It must have a consistent IP address (a static IP address on the server or a static DHCP lease). This requirement also applies to the servers providing shared NFS or iSCSI storage.
* Its system clock must be synchronized to the pool master (for example, through NTP).
* It cannot be a member of an existing resource pool.
* It cannot have any running or suspended VMs or any active operations in progress on its VMs, such as shutting down or exporting. Shut down all VMs on the server before adding it to a pool.
* It cannot have any shared storage already configured.
* It cannot have a bonded management interface. Reconfigure the management interface and move it on to a physical NIC before adding the server to the pool. After the server has joined the pool, you can reconfigure the management interface again.
* It must be running the same version of XCP-ng, at the same patch level, as servers already in the pool.
* It must be configured with the same supplemental packs as the servers already in the pool. Supplemental packs are used to install add-on software into XCP-ng control domain, dom0. To prevent an inconsistent user experience across a pool, all servers in the pool must have the same supplemental packs at the same revision installed.
* It must have the same XCP-ng license as the servers already in the pool. You can change the license of any pool members after joining the pool. The server with the lowest license determines the features available to all members in the pool.

XCP-ngs in resource pools can contain different numbers of physical network interfaces and have local storage repositories of varying size. In practice, it is often difficult to obtain multiple servers with the exact same CPUs, and so minor variations are permitted. If you want your environment to have hosts with varying CPUs in the same resource pool, you can force join a pool together using the CLI. For information about forcing the joining operation, see Hosts and resource pools.

> Note: Servers providing shared NFS or iSCSI storage for the pool must have a static IP address or be DNS addressable.

### Homogeneous pools

A homogeneous resource pool is an aggregate of servers with identical CPUs. CPUs on a server joining a homogeneous resource pool must have the same vendor, model, and features as the CPUs on servers already in the pool.

### Heterogeneous pools

Heterogeneous pool creation is made possible by using technologies in Intel (FlexMigration) and AMD (Extended Migration) CPUs that provide CPU masking or leveling. These features allow a CPU to be configured to appear as providing a different make, model, or feature set than it actually does. These capabilities enable you to create pools of hosts with different CPUs but still safely support live migrations.

For information about creating heterogeneous pools, see Hosts and resource pools.