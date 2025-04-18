# Virtual Machines (VMs)

## 🏘️ All VMs

### Dynamic Memory

Using Dynamic Memory Control (DMC) can be a good way to reduce your memory consumption, but you have to be careful: during live migration of a VM, XCP-ng will automatically reduce the VM memory to it's minimal settings and this can cause VM crash if it's not ready to function with this smaller amount of RAM.

We recommand you check your VM settings to verify if dynamic memory has been enabled.
In Xen Orchestra, the *Advanced* tab of your VM will display the memory limits, in the "VM limits" section:

![](../../assets/img/screenshots/Dynamic_mem.png)

If dynamic min is equal to dynamic max - as displayed in the screenshot - then dynamic memory is disabled.
If dynamic min < dynamic max, then make sure your VM is able to fully function with as little RAM as defined in *dynamic min*.

### Secure Boot

How Secure Boot can be enabled in VMs is described in a [dedicated guide](../guides/guest-UEFI-Secure-Boot/).

### Use a VNC client

1. Connect to a XCP-ng server using SSH, then execute this command with the VM UUID to join:

```
xe vm-list params=dom-id,resident-on uuid=<VM_UUID>
```

For example:

```
xe vm-list params=dom-id,resident-on uuid=b2632c6a-8c0c-2fcc-4f1f-5b872733f58c
resident-on ( RO)    : 888254e8-da05-4f86-ad37-979b8d6bad04
         dom-id ( RO): 2
```

2. Then, check you are on the host where the VM is currently running using the host UUID:

```
xe pif-list management=true params=IP host-uuid=888254e8-da05-4f86-ad37-979b8d6bad04
IP ( RO)    : 172.16.210.15
```

If not, use this IP to create an SSH connection to the right host.

3. Ensure `socat` is installed and execute this command with the DOM ID got earlier and a free TCP port:

```
socat TCP-LISTEN:<TCP_PORT_TO_USE> UNIX-CONNECT:/var/run/xen/vnc-<DOM_ID>
```

What have we done? We exposed a UNIX domain socket (which allows us to connect to the VM using VNC) directly over TCP.

4. Fine, now open a new shell, and on your local machine create an SSH tunnel with a free TCP port:

```
ssh -L <LOCAL_PORT>:localhost:<REMOTE_PORT> root@<HOST_IP>
```

5. Finally, start the client, for example `vncviewer`:

```
vncviewer localhost:<LOCAL_PORT>
```

### Disk WWID

Certain applications, such as Oracle ASM, require a unique identifier for disk drives known as a WWID (World Wide Identifier). In a Linux environment, this can be achieved by utilizing the `ID_PART_ENTRY_UUID` or `ID_PART_ENTRY_NAME` variables. These identifiers can be set in the udev rules file located at `/etc/udev/rules.d/99-asm.rules`. For detailed instructions on configuring disk devices manually for Oracle ASM using WWID, refer to [this guide](https://alexzy.blogspot.com/2018/02/configuring-disk-devices-manually-for.html).


## 🪟 Windows VMs

### Manage screen resolution

#### Bios VM

For a Bios VM, screen resolution can be managed directly through the OS:
- Right click on the desktop
- Display settings
- Choose resolution

#### UEFI VM

For a UEFI VM, you will need to set up your resolution in the UEFI settings of the VM.
For that you first will need to enter the VM UEFI setup:
- At VM start, during Tiano firmware logo display, press ESC.
  
![](../../assets/img/screenshots/VM_Tiano.png)
- You will enter the UEFI firmware management interface. Navigating with keyboard arrows, select *Device Manager* and press Enter.
  
![](../../assets/img/screenshots/VM_Tiano_1.png)

- In  the next screen select *OVMF platform configuration*.
  
![](../../assets/img/screenshots/VM_Tiano_2.png)

- In the OVMF settings, select *Change Preferred* then the resolution you want.

![](../../assets/img/screenshots/VM_Tiano_3.png)
- Press F10 and save the changes.
- Restart your VM by sending a CTRL+ALT+DEL.
- After reboot your VM will display the selected resolution.

### Booting a live Linux ISO on a Windows VM

When a VM is created from a Windows template, it might not be possible to boot a Linux system on it. This can be useful when one wants to modify the disk partitioning using a gparted ISO image for example.

The issue is due to a parameter value which is specific to Windows VMs and prevents the loading of the `xen-platform-pci` driver under Linux.

First, get the UUID of the Windows VM (visible in Xen Orchestra, or in the output of `xe vm-list`) and make sure it is powered off.

Open an ssh session to the XCP-ng host of the concerned VM and enter the following command:
```bash
$ xe vm-param-set uuid=VM-UUID platform:device_id=0001
```
Where `VM-UUID` is the uuid of the Windows VM.

You should be able to boot the VM on any Linux ISO disk.

Once done with Linux, shut down the VM and restore the parameter to its original value with:
```bash
$ xe vm-param-set uuid=VM-UUID platform:device_id=0002
```

## 🐧Linux VMs
### Performance drop after live migration for RHEL 8-like VMs

On some RHEL 8-like systems, running kernels prior to v4.20, and using XFS as default root file system, performance issues have been observed after a live migration under heavy disk activity.

XFS seems to have better performances with recent kernels but for older ones we recommend to use another journaled file system like EXT4.

### Distorted display console on Ubuntu UEFI VMs

This only concerns `UEFI` VMs running `Ubuntu` distributions. Also note that a default `Ubuntu` installation works just fine.

The default Ubuntu installation includes a package named `linux-modules-extra` containing the only driver (`bochs`) suitable for the VGA cards emulated by Qemu for the Xen Orchestra console. Removing this package leads to a scrambled display in the console so please don't do so.

For more details, the problem comes from `Ubuntu` kernels that don't have the `efi-framebuffer` driver compiled in. This driver should be used if the `bochs` driver isn't present and it is just not selected in the `Ubuntu` kernel build config. To be more precise, `Ubuntu` kernels try to use a driver called `simple-framebuffer` for which there seems to be an incompatibility with the way the OVMF UEFI bios initializes the VGA card, causing the distorted display.

## 🛠️ Guest tools

XCP-ng needs guest tools to be installed in the VMs in order to communicate with the guest operating system. This brings better performance and is required for various features.

In short: *always install the guest tools to your VMs*.

The tools are made of two main components:
* kernel drivers for the OS
* a management agent

### Linux

Xen guest drivers have been built-in in the Linux kernel for many years. All currently supported Linux distributions include them.

So all we need is to install the management agent, which comes either as a systemd or as a sysvinit service, depending on the Linux distribution. The service is usually named `xe-linux-distribution`.

Those guest tools can be installed:
* from the target distribution's online repositories if available
* from the Guest Tools ISO image that can be attached to any VM in XCP-ng

#### Install from the distro's online repositories

Distros may provide guest tools for XCP-ng and Citrix Hypervisor in their own repositories. When they don't, or when the packages are outdated, we enjoin you to contact them to ask for new packages. Upstream sources are available at https://github.com/xenserver/xe-guest-utilities.

Distros often have policies that forbid enabling new services by default, so most of the time the steps are:
* enable the appropriate repository
* install the package from it
* enable the service

##### CentOS and Fedora
Enable the EPEL repository in the VM, then:
```
yum install xe-guest-utilities-latest
```
The service is not enabled by default, so enable it and start it:
```
systemctl enable xe-linux-distribution
systemctl start xe-linux-distribution
```

##### Alpine
Enable the `community` repository in `/etc/apk/repositories`, then:
```
apk add xe-guest-utilities
```
The service is not enabled by default, so enable it and start it:
```
rc-update add xe-guest-utilities
rc-service xe-guest-utilities start
```

##### Ubuntu

```
apt install xe-guest-utilities
```

Some older versions of Ubuntu, now EOL, may not have this package available in their repositories. Known such releases are 20.10 to 21.10. The best solution is to upgrade to a supported release. If this is really not possible, you may install the tools from the guest tools ISO.

*Feel free to add other distros to the above list if they provide the tools in their repositories.*

#### Install from the guest tools ISO

##### "Supported" Linux distributions

For distros that are supported by the `install.sh` script (Debian, CentOS, RHEL, SLES, Ubuntu...), the process is:
* Attach the guest tools ISO to the guest from Xen Orchestra or using `xe`.
* Then inside the VM, as root:
```
mount /dev/cdrom /mnt
bash /mnt/Linux/install.sh
umount /dev/cdrom
```
* No need to reboot the VM even if the script asks to. That's an old message from back when it was needed to install a kernel module in addition to the management agent. We'll get rid of it at some point.
* Eject the guest tools ISO

##### Derived Linux distributions

If your Linux distribution is not recognized by the installation script but derives from one that is supported by the script, you can override the detection and force the tools to install by using:
```
bash /mnt/Linux/install.sh -d $DISTRO -m $MAJOR_VERSION
```
Examples:
```
## derived from debian 10
bash /mnt/Linux/install.sh -d debian -m 10
## derived from RHEL or CentOS 8
bash /mnt/Linux/install.sh -d rhel -m 8
```

The likeliness for the installation to work correctly will depend on how much those distros differ from their "parent".

##### Other Linux distributions

For the remaining Linux distributions, mount the guest tools ISO as described above, then look for the `xe-guest-utilities_*_all.tgz` archive. Copy its contents on the system in `/etc` and `/usr`. It contains a System V init script by default but there's also a systemd unit file available on the ISO (`xe-linux-distribution.service`).

See also [Contributing](#contributing) below.

##### Specific cases

###### openSUSE Leap 15.2 with transactional-update

For the xe-daemon to start it is necessary that insserv is installed on the system. To make sure that is the case run
```
sudo transactional-uptdate pkg install insserv-compat
```
and as good measure reboot if they weren't already installed.

To install the guest tools open up the chroot environment with
```
sudo transactional-update shell
```
and mount the ISO like with every other derived distro
```
mount /dev/cdrom /mnt
bash /mnt/Linux/install.sh -d sles -m 15
umount /dev/cdrom
```
To exit the chroot cleanly you have to kill the `xe-daemon` process that may have been automatically started. Otherwise you end up with a corrupted snapshot and transactional-update will fail.

And again reboot the system to go to your newest snapshot.

After the reboot enable the service and start it with
```
systemctl enable xe-linux-distribution.service
systemctl start xe-linux-distribution.service
```

#### Update the guest tools

It's a good habit, and may be even required in some cases (that would then be described in the [Release Notes](../releases#xcp-ng-release-history), to update the guest tools to their latest version when your XCP-ng hosts are updated.

Depending on the situation, just update from your distribution's online repositories, or follow the above installation process again.

### FreeBSD

FreeBSD is a 30-year-old operating system used widely to run all sorts of systems and has served as the basis for a number of operating systems, including MacOS, pfSense, and FreeNAS. The Xen kernel modules are built and distributed in the GENERIC kernel, so if you haven't customised or recompiled your kernel, the drivers will be present.

To communicate with the hypervisor, you need to install two [ports](https://www.freebsd.org/ports/):
* [sysutils/xe-guest-utilities](https://www.freshports.org/sysutils/xe-guest-utilities/) 
* [sysutils/xen-guest-tools](https://www.freshports.org/sysutils/xen-guest-tools/) 

The `install.sh` script on the guest tools ISO does not yet support FreeBSD, so there is no point in mounting the guest tools ISO on a FreeBSD VM.

To manually [install xe-guest-utilities from a package](https://www.freebsd.org/doc/en_US.ISO8859-1/books/handbook/pkgng-intro.html) you can run:
```
pkg install xen-guest-tools xe-guest-utilities
service xenguest start
```

By default the `xe-daemon` will run if FreeBSD detects the Xen hypervisor at boot. If that autodetection fails for some reason, you can force it to try by putting `xenguest_enable=YES` in your `rc.conf` file: `sysrc xenguest_enable=YES`.

Run `service xenguest [stop|start|restart]` to respectively stop, start, or restart the `xe-daemon`.

### OpenBSD

On OpenBSD, the xen drivers are also already part of the kernel. The `install.sh` script doesn't support OpenBSD, but there are ways to install the management agent anyway.

:::tip
For OpenBSD search [the forum](https://xcp-ng.org/forum). See for example [this thread](https://xcp-ng.org/forum/topic/2582/guest-tools-for-openbsd).
:::

### FreeNAS/TrueNAS

FreeNAS is a locked-down version of FreeBSD, with many packages disabled to ensure a more stable environment for the fileserver. `xe-guest-utilities` is part of the packages that are **not** available in FreeNAS. But because it's based on FreeBSD, the packages from that OS can be installed, at your own risk. This is not a big issue for this particular package, because it's a _leaf_ in the chain of dependencies - nothing in FreeNAS depends on it.

Versions 12.0-U1 and higher of TrueNAS include the package by default, to install it on older versions (versions 11 or higher), follow these steps:

1. Enable the FreeBSD repo first:
   ```bash
   # sed -i '' 's/enabled: no/enabled: yes/' /usr/local/etc/pkg/repos/FreeBSD.conf
   ```
   If you are using FreeNAS v11.2 or higher, you also have to disable the local package repository to avoid an issue in that particular release and that may affect later versions before running `pkg install`:
   ```bash
   # sed -i '' 's/enabled: yes/enabled: no/' /usr/local/etc/pkg/repos/local.conf
   ```
   
2. Create a temporary directory and move into it:
   ```bash
   # mkdir /tmp/repo
   # cd /tmp/repo
   ```
   
3. Fetch the required packages. A directory **All** will be created and you will find the packages with their current versions under there:
   ```bash   
   # pkg fetch -o /tmp/repo/ xen-guest-tools
   # pkg fetch -o /tmp/repo/ xe-guest-utilities
   ```
   
4. Add the downloaded packages, without their dependencies:   
   ```bash
   # pkg add -M All/xen-guest-tools-4.14.0.txz
   # pkg add -M All/xe-guest-utilities-6.2.0_3.txz
   ```
   The versions reported here are just the current version and they maybe different in your installation.
   
5. Revert the repos to their original settings to avoid surprises down the road. The second command should be run just if you disabled the local repo in step 1:
   ```bash
   # sed -i '' 's/enabled: yes/enabled: no/' /usr/local/etc/pkg/repos/FreeBSD.conf
   # sed -i '' 's/enabled: no/enabled: yes/' /usr/local/etc/pkg/repos/local.conf
   ```
   A restart of the VM will perform a reset of these files to their original settings too.
   
6. Once the package is installed, you need to tell FreeNAS to start the `xe-daemon` process when starting:
   1. Go to _Tasks -> Init/Shutdown Script_
   2. Create a new task with the following settings:
      * Type: _Command_
      * Command: `/usr/local/sbin/xe-daemon -p /var/run/xe-daemon.pid &`
      * When: _Pre Init_
      * Enabled: Checked

7. Reboot. If you do not plan to reboot the VM, you can start the daemon manually running the command `/usr/local/sbin/xe-daemon -p /var/run/xe-daemon.pid &`. After you'll see a FreeBSD icon in your VM list on Xen Orchestra, and you can restart/shutdown the VM properly from the Web UI.

More insights and options are available in [this issue](https://github.com/xcp-ng/xcp/issues/172#issuecomment-548181589) or [this issue](https://github.com/xcp-ng/xcp/issues/446).

### Windows

Windows guests need both the device drivers and the management agent.
* The **device drivers** bring optimized I/O performances.
* The **management agent** brings more manageability of the VM from XCP-ng, and guest metrics reporting to the host.

#### Citrix tools vs XCP-ng tools

There exists two different set of tools that you can use on your VMs: the official tools from Citrix Hypervisor, or the fully open-source tools from XCP-ng. Both work well. The important point is **not to mix them in the same VM**.

Citrix tools:
* :heavy_plus_sign: Benefit from all the testing by Citrix QA team.
* :heavy_plus_sign: The drivers can be updated through Windows Update.
* :heavy_minus_sign: Proprietary, closed-source.

XCP-ng tools:
* :heavy_plus_sign: Fully open-source.
* :heavy_plus_sign: Maintained by the XCP-ng project.
* :heavy_minus_sign: Won't transparently replace existing Citrix tools. You need to remove Citrix tools first if they are present, in order to install XCP-ng tools.

It's now up to you to choose.

#### Using the Windows guest tools from Citrix

Tools from Citrix/XenServer are not included in the guest tools ISO distributed with XCP-ng for legal reasons.

##### A reminder
As written above:

> * The **device drivers** bring optimized I/O performances.
> * The **management agent** brings more manageability of the VM from XCP-ng, and guest metrics reporting to the host.

##### Management agent + device drivers
The only way to get the management agent is from XenServer directly. It can be freely downloaded from [the Xenserver download page](https://www.xenserver.com/downloads). Name of the item: "XenServer VM Tools for Windows". The installer will install both the management agent and the device drivers.

:::tip
You will also find present and past releases of the tools at: [https://support.citrix.com/article/CTX235403](https://support.citrix.com/article/CTX235403), but this may require a Citrix account.
:::

##### Automated installation via Windows Update: device drivers alone
If you are using Xen Orchestra, you can switch the "Windows Update tools" advanced parameter on from the "Advanced" tab of the VM view. This will install the device drivers automatically at next reboot :warning: **but not the management agent** which still needs to be installed from Citrix tools' installer.

... So the "Windows Update tools" option is not a complete solution if you need the guest metrics from the management agent. However it may be a convenient way to get future driver updates if you wish so.

##### Switching from XCP-ng tools to Citrix tools
If your VM already has XCP-ng tools and you wish to switch to Citrix tools, then you need to do the same kind of clean-up as described farther in this document for the opposite situation.

#### XCP-ng Windows Guest Tools
Drivers built and signed by Vates.

**Download**: [https://github.com/xcp-ng/win-pv-drivers/releases](https://github.com/xcp-ng/win-pv-drivers/releases)

Stability and testing status: [Windows guest tools community testing](https://github.com/xcp-ng/xcp/wiki/Windows-guest-tools-community-testing).

##### How to know if tools are already installed and working

The VM needs to be running for this test.

###### From Xen Orchestra
You can see this information in the General tab of the VM view.
* Device drivers: XO displays "Hardware virtualization with paravirtualization drivers enabled (PVHVM)" on the General tab
* Management agent: XO displays "Management agent detected" or "Management agent version \{version\} detected"

More detailed information can also be found in the Advanced tab.

###### From command line
* Device drivers: `xe vm-param-get param-name=PV-drivers-detected uuid={VM-UUID}`
* Management agent: `xe vm-param-get param-name=PV-drivers-version uuid={VM-UUID}` (ok if not empty)

##### Installing on fresh installed Windows

###### Prerequisite: Disable "Windows Update tools"
The first step, before the VM creation and first start, is to make sure than Windows Update is not going to install Citrix tools automatically at first boot. This behaviour is governed by the "Windows Update tools" parameter in a VMs advanced view. It must be off.

Before creating the VM:
* Make sure you are not creating it from a custom template than has the "Windows Update tools enabled.
* :warning: Do not create it from XCP-ng Center. XCP-ng Center automatically enables that option when the license allows it (and in XCP-ng the license always allows it...). This behaviour may be modified in the future.

Before starting the VM:
* Check the value of "Windows Update tools" in the Advanced tab of your VM in Xen Orchestra. Must be off.

If you already started the VM with the option on, then the Citrix drivers have been installed automatically. Restart from scratch or see below how to remove them.

Tip: you can also check the value of the parameter from the command line.
```
xe vm-param-get param-name=has-vendor-device uuid={VM-UUID}
```
`True` means that it's active, `False` that it isn't. It needs to be `False`.

###### Install the XCP-ng drivers
0. Snapshot your VM before installing (just in case)
1. Unpack the ZIP file
2. Start the installation MSI
3. Follow the install wizard

##### Upgrade from XCP-ng Windows PV Tools (8.2 or earlier) or XenServer VM Tools

Our installer will block installation when these tools are already present. These tools must be cleanly uninstalled before continuing with the installation.

:::warning
If you're using XCP-ng Windows PV Tools 8.2 or earlier, it must be uninstalled using XenClean to avoid encountering BSODs. Follow the procedure in our [Troubleshooting Guide - Windows PV Tools](../troubleshooting/windows-pv-tools.md).
:::

:::warning
In any case, first disable "Windows Update tools" for the VM (Xen Orchestra, advanced tab) and reboot it.
:::

#### Contributing
##### Linux / xBSD
If you would like to contribute improvements to the `install.sh` script so that it supports your distro, create a pull request against: https://github.com/xcp-ng/xe-guest-utilities/tree/master/mk. Relevant files are usually `xe-linux-distribution` and `install.sh`.

##### Windows
The XCP-ng team is looking for help in improving the guest tools installer, build process, and clean-up tools. For more details, see the [win-pv-drivers](https://github.com/xcp-ng/win-pv-drivers) repository.
