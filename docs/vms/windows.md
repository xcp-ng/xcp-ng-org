---
sidebar_position: 8
---

# Windows VMs

The Windows-specific parts of a VM's life on XCP-ng: creation choices, golden images with sysprep, in-place Windows upgrades, and where to go when something breaks. The [guest tools themselves are covered in detail here](vms.md#windows-guest-tools).

## Creating a Windows VM {#creating-a-windows-vm}

Follow the [normal VM creation workflow](vm-lifecycle.md), with these Windows-specific points:

* **Pick the template matching your Windows version**: it sets the right firmware and device defaults.
* **Windows 11 and Windows Server 2025** require UEFI with [Secure Boot](../guides/guest-UEFI-Secure-Boot.md) and a [vTPM](advanced.md#vtpm) (XCP-ng 8.3). The Windows 11 template configures this for you.
* The firmware type (BIOS/UEFI) [cannot be changed after installation](advanced.md#bios-vs-uefi-firmware), so don't create new Windows VMs in BIOS mode unless you have a specific reason.
* Install the [Windows guest tools](vms.md#windows-guest-tools) right after the OS installation, and read that section first: the choice between XCP-ng and XenServer tools, and the Windows Update behavior around drivers, matter.

## Golden image with sysprep {#golden-image-with-sysprep}

Windows machines carry a unique identity. To build a [template](templates.md) you'll clone many VMs from:

1. Install Windows, the guest tools, your applications and updates in a source VM.
2. Generalize it with sysprep, which removes the machine-specific identity and shuts the VM down:

```
C:\Windows\System32\Sysprep\sysprep.exe /generalize /oobe /shutdown
```

3. Convert the halted VM into a [custom template](templates.md#create-a-custom-template).
4. Each VM created from it goes through Windows' first-boot setup (OOBE) with its own identity; automate that part with an unattend file if you deploy at scale.

The guest tools survive sysprep: install them before generalizing, not after cloning.

## Upgrading Windows in place {#upgrading-windows-in-place}

Upgrading the Windows version *inside* an existing VM (e.g. Windows Server 2019 to 2022) works like on physical hardware, with these precautions:

1. Take a [snapshot](snapshots.md) first, so you can roll back a failed upgrade in seconds.
2. Update the [guest tools](vms.md#windows-guest-tools) to the latest version **before** upgrading the OS, so the drivers in place are the ones best supporting the newer Windows.
3. Run the new version's installer/upgrade from within the guest, as Microsoft documents it.
4. After the upgrade, check in the Device Manager that the PV drivers are still active, and that the management agent reports to XAPI (the VM's IP address visible in Xen Orchestra is a good sign).

:::warning
An upgrade to **Windows 11** has hardware requirements (UEFI, Secure Boot, TPM) that a VM created in BIOS mode cannot meet, since the [firmware can't be switched](advanced.md#bios-vs-uefi-firmware) after installation. For those, create a fresh UEFI + vTPM VM and migrate the data instead.
:::

## Console access {#console-access}

The console in Xen Orchestra/XO Lite works from the first boot, with no guest configuration. For day-to-day use, enable Remote Desktop inside the guest and connect with your usual RDP client; the XO console remains your out-of-band access when the network is down. About resolution tuning, see [managing screen resolution](vms.md#manage-screen-resolution).

## When Windows misbehaves {#when-windows-misbehaves}

* Boot failures, BSODs, storage performance, drivers not updating: see the dedicated [Windows guest tools troubleshooting](../troubleshooting/windows-pv-tools.md) page, including [how to gather kernel memory dumps](../troubleshooting/windows-pv-tools.md#how-to-gather-kernel-memory-dumps-for-in-depth-troubleshooting) for support cases.
* Automating PV driver updates through Group Policy: see [this guide](../guides/winpv-update.md).
* Secure Boot issues: see the [Secure Boot guide](../guides/guest-UEFI-Secure-Boot.md#troubleshoot-guest-secure-boot-issues).
