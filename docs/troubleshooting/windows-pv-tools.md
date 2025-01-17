# Windows PV Tools

Common issues and topics related to Windows PV tools.

## PV-Drivers missing in the Device Manager

### Cause

If despite running the Windows tools installer, there's no devices visible in the device manager, it's likely because there's some leftovers from old Citrix XenServer Client Tools.

### Solutions

#### Leftovers from old Citrix XenServer Client Tools.

See the XenClean guides below for instructions.

## Network PV drivers aren't working.

### Cause

If the tools are installed, while XCP-ng Center says that I/O is optimized, but the network card is not correctly installed and the Management Agent is also not working. There was an issue with the installing of the drivers certificate, so the drivers did not load silently.

### Possible Solutions

* Clean your system from `Citrix Client Tools` _AND_ `XCP-ng Client Tools` to create a clean state.
* Then install the Client Tools from scratch.

See the XenClean guides below for instructions.

## Not all PV drivers are correctly installed

![](https://xcp-ng.org/forum/assets/uploads/files/1713455051057-02dc1378-09e6-4600-a1b3-9a1be2cbdecc-image.png)

### Cause

It's possible that some antivirus blocks the end of the installation of the PV drivers. We've seen this happening with SentinelOne AV already (see [this thread](https://xcp-ng.org/forum/post/76098)).

### Solution

Simply pausing the agent and doing a reboot will make the XenTools to install succesfully. After a succesfull installation, enabling the SentinelOne agent again is possible without any other issues regarding the tools or drivers.

## Completely removing existing Xen PV drivers with XenClean

XenClean is an utility for cleanly removing Xen PV drivers and management agents of the following products:

* XCP-ng Windows PV Tools, versions 8.2 and 9.1
* XenServer VM Tools for Windows, versions 9.3 and 9.4
* Other Xen drivers

It is included in the installation CD of XCP-ng Windows PV Tools 9.1 and above.

To use XenClean, simply run the `Invoke-XenClean.ps1` script **as Administrator**. Your system will automatically reboot.

**Note**: You should disable the "Manage Citrix PV drivers via Windows Update" option on your VM before running XenClean. Otherwise, Windows may reinstall PV drivers from Windows Update after rebooting.

**Note**: If you downloaded XenClean from the internet, you may need to unblock the script file before running it. This can be done by right-clicking the file, then choosing **Properties** - **Unblock** - **OK**.

**Tip**: XenClean leaves its log files at `%TEMP%\xenclean-<time>`. Please provide these logs in case of uninstallation failure.

## Windows fails to boot (hanging at boot, BSOD with Stop code `INACCESSIBLE_BOOT_DEVICE`)

In some situations (failed uninstallation, major Windows version upgrades), Xen PV drivers (whether Citrix or XCP-ng) may cause Windows to fail to start (hanging at boot, BSOD with Stop code `INACCESSIBLE_BOOT_DEVICE`).
The XenBootFix utility included with XCP-ng Windows PV Tools 9.1 and above helps you disable any active Xen PV drivers and get your system to a bootable state before running XenClean.

**Note**: The utility only runs in Windows Preinstallation Environment (PE) or Windows Recovery Environment (RE). It will not run from Safe Mode.

Below is a procedure for using XenBootFix to recover a non-booting VM:

1. Boot into Windows PE or Windows RE in command line-only mode. There are a few ways to accomplish this:
  * If your Windows installation BSODs on boot multiple times, it will automatically boot into Windows RE. Choose **Troubleshoot** - **Command Prompt**.
  * When running Windows Server, press **F8** before Windows starts, then choose **Repair Your Computer**. Choose **Troubleshoot** - **Command Prompt**.
  * Boot your VM using a Windows Setup or Windows PE CD image. If you don't see a command line, press **Shift+F10**.
2. Identify your Windows installation drive letter.
  * Use the `dir` command to list files in a given drive letter. For example: `dir C:\` (the backslash is required)
  * In some cases, your Windows partition should already be mounted. Try the first few letters (`C:`, `D:`, `E:`).
  * If you cannot find your Windows drive letter, you may need to assign a new drive letter with Diskpart.
    * Type `diskpart` at the command line. The command prompt should change to `DISKPART>`
    * Type `list vol` then make a note of your Windows partition and its drive letter (if any).
    * If your Windows partition does not have a drive letter, type `sel vol N` where `N` is the volume number shown in Diskpart, then type `assign letter=W`. Your Windows partition will be assigned the drive letter `W:`.
    * Finally, at the `DISKPART>` prompt, type `exit` to exit Diskpart.
3. Obtain XenBootFix.
  * If you're using XCP-ng Windows PV Tools 9.1 or later, it is located at `W:\Program Files\XCP-ng\Windows PV Drivers\XenBootFix\XenBootFix.exe` where `W:` is your Windows drive letter.
  * If you have PowerShell, run the following command: `Invoke-WebRequest https://<download path of XenBootFix.exe> -OutFile XenBootFix.exe`
  * Failing all that, you can create a new ISO image containing XenBootFix using WinCDEmu, ImgBurn or a similar tool, then attach it to your VM.
  * **Note**: If using Windows PE, do not remove its CD image when it's running. You may encounter unexpected errors otherwise.
4. Run the command `<path to XenBootFix.exe> W:\Windows` where `W:` is your Windows drive letter.
  * **Note**: Make sure the drive letter belongs to your actual Windows installation and not Windows PE/RE. By default, Windows PE/RE use the drive letter **X:**.
5. Type `exit` to close Command Prompt. If using Windows RE, choose **Continue** to boot into Windows. Windows should now start normally.
6. **You must immediately run XenClean from within Windows to remove the remaining Xen drivers**. See instructions above.
