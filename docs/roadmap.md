This is a draft roadmap, things aren't sorted in any way, and there is no ETA for them.

## In progress

* Guest UEFI secure boot
* Host secure boot
* LinStor integration
* IPv6 support in dom0
* Xen RISC-V port
* LACP support during install

## Spec/Design/PoC

* xenopsd-ng
* Soft RAID status/alerting (via XAPI plugin)
* Virtio support

## Done

* Core scheduling (2020)
* SDN OpenFlow (2020)
* Restore VMs with their memory (2020)
* Cross/multi pools private network in GRE/VxLAN (2020)
* Netdata dedicated RPM (2019)
* Citrix DVSC replacement by XO plugin (2019)
* Full SMAPIv1 SR stack ZFS support, done with ZoL 0.8.1 (2019)
* Net installer checking GPG (2019)
* Netdata in XCP-ng with [Xen metrics](https://github.com/netdata/netdata/pull/5660) (2019)
* `zstd` support for VM export/import (2019)
* `xfs` local SR support SMAPIv1 (2019)
* `ext4` local SR support SMAPIv1 (2019)
* Terraform support (2019)
* More recent (4.9) kernel usage in dom0 (2018)
* Signed Windows PV tools (2018)
* CloudStack compatibility (2018)
* Upgrade detection and upgrade with updater plugin (2018)
* Extra package repo (2018)

## Backlog

### Compute

* Xen live patching
* Faster Xen Motion (compression in `xenops`?)
* VM migration improvement [#145](https://github.com/xcp-ng/xcp/issues/145)
* more recent Xen in alternate repo
* MxGPU integration out-of-the-box
* Q35 support

### Storage

* SMAPIv3 qcow2 export/import
* SMAPIv3 new drivers
* VDI export with compression (including `zstd`)
* SMAPIv3 Ceph support
* Coalesce process improvement (raw speed, rewrite, multicore?) [#127](https://github.com/xcp-ng/xcp/issues/127)
* Faster Xen Storage Motion (using on the fly compression for disk content? remove `stunnel`?)
* SMAPIv3 full ZFS driver (using `pyzfs` with it)
* NVMe driver for near bare metal performance (specification in progress)
* `smarctl` alerts (specification in progress)
* General storage performance improvement
* Thin pro on block based SR (architectural review needed)

### Network

* DPDK support

### API

* XAPI HTTP lib 1.1 replacement (removing `stunnel`)
* ISO upload in SR ISO
* JSON-RPC compression support

### Platform/Installer

* Conversion tool (facilitate migration to XCP-ng)
* Installer using `ext4` for dom0
* Installer allow join pool directly during install
* Expose repo URL/modification from XAPI (possibility to use XOA with `apt-cacher-ng`)
* Improved provisioning support (Ansible…)
* Automated tests
* new RPM tracking in CentOS (Anitya)
