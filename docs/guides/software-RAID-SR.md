# Software RAID Storage Repository

How to manage a software RAID storage for my VMs?

XCP-ng has support for creating a software RAID for the operating system but it is limited to RAID level 1 (mirrored drives) and by the size of the drives used. It is strictly intended for hardware redundancy and doesn't provide any additional storage beyond what a single drive provides.

These instructions describe how to add more storage to XCP-ng using software RAID and show measures that need to be taken to avoid problems that may happen when booting. You should read through these instructions at least once to become familiar with them before proceeding and to evaluate whether the process fits your needs. Look at the "Troubleshooting" section of these instructions to get some idea of the kinds of problems that can happen.

An example installation is described below using a newly installed XCP-ng software RAID system. This covers only one specific possibility for software RAID. See the "More and Different" section of these instructions to see other possibilities.

In addition, the example presented below is a fresh installation and not being installed onto a production system. The changes described in the instructions can be applied to a production system but, as with any system changes, there is always a risk of something going badly and having some data loss. If performing this on a production system, make sure that there are good backups of all VMs and other data on the system that can be restored to this system or even a different one in case of problems.

These instructions assume you are starting with a server already installed with software RAID and have no other storage repositories defined except what may be on the existing RAID.

## Example System

The example system we're demonstrating here is a small server using 5 identical 1TB hard drives. XCP-ng has already been installed in a software RAID configuration using 2 of the 5 drives. There is already a default "Local storage" repository configured as part of the XCP-ng setup on the existing RAID 1 drive pair.

Before starting the installation, all partitions were removed from the drives and the drives were overwritten with zeroes.

So before starting out, here is an overview of the already configured system:

```
[09:51 XCP-ng ~]# cat /proc/partitions
major minor  #blocks  name

   8        0  976762584 sda
   8       16  976762584 sdb
   8       32  976762584 sdc
   8       64  976762584 sde
   8       48  976762584 sdd
   9      127  976762432 md127
 259        0   18874368 md127p1
 259        1   18874368 md127p2
 259        2  933245487 md127p3
 259        3     524288 md127p4
 259        4    4194304 md127p5
 259        5    1048576 md127p6
 252        0  933232640 dm-0

[09:51 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1]
md127 : active raid1 sdb[1] sda[0]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

unused devices: <none>
```

The 5 drives are in place as `sda` through `sde` and as can be seen from the list are exactly the same size. The RAID 1 drive pair is set up as the XCP-ng default of a partitioned RAID 1 array `md127` using drives `sda` and `sdb` and is in a healthy state.

## Building the Second RAID

We have 3 remaining identical drives,  `sdc`, `sdd`, and `sde` and we're going to create a RAID 5 array using them in order to maximize the amount of space. We'll create this using the mdadm command like this:

```
[10:02 XCP-ng ~]# mdadm --create /dev/md0 --run --level=5 --bitmap=internal --assume-clean --raid-devices=3 --metadata=1.2 /dev/sdc /dev/sdd /dev/sde
mdadm: array /dev/md0 started.
```

Here, we've made sure to use the `assume-clean` and `metadata=1.2` options. The `assume-clean` option prevents the RAID assembly process from initializing the content of the parity blocks on the drives which saves a lot of time when assembling the RAID for the first time.

The  `metadata=1.2` option forces the RAID array metadata to a position close to the beginning of each drive in the array. This is most important for RAID 1 arrays but useful for others and prevents the component drives of the RAID array from being confused for separate individual drives by any process that tries to examine the drives for automatic mounting or other use.

Checking the status of the drives in the system should show the newly added RAID array.

```
[10:20 XCP-ng ~]# cat /proc/partitions
major minor  #blocks  name

   8        0  976762584 sda
   8       16  976762584 sdb
   8       32  976762584 sdc
   8       64  976762584 sde
   8       48  976762584 sdd
   9      127  976762432 md127
 259        0   18874368 md127p1
 259        1   18874368 md127p2
 259        2  933245487 md127p3
 259        3     524288 md127p4
 259        4    4194304 md127p5
 259        5    1048576 md127p6
 252        0  933232640 dm-0
   9        0 1953260544 md0
[10:39 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1] [raid6] [raid5] [raid4]
md0 : active raid5 sde[2] sdd[1] sdc[0]
      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
      bitmap: 0/8 pages [0KB], 65536KB chunk

md127 : active raid1 sdb[1] sda[0]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

unused devices: <none>
```

Here we can see that the new RAID 5 array is in place as array `md0`, is using drives `sdc`, `sdd`, and `sde` and is healthy. As expected for a 3 drive RAID 5 array, it is providing about twice as much available space as a single drive.

## Building the Storage Repository

Now we create a new storage repository on the new RAID array like this:

```
[11:21 XCP-ng ~]# xe sr-create name-label="RAID storage" type=ext device-config:device=/dev/md0 shared=false content-type=user
2acc2807-1c44-a757-0b79-3834dbcf1a79
```

What we have now is a second storage repository named "RAID storage" using thin-provisioned EXT filesystem storage. It will show up and can be used within Xen Orchestra or XCP-ng Center and should behave like any other storage repository.

At this point, we'd expect that the system could just be used as is, virtual machines stored in the new RAID storage repository and that we can normally shut down and restart the system and expect things to work smoothly.

Unfortunately, we'd be wrong.

## Unstable RAID Arrays When Booting

What really happens when XCP-ng boots with a software RAID is that code in the Linux kernel and in the initrd file will attempt to find and automatically assemble any RAID arrays in the system. When there is just the single `md127` RAID 1 array, the process works pretty well. Unfortunately, the system seems to occasionally break down where there are more drives, more arrays, and more complex arrays.

This causes several problems in the system, mainly due to the system not correctly finding and adding all component drives to each array or not starting arrays which do not have all components added but could otherwise start successfully.

A good example here would be the `md0` RAID 5 array we just created. Rebooting the system in the state it is in now will often or even usually work without problems. The system will find both drives of the `md127` RAID 1 boot array and all three drives of the `md0` RAID 5 storage array, assemble the arrays and start them running.

Sometimes what happens is that the system either does not find all of the parts of the RAID or does not assemble them correctly or does not start the array. When that happens the `md0` storage array will not start and looking at the `/proc/mdstat` array status will show the array as missing one or two of the three drives or will show all three drives but not show them as running. Another common problem is that the array is assembled with enough drives to run, two out of three drives in our case, but does not start. This can also happen if the array has a failed drive at boot even if there are enough remaining drives to start and run the array.

This can also happen to the `md127` boot array where it will show with only one of the two drives in place and running. If it does not start and run at all, we will fail to get a normal boot of the system and likely be tossed into an emergency shell instead of the normal boot process. This is usually not consistent and another reboot will start the system. This can even happen when the boot RAID is the only RAID array in the system but fortunately that rarely happens.

So what can we do about this?  Fortunately, we can give the system more information about what RAID arrays are in the system and specify that they should be started up at boot.

## Stabilizing the RAID Boot Configuration: The mdadm.conf File

The first thing we need to do is give the system more information on what RAID arrays exist and how they're put together. The way to do this is by creating a raid configuration file `/etc/mdadm.conf`.

The `mdadm.conf` file created for this system is here:

```
[13:02 XCP-ng ~]# cat /etc/mdadm.conf
AUTO +all
MAILADDR root
DEVICE /dev/sda /dev/sdb /dev/sdc /dev/sdd /dev/sde
ARRAY /dev/md0  metadata=1.2 UUID=53461f34:2414371e:820f9514:008b6458
ARRAY /dev/md127  metadata=1.0 UUID=09871a29:26fa7ce1:0c9b040a:60f5cabf
```

Each system and array will have different UUID identifiers so the numbers we have here are specific to this example. The UUID identifiers here will not work for another system. For each system, we'll need a way to get them to include in the `mdadm.conf` file. The best way is using the `mdadm` command itself while the arrays are running like this: 

```
[13:06 XCP-ng ~]# mdadm --examine --scan
ARRAY /dev/md/0  metadata=1.2 UUID=53461f34:2414371e:820f9514:008b6458 name=XCP-ng:0
ARRAY /dev/md/127  metadata=1.0 UUID=09871a29:26fa7ce1:0c9b040a:60f5cabf name=localhost:127
```

Notice that this is output in almost exactly the same format as shown in the `mdadm.conf` file above. The UUID numbers are important and we'll need them again later.

If we don't want to type in the entire file, we can create the file like this.

```
echo 'AUTO +all' > /etc/mdadm.conf
echo 'MAILADDR root' >> /etc/mdadm.conf
echo 'DEVICE /dev/sda /dev/sdb /dev/sdc /dev/sdd /dev/sde' >> /etc/mdadm.conf
mdadm --examine --scan >> /etc/mdadm.conf
```
And then edit the file to change the format of the array names from `/dev/md/0` to `/dev/md0` and remove the `name=` parameters from each line. This isn't strictly necessary but keeps the array names in the file consistent with what is reported in `/proc/mdstat` and `/proc/partitions` and avoids giving each array another name (in our case those names would be `localhost:127` and `XCP-ng:0`).

So what do these lines do? The first line instructs the system to allow or attempt automatic assembly for all arrays defined in the file. The second specifies to report errors in the system by email to the root user. The third is a list of all drives in the system participating in RAID arrays. Not all drives need to be specified on a single DEVICE line. Drives can be split among multiple lines and we could even have one DEVICE line for each drive. The last two are descriptions of each array in the system.

This file gives the system a description of what arrays are configured in the system and what drives are used to create them but doesn't specify what to do with them. The system should be able to use this information at boot for automatic assembly of the arrays. Booting with the `mdadm.conf` file in place is more reliable but still runs into same problems as before.

## Stabilizing the RAID Boot Configuration: The initrd Configuration

The other thing we need to do is give the system some idea of what to do with the RAID arrays at boot time. The way to do this is by adding instructions for the `dracut` program creating the initrd file to enable all RAID support, use the `mdadm.conf` file we created, and to start the arrays at boot time.

We can specify additional command line parameters to the dracut command which creates the initrd file to ensure that kernel RAID modules are loaded, the `mdadm.conf` file is used and so on but there are a lot of them. In addition, we would have to manually specify the command line parameters every time a new initrd file is built or rebuilt. Any time dracut is run any other way such as automatically as part of applying a kernel update, the changes specified manually on the command line would be lost. A better way to do it is to create a list of parameters that will be used automatically by dracut every time it is run to create a new initrd file.

The `dracut` command keeps its configuration in the file `/etc/dracut.conf` and commands in the file are used when creating the initrd file every time the `dracut` command is run. We could make changes in that file but that comes with its own problems. There is no good way to prevent any other changes in the file from replacing our added commands such as installing an update which affects `dracut`.

Instead of changing the main configuration file, we can have a file with only added commands for `dracut`. The place to create the file is in the folder `/etc/dracut.conf.d/`. Any file with commands in that folder will be read and used by `dracut` when creating a new initrd file. XCP-ng already creates several files in that folder that affect how the initrd file is created but we should avoid changing those files for the same reasons as avoiding changes to the main configuration file. Keeping the configuration changes we need in their own file should ensure that our changes won't be lost or changed. The added file will also be used every time `dracut` creates a new initrd file whether it is done manually at the command line or automatically by an update.

We create a new file `dracut_mdraid.conf` in that folder that looks like this:

```
[14:11 XCP-ng ~]# cat /etc/dracut.conf.d/dracut_mdraid.conf
mdadmconf="yes"
use_fstab="yes"
add_dracutmodules+=" mdraid "
add_drivers+=" md_mod raid0 raid1 raid456 raid10 "
add_device+=" /dev/md0 "
add_device+=" /dev/md127 "
kernel_cmdline+=" rd.auto=1 "
kernel_cmdline+=" rd.md=1 "
kernel_cmdline+=" rd.md.conf=1 "
kernel_cmdline+=" rd.md.uuid=53461f34:2414371e:820f9514:008b6458 "
kernel_cmdline+=" rd.md.uuid=09871a29:26fa7ce1:0c9b040a:60f5cabf "
```

This file contains two sets of instructions for `dracut`, some that affect how the initrd file is built and what is done at boot and the rest which are passed to the Linux kernel at boot. 

The first set instructs `dracut` to consider the `mdadm.conf` file we created earlier and also to include a copy of it in the initrd file, add `dracut` support for mdraid, include the kernel modules for mdraid support, and specifically support the two RAID devices by name.

The second set instructs the booting Linux kernel to support automatic RAID assembly, support mdraid and the mdraid configuration and also to search for and start the two RAID arrays via their UUID identifiers. These are the same UUID identifiers that we included in the `mdadm.conf` file and, like the UUID identifiers there, are specific to each array and system. 

Something to note when creating the file is to allow extra space between command line parameters. That is why most of the lines have extra space before and after parameters within the quotes.

## Building and Testing the New initrd File

Now that we have all of this extra configuration, we need to get the system to include it for use at boot. To do that we use the `dracut` command to create a new initrd file like this:

```
dracut --force -M /boot/initrd-$(uname -r).img $(uname -r)
```

This creates a new initrd file with the correct name matching the name of the Linux kernel and prints a list of modules included in the initrd file. Printing the list isn't necessary but is handy to see that `dracut` is making progress as it runs.

When the system returns to the command line, it's time to test. We'll reboot the system from the console or from within Xen Orchestra or XCP-ng Center. If all goes well, the system should boot normally and correctly find and mount all 5 drives into the two RAID arrays. The easiest way to tell that is looking at the `/proc/mdstat` file.

```
[14:36 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1] [raid6] [raid5] [raid4]
md127 : active raid1 sda[0] sdb[1]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

md0 : active raid5 sdc[0] sde[2] sdd[1]
      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
      bitmap: 3/8 pages [12KB], 65536KB chunk

unused devices: <none>
```

We can see that both arrays are active and healthy with all drives accounted for. Examining the storage repositories using Xen Orchestra, XCP-ng, or `xe` commands shows that both the Local storage and RAID storage repositories are available.

## Troubleshooting

The most common problems in this process stem from one of a few things.

One common cause of problems is using the wrong type of drives. Just like when using drives for installation of XCP-ng, it is important to use drives that either have or emulate 512 byte disk sectors. Drives that use 4K byte disk blocks will not work unless they are 512e disks which emulate having 512 byte sectors. It is generally not a good idea to mix types of drives such as one 512n (native 512 byte sectors) and two 512e drives but should be possible to do in an emergency.

The second is that the drives were not empty before including them into the system. If there are any traces of RAID configuration or file systems on the drives, we could have problems with interference between those and the new configurations we're creating on the drives when creating the RAID array or the EXT filesystem (or LVM if you use that for the storage array).

The way to avoid this problem is to make sure the drives are thoroughly wiped before starting the process. This can be done from the command line with the `dd` command like this:

```
dd if=/dev/zero of=/dev/sde bs=1M
```
This writes zeroes to every block on the drive and will wipe any traces of previous filesystems or RAID configurations.

Sometimes only one drive has a problem when assembling the RAID and we'll see a working RAID with one drive missing. We'll assume that our md0 RAID was assembled correctly except that it is missing drive `/dev/sde`. In that case, it should be possible to add the missing drive into the array like this:

```
mdadm --add /dev/md0 /dev/sde
```

If the drive is added to the RAID array correctly, we should start to see a lot of disk activity and we should be able to monitor the progress of it by looking at the `/proc/mdstat` file.

If the drive will not add to the array due to something left over on the drive, we should get an error from `mdadm` indicating the problem. In that case we should be able to use the dd command to wipe out the one drive as above and then attempt to add it into the array.

The other possibility is that the RAID array is created correctly but XCP-ng will not create a storage repository on it because some previous content of the drives is causing a problem. It should be possible to recover from this by writing zeroes to the entire array without needing to rebuild it like this:

```
dd if=/dev/zero of=/dev/md0 bs=1M
```

After the probably very lengthy process of zeroing out the array, it should be possible to try again to create a storage repository on the RAID array.

Another common cause for problems is a problem with either the `mdadm.conf` or `dracut_mdraid.conf` files. Often when there is a problem with one of those files, the system will boot but fail to assemble or start the RAID arrays. The boot RAID array will usually be found and assembled automatically but other RAID arrays may not.

The best thing to do in this case is to check over the contents of the `mdadm.conf` and `dracut_mdraid.conf` files. Look for mistyped or missing quotes in the `dracut_mdraid.conf` or missing spaces inside the quotes for those lines that have them. Look for incorrect or mistyped UUID identifiers for the RAID arrays in both files. The UUID identifiers should match the identifiers you get using the mdadm --examine --scan command and also match between the `mdadm.conf` file and the `dracut_mdraid.conf` file. If any errors are found and corrected, rebuild the initrd file using the `dracut` command.

In an extreme case, it should even be possible to delete and re-create those files using the normal instructions and rebuild the initrd file again. It should also be possible but slightly more risky to remove the files and re-create the initrd file then reboot and attempt to re-create the files and initrd again after rebooting.

Another possible but rare problem is caused by drives that shift their identifications from one system boot to the next. A drive that has one name such as `sdf` on one boot might be different such as `sdc` on a different boot. This is usually due to problems with the system BIOS or drivers and can also be caused by some hardware problems such as a drive taking wildly different amounts of time to start up from one boot to the next. It it also more common with some types of storage such as NVMe storage.

This type of problem is very difficult to diagnose and correct. It may be possible to resolve it using different BIOS or setup configurations in the host system or by updating BIOS or controller firmware.

## Updates and Upgrades

We will eventually need to update or patch the system to fix problems or close security holes as they are discovered.

[Updates](../../management/updates) are patches that are applied to isolated parts of the system and replace or correct just the affected programs or data files. The patches are applied using the `yum` command from the host system's command line or via the Xen Orchestra patches tab for a host or pool. The individual update patches should not affect either the added `mdadm.conf` or `dracut_mdraid.conf` files and any rebuild of the initrd file as part of a Linux kernel update should use the configuration from those files. In general, updates should be safe to apply without risk of affecting software RAID operation.

[Upgrades made by booting from CD](../../installation/upgrade#upgrade-via-installation-iso-recommended) or the equivalent via network booting are different from updates. The upgrade process replaces the entire running system by creating a backup copy of the current system into a separate disk partition then performing a full installation from the CD and makes copies of the configuration data and files from the previous system, upgrading them as needed. As part of a full upgrade, it is likely that one or both of the added RAID configuration files will not be copied from the original system to the upgraded system.

Before installing an upgrade via CD, check the running RAID arrays and look for any problems with drives as follows:

```
[09:46 XCP-ng ~]# mdadm --examine --brief --scan
ARRAY /dev/md/0  metadata=1.2 UUID=53461f34:2414371e:820f9514:008b6458 name=XCP-ng:0
ARRAY /dev/md/127  metadata=1.0 UUID=09871a29:26fa7ce1:0c9b040a:60f5cabf name=localhost:127

[09:46 XCP-ng ~]# cat /proc/mdstat
Personalities : [raid1] [raid6] [raid5] [raid4]
md0 : active raid5 sde[2] sdc[0] sdd[1]
      1953260544 blocks super 1.2 level 5, 512k chunk, algorithm 2 [3/3] [UUU]
      bitmap: 0/8 pages [0KB], 65536KB chunk

md127 : active raid1 sda[0] sdb[1]
      976762432 blocks super 1.0 [2/2] [UU]
      bitmap: 1/8 pages [4KB], 65536KB chunk

unused devices: <none>
```
This list shows both of the RAID arrays in the example system and shows that both are active and healthy. At this point it should be safe to shut down the host and reboot from CD to install the upgrade.

When installing the upgrade, no differences from a normal upgrade process are needed to account for either the RAID 1 boot array or the RAID 5 storage array. We should only need to ensure that the installer recognizes the previous installation and that we select an upgrade instead of an installation when prompted.

After the upgrade has finished and the host system reboots, there may be problems with recognizing one or both of the RAID arrays. It is very unlikely that there will be a problem with the `md127` RAID 1 boot array with the most likely problem being the array operating with only one drive. Problems with the RAID 5 storage array are more likely but not common with the most likely problems being drives missing from the array or the array failing to activate. 

Once the host system has rebooted, check whether the `mdadm.conf` and `dracut_mdraid.conf` files are still in the correct locations and have the correct contents. It is possible that one or both of the files have been retained; in a test upgrade from XCP-ng version 8.2 to version 8.2 itself on the example system, the `mdadm.conf` file was preserved as part of the upgrade while the `dracut_mdraid.conf` file was not.

Missing files can be copied from the previous system by mounting the partition containing the saved copy. If not using a software RAID 1 system drive we would need to mount the second partition of the disk used as the system drive, most likely `/dev/sda2`.

```
[15:06 XCP-ng ~]# mount /dev/md127p2 /mnt
```
We then copy one or both files from the original system to the correct locations in the upgraded system using one or both of the commands:

```
[15:08 XCP-ng ~]# cp /mnt/etc/dracut.conf.d/dracut_mdraid.conf /etc/dracut.conf.d/
[15:08 XCP-ng ~]# cp /mnt/etc/mdadm.conf /etc/
```

After copying the files, we unmount the original system then create a new initrd file which will contain the RAID configuration files.

```
[15:10 XCP-ng ~]# umount /mnt
[15:10 XCP-ng ~]# dracut --force -M /boot/initrd-$(uname -r).img $(uname -r)
```

If the `mdadm.conf` or `dracut_mdraid.conf` files are damaged or cannot be copied from the backup copy of the system, it should be possible to create new copies of the files by following the instructions for creating them as part of an installation then using the above `dracut` command to create an updated initrd file.

After the rebuilding of the initrd file has finished, it should be safe to reboot the host system. At this point, the system should start and run normally.

In some cases it is also possible to perform [an upgrade using `yum`](../../installation/upgrade#from-command-line) instead of booting from CD. This type of upgrade does not completely replace the running system and does not create a backup copy. It is really a long series of updates instead of a full replacement. When upgrading a system using `yum`, the `mdadm.conf` and `dracut_mdraid.conf` files should remain in place just as with updates but copies of the files should be saved before the upgrade just in case.

## More and Different

So what if we don't have or don't want a system that's identical to the example we just built in these instructions? Here are some of the possible and normal variations of software RAID under XCP-ng.

### No preexisting XCP-ng RAID 1

We might want to create a RAID storage repository even though XCP-ng was installed without software RAID where the operating system was installed to a single hard drive or some other device. This needs only minimal changes to the example configuration. Without a software RAID installed by XCP-ng, there will be no RAID 1 device `md127` holding the operating system. In this case, we build the storage RAID array normally, still calling it `md0` but omit any lines in the `mdadm.conf` and `dracut_mdraid.conf` which list `md127`. We would only include the lines in those files mentioning `md0` and its UUID and the devices used to create it.

### Different Sized and Shaped RAID Arrays

We might want to create a RAID array with more or fewer drives or a different RAID level. Common types would be a two drive RAID 1 array or a 4 drive RAID 5, 6 or 10 array. Those cases are very easy to accommodate by changing the parameters when building the RAID array, altering the `level=` or `raid-devices=` parameters and the list of drives on the `mdadm --create` command line. The only other consideration is to make sure the drives used are accounted for in a `DEVICE` line in the `mdadm.conf` file.

The number of drives in a specific level of RAID array can also affect the performance of the array. A good rule of thumb for RAID 5 or 6 arrays is to have a number of drives that is a power of two (2, 4, 8, etc.) plus the number of extra drives where space is used for parity information, one drive for RAID 5 and two drives for RAID 6. The RAID 5 array we created in the example system meets that recommendation by having 3 drives. A 5 drive RAID5 array, or 4 or 6 drive RAID 6 arrays would as well. A good rule of thumb for RAID 10 arrays is to have an even number of drives. For RAID 10 in Linux an even number of drives is not a requirement as it is on other types of systems. In addition, it may be possible to get better performance by creating a 2 drive RAID 10 array instead of a 2 drive RAID 1 array.

### Avoiding the RAID 5 and 6 "Write Hole"

RAID 5 and 6 arrays have a problem known as the "write hole" affecting their consistency after a failure during a disk write such as a crash or power failure. The problem happens when a chunk of RAID protected data known as a stripe is changed on the array. To make the change, the operating system reads the stripe of data, changes the portion of the data requested, recomputes the disk parity for RAID 5 or RAID 6 then rewrites the data to the disks. If a crash or power outage interrupts that process some of the data written to disk will reflect the new content of the stripe while some on other disks will reflect the old content of the stripe. In general the system may be able to detect that there is a problem by rereading the entire stripe and verifying that the parity portion does not match. The system would have no way to verify which portions of the stripe were written with new data and which contain old data so would not be able to properly reconstruct the stripe after a crash.

This problem can only happen if the system is interrupted during a write to a RAID and tends to be rare.

Generally, the best way to mitigate the problem is by avoiding it. Use good quality server hardware with known stable hardware drivers to avoid possible sources of crashes. Having good power protection such as redundant power supplies and battery backup units and using software to automatically shut down in case of a power outage will limit possible power-related problems.

If that is not enough, there are other methods to avoid the write hole by making it possible for the RAID system to recover after a crash while working around the write hole problem.

For RAID 5 systems, one way to do this is using feature known as PPL or partial parity log which changes the way that data is written and recovery is performed on a RAID 5 array. Using this method comes at a cost of as much as a 30 or 40 percent lower RAID write performance. To enable it while building the RAID, substitute `--consistency-policy=ppl` for `--bitmap=internal` when creating the array. It is also possible to change an existing RAID 5 array to use this with the command `mdadm --grow --bitmap=none --consistency-policy=ppl /dev/md0` (assuming the `md0` array created in our example system). It is also possible to change the array back with the command `mdadm --grow --bitmap=internal /dev/md0`.

For RAID 6 systems, something different needs to be done. The way to close the write hole for a RAID 6 is to use a separate device which acts as a combination disk write log or journal and write cache. For best performance the device should be a disk with better write performance than the drives used in the array, preferably a fast SSD with good longevity. Going back to our example system and assuming that there is an additional device `sdf`, we would substitute `--write-journal=/dev/sdf` instead of `--bitmap=internal` when creating the array. To avoid the journal drive becoming a single point of failure, a good practice might be to create a RAID 1 device from the fast drives or SSDs then using that RAID device as a journal device. A write journal device may also be used for RAID 5 arrays.

### Different Sized Drives

We might need to create a RAID array where our drives are not identical and each drive has a different number of available blocks. This might come up if we need to create a RAID array but have two of one type of drive and one of another such as two WD drives and one Seagate or two 1TB drives and one that is 1.5TB or 2TB.

The easiest solution to creating a working RAID array in this situation is to partition the drives and create a RAID array using the partitions instead of using the entire drive.

To do this, we get the sizes of the disks in the system by examining the `/proc/partitions` file. Starting with the smallest of the disks to be used in the array, use `gdisk` or `sgdisk` to create a single partition of type `fd00` (Linux RAID) using the maximum space available. Examine and record the size of the partition created and save the changes. Repeat the process with the remaining drives to be used except use the size of the partition created on the first drive instead of the maximum space available.

This should leave you with drives that each have a single partition and all of the partitions are the same size even though the drives are not.

When creating the RAID array and the `mdadm.conf` file, use the name of the disk partition instead of the name of the disk. In our example system, we would create the array using `/dev/sdc1`, `/dev/sdd1`, and `/dev/sde1` instead of `/dev/sdc`, `/dev/sdd`, and `/dev/sde` and also make the same substitutions on `DEVICE` lines in the `mdadm.conf` file.

It should also be possible to create the partitions on the drives outside of the XCP-ng system using a bootable utility disk that contains partitioning utilities such as gparted.

### More Than One Additional Array

We might want to create more than one extra RAID array and storage repository. This is also easy to accommodate in a similar way to using a different number of drives in the array. We can easily create another RAID array and another storage repository onto a different set of drives by changing the parameters of the `mdadm --create` command line and `xe sr-create` command line.

As an example assume that we have 3 more drives `/dev/sdf`, `/dev/sdg`, and `/dev/sdh` and want to create a second RAID 5 array and another storage repository. We create another RAID 5 array, this time `md1` like this:

```
[16:45 XCP-ng ~]# mdadm --create /dev/md1 --run --level=5 --bitmap=internal --assume-clean --raid-devices=3 --metadata=1.2 /dev/sdf /dev/sdg /dev/sdh
mdadm: array /dev/md1 started.
```

We then create another storage repository as we did previously making sure to give it a different name and use `/dev/md1` instead of `/dev/md0` in the command line.

We also need to make sure that the `mdadm.conf` file has `DEVICE` lines containing the three drives `/dev/sdf`, `/dev/sdg`, and `/dev/sdh` and an ARRAY line containing /dev/md1 and its UUID in addition to the other drives and arrays `md127` and `md0`. We also need to make sure that the `dracut_mdraid.conf` file contains a `kernel_cmdline+=` line specifying the `rd.md.uuid=` with the UUID of the `md1` array that matches what is in the `mdadm.conf` file in addition to the other two similar lines in that file.

It is important that each RAID array has a different name as the system will not allow you to create a RAID array with the name of one that already exists. Normally, you would just continue on with different RAID device names such as `md1`, `md2`, `md3`, etc. It is also important to use different names for each storage repository such as "RAID storage", "RAID storage 2" and so on.
