# Hardware Compatibility List (HCL)

## General

It's at least the same same as Citrix Hypervisor at [http://hcl.xenserver.org/](http://hcl.xenserver.org/), with exceptions listed at the end of this page.

## Non Citrix HCL hardware

Hardware outside the HCL may or may not work, depending on how well the drivers are supported by the linux kernel included in XCP-ng. This section is a community-enriched list of pieces of hardware that do not belong to the HCL, along with information about how well they work (or not), workarounds, etc.

### Supermicro / AMD EPYC CPU

Reference: https://xcp-ng.org/forum/topic/350/amd-epyc-compatible

EPYC are working well on XCP-ng, but people with SuperMicro motherboard saw random reboot sometimes. Turning off the C-state control solved the issue:

In BIOS:
 - Advanced -> CPU Configuration -> Global C-state Control: Disabled
 - Advanced -> North Bridge -> Determinism Slider: Performance

### Network Cards


***

#### Emulex Corporation OneConnect NIC (Skyhawk) (rev 10) - 10Gbps NIC "OCe14102-NT"

**Current State:** Works, but sporadic card/port lockups - avoid in production!

- PCI-Vendor-ID: 10df (Emulex Corporation)
- PCI-Device-ID: 0720
- Downloads (long loading times, wait a bit!): https://www.broadcom.com/support/download-search/?pg=Legacy+Products&pf=Legacy+Products&pn=OCe14102-NT+Ethernet+Network+Adapter&pa=All&po=&dk=


Known to work (relatively stable) with latest Firmware 11.2.1153.23 on XCP-ng 7.5
* Bootable Upgrade ISO: https://docs.broadcom.com/docs/12378839
    * If you are coming from firmware below 10.0.803.37 -> "You must perform the firmware
update procedure twice to ensure that the flash regions are properly configured, and
you must reboot the system after each firmware update." (from Release Notes)
* Firmware Release Notes: https://docs.broadcom.com/docs/12378898
* Linux Driver Release Notes: https://docs.broadcom.com/docs/1211170215974

Known Issues (with old firmware; also on XenServer 7.2 with current firmware)

* Card Lockup
    * pulling the network cable puts the card in a locked state, LED's keeps flashing; putting the cable back does nothing; network connection stays lost
    * Solutions
        * Short Term: power off the host and pull power cords (the card needs to be completely powerless!, just switching the host OFF is not enough)
        * Mid Term: Upgrade Firmware to match XCP-ng Driver version (for XCP-ng 7.5 -> 11.2.XXXXX)
        * Long Term: Avoid Emulex cards!

***


#### Emulex Corporation OneConnect 10Gb NIC (be3) (rev 01)
also known as "HPE FlexFabric 10Gb 2-port 554FLB Adapter"

- PCI-Vendor-ID: 19a2 (Emulex Corporation)
- PCI-Device-ID: 0710

Known Issues

* ~Bond failing after upgrade to XCP-ng 7.5 (https://xcp-ng.org/forum/post/4001)~
    * issue seems to belong to FCoE-capable network cards in combination with bonding: https://github.com/xcp-ng/xcp/wiki/Link-Aggregation-or-Bonding-or-Etherchannel-or-Port-Aggregation-or-Teaming


***


#### Broadcom Netxtreme II BCM57711E (or BCM5709 or ...)

Using default `bnx2x` driver, triggering kernel Oops on XCP-ng (no ping and freezing the host):

![](https://i.imgur.com/0FB7qVp.png)

##### XCP-ng 7.x

Since this has been reported, XCP-ng 7.5, 7.6 and newer have had more recent versions of the driver, but it is not guaranteed that it fixed the issue.

##### XCP-ng 8.0

A kernel patch has been applied to the alternate kernel that fixes this.  To get the patch you will need to install the alternate kernel by following the instructions outlined [here](https://github.com/xcp-ng/xcp/wiki/Alternate-kernel).

## Exceptions to Citrix HCL

### Proprietary management tools
The following vendor tools are shipped by default with XenServer and are absent from XCP-ng for legal reasons. The drivers **are** included in XCP-ng, only the management tools are not.

* QLogic: `QConvergeConsoleCLI-Citrix` and `QCS-CLI` (the `QCScli` binary). They can be downloaded from http://driverdownloads.qlogic.com. The packages for Citrix XenServer work in XCP-ng.
* Emulex: `elxocmcore`, `elxocmcorelibs` and `elxocmlibhbaapi`. "elxocm" stands for "Emulex One Command Manager". Can be downloaded from https://www.broadcom.com/products/storage/fibre-channel-host-bus-adapters/onecommand-manager-centralized (choose the packages for XenServer).
