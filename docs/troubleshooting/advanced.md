# Advanced host troubleshooting

Techniques for the hard cases: a host that doesn't boot, kernel or hypervisor crashes, and getting diagnostics out of a machine you can barely reach. For everyday issues, start with the [3-Step-Guide](troubleshooting.md) and the [log files page](log-files.md).

## 🧵 Serial console access {#serial-console-access}

When the network is down or the host hangs at boot, a serial console is often the only way in. Most servers expose it through the BMC (Serial-over-LAN with iDRAC, iLO, IPMI `ipmitool sol activate`...), which makes it usable remotely.

To make XCP-ng talk on the first serial port, run these on the host and reboot:

<Terminal shell title="root@xcp-ng-host — Serial console access">{`
/opt/xensource/libexec/xen-cmdline --set-xen "com1=115200,8n1 console=com1,vga"
/opt/xensource/libexec/xen-cmdline --set-dom0 "console=hvc0 console=tty0"
`}</Terminal>

* The first line makes the Xen hypervisor output its messages on serial (and keeps VGA).
* The second makes the dom0 kernel and login prompt available there too (`hvc0` is the Xen virtual console, bridged to serial by the hypervisor).

To get a login prompt on it, enable the getty once:

<Terminal shell title="Serial console access">{`
systemctl enable --now serial-getty@hvc0.service
`}</Terminal>

`xen-cmdline` edits the boot configuration for both BIOS and UEFI installs, so you don't have to touch `grub.cfg` by hand.

## ⚙️ Xen boot options {#xen-boot-options}

The same `xen-cmdline` tool manages the hypervisor's boot parameters:

<Terminal shell title="root@xcp-ng-host — Xen boot options">{`
/opt/xensource/libexec/xen-cmdline --list-xen
/opt/xensource/libexec/xen-cmdline --set-xen "loglvl=all guest_loglvl=all"
/opt/xensource/libexec/xen-cmdline --delete-xen loglvl
`}</Terminal>

Raising `loglvl`/`guest_loglvl` to `all` is the classic first step when chasing hypervisor-level problems: it makes `xl dmesg` much more talkative. Only add options you understand (or that support/developers asked for): a wrong hypervisor parameter can make the host unbootable, which is exactly what the serial console above is for.

## 🔍 Reading the hypervisor state {#reading-the-hypervisor-state}

* `xl dmesg`: the Xen hypervisor's own log ring (distinct from dom0's `dmesg`). Hardware issues, IOMMU errors and guest faults often show up only here.
* `xl info`: hypervisor version, memory, capabilities.
* **Debug keys**: Xen can dump internal state on demand into `xl dmesg`:

<Terminal shell title="root@xcp-ng-host — Reading the hypervisor state">{`
xl debug-keys q     # dump domain and vCPU states
xl debug-keys m     # dump memory information
xl debug-keys h     # list all available keys in xl dmesg
`}</Terminal>

## 💥 Host crashes and crash dumps {#host-crashes-and-crash-dumps}

If the host crashes at the kernel or hypervisor level, a crash dump is saved in `/var/crash` at the following reboot (see [kernel crash logs](log-files.md#kernel-crash-logs)). List them also via XAPI:

<Terminal shell title="root@xcp-ng-host — Host crashes and crash dumps">{`
xe host-crashdump-list
`}</Terminal>

When reporting such a crash (forum or support), provide the crash dump contents along with a [status report](log-files.md#produce-a-status-report). Crash dumps live on the boot disk: don't let them accumulate, `xe host-crashdump-destroy uuid=<uuid>` cleans them up once analyzed.

## 🥾 When the host doesn't boot {#when-the-host-doesnt-boot}

1. At the boot menu, try the **fallback entries** (previous kernel version) if an update or driver change preceded the failure. See also [after upgrade troubleshooting](after-upgrade.md).
2. Watch the boot on the serial console (above) or the BMC's remote screen: the last messages usually name the culprit (storage driver, network driver...).
3. You can boot the [installation ISO](installation-upgrade.md) and use its shell for repairs: your root filesystem can be mounted from there (the installer's rescue capabilities are also usable over [remote access during installation](installation-upgrade.md#getting-remote-access-to-host-during-installation)).
4. For RAID-related boot failures, see [software RAID issues](storage/disk-failure-software-RAID.md).

## 🆘 Produce a status report {#produce-a-status-report}

When asking for help, generate a status report archive containing logs and configuration: see [the procedure](log-files.md#produce-a-status-report). Mention exactly what you changed last: most "impossible" host issues follow a recent change.
