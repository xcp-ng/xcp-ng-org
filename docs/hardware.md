## Hardware Compatibility List (HCL)

Devices listed on [Citrix Hypervisor's Hardware Compatibility List](http://hcl.xenserver.org/) are supported.

For other hardware, see [Unlisted Hardware](#unlisted-hardware).

## Unlisted Hardware

Many devices outside the HCL in fact work very well with XCP-ng. Being outside the HCL means that there have been not tests to ensure that they work. Most of the hardware support depends on the Linux kernel and thus support for hardware outside the HCL depends on on how well the drivers are supported by the Linux kernel included in XCP-ng.

This section is a community-enriched list of pieces of hardware that do not belong to the HCL, along with information about how well they work (or not), workarounds, etc.

### Supermicro / AMD EPYC CPU

Reference: <https://xcp-ng.org/forum/topic/350/amd-epyc-compatible>

EPYC CPUs are working well on XCP-ng, but people with SuperMicro motherboard saw random reboot sometimes. Turning off the C-state control solved the issue:

In BIOS:
 - Advanced -> CPU Configuration -> Global C-state Control: Disabled
 - Advanced -> North Bridge -> Determinism Slider: Performance

### Network Cards


#### Emulex Corporation OneConnect NIC (Skyhawk) (rev 10) - 10Gbps NIC "OCe14102-NT"

**Current State:** Works, but sporadic card/port lockups - avoid in production!

- PCI-Vendor-ID: 10df (Emulex Corporation)
- PCI-Device-ID: 0720
- Downloads (long loading times, wait a bit!): <https://www.broadcom.com/support/download-search/?pg=Legacy+Products&pf=Legacy+Products&pn=OCe14102-NT+Ethernet+Network+Adapter&pa=All&po=&dk=>


Known to work (relatively stable) with latest Firmware 11.2.1153.23 on XCP-ng 7.5
* Bootable Upgrade ISO: <https://docs.broadcom.com/docs/12378839>
    * If you are coming from firmware below 10.0.803.37 -> "You must perform the firmware
update procedure twice to ensure that the flash regions are properly configured, and
you must reboot the system after each firmware update." (from Release Notes)
* Firmware Release Notes: <https://docs.broadcom.com/docs/12378898>
* Linux Driver Release Notes: <https://docs.broadcom.com/docs/1211170215974>

Known Issues (with old firmware; also on XenServer 7.2 with current firmware)

* Card Lockup
    * pulling the network cable puts the card in a locked state, LED's keeps flashing; putting the cable back does nothing; network connection stays lost
    * Solutions
        * Short Term: power off the host and pull power cords (the card needs to be completely powerless!, just switching the host OFF is not enough)
        * Mid Term: Upgrade Firmware to match XCP-ng Driver version (for XCP-ng 7.5 -> 11.2.XXXXX)
        * Long Term: Avoid Emulex cards!

#### Broadcom Netxtreme II BCM57711E

(or BCM5709 or ...)

On XCP-ng <= 8.0, using default `bnx2x` driver triggers a kernel Oops on XCP-ng (no ping and freezing the host):

![](https://i.imgur.com/0FB7qVp.png)

Fixed drivers have been released as official [updates](updates.md).


## Alternate drivers

XCP-ng occasionally provides alternate drivers for users who have issues with the main drivers installed with XCP-ng.

Those driver packages can be installed alongside the main packages and will take precedence gracefully.

Note: there is another way, albeit more experimental, to use alternate drivers: use our experimental alternate kernel (see dedicated section below).

In this section we provide instructions that are common to all the provided drivers.

Just replace `package-name` with the actual package name.

### Installation
```
yum install package-name
```

### Activation

The simplest way is to `reboot`.

Else, if you know the module name, you can unload it from the kernel and reload it.
```
modprobe -r module-name
modprobe -v module-name
```

### Uninstallation

If the driver does not work as intended, just remove the package from the system and follow the "Activation" steps above.
```
yum remove package-name
```

### Updates

The alternate drivers may get updated to newer versions when the system is updated or upgraded. If that causes regressions, please open a bug report.

### System Upgrades

Upgrades **using the installation ISO** will not retain the alternate driver package, so remember to re-install it after the upgrade if it's still needed (the main driver may have been updated too and make the alternate driver useless in your case).

Upgrades **using the `yum` method** will retain the alternate driver package, unless we stop providing it (usually, because the main driver will have been updated too). If the alternate driver is retained, it may have changed versions, so you may still need to consider going back to the main driver. If after an upgrade no driver works correctly for your system anymore, open a bug report.

### Network drivers list

A list is maintained at <https://github.com/xcp-ng/xcp/wiki/Drivers>

Check the "XCP-ng X.Y alternate driver" column, which provides packages names and versions for every available alternate driver.


## Additional kernel modules

Additional kernel modules are a lot like [alternate drivers](#alternate-drivers) (most of the above section applies to them) except that they don't replace an existing driver from the system. They add a new one that didn't exist at all.

Their list is maintained at <https://github.com/xcp-ng/xcp/wiki/Drivers>, in a table named "Other kernel modules available in XCP-ng X.Y".


## Alternate kernel

We provide an "alternate Linux kernel" on XCP-ng 8.0 and above, named `kernel-alt`. It is kernel 4.19, as the main kernel, but with all updates from the Linux 4.19 branch applied. By construction, it should thus be stable. However it **receives less testing** so we cannot fully guarantee against regressions (any detected regression we'd work on a fix quickly, of course). We also backport security fixes from the main kernel to the alternate kernel when needed.

This kernel is mainly targeted at:
* Testing whether kernel.org fixes situations where the main kernel and drivers have issues on specific hardware.
* Allowing a system to work temporarily when the main kernel has an issue regarding your specific hardware, until we can fix the main kernel. **For this to happen, you need to tell us if you are in a situation where the main kernel doesn't work whereas the alternate kernel does!**

Report issues [here](https://github.com/xcp-ng/xcp/issues).

### During system installation
* In BIOS mode, press F2 at early boot stage when offered the choice then type `install-alt`.
* In UEFI mode, select the boot option mentioning the alternate kernel from the grub menu.

This will boot the installer with the alternate kernel and also install the alternate kernel on the system in addition to the main one (but will not make the alternate kernel the default boot option for the installed system).

### Installation on an existing system
You can install it using

```
yum install kernel-alt
```

This will install the kernel and add a grub boot menu entry to boot from it. It will **not** default to it unless you change the default in `grub.cfg` (`/boot/grub/grub.cfg` or `/boot/efi/EFI/xenserver/grub.cfg` depending on whether you are in BIOS mode or UEFI mode).

There may also be a newer release of kernel-alt in testing repositories:

```
yum install kernel-alt --enablerepo=xcp-ng-testing
```

### Uninstall
Boot the main kernel, then:
```
yum remove kernel-alt
```

This will remove the added grub entry automatically too and set default boot to main kernel if needed.
