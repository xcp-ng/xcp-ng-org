# Disk failure/replacement with software RAID

If XCP-ng has been installed with a *software RAID 1 full disk mirror* method, a disk failure can be fixed with a disk replacement. Here's how:

### If the host can't boot anymore

Boot to the XCP-ng installer ISO in shell mode.

### Once booted into your XCP-ng install or the ISO

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

### Remove damaged disk

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

### Add a new/replacement disk to the RAID

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

### If the system is still unbootable

This might happen for various reasons. If you haven't backed-up the contents of the disks yet, you really should now, in case data was corrupted on more than one disk. Clonezilla is a good open source live ISO to do this with if you don't already have a favorite tool. It can back up to another disk, or to a network share.

It has been reported to us that some non-enterprise motherboards may have limited UEFI firmware that does not cope well with disk changes.

In most cases, you should be able to restore the bootloader by upgrading your host to the same version it is already running (e.g upgrade 8.2 to 8.2 using the 8.2 install ISO). Check [the upgrade docs](../../installation/upgrade.md) for the usual instructions and warnings. Another, custom solution is to run the appropriate `efibootmgr` commands from the installer's shell. Refer to [its documentation](https://linux.die.net/man/8/efibootmgr).
