# Installation

This guide will help you to set up XCP-ng.

## ISO installation

If you want to use the netinstall ISO, see the [Netinstall section](install.md#netinstall).

### Download and create media

You can download the 8.2 ISO here: <http://mirrors.xcp-ng.org/isos/8.2/xcp-ng-8.2.0.iso>.

SHA256 checksums, GPG signatures and net-install ISO are available [here](https://xcp-ng.org/#easy-to-install).


Then, create the install media (e.g. USB key):

```
dd if=xcp-ng-8.2.0.iso of=/dev/sdX bs=8M oflag=direct
```

Finally, boot on that media and go to the next section.

:::tip
On Windows, you can use Rufus to create the bootable USB stick.
:::

### Start the host

Start the host and boot on the USB media.

### Follow instructions

#### 1. UEFI vs BIOS

Boot screens are just slightly different on start between BIOS and UEFI mode:

BIOS splash screen:

![](https://xcp-ng.org/assets/img/screenshots/install1bis.png)

UEFI splash screen:

![](https://xcp-ng.org/assets/img/screenshots/install1.png)

:::warning
NEVER switch from UEFI to BIOS (or vice-versa) **after** you installed XCP-ng. Stick to the mode that you chose during the install.
:::

#### 2. Language selection

![](https://xcp-ng.org/assets/img/screenshots/install2.png)

#### 3. Welcome

![](https://xcp-ng.org/assets/img/screenshots/install3.png)

#### 4. EULA/license

![](https://xcp-ng.org/assets/img/screenshots/install4.png)

#### 5. Disk selection

This is the screen where you'll select where XCP-ng system will be installed. **XCP-ng is a specialized Linux distribution**, so you need to dedicate a physical disk to it. Partitioning is done automatically.

![](https://xcp-ng.org/assets/img/screenshots/install5.png)

Alternatively, if you have two identical disks, you can use Software RAID (`mdadm`) :

![](https://xcp-ng.org/assets/img/screenshots/install6.png)

:::tip
If only one disk is found suitable for the installation, this step is skipped. The name of the device will be displayed to you [in the "Confirm Installation" step, later in the process](#_12-installation).
:::

#### 6. VM storage selection

This is the place where your VM disks will be stored. It's called a **Storage Repository** (SR). It can use the same disk you installed the system on. It will automatically use the free space after system partitions.

![](https://xcp-ng.org/assets/img/screenshots/install7.png)


:::tip
EXT instead of LVM? We advise to use EXT to benefit from thin provisioning!
:::

:::warning
When the installer skips [step 5](#_5-disk-selection) automatically, users sometimes mistake this step with the selection of the system disk.
:::

#### 7. Installation source

If you use the default ISO, just select "Local media":

![](https://xcp-ng.org/assets/img/screenshots/install9.png)

Then, you can verify your media or not:

![](https://xcp-ng.org/assets/img/screenshots/install10.png)

#### 8. Host password

This will be the **root** password, used to connect to the host with SSH and XAPI.

![](https://xcp-ng.org/assets/img/screenshots/install11.png)

#### 9. Networking

Here you can select between DHCP and static network, even using a VLAN:

![](https://xcp-ng.org/assets/img/screenshots/install12.png)

#### 10. Hostname and DNS

Configure the hostname of your server and the DNS resolvers.

![](https://xcp-ng.org/assets/img/screenshots/install13.png)

#### 11. Timezone and time

:::warning
ALWAYS use a NTP server. It's a critical component to manage your host(s). If you don't know any NTP server, you can use `pool.ntp.org`.
:::

![](https://xcp-ng.org/assets/img/screenshots/install14.png)

![](https://xcp-ng.org/assets/img/screenshots/install15.png)

![](https://xcp-ng.org/assets/img/screenshots/install16.png)

#### 12. Installation

:::warning
After this step, data will be written on the disk(s)! Check the listed device(s) one last time.
:::

![](https://xcp-ng.org/assets/img/screenshots/install17.png)

![](https://xcp-ng.org/assets/img/screenshots/install19.png)

#### 13. Supplemental packs and end of install

Not relevant in almost all cases. Skip it:

![](https://xcp-ng.org/assets/img/screenshots/install20.png)

![](https://xcp-ng.org/assets/img/screenshots/install21.png)

:::tip
"Completing installation" is in fact installing the bootloader and building the initramfs. It can take time.
:::

![](https://xcp-ng.org/assets/img/screenshots/install22.png)

#### 14. Reboot

After a reboot, you should see the GRUB menu:

![](https://xcp-ng.org/assets/img/screenshots/install23.png)

It means the system is correctly installed! Enjoy XCP-ng 🚀

## Netinstall

The netinstall image is a lightweight ISO (around 150MiB) that will only contain the installer, but no actual RPM packages. Sometimes, it's more convenient/faster when your ISO is on a slow connection (e.g. a virtual media using a server IPMI).

You can download it on this URL: <http://mirrors.xcp-ng.org/isos/8.2/xcp-ng-8.2.0-netinstall.iso>.

As with the regular installation ISO, write it on an USB media:

```
dd if=xcp-ng-8.2.0-netinstall.iso of=/dev/sdX bs=8M oflag=direct
```

Everything else is like the [regular install](install.md#start-the-host), except that it will not offer to install from local media, only from distant ones.

## Automated install

### PXE

This is just an example with VirtualBox.

To test the PXE in a VirtualBox environment you'll need to populate the [PXE special folder](https://www.virtualbox.org/manual/ch06.html#nat-tftp). Most of the content comes from the ISO image.
```
/Users/nraynaud/Library/Virtualbox/TFTP
├── mboot.c32              <- from /boot/pxelinux
├── menu.c32               <- from /boot/pxelinux
├── pxelinux.cfg           <- mandatory name
│   └── default            <- config file
├── test.pxe               <- this is pxelinux.0 (from /boot/pxelinux) renamed to vmname.pxe
└── xcp-ng                 <- most of it comes from /boot
    ├── efiboot.img
    ├── gcdx64.efi
    ├── grubx64.efi
    ├── install.img        <- this is /install.img from the .iso
    ├── isolinux
    │   ├── boot.cat
    │   ├── isolinux.bin
    │   ├── isolinux.cfg
    │   ├── mboot.c32
    │   ├── memtest
    │   ├── menu.c32
    │   ├── pg_help
    │   ├── pg_main
    │   └── splash.lss
    ├── vmlinuz
    └── xen.gz
```

The configuration file pxelinux.cfg/default is as follow:
```
default xenserver
label xenserver
kernel mboot.c32
append xcp-ng/xen.gz dom0_max_vcpus=1-2 dom0_mem=max:2048M com1=115200,8n1 console=com1,vga --- xcp-ng/vmlinuz xencons=hvc console=hvc0 console=tty0 answerfile=https://gist.githubusercontent.com/nraynaud/4cca5205c805394a34fc4170b3903113/raw/ install --- xcp-ng/install.img
```

Here is the beginning of an answer file:
```
<?xml version="1.0"?>
<installation>
    <keymap>fr</keymap>
    <primary-disk>sda</primary-disk>
    <guest-disk>sda</guest-disk>
    <root-password>tototo2</root-password>
    <source type="local"></source>
    <admin-interface name="eth0" proto="dhcp" />
    <timezone>America/Phoenix</timezone>
</installation>
```
There is some more [documentation](https://docs.citrix.com/en-us/citrix-hypervisor/install/network-boot.html#create-an-answer-file-for-unattended-pxe-and-uefi-installation) on Citrix's website.
The answer file, sadly, can't be transmitted by TFTP (its protocol can only be ftp, http, https or file), so I used gist.
The installation files can come from the ISO disk, but don't forget to alter the boot order such that the network is first.

#### Software RAID

For an automated install using an answer file (PXE or similar required), software raid can be enabled as follows:

```
<?xml version="1.0"?>
<installation mode="fresh" srtype="lvm">
    <raid device="md127">
        <disk>sda</disk>
        <disk>sdb</disk>
    </raid>
    <primary-disk>md127</primary-disk>
    <keymap>us</keymap>
    <source type="url">https://xcp-ng.org/install/</source>
    <admin-interface name="eth0" proto="dhcp" />
    <timezone>Europe/London</timezone>
    <root-password>secret</root-password>
</installation>
```

As an improvement and to delay the `md` resync (increasing install speed by about 500% on certain drives), we can use the following in the answer file:

```
<script stage="installation-start" type="url">http://your-server/noresync.sh</script>
```

The `noresync.sh` script would do something like this:

```
#!/bin/sh
echo 0 > /proc/sys/dev/raid/speed_limit_max
echo 0 > /proc/sys/dev/raid/speed_limit_min
```

Upon server reboot, normal `md` resync will take place.

## Troubleshooting

See [the Troubleshooting page](troubleshooting.md#installation-and-upgrade).

## Misc

#### Install on a USB stick

::: danger
We **strongly** advise against installing on USB stick. XCP-ng writes a lot into local files and this writing will wear out your USB-Stick in a short amount of time:
* XAPI: the XenServer API database is changing a lot. Hence writing a lot, and believe me, USB sticks aren't really happy with that on the long run. Note: XAPI DB is what keep tracks on all XCP-ng's "state", and it's replicated on each host (from the slave).
* Logs: XCP-ng keeps a LOT of debug logs. However, there is a workaround: use a remote syslog.
:::

