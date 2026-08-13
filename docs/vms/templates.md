---
sidebar_position: 3
heading_emoji:
  two-kinds-of-templates: mortar_board
  create-a-custom-template: camera_flash
  prepare-the-source-before-templating: soap
  create-vms-from-a-template: rocket
  move-templates-around: package
  delete-a-custom-template: wastebasket
---

# Templates

Templates are the blueprint VMs are created from: they define the virtual hardware (firmware type, devices, memory defaults…) and, optionally, pre-installed disk content.

## Two kinds of templates {#two-kinds-of-templates}

* **Built-in templates**: shipped with XCP-ng, one per supported guest OS family. They contain **no disk content**: they only carry the right virtual hardware settings and optimizations for that OS (device model, boot mode, memory defaults…). You install the OS yourself from an ISO or network. Always create a VM from the template matching its OS: this is what guarantees the best defaults.
* **Custom templates**: created by you from an existing VM or snapshot. They include the **disks' content**, so new VMs start as exact copies. This is the classic "golden image" workflow.

List available templates:

<Terminal shell title="root@xcp-ng-host — Two kinds of templates">{`
xe template-list params=name-label
`}</Terminal>

:::tip
If built-in templates are missing (e.g. after an incomplete upgrade), see [this troubleshooting entry](../troubleshooting/common-problems.md#missing-templates-when-creating-a-new-vm).
:::

## Create a custom template {#create-a-custom-template}

### From a VM

Halt the VM, then in Xen Orchestra use **Convert to template** (VM advanced tab). With `xe`, converting is a one-way flag flip:

<Terminal shell title="root@xcp-ng-host — From a VM">{`
xe vm-param-set uuid=<vm-uuid> is-a-template=true
`}</Terminal>

If you want to keep the original VM, clone it first and convert the clone.

### From a snapshot

A [snapshot](snapshots.md) of a running VM can become a template without ever stopping the source VM: in Xen Orchestra, snapshot list → **create template from snapshot**, or:

<Terminal shell title="root@xcp-ng-host — From a snapshot">{`
xe snapshot-export-to-template snapshot-uuid=<snapshot-uuid> filename=my-template.xva
xe vm-import filename=my-template.xva preserve=true
`}</Terminal>

## Prepare the source before templating {#prepare-the-source-before-templating}

New VMs created from a custom template are clones: anything unique to the source machine gets duplicated. Before converting a source VM into a template:

* **Linux**: clear `/etc/machine-id`, remove SSH host keys (they'll regenerate at boot with most distros), remove static network configuration, clean logs and package caches. Even better, install `cloud-init` so each new VM configures its hostname, users and network at first boot. Xen Orchestra has first-class cloud-init support (see [cloud features](../management/cloud.md)).
* **Windows**: run `sysprep /generalize` so each clone gets its own machine identity.

A full worked example (cloud image → prepared VM → template → new VMs) is in the [Ubuntu custom templates guide](../guides/create-use-custom-xcpng-ubuntu-templates.md).

## Create VMs from a template {#create-vms-from-a-template}

From Xen Orchestra: **New** → **VM** and pick your template: custom templates appear alongside built-in ones. With `xe`:

<Terminal shell title="root@xcp-ng-host — Create VMs from a template">{`
xe vm-install template="my-golden-image" new-name-label="new-vm" sr-uuid=<sr-uuid>
`}</Terminal>

For repeated or automated deployments, drive this with [Terraform/OpenTofu, Packer or Ansible](../management/infrastructure-as-code.md).

## Move templates around {#move-templates-around}

Templates export and import like VMs, in XVA format, which is handy to copy a golden image to another pool:

<Terminal shell title="root@xcp-ng-host — Move templates around">{`
xe template-export template-uuid=<template-uuid> filename=my-template.xva
xe vm-import filename=my-template.xva preserve=true
`}</Terminal>

Or from Xen Orchestra, export/import from the template's view (see [import and export](import-export.md)).

## Delete a custom template {#delete-a-custom-template}

In Xen Orchestra, from the templates list (Home → VMs → templates filter). With `xe`:

<Terminal shell title="root@xcp-ng-host — Delete a custom template">{`
xe template-uninstall template-uuid=<template-uuid>
`}</Terminal>

This also removes the template's disks (after confirmation).
