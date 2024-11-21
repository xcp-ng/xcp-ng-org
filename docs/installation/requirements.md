---
sidebar_position: 1
---

# Requirements

Understand what is needed to run XCP-ng.

An XCP-ng server is dedicated entirely to running XCP-ng and hosting VMs. It is not used for other applications.

:::info
Installing third-party software directly in the XCP-ng control domain is not supported, except for software supplied in the official repositories. If you wish to add extra packages to XCP-ng, please [submit your request here](https://github.com/xcp-ng/xcp/issues/56).
:::

## 📋 XCP-ng System Requirements

XCP-ng is generally deployed on server-class hardware, but it also supports many workstation and laptop models. For more information, refer to the [Hardware Compatibility List (HCL)](../../installation/hardware).

The following outlines the recommended XCP-ng hardware specifications.

XCP-ng must be a **64-bit x86** server-class machine dedicated to hosting VMs. It creates a hardened Linux partition using a Xen-enabled kernel, which manages interactions between VMs and the physical hardware.

XCP-ng supports, per host:

### RAM
- Up to 6 TB

### Physical Network Interface Cards (NICs)
- Up to 16 physical NICs

### Logical processors

#### XCP-ng 8.2 LTS
- Up to 448 logical processors

#### XCP-ng 8.3
- Up to 960 logical processors, depending on CPU support

### Virtual Network Interface Cards (vNICs)
- Up to 512 virtual NICs

### Virtual Local Area Networks (VLANs)
- Up to 800 VLANs

:::note
The maximum number of supported logical processors may vary by CPU. For more information, see the [Hardware Compatibility List (HCL)](../../installation/hardware).
:::


The system requirements for XCP-ng are:

### CPUs

- One or more 64-bit x86 CPUs, minimum 1.5 GHz; 2 GHz or faster multicore CPUs are recommended.
- To run Windows VMs or recent Linux versions, an Intel VT or AMD-V 64-bit x86-based system with one or more CPUs is required.

> **Note**: For Windows VMs or newer Linux distributions, enable hardware virtualization in the BIOS. It may be disabled by default—consult your BIOS documentation for guidance.

- For VMs running supported paravirtualized Linux, a standard 64-bit x86-based system with one or more CPUs is required.

### Memory

- Minimum 2 GB, recommended 4 GB or more.
- A fixed amount of RAM is allocated to the control domain (dom0). Optimal allocation depends on your workload.

### Disk Space

- Local storage (PATA, SATA, SCSI) with a minimum of 46 GB, recommended 70 GB.
- SAN access via HBA (not software) when installing with multipath boot from SAN.

For more details, refer to the [Hardware Compatibility List (HCL)](../../installation/hardware).

#### Installation on USB Drives

:::danger
**Strongly discouraged** due to heavy write operations in XCP-ng:
- **XAPI Database**: Undergoes frequent changes, resulting in extensive write operations, potentially reducing USB drive lifespan. The XAPI database maintains the state of all XCP-ng operations and is replicated across all hosts.
- **Logging**: XCP-ng generates a high volume of logs. Consider using a remote syslog service as an alternative.
:::

#### Installation on SD Cards

:::danger
Similarly, installing XCP-ng on SD cards is highly discouraged. A basic SSD offers a vastly more durable and effective alternative for managing system partitions.
:::

### Network

- Minimum 100 Mbit/s NIC. Recommended: one or more Gb or 10 Gb NICs for faster data transfers, including P2V, import/export, and VM live migrations.
- Use multiple NICs for redundancy. Network configuration depends on your storage type—refer to vendor documentation for guidance.

XCP-ng 8.2 requires an IPv4 network for management and storage traffic. Starting from XCP-ng 8.3, the management network supports IPv6.

:::info
Set the server's BIOS clock to the current UTC time. For debugging support cases, serial console access may be required. Consider configuring serial console access for XCP-ng. For systems without physical serial ports, explore embedded management devices like Dell DRAC or HP iLO. See [CTX228930 - How to Configure Serial Console Access on XenServer 7.0 and later](https://support.citrix.com/article/CTX228930).
:::

## 🖥️ Supported Guest OSes

XCP-ng officially supports operating systems still receiving updates from their publishers. Many other systems can also run on XCP-ng.

### Windows

- Windows Server 2016, 2019, 2022
- Windows 10
- Windows 11 (starting with XCP-ng 8.3)

:::info
Older Windows versions may work but lack PV drivers, resulting in lower networking and disk performance (e.g., Windows XP, Windows Server 2003). While unsupported versions like Windows Server 2012 still function, future PV driver updates may drop compatibility.
:::

### Linux

- RHEL, CentOS, Rocky, AlmaLinux, Oracle
- Debian, Ubuntu
- Arch, Alpine, SUSE, and others

### BSD

- FreeBSD and related distributions (e.g., pfSense, TrueNAS)
- OpenBSD

## Virtual Machine Requirements

Here are the supported limits for virtual machines on XCP-ng. In certain cases, it may be possible to exceed these limits, but such configurations are untested and may not be supported from a security standpoint.

### CPU

#### XCP-ng 8.2 LTS

- Virtual CPUs (vCPUs) for Linux VMs: You can use up to **32 vCPUs**, but make sure to check what your guest OS supports.
- Virtual CPUs (vCPUs) for Windows VMs: You can use up to **32 vCPUs**.

#### XCP-ng 8.3

- Virtual CPUs (vCPUs) for Linux and Windows VMs: You can use up to **64 vCPUs**, but make sure to check what your guest OS supports.
For example, Red Hat Enterprise Linux 8 and its similar distributions only handle up to 32 vCPUs. Even though 64 is possible, sticking to 32 is a safer bet for reliability and stability.  

#### GPU
- Virtual GPUs per VM: 8  
- Passed-through GPUs per VM: 1  

#### Memory
- Maximum RAM per VM: 1.5 TiB. Just keep in mind that the actual memory your OS can use depends on its limits. If you go over what it can manage, you might see some performance drops.

#### Storage
- Virtual Disk Images per VM, including CD-ROMs: Up to 241. This number is influenced by what your guest OS supports, so double-check your OS documentation to stay within its limits.  
- Virtual CD-ROM drives per VM: 1  
- Maximum Virtual Disk Size: 2,040 GiB

#### Networking
- Virtual Network Interface Controllers (NICs) per VM: Up to 7. Some guest operating systems might have stricter limits, or you might need to install XCP-ng Guest Tools to hit the maximum limit.

#### Other
- Passed-through USB devices: Up to 6

## 🎱 Pool Requirements

A resource pool is a collection of one or more servers (up to 64), which can be homogeneous or heterogeneous. Before creating or joining a pool, ensure the following:

### Hardware Requirements

- All servers must have compatible CPUs (same vendor — Intel or AMD). To run HVM VMs, CPUs must support virtualization.

### Additional Pool Requirements

In addition to the hardware prerequisites identified previously, there are some other configuration prerequisites for a server joining a pool:

- Static IP address (or static DHCP lease). This requirement also applies to the servers providing shared NFS or iSCSI storage.
- System clock synchronized to the pool master (e.g., via NTP).
- Must not be part of an existing pool.
- No running or suspended VMs, or active VM operations (shut down VMs before joining).
- No configured shared storage.
* It cannot have a bonded management interface. Reconfigure the management interface and move it to a physical NIC before adding the server to the pool. Once the server has joined the pool, you can reconfigure the management interface again.
* It must be running the same version of XCP-ng, at the same update level, as servers already in the pool.

Resource pools can have hosts with varying physical network interfaces and local storage capacities. In practice, it is often difficult to obtain multiple servers with the exact same CPUs, and so minor variations are permitted. If you want your environment to have hosts with varying CPUs in the same resource pool, you can force join a pool together using the CLI. To know more on forced joining operation, see Hosts and Resource Pools.

> **Note**: Servers providing shared NFS or iSCSI storage must have static or DNS-addressable IPs.

### Homogeneous Pools

A homogeneous resource pool is an aggregate of servers with identical CPUs. Servers in a homogeneous pool must have identical CPUs, including vendor, model, and features.

### Heterogeneous Pools

Technologies such as Intel FlexMigration or AMD Extended Migration allow you to create heterogeneous pools. These technologies provide CPU masking or leveling, which means you can configure a CPU to appear to provide a different make, model, or feature set than it actually does. These capabilities allow you to create pools of hosts with different CPUs and still support secure, live migrations.

For detailed information, see the Hosts and Resource Pools.