# Guest tools

XCP-ng needs guest tools to be installed in the VMs in order to communicate with the guest operating system. This brings better performance and is required for various features.

In short: *always install the guest tools to your VMs*.

The tools are made of two main components:
* kernel drivers for the OS
* a management agent

## Linux

Xen guest drivers have been built-in in the linux kernel for many years. All currently supported linux distributions include them.

So all we need is to install the management agent, which comes either as a systemd or as a sysvinit service, depending on the linux distribution. The service is usually named `xe-linux-distribution`.

Those guest tools can be installed:
* from the target distribution's online repositories if available
* from the Guest Tools ISO image that can be attached to any VM in XCP-ng

### Install from the distro's online repositories

Distros often have policies that forbid enabling new services by default, so most of the time the steps are:
* enable the appropriate repository
* install the package from it
* enable the service

#### CentOS and Fedora
Enable the EPEL repository in the VM, then:
```
yum install xe-guest-utilities-latest
```
The service is not enabled by default, so enable it and start it:
```
systemctl enable xe-linux-distribution
systemctl start xe-linux-distribution
```

#### Alpine
Enable the `community` repository in `/etc/apk/repositories`, then:
```
apk add xe-guest-utilities
```
The service is not enabled by default, so enable it and start it:
```
rc-update add xe-guest-utilities
rc-service xe-guest-utilities start
```

*Feel free to add other distros to the above list if they provide the tools in their repositories*

### Install from the guest tools ISO

#### "Supported" linux distributions
For distros that are supported by the `install.sh` script (Debian, CentOS, RHEL, SLES, Ubuntu...), the process is:
* Attach the guest tools ISO to the guest from Xen Orchestra, XCP-ng Center or using `xe`.
* Then inside the VM, as root:
```
mount /dev/cdrom /mnt
bash /mnt/Linux/install.sh
umount /dev/cdrom
```
* No need to reboot the VM even if the script asks to. That's an old message from back when it was needed to install a kernel module in addition to the management agent. We'll get rid of it at some point.
* Eject the guest tools ISO

#### Derived linux distributions
If your linux distribution is not recognized by the installation script but derives from one that is supported by the script, you can override the detection and force the tools to install by using:
```
bash /mnt/Linux/install.sh -d $DISTRO -m $MAJOR_VERSION
```
Examples:
```
# derived from debian 10
bash /mnt/Linux/install.sh -d debian -m 10
# derived from RHEL or CentOS 8
bash /mnt/Linux/install.sh -d rhel -m 8
```

The likeliness for the installation to work correctly will depend on how much those distros differ from their "parent".

#### Other linux distributions
For the remaining linux distributions, mount the guest tools ISO as described above, then look for the `xe-guest-utilities_*_all.tgz` archive. Copy its contents on the system in `/etc` and `/usr`. It contains a System V init script by default but there's also a systemd unit file available on the ISO (`xe-linux-distribution.service`).

See also [Contributing](guests.html#contributing) below.

### Update the guest tools
It's a good habit, and may be even required in some cases (that would then be described in the [Release Notes](https://xcp-ng.org/docs/currentrelease.html)), to update the guest tools to their latest version when your XCP-ng hosts are updated.

Depending on the situation, just update from your distribution's online repositories, or follow the above installation process again.

## FreeBSD

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

## OpenBSD

On OpenBSD, the xen drivers are also already part of the kernel. The `install.sh` script doesn't support OpenBSD, but there are ways to install the management agent anyway.

:::tip
For OpenBSD search [the forum](https://xcp-ng.org/forum). See for example [this thread](https://xcp-ng.org/forum/topic/2582/guest-tools-for-openbsd).
:::

## FreeNAS/TrueNAS

FreeNAS is a locked-down version of FreeBSD, with many packages disabled to ensure a more stable environment for the fileserver. `xe-guest-utilities` is part of the packages that are **not** available in FreeNAS. But because it's based on FreeBSD, the packages from that OS can be installed, at your own risk. This is not a big issue for this particular package, because it's a _leaf_ in the chain of dependencies - nothing in FreeNAS depends on it.

To install it, you just have to enable the FreeBSD repo first:

```bash
# sed 's/enabled: no/enabled: yes/' /usr/local/etc/pkg/repos/FreeBSD.conf
# pkg install xe-guest-utilities
```

If you are using FreeNAS v11.2, you also have to disable the local package repository [to avoid an issue in that particular release](https://www.justinsilver.com/random/fix-pkg-on-freenas-11-2/) before running `pkg install`:

```bash
# sed 's/enabled: yes/enabled: no/' /usr/local/etc/pkg/repos/local.conf
```

After the install, revert to the previous settings to avoid surprises down the road:
```bash
# sed 's/enabled: yes/enabled: no/' /usr/local/etc/pkg/repos/FreeBSD.conf
# sed 's/enabled: no/enabled: yes/' /usr/local/etc/pkg/repos/local.conf
```

Once the package is installed, you need to tell FreeNAS to start the `xe-daemon` process when starting:
1. Go to _Tasks -> Init/Shutdown Script_
2. Create a new task with the following settings:
  * Type: _Command_
  * Command: `/usr/local/sbin/xe-daemon -p /var/run/xe-daemon.pid &`
  * When: _Pre Init_
  * Enabled: Checked

After you've rebooted your FreeNAS VM, or started the daemon manually, you'll see a FreeBSD icon in your VM list on Xen Orchestra, and you can restart/shutdown the VM properly from the Web UI.

Thanks to @etomm in [this issue](https://github.com/xcp-ng/xcp/issues/172#issuecomment-548181589) for the idea.

## Windows

Windows guests need both the device drivers and the management agent.
* The **device drivers** bring optimized I/O performances.
* The **management agent** brings more manageability of the VM from XCP-ng, and guest metrics reporting to the host.

### Citrix tools vs XCP-ng tools

There exists two different set of tools that you can use on your VMs: the official tools from Citrix Hypervisor, or the fully open-source tools from XCP-ng. Both work well. The important point is **not to mix them in the same VM**.

Citrix tools:
* :heavy_plus_sign: Benefit from all the testing by Citrix QA team.
* :heavy_plus_sign: The drivers can be updated through Windows Update.
* :heavy_minus_sign: Proprietary, closed-source.

XCP-ng tools:
* :heavy_plus_sign: Fully open-source.
* :heavy_plus_sign: Maintained by the XCP-ng project.
* :heavy_plus_sign: :heavy_minus_sign: The sources for the drivers are from the Xen project directly, without additional Citrix patches. This is good, but it may be that in some specific situations Citrix drivers behave better (None known at the moment).
* :heavy_minus_sign: The sources for the management agent are older than that of Citrix (they have stopped updating github a while ago).
* :heavy_minus_sign: Maintained by one overloaded community member until Vates finds a developer to hire or contract with in order to maintain them more efficiently.
* :heavy_minus_sign: Won't transparently replace existing Citrix tools. You need to remove Citrix tools first if they are present, in order to install XCP-ng tools.

It's now up to you to choose.

### XCP-ng Windows Guest Tools
Drivers built by the XCP-ng community.

**Download**: <https://github.com/xcp-ng/win-pv-drivers/releases>

Stability and testing status: [Windows guest tools community testing](https://github.com/xcp-ng/xcp/wiki/Windows-guest-tools-community-testing).

#### How to know if tools are already installed and working

The VM needs to be running for this test.

##### From Xen Orchestra
* Management agent + device drivers: XO displays "Hardware virtualization with paravirtualization drivers enabled (PVHVM)"
* Device drivers alone: Xen Orchestra is currently (2020-03-30) unable to detect if the device drivers are installed if the management agent is not installed either. See <https://github.com/vatesfr/xen-orchestra/issues/4783>. If it displays "No tools detected", it is still possible that the device drivers are present.

##### From XCP-ng Center
* Device drivers: the mention "I/O optimized" will be visible in VM details
* Management agent: the mention "Management Agent" will be visible in VM details.

##### From command line
* Device drivers: `xe vm-param-get param-name=PV-drivers-detected uuid={VM-UUID}`
* Management agent: `xe vm-param-get param-name=PV-drivers-version uuid={VM-UUID}` (ok if not empty)

#### Installing on fresh installed Windows

##### Prerequisite: Disable "Windows Update tools"
The first step, before the VM creation and first start, is to make sure than Windows Update is not going to install Citrix tools automatically at first boot. This behaviour is governed by the "Windows Update tools" parameter in a VM's advanced view. It must be off.

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

##### Install the XCP-ng drivers
0. snapshot before just in case
1. unpack the ZIP file
2. start setup.exe
3. follow the install wizard

**Note**: Restart can take a while if your windows is currently updating. Restart only occurs after windows has the updates finished.

4. after restart one of two messages should pop up
    * request for restart <- just restart!
    * Management Agent installed successfully <- enjoy :-)

#### Upgrade from Citrix :registered: XenServer :registered: client tools

Our installer is not able currently to cleanly uninstall Citrix tools. Citrix tools' uninstaller itself isn't either: it leaves various things behind.

So we need to perform a complete manual clean-up of the tools:
* either entirely manually
* or using the experimental PowerShell script contributed by one of our users at <https://github.com/siodor/win-tools-cleanup>

:warning: In any case, first disable "Windows Update tools" for the VM (Xen Orchestra, advanced tab) and reboot it.

Following is the manual process.

##### The confident option

You can try a simple process first with some chances of success.

0. Make a snapshot so you can rollback. Windows can get unstable/unbootable if things go wrong.
1. Uninstall Citrix :registered: XenServer :registered: Client Tools
2. Reboot
3. Uninstall `XenServer PV`-Drivers in Device Manager in following order (reboots may be needed):
    * `XenServer PV Network Device` (one ore more Devices)
    * `XenServer PV Storage Host Adapter`
    * `XenServer PV Network Class`
    * `XenServer Interface`
    * `XenServer PV Bus (c000)` (if present)
    * `XenServer PV Bus (0002)` or `XenServer PV Bus (0001)`
4. Reboot
5. Check that you see this unknown device in Device Manager:
    * `SCSI-Controller` - PCI-Device ID `5853:0002`
6. Unpack ZIP file
7. Start setup.exe
8. Follow the install wizard

**Note**: Restart can take a while if your windows is currently updating. Restart only occurs after windows has the updates finished.

### The nuclear option

If the *confident option* above didn't yield the expected results, then we switch to a more aggressive attitude towards the old tools.

:::tip
What follows works in many cases, but some users occasionnally still meet the following issues: XCP-ng tools not installing (but Citrix tools install well, so that is a solution to have working tools), and occasionnal BSODs in some cases or versions of Windows.

Through many tests, a user came up with a similar yet slightly different procedure that allowed them to avoid Blue Screens Of Death in their situation: https://xcp-ng.org/forum/post/27602.

Help is welcome to help us reconcile both procedures into one.
:::

* Follow the steps 0 to 4 of the "confident option" above if not done yet.
* Follow this (ignore steps 6 and 7, do not try to install the tools yet) <https://support.citrix.com/article/CTX215427>
* Now open regedit and go to HKLM\SYSTEM\CurrentControlSet\Services and delete entries for all xen* services.
* In regedit, also go to HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\DIFx\DriverStore and remove ONLY xennet* xenvif*
* Go to C:\Windows\System32 and remove: (you may not have all these)
  * xenbus_coinst*.dll
  * xenvbd_coinst*.dll
  * liteagent.exe
* Now go to C:\Windows\System32\drivers and remove any files named xen*
* Go to C:\Windows\system32\DriverStore\FileRepository and remove xennet* and Xenvif* directories.
* Open the Device Manager and Click View --> Show Hidden Devices. Select Other Devices and Right click on XENBUS VIF and select uninstall. If it asks to delete the driver, check yes. Do this for any xen related thing you see in device manager. Also do the same for any unknown devices.
* Lastly, reboot the VM. You should now hopefully be able to install xen tools regularly.

**Note**: Also have a look at our [Troubleshooting Guide - Windows PV-Tools](troubleshooting.html#windows-agent-pv-tools).

### VMs with INACCESSIBLE_BOOT_DEVICE error

You can try to manually inject the missing drivers in recovery mode.

* Get the "Drivers" folder from the XCP Tools installation path (C:\PROGRAM FILES...) - from another VM or install the tools somewhere else to get it.
* Create an ISO-Image containing the "Drivers" folder (see <http://imgburn.com>) and mount that ISO-Image to your VM
* Boot to recovery mode and use the command line and the tool "dism" (see [Microsoft Docs](https://docs.microsoft.com/en-us/windows-hardware/manufacture/desktop/add-and-remove-drivers-to-an-offline-windows-image)) to inject the drivers (specifically the xenbus and xenvbd drivers) - watch out for the drive letter of the Windows installation and the CD-Drive ('D' and 'E' in the following example):

````
dism /image:d:\ /add-driver /driver:e:\Drivers\xenbus\x64\xenbus.inf
dism /image:d:\ /add-driver /driver:e:\Drivers\xenvbd\x64\xenvbd.inf
````

### Using the Windows guest tools from Citrix

Tools from Citrix are not included in the guest tools ISO distributed with XCP-ng for legal reasons.

#### A reminder
As written above:

> * The **device drivers** bring optimized I/O performances.
> * The **management agent** brings more manageability of the VM from XCP-ng, and guest metrics reporting to the host.

#### Management agent + device drivers
The only way to get the management agent is from Citrix. It is present on Citrix Hypervisor's installation ISO, which can be freely downloaded provided you create an account on their site. You will find it in the `client_install` directory. The installer will install both the management agent and the device drivers.

#### Automated installation via Windows Update: device drivers alone
If you are using Xen Orchestra, you can switch the "Windows Update tools" advanced parameter on from the "Advanced" tab of the VM view. This will install the device drivers automatically at next reboot :warning: **but not the management agent** which still needs to be installed from Citrix tools' installer.

... So the "Windows Update tools" option is not a complete solution if you need the guest metrics from the management agent. However it may be a convenient way to get future driver updates if you wish so.

#### Switching from XCP-ng tools to Citrix tools
If your VM already has XCP-ng tools and you wish to switch to Citrix tools, then you need to do the same kind of clean-up as described higher in this document for the opposite situation.

### Contributing
#### Linux / xBSD
If you would like to contribute improvements to the `install.sh` script so that it supports your distro, create a pull request against: https://github.com/xcp-ng/xe-guest-utilities/tree/master/mk. Relevant files are usually `xe-linux-distribution` and `install.sh`.

#### Windows
The XCP-ng team is looking for help in improving the guest tools installer, build process, and clean-up tools.
