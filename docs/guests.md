# Guest tools

XCP-ng needs guest tools to be installed in the VMs in order to communicate with the guest operating system. This brings better performance and is required for various features.

In short: *always install the guest tools to your VMs*.

The tools are made of two main components:
* kernel drivers for the OS
* a management agent

## Linux

Xen guest drivers have been built-in in the linux kernel for many years. All currently supported linux distributions include them.

So all we need is to install the management agent.

### Install the Linux Guest Tools on a supported distro

Here's the procedure for supported distros (Debian, Ubuntu, CentOS, RHEL, SLES...).

* Attach the guest tools ISO to the guest from Xen Orchestra, XCP-ng Center or using `xe`.
* Then inside the VM, as root:
```
mount /dev/cdrom /mnt
bash /mnt/Linux/install.sh
umount /dev/cdrom
```
* Eject the guest tools ISO

If a message asks you to reboot the VM, ignore it. That's an old message from back when it was needed to install a kernel module in addition to the management agent. We'll get rid of it at some point.

### Install the Linux Guest Tools on an "unsupported" distro

If you have an "unsupported" distro based on Debian or Ubuntu (like TurnKey Linux for example) the install script will fail to detect it and refuse to install. On these "unsupported" .deb based distros you can override the detection and force the tools to install by using:
```
bash /mnt/Linux/install.sh -d debian -m 9
```

If you have an "unsupported" distro based on Fedora or RHEL/CentOS (like FreePBX for example) the install script will fail to detect it and refuse to install. On .rpm based distros you can override the detection and force the tools to install by using:
```
bash /mnt/Linux/install.sh -d rhel -m 7
```

The likeliness for the installation to work correctly will depend on how much those distros differ from their "parent".

## FreeBSD/OpenBSD

On FreeBSD/OpenBSD, the xen drivers are also already part of the kernel.

The `install.sh` script doesn't support those systems, but there are ways to install the management agent anyway.

:::tip
For others: search [the forum](https://xcp-ng.org/forum). See for example [this thread](https://xcp-ng.org/forum/topic/2582/guest-tools-for-openbsd).
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

```

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
