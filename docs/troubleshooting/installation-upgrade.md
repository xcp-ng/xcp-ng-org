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

## Installation logs

The installer writes in `/var/log/installer/`.

The main log file is `/var/log/installer/install-log`.

## Debugging the installer

You can [build your own installer](../../project/development-process/ISO-modification).