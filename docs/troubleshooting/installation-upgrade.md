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

You can also use the `network_config` parameter (which defaults to `dhcp`) to define an alternative network setup. Here are some template examples; replace the capitalized values with your own settings, square brackets ([]) indicate optional parameters:

```
network_config=dhcp[:vlan=VLAN]
network_config=static:ip=IP;netmask=NETMASK[;gateway=GW][;dns=DNS1[,DNS2]][;domain=DOMAIN][;vlan=VLAN]
```

:::note
you can specify an interface name such as `eth1` instead of `all` if necessary, which can be useful when you need to setup a static IP address.
:::

The ssh server will be available once the network is up.  If you are unsure which DHCP address was obtained, you can use the shell console as described above to look it up using `ip a`.  You can then connect as `root` using the password you provided on the commandline.


## Installation logs

On the installed system, installer logs are kept in `/var/log/installer/`.

The main log file is `/var/log/installer/install-log`.

## Debugging the installer

You can [build your own installer](../../project/development-process/ISO-modification).
