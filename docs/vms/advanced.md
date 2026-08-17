---
sidebar_position: 7
---

# Advanced VM settings

Less common VM-level settings and behaviors: boot options, vTPM, time handling.

## Boot options {#boot-options}

### Boot device order

The virtual firmware tries boot devices in the order given by the `order` boot parameter, a string of `c` (disk), `d` (CD/DVD), `n` (network/PXE):

<Terminal shell title="root@xcp-ng-host — Boot device order">{`
xe vm-param-set uuid=<vm-uuid> HVM-boot-params:order=dc
`}</Terminal>

Xen Orchestra exposes this in the VM's **Advanced** tab (boot order). To install a VM from the network, set `n` first and boot it: the VM's virtual NIC does PXE like a physical machine.

### BIOS vs UEFI firmware

The firmware type (BIOS or UEFI) is chosen at VM creation, from the template or the creation form. Switching an **installed** guest between BIOS and UEFI is not supported: the guest OS bootloader setup differs. Create the VM with the right firmware from the start; UEFI is the default for modern guests and required for [Secure Boot](../guides/guest-UEFI-Secure-Boot.md) and Windows 11.

To check a VM's firmware from the CLI:

<Terminal shell title="root@xcp-ng-host — BIOS vs UEFI firmware">{`
xe vm-param-get uuid=<vm-uuid> param-name=HVM-boot-params
xe vm-param-get uuid=<vm-uuid> param-name=platform param-key=device-model
`}</Terminal>

See also [how to check UEFI/Secure Boot status](../guides/guest-UEFI-Secure-Boot.md#misc).

## vTPM {#vtpm}

Starting with XCP-ng 8.3, VMs can have a **virtual TPM 2.0**, required for Windows 11 and Windows Server 2025, and usable by Linux guests too.

* From Xen Orchestra: the Windows 11 template enables it automatically; you can also toggle "vTPM" in the VM creation form or in the VM's Advanced tab (VM halted).
* With `xe`, on a halted VM:

<Terminal shell title="root@xcp-ng-host — vTPM">{`
xe vtpm-create vm-uuid=<vm-uuid>
`}</Terminal>

Notes:

* The vTPM state is stored with the pool metadata, not on a disk: it follows the VM in exports and backups made by Xen Orchestra.
* If the guest uses the TPM for disk encryption (e.g. BitLocker), **keep your recovery keys safe**: losing the vTPM state means the guest can't unseal its keys.
* Suspending or checkpointing (RAM snapshot) a vTPM-equipped VM is not supported.

## Time in VMs {#time-in-vms}

Guests get their initial clock from the host, then keep time themselves. Recommendations:

* Keep the **hosts** correctly synchronized first: see [NTP configuration](../management/hosts-pools.md#time-synchronization-ntp).
* Run an NTP client **in each guest** (chrony, systemd-timesyncd, Windows Time). Time drifts after live migrations, suspend/resume or snapshots revert are then corrected automatically.
* **Windows** stores local time in the RTC by default. XCP-ng exposes a UTC clock, so either keep Windows' own time service active (default, recommended) or make Windows use UTC. If a Windows VM shows a fixed offset after boot, check the timezone settings in the guest.

## Blocking operations on a VM {#blocking-operations-on-a-vm}

Any XAPI operation can be administratively blocked per VM (deletion, but also start, shutdown, migration…):

<Terminal shell title="root@xcp-ng-host — Blocking operations on a VM">{`
xe vm-param-set uuid=<vm-uuid> blocked-operations:migrate_send=true
`}</Terminal>

See [protecting a VM against accidental deletion](vm-lifecycle.md#protect-a-vm-against-accidental-deletion) for the most common use.

## VM memory {#vm-memory}

A VM's memory is defined by four values: static min/max (the hard bounds, changed only while the VM is halted) and dynamic min/max (the range the VM can be ballooned within, at runtime). When dynamic min = dynamic max, the VM simply owns that amount: this is the recommended setup for predictable performance, and the [caution about Dynamic Memory Control](vms.md#dynamic-memory) explains why.

<Terminal shell title="root@xcp-ng-host — VM memory">{`
xe vm-param-list uuid=<vm-uuid> | grep memory      # current values
xe vm-memory-limits-set vm=<vm> static-min=2GiB dynamic-min=8GiB dynamic-max=8GiB static-max=8GiB
xe vm-memory-set vm=<vm> memory=8GiB               # shortcut: all four to the same value
`}</Terminal>

Xen Orchestra exposes the same in the VM's Advanced tab ("VM limits"). Remember that the host also needs memory for dom0 and the Xen overhead: see the [dom0 memory guide](../guides/dom0-memory.md).
