# Troubleshooting

If you have a problem on XCP-ng, there's 2 options:

* Community support (mostly on [XCP-ng Forum](https://xcp-ng.org/forum))
* [Pro support](https://xcp-ng.com)

## The 3-Step-Guide
Here is our handy **3-Step-Guide**:

1. Check the [Logfiles](https://github.com/xcp-ng/xcp/wiki/Logfiles). Check your settings. [Read below](#topics)... if you already did, proceed to Step 2.
2. Get help at our [Forum](https://xcp-ng.org/forum) or get help at IRC _#xcp-ng_ on [Freenode](https://webchat.freenode.net) and provide as much information as you can:
    * ☑️ What did you **exactly** do to expose the bug?
    * :rocket: XCP-ng Version
    * :desktop_computer: Hardware
    * :factory: Infrastructure
    * :newspaper_roll: Logfiles
    * :tv: Screenshots
    * :stop_sign: Error messages
3. Share your solution ([forum](https://xcp-ng.org/forum), [wiki](https://github.com/xcp-ng/xcp/wiki)) - others can benefit from your experience.
    * And we are therefore officially proud of you! :heart: 

## The 1-Step-Guide

If you have subscribed to [Pro support](https://xcp-ng.com/), well, don't hesitate to use it!



## Common Problems

### Blank screen (on a linux VM)

#### Cause

Your VM booted just fine. You see a blank console because of driver related issues.

#### Quick Solution

please try to:

* press `ALT` + `right Arrow` to switch to next console
* press `TAB` to escape boot splash
* press `ESC`

#### Solution (draft! has to be tested/validated)

* Blacklisting (Source: https://xcp-ng.org/forum/post/1707)
> Usually, when you install a recent distro in PVHVM (using other media) and you get a blank screen, try blacklisting > by adding the following in your grub command at the end
>
> modprobe.blacklist=bochs_drm  



### VM not in expected power state

#### Cause
The XAPI database think's that the VM is On / Off. But this are fake news ;-)

#### Solution
Restart toolstack on CLI with the command `xe-toolstack-restart`. This just restarts the management services, all running VMs are untouched.

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

### Async Tasks/Commands Hang or Execute Extremely Slowly

#### Cause
This symptom can be caused by a variety of issues including Raid degradation, aging HDD's, slow network storage, and external hard drives/usbs. While extremely unintuitive, even a single slow storage device physically connected (attached or unattached to a VM) can cause your entire host to hang during operation.

#### Solution
1. Begin by unplugging any external USB hubs, hard drives, and USBs.
2. Run a command such as starting a VM to see if the issue remains.
3. If the command still hangs, physically check to see if your HDDs/SSDs are all functioning normally and any raid arrays you are using are in a clean non-degraded state.
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

[This Guide](https://github.com/xcp-ng/xcp/wiki/Guest-Tools#upgrade-from-citrix-registered-xenserver-registered-client-tools) may help you through the process.


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
    * Follow the [3-Step-Guide](#general). 

***

### Some of my VMs do not start. Error: "This operation cannot be performed because the specified virtual disk could not be found."

#### Cause
It's mostly related to an inserted iso that is no longer accessible.

#### Solution
Eject the iso on those VM's.

***

### I had some scripts/tools installed and after the upgrade all is gone! Help!

#### Cause
XCP-ng iso upgrade is a reinstall that saves only your XAPI database (Settings/VM Metadata).
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
    * update raid controller / HBA firmware
    * update system firmware
* Maybe we (or upstream Citrix XenServer) removed/updated something.
    * Please check our [[HCL|Hardware-Compatibility-List-(HCL)]].
    * Follow the [3-Step-Guide](#general).

## iSCSI Troubleshooting

### iSCSI in storage-cluster environment (DRBD / Corosync / Pacemaker )

##### iSCSI reconnect after reboot fails permanently ( Unsupported SCSI Opcode )

The problem is that in a storage-cluster environment everytime the node changes or pacemaker start /stop /restart iSCSI resources the "iSCSI SN" for a lun are new generated and differs from that before.
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

Hi, this is a small trick I had to use once [(original article)](https://linuxconfig.org/how-to-reset-an-administrative-root-password-on-xenserver-7-linux) 

* Reboot your XenServer into Grub boot menu.
* Use arrows keys to locate an appropriate XenServer boot menu entry and press **e** key to edit boot options.
* Locate read-only parameter **ro** and replace it with **rw**. Furthermore, locate keyword **splash** and replace it with **init=/bin/bash**.
* **Hit F10** to boot into single-mode
* Once in single-mode use **passwd** command to reset your XenServer's root password
* Reboot xenserver by entering the command **exec /usr/sbin/init**
* If everything went well you should now be able to login with your new XenServer password.

## XenStore related issues

See the [Xen doc](https://wiki.xenproject.org/wiki/Debugging_Xen#Debugging_Xenstore_Problems).

The `XENSTORED_TRACE` being enabled might give useful information.