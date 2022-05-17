# Installation

This guide will help you to set up XCP-ng.

## ISO installation

If you want to use the netinstall ISO, see the [Netinstall section](install.md#netinstall).

### Download and create media

You can download the latest 8.2 ISO here: <https://mirrors.xcp-ng.org/isos/8.2/xcp-ng-8.2.1.iso?https=1>.

SHA256 checksums, GPG signatures and net-install ISO are available [here](https://xcp-ng.org/#easy-to-install).


Then, create the install media (e.g. a USB key 1GB or larger should work):

```
dd if=xcp-ng-8.2.1.iso of=/dev/sdX bs=8M oflag=direct
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

You can download it on this URL: <https://mirrors.xcp-ng.org/isos/8.2/xcp-ng-8.2.1-netinstall.iso?https=1>.

As with the regular installation ISO, write it on an USB media:

```
dd if=xcp-ng-8.2.1-netinstall.iso of=/dev/sdX bs=8M oflag=direct
```

Everything else is like the [regular install](install.md#start-the-host), except that it will not offer to install from local media, only from distant ones.

## PXE boot install

### Requirements

To get XCP-ng installed from PXE, you need:

* DHCP and TFTP configured servers
* Any NFS, FTP or HTTP server (your choice) to host XCP-ng installation files
* A PXE-boot compatible network card on your host

:::tip
PXE boot doesn't support tagged VLAN networks! Be sure to boot on a untagged network!
:::

### TFTP server configuration

1. In your TFTP root directory (eg `/tftp`), create a folder named `xcp-ng`.
2. Copy the `mboot.c32` and `pxelinux.0` files from the installation media to the TFTP root directory.
3. From the XCP-ng installation media, copy the files `install.img` (from the root directory), `vmlinuz`, and `xen.gz` (from the /boot directory) to the new `xcp-ng` directory on the TFTP server.
4. In the TFTP root directory, create a folder called `pxelinux.cfg`
5. In the pxelinux.cfg directory, create your configuration file called `default`.

The file itself will contain the way to install XCP-ng: manually (with answer to provide on the host console/screen) or fully automated (see [Automated install](install.md#automatedinstall) below).

Here is an example of a manual installation:

```
default xcp-ng
label xcp-ng
    kernel mboot.c32
    append xcp-ng/xen.gz dom0_max_vcpus=2 dom0_mem=2048M,max:2048M com1=115200,8n1 console=com1,vga --- xcp-ng/vmlinuz xencons=hvc console=hvc0 console=tty0 --- xcp-ng/install.img
```

### UEFI boot

If you want to make an installation in UEFI mode, you need to have a slightly different TFTP server configuration:

1. In your TFTP root folder, create a directory called `EFI/xcp-ng`
2. Configure your DHCP serveur to provide `/EFI/xcp-ng/grubx64.efi` as the boot file
3. Create a `grub.cfg` as follow:
```
 menuentry "XCP-ng Install (serial)" {
    multiboot2 /EFI/xcp-ng/xen.gz dom0_mem=2048M,max:2048M watchdog \
    dom0_max_vcpus=4 com1=115200,8n1 console=com1,vga
    module2 /EFI/xcp-ng/vmlinuz console=hvc0 install
    module2 /EFI/xcp-ng/install.img
 }
```
4. Copy this `grub.cfg` file to `EFI/xenserver` folder on the TFTP server
5. Get the following files from XCP-ng ISO: `grubx64.efi`, `install.img` (from the root directory), `vmlinuz`, and `xen.gz` (from the /boot directory) to the new EFI/xcp-ng directory on the TFTP server.

How TFTP folder looks like when configured
```
tree -L 1 /srv/tftp/
srv/tftp
└── EFI
    ├── xcp-ng
    │   ├── grubx64.efi
    │   ├── install.img
    │   ├── vmlinuz
    │   └── xen.gz
    └── xenserver
        └── grub.cfg
```

On the FTP, NFS or HTTP serveur, get all the installation media content in there.

For layout example check the [official repository](https://mirrors.xcp-ng.org/netinstall/latest).

:::tip
When you do copy the installation files, **DO NOT FORGET** the `.treeinfo` file. Double check your webserver isn't blocking it (like Microsoft IIS does).
:::

#### On the host

1. Start your host
2. Enter the boot menu (usually F12)
3. Select boot from the Ethernet card
4. You should see the PXE menu you created before!

## iPXE over HTTP install

This guide is for UEFI boot, using iPXE over an HTTP server to serve files needed for installation.

### Requirements

To get XCP-ng installed from iPXE over HTTP, you need:

* An HTTP server to host XCP-ng installation files
* A iPXE compatible network card and iPXE firmware on your host

1. In your HTTP root directory copy the contents of the net install ISO.

The top-level should look like this:

```
tree -L 1 /path/to/http-directory/
.
├── EFI
├── EULA
├── LICENSES
├── RPM-GPG-KEY-CH-8
├── RPM-GPG-KEY-CH-8-LCM
├── RPM-GPG-KEY-Platform-V1
├── boot
└── install.img
```

2. Boot the target machine.
3. Press Ctrl-B to catch the iPXE menu.  Use the chainload command to load grub.

```
chain http://SERVER_IP/EFI/xenserver/grubx64.efi
```

:::tip
Sometimes grub takes a very long time to load after displaying "Welcome to Grub".  This can be fixed by compiling a new version of Grub with `grub-mkstandalone`.
:::

4. Once the grub prompt loads, set the root to http and load the config file.

```
# Replace with your server's ip
set root=(http,SERVER_IP)
configfile /EFI/xenserver/grub.cfg
```

5. Select the "install" menu entry.
6. Wait for grub to load the necessary binaries.  This may take a minute.  If you look at your http server log you should see something like:

```
# (from python3 -m http.server path-to-directory 80)

192.168.0.10 - - [11/Mar/2021 03:25:58] "GET /boot/xen.gz HTTP/1.1" 200 -
192.168.0.10 - - [11/Mar/2021 03:25:58] "GET /boot/vmlinuz HTTP/1.1" 200 -
192.168.0.10 - - [11/Mar/2021 03:26:03] "GET /install.img HTTP/1.1" 200 -
```
7. Continue with installation as normal.


## Automated install

### Via PXE

Follow the previous section on Network boot (PXE) and get a configuration file that will fetch an answer file:

```
default xcp-ng-auto
label xcp-ng-auto
    kernel mboot.c32
    append xcp-ng/xen.gz dom0_max_vcpus=2 dom0_mem=2048M,max:2048M com1=115200,8n1 console=com1,vga --- xcp-ng/vmlinuz xencons=hvc console=hvc0 console=tty0 answerfile=http://pxehost.example.com/answerfile install --- xcp-ng/install.img
```

:::tip
Any SYSLINUX configuration style file will be valid. [Find more on the syslinux website](https://wiki.syslinux.org/wiki/index.php?title=PXELINUX).
:::

### With UEFI

To have an automated install with UEFI, you need the following Grub configuration:

```
menuentry "XCP-ng Install (serial)" {
    multiboot2 /EFI/xcp-ng/xen.gz dom0_mem=2048M,max:2048M watchdog \
    dom0_max_vcpus=4 com1=115200,8n1 console=com1,vga
    module2 /EFI/xcp-ng/vmlinuz console=hvc0 console=tty0 answerfile_device=eth0 answerfile=http://pxehost.example.com/answerfile install
    module2 /EFI/xcp-ng/install.img
 }
```

Your XML answer file can look like this:

```xml
<?xml version="1.0"?>
    <installation srtype="ext">
        <primary-disk>sda</primary-disk>
        <guest-disk>sdb</guest-disk>
        <guest-disk>sdc</guest-disk>
        <keymap>us</keymap>
        <root-password>mypassword</root-password>
        <source type="url">http://pxehost.example.com/xcp-ng/</source>
        <post-install-script type="url">
            http://pxehost.example.com/myscripts/post-install-script
        </post-install-script>
        <admin-interface name="eth0" proto="dhcp" />
        <timezone>Europe/Paris</timezone>
    </installation>
```

:::tip
The full answerfile schema [is available in our Annex](answerfile.md).
:::

### with unattended ISO and remote config

1. [Prepare an answerfile](https://xcp-ng.org/docs/answerfile.html)
2. [Extract the XCP-NG ISO file](https://xcp-ng.org/docs/develprocess.html#extract-an-existing-iso-image)
3. Modify grub to use answerfile
For BIOS boot - /boot/isolinux/isolinux.cfg
For UEFI boot - /EFI/xenserver/grub.cfg

Add the following code to the line that has `module2 /boot/vmlinuz` and before `install` argument.

```answerfile=http://local_server/path/to/answerfile.xml
```

4. [Build a new ISO with your changes](https://xcp-ng.org/docs/develprocess.html#build-a-new-iso-image-with-your-changes)

ISO is ready for installation.

### with unattended ISO and embedded config 

1. [Prepare an answerfile](https://xcp-ng.org/docs/answerfile.html)
2. [Extract the XCP-NG ISO file](https://xcp-ng.org/docs/develprocess.html#extract-an-existing-iso-image)
3. Modify grub to use answerfile
For BIOS boot - /boot/isolinux/isolinux.cfg
For UEFI boot - /EFI/xenserver/grub.cfg

Add the following code to the line that has `module2 /boot/vmlinuz` and before `install` argument.

```answerfile=file:///answerfile.xml
```

4. [Extract install.img to install directory](https://xcp-ng.org/docs/develprocess.html#extract-install-img)
5. Add the answerfile 

```cp answerfile "$WORK_DIR/install/answerfile.xml"
```

6. Pack the image and remove extracted directory

```cd $WORK_DIR/install
find . |  cpio -o -H newc | bzip2 > ../install.img
cd ..
rm $WORK_DIR/install -rf
```

7. [Build a new ISO with your changes](https://xcp-ng.org/docs/develprocess.html#build-a-new-iso-image-with-your-changes)



#### Example with VirtualBox

To test the PXE in a VirtualBox environment you'll need to populate the [PXE special folder](https://www.virtualbox.org/manual/ch06.html#nat-tftp). Most of the content comes from the ISO image:

```
/Users/me/Library/Virtualbox/TFTP
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
default xcp-ng
label xcp-ng
kernel mboot.c32
append xcp-ng/xen.gz dom0_max_vcpus=1-2 dom0_mem=max:2048M com1=115200,8n1 console=com1,vga --- xcp-ng/vmlinuz xencons=hvc console=hvc0 console=tty0 answerfile=https://gist.githubusercontent.com/nraynaud/4cca5205c805394a34fc4170b3903113/raw/ install --- xcp-ng/install.img
```

The rest is the same as the normal PXE configuration.

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

