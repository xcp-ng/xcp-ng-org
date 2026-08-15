---
sidebar_position: 2
---

# Create and manage VMs

Creating, cloning and deleting virtual machines on XCP-ng.

:::tip
The most comfortable way to create and manage VMs is [Xen Orchestra](../management/manage-at-scale/xo-web-ui.md) (or [XO Lite](../management/manage-locally/xo-lite.md) directly from your host, for simple cases). The `xe` commands below are useful for scripting and automation. See also [infrastructure as code](../management/infrastructure-as-code.md) for Terraform/OpenTofu, Packer and Ansible.
:::

## Create a VM {#create-a-vm}

### From a template + ISO

The usual workflow: pick the [template](templates.md) matching the guest OS, give the VM resources, attach an installation ISO, install the OS, then install the [guest tools](vms.md#guest-tools).

From Xen Orchestra: **New** → **VM**, pick the pool, template, name, CPU/RAM, disks and network, select the ISO, and create. ISOs come from an [ISO SR](../storage/storage.md#iso-sr).

With `xe`:

<Terminal shell title="root@xcp-ng-host — From a template + ISO">{`
# Find the right template
xe template-list params=name-label | grep -i debian

# Create the VM from it
xe vm-install template="Debian Bookworm 12" new-name-label="my-vm"

# Attach the install ISO and a network interface
xe vm-cd-add vm="my-vm" cd-name="debian-12.iso" device=3
xe vif-create vm-uuid=<vm-uuid> network-uuid=<network-uuid> device=0

# Start it and install the OS through the console
xe vm-start vm="my-vm"
`}</Terminal>

`vm-install` creates the disks defined by the template on the default SR; add `sr-uuid=` to choose another one.

### From a cloud image

For cloud-ready images (Ubuntu cloud images, Debian genericcloud…), import the image as a disk and configure it at first boot with cloud-init: see the [custom templates guide](../guides/create-use-custom-xcpng-ubuntu-templates.md) and Xen Orchestra's cloud-init support in the [cloud features page](../management/cloud.md).

### By cloning

See [clone or copy](#clone-or-copy-a-vm) below: cloning an installed and prepared VM (or a [template](templates.md) made from it) is the fastest way to mass-produce VMs.

### By importing

Import an existing VM (XVA, OVA, or disks from another hypervisor): see [import and export](import-export.md) and [migrate to XCP-ng](../installation/migrate-to-xcp-ng.md).

## Clone or copy a VM {#clone-or-copy-a-vm}

Two different operations:

* **Clone** (`xe vm-clone`): near-instant on SRs supporting copy-on-write: the clone shares its base disk with the original ("fast clone" in Xen Orchestra). Ideal to spin up many VMs from one source on the same SR.
* **Copy** (`xe vm-copy`): full independent copy of the disks, optionally to a **different SR**. Slower, but the result doesn't share anything with the source ("full copy" in Xen Orchestra).

<Terminal shell title="root@xcp-ng-host — Clone or copy a VM">{`
xe vm-clone vm="my-vm" new-name-label="my-vm-clone"
xe vm-copy vm="my-vm" new-name-label="my-vm-copy" sr-uuid=<destination-sr-uuid>
`}</Terminal>

The source VM must be halted (or use a [snapshot](snapshots.md) of a running VM as the source).

:::warning
Clones inherit everything from the source, including hostname, SSH host keys, and machine IDs. For anything you plan to clone repeatedly, prepare the source first (for Linux: reset `/etc/machine-id`, SSH host keys, static IPs; for Windows: use `sysprep`). Details in the [templates page](templates.md).
:::

## Start, stop, reboot {#start-stop-reboot}

From Xen Orchestra or XO Lite, use the VM's action buttons. With `xe`:

<Terminal shell title="root@xcp-ng-host — Start, stop, reboot">{`
xe vm-start vm="my-vm"
xe vm-shutdown vm="my-vm"            # clean shutdown, needs guest tools
xe vm-reboot vm="my-vm"
xe vm-shutdown vm="my-vm" force=true # hard power-off, last resort
`}</Terminal>

A clean shutdown/reboot requires working [guest tools](vms.md#guest-tools) in the VM. You can also suspend a VM to disk (`xe vm-suspend` / `xe vm-resume`): its memory is written to the default SR and the VM stops consuming RAM.

To start VMs automatically when the host boots, see the [autostart guide](../guides/autostart-vm.md). To choose *which host* a VM should preferably run on, set its affinity host (`xe vm-param-set uuid=<vm-uuid> affinity=<host-uuid>`). See [VM load balancing](../management/vm-load-balancing.md) for dynamic placement.

## Protect a VM against accidental deletion {#protect-a-vm-against-accidental-deletion}

You can block specific operations on any VM, including deletion:

<Terminal shell title="root@xcp-ng-host — Protect a VM against accidental…">{`
xe vm-param-set uuid=<vm-uuid> blocked-operations:destroy=true
`}</Terminal>

Anyone (or any script) trying to delete the VM will get an error until the block is removed:

<Terminal shell title="root@xcp-ng-host — Protect a VM against accidental…">{`
xe vm-param-remove uuid=<vm-uuid> param-name=blocked-operations param-key=destroy
`}</Terminal>

## VM groups with a start order (vApps) {#vapps}

XAPI can group VMs into an *appliance* (also called vApp): a set of VMs started together, in a defined order, with delays between them. Typical use: bring a database up before the application servers. The group is also what [HA](../management/ha.md) and DR tooling can recover as a unit.

<Terminal shell title="root@xcp-ng-host — VM groups with a start order…">{`
xe appliance-create name-label="my-app"
xe vm-param-set uuid=<vm-uuid> appliance=<appliance-uuid> order=1 start-delay=30
xe appliance-start uuid=<appliance-uuid>
`}</Terminal>

See the [appliance commands](../appendix/cli_reference.md#appliance-commands) in the CLI reference.

## Delete a VM {#delete-a-vm}

From Xen Orchestra, deleting a VM lets you choose whether to also remove its disks and snapshots. With `xe`:

<Terminal shell title="root@xcp-ng-host — Delete a VM">{`
xe vm-uninstall vm="my-vm"           # deletes the VM and the disks marked for destruction
xe vm-destroy uuid=<vm-uuid>         # deletes the VM record only, leaves the disks
`}</Terminal>

A VM must be halted before deletion. Remember that its snapshots are separate objects: list them with `xe snapshot-list snapshot-of=<vm-uuid>` and clean them up too, or the space won't be freed (see [snapshots](snapshots.md)).
