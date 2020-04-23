# Installation

This guide will help you to set up XCP-ng.

## ISO installation

### Download and create media

You can download the ISO here: https://updates.xcp-ng.org/isos/8.1

Then, create the install media (eg USB key):

```
dd if=xcp-ng-8.1.0-2.iso of=/dev/sdX bs=8M oflag=direct
```

Finally, boot on that media and go to the next section.

:::tip
On Windows, you can use Rufus to create the bootable USB stick.
:::

### Start the host

Start the host and boot on the USB media.

### Follow instructions

:::tip
This section is still a work in progress. Thanks for your patience!
:::

## Automated install

### PXE

This is just an example with VirtualBox.

To test the PXE in a VirtualBox environment you'll need to populate the [PXE special folder](https://www.virtualbox.org/manual/ch06.html#nat-tftp). Most of the content comes from the iso image.
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
append xcp-ng/xen.gz dom0_max_vcpus=1-2 dom0_mem=1024M,max:1024M com1=115200,8n1 console=com1,vga --- xcp-ng/vmlinuz xencons=hvc console=hvc0 console=tty0 answerfile=https://gist.githubusercontent.com/nraynaud/4cca5205c805394a34fc4170b3903113/raw/ install --- xcp-ng/install.img 
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
The installation files can come form the iso disk, but don't forget to alter the boot order such that the network is first.

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

As an improvement and to delay the md resync (increasing install speed by about 500% on certain drives), we can use the following in the answer file

```
<script stage="installation-start" type="url">http://your-server/noresync.sh</script>
```

The no_resync script would do something like this

```
#!/bin/sh
echo 0 > /proc/sys/dev/raid/speed_limit_max
echo 0 > /proc/sys/dev/raid/speed_limit_min
```

Upon server reboot, normal md resync will take place.