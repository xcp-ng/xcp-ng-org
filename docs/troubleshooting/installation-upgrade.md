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

### Getting remote access to host during installation

While the console access method described above may be sufficient for simple issues, collecting full logs (install logs, kernel logs, etc.) often requires copying large amounts of data, which is impractical without direct file access.

To enable SSH/SCP access during installation, you can use the Linux kernel command line to:

- Activate the network
- Enable the sshd service with a root password of your choice

For the most common case (setting up the network via DHCP), add the following parameters to the Linux boot section:

```
network_device=all sshpassword=YOURCHOICE
```

You can also use the `network_config` parameter (which defaults to `dhcp`) to define an alternative network setup. Below are some template examples — just replace the capitalized values with your actual settings. Optional parameters are marked with square brackets (`[]`).

```
network_config=dhcp[:vlan=VLAN]
network_config=static:ip=IP;netmask=NETMASK[;gateway=GW][;dns=DNS1[,DNS2]][;domain=DOMAIN][;vlan=VLAN]
```

:::note
You can specify an interface name such as `eth1` instead of `all` if necessary, which can be useful when you need to setup a static IP address.
:::

The ssh server will be available once the network is up. If you are unsure which DHCP address was obtained, you can use the shell console as described above to look it up using `ip a`. You can then connect as `root` using the password you provided on the commandline.

## The ISO installer does not offer to upgrade the existing install (XCP-ng or XenServer)

:::note
This section details how to deal with the most frequent causes for the installer not detecting your current installation. There can be other, rarer cases which are not detailed here.  In all cases the detailed reason for an inability to upgrade will always be possible to find in the installer log file. See [During installation or upgrade](#during-installation-or-upgrade) to access the log file.
:::

### Previous installation detected but not upgradable

In some cases the installer will detect a current install (XCP-ng or XenServer), but report "Only product installations that cannot be upgraded have been detected". The most common causes are listed below.

#### UEFI/BIOS mismatch

For the installer to detect your current install, the ISO must be booted in the same firmware context.
The difference is how you pick the drive at boot. This applies to physical and virtual CD/DVD/USB drives.

If your existing installation is in legacy BIOS mode, boot the ISO in BIOS mode.

If your existing installation is in UEFI mode, boot the ISO in UEFI mode.

In your server boot menu, you might see something like this: 

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

##### How to check if a running install is using UEFI or legacy BIOS?

On the host, run `efibootmgr`.

- If you see `EFI variables are not supported on this system.` you're running on legacy BIOS.
- If you see some EFI boot entries, you’re running on UEFI.

#### First-boot service won't complete

During the first boot, several tasks finalize the installation. Each task logs a "done" stamp upon completion, and if any critical task fails, the system will block future upgrades.

This can happen if the host was never fully booted after installation or upgrade, or if a specific first-boot service failed to execute properly.

To diagnose, check the installation log. See [During installation or upgrade](#during-installation-or-upgrade) to access the log file.

In this case, you would see one or two log lines like the ones below. If the system never booted, both messages typically appear:

```
Cannot upgrade nvme0n1, expected file missing: var/lib/misc/ran-storage-init (installation never booted?)
Cannot upgrade nvme0n1, expected file missing: var/lib/misc/ran-network-init (installation never booted?)
```

If you only see the "storage-init" line, error line, check the logs of `storage-init.service` in `/var/log/daemon.log` on the host (after rebooting into the original XCP-ng version you’re upgrading from).

If upgrading from an older release, you may instead get logs showing:

```
Upgradeability test failed:
  Firstboot:     ...
  Missing state: ...
```

The "Missing state" line indicates which required first-boot service failed to complete.

### Previous installation not detected

In other cases, the installer may fail to detect an existing installation, and only offer to do a fresh install. Some causes are listed below.

#### Disk partitionning not recognized

XCP-ng is quite strict about the partition table layout, partition labels, partition types. If anything has modified it, it can prevent proper identification of the previous install.

Log lines like the one below (taken from an upgrade of a healthy 8.3 install) will give an idea whether something is wrong in this area.

```
Probe of /dev/nvme0n1 found boot=(True, '/dev/nvme0n1p4') root=(1, '/dev/nvme0n1p1') disk.state=(True, '/dev/nvme0n1p1') storage=(2, '/dev/nvme0n1p3') logs=(True, '/dev/nvme0n1p5')
```

#### Inconsistent inventory file

The `/etc/xensource-inventory` file is critical to the upgrade process. This is one of the cases where the log will exhibit "A problem occurred whilst scanning for existing installations:" followed by more details.

## Installation logs

On the installed system, installer logs are kept in `/var/log/installer/`.

The main log file is `/var/log/installer/install-log`.

## Debugging the installer

You can [build your own installer](../../project/development-process/ISO-modification).
