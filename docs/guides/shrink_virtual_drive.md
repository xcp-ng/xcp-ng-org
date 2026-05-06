# How to shrink a virtual disk

XCP-ng doesn't support VDI (Virtual Disk Image) shrinking, only growing. However, there are solutions to achieve the same result, albeit with some manual steps.

## Windows VMs

There are two options to do this. The most reliable is the Clonezilla method, but the XenConvert route might also work.

### XenConvert

1. Attach a disk of the desired size to the VM.
1. Within the VM: Format this new disk in NTFS (quick format).
1. Install and start XenConvert: select the system disk (probably C:) and set the newly formatted disk as the destination.
1. Acknowledge the warning that the destination disk is smaller than the source.
1. Wait for the copy process to complete.
1. Using the Windows Disk Management tool, set the partition of the new disk to "Active" status.
1. Shut down the VM.
1. Detach both disks, then reattach the new disk so that it is in position 1.
1. Start the VM.

### CloneZilla

:::tip
Use the i686 version of Clonezilla to avoid boot issues on the ISO while using a Windows template.
:::

#### Pre-requisites

:::warning
It seems that doing a `dism /Online /Set-ReservedStorageState /State:Disabled` first (before anything else) is required on Windows to get a succesful partition shrink and avoiding any data loss.
:::

1. Identify the partition you want to move to the new disk and then shut down the VM.
1. Create a new drive of the smaller size you want in this VM.
1. Switch the VM to BIOS mode.
1. Get the Clonezilla ISO available in your ISO SR and insert it.
1. Check the boot order to ensure it's CD drive and then HDD.

#### Steps

1. Boot the VM.
1. Select "Start CloneZilla."
1. Choose "device-device," meaning CloneZilla will copy from one disk to another, which is our goal.
1. Select "Expert Mode."
1. Choose "Disk to local disk" mode.
1. Select the origin disk (the bigger one).
1. Then select the destination disk (the smaller one).
1. In the advanced options, make sure to unselect "-g auto."
1. Also select "Don't check the source filesystem."
1. Use the "-k1" option (Create the partition table proportionally).
1. Finally, select "-p poweroff" once the copy is done.
1. Start the cloning process!

When it's done:

1. Eject the Clonezilla CD.
1. Switch back the VM to UEFI.
1. Detach the bigger disk (keep it as a backup in case something goes wrong).
1. Boot the VM.

## Linux VMs

You can use the same Clonezilla method. However, since "everything is a file" in Linux/BSDs, you can also use `rsync` to migrate the files from the original system to the new one.