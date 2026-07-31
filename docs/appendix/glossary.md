# Glossary

All terms and acronyms used throughout this documentation, with links to the pages covering them.

* **Bond**: aggregation of several physical NICs into one logical interface, for redundancy and bandwidth. See [bonds](../networking/networking.md#bonds).
* **Coalesce**: background process merging a disk chain after snapshot deletion, reclaiming space. See [coalesce](../storage/storage.md#coalesce).
* **DMC** (Dynamic Memory Control): lets a VM's memory vary between a min and a max while it runs. See [dynamic memory](../vms/vms.md#dynamic-memory).
* **dom0** ("Domain 0", or "control domain"): the privileged Linux system started by Xen at boot. It has direct access to hardware, runs the toolstack and the storage/network backends for all VMs. See [architecture](../project/architecture.md).
* **domU**: any unprivileged Xen domain, i.e. a regular VM (by opposition to dom0).
* **DRBD**: replicated block device technology used by XOSTOR/LINSTOR. See [XOSTOR](../xostor/xostor.md).
* **Guest tools**: PV drivers plus a management agent installed inside the guest OS, required for good performance and features like clean shutdown or IP reporting. See [guest tools](../vms/vms.md#guest-tools).
* **HA** (High Availability): pool feature restarting protected VMs automatically when a host fails. See [high availability](../management/ha.md).
* **HVM** (Hardware Virtual Machine): VM mode using CPU virtualization extensions; the standard mode for all guests on XCP-ng (usually with PV drivers on top, aka "PVHVM").
* **IQN** (iSCSI Qualified Name): the identifier of an iSCSI initiator or target, e.g. `iqn.2024-01.com.example:storage1`.
* **LINSTOR**: the software-defined storage orchestrator behind XOSTOR. See [XOSTOR](../xostor/xostor.md).
* **LUN** (Logical Unit Number): a block device exported by a SAN over iSCSI, Fibre Channel or SAS.
* **MTU** (Maximum Transmission Unit): the largest packet size on a network; 1500 by default, up to 9000+ for jumbo frames. See [MTUs](../networking/networking.md#mtus).
* **NBD** (Network Block Device): protocol exposing a disk over the network; used by Xen Orchestra for faster backups (see [NBD backup network](../networking/networking.md#nbd-backup-network)).
* **OVA / OVF** (Open Virtualization Archive/Format): vendor-neutral VM interchange format, used to exchange VMs with non-XCP-ng platforms. See [import and export](../vms/import-export.md).
* **OVS** (Open vSwitch): the virtual switch used by XCP-ng to connect VIFs, PIFs, VLANs and tunnels. See [network architecture](../project/architecture.md#network).
* **PBD** (Physical Block Device): the XAPI object connecting one host to one SR. See [SR management](../storage/manage-srs.md).
* **PIF** (Physical InterFace): the XAPI object representing a host network interface (a NIC, a bond or a VLAN on them).
* **Pool** (resource pool): a group of hosts managed as one entity, sharing configuration and (usually) storage. See [hosts and pools](../management/hosts-pools.md).
* **Pool coordinator** (formerly "pool master"): the pool member exposing the XAPI endpoint for the whole pool and holding the reference database.
* **PV** (ParaVirtualization): historical VM mode without hardware virtualization extensions; removed on modern XCP-ng. "PV drivers" survived: they're the efficient drivers guests use to talk to dom0.
* **QCOW2**: virtual disk format available from XCP-ng 8.3, enabling disks larger than 2 TiB. See the [QCOW2 FAQ](../storage/qcow2_faq.md).
* **RPU** (Rolling Pool Update): updating a whole pool without VM downtime, orchestrated by Xen Orchestra. See [updates](../management/updates.md).
* **RRD** (Round-Robin Database): fixed-size database in which hosts record their performance metrics. See [monitoring](../management/monitoring.md).
* **SMAPI**: the Storage Manager API, the layer of drivers implementing each [SR type](../storage/storage.md).
* **Snapshot**: point-in-time capture of a VM's disks (optionally with its RAM). See [snapshots](../vms/snapshots.md).
* **SR** (Storage Repository): a storage target holding virtual disks (or ISOs). See [storage](../storage/storage.md).
* **Template**: blueprint used to create VMs, with or without disk content. See [templates](../vms/templates.md).
* **vApp** (VM appliance): a group of VMs started and recovered together, with a defined boot order.
* **VBD** (Virtual Block Device): the XAPI object connecting a VDI to a VM.
* **VDI** (Virtual Disk Image): one virtual disk, stored in an SR.
* **VHD**: the historical copy-on-write virtual disk format of XCP-ng (2 TiB limit per disk).
* **VIF** (Virtual InterFace): a VM's virtual network card, connected to a network.
* **VLAN**: layer-2 network segmentation (802.1Q tags); XCP-ng networks can sit on any VLAN. See [VLANs](../networking/networking.md#vlans).
* **VM** (Virtual Machine): you probably know this one.
* **vTPM**: virtual TPM 2.0 device, available from XCP-ng 8.3 (needed for Windows 11). See [advanced VM settings](../vms/advanced.md#vtpm).
* **XAPI**: the toolstack (API and daemon) managing XCP-ng hosts and pools. See [XCP-ng API](../management/manage-locally/api.md).
* **XCP** (Xen Cloud Platform): the historical open source distribution of XenServer, ancestor of XCP-ng ("XCP new generation").
* **`xe`**: the command-line client for XAPI, available on every host. See the [xe CLI page](../management/manage-locally/cli.md) and the [full command reference](cli_reference.md).
* **Xen**: the type-1 hypervisor XCP-ng is built on.
* **XO / XOA** (Xen Orchestra / XO Appliance): the web-based management, backup and orchestration platform for XCP-ng; XOA is its turnkey virtual appliance form. See [manage at scale](../management/manage-at-scale/xo-web-ui.md).
* **XOSTOR**: XCP-ng's hyperconverged storage (replicated storage built from the hosts' local disks). See [XOSTOR](../xostor/xostor.md).
* **xsconsole**: the text-mode configuration console displayed on a host's physical/serial screen.
* **XVA**: the native file format for exported VMs and templates. See [import and export](../vms/import-export.md).
