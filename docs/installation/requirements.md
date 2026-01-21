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

- Local storage (PATA, SATA, SCSI) with a minimum of 46 GB, recommended 70 GB or more.
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

:::note
XCP-ng 8.2 is EOL. This 8.2-specific information is retained solely to assist with the transition from 8.2 to a supported release.
:::

:::info
- Set the server's BIOS clock to the current UTC time. Key signatures can only be verified if your BIOS time is set correctly. Failing to do so may result in "Signature Key Import Failed" errors when configuring IPv4.
- For debugging support cases, serial console access may be required. Consider configuring serial console access for XCP-ng. For systems without physical serial ports, explore embedded management devices like Dell DRAC or HP iLO. See [CTX228930 - How to Configure Serial Console Access on XenServer 7.0 and later](https://support.citrix.com/article/CTX228930).
:::

## 📋 XCP-ng Configuration Limits

XCP-ng supports the following per host:

### RAM

- Up to 6 TB.

In XCP-ng 8.3, Xen theoretically supports up to 12 TiB with security support, and even more without security support.

### Physical Network Interface Cards (NICs)

- Up to 16 physical NICs.

### Logical Processors

:::note
The maximum number of supported logical processors may vary depending on the CPU. For more information, see the [Hardware Compatibility List (HCL)](../../installation/hardware).
:::

#### XCP-ng 8.3 LTS

:::note
XCP-ng 8.2 is EOL. This 8.2-specific information is retained solely to assist with the transition from 8.2 to a supported release.
:::

- Up to 960 logical processors, depending on CPU support (theoretical, untested: 1024).

#### XCP-ng 8.2 LTS

- Up to 448 logical processors (theoretical, untested: 512).

### Virtual Network Interface Cards (vNICs)

- Up to 512 virtual NICs.

### Virtual Local Area Networks (VLANs)

- Up to 800 VLANs.

## Virtual Machine Configuration Limits

Below are the supported limits for virtual machines on XCP-ng.

### CPU

#### XCP-ng 8.3 LTS

- **Virtual CPUs (vCPUs) per VM**:
  - For untrusted VMs, the security-supported limit is **32 vCPUs**.
  - For trusted VMs, the tested limits are **128 vCPUs** in BIOS mode and **96 vCPUs** in UEFI mode. Developments are planned to increase these limits.

Guest OS support is also an important factor to consider.

#### XCP-ng 8.2 LTS

:::note
XCP-ng 8.2 is EOL. This 8.2-specific information is retained solely to assist with the transition from 8.2 to a supported release.
:::

- **Virtual CPUs (vCPUs) per VM**: Up to **32 vCPUs**.

Ensure that your guest OS supports this configuration.

### GPU

- **Virtual GPUs per VM**: Up to **8**.

### Memory

#### XCP-ng 8.3 LTS

- **Maximum RAM per VM**:
  - With memory snapshot support: **1.5 TiB**.
  - Without memory snapshot support: **8 TiB**.
  - Theoretical limit without security support: **16 TiB** (minus the RAM allocated to Xen and the controller domain).

Keep in mind that the actual usable memory depends on the guest OS limits. In some cases, going beyond what the OS can manage efficiently may lead to performance drops.

#### XCP-ng 8.2 LTS

:::note
XCP-ng 8.2 is EOL. This 8.2-specific information is retained solely to assist with the transition from 8.2 to a supported release.
:::

- **Maximum RAM per VM**: **1.5 TiB**.

### Storage

- **Virtual Disk Images per VM (including CD-ROMs)**: Up to **241**. This is also influenced by the limits of your guest OS; refer to its documentation to ensure compatibility.
- **Virtual CD-ROM drives per VM**: **1**.
- **Maximum Virtual Disk Size**:
  - **2,040 GiB** using storage drivers with the VHD format (`Local EXT`, `Local LVM`, `NFS`, `LVM over iSCSI`, `XOSTOR`, etc.).
  - Nearly unlimited when using the `raw` storage driver or disk pass-through to the VM (note: snapshots and live migration are not supported in these cases).
  - New storage drivers are under active development to overcome the **2,040 GiB** VHD limit while retaining features like snapshots and live migration.

### Networking

- **Virtual Network Interface Controllers (NICs) per VM**: Up to **7**.
  Note: Some guest operating systems may have stricter limits, or you may need to install XCP-ng Guest Tools to reach this maximum.

### Other

- **Passed-through USB devices**: Up to **6**.

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