# Roadmap

Our global roadmap.

The goal of this document is to give you a hint of what's next. However, since all topics are very complex, there's no real order or target date. In general, our priorities are:

* security
* simplicity and flexibility
* performance and scalability

<div style={{textAlign: 'center'}}>
![](../../assets/img/roadmap.jpg)
</div>

If you have any suggestion, feel free to ask on our [community forum](https://xcp-ng.org/forum/category/1/feedback-and-requests).

## In tech preview

_Technology that is here, but not officially released for production usage._

* [IPv6 support in dom0](https://xcp-ng.org/blog/2021/02/09/ipv6-in-xcp-ng/) (Network)
* [New Xen guest agents](https://gitlab.com/xen-project/xen-guest-agent) (Guest agent)
* [LINSTOR integration](https://xcp-ng.org/blog/2020/11/13/xcp-ng-and-linbit-alliance-part-ii/) (Storage)
* [RunX](https://xcp-ng.org/blog/2021/10/19/runx-is-available-in-tech-preview/) (Xen)

## In progress

_Things we started to work on, but are not usable/visible yet._

* Q35 emulation support (Xen)
* New metrics (Xen/platform)
* Linux 6.x kernel Dom0 support (platform)
* Xen RISC-V port (Xen)
* [AMD SEV-SNP support](https://github.com/xcp-ng/hyper-sev-project) (Xen)
* New signed Windows PV drivers (guest drivers)
* Host secure boot (Xen/platform)
* SMAPIv3 evolution (storage)
* Improved automated CI (build)
* SPDK-based `blkif` backend (platform)
* [DPU Support](https://xcp-ng.org/blog/2021/07/12/dpus-and-the-future-of-virtualization/) (storage/platform)
* Intel `igc` driver support (dom0 drivers)
* LACP support during install (platform)
* Auto resume original VM when Xen live migration failed

## Spec/Design/PoC

_Features that are being discussed or designed, but not even partly coded._

* Soft RAID status/alerting (via XAPI plugin)
* [xenopsd-ng](https://github.com/xcp-ng/xenopsd-ng) (Xen)
* Virtio support (platform)

## Done

* Conversion tool (facilitate migration to XCP-ng, done in XO for VMware)
* Smartctl disk status (2023 for XCP-ng 8.3, already supported in XO)
* vTPM support (2023, thanks to XenServer team)
* Guest UEFI secure boot (2022)
* Core scheduling (2020)
* SDN OpenFlow (2020)
* Restore VMs with their memory (2020)
* Cross/multi pools private network in GRE/VxLAN (2020)
* Netdata dedicated RPM (2019)
* Citrix DVSC replacement by XO plugin (2019)
* Full SMAPIv1 SR stack ZFS support, done with ZoL 0.8.1 (2019)
* Netinstaller checking GPG (2019)
* Netdata in XCP-ng with [Xen metrics](https://github.com/netdata/netdata/pull/5660) (2019)
* `zstd` support for VM export/import (2019)
* `xfs` local SR support SMAPIv1 (2019)
* `ext4` local SR support SMAPIv1 (2019)
* Terraform support (2019)
* More recent (4.9) kernel usage in dom0 (2018)
* Signed Windows PV tools (2018)
* Cloudstack compatibility (2018)
* Upgrade detection and upgrade with updater plugin (2018)
* Extra package repo (2018)

## Backlog

_This is a kind of wish list, without any priorities, where we try to put some ideas._

<div style={{textAlign: 'center'}}>
![](../../assets/img/backlogfuturistic.jpg)
</div>
### Compute

* Xen live patching
* VM storage migration improvement [#145](https://github.com/xcp-ng/xcp/issues/145)
* More recent Xen in alternate repo
* Faster Xen Motion (compression in `xenops`?)

### Storage

* SMAPIv3 qcow2 export/import
* SMAPIv3 new drivers
* VDI export with compression (including `zstd`)
* SMAPIv3 Ceph support
* Coalesce process improvement (raw speed, rewrite, multicore?) [#127](https://github.com/xcp-ng/xcp/issues/127)
* Faster Xen Storage Motion (using on the fly compression for disk content? remove stunnel?)
* SMAPIv3 full ZFS driver (using pyzfs with it)
* NVMe driver for near bare metal perfs (specification in progress)
* General storage perf improvement
* Thin pro on block based SR (architectural review needed)

### Network

* DPDK support

### API

* XAPI HTTP lib 1.1 replacement (removing stunnel)
* JSON-RPC compression support

### Platform/Installer

* Installer using `ext4` for dom0
* Installer allow join pool directly during install
* Expose repo URL/modification from XAPI (possibility to use XOA with `apt-cacher-ng`)
* Improved provisioning support (Ansible…)
* Automated tests
* new RPM tracking in CentOS (Anitya)
