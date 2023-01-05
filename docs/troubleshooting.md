# Troubleshooting

If you have a problem on XCP-ng, there's 2 options:

* Community support (mostly on [XCP-ng Forum](https://xcp-ng.org/forum))
* [Pro support](https://xcp-ng.com)

## The 3-Step-Guide
Here is our handy **3-Step-Guide**:

1. Check the [logs](troubleshooting.md#log-files). Check your settings. [Read below](troubleshooting.md#common-problems)... if you already did, proceed to Step 2.
2. Get help at our [Forum](https://xcp-ng.org/forum) or get help [on Discord](https://discord.gg/aNCR3yPaPn) or [on IRC](irc://irc.oftc.net/#xcp-ng) and provide as much information as you can:
    * ☑️ What did you **exactly** do to expose the bug?
    * :rocket: XCP-ng Version
    * :desktop_computer: Hardware
    * :factory: Infrastructure
    * :newspaper_roll: Logs
    * :tv: Screenshots
    * :stop_sign: Error messages
3. Share your solution ([forum](https://xcp-ng.org/forum), [wiki](https://github.com/xcp-ng/xcp/wiki)) - others can benefit from your experience.
    * And we are therefore officially proud of you! :heart:

## Pro Support

If you have subscribed to [Pro support](https://xcp-ng.com/), well, don't hesitate to use it!

## Installation and upgrade

(Where "upgrade" here designates an upgrade using the installation ISO)

### If the installer starts booting up then crashes or hangs

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

### During installation or upgrade

You can reach a shell with ALT+F2 (or ALT+RIGHT) and a logs console with ALT+F3 (or ALT+RIGHT twice).

Full installation log are populated in real time in `/tmp/install-log`. They can be read with `view /tmp/install-log`.

When asking for help about installation errors, providing this file increases your chances of getting precise answers.

The target installation partition is mounted in `/tmp/root`.

### Installation logs

The installer writes in `/var/log/installer/`.

The main log file is `/var/log/installer/install-log`.

### Debugging the installer

You can [build your own installer](develprocess.md#iso-modification).

## Log files

On a XCP-ng host, like in most Linux/UNIX systems, the logs are located in `/var/log`. XCP-ng does not use `journald` for logs, so everything is in `/var/log` directly.

### General log

`/var/log/daemon.log`

Output of various running daemons involved in XCP-ng's tasks. Examples: output of `xenopsd` which handles the communication with the VMs, of executables involved in live migration and storage motion, and more...

### XAPI's log

`/var/log/xensource.log`

Contains the output of the XAPI toolstack.

### Storage related (eg. coalescing snapshots)

`/var/log/SMlog`

Contains the output of the storage manager.

### Kernel messages

For hardware related issues or system crashes.

`/var/log/kern.log`

All kernel logs since last boot: type `dmesg`.

### Kernel crash logs

In case of a host crash, if it is kernel-related, you should find logs in `/var/crash`

### Produce a status report

To help someone else identify an issue or reproduce a bug, you can generate a full status report containing all log files, details about your configuration and more.

```
xen-bugtool --yestoall
```

Then upload the resulting archive somewhere. It may contain sensitive information about your setup, so it may be better to upload it to a private area and give the link only to those you trust to analyze it.


### XCP-ng Center

You can display the log files via menu `Help` -> `View XCP-ng Center Log Files`.

The log files are located in `C:\Users\<user>\AppData\Roaming\XCP-ng\XCP-ng Center\logs`.

### Windows VM

#### (PV-)Driver install log
`C:\Windows\INF\setupapi.dev.log`


## Useful data for debugging

### DMAR/IVRS ACPI tables

To debug various issues (for example IOMMU-related issues), developers may need to consult the DMAR (Intel) or IVRS (AMD) acpi tables, extracted from the firmware.

Here's how to extract them, from a Linux system with `acpica-tools` (or equivalent name in your distro) installed, as root:

```bash
mkdir acpi && cd acpi
acpidump > acpi.dmp
acpixtract -a acpi.dmp
[[ -f rmad.dat ]] && echo "DMAR" | dd of=rmad.dat bs=1 count=4 conv=notrunc
iasl -d *.dat
```

This will produce either `ivrs.dsl`, `rmad.dsl` or `dmar.dsl`.


## Common Problems

### Blank screen (on a Linux VM)

#### Cause

Your VM booted just fine. You see a blank console because of driver related issues.

#### Quick Solution

please try to:

* press `ALT` + `right Arrow` to switch to next console
* press `TAB` to escape boot splash
* press `ESC`

#### Solution (draft! has to be tested/validated)

* Blacklisting (Source: <https://xcp-ng.org/forum/post/1707>)
> Usually, when you install a recent distro in PVHVM (using other media) and you get a blank screen, try blacklisting by adding the following in your grub command at the end
>
> modprobe.blacklist=bochs_drm
***
### Initrd is missing after an update

#### Symptom

After an update, XCP-ng won't boot and file `/boot/initrd-4.19.0+1.img` is missing.

#### Cause

Can be a `yum` update process interrupted while rebuilding the `initrd`, such as a manual reboot of the host before the post-install scriplets have finished executing.

#### Solution

1. Boot on the fallback kernel (last entry in grub menu)
2. Rebuild the initrd with `dracut -f /boot/initrd-<exact-kernel-version>.img <exact-kernel-version>`
3. Reboot on the latest kernel, it works!

:::tip
Here is an example of `dracut` command on a 8.2 host: `dracut -f /boot/initrd-4.19.0+1.img 4.19.0+1`
:::

***
### VM not in expected power state

#### Cause
The XAPI database thinks that the VM is On / Off. But this is fake news ;-)

#### Solution
Restart toolstack on CLI with the command `xe-toolstack-restart`. This just restarts the management services, all running VMs are untouched.

***

### Host and Pool have incompatible Licenses

#### Cause
You may get this error when attempting to add a new host to an existing pool. This occurs when you mix products, for instance adding a XenServer/Citrix Hypervisor host to an XCP-ng pool, or vice versa. 

#### Solution
To solve this, simply get your pool "coherent" and do not mix products. Ensure all hosts in the pool as well as hosts you'd like to add to the pool are running XCP-ng. It is not recommended to mix XCP-ng hosts with XenServer hosts in the same pool.

***

### Rebooting hangs the server

#### Cause
Unknown, possibly related to the kernel, or BIOS.
This has been known to occur on a Dell Poweredge T20.

### Solution

Try these steps:

1. Turn off C-States and Intel SpeedStep in the BIOS.
2. Flash any update(s) to the BIOS firmware.
3. Append `reboot=pci` to kernel boot parameters. This can be done in `/etc/grub.cfg` or `/etc/grub-efi.cfg`.

***

### Server loses time on 14th gen Dell hardware

#### Cause

Unknown, the system keeps listening to the hardware clock instead of trusting NTP

### Solution

```
echo "xen" > /sys/devices/system/clocksource/clocksource0/current_clocksource
  printf '%s\n\t%s\n%s\n' 'if test -f /sys/devices/system/clocksource/clocksource0/current_clocksource; then' 'echo xen > /sys/devices/system/clocksource/clocksource0/current_clocksource' 'fi' >> /etc/rc.local
```
***
### Async Tasks/Commands Hang or Execute Extremely Slowly

#### Cause
This symptom can be caused by a variety of issues including RAID degradation, ageing HDDs, slow network storage, and external hard drives/usbs. While extremely unintuitive, even a single slow storage device physically connected (attached or unattached to a VM) can cause your entire host to hang during operation.

#### Solution
1. Begin by unplugging any external USB hubs, hard drives, and USBs.
2. Run a command such as starting a VM to see if the issue remains.
3. If the command still hangs, physically check to see if your HDDs/SSDs are all functioning normally and any RAID arrays you are using are in a clean non-degraded state.
4. If these measures fail, login to your host and run `cat /var/log/kern.log | grep hung`. If this returns `"echo 0 > /proc/sys/kernel/hung_task_timeout_secs" disables this message.` your lvm layer may be hanging during storage scans. This could be caused by a drive that is starting to fail but has not hard failed yet.
5. If all these measures fail, collect the logs and make your way to the forum for help.

----

## Network Performance

### TCP Offload checksum errors

#### Cause

When running `# tcpdump -i <device name> -v -nn |grep incorrect`, there are checksum incorrect error messages.
Example: `# tcpdump -i eth0 -v -nn |grep incorrect`

#### Solution

**NOTE**: These changes does not guarantee improved network performance, please use iperf3 to check before and after the change.

- If you see transmit TCP offload checksum errors like this:

     `<XCP-ng host IP>.443 > x.x.x.x.19723: Flags [.], cksum 0x848a (incorrect -> 0x1b17), ack 3537, win 1392, length 0`

     then try running
     `# xe pif-param-set uuid=$PIFUUID other-config:ethtool-tx="off"` where $PIFUUID is the UUID of the physical interface.

- If you see receive TCP offload checksum errors like this:

     `x.x.x.x.445 > <XCP-ng host IP>.58710: Flags [.], cksum 0xa189 (incorrect -> 0xc352), seq 469937:477177, ack 53892, win 256, options [nop,nop,TS val 170183446 ecr 146516], length 7240WARNING: Packet is continued in later TCP segments`

     `x.x.x.x.445 > <XCP-ng host IP>.58710: Flags [P.], cksum 0x8e45 (incorrect -> 0xd531), seq 477177:479485, ack 53892, win 256, options [nop,nop,TS val 170183446 ecr 146516], length 2308SMB-over-TCP packet:(raw data or continuation?)`

     then try running
     `# xe pif-param-set uuid=$PIFUUID other-config:ethtool-gro="off"` where $PIFUUID is the UUID of the physical interface.

The PIF UUID can be found by executing:

`# xe pif-list`


## Windows Agent / PV-Tools

### I got the error message "Windows Management Agent failed to install" directly after installing it

#### Cause
There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

#### Solution
Resolved with version 8.2.2.200-RC1 and newer.

***

### The Management Agent Installer was executed, but the PV-Drivers are not installed in the Device Manager

#### Causes and Solutions
##### Cause a) There can be leftovers from old Citrix XenServer Client Tools.
1. remove any xen*.* files from `C:\Windows\system32` like
    * xenbus_coinst_7_2_0_51.dll
    * xenvbd_coinst_7_2_0_40.dll
    * xenbus_monitor_8_2_1_5.exe
    * and similiar `xen*_coinst` and `xen*_monitor` files
2. remove any leftover `XenServer` devices from device manager, also display hidden `XenServer` devices and remove them!
    * To show hidden devices in Device Manager: `View -> Show Hidden Devices`

##### Cause b) There was an issue with the installing of the drivers certificate, so the drivers did not load silently

Resolved with version 8.2.2.200-RC1 and newer.

***

### Upgrading from XenTools 6.x to XCP-ng-Client-Tools-for-Windows-8.2.1-beta1 and get the error message "Windows Management Agent failed to install" directly after installing it

#### Cause and solution:

There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

Resolved with version 8.2.2.200-RC1 and newer.

***

### I installed the Client Tools. XCP-ng Center says that I/O is optimized but my network card is not (correct) installed and the Management Agent is (also) not working.

##### Cause

There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

#### Possible Solutions

* Resolved with version 8.2.2.200-RC1 and newer.

* Clean your system from `Citrix Client Tools` _AND_ `XCP-ng Client Tools` to create a clean state.
* Then install the Client Tools from scratch.

[This Guide](guests.md#upgrade-from-citrix-xenserver-client-tools) may help you through the process.


## After Upgrade

### The Server stays in Maintenance Mode

#### Causes and Solutions
* You enabled the maintenance mode and forgot about it.
    * No big deal, just exit maintenance mode :-)
* The server is still booting.
    * Take your time and let him boot up :-) this takes sometimes some time, but typically not longer than some minutes.
* A Storage Repository (SR) could not be attached.
    * Check the corresponding disk(s), network(s) and setting(s). Follow the [3-Step-Guide](#general).
* There is a serious problem.
    * Follow the 3-Step-Guide.

***

### Some of my VMs do not start. Error: "This operation cannot be performed because the specified virtual disk could not be found."

#### Cause
It's mostly related to an inserted ISO that is no longer accessible.

#### Solution
Eject the ISO on those VMs.

***

### I had some scripts/tools installed and after the upgrade all is gone! Help!

#### Cause
XCP-ng ISO upgrade is a reinstall that saves only your XAPI database (Settings/VM Metadata).
But it also creates a full backup of your previous XCP-ng/XenServer installation on a second partition, in most cases it's /dev/sda2.

#### Solution
To access the backup (with all your tools and modifications) just mount the backup partition (mostly /dev/sda2) and copy your data back.

***

### After upgrading my XCP-ng host is unstable, network card freezes, kernel errors, etc.

#### Causes and Solutions

* Maybe your hardware got an issue
    * Check caps on your mainboard
    * Check power supply
    * Check cables
    * Check drives SMART values with something like `smartctl -A /dev/sda` ([Smartmontools](https://www.smartmontools.org))
    * Check memory with something like [Memtest86+](https://www.memtest.org)
* Maybe your firmware got an issue
    * update BIOS
    * update network card firmware
    * update RAID controller / HBA firmware
    * update system firmware
* Maybe we (or upstream Citrix XenServer) removed/updated something.
    * Please check our [Hardware Compatibility List (HCL)](hardware.md).
    * Follow the [3-Step-Guide](#general).

## iSCSI Troubleshooting

### iSCSI in storage-cluster environment (DRBD / Corosync / Pacemaker )

##### iSCSI reconnect after reboot fails permanently ( Unsupported SCSI Opcode )

The problem is that in a storage-cluster environment every time the node changes or pacemaker start /stop /restart iSCSI resources the "iSCSI SN" for a lun are new generated and differs from that before.
Xen uses the "iSCSI SN" as an identifier, so you have to ensure that "iSCSI SN" is the same on all cluster nodes.
You can read more about it [here](https://smcleod.net/tech/2015/12/14/iscsi-scsiid-persistence.html).

* error message xen orchestra

```
SR_BACKEND_FAILURE_47(, The SR is not available [opterr=Error reporting error, unknown key Device not appeared yet], )

```

* possible and misleading error message on storage servers

```
kernel: [11219.445255] rx_data returned 0, expecting 48.
kernel: [11219.446656] iSCSI Login negotiation failed.
kernel: [11219.642772] iSCSI/iqn.2018-12.com.example.server:33init: Unsupported SCSI Opcode 0xa3, sending CHECK_CONDITION.

```

#### Solution

The trick is to extend the Lio iSCSI lun configuration in pacemaker with a hard coded iscsi_sn (scsi_sn=d27dab3f-c8bf-4385-8f7e-a4772673939d) and `lio_iblock`, so that every node uses the same.

* while pacemaker iscsi resource is running you can get the actual iSCSI_SN:
`cat /sys/kernel/config/target/core/iblock_0/lun_name/wwn/vpd_unit_serial`

* extend your pacemaker iSCSI configuration with a `scsi_sn` and the matching `lio_iblock`

```
primitive p_iscsi_lun_1 iSCSILogicalUnit \
        params target_iqn="iqn.2019-01.com.example.server:example" implementation=lio-t lun=0 path="/dev/drbd0" \
        scsi_sn=d27dab3f-c8bf-4385-8f7e-a4772673939d lio_iblock=0 \
        op start timeout=20 interval=0 \
        op stop timeout=20 interval=0 \
        op monitor interval=20 timout=40

```

***

## Reset root password

If you need to modify your XCP-ng root password, you may follow the steps below. The full prodecure can also be found on [this page](https://support.citrix.com/article/CTX214360).

* Reboot your XCP-ng into Grub boot menu.
* Select XCP-ng boot menu entry and press <kbd>e</kbd> key to edit boot options.
* Locate the read-only parameter ```ro``` and replace it with ```rw init=/sysroot/bin/sh```.
* Press <kbd>Ctrl</kbd> + <kbd>X</kbd> to boot into single-mode.
* From the Emergency Mode prompt, execute the command **chroot /sysroot**.
* Once in single-mode, use ```passwd``` command to reset your XCP-ng root password.
* Reboot XCP-ng by sending <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Suppr</kbd>.
* If everything went well, you should now be able to login with your new XCP-ng password.

## XenStore related issues

See the [Xen doc](https://wiki.xenproject.org/wiki/Debugging_Xen#Debugging_Xenstore_Problems).

The `XENSTORED_TRACE` being enabled might give useful information.

## Ubuntu 18.04 boot issue

Some versions of Ubuntu 18.04 might fail to boot, due to a Xorg bug affecting GDM and causing a crash of it (if you use Ubuntu HWE stack).

The solution is to use `vga=normal fb=false` on Grub boot kernel to overcome this. You can add those into ` /etc/default/grub`, for the `GRUB_CMDLINE_LINUX_DEFAULT` variable. Then, a simple `sudo update-grub` will provide the fix forever.

You can also remove the `hwe` kernel and use the `generic` one: this way, the problem won't occur at all.

:::tip
Alternatively, in a fresh Ubuntu 18.04 install, you can switch to UEFI and you won't have this issue.
:::

## Disappearing NVMe drives

Some NVMe drives do not handle Automatic Power State Transition (APST) well on certain motherboards or adapters and will disappear from the system when attempting to lower their power state.  You may see logs in dmesg that indicate this is happening.

```
[65056.815294] nvme nvme0: controller is down; will reset: CSTS=0xffffffff, PCI_STATUS=0xffff
[65060.797874] nvme 0000:04:00.0: Refused to change power state, currently in D3
[65060.815452] xen: registering gsi 32 triggering 0 polarity 1
[65060.815473] Already setup the GSI :32
[65060.937775] nvme nvme0: Removing after probe failure status: -19
[65060.950019] print_req_error: I/O error, dev nvme1n1, sector 895222784
[65060.950022] print_req_error: I/O error, dev nvme1n1, sector 438385288
[65060.950040] print_req_error: I/O error, dev nvme1n1, sector 223301496
[65060.950072] print_req_error: I/O error, dev nvme1n1, sector 256912800
[65060.950077] print_req_error: I/O error, dev nvme1n1, sector 189604552
[65060.950085] print_req_error: I/O error, dev nvme1n1, sector 390062504
[65060.950087] print_req_error: I/O error, dev nvme1n1, sector 453909496
[65060.950099] print_req_error: I/O error, dev nvme1n1, sector 453915072
[65060.950102] print_req_error: I/O error, dev nvme1n1, sector 246194176
[65060.950107] print_req_error: I/O error, dev nvme1n1, sector 246194288
[65061.030575] nvme nvme0: failed to set APST feature (-19)
```

APST can be disabled by adding `nvme_core.default_ps_max_latency_us=0` to your kernel boot parameters.  For example, in xcp-ng 8.1, edit `/boot/grub/grub.cfg` to include a new parameter on the first `module2` line.

```
menuentry 'XCP-ng' {
	search --label --set root root-jnugiq
	multiboot2 /boot/xen.gz dom0_mem=7584M,max:7584M watchdog ucode=scan dom0_max_vcpus=1-16 crashkernel=256M,below=4G console=vga vga=mode-0x0311
	module2 /boot/vmlinuz-4.19-xen root=LABEL=root-jnugiq ro nolvm hpet=disable console=hvc0 console=tty0 quiet vga=785 splash plymouth.ignore-serial-consoles nvme_core.default_ps_max_latency_us=0
	module2 /boot/initrd-4.19-xen.img
}
```
## Missing templates when creating a new VM

If you attempt to create a new VM, and you notice that you only have a handful of templates available, you can try fixing this from the console. Simply go to the console of your XCP-NG host and enter the following command:
```
/usr/bin/create-guest-templates
```

This should recreate all the templates.


## The updater plugin is busy

The message `The updater plugin is busy (current operation: check_update)` means that the plugin crashed will doing an update. The lock was then active, and it was left that way. You can probably see that by doing:

```
cat /var/lib/xcp-ng-xapi-plugins/updater.py.lock
```

It should be empty, but if you have the bug, you got `check_update`.

Remove `/var/lib/xcp-ng-xapi-plugins/updater.py.lock` and that should fix it.

## Disk failure/replacement with software RAID

If XCP-ng has been installed with a *software RAID 1 full disk mirror* method, a disk failure can be fixed with a disk replacement. Here's how:

#### If the host can't boot anymore

Boot to the XCP-ng installer ISO in shell mode.

#### Once booted into your XCP-ng install or the ISO

Enter the following commands:
```
cat /proc/mdstat
```
This will return a similar output:
```
Personalities : [raid1]
md127 : active raid1 nvme0n2[3] nvme0n1[2]
      62914432 blocks super 1.0 [2/2] [U_]

unused devices: <none>
```
`[U_]` indicates that the RAID is damaged. Now we will repair it.

#### Remove damaged disk

Let's assume we want to remove `nvme0n1`:
```
mdadm --manage /dev/md127 --fail /dev/nvme0n1
```
Now `mdstat` shows `nvme0n1` as *failed*:
```
Personalities : [raid1]
md127 : active raid1 nvme0n2[3] nvme0n1[2](F)
      62914432 blocks super 1.0 [2/1] [U_]

unused devices: <none>
```
Now we can remove the disk from the raid:
```
mdadm --manage /dev/md127 --remove /dev/nvme0n1
```
The disk is removed from `mdstat`:
```
Personalities : [raid1]
md127 : active raid1 nvme0n2[3]
      62914432 blocks super 1.0 [2/1] [U_]

unused devices: <none>
```
The disk is successfully removed.

#### Add a new/replacement disk to the RAID

Now we can add a replacement disk. Shutdown your host, install the disk on your system, then boot it to your XCP-ng install or the installer ISO once more. Now add the disk to the RAID:
```
mdadm --manage /dev/md127 --add /dev/nvme0n1
```
`mdstat` shows that disk `nvme0n1` is in the RAID and is synchronizing with `nvme0n2`:
```
Personalities : [raid1]
md127 : active raid1 nvme0n2[3] nvme0n1[4]
      62914432 blocks super 1.0 [2/1] [U_]
      [=>...................]  recovery =  9.9% (2423168/24418688) finish=2.8min speed=127535K/sec

unused devices: <none>
```
Wait for completion, the rebuild is complete once `mdstat` looks like:
```
md127 : active raid1 nvme0n2[3] nvme0n1[4]
      62914432 blocks super 1.0 [2/2] [UU]

unused devices: <none>
```
`[UU]` is back, the RAID is repaired and you should now reboot the host.

#### If the system is still unbootable

This might happen for various reasons. If you haven't backed-up the contents of the disks yet, you really should now, in case data was corrupted on more than one disk. Clonezilla is a good open source live ISO to do this with if you don't already have a favorite tool. It can back up to another disk, or to a network share.

It has been reported to us that some non-enterprise motherboards may have limited UEFI firmware that does not cope well with disk changes.

In most cases, you should be able to restore the bootloader by upgrading your host to the same version it is already running (e.g upgrade 8.2 to 8.2 using the 8.2 install ISO). Check [the upgrade docs](upgrade.md) for the usual instructions and warnings. Another, custom solution is to run the appropriate `efibootmgr` commands from the installer's shell. Refer to [its documentation](https://linux.die.net/man/8/efibootmgr).
