# Log files

On a XCP-ng host, like in most Linux/UNIX systems, the logs are located in `/var/log`. XCP-ng does not use `journald` for logs, so everything is in `/var/log` directly.

## General log

`/var/log/daemon.log`

Output of various running daemons involved in XCP-ng's tasks. Examples: output of `xenopsd` which handles the communication with the VMs, of executables involved in live migration and storage motion, and more...

## XAPI's log

`/var/log/xensource.log`

Contains the output of the XAPI toolstack.

## Storage related (eg. coalescing snapshots)

`/var/log/SMlog`

Contains the output of the storage manager.

## Kernel messages

For hardware related issues or system crashes.

`/var/log/kern.log`

All kernel logs since last boot: type `dmesg`.

## Kernel crash logs

In case of a host crash, if it is kernel-related, you should find logs in `/var/crash`

## Produce a status report

To help someone else identify an issue or reproduce a bug, you can generate a full status report containing all log files, details about your configuration and more.

```
xen-bugtool --yestoall
```

Then upload the resulting archive somewhere. It may contain sensitive information about your setup, so it may be better to upload it to a private area and give the link only to those you trust to analyze it.


## XCP-ng Center

You can display the log files via menu `Help` -> `View XCP-ng Center Log Files`.

The log files are located in `C:\Users\<user>\AppData\Roaming\XCP-ng\XCP-ng Center\logs`.

## Windows VM

### (PV-)Driver install log
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