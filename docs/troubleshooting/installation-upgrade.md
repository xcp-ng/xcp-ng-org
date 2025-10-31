# Installation and upgrade

Upgrade here designates an upgrade using the installation ISO

## If the installer starts booting up then crashes or hangs

* First of all check the integrity of the ISO image you downloaded, using the provided checksum
* Try the other boot options
  * alternate kernel
  * safe mode
* Try to boot with the `iommu=0` xen parameter.

:::tip
**How to add or remove boot parameters from command line.**

* On UEFI mode, you can edit the grub entries with `e`. Xen parameters are on lines starting with `multiboot2 /boot/xen.gz` and kernel parameters on lines starting with `module2 /boot/vmlinuz`.
* On BIOS mode, you can enter a menu by typing `menu` and then modify the boot entries with the TAB key. Xen parameters are between `/boot/xen.gz` and the next `---`. Kernel parameters are between `/boot/vmlinuz` and the next `---`.
:::

If any of the above allows to work around your issue, please let us know ([github issues](https://github.com/xcp-ng/xcp/issues)). We can't fix issues we aren't aware of.

## During installation or upgrade

You can reach a shell with ALT+F2 (or ALT+RIGHT) and a logs console with ALT+F3 (or ALT+RIGHT twice).

Full installation log are populated in real time in `/tmp/install-log`. They can be read with `view /tmp/install-log`.

When asking for help about installation errors, providing this file increases your chances of getting precise answers.

The target installation partition is mounted in `/tmp/root`.

## The ISO installer does not offer to upgrade the existing install (XCP-ng or XenServer)

For the installer to detect your current install (XCP-ng or XenServer), the ISO must be booted in the same firmware context.\
The difference is how you pick the drive at boot. This applies to physical and virtual CD/DVD/USB drives.

If your existing installation is in legacy BIOS mode, boot the ISO is BIOS mode.

If your existing installation is in UEFI mode, boot the ISO is UEFI mode.

In your server boot menu, you might see something like this : 

```
Please select boot device:
---------------------------------
UEFI: Virtual CDROM Device   <<<<<< This one is in UEFI mode
Virtual CDROM Device         <<<<<< This one is the same device, in legacy BIOS mode
...
 other boot entries
...
---------------------------------
```

### How identify if a running install is using UEFI or legacy BIOS ?

On the host, run `efibootmgr`

- If ou see `EFI variables are not supported on this system.` you're running on Legacy BIOS
- If you see some EFI boot entries, you’re running on UEFI

## Installation logs

The installer writes in `/var/log/installer/`.

The main log file is `/var/log/installer/install-log`.

## Debugging the installer

You can [build your own installer](../../project/development-process/ISO-modification).