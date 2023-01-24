# xe command reference

The list of all `xe` commands.

This section groups the commands by the objects that the command addresses. These objects are listed alphabetically.

:::tip
This section is in construction
:::


## Appliance commands

Commands for creating and modifying VM appliances (also known as vApps).

### Appliance parameters

Appliance commands have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The appliance uuid|Required|
|`name-description`|The appliance description|Optional|
|`paused`| |Optional|
|`force`|Force shutdown|Optional|

### `appliance-assert-can-be-recovered`

```
appliance-assert-can-be-recovered uuid=appliance-uuid database:vdi-uuid=vdi-uuid
```

Tests whether storage is available to recover this VM appliance/vApp.

### `appliance-create`

```
appliance-create name-label=name-label [name-description=name-description]
```

Creates an appliance/vApp. For example:

```
xe appliance-create name-label=my_appliance
```

Add VMs to the appliance:

```
xe vm-param-set uuid=VM-UUID appliance=appliance-uuid
```

### `appliance-destroy`

```
appliance-destroy uuid=appliance-uuid
```

Destroys an appliance/vApp. For example:

```
xe appliance-destroy uuid=appliance-uuid
```

### `appliance-recover`

```
appliance-recover uuid=appliance-uuid database:vdi-uuid=vdi-uuid [paused=true|false]
```

Recover a VM appliance/vApp from the database contained in the supplied VDI.

### `appliance-shutdown`

```
appliance-shutdown uuid=appliance-uuid [force=true|false]
```

Shuts down all VMs in an appliance/vApp. For example:

```
xe appliance-shutdown uuid=appliance-uuid
```

### `appliance-start`

```
appliance-start uuid=appliance-uuid [paused=true|false]
```

Starts an appliance/vApp. For example:

```
xe appliance-start uuid=appliance-uuid
```

## Audit commands

Audit commands download all of the available records of the RBAC audit file in the pool. If the optional parameter `since` is present, it downloads only the records from that specific point in time.

### `audit-log-get` parameters

`audit-log-get` has the following parameters

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`filename`|Write the audit log of the pool to *file name*|Required|
|`since`|Specific date/time point|Optional|

### `audit-log-get`

```
audit-log-get [since=timestamp] filename=filename
```

For example, to obtain audit records of the pool since a precise millisecond timestamp, run the following command:

Run the following command:

```
xe audit-log-get since=2009-09-24T17:56:20.530Z filename=/tmp/auditlog-pool-actions.out
```

## Bonding commands

Commands for working with network bonds, for resilience with physical interface failover. For more information, see the [Networking](../../networking/) section.

The bond object is a reference object which glues together *master* and *member* PIFs. The master PIF is the bonding interface which must be used as the overall PIF to refer to the bond. The member PIFs are a set of two or more physical interfaces that have been combined into the high-level bonded interface.

## Bond parameters

Bonds have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|Unique identifier/object reference for the bond|Read only|
|`master`|UUID for the master bond PIF|Read only|
|`members`|Set of UUIDs for the underlying bonded PIFs|Read only|

### `bond-create`

```
bond-create network-uuid=network_uuid pif-uuids=pif_uuid_1,pif_uuid_2,...
```

Create a bonded network interface on the network specified from a list of existing PIF objects. The command fails in any of the following cases:

-   If PIFs are in another bond already
-   If any member has a VLAN tag set
-   If the referenced PIFs are not on the same XCP-ng server
-   If fewer than 2 PIFs are supplied

### `bond-destroy`

```
bond-destroy uuid=bond_uuid
```

Deletes a bonded interface specified by its UUID from a host.

### `bond-set-mode`

```
bond-set-mode uuid=bond_uuid mode=bond_mode
```

Change the bond mode.

## CD commands

Commands for working with physical CD/DVD drives on XCP-ng servers.

## CD parameters

CDs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|Unique identifier/object reference for the CD|Read only|
|`name-label`|Name for the CD|Read/write|
|`name-description`|Description text for the CD|Read/write|
|`allowed-operations`|A list of the operations that can be performed on this CD|Read only set parameter|
|`current-operations`|A list of the operations that are currently in progress on this CD|Read only set parameter|
|`sr-uuid`|The unique identifier/object reference for the SR this CD is part of|Read only|
|`sr-name-label`|The name for the SR this CD is part of|Read only|
|`vbd-uuids`|A list of the unique identifiers for the VBDs on VMs that connect to this CD|Read only set parameter|
|`crashdump-uuids`|Not used on CDs. Because crashdumps cannot be written to CDs|Read only set parameter|
|`virtual-size`|Size of the CD as it appears to VMs (in bytes)|Read only|
|`physical-utilisation`|Amount of physical space that the CD image takes up on the SR (in bytes)|Read only|
|`type`|Set to User for CDs|Read only|
|`sharable`|Whether or not the CD drive is shareable. Default is `false`.|Read only|
|`read-only`|Whether the CD is read-only, if `false`, the device is writable. Always true for CDs.|Read only|
|`storage-lock`|Value is `true` if this disk is locked at the storage level.|Read only|
|`parent`|Reference to the parent disk, if this CD is part of a chain.|Read only|
|`missing`|Value is `true` if SR scan operation reported this CD as not present on disk|Read only|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the CD|Read/write map parameter|
|`location`|The path on which the device is mounted|Read only|
|`managed`|Value is `true` if the device is managed|Read only|
|`xenstore-data`|Data to be inserted into the `xenstore` tree|Read only map parameter|
|`sm-config`|Names and descriptions of storage manager device config keys|Read only map parameter|
|`is-a-snapshot`|Value is `true` if this template is a CD snapshot|Read only|
|`snapshot_of`|The UUID of the CD that this template is a snapshot of|Read only|
|`snapshots`|The UUIDs of any snapshots that have been taken of this CD|Read only|
|`snapshot_time`|The timestamp of the snapshot operation|Read only|

### `cd-list`

```
cd-list [params=param1,param2,...] [parameter=parameter_value]
```

List the CDs and ISOs (CD image files) on the XCP-ng server or pool, filtering on the optional argument `params`.

If the optional argument `params` is used, the value of params is a string containing a list of parameters of this object that you want to display. Alternatively, you can use the keyword `all` to show all parameters. When `params` is not used, the returned list shows a default subset of all available parameters.

Optional arguments can be any number of the [CD parameters](#cd-parameters) listed at the beginning of this section.

## Cluster commands

:::warning
Cluster doesn't work with XCP-ng, but only with Citrix Hypervisor Please do NOT use it!
:::

## Console commands

Commands for working with consoles.

The console objects can be listed with the standard object listing command (`xe console-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands).

## Console parameters

Consoles have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the console|Read only|
|`vm-uuid`|The unique identifier/object reference of the VM this console is open on|Read only|
|`vm-name-label`|The name of the VM this console is open on|Read only|
|`protocol`|Protocol this console uses. Possible values are `vt100`: VT100 terminal, `rfb`: Remote Framebuffer Protocol (as used in VNC), or `rdp`: Remote Desktop Protocol|Read only|
|`location`|URI for the console service|Read only|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the console.|Read/write map parameter|

### `console`

```
console
```

Attach to a particular console.

## Diagnostic commands

Commands for gathering diagnostic information from XCP-ng.

### `diagnostic-compact`

```
diagnostic-compact
```

Perform a major GC collection and heap compaction.

### `diagnostic-db-log`

```
diagnostic-db-log
```

Start logging the database operations. Warning: once started, this cannot be stopped.

### `diagnostic-db-stats`

```
diagnostic-db-stats
```

Print database statistics.

### `diagnostic-gc-stats`

```
diagnostic-gc-stats
```

Print GC statistics.

### `diagnostic-license-status`

```
diagnostic-license-status
```

Help diagnose pool-wide licensing problems.

### `diagnostic-net-stats`

```
diagnostic-net-stats [uri=uri] [method=method] [params=param1,param2...]
```

Print network statistics.

### `diagnostic-timing-stats`

```
diagnostic-timing-stats
```

Print timing statistics.

### `diagnostic-vdi-status`

```
diagnostic-vdi-status uuid=vdi_uuid
```

Query the locking and sharing status of a VDI.

### `diagnostic-vm-status`

```
diagnostic-vm-status uuid=vm_uuid
```

Query the hosts on which the VM can boot, check the sharing/locking status of all VBDs.

## Disaster recovery commands

Commands for recovering VMs after a disaster

### `drtask-create`

```
drtask-create type=type sr-whitelist=sr-white-list device-config=device-config
```

Creates a disaster recovery task. For example, to connect to an iSCSI SR in preparation for Disaster Recovery:

```
xe drtask-create type=lvmoiscsi device-config:target=target-ip-address device-config:targetIQN=targetIQN device-config:SCSIid=SCSIid sr-whitelist=sr-uuid-list
```

:::tip
The command `sr-whitelist` lists SR UUIDs. The `drtask-create` command only introduces and connects to an SR which has one of the whitelisted UUIDs
:::

### `drtask-destroy`

```
drtask-destroy uuid=dr-task-uuid
```

Destroys a disaster recovery task and forgets the introduced SR.

### `vm-assert-can-be-recovered`

```
vm-assert-can-be-recovered uuid=vm-uuid database:vdi-uuid=vdi-uuid
```

Tests whether storage is available to recover this VM.

### `appliance-assert-can-be-recovered`

```
appliance-assert-can-be-recovered uuid=appliance-uuid database:vdi-uuid=vdi-uuid
```

Checks whether the storage (containing the appliance’s/vAPP disk) is visible.

### `appliance-recover`

```
appliance-recover uuid=appliance-uuid database:vdi-uuid=vdi-uuid [force=true|false]
```

Recover an appliance/vAPP from the database contained in the supplied VDI.

### `vm-recover`

```
vm-recover uuid=vm-uuid database:vdi-uuid=vdi-uuid [force=true|false]
```

Recovers a VM from the database contained in the supplied VDI.

### `sr-enable-database-replication`

```
sr-enable-database-replication uuid=sr_uuid
```

Enables XAPI database replication to the specified (shared) SR.

### `sr-disable-database-replication`

```
sr-disable-database-replication uuid=sr_uuid
```

Disables XAPI database replication to the specified SR.

#### Example usage

The example below shows the DR CLI commands in context:

On the primary site, enable database replication:

```
xe sr-database-replication uuid=sr=uuid
```

After a disaster, on the secondary site, connect to the SR. The `device-config` command has the same fields as `sr-probe`.

```
xe drtask-create type=lvmoiscsi device-config:target=target ip address device-config:targetIQN=target-iqn device-config:SCSIid=scsi-id sr-whitelist=sr-uuid
```

Look for database VDIs on the SR:

```
xe vdi-list sr-uuid=sr-uuid type=Metadata
```

Query a database VDI for VMs present:

```
xe vm-list database:vdi-uuid=vdi-uuid
```

Recover a VM:

```
xe vm-recover uuid=vm-uuid database:vdi-uuid=vdi-uuid
```

Destroy the DR task. Any SRs introduced by the DR task and not required by VMs are destroyed:

```
xe drtask-destroy uuid=drtask-uuid
```

## Event commands

Commands for working with events.

### Event classes

Event classes are listed in the following table:

|Class name|Description|
|:---------|:----------|
|`pool`|A pool of physical hosts|
|`vm`|A Virtual Machine|
|`host`|A physical host|
|`network`|A virtual network|
|`vif`|A virtual network interface|
|`pif`|A physical network interface (separate VLANs are represented as several PIFs)|
|`sr`|A storage repository|
|`vdi`|A virtual disk image|
|`vbd`|A virtual block device|
|`pbd`|The physical block devices through which hosts access SRs|

### `event-wait`

```
event-wait class=class_name [param-name=param_value] [param-name=/=param_value]
```

Blocks other commands from executing until an object exists that satisfies the conditions given on the command line. The argument `x=y` means "wait for field x to take value y" and `x=/=y` means "wait for field x to take any value other than y."

**Example:** wait for a specific VM to be running.

```
xe event-wait class=vm name-label=myvm power-state=running
```

Blocks other commands until a VM called `myvm` is in the `power-state` "running."

**Example:** wait for a specific VM to reboot:

```
xe event-wait class=vm uuid=$VM start-time=/=$(xe vm-list uuid=$VM params=start-time --minimal)
```

Blocks other commands until a VM with UUID *\$VM* reboots. The command uses the value of `start-time` to decide when the VM reboots.

The class name can be any of the [event classes](#event-classes) listed at the beginning of this section. The parameters can be any of the parameters listed in the CLI command *class*-param-list.

## GPU commands

Commands for working with physical GPUs, GPU groups, and virtual GPUs.

The GPU objects can be listed with the standard object listing commands: `xe pgpu-list`, `xe gpu-group-list`, and `xe vgpu-list`. The parameters can be manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands).

### Physical GPU parameters

Physical GPUS (pGPUs) have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the pGPU|Read only|
|`vendor-name`|The vendor name of the pGPU|Read only|
|`device-name`|The name assigned by the vendor to this pGPU model|Read only|
|`gpu-group-uuid`|The unique identifier/object reference for the GPU group that this pGPU has been automatically assigned to by XCP-ng. Identical pGPUs across hosts in a pool are grouped|Read only|
|`gpu-group-name-label`|The name of the GPU group to which the pGPU is assigned|Read only|
|`host-uuid`|The unique identifier/object reference for the XCP-ng server to which the pGPU is connected|Read only|
|`host-name-label`|The name of the XCP-ng server to which the pGPU is connected|Read only|
|`pci-id`|PCI identifier|Read only|
|`dependencies`|Lists the dependent PCI devices passed-through to the same VM|Read/write map parameter|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the pGPU|Read/write map parameter|
|`supported-VGPU-types`|List of virtual GPU types supported by the underlying hardware|Read only|
|`enabled-VGPU-types`|List of virtual GPU types which have been enabled for this pGPU|Read/Write|
|`resident-VGPUs`|List of vGPUs running on this pGPU|Read only|

### `pgpu-disable-dom0-access`

```
pgpu-disable-dom0-access uuid=uuid
```

Disable PGPU access to dom0.

### `pgpu-enable-dom0-access`

```
pgpu-enable-dom0-access uuid=uuid
```

Enable PGPU access to dom0.

### GPU group parameters

GPU groups have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the GPU group|Read only|
|`name-label`|The name of the GPU group|Read/write|
|`name-description`|The descriptive text of the GPU group|Read/write|
|`VGPU-uuids`|Lists the unique identifier/object references for the virtual GPUs in the GPU group|Read only set parameter|
|`PGPU-uuids`|Lists the unique identifier/object references for the pGPUs in the GPU group|Read only set parameter|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the GPU group|Read/write map parameter|
|`supported-VGPU-types`|Union of all virtual GPU types supported by the underlying hardware|Read only|
|`enabled-VGPU-types`|Union of all virtual GPU types which have been enabled on the underlying pGPUs|Read only|
|`allocation-algorithm`|Depth-first/Breadth-first setting for allocation virtual GPUs on pGPUs within the group|Read/write enum parameter|

### GPU group operations

Commands for working with GPU Groups

#### `gpu-group-create`

```
gpu-group-create name-label=name_for_group [name-description=description]
```

Creates a new (empty) GPU Group into which pGPUs can be moved.

#### `gpu-group-destroy`

```
gpu-group-destroy uuid=uuid_of_group
```

Destroys the GPU Group; only permitted for empty groups.

#### `gpu-group-get-remaining-capacity`

```
gpu-group-get-remaining-capacity uuid=uuid_of_group vgpu-type-uuid=uuid_of_vgpu_type
```

Returns how many more virtual GPUs of the specified type can be instantiated in this GPU Group.

#### `gpu-group-param-set`

```
gpu-group-param-set uuid=uuid_of_group allocation-algorithm=breadth-first|depth-first
```

Changes the algorithm that the GPU group uses to allocate virtual GPUs to pGPUs.

#### `gpu-group-param-get-uuid`

```
gpu-group-param-get-uuid uuid=uuid_of_group param-name=supported-vGPU-types|enabled-vGPU-types
```

Returns the supported or enabled types for this GPU Group.

### Virtual GPU parameters

Virtual GPUs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the virtual GPU|Read only|
|`vm-uuid`|The unique identifier/object reference for the VM to which the virtual GPU is assigned|Read only|
|`vm-name-label`|The name of the VM to which the virtual GPU is assigned|Read only|
|`gpu-group-uuid`|The unique identifier/object reference for the GPU group in which the virtual GPU is contained|Read only|
|`gpu-group-name-label`|The name of the GPU group in which the virtual GPU is contained|Read only|
|`currently-attached`|True if a VM with GPU Pass-Through is running, false otherwise|Read only|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the virtual GPU|Read/write map parameter|
|`type-uuid`|The unique identifier/object reference for the virtual GPU type of this virtual GPU|Read/write map parameter|
|`type-model-name`|Model name associated with the virtual GPU type|Read only|

### Virtual GPU type parameters

:::tip>
GPU Passthrough and virtual GPUs are not compatible with live migration, storage live migration, or VM Suspend unless supported software and graphics cards from GPU vendors are present. VMs without this support cannot be migrated to avoid downtime.
:::

Virtual GPU Types have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the virtual GPU type|Read only|
|`vendor-name`|Name of virtual GPU vendor|Read only|
|`model-name`|Model name associated with the virtual GPU type|Read only|
|`freeze-frame`|Frame buffer size of the virtual GPU type, in bytes|Read only|
|`max-heads`|Maximum number of displays supported by the virtual GPU type|Read only|
|`supported-on-PGPUs`|List of pGPUs that support this virtual GPU type|Read only|
|`enabled-on-PGPUs`|List of pGPUs that have this virtual GPU type enabled|Read only|
|`VGPU-uuids`|List of virtual GPUs of this type|Read only|

## Virtual GPU operations

#### `vgpu-create`

```
vgpu-create vm-uuid=uuid_of_vm gpu_group_uuid=uuid_of_gpu_group [vgpu-type-uuid=uuid_of_vgpu-type]
```

Creates a virtual GPU. This command attaches the VM to the specified GPU group and optionally specifies the virtual GPU type. If no virtual GPU type is specified, the ‘pass-through’ type is assumed.

#### `vgpu-destroy`

```
vgpu-destroy uuid=uuid_of_vgpu
```

Destroy the specified virtual GPU.

### Disabling VNC for VMs with virtual GPU

```
xe vm-param-add uuid=uuid_of_vmparam-name=platform vgpu_vnc_enabled=true|false
```

Using `false` disables the VNC console for a VM as it passes `disablevnc=1` through to the display emulator. By default, VNC is enabled.

## Host commands

Commands for interacting with XCP-ng server.

XCP-ng servers are the physical servers running XCP-ng software. They have VMs running on them under the control of a special privileged Virtual Machine, known as the control domain or domain 0.

The XCP-ng server objects can be listed with the standard object listing commands: `xe host-list`, `xe host-cpu-list`, and `xe host-crashdump-list`). The parameters can be manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands).

### Host selectors

Several of the commands listed here have a common mechanism for selecting one or more XCP-ng servers on which to perform the operation. The simplest is by supplying the argument `host=uuid_or_name_label`. You can also specify XCP-ng by filtering the full list of hosts on the values of fields. For example, specifying `enabled=true` selects all XCP-ng servers whose `enabled` field is equal to `true`. Where multiple XCP-ng servers match and the operation can be performed on multiple XCP-ng servers, you must specify `--multiple` to perform the operation. The full list of parameters that can be matched is described at the beginning of this section. You can obtain this list of commands by running the command `xe host-list params=all`. If no parameters to select XCP-ng servers are given, the operation is performed on all XCP-ng servers.

### Host parameters

XCP-ng servers have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the XCP-ng server|Read only|
|`name-label`|The name of the XCP-ng server|Read/write|
|`name-description`|The description string of the XCP-ng server|Read only|
|`enabled`|Value is `false` if disabled. This prevents any new VMs from starting on the hosts and prepares the hosts to be shut down or rebooted. Value is `true` if the host is enabled|Read only|
|`API-version-major`|Major version number|Read only|
|`API-version-minor`|Minor version number|Read only|
|`API-version-vendor`|Identification of API vendor|Read only|
|`API-version-vendor-implementation`|Details of vendor implementation|Read only map parameter|
|`logging`|Logging configuration|Read/write map parameter|
|`suspend-image-sr-uuid`|The unique identifier/object reference for the SR where suspended images are put|Read/write|
|`crash-dump-sr-uuid`|The unique identifier/object reference for the SR where crash dumps are put|Read/write|
|`software-version`|List of versioning parameters and their values|Read only map parameter|
|`capabilities`|List of Xen versions that the XCP-ng server can run|Read only set parameter|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the XCP-ng server|Read/write map parameter|
|`chipset-info`|A list of key/value pairs that specify information about the chipset|Read only map parameter|
|`hostname`|XCP-ng server host name|Read only|
|`address`|XCP-ng server IP address|Read only|
|`license-server`|A list of key/value pairs that specify information about the license server. Useless for XCP-ng!|Read only map parameter|
|`supported-bootloaders`|List of bootloaders that the XCP-ng server supports, for example, `pygrub`, `eliloader`|Read only set parameter|
|`memory-total`|Total amount of physical RAM on the XCP-ng server, in bytes|Read only|
|`memory-free`|Total amount of physical RAM remaining that can be allocated to VMs, in bytes|Read only|
|`host-metrics-live`|True if the host is operational|Read only|
|`logging`|The `syslog_destination` key can be set to the host name of a remote listening syslog service.|Read/write map parameter|
|`allowed-operations`|Lists the operations allowed in this state. This list is advisory only and the server state may have changed by the time a client reads this field.|Read only set parameter|
|`current-operations`|Lists the operations currently in process. This list is advisory only and the server state may have changed by the time a client reads this field.|Read only set parameter|
|`patches`|Set of host patches|Read only set parameter|
|`blobs`|Binary data store|Read only|
|`memory-free-computed`|A conservative estimate of the maximum amount of memory free on a host|Read only|
|`ha-statefiles`|The UUIDs of all HA state files|Read only|
|`ha-network-peers`|The UUIDs of all hosts that can host the VMs on this host if there is a failure|Read only|
|`external-auth-type`|Type of external authentication, for example, Active Directory.|Read only|
|`external-auth-service-name`|The name of the external authentication service|Read only|
|`external-auth-configuration`|Configuration information for the external authentication service.|Read only map parameter|

XCP-ng servers contain some other objects that also have parameter lists.

CPUs on XCP-ng servers have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the CPU|Read only|
|`number`|The number of the physical CPU core within the XCP-ng server|Read only|
|`vendor`|The vendor string for the CPU name|Read only|
|`speed`|The CPU clock speed, in Hz|Read only|
|`modelname`|The vendor string for the CPU model, for example, "Intel(R) Xeon(TM) CPU 3.00 GHz"|Read only|
|`stepping`|The CPU revision number|Read only|
|`flags`|The flags of the physical CPU (a decoded version of the features field)|Read only|
|`Utilisation`|The current CPU utilization|Read only|
|`host-uuid`|The UUID if the host the CPU is in|Read only|
|`model`|The model number of the physical CPU|Read only|
|`family`|The physical CPU family number|Read only|

Crash dumps on XCP-ng servers have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the crashdump|Read only|
|`host`|XCP-ng server the crashdump corresponds to|Read only|
|`timestamp`|Timestamp of the date and time that the crashdump occurred, in the form `yyyymmdd-hhmmss-ABC`, where *ABC* is the timezone indicator, for example, GMT|Read only|
|`size`|Size of the crashdump, in bytes|Read only|

### `host-all-editions`

```
host-all-editions
```

Get a list of all available editions

### `host-apply-edition`

:::warning
XCP-ng doesn't use any license file of any kind. Ignore this command.
:::

```
host-apply-edition [host-uuid=host_uuid] [edition=xenserver_edition="free" "per-socket" "xendesktop"]
```

### `host-backup`

```
host-backup file-name=backup_filename host=host_name
```

Download a backup of the control domain of the specified XCP-ng server to the machine that the command is invoked from. Save it there as a file with the name `file-name`.

:::warning
While the `xe host-backup` command works if executed on the local host (that is, without a specific host name specified), do not use it this way. Doing so would fill up the control domain partition with the backup file. Only use the command from a remote off-host machine where you have space to hold the backup file.
:::

### `host-bugreport-upload`

```
host-bugreport-upload [host-selector=host_selector_value...] [url=destination_url http-proxy=http_proxy_name]
```

Generate a fresh bug report (using `xen-bugtool`, with all optional files included) and upload to the Support FTP site or some other location.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

Optional parameters are `http-proxy`: use specified HTTP proxy, and `url`: upload to this destination URL. If optional parameters are not used, no proxy server is identified and the destination is the default Support FTP site.

### `host-call-plugin`

```
host-call-plugin host-uuid=host_uuid plugin=plugin fn=function [args=args]
```

Calls the function within the plug-in on the given host with optional arguments.

### `host-compute-free-memory`

```
host-compute-free-memory
```

Computes the amount of free memory on the host.

### `host-compute-memory-overhead`

```
host-compute-memory-overhead
```

Computes the virtualization memory overhead of a host.

### `host-cpu-info`

```
host-cpu-info [uuid=uuid]
```

Lists information about the host’s physical CPUs.

### `host-crashdump-destroy`

```
host-crashdump-destroy uuid=crashdump_uuid
```

Delete a host crashdump specified by its UUID from the XCP-ng server.

### `host-crashdump-upload`

```
host-crashdump-upload uuid=crashdump_uuid [url=destination_url] [http-proxy=http_proxy_name]
```

Upload a crashdump to the Support FTP site or other location. If optional parameters are not used, no proxy server is identified and the destination is the default Support FTP site. Optional parameters are `http-proxy`: use specified HTTP proxy, and `url`: upload to this destination URL.

### `host-declare-dead`

```
host-declare-dead uuid=host_uuid
```

Declare that the the host is dead without contacting it explicitly.

:::warning
This call is dangerous and can cause data loss if the host is not actually dead.
:::

### `host-disable`

```
host-disable [host-selector=host_selector_value...]
```

Disables the specified XCP-ng servers, which prevents any new VMs from starting on them. This action prepares the XCP-ng servers to be shut down or rebooted.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors)). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-disable-display`

```
host-disable-display uuid=host_uuid
```

Disable display for the host.

### `host-disable-local-storage-caching`

```
host-disable-local-storage-caching
```

Disable local storage caching on the specified host.

### `host-dmesg`

```
host-dmesg [host-selector=host_selector_value...]
```

Get a Xen `dmesg` (the output of the kernel ring buffer) from specified XCP-ng servers.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-emergency-ha-disable`

```
host-emergency-ha-disable  [--force]
```

Disable HA on the local host. Only to be used to recover a pool with a broken HA setup.

### `host-emergency-management-reconfigure`

```
host-emergency-management-reconfigure interface=uuid_of_management_interface_pif
```

Reconfigure the management interface of this XCP-ng server. Use this command only if the XCP-ng server is in emergency mode. Emergency mode means that the host is a member in a resource pool whose master has disappeared from the network and cannot be contacted after a number of retries.

### `host-enable`

```
host-enable [host-selector=host_selector_value...]
```

Enables the specified XCP-ng servers, which allows new VMs to be started on them.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-enable-display`

```
host-enable-display uuid=host_uuid
```

Enable display for the host.

### `host-enable-local-storage-caching`

```
host-enable-local-storage-caching  sr-uuid=sr_uuid
```

Enable local storage caching on the specified host.

### `host-evacuate`

```
host-evacuate [host-selector=host_selector_value...]
```

Live migrates all running VMs to other suitable hosts on a pool. First, disable the host by using the `host-disable` command.

If the evacuated host is the pool master, then another host must be selected to be the pool master. To change the pool master with HA disabled, use the `pool-designate-new-master` command. For more information, see [pool-designate-new-master](#pool-designate-new-master).

With HA enabled, your only option is to shut down the server, which causes HA to elect a new master at random. For more information, see [host-shutdown](#host-shutdown).

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-forget`

```
host-forget uuid=host_uuid
```

The XAPI agent forgets about the specified XCP-ng server without contacting it explicitly.

Use the `--force` parameter to avoid being prompted to confirm that you really want to perform this operation.

:::warning
Do not use this command if HA is enabled on the pool. Disable HA first, then enable it again after you’ve forgotten the host.
:::

This command is useful if the XCP-ng server to "forget" is dead. However, if the XCP-ng server is live and part of the pool, use `xe pool-eject` instead.

### `host-get-cpu-features`

```
host-get-cpu-features {features=pool_master_cpu_features} [uuid=host_uuid]
```

Prints a hexadecimal representation of the host’s physical-CPU features.

### `host-get-server-certificate`

```
host-get-server-certificate
```

Get the installed server SSL certificate.

### `host-get-sm-diagnostics`

```
host-get-sm-diagnostics uuid=uuid
```

Display per-host SM diagnostic information.

### `host-get-system-status`

```
host-get-system-status filename=name_for_status_file [entries=comma_separated_list] [output=tar.bz2|zip] [host-selector=host_selector_value...]
```

Download system status information into the specified file. The optional parameter `entries` is a comma-separated list of system status entries, taken from the capabilities XML fragment returned by the `host-get-system-status-capabilities` command. For more information, see [host-get-system-status-capabilities](#host-get-system-status-capabilities). If not specified, all system status information is saved in the file. The parameter `output` may be *tar.bz2* (the default) or *zip*. If this parameter is not specified, the file is saved in `tar.bz2` form.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above).

### `host-get-system-status-capabilities`

```
host-get-system-status-capabilities [host-selector=host_selector_value...]
```

Get system status capabilities for the specified hosts. The capabilities are returned as an XML fragment that similar to the following example:

```
<?xml version="1.0" ?>
<system-status-capabilities>
    <capability content-type="text/plain" default-checked="yes" key="xenserver-logs"  \
        max-size="150425200" max-time="-1" min-size="150425200" min-time="-1" \
        pii="maybe"/>
    <capability content-type="text/plain" default-checked="yes" \
        key="xenserver-install" max-size="51200" max-time="-1" min-size="10240" \
        min-time="-1" pii="maybe"/>
    ...
</system-status-capabilities>
```

Each capability entity can have the following attributes.

- `key` A unique identifier for the capability.
- `content-type` Can be either text/plain or application/data. Indicates whether a UI can render the entries for human consumption.
- `default-checked` Can be either yes or no. Indicates whether a UI should select this entry by default.
- `min-size`, `max-size` Indicates an approximate range for the size, in bytes, of this entry. -1 indicates that the size is unimportant.
- `min-time`, `max-time` Indicate an approximate range for the time, in seconds, taken to collect this entry. -1 indicates that the time is unimportant.
- `pii` Personally identifiable information. Indicates whether the entry has information that can identify the system owner or details of their network topology. The attribute can have one of the following values:
  - `no`: no PII is in these entries
  - `yes`: PII likely or certainly is in these entries
  - `maybe`: you might want to audit these entries for PII
  - `if_customized` if the files are unmodified, then they contain no PII. However, because we encourage editing of these files, PII might have been introduced by such customization. This value is used in particular for the networking scripts in the control domain.
  Passwords are never to be included in any bug report, regardless of any PII declaration.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above).

### `host-get-thread-diagnostics`

```
host-get-thread-diagnostics uuid=uuid
```

Display per-host thread diagnostic information.

### `host-get-vms-which-prevent-evacuation`

```
host-get-vms-which-prevent-evacuation uuid=uuid
```

Return a list of VMs which prevent the evacuation of a specific host and display reasons for each one.

### `host-is-in-emergency-mode`

```
host-is-in-emergency-mode
```

Returns `true` if the host the CLI is talking to is in emergency mode, `false` otherwise. This CLI command works directly on slave hosts even with no master host present.

### `host-license-add`

```
host-license-add [license-file=path/license_filename] [host-uuid=host_uuid]
```

For XCP-ng (free edition), use to parse a local license file and add it to the specified XCP-ng server.

### `host-license-remove`

```
host-license-remove [host-uuid=host_uuid]
```

Remove any licensing applied to a host.

### `host-license-view`

```
host-license-view [host-uuid=host_uuid]
```

Displays the contents of the XCP-ng server license.

### `host-logs-download`

```
host-logs-download [file-name=logfile_name] [host-selector=host_selector_value...]
```

Download a copy of the logs of the specified XCP-ng servers. The copy is saved by default in a time-stamped file named `hostname-yyyy-mm-dd T hh:mm:ssZ.tar.gz`. You can specify a different file name using the optional parameter *file-name*.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

:::warning
While the `xe host-logs-download` command works if executed on the local host (that is, without a specific host name specified), do *not* use it this way. Doing so clutters the control domain partition with the copy of the logs. The command should *only* be used from a remote off-host machine where you have space to hold the copy of the logs.
:::

### `host-management-disable`

```
host-management-disable
```

Disables the host agent listening on an external management network interface and disconnects all connected API clients (such as the XenCenter). This command operates directly on the XCP-ng server the CLI is connected to. The command is not forwarded to the pool master when applied to a member XCP-ng server.

:::warning
Be careful when using this CLI command off-host. After this command is run, you cannot connect to the control domain remotely over the network to re-enable the host agent.
:::

### `host-management-reconfigure`

```
host-management-reconfigure [interface=device] [pif-uuid=uuid]
```

Reconfigures the XCP-ng server to use the specified network interface as its management interface, which is the interface that is used to connect to the XenCenter. The command rewrites the MANAGEMENT\_INTERFACE key in `/etc/xensource-inventory`.

If the device name of an interface (which must have an IP address) is specified, the XCP-ng server immediately rebinds. This command works both in normal and emergency mode.

If the UUID of a PIF object is specified, the XCP-ng server determines which IP address to rebind to itself. It must not be in emergency mode when this command is executed.

:::warning
Be careful when using this CLI command off-host and ensure that you have network connectivity on the new interface. Use `xe pif-reconfigure` to set one up first. Otherwise, subsequent CLI commands are unable to reach the XCP-ng server.
:::

### `host-power-on`

```
host-power-on [host=host_uuid]
```

Turns on power on XCP-ng servers with the *Host Power On* function enabled. Before using this command, enable `host-set-power-on` on the host.

### `host-reboot`

```
host-reboot [host-selector=host_selector_value...]
```

Reboot the specified XCP-ng servers. The specified hosts must be disabled first using the `xe host-disable` command, otherwise a `HOST_IN_USE` error message is displayed.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

If the specified XCP-ng servers are members of a pool, the loss of connectivity on shutdown is handled and the pool recovers when the XCP-ng servers returns. The other members and the master continue to function.

If you shut down the master, the pool is out of action until one of the following actions occurs:

- You make one of the members into the master
- The original master is rebooted and back on line.

When the master is back online, the members reconnect and synchronize with the master.

### `host-restore`

```
host-restore [file-name=backup_filename] [host-selector=host_selector_value...]
```

Restore a backup named `file-name` of the XCP-ng server control software. The use of the word "restore" here does not mean a full restore in the usual sense, it merely means that the compressed backup file has been uncompressed and unpacked onto the secondary partition. After you’ve done a `xe host-restore`, you have to boot the Install CD and use its Restore from Backup option.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-send-debug-keys`

```
host-send-debug-keys  host-uuid=host_uuid keys=keys
```

Send specified hypervisor debug keys to specified host.

### `host-set-hostname-live`

```
host-set-hostname-live host-uuid=uuid_of_host host-name=new_hostname
```

Change the host name of the XCP-ng server specified by `host-uuid`. This command persistently sets both the host name in the control domain database and the actual Linux host name of the XCP-ng server. The value of `host-name` is *not* the same as the value of the `name_label` field.

### `host-set-power-on-mode`

```
host-set-power-on-mode host=host_uuid power-on-mode={"" | "wake-on-lan" | "iLO" | "DRAC" | "custom"} [ power-on-config:power_on_ip=ip-address power-on-config:power_on_user=user power-on-config:power_on_password_secret=secret-uuid ]
```

Use to enable the *Host Power On* function on XCP-ng hosts that are compatible with remote power solutions. When using the `host-set-power-on` command, you must specify the type of power management solution on the host (that is, the power-on-mode). Then specify configuration options using the power-on-config argument and its associated key-value pairs.

To use the secrets feature to store your password, specify the key `"power_on_password_secret"`. For more information, see [Secrets](#secrets).

### `host-shutdown`

```
host-shutdown [host-selector=host_selector_value...]
```

Shut down the specified XCP-ng servers. The specified XCP-ng servers must be disabled first using the `xe host-disable` command, otherwise a `HOST_IN_USE` error message is displayed.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

If the specified XCP-ng servers are members of a pool, the loss of connectivity on shutdown is handled and the pool recovers when the XCP-ng servers returns. The other members and the master continue to function.

If you shut down the master, the pool is out of action until one of the following actions occurs:

- You make one of the members into the master
- The original master is rebooted and back on line.

When the master is back online, the members reconnect and synchronize with the master.

If HA is enabled for the pool, one of the members is made into a master automatically. If HA is disabled, you must manually designate the desired server as master with the `pool-designate-new-master` command. For more information, see [pool-designate-new-master](#pool-designate-new-master).

### `host-sm-dp-destroy`

```
host-sm-dp-destroy uuid=uuid dp=dp [allow-leak=true|false]
```

Attempt to destroy and clean up a storage datapath on a host. If `allow-leak=true` is provided then it deletes all records of the datapath even if it is not shut down cleanly.

### `host-sync-data`

```
host-sync-data
```

Synchronize the non-database data stored on the pool master with the named host.

### `host-syslog-reconfigure`

```
host-syslog-reconfigure [host-selector=host_selector_value...]
```

Reconfigure the `syslog` daemon on the specified XCP-ng servers. This command applies the configuration information defined in the host `logging` parameter.

The hosts on which this operation should be performed are selected using the standard selection mechanism (see [host selectors](#host-selectors) above). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section.

### `host-data-source-list`

```
host-data-source-list [host-selectors=host selector value...]
```

List the data sources that can be recorded for a host.

Select the hosts on which to perform this operation by using the standard selection mechanism (see [host selectors](#host-selectors)). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all hosts.

Data sources have two parameters – `standard` and `enabled`. This command outputs the values of the parameters:

- If a data source has `enabled` set to `true`, the metrics are currently being recorded to the performance database.
- If a data source has `standard` set to `true`, the metrics are recorded to the performance database *by default*. The value of `enabled` is also set to `true` for this data source.
- If a data source has `standard` set to `false`, the metrics are *not* recorded to the performance database by default. The value of `enabled` is also set to `false` for this data source.

To start recording data source metrics to the performance database, run the `host-data-source-record` command. This command sets `enabled` to `true`. To stop, run the `host-data-source-forget`. This command sets `enabled` to `false`.

### `host-data-source-record`

```
host-data-source-record data-source=name_description_of_data_source [host-selectors=host_selector_value...]
```

Record the specified data source for a host.

This operation writes the information from the data source to the persistent performance metrics database of the specified hosts. For performance reasons, this database is distinct from the normal agent database.

Select the hosts on which to perform this operation by using the standard selection mechanism (see [host selectors](#host-selectors)). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all hosts.

### `host-data-source-forget`

```
host-data-source-forget data-source=name_description_of_data_source [host-selectors=host_selector_value...]
```

Stop recording the specified data source for a host and forget all of the recorded data.

Select the hosts on which to perform this operation by using the standard selection mechanism (see [host selectors](#host-selectors)). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all hosts.

### `host-data-source-query`

```
host-data-source-query data-source=name_description_of_data_source [host-selectors=host_selector_value...]
```

Display the specified data source for a host.

Select the hosts on which to perform this operation by using the standard selection mechanism (see [host selectors](#host-selectors)). Optional arguments can be any number of the [host parameters](#host-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all hosts.

## Log commands

Commands for working with logs.

### `log-get`

```
log-get
```

Return the log currently stored in the string logger.

### `log-get-keys`

```
log-get-keys
```

List the keys known by the logger.

### `log-reopen`

```
log-reopen
```

Reopen all loggers (use this for rotating files).

### `log-set-output`

```
log-set-output output=output [key=key] [level=level]
```

Set all loggers to the specified output (nil, stderr, string, file:*file name*, syslog:*something*).

## Message commands

Commands for working with messages. Messages are created to notify users of significant events, and are displayed in XenCenter as alerts.

The message objects can be listed with the standard object listing command (`xe message-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### Message parameters

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the message|Read only|
|`name`|The unique name of the message|Read only|
|`priority`|The message priority. Higher numbers indicate greater priority|Read only|
|`class`|The message class, for example VM.|Read only|
|`obj-uuid`|The uuid of the affected object.|Read only|
|`timestamp`|The time that the message was generated.|Read only|
|`body`|The message content.|Read only|

### `message-create`

```
message-create name=message_name body=message_text [[host-uuid=uuid_of_host] | [sr-uuid=uuid_of_sr] | [vm-uuid=uuid_of_vm] | [pool-uuid=uuid_of_pool]]
```

Creates a message.

### `message-destroy`

```
message-destroy [uuid=message_uuid]
```

Destroys an existing message. You can build a script to destroy all messages. For example:

```
# Dismiss all alerts   \
    IFS=","; for m in $(xe message-list params=uuid --minimal); do  \
    xe message-destroy uuid=$m  \
    done
```

## Network commands

Commands for working with networks.

The network objects can be listed with the standard object listing command (`xe network-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### Network parameters

Networks have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the network|Read only|
|`name-label`|The name of the network|Read/write|
|`name-description`|The description text of the network|Read/write|
|`VIF-uuids`|A list of unique identifiers of the VIFs (virtual network interfaces) that are attached from VMs to this network|Read only set parameter|
|`PIF-uuids`|A list of unique identifiers of the PIFs (physical network interfaces) that are attached from XCP-ng servers to this network|Read only set parameter|
|`bridge`|Name of the bridge corresponding to this network on the local XCP-ng server|Read only|
|`default-locking-mode`|A network object used with VIF objects for ARP filtering. Set to `unlocked` to remove all the filtering rules associated with the VIF. Set to `disabled` so the VIF drops all traffic.|Read/write|
|`purpose`|Set of purposes for which the XCP-ng server uses this network. Set to `nbd` to use the network to make NBD connections.|Read/write|
|`other-config:staticroutes`|Comma-separated list of *subnet*/*netmask*/*gateway* formatted entries specifying the gateway address through which to route subnets. For example, setting `other-config:static-routes` to 172.16.0.0/15/192.168.0.3,172.18.0.0/16/192.168.0.4 causes traffic on 172.16.0.0/15 to be routed over 192.168.0.3 and traffic on 172.18.0.0/16 to be routed over 192.168.0.4.|Read/write|
|`other-config:ethtoolautoneg`|Set to no to disable autonegotiation of the physical interface or bridge. Default is yes.|Read/write|
|`other-config:ethtool-rx`|Set to on to enable receive checksum, off to disable|Read/write|
|`other-config:ethtool-tx`|Set to on to enable transmit checksum, off to disable|Read/write|
|`other-config:ethtool-sg`|Set to on to enable scatter gather, off to disable|Read/write|
|`other-config:ethtool-tso`|Set to on to enable TCP segmentation offload, off to disable|Read/write|
|`other-config:ethtool-ufo`|Set to on to enable UDP fragment offload, off to disable|Read/write|
|`other-config:ethtool-gso`|Set to on to enable generic segmentation offload, off to disable|Read/write|
|`blobs`|Binary data store|Read only|

### `network-create`

```
network-create name-label=name_for_network [name-description=descriptive_text]
```

Creates a network.

### `network-destroy`

```
network-destroy uuid=network_uuid
```

Destroys an existing network.

### SR-IOV commands

Commands for working with SR-IOV.

The network-sriov objects can be listed with the standard object listing command (`xe network-sriov-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### SR-IOV parameters

SR-IOV has the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`physical-PIF`|The PIF to enable SR-IOV.|Read only|
|`logical-PIF`|An SR-IOV logical PIF. Users can use this parameter to create an SR-IOV VLAN network.|Read only|
|`requires-reboot`|If set to True, used to reboot host to bring SR-IOV enabling into effect.|Read only|
|`remaining-capacity`|Number of available VFs remaining.|Read only|

### `network-sriov-create`

```
network-sriov-create network-uuid=network_uuid pif-uuid=physical_pif_uuid
```

Creates an SR-IOV network object for a given physical PIF and enables SR-IOV on the physical PIF.

### `network-sriov-destroy`

```
network-sriov-destroy uuid=network_sriov_uuid
```

Removes a network SR-IOV object and disables SR-IOV on its physical PIF.

## Assign an SR-IOV VF

```
xe vif-create device=device_index mac=vf_mac_address network-uuid=sriov_network vm-uuid=vm_uuid
```

Assigns a VF from an SR-IOV network to a VM.

## SDN Controller commands

Commands for working with the SDN controller.

### `sdn-controller-forget`

```
sdn-controller-introduce [address=address] [protocol=protocol] [tcp-port=tcp_port]
```

Introduce an SDN controller.

### `sdn-controller-introduce`

```
sdn-controller-forget uuid=uuid
```

Remove an SDN controller.

## Tunnel commands
-----------------------------------

Commands for working with tunnels.

### `tunnel-create`

```
tunnel-create pif-uuid=pif_uuid network-uuid=network_uuid
```

Create a new tunnel on a host.

### `tunnel-destroy`

```
tunnel-destroy uuid=uuid
```

Destroy a tunnel.

## Patch commands

:::warning
XCP-ng doesn't use Citrix Hypervisor patch system. Do NOT use these commands!
:::

Commands for working with patches.

### `patch-apply`

```
patch-apply uuid=patch_uuid host-uuid=host_uuid
```

Apply the previously uploaded patch to the specified host.

### `patch-clean`

```
patch-clean uuid=uuid
```

Delete a previously uploaded patch file.

### `patch-destroy`

```
patch-destroy uuid=uuid
```

Remove an unapplied patch record and files from the server.

### `patch-pool-apply`

```
patch-pool-apply uuid=uuid
```

Apply the previously uploaded patch to all hosts in the pool.

### `patch-pool-clean`

```
patch-pool-clean uuid=uuid
```

Delete a previously uploaded patch file on all hosts in the pool.

### `patch-precheck`

```
patch-precheck uuid=uuid host-uuid=host_uuid
```

Run the prechecks contained within the patch previously uploaded to the specified host.

### `patch-upload`

```
patch-upload file-name=file_name
```

Upload a patch file to the server.

## PBD commands

Commands for working with PBDs (Physical Block Devices). PBDs are the software objects through which the XCP-ng server accesses storage repositories (SRs).

The PBD objects can be listed with the standard object listing command (`xe pbd-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### PBD parameters

PBDs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the PBD.|Read only|
|`sr-uuid`|The storage repository that the PBD points to|Read only|
|`device-config`|Extra configuration information that is provided to the SR-backend-driver of a host|Read only map parameter|
|`currently-attached`|True if the SR is attached on this host, False otherwise|Read only|
|`host-uuid`|UUID of the physical machine on which the PBD is available|Read only|
|`host`|The host field is deprecated. Use host\_uuid instead.|Read only|
|`other-config`|Extra configuration information.|Read/write map parameter|

### `pbd-create`

```
pbd-create host-uuid=uuid_of_host sr-uuid=uuid_of_sr [device-config:key=corresponding_value]
```

Create a PBD on your XCP-ng server. The read-only `device-config` parameter can only be set on creation.

To add a mapping from ‘path’ to ‘/tmp’, the command line should contain the argument `device-config:path=/tmp`

For a full list of supported device-config key/value pairs on each SR type, see [Storage](../../storage).

### `pbd-destroy`

```
pbd-destroy uuid=uuid_of_pbd
```

Destroy the specified PBD.

### `pbd-plug`

```
pbd-plug uuid=uuid_of_pbd
```

Attempts to plug in the PBD to the XCP-ng server. If this command succeeds, the referenced SR (and the VDIs contained within) should then become visible to the XCP-ng server.

### `pbd-unplug`

```
pbd-unplug uuid=uuid_of_pbd
```

Attempt to unplug the PBD from the XCP-ng server.

## PIF commands

Commands for working with PIFs (objects representing the physical network interfaces).

The PIF objects can be listed with the standard object listing command (`xe pif-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### PIF parameters

PIFs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the PIF|Read only|
|`device machine-readable`|Name of the interface (for example, eth0)|Read only|
|`MAC`|The MAC address of the PIF|Read only|
|`other-config`|Extra PIF configuration `name:value` pairs.|Read/write map parameter|
|`physical`|If true, the PIF points to an actual physical network interface|Read only|
|`currently-attached`|Is the PIF currently attached on this host? `true` or `false`|Read only|
|`MTU`|Maximum Transmission Unit of the PIF in bytes.|Read only|
|`VLAN`|VLAN tag for all traffic passing through this interface. -1 indicates that no VLAN tag is assigned|Read only|
|`bond-master-of`|The UUID of the bond this PIF is the master of (if any)|Read only|
|`bond-slave-of`|The UUID of the bond this PIF is the slave of (if any)|Read only|
|`management`|Is this PIF designated to be a management interface for the control domain|Read only|
|`network-uuid`|The unique identifier/object reference of the virtual network to which this PIF is connected|Read only|
|`network-name-label`|The name of the virtual network to which this PIF is connected|Read only|
|`host-uuid`|The unique identifier/object reference of the XCP-ng server to which this PIF is connected|Read only|
|`host-name-label`|The name of the XCP-ng server to which this PIF is connected|Read only|
|`IP-configuration-mode`|Type of network address configuration used; DHCP or static|Read only|
|`IP`|IP address of the PIF. Defined here when IP-configuration-mode is static; undefined when DHCP|Read only|
|`netmask`|Netmask of the PIF. Defined here when IP-configuration-mode is static; undefined when supplied by DHCP|Read only|
|`gateway`|Gateway address of the PIF. Defined here when IP-configuration-mode is static; undefined when supplied by DHCP|Read only|
|`DNS`|DNS address of the PIF. Defined here when IP-configuration-mode is static; undefined when supplied by DHCP|Read only|
|`io_read_kbs`|Average read rate in kB/s for the device|Read only|
|`io_write_kbs`|Average write rate in kB/s for the device|Read only|
|`carrier`|Link state for this device|Read only|
|`vendor-id`|The ID assigned to NIC’s vendor|Read only|
|`vendor-name`|The NIC vendor’s name|Read only|
|`device-id`|The ID assigned by the vendor to this NIC model|Read only|
|`device-name`|The name assigned by the vendor to this NIC model|Read only|
|`speed`|Data transfer rate of the NIC|Read only|
|`duplex`|Duplexing mode of the NIC; full or half|Read only|
|`pci-bus-path`|PCI bus path address|Read only|
|`other-config:ethtoolspeed`|Sets the speed of connection in Mbps|Read/write|
|`other-config:ethtoolautoneg`|Set to no to disable autonegotiation of the physical interface or bridge. Default is yes.|Read/write|
|`other-config:ethtoolduplex`|Sets duplexing capability of the PIF, either full or half.|Read/write|
|`other-config:ethtool-rx`|Set to on to enable receive checksum, off to disable|Read/write|
|`other-config:ethtool-tx`|Set to on to enable transmit checksum, off to disable|Read/write|
|`other-config:ethtool-sg`|Set to on to enable scatter gather, off to disable|Read/write|
|`other-config:ethtool-tso`|Set to on to enable TCP segmentation offload, off to disable|Read/write|
|`other-config:ethtool-ufo`|Set to on to enable UDP fragment offload, off to disable|Read/write|
|`other-config:ethtool-gso`|Set to on to enable generic segmentation offload, off to disable|Read/write|
|`other-config:domain`|Comma-separated list used to set the DNS search path|Read/write|
|`other-config:bondmiimon`|Interval between link liveness checks, in milliseconds|Read/write|
|`other-config:bonddowndelay`|Number of milliseconds to wait after link is lost before really considering the link to have gone. This parameter allows for transient link loss|Read/write|
|`other-config:bondupdelay`|Number of milliseconds to wait after the link comes up before really considering it up. Allows for links flapping up. Default is `31s` to allow for time for switches to begin forwarding traffic.|Read/write|
|`disallow-unplug`|True if this PIF is a dedicated storage NIC, false otherwise|Read/write|

:::tip
Changes made to the `other-config` fields of a PIF will only take effect after a reboot. Alternately, use the `xe pif-unplug` and `xe pif-plug` commands to cause the PIF configuration to be rewritten.
:::

### `pif-forget`

```
pif-forget uuid=uuid_of_pif
```

Destroy the specified PIF object on a particular host.

### `pif-introduce`

```
pif-introduce host-uuid=host_uuid mac=mac_address_for_pif device=interface_name
```

Create a PIF object representing a physical interface on the specified XCP-ng server.

### `pif-plug`

```
pif-plug uuid=uuid_of_pif
```

Attempt to bring up the specified physical interface.

### `pif-reconfigure-ip`

```
pif-reconfigure-ip uuid=uuid_of_pif [mode=dhcp|mode=static] gateway=network_gateway_address IP=static_ip_for_this_pif netmask=netmask_for_this_pif [DNS=dns_address]
```

Modify the IP address of the PIF. For static IP configuration, set the `mode` parameter to `static`, with the `gateway`, `IP`, and `netmask` parameters set to the appropriate values. To use DHCP, set the `mode` parameter to `DHCP` and leave the static parameters undefined.

:::tip
Using static IP addresses on physical network interfaces connected to a port on a switch using Spanning Tree Protocol with STP Fast Link turned off (or unsupported) results in a period during which there is no traffic.
:::

### `pif-reconfigure-ipv6`

```
pif-reconfigure-ipv6 uuid=uuid_of_pif mode=mode [gateway=network_gateway_address] [IPv6=static_ip_for_this_pif] [DNS=dns_address]
```

Reconfigure the IPv6 address settings on a PIF.

### `pif-scan`

```
pif-scan host-uuid=host_uuid
```

Scan for new physical interfaces on your XCP-ng server.

### `pif-set-primary-address-type`

```
pif-set-primary-address-type  uuid=uuid primary_address_type=address_type
```

Change the primary address type used by this PIF.

### `pif-unplug`

```
pif-unplug uuid=uuid_of_pif
```

Attempt to bring down the specified physical interface.

## Pool commands

Commands for working with pools. A *pool* is an aggregate of one or more XCP-ng servers. A pool uses one or more shared storage repositories so that the VMs running on one host in the pool can be migrated in near-real time to another host in the pool. This migration happens while the VM is still running, without it needing to be shut down and brought back up. Each XCP-ng server is really a pool consisting of a single member by default. When your XCP-ng server is joined to a pool, it is designated as a member, and the pool it has joined becomes the master for the pool.

The singleton pool object can be listed with the standard object listing command (`xe pool-list`). Its parameters can be manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### Pool parameters

Pools have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the pool|Read only|
|`name-label`|The name of the pool|Read/write|
|`name-description`|The description string of the pool|Read/write|
|`master`|The unique identifier/object reference of XCP-ng server designated as the pool’s master|Read only|
|`default-SR`|The unique identifier/object reference of the default SR for the pool|Read/write|
|`crash-dump-SR`|The unique identifier/object reference of the SR where any crash dumps for pool members are saved|Read/write|
|`metadata-vdis`|All known metadata VDIs for the pool|Read only|
|`suspend-image-SR`|The unique identifier/object reference of the SR where suspended VMs on pool members are saved|Read/write|
|`other-config`|A list of key/value pairs that specify extra configuration parameters for the pool|Read/write map parameter|
|`supported-sr-types`|SR types that this pool can use|Read only|
|`ha-enabled`|True if HA is enabled for the pool, false otherwise|Read only|
|`ha-configuration`|Reserved for future use.|Read only|
|`ha-statefiles`|Lists the UUIDs of the VDIs being used by HA to determine storage health|Read only|
|`ha-host-failures-to-tolerate`|The number of host failures to tolerate before sending a system alert|Read/write|
|`ha-plan-exists-for`|The number of hosts failures that can actually be handled, according to the calculations of the HA algorithm|Read only|
|`ha-allow-overcommit`|True if the pool is allowed to be overcommitted, False otherwise|Read/write|
|`ha-overcommitted`|True if the pool is overcommitted|Read only|
|`blobs`|Binary data store|Read only|
|`live-patching-disabled`|Set to False to enable live patching. Set to True to disable live patching.|Read/write|
|`igmp-snooping-enabled`|Set to True to enable IGMP snooping. Set to False to disable IGMP snooping.|Read/write|

### `pool-apply-edition`

```
pool-apply-edition edition=edition [uuid=uuid] [license-server-address=address] [license-server-port=port]
```

Apply an edition across the pool.

### `pool-certificate-install`

```
pool-certificate-install filename=file_name
```

Install an SSL certificate, pool-wide.

### `pool-certificate-list`

```
pool-certificate-list
```

List all installed SSL certificates.

### `pool-certificate-sync`

```
pool-certificate-sync
```

Sync SSL certificates and certificate revocation lists from master to slaves.

### `pool-certificate-uninstall`

```
pool-certificate-uninstall name=name
```

Uninstall an SSL certificate.

### `pool-crl-install`

```
pool-crl-install filename=file_name
```

Install an SSL certificate revocation list, pool-wide.

### `pool-crl-list`

```
pool-crl-list
```

List all installed SSL certificate revocation lists.

### `pool-crl-uninstall`

```
pool-crl-uninstall name=name
```

Uninstall an SSL certificate revocation list.

### `pool-deconfigure-wlb`

```
pool-deconfigure-wlb
```

Permanently remove the configuration for workload balancing.

### `pool-designate-new-master`

```
pool-designate-new-master host-uuid=uuid_of_new_master
```

Instruct the specified member XCP-ng server to become the master of an existing pool. This command performs an orderly handover of the role of master host to another host in the resource pool. This command only works when the current master is online. It is not a replacement for the emergency mode commands listed below.

### `pool-disable-external-auth`

```
pool-disable-external-auth [uuid=uuid] [config=config]
```

Disables external authentication in all the hosts in a pool.

### `pool-disable-local-storage-caching`

```
pool-disable-local-storage-caching uuid=uuid
```

Disable local storage caching across the pool.

### `pool-disable-redo-log`

```
pool-disable-redo-log
```

Disable the redo log if in use, unless HA is enabled.

### `pool-disable-ssl-legacy`

```
pool-disable-ssl-legacy [uuid=uuid]
```

Set ssl-legacy to False on each host.

### `pool-dump-database`

```
pool-dump-database file-name=filename_to_dump_database_into_(on_client)
```

Download a copy of the entire pool database and dump it into a file on the client.

### `pool-enable-external-auth`

```
pool-enable-external-auth  auth-type=auth_type service-name=service_name [uuid=uuid] [config:=config]
```

Enables external authentication in all the hosts in a pool. Note that some values of auth-type will require particular config: values.

### `pool-enable-local-storage-caching`

```
pool-enable-local-storage-caching uuid=uuid
```

Enable local storage caching across the pool.

### `pool-enable-redo-log`

```
pool-enable-redo-log sr-uuid=sr_uuid
```

Enable the redo log on the given SR if in use, unless HA is enabled.

### `pool-enable-ssl-legacy`

```
pool-enable-ssl-legacy [uuid=uuid]
```

Set ssl-legacy to True on each host."

### `pool-eject`

```
pool-eject host-uuid=uuid_of_host_to_eject
```

Instruct the specified XCP-ng server to leave an existing pool.

### `pool-emergency-reset-master`

```
pool-emergency-reset-master master-address=address_of_pool_master
```

Instruct a slave member XCP-ng server to reset its master address to the new value and attempt to connect to it. Do not run this command on master hosts.

### `pool-emergency-transition-to-master`

```
pool-emergency-transition-to-master
```

Instruct a member XCP-ng server to become the pool master. The XCP-ng server accepts this command only after the host has transitioned to emergency mode. Emergency mode means it is a member of a pool whose master has disappeared from the network and cannot be contacted after some number of retries.

If the host password has been modified since the host joined the pool, this command can cause the password of the host to reset. For more information, see ([User commands](#user-commands)).

### `pool-ha-enable`

```
pool-ha-enable heartbeat-sr-uuids=uuid_of_heartbeat_sr
```

Enable high availability on the resource pool, using the specified SR UUID as the central storage heartbeat repository.

### `pool-ha-disable`

```
pool-ha-disable
```

Disables the high availability feature on the resource pool.

### `pool-ha-compute-hypothetical-max-host-failures-to-tolerate`

Compute the maximum number of host failures to tolerate under the current pool configuration.

### `pool-ha-compute-max-host-failures-to-tolerate`

```
pool-ha-compute-hypothetical-max-host-failures-to-tolerate [vm-uuid=vm_uuid] [restart-priority=restart_priority]
```

Compute the maximum number of host failures to tolerate with the supplied, proposed protected VMs.

### `pool-initialize-wlb`

```
pool-initialize-wlb wlb_url=url wlb_username=wlb_username wlb_password=wlb_password xenserver_username=username xenserver_password=password
```

Initialize workload balancing for the current pool with the target WLB server.

### `pool-join`

```
pool-join master-address=address master-username=username master-password=password
```

Instruct your XCP-ng server to join an existing pool.

### `pool-management-reconfigure`

```
pool-management-reconfigure [network-uuid=network-uuid]
```

Reconfigures the management interface of all the hosts in the pool to use the specified network interface, which is the interface that is used to connect to the XenCenter. The command rewrites the MANAGEMENT\_INTERFACE key in `/etc/xensource-inventory` for all the hosts in the pool.

If the device name of an interface (which must have an IP address) is specified, the XCP-ng master host immediately rebinds. This command works both in normal and emergency mode.

From the network UUID specified, UUID of the PIF object is identified and mapped to the XCP-ng server, which determines which IP address to rebind to itself. It must not be in emergency mode when this command is executed.

:::warning
Be careful when using this CLI command off-host and ensure that you have network connectivity on the new interface. Use `xe pif-reconfigure` to set one up first. Otherwise, subsequent CLI commands are unable to reach the XCP-ng server.
:::
### `pool-recover-slaves`

```
pool-recover-slaves
```

Instruct the pool master to try to reset the master address of all members currently running in emergency mode. This command is typically used after `pool-emergency-transition-to-master` has been used to set one of the members as the new master.

### `pool-restore-database`

```
pool-restore-database file-name=filename_to_restore_from_on_client [dry-run=true|false]
```

Upload a database backup (created with `pool-dump-database`) to a pool. On receiving the upload, the master restarts itself with the new database.

There is also a *dry run* option, which allows you to check that the pool database can be restored without actually perform the operation. By default, `dry-run` is set to false.

### `pool-retrieve-wlb-configuration`

```
pool-retrieve-wlb-configuration
```

Retrieves the pool optimization criteria from the Workload Balancing server.

### `pool-retrieve-wlb-diagnostics`

```
pool-retrieve-wlb-diagnostics [filename=file_name]
```

Retrieves diagnostics from the Workload Balancing server.

### `pool-retrieve-wlb-recommendations`

```
pool-retrieve-wlb-recommendations
```

Retrieves VM migrate recommendations for the pool from the Workload Balancing server.

### `pool-retrieve-wlb-report`

```
pool-retrieve-wlb-report report=report [filename=file_name]
```

Retrieves reports from the Workload Balancing server.

### `pool-send-test-post`

```
pool-send-test-post dest-host=destination_host dest-port=destination_port body=post_body
```

Send the given body to the given host and port, using HTTPS, and print the response. This is used for debugging the SSL layer.

### `pool-send-wlb-configuration`

```
pool-send-wlb-configuration [config:=config]
```

Sets the pool optimization criteria for the Workload Balancing server.

### `pool-sync-database`

```
pool-sync-database
```

Force the pool database to be synchronized across all hosts in the resource pool. This command is not necessary in normal operation since the database is regularly automatically replicated. However, the command can be useful for ensuring changes are rapidly replicated after performing a significant set of CLI operations.

## Set pool `igmp-snooping`

```
pool-param-set [uuid=pool-uuid] [igmp-snooping-enabled=true|false]
```

Enables or disables IGMP snooping on a XCP-ng pool.

## PVS Accelerator commands

Commands for working with the PVS Accelerator.

### `pvs-cache-storage-create`

```
pvs-cache-storage-create sr-uuid=sr_uuid pvs-site-uuid=pvs_site_uuid size=size
```

Configure a PVS cache on a given SR for a given host.

### `pvs-cache-storage-destroy`

```
pvs-cache-storage-destroy uuid=uuid
```

Remove a PVS cache.

### `pvs-proxy-create`

```
pvs-proxy-create pvs-site-uuid=pvs_site_uuid vif-uuid=vif_uuid
```

Configure a VM/VIF to use a PVS proxy.

### `pvs-proxy-destroy`

```
pvs-proxy-destroy uuid=uuid
```

Remove (or switch off) a PVS proxy for this VIF/VM.

### `pvs-server-forget`

```
pvs-server-forget uuid=uuid
```

Forget a PVS server.

### `pvs-server-introduce`

```
pvs-server-introduce addresses=adresses first-port=first_port last-port=last_port pvs-site-uuid=pvs_site_uuid
```

Introduce new PVS server.

### `pvs-site-forget`

```
pvs-site-forget uuid=uuid
```

Forget a PVS site.

### `pvs-site-introduce`

```
pvs-site-introduce name-label=name_label [name-description=name_description] [pvs-uuid=pvs_uuid]
```

Introduce new PVS site.

## Storage Manager commands

Commands for controlling Storage Manager plug-ins.

The storage manager objects can be listed with the standard object listing command (`xe sm-list`). The parameters can be manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

## SM parameters

SMs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the SM plug-in|Read only|
|`name-label`|The name of the SM plug-in|Read only|
|`name-description`|The description string of the SM plug-in|Read only|
|`type`|The SR type that this plug-in connects to|Read only|
|`vendor`|Name of the vendor who created this plug-in|Read only|
|`copyright`|Copyright statement for this SM plug-in|Read only|
|`required-api-version`|Minimum SM API version required on the XCP-ng server|Read only|
|`configuration`|Names and descriptions of device configuration keys|Read only|
|`capabilities`|Capabilities of the SM plug-in|Read only|
|`driver-filename`|The file name of the SR driver.|Read only|

## Snapshot commands

Commands for working with snapshots.

### `snapshot-clone`

```
snapshot-clone new-name-label=name_label [uuid=uuid] [new-name-description=description]
```

Create a new template by cloning an existing snapshot, using storage-level fast disk clone operation where available.

### `snapshot-copy`

```
snapshot-copy new-name-label=name_label [uuid=uuid] [new-name-description=name_description] [sr-uuid=sr_uuid]
```

Create a new template by copying an existing VM, but without using storage-level fast disk clone operation (even if this is available). The disk images of the copied VM are guaranteed to be ‘full images’ - i.e. not part of a CoW chain.

### `snapshot-destroy`

```
snapshot-destroy  [uuid=uuid] [snapshot-uuid=snapshot_uuid]
```

Destroy a snapshot. This leaves the storage associated with the snapshot intact. To delete storage too, use snapshot-uninstall.

### `snapshot-disk-list`

```
snapshot-disk-list [uuid=uuid] [snapshot-uuid=snapshot_uuid] [vbd-params=vbd_params] [vdi-params=vdi_params]
```

List the disks on the selected VM(s).

### `snapshot-export-to-template`

```
snapshot-export-to-template filename=file_name snapshot-uuid=snapshot_uuid  [preserve-power-state=true|false]
```

Export a snapshot to *file name*.

### `snapshot-reset-powerstate`

```
snapshot-reset-powerstate [uuid=uuid] [snapshot-uuid=snapshot_uuid] [--force]
```

Force the VM power state to halted in the management toolstack database only. This command is used to recover a snapshot that is marked as ‘suspended’. This is a potentially dangerous operation: you must ensure that you do not need the memory image anymore. You will not be able to resume your snapshot anymore.

### `snapshot-revert`

```
snapshot-revert [uuid=uuid] [snapshot-uuid=snapshot_uuid]
```

Revert an existing VM to a previous checkpointed or snapshot state.

### `snapshot-uninstall`

```
snapshot-uninstall [uuid=uuid] [snapshot-uuid=snapshot_uuid] [--force]
```

Uninstall a snapshot. This operation will destroy those VDIs that are marked RW and connected to this snapshot only. To simply destroy the VM record, use snapshot-destroy.

## SR commands

Commands for controlling SRs (storage repositories).

The SR objects can be listed with the standard object listing command (`xe sr-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

## SR parameters

SRs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the SR|Read only|
|`name-label`|The name of the SR|Read/write|
|`name-description`|The description string of the SR|Read/write|
|`allowed-operations`|List of the operations allowed on the SR in this state|Read only set parameter|
|`current-operations`|List of the operations that are currently in progress on this SR|Read only set parameter|
|`VDIs`|Unique identifier/object reference for the virtual disks in this SR|Read only set parameter|
|`PBDs`|Unique identifier/object reference for the PBDs attached to this SR|Read only set parameter|
|`physical-utilisation`|Physical space currently utilized on this SR, in bytes. For thin provisioned disk formats, physical utilization may be less than virtual allocation|Read only|
|`physical-size`|Total physical size of the SR, in bytes|Read only|
|`type`|Type of the SR, used to specify the SR back-end driver to use|Read only|
|`introduced-by`|The drtask (if any) which introduced the SR|Read only|
|`content-type`|The type of the SR’s content. Used to distinguish ISO libraries from other SRs. For storage repositories that store a library of ISOs, the content-type must be set to iso. In other cases, we recommend that you set this parameter either to empty, or the string user.|Read only|
|`shared`|True if this SR can be shared between multiple XCP-ng servers; False otherwise|Read/write|
|`other-config`|List of key/value pairs that specify extra configuration parameters for the SR|Read/write map parameter|
|`host`|The storage repository host name|Read only|
|`virtual-allocation`|Sum of virtual-size values of all VDIs in this storage repository (in bytes)|Read only|
|`sm-config`|SM dependent data|Read only map parameter|
|`blobs`|Binary data store|Read only|

### `sr-create`

```
sr-create name-label=name physical-size=size type=type content-type=content_type device-config:config_name=value [host-uuid=host_uuid] [shared=true|false]
```

Creates an SR on the disk, introduces it into the database, and creates a PBD attaching the SR to the XCP-ng server. If `shared` is set to `true`, a PBD is created for each XCP-ng server in the pool. If `shared` is not specified or set to `false`, a PBD is created only for the XCP-ng server specified with `host-uuid`.

The exact `device-config` parameters differ depending on the device `type`. For details of these parameters across the different storage back-ends, see [Storage](../../storage/).

### `sr-data-source-forget`

```
sr-data-source-forget data-source=data_source
```

Stop recording the specified data source for a SR, and forget all of the recorded data.

### `sr-data-source-list`

```
sr-data-source-list"
```

List the data sources that can be recorded for a SR.

### `sr-data-source-query`

```
sr-data-source-query data-source=data_source
```

Query the last value read from a SR data source.

### `sr-data-source-record`

```
sr-data-source-record  data-source=data_source
```

Record the specified data source for a SR.

### `sr-destroy`

```
sr-destroy uuid=sr_uuid
```

Destroys the specified SR on the XCP-ng server.

### `sr-enable-database-replication`

```
sr-enable-database-replication uuid=sr_uuid
```

Enables XAPI database replication to the specified (shared) SR.

### `sr-disable-database-replication`

```
sr-disable-database-replication uuid=sr_uuid
```

Disables XAPI database replication to the specified SR.

### `sr-forget`

```
sr-forget uuid=sr_uuid
```

The XAPI agent forgets about a specified SR on the XCP-ng server. When the XAPI agent forgets an SR, the SR is detached and you cannot access VDIs on it, but it remains intact on the source media (the data is not lost).

### `sr-introduce`

```
sr-introduce name-label=name physical-size=physical_size type=type content-type=content_type uuid=sr_uuid
```

Just places an SR record into the database. Use `device-config` to specify additional parameters in the form `device-config:parameter_key=parameter_value`, for example:

```
xe sr-introduce device-config:device=/dev/sdb1
```

:::tip
This command is never used in normal operation. This advanced operation might be useful when an SR must be reconfigured as shared after it was created or to help recover from various failure scenarios.
:::

### `sr-probe`

```
sr-probe type=type [host-uuid=host_uuid] [device-config:config_name=value]
```

Performs a backend-specific scan, using the provided `device-config` keys. If the `device-config` is complete for the SR back-end, this command returns a list of the SRs present on the device, if any. If the `device-config` parameters are only partial, a back-end-specific scan is performed, returning results that guide you in improving the remaining `device-config` parameters. The scan results are returned as backend-specific XML, printed on the CLI.

The exact `device-config` parameters differ depending on the device `type`. For details of these parameters across the different storage back-ends, see [Storage](../Storage).

### `sr-probe-ext`

```
sr-probe-ext type=type [host-uuid=host_uuid] [device-config:=config] [sm-config:-sm_config]
```

Perform a storage probe. The device-config parameters can be specified by for example device-config:devs=/dev/sdb1. Unlike sr-probe, this command returns results in the same human-readable format for every SR type.

### `sr-scan`

```
sr-scan uuid=sr_uuid
```

Force an SR scan, syncing the XAPI database with VDIs present in the underlying storage substrate.

### `sr-update`

```
sr-update uuid=uuid
```

Refresh the fields of the SR object in the database.

### `lvhd-enable-thin-provisioning`

```
lvhd-enable-thin-provisioning  sr-uuid=sr_uuid initial-allocation=initial_allocation allocation-quantum=allocation_quantum
```

Enable thin-provisioning on an LVHD SR.

## Subject commands

Commands for working with subjects.

### `session-subject-identifier-list`

```
session-subject-identifier-list
```

Return a list of all the user subject ids of all externally-authenticated existing sessions.

### `session-subject-identifier-logout`

```
session-subject-identifier-logout subject-identifier=subject_identifier
```

Log out all externally-authenticated sessions associated to a user subject id.

### `session-subject-identifier-logout-all`

```
session-subject-identifier-logout-all
```

Log out all externally-authenticated sessions.

### `subject-add`

```
subject-add subject-name=subject_name
```

Add a subject to the list of subjects that can access the pool.

### `subject-remove`

```
subject-remove subject-uuid=subject_uuid
```

Remove a subject from the list of subjects that can access the pool.

### `subject-role-add`

```
subject-role-add uuid=uuid [role-name=role_name] [role-uuid=role_uuid]
```

Add a role to a subject.

### `subject-role-remove`

```
subject-role-remove uuid=uuid [role-name=role_name] [role-uuid=role_uuid]
```

Remove a role from a subject.

### `secret-create`

```
secret-create value=value
```

Create a secret.

### `secret-destroy`

```
secret-destroy uuid=uuid
```

Destroy a secret.

## Task commands

Commands for working with long-running asynchronous tasks. These commands are tasks such as starting, stopping, and suspending a virtual machine. The tasks are typically made up of a set of other atomic subtasks that together accomplish the requested operation.

The task objects can be listed with the standard object listing command (`xe task-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### Task parameters

Tasks have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the Task|Read only|
|`name-label`|The name of the Task|Read only|
|`name-description`|The description string of the Task|Read only|
|`resident-on`|The unique identifier/object reference of the host on which the task is running|Read only|
|`status`|Status of the Task|Read only|
|`progress`|If the Task is still pending, this field contains the estimated percentage complete, from 0 to 1. If the Task has completed, successfully or unsuccessfully, the value is 1.|Read only|
|`type`|If the Task has successfully completed, this parameter contains the type of the encoded result. The type is the name of the class whose reference is in the result field. Otherwise, this parameter’s value is undefined|Read only|
|`result`|If the Task has completed successfully, this field contains the result value, either Void or an object reference; otherwise, this parameter’s value is undefined|Read only|
|`error_info`|If the Task has failed, this parameter contains the set of associated error strings. Otherwise, this parameter’s value is undefined|Read only|
|`allowed_operations`|List of the operations allowed in this state|Read only|
|`created`|Time the task has been created|Read only|
|`finished`|Time task finished (that is, succeeded or failed). If task-status is pending, then the value of this field has no meaning|Read only|
|`subtask_of`|Contains the UUID of the tasks this task is a subtask of|Read only|
|`subtasks`|Contains the UUIDs of all the subtasks of this task|Read only|

### `task-cancel`

```
task-cancel [uuid=task_uuid]
```

Direct the specified Task to cancel and return.

## Template commands

Commands for working with VM templates.

Templates are essentially VMs with the `is-a-template` parameter set to `true`. A template is a "gold image" that contains all the various configuration settings to instantiate a specific VM. XCP-ng ships with a base set of templates, which are generic "raw" VMs that can boot an OS vendor installation CD (for example: RHEL, CentOS, SLES, Windows). You can create VMs, configure them in standard forms for your particular needs, and save a copy of them as templates for future use in VM deployment.

The template objects can be listed with the standard object listing command (`xe template-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

:::tip
Templates cannot be directly converted into VMs by setting the `is-a-template` parameter to `false`. Setting `is-a-template` parameter to `false` is not supported and results in a VM that cannot be started.
:::

### VM template parameters

Templates have the following parameters:

-   `uuid` (read only) the unique identifier/object reference for the template
-   `name-label` (read/write) the name of the template
-   `name-description` (read/write) the description string of the template
-   `user-version` (read/write) string for creators of VMs and templates to put version information
-   `is-a-template` (read/write) true if this VM is a template. Template VMs can never be started, they are used only for cloning other VMs. After this value has been set to true, it cannot be reset to false. Template VMs cannot be converted into VMs using this parameter.
-   `is-control-domain` (read only) true if this is a control domain (domain 0 or a driver domain)
-   `power-state` (read only) current power state. The value is always halted for a template
-   `memory-dynamic-max` (read only) dynamic maximum memory in bytes. Currently unused, but if changed the following constraint must be obeyed: `memory_static_max` `>=` `memory_dynamic_max` `>=` `memory_dynamic_min` `>=` `memory_static_min`.
-   `memory-dynamic-min` (read/write) dynamic minimum memory in bytes. Currently unused, but if changed the same constraints for `memory-dynamic-max` must be obeyed.
-   `memory-static-max` (read/write) statically set (absolute) maximum memory in bytes. This field is the main value used to determine the amount of memory assigned to a VM.
-   `memory-static-min` (read/write) statically set (absolute) minimum memory in bytes. This field represents the absolute minimum memory, and `memory-static-min` must be less than `memory-static-max`. This value is unused in normal operation, but the previous constraint must be obeyed.
-   `suspend-VDI-uuid` (read only) the VDI that a suspend image is stored on (has no meaning for a template)
-   `VCPUs-params` (read/write map parameter) configuration parameters for the selected vCPU policy.

You can tune a vCPU’s pinning with:

```
xe template-param-set uuid=<template_uuid> vCPUs-params:mask=1,2,3
```

A VM created from this template run on physical CPUs 1, 2, and 3 only.
You can also tune the vCPU priority (xen scheduling) with the cap and weight parameters. For example:

```
xe template-param-set uuid=<template_uuid> VCPUs-params:weight=512 xe template-param-set uuid=<template_uuid> VCPUs-params:cap=100
```

A VM based on this template with a weight of 512 get twice as much CPU as a domain with a weight of 256 on a contended host. Legal weights range from 1 to 65535 and the default is 256.

The cap optionally fixes the maximum amount of CPU a VM based on this template can consume, even if the XCP-ng server has idle CPU cycles. The cap is expressed in percentage of one physical CPU: 100 is 1 physical CPU, 50 is half a CPU, 400 is 4 CPUs, and so on The default, 0, means that there is no upper cap.

- `VCPUs-max` (read/write) maximum number of vCPUs
- `VCPUs-at-startup` (read/write) boot number of vCPUs
- `actions-after-crash` (read/write) action to take when a VM based on this template crashes
- `console-uuids` (read only set parameter) virtual console devices
- `platform` (read/write map parameter) platform specific configuration

To disable the emulation of a parallel port for HVM guests (for example, Windows guests):

```
xe vm-param-set uuid=<vm_uuid> platform:parallel=none
```

To disable the emulation of a serial port for HVM guests:

```
xe vm-param-set uuid=<vm_uuid> platform:hvm_serial=none
```

To disable the emulation of a USB controller and a USB tablet device for HVM guests:

```
xe vm-param-set uuid=<vm_uuid> platform:usb=false
xe vm-param-set uuid=<vm_uuid> platform:usb_tablet=false
```

- `allowed-operations` (read only set parameter) list of the operations allowed in this state
- `current-operations` (read only set parameter) list of the operations that are currently in progress on this template
- `allowed-VBD-devices` (read only set parameter) list of VBD identifiers available for use, represented by integers of the range 0–15. This list is informational only, and other devices may be used (but may not work).
- `allowed-VIF-devices` (read only set parameter) list of VIF identifiers available for use, represented by integers of the range 0–15. This list is informational only, and other devices may be used (but may not work).
- `HVM-boot-policy` (read/write) the boot policy for HVM guests. Either BIOS Order or an empty string.
- `HVM-boot-params` (read/write map parameter) the order key controls the HVM guest boot order, represented as a string where each character is a boot method: d for the CD/DVD, c for the root disk, and n for network PXE boot. The default is dc.
- `PV-kernel` (read/write) path to the kernel
- `PV-ramdisk` (read/write) path to the initrd
- `PV-args` (read/write) string of kernel command line arguments
- `PV-legacy-args` (read/write) string of arguments to make legacy VMs based on this template boot
- `PV-bootloader` (read/write) name of or path to bootloader
- `PV-bootloader-args` (read/write) string of miscellaneous arguments for the bootloader
- `last-boot-CPU-flags` (read only) describes the CPU flags on which a VM based on this template was last booted; not populated for a template
- `resident-on` (read only) the XCP-ng server on which a VM based on this template is resident. Appears as `not in database` for a template
- `affinity` (read/write) the XCP-ng server which a VM based on this template has preference for running on. Used by the `xe vm-start` command to decide where to run the VM
- `other-config` (read/write map parameter) list of key/value pairs that specify extra configuration parameters for the template
- `start-time` (read only) timestamp of the date and time that the metrics for a VM based on this template were read, in the form `yyyymmddThh:mm:ss z`, where z is the single-letter military timezone indicator, for example, Z for UTC(GMT). Set to `1 Jan 1970 Z` (beginning of Unix/POSIX epoch) for a template
- `install-time` (read only) timestamp of the date and time that the metrics for a VM based on this template were read, in the form `yyyymmddThh:mm:ss z`, where z is the single-letter military timezone indicator, for example, Z for UTC (GMT). Set to `1 Jan 1970 Z` (beginning of Unix/POSIX epoch) for a template
- `memory-actual` (read only) the actual memory being used by a VM based on this template; 0 for a template
- `VCPUs-number` (read only) the number of virtual CPUs assigned to a VM based on this template; 0 for a template
- `VCPUs-Utilization` (read only map parameter) list of virtual CPUs and their weight read only map parameter os-version the version of the operating system for a VM based on this template. Appears as `not in database` for a template
- `PV-drivers-version` (read only map parameter) the versions of the paravirtualized drivers for a VM based on this template. Appears as `not in database` for a template
- `PV-drivers-detected` (read only) flag for latest version of the paravirtualized drivers for a VM based on this template. Appears as `not in database` for a template
- `memory` (read only map parameter) memory metrics reported by the agent on a VM based on this template. Appears as `not in database` for a template
- `disks` (read only map parameter) disk metrics reported by the agent on a VM based on this template. Appears as `not in database` for a template
- `networks` (read only map parameter) network metrics reported by the agent on a VM based on this template. Appears as `not in database` for a template
- `other` (read only map parameter) other metrics reported by the agent on a VM based on this template. Appears as `not in database` for a template
- `guest-metrics-last-updated` (read only) timestamp when the in-guest agent performed the last write to these fields. In the form `yyyymmddThh:mm:ss z`, where z is the single-letter military timezone indicator, for example, Z for UTC (GMT)
- `actions-after-shutdown` (read/write) action to take after the VM has shutdown
- `actions-after-reboot` (read/write) action to take after the VM has rebooted
- `possible-hosts` (read only) list of hosts that can potentially host the VM
- `HVM-shadow-multiplier` (read/write) multiplier applied to the amount of shadow that is made available to the guest
- `dom-id` (read only) domain ID (if available, -1 otherwise)
- `recommendations` (read only) XML specification of recommended values and ranges for properties of this VM
- `xenstore-data` (read/write map parameter) data to be inserted into the `xenstore` tree (`/local/domain/*domid*/vmdata`) after the VM is created.
- `is-a-snapshot` (read only) True if this template is a VM snapshot
- `snapshot_of` (read only) the UUID of the VM that this template is a snapshot of
- `snapshots` (read only) the UUIDs of any snapshots that have been taken of this template
- `snapshot_time` (read only) the timestamp of the most recent VM snapshot taken
- `memory-target` (read only) the target amount of memory set for this template
- `blocked-operations` (read/write map parameter) lists the operations that cannot be performed on this template
- `last-boot-record` (read only) record of the last boot parameters for this template, in XML format
- `ha-always-run` (read/write) True if an instance of this template is always restarted on another host if there is a failure of the host it is resident on. This parameter is now deprecated. Use the `ha-restartpriority` parameter instead.
- `ha-restart-priority` (read only) restart or best-effort read/write blobs binary data store
- `live` (read only) relevant only to a running VM.

### `template-export`

```
template-export template-uuid=uuid_of_existing_template filename=filename_for_new_template
```

Exports a copy of a specified template to a file with the specified new file name.

### `template-uninstall`

```
template-uninstall template-uuid=template_uuid [--force]
```

Uninstall a custom template. This operation will destroy those VDIs that are marked as ‘owned’ by this template.

## Update commands

:::warning
Update mechanism in XCP-ng is using `yum`, not this CLI. Please do NOT use it and check the [updates section](../../management/updates).
:::

The update objects can be listed with the standard object listing command (`xe update-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

## Update parameters

XCP-ng server updates have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the update|Read only|
|`host`|The list of hosts that this update is applied to|Read only|
|`host-uuid`|The unique identifier for the XCP-ng server to query|Read only|
|`name-label`|The name of the update|Read only|
|`name-description`|The description string of the update|Read only|
|`applied`|Whether or not the update has been applied; true or false|Read only|
|`installation-size`|The size of the update in bytes|Read only|
|`after-apply-guidance`|Whether the XAPI toolstack or the host requires a restart|Read only|
|`version`|The version of the update|Read only|

### `update-upload`

```
update-upload file-name=update_filename
```

Upload a specified update file to the XCP-ng server. This command prepares an update to be applied. On success, the UUID of the uploaded update is printed. If the update has previously been uploaded, `UPDATE_ALREADY_EXISTS` error is returned instead and the patch is not uploaded again.

### `update-precheck`

```
update-precheck uuid=update_uuid host-uuid=host_uuid
```

Run the prechecks contained within the specified update on the specified XCP-ng server.

### `update-destroy`

```
update-destroy uuid=update_file_uuid
```

Deletes an update file that has not been applied from the pool. Can be used to delete an update file that cannot be applied to the hosts.

### `update-apply`

```
update-apply host-uuid=host_uuid uuid=update_file_uuid
```

Apply the specified update file.

### `update-pool-apply`

```
update-pool-apply uuid=update_uuid
```

Apply the specified update to all XCP-ng servers in the pool.

### `update-introduce`

```
update-introduce vdi-uuid=vdi_uuid
```

Introduce update VDI.

### `update-pool-clean`

```
update-pool-clean uuid=uuid
```

Removes the update’s files from all hosts in the pool.

## User commands

### `user-password-change`

```
user-password-change old=old_password new=new_password
```

Changes the password of the logged-in user. The old password field is not checked because you require supervisor privilege to use this command.

## VBD commands

Commands for working with VBDs (Virtual Block Devices).

A VBD is a software object that connects a VM to the VDI, which represents the contents of the virtual disk. The VBD has the attributes which tie the VDI to the VM (is it bootable, its read/write metrics, and so on). The VDI has the information on the physical attributes of the virtual disk (which type of SR, whether the disk is sharable, whether the media is read/write or read only, and so on).

The VBD objects can be listed with the standard object listing command (`xe vbd-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### VBD parameters

VBDs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the VBD|Read only|
|`vm-uuid`|The unique identifier/object reference for the VM this VBD is attached to|Read only|
|`vm-name-label`|The name of the VM this VBD is attached to|Read only|
|`vdi-uuid`|The unique identifier/object reference for the VDI this VBD is mapped to|Read only|
|`vdi-name-label`|The name of the VDI this VBD is mapped to|Read only|
|`empty`|If `true`, this VBD represents an empty drive|Read only|
|`device`|The device seen by the guest, for example `hda`|Read only|
|`userdevice`|Device number specified by the device parameter during `vbd-create`, for example, 0 for `hda`, 1 for `hdb`, and so on|Read/write|
|`bootable`|True if this VBD is bootable|Read/write|
|`mode`|The mode the VBD should be mounted with|Read/write|
|`type`|How the VBD appears to the VM, for example disk or CD|Read/write|
|`currently-attached`|True if the VBD is attached on this host, false otherwise|Read only|
|`storage-lock`|True if a storage-level lock was acquired|Read only|
|`status-code`|Error/success code associated with the last attach operation|Read only|
|`status-detail`|Error/success information associated with the last attach operation status|Read only|
|`qos_algorithm_type`|The QoS algorithm to use|Read/write|
|`qos_algorithm_params`|Parameters for the chosen QoS algorithm|Read/write map parameter|
|`qos_supported_algorithms`|Supported QoS algorithms for this VBD|Read only set parameter|
|`io_read_kbs`|Average read rate in kB per second for this VBD|Read only|
|`io_write_kbs`|Average write rate in kB per second for this VBD|Read only|
|`allowed-operations`|List of the operations allowed in this state. This list is advisory only and the server state may have changed by the time this field is read by a client.|Read only set parameter|
|`current-operations`|Links each of the running tasks using this object (by reference) to a current\_operation enum which describes the nature of the task.|Read only set parameter|
|`unpluggable`|True if this VBD supports hot unplug|Read/write|
|`attachable`|True if the device can be attached|Read only|
|`other-config`|Extra configuration|Read/write map parameter|

### `vbd-create`

```
vbd-create vm-uuid=uuid_of_the_vm device=device_value vdi-uuid=uuid_of_vdi_to_connect_to [bootable=true] [type=Disk|CD] [mode=RW|RO]
```

Create a VBD on a VM.

The allowable values for the `device` field are integers 0–15, and the number must be unique for each VM. The current allowable values can be seen in the `allowed-VBD-devices` parameter on the specified VM. This is seen as `userdevice` in the `vbd` parameters.

If the `type` is `Disk`, `vdi-uuid` is required. Mode can be `RO` or `RW` for a Disk.

If the `type` is `CD`, `vdi-uuid` is optional. If no VDI is specified, an empty VBD is created for the CD. Mode must be `RO` for a CD.

### `vbd-destroy`

```
vbd-destroy uuid=uuid_of_vbd
```

Destroy the specified VBD.

If the VBD has its `other-config:owner` parameter set to `true`, the associated VDI is also destroyed.

### `vbd-eject`

```
vbd-eject uuid=uuid_of_vbd
```

Remove the media from the drive represented by a VBD. This command only works if the media is of a removable type (a physical CD or an ISO). Otherwise, an error message `VBD_NOT_REMOVABLE_MEDIA` is returned.

### `vbd-insert`

```
vbd-insert uuid=uuid_of_vbd vdi-uuid=uuid_of_vdi_containing_media
```

Insert new media into the drive represented by a VBD. This command only works if the media is of a removable type (a physical CD or an ISO). Otherwise, an error message `VBD_NOT_REMOVABLE_MEDIA` is returned.

### `vbd-plug`

```
vbd-plug uuid=uuid_of_vbd
```

Attempt to attach the VBD while the VM is in the running state.

### `vbd-unplug`

```
vbd-unplug uuid=uuid_of_vbd
```

Attempts to detach the VBD from the VM while it is in the running state.

## VDI commands

Commands for working with VDIs (Virtual Disk Images).

A VDI is a software object that represents the contents of the virtual disk seen by a VM. This is different to the VBD, which is an object that ties a VM to the VDI. The VDI has the information on the physical attributes of the virtual disk (which type of SR, whether the disk is sharable, whether the media is read/write or read only, and so on). The VBD has the attributes that tie the VDI to the VM (is it bootable, its read/write metrics, and so on).

The VDI objects can be listed with the standard object listing command (`xe vdi-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### VDI parameters

VDIs have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`uuid`|The unique identifier/object reference for the VDI|Read only|
|`name-label`|The name of the VDI|Read/write|
|`name-description`|The description string of the VDI|Read/write|
|`allowed-operations`|A list of the operations allowed in this state|Read only set parameter|
|`current-operations`|A list of the operations that are currently in progress on this VDI|Read only set parameter|
|`sr-uuid`|SR in which the VDI resides|Read only|
|`vbd-uuids`|A list of VBDs that refer to this VDI|Read only set parameter|
|`crashdump-uuids`|List of crash dumps that refer to this VDI|Read only set parameter|
|`virtual-size`|Size of disk as presented to the VM, in bytes. Depending on the storage back-end type, the size may not be respected exactly|Read only|
|`physical-utilisation`|Amount of physical space that the VDI is taking up on the SR, in bytes|Read only|
|`type`|Type of VDI, for example, System or User|Read only|
|`sharable`|True if this VDI may be shared|Read only|
|`read-only`|True if this VDI can only be mounted read-only|Read only|
|`storage-lock`|True if this VDI is locked at the storage level|Read only|
|`parent`|References the parent VDI when this VDI is part of a chain|Read only|
|`missing`|True if SR scan operation reported this VDI as not present|Read only|
|`other-config`|Extra configuration information for this VDI|Read/write map parameter|
|`sr-name-label`|Name of the containing storage repository|Read only|
|`location`|Location information|Read only|
|`managed`|True if the VDI is managed|Read only|
|`xenstore-data`|Data to be inserted into the xenstore tree (/local/domain/0/backend/ vbd/*domid*/*device-id*/smdata) after the VDI is attached. The SM back-ends usually set this field on `vdi_attach`.|Read only map parameter|
|`sm-config`|SM dependent data|Read only map parameter|
|`is-a-snapshot`|True if this VDI is a VM storage snapshot|Read only|
|`snapshot_of`|The UUID of the storage this VDI is a snapshot of|Read only|
|`snapshots`|The UUIDs of all snapshots of this VDI|Read only|
|`snapshot_time`|The timestamp of the snapshot operation that created this VDI|Read only|
|`metadata-of-pool`|The uuid of the pool which created this metadata VDI|Read only|
|`metadata-latest`|Flag indicating whether the VDI contains the latest known metadata for this pool|Read only|
|`cbt-enabled`|Flag indicating whether changed block tracking is enabled for the VDI|Read/write|

### `vdi-clone`

```
vdi-clone uuid=uuid_of_the_vdi [driver-params:key=value]
```

Create a new, writable copy of the specified VDI that can be used directly. It is a variant of `vdi-copy` that is can expose high-speed image clone facilities where they exist.

Use the optional `driver-params` map parameter to pass extra vendor-specific configuration information to the back-end storage driver that the VDI is based on. For more information, see the storage vendor driver documentation.

### `vdi-copy`

```
vdi-copy uuid=uuid_of_the_vdi sr-uuid=uuid_of_the_destination_sr
```

Copy a VDI to a specified SR.

### `vdi-create`

```
vdi-create sr-uuid=uuid_of_sr_to_create_vdi_on name-label=name_for_the_vdi type=system|user|suspend|crashdump virtual-size=size_of_virtual_disk sm-config-\*=storage_specific_configuration_data
```

Create a VDI.

The `virtual-size` parameter can be specified in bytes or using the IEC standard suffixes KiB, MiB, GiB, and TiB.

:::tip
SR types that support thin provisioning of disks (such as Local VHD and NFS) do not enforce virtual allocation of disks. Take great care when over-allocating virtual disk space on an SR. If an over-allocated SR becomes full, disk space must be made available either on the SR target substrate or by deleting unused VDIs in the SR.
Some SR types might round up the `virtual-size` value to make it divisible by a configured block size.
:::

### `vdi-data-destroy`

```
vdi-data-destroy uuid=uuid_of_vdi
```

Destroy the data associated with the specified VDI, but keep the changed block tracking metadata.

:::tip
If you use changed block tracking to take incremental backups of the VDI, ensure that you use the `vdi-data-destroy` command to delete snapshots but keep the metadata. Do not use `vdi-destroy` on snapshots of VDIs that have changed block tracking enabled.
:::

### `vdi-destroy`

```
vdi-destroy uuid=uuid_of_vdi
```

Destroy the specified VDI.

:::tip
If you use changed block tracking to take incremental backups of the VDI, ensure that you use the `vdi-data-destroy` command to delete snapshots but keep the metadata. Do not use `vdi-destroy` on snapshots of VDIs that have changed block tracking enabled.
For Local VHD and NFS SR types, disk space is not immediately released on `vdi-destroy`, but periodically during a storage repository scan operation. If you must force deleted disk space to be made available, call [`sr-scan`](#sr-scan) manually.
:::

### `vdi-disable-cbt`

```
vdi-disable-cbt uuid=uuid_of_vdi
```

Disable changed block tracking for the VDI.

### `vdi-enable-cbt`

```
vdi-enable-cbt uuid=uuid_of_vdi
```

Enable changed block tracking for the VDI.

:::tip
You can enable changed block tracking only on licensed instances of XCP-ng Premium Edition.
:::

### `vdi-export`

```
vdi-export uuid=uuid_of_vdi filename=filename_to_export_to [format=format] [base=uuid_of_base_vdi] [--progress]
```

Export a VDI to the specified file name. You can export a VDI in one of the following formats:

- `raw`
- `vhd`

The VHD format can be *sparse*. If there are unallocated blocks within the VDI, these blocks might be omitted from the VHD file, therefore making the VHD file smaller. You can export to VHD format from all supported VHD-based storage types (EXT, NFS).

If you specify the `base` parameter, this command exports only those blocks that have changed between the exported VDI and the base VDI.

### `vdi-forget`

```
vdi-forget uuid=uuid_of_vdi
```

Unconditionally removes a VDI record from the database without touching the storage back-end. In normal operation, you should be using [`vdi-destroy`](#vdi-destroy) instead.

### `vdi-import`

```
vdi-import uuid=uuid_of_vdi filename=filename_to_import_from [format=format] [--progress]
```

Import a VDI. You can import a VDI from one of the following formats:

- `raw`
- `vhd`

### `vdi-introduce`

```
vdi-introduce uuid=uuid_of_vdi sr-uuid=uuid_of_sr name-label=name_of_new_vdi type=system|user|suspend|crashdump location=device_location_(varies_by_storage_type) [name-description=description_of_vdi] [sharable=yes|no] [read-only=yes|no] [other-config=map_to_store_misc_user_specific_data] [xenstore-data=map_to_of_additional_xenstore_keys] [sm-config=storage_specific_configuration_data]
```

Create a VDI object representing an existing storage device, without actually modifying or creating any storage. This command is primarily used internally to introduce hot-plugged storage devices automatically.

### `vdi-list-changed-blocks`

```
vdi-list-changed-blocks vdi-from-uuid=first-vdi-uuid vdi-to-uuid=second-vdi-uuid
```

Compare two VDIs and return the list of blocks that have changed between the two as a base64-encoded string. This command works only for VDIs that have changed block tracking enabled.

### `vdi-pool-migrate`

```
vdi-pool-migrate uuid=VDI_uuid sr-uuid=destination-sr-uuid
```

Migrate a VDI to a specified SR, while the VDI is attached to a running guest. (Storage live migration)

### `vdi-resize`

```
vdi-resize uuid=vdi_uuid disk-size=new_size_for_disk
```

Change the size of the VDI specified by UUID.

### `vdi-snapshot`

```
vdi-snapshot uuid=uuid_of_the_vdi [driver-params=params]
```

Produces a read-write version of a VDI that can be used as a reference for backup or template creation purposes or both. Use the snapshot to perform a backup rather than installing and running backup software inside the VM. The VM continues running while external backup software streams the contents of the snapshot to the backup media. Similarly, a snapshot can be used as a "gold image" on which to base a template. A template can be made using any VDIs.

Use the optional `driver-params` map parameter to pass extra vendor-specific configuration information to the back-end storage driver that the VDI is based on. For more information, see the storage vendor driver documentation.

A clone of a snapshot should always produce a writable VDI.

### `vdi-unlock`

```
vdi-unlock uuid=uuid_of_vdi_to_unlock [force=true]
```

Attempts to unlock the specified VDIs. If `force=true` is passed to the command, it forces the unlocking operation.

### `vdi-update`

```
vdi-update uuid=uuid
```

Refresh the fields of the VDI object in the database.

## VIF commands

Commands for working with VIFs (Virtual network interfaces).

The VIF objects can be listed with the standard object listing command (`xe vif-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

## VIF parameters

VIFs have the following parameters:

- `uuid` (read only) the unique identifier/object reference for the VIF
- `vm-uuid` (read only) the unique identifier/object reference for the VM that this VIF resides on
- `vm-name-label` (read only) the name of the VM that this VIF resides on
- `allowed-operations` (read only set parameter) a list of the operations allowed in this state
- `current-operations` (read only set parameter) a list of the operations that are currently in progress on this VIF
- `device` (read only) integer label of this VIF, indicating the order in which VIF back-ends were created
- `MAC` (read only) MAC address of VIF, as exposed to the VM
- `MTU` (read only) Maximum Transmission Unit of the VIF in bytes.

This parameter is read-only, but you can override the MTU setting with the `mtu` key using the `other-config` map parameter. For example, to reset the MTU on a virtual NIC to use jumbo frames:

```
xe vif-param-set uuid=<vif_uuid> other-config:mtu=9000
```

- `currently-attached` (read only) true if the device is attached
- `qos_algorithm_type` (read/write) QoS algorithm to use
- `qos_algorithm_params` (read/write map parameter) parameters for the chosen QoS algorithm
- `qos_supported_algorithms` (read only set parameter) supported QoS algorithms for this VIF
- `MAC-autogenerated` (read only) True if the MAC address of the VIF was automatically generated
- `other-config` (read/write map parameter) extra configuration `key:value` pairs
- `other-config:ethtoolrx` (read/write) set to on to enable receive checksum, off to disable
- `other-config:ethtooltx` (read/write) set to on to enable transmit checksum, off to disable
- `other-config:ethtoolsg` (read/write) set to on to enable scatter gather, off to disable
- `other-config:ethtooltso` (read/write) set to on to enable TCP segmentation offload, off to disable
- `other-config:ethtoolufo` (read/write) set to on to enable UDP fragment offload, off to disable
- `other-config:ethtoolgso` (read/write) set to on to enable generic segmentation offload, off to disable
- `other-config:promiscuous` (read/write) true to a VIF to be promiscuous on the bridge, so that it sees all traffic over the bridge. Useful for running an Intrusion Detection System (IDS) or similar in a VM.
- `network-uuid` (read only) the unique identifier/object reference of the virtual network to which this VIF is connected
- `network-name-label` (read only) the descriptive name of the virtual network to which this VIF is connected
- `io_read_kbs` (read only) average read rate in kB/s for this VIF
- `io_write_kbs` (read only) average write rate in kB/s for this VIF
- `locking_mode` (read/write) Affects the VIFs ability to filter traffic to/from a list of MAC and IP addresses. Requires extra parameters.
- `locking_mode:default` (read/write) Varies according to the default locking mode for the VIF network.

If the default-locking-mode is set to `disabled`, XCP-ng applies a filtering rule so that the VIF cannot send or receive traffic. If the default-locking-mode is set to `unlocked`, XCP-ng removes all the filtering rules associated with the VIF. For more information, see [Network Commands](#network-commands).

- `locking_mode:locked` (read/write) Only traffic sent to or sent from the specified MAC and IP addresses is allowed on the VIF. If no IP addresses are specified, no traffic is allowed.
- `locking_mode:unlocked` (read/write) No filters are applied to any traffic going to or from the VIF.
- `locking_mode:disabled` (read/write) XCP-ng applies a filtering rule is applied so that the VIF drops all traffic.

### `vif-create`

```
vif-create vm-uuid=uuid_of_the_vm device=see below network-uuid=uuid_of_network_to_connect_to [mac=mac_address]
```

Create a VIF on a VM.

Appropriate values for the `device` field are listed in the parameter `allowed-VIF-devices` on the specified VM. Before any VIFs exist there, the values allowed are integers from 0-15.

The `mac` parameter is the standard MAC address in the form `aa:bb:cc:dd:ee:ff`. If you leave it unspecified, an appropriate random MAC address is created. You can also explicitly set a random MAC address by specifying `mac=random`.

### `vif-destroy`

```
vif-destroy uuid=uuid_of_vif
```

Destroy a VIF.

### `vif-move`

```
vif-move uuid=uuid network-uuid=network_uuid
```

Move the VIF to another network.

### `vif-plug`

```
vif-plug uuid=uuid_of_vif
```

Attempt to attach the VIF while the VM is in the running state.

### `vif-unplug`

```
vif-unplug uuid=uuid_of_vif
```

Attempts to detach the VIF from the VM while it is running.

### `vif-configure-ipv4`

Configure IPv4 settings for this virtual interface. Set IPv4 settings as below:

```
vif-configure-ipv4 uuid=uuid_of_vif mode=static address=CIDR_address gateway=gateway_address
```

For example:

```
VIF.configure_ipv4(vifObject,"static", " 192.168.1.10/24", " 192.168.1.1")
```

Clean IPv4 settings as below:

```
vif-configure-ipv4 uuid=uuid_of_vif mode=none
```

### `vif-configure-ipv6`

Configure IPv6 settings for this virtual interface. Set IPv6 settings as below:

```
vif-configure-ipv6 uuid=uuid_of_vif mode=static address=IP_address gateway=gateway_address
```

For example:

```
VIF.configure_ipv6(vifObject,"static", "fd06:7768:b9e5:8b00::5001/64", "fd06:7768:b9e5:8b00::1")
```

Clean IPv6 settings as below:

```
vif-configure-ipv6 uuid=uuid_of_vif mode=none
```

## VLAN commands

Commands for working with VLANs (virtual networks). To list and edit virtual interfaces, refer to the PIF commands, which have a VLAN parameter to signal that they have an associated virtual network. For more information, see [PIF commands](#pif-commands). For example, to list VLANs, use `xe pif-list`.

### `vlan-create`

```
vlan-create pif-uuid=uuid_of_pif vlan=vlan_number network-uuid=uuid_of_network
```

Create a VLAN on your XCP-ng server.

### `pool-vlan-create`

```
pool-vlan-create pif-uuid=uuid_of_pif vlan=vlan_number network-uuid=uuid_of_network
```

Create a VLAN on all hosts on a pool, by determining which interface (for example, `eth0`) the specified network is on (on each host) and creating and plugging a new PIF object one each host accordingly.

### `vlan-destroy`

```
vlan-destroy uuid=uuid_of_pif_mapped_to_vlan
```

Destroy a VLAN. Requires the UUID of the PIF that represents the VLAN.

## VM commands

Commands for controlling VMs and their attributes.

### VM selectors

Several of the commands listed here have a common mechanism for selecting one or more VMs on which to perform the operation. The simplest way is by supplying the argument `vm=name_or_uuid`. An easy way to get the uuid of an actual VM is to, for example, execute `xe vm-list power-state=running`. (Get the full list of fields that can be matched by using the command `xe vm-list params=all`. ) For example, specifying `power-state=halted` selects VMs whose `power-state` parameter is equal to `halted`. Where multiple VMs are matching, specify the option `--multiple` to perform the operation. The full list of parameters that can be matched is described at the beginning of this section.

The VM objects can be listed with the standard object listing command (`xe vm-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### VM parameters

VMs have the following parameters:

:::tip
All writable VM parameter values can be changed while the VM is running, but new parameters are *not* applied dynamically and cannot be applied until the VM is rebooted.
:::

- `appliance` (read/write) the appliance/vApp to which the VM belongs
- `uuid` (read only) the unique identifier/object reference for the VM
- `name-label` (read/write) the name of the VM
- `name-description` (read/write) the description string of the VM
- `order start order` (read/write) for vApp startup/shutdown and for startup after HA failover
- `version` (read only) the number of times this VM has been recovered. If you want to overwrite a new VM with an older version, call `vm-recover`
- `user-version` (read/write) string for creators of VMs and templates to put version information
- `is-a-template` (read/write) False unless this VM is a template. Template VMs can never be started, they are used only for cloning other VMs After this value has been set to true it cannot be reset to false. Template VMs cannot be converted into VMs using this parameter.
- `is-control-domain` (read only) True if this is a control domain (domain 0 or a driver domain)
- `power-state` (read only) current power state
- `start-delay` (read/write) the delay to wait before a call to start up the VM returns
- `shutdown-delay` (read/write) the delay to wait before a call to shut down the VM returns
- `memory-dynamic-max` (read/write) dynamic maximum in bytes
- `memory-dynamic-min` (read/write) dynamic minimum in bytes
- `memory-static-max` (read/write) statically set (absolute) maximum in bytes. If you want to change this value, the VM must be shut down.
- `memory-static-min` (read/write) statically set (absolute) minimum in bytes. If you want to change this value, the VM must be shut down.
- `suspend-VDI-uuid` (read only) the VDI that a suspend image is stored on
- `VCPUs-params` (read/write map parameter) configuration parameters for the selected vCPU policy.

You can tune a vCPU’s pinning with

```
xe vm-param-set uuid=<vm_uuid> VCPUs-params:mask=1,2,3
```

The selected VM then runs on physical CPUs 1, 2, and 3 only. You can also tune the vCPU priority (xen scheduling) with the cap and weight parameters. For example:

```
xe vm-param-set uuid=<vm_uuid> VCPUs-params:weight=512 xe vm-param-set uuid=<vm_uuid> VCPUs-params:cap=100
```

A VM with a weight of 512 get twice as much CPU as a domain with a weight of 256 on a contended XCP-ng server. Legal weights range from 1 to 65535 and the default is 256. The cap optionally fixes the maximum amount of CPU a VM will be able to consume, even if the XCP-ng server has idle CPU cycles. The cap is expressed in percentage of one physical CPU: 100 is 1 physical CPU, 50 is half a CPU, 400 is 4 CPUs, and so on The default, 0, means that there is no upper cap.

- `VCPUs-max` (read/write) maximum number of virtual CPUs.
- `VCPUs-at-startup` (read/write) boot number of virtual CPUs
- `actions-after-crash` (read/write) action to take if the VM crashes. For PV guests, valid parameters are:
  - `preserve` (for analysis only)
  - `coredump_and_restart` (record a coredump and reboot VM)
  - `coredump_and_destroy` (record a coredump and leave VM halted)
  - `restart` (no coredump and restart VM)
  - `destroy` (no coredump and leave VM halted)
  - `console-uuids` (read only set parameter) virtual console devices
  - `platform` (read/write map parameter) platform-specific configuration

To disable VDA to switch Windows 10 into Tablet mode:

```
xe vm-param-set uuid=<vm_uuid> platform:acpi_laptop_slate=0
```

To enable VDA to switch Windows 10 into Tablet mode:

```
xe vm-param-set uuid=<vm_uuid> platform:acpi_laptop_slate=1
```

To check current state:

```
xe vm-param-get uuid=<vm_uuid> param-name=platform param-key=acpi_laptop_slate
```

- `allowed-operations` (read only set parameter) list of the operations allowed in this state
- `current-operations` (read only set parameter) a list of the operations that are currently in progress on the VM
- `allowed-VBD-devices` (read only set parameter) list of VBD identifiers available for use, represented by integers of the range 0–15. This list is informational only, and other devices may be used (but might not work).
- `allowed-VIF-devices` (read only set parameter) list of VIF identifiers available for use, represented by integers of the range 0–15. This list is informational only, and other devices may be used (but might not work).
- `HVM-boot-policy` (read/write) the boot policy for HVM guests. Either BIOS Order or an empty string.
- `HVM-boot-params` (read/write map parameter) the order key controls the HVM guest boot order, represented as a string where each character is a boot method: d for the CD/DVD, c for the root disk, and n for network PXE boot. The default is dc.
- `HVM-shadow-multiplier` (read/write) Floating point value which controls the amount of shadow memory overhead to grant the VM. Defaults to 1.0 (the minimum value), and only advanced users should change this value.
- `PV-kernel` (read/write) path to the kernel
- `PV-ramdisk` (read/write) path to the initrd
- `PV-args` (read/write) string of kernel command line arguments
- `PV-legacy-args` (read/write) string of arguments to make legacy VMs boot
- `PV-bootloader` (read/write) name of or path to bootloader
- `PV-bootloader-args` (read/write) string of miscellaneous arguments for the bootloader
- `last-boot-CPU-flags` (read only) describes the CPU flags on which the VM was last booted
- `resident-on` (read only) the XCP-ng server on which a VM is resident
- `affinity` (read/write) The XCP-ng server which the VM has preference for running on. Used by the `xe vm-start` command to decide where to run the VM
- `other-config` (read/write map parameter) A list of key/value pairs that specify extra configuration parameters for the VM. For example, a VM is started automatically after host boot when the `other-config` parameter includes the key/value pair `auto_poweron: true`
- `start-time` (read only) timestamp of the date and time that the metrics for the VM were read. This timestamp is in the form `yyyymmddThh:mm:ss z`, where z is the single letter military timezone indicator, for example, Z for UTC (GMT)
- `install-time` (read only) timestamp of the date and time that the metrics for the VM were read. This timestamp is in the form `yyyymmddThh:mm:ss z`, where z is the single letter military timezone indicator, for example, Z for UTC (GMT)
- `memory-actual` (read only) the actual memory being used by a VM
- `VCPUs-number` (read only) the number of virtual CPUs assigned to the VM for a Linux VM. This number can differ from `VCPUS-max` and can be changed without rebooting the VM using the `vm-vcpu-hotplug` command. For more information, see [`vm-vcpu-hotplug`](#vm-vcpu-hotplug). Windows VMs always run with the number of vCPUs set to `VCPUsmax` and must be rebooted to change this value. Performance drops sharply when you set `VCPUs-number` to a value greater than the number of physical CPUs on the XCP-ng server.
- `VCPUs-Utilization` (read only map parameter) a list of virtual CPUs and their weight
- `os-version` (read only map parameter) the version of the operating system for the VM
- `PV-drivers-version` (read only map parameter) the versions of the paravirtualized drivers for the VM
- `PV-drivers-detected` (read only) flag for latest version of the paravirtualized drivers for the VM
- `memory` (read only map parameter) memory metrics reported by the agent on the VM
- `disks` (read only map parameter) disk metrics reported by the agent on the VM
- `networks` (read only map parameter) network metrics reported by the agent on the VM
- `other` (read only map parameter) other metrics reported by the agent on the VM
- `guest-metrics-lastupdated` (read only) timestamp when the in-guest agent performed the last write to these fields. The timestamp is in the form `yyyymmddThh:mm:ss z`, where z is the single letter military timezone indicator, for example, Z for UTC (GMT)
- `actions-after-shutdown` (read/write) action to take after the VM has shutdown
- `actions-after-reboot` (read/write) action to take after the VM has rebooted
- `possible-hosts` potential hosts of this VM read only
- `dom-id` (read only) domain ID (if available, -1 otherwise)
- `recommendations` (read only) XML specification of recommended values and ranges for properties of this VM
- `xenstore-data` (read/write map parameter) data to be inserted into the xenstore tree (/local/domain/*domid*/vm-data) after the VM is created
- `is-a-snapshot` (read only) True if this VM is a snapshot
- `snapshot_of` (read only) the UUID of the VM that this snapshot is of
- `snapshots` (read only) the UUIDs of all snapshots of this VM
- `snapshot_time` (read only) the timestamp of the snapshot operation that created this VM snapshot
- `memory-target` (read only) the target amount of memory set for this VM
- `blocked-operations` (read/write map parameter) lists the operations that cannot be performed on this VM
- `last-boot-record` (read only) record of the last boot parameters for this template, in XML format
- `ha-always-run` (read/write) True if this VM is always restarted on another host if there is a failure of the host it is resident on. This parameter is now deprecated. Use the `ha-restart-priority` parameter instead.
- `ha-restart-priority` (read/write) restart or best-effort
- `blobs` (read only) binary data store
- `live` (read only) True if the VM is running. False if HA suspects that the VM is not be running.

### `vm-assert-can-be-recovered`

```
vm-assert-can-be-recovered uuid [database] vdi-uuid
```

Tests whether storage is available to recover this VM.

### `vm-call-plugin`

```
vm-call-plugin vm-uuid=vm_uuid plugin=plugin fn=function [args:key=value]
```

Calls the function within the plug-in on the given VM with optional arguments (args:key=value). To pass a "value" string with special characters in it (for example new line), an alternative syntax args:key:file=local\_file can be used in place, where the content of local\_file will be retrieved and assigned to "key" as a whole.

### `vm-cd-add`

```
vm-cd-add cd-name=name_of_new_cd device=integer_value_of_an_available_vbd [vm-selector=vm_selector_value...]
```

Add a new virtual CD to the selected VM. The `device` parameter should be selected from the value of the `allowed-VBD-devices` parameter of the VM.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-cd-eject`

```
vm-cd-eject [vm-selector=vm_selector_value...]
```

Eject a CD from the virtual CD drive. This command only works if exactly one CD is attached to the VM. When there are two or more CDs, use the command `xe vbd-eject` and specify the UUID of the VBD.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-cd-insert`

```
vm-cd-insert cd-name=name_of_cd [vm-selector=vm_selector_value...]
```

Insert a CD into the virtual CD drive. This command only works if there is exactly one empty CD device attached to the VM. When there are two or more empty CD devices, use the `xe vbd-insert` command and specify the UUIDs of the VBD and of the VDI to insert.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-cd-list`

```
vm-cd-list [vbd-params] [vdi-params] [vm-selector=vm_selector_value...]
```

Lists CDs attached to the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

You can also select which VBD and VDI parameters to list.

### `vm-cd-remove`

```
vm-cd-remove cd-name=name_of_cd [vm-selector=vm_selector_value...]
```

Remove a virtual CD from the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-checkpoint`

```
vm-checkpoint new-name-label=name_label [new-name-description=description]
```

Checkpoint an existing VM, using storage-level fast disk snapshot operation where available.

### `vm-clone`

```
vm-clone new-name-label=name_for_clone [new-name-description=description_for_clone] [vm-selector=vm_selector_value...]
```

Clone an existing VM, using storage-level fast disk clone operation where available. Specify the name and the optional description for the resulting cloned VM using the `new-name-label` and `new-name-description` arguments.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-compute-maximum-memory`

```
vm-compute-maximum-memory total=amount_of_available_physical_ram_in_bytes [approximate=add overhead memory for additional vCPUS? true|false] [vm_selector=vm_selector_value...]
```

Calculate the maximum amount of static memory which can be allocated to an existing VM, using the total amount of physical RAM as an upper bound. The optional parameter `approximate` reserves sufficient extra memory in the calculation to account for adding extra vCPUs into the VM later.

For example:

```
xe vm-compute-maximum-memory vm=testvm total=`xe host-list params=memory-free --minimal`
```

This command uses the value of the `memory-free` parameter returned by the `xe host-list` command to set the maximum memory of the VM named `testvm`.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-compute-memory-overhead`

```
vm-compute-memory-overhead
```

Computes the virtualization memory overhead of a VM.

### `vm-copy`

```
vm-copy new-name-label=name_for_copy [new-name-description=description_for_copy] [sr-uuid=uuid_of_sr] [vm-selector=vm_selector_value...]
```

Copy an existing VM, but without using storage-level fast disk clone operation (even if this option is available). The disk images of the copied VM are guaranteed to be *full images*, that is, not part of a copy-on-write (CoW) chain.

Specify the name and the optional description for the resulting copied VM using the `new-name-label` and `new-name-description` arguments.

Specify the destination SR for the resulting copied VM using the `sr-uuid`. If this parameter is not specified, the destination is the same SR that the original VM is in.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-copy-bios-strings`

```
vm-copy-bios-strings host-uuid=host_uuid
```

Copy the BIOS strings of the given host to the VM.

### `vm-crashdump-list`

```
vm-crashdump-list [vm-selector=vm selector value...]
```

List crashdumps associated with the specified VMs.

When you use the optional argument `params`, the value of params is a string containing a list of parameters of this object that you want to display. Alternatively, you can use the keyword `all` to show all parameters. If `params` is not used, the returned list shows a default subset of all available parameters.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-data-source-list`

```
vm-data-source-list [vm-selector=vm selector value...]
```

List the data sources that can be recorded for a VM.

Select the VMs on which to perform this operation by using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all VMs.

Data sources have two parameters – `standard` and `enabled` – which you can seen in the output of this command. If a data source has `enabled` set to `true`, the metrics are currently being recorded to the performance database. If a data source has `standard` set to `true`, the metrics are recorded to the performance database by default (and `enabled` is also set to `true` for this data source). If a data source has `standard` set to `false`, the metrics are *not* recorded to the performance database by default (and `enabled` is also set to `false` for this data source).

To start recording data source metrics to the performance database, run the `vm-data-source-record` command. This command sets `enabled` to `true`. To stop, run the `vm-data-source-forget`. This command sets `enabled` to `false`.

### `vm-data-source-record`

```
vm-data-source-record data-source=name_description_of_data-source [vm-selector=vm selector value...]
```

Record the specified data source for a VM.

This operation writes the information from the data source to the persistent performance metrics database of the specified VMs. For performance reasons, this database is distinct from the normal agent database.

Select the VMs on which to perform this operation by using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all VMs.

### `vm-data-source-forget`

```
vm-data-source-forget data-source=name_description_of_data-source [vm-selector=vm selector value...]
```

Stop recording the specified data source for a VM and forget all of the recorded data.

Select the VMs on which to perform this operation by using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all VMs.

### `vm-data-source-query`

```
vm-data-source-query data-source=name_description_of_data-source [vm-selector=vm_selector_value...]
```

Display the specified data source for a VM.

Select the VMs on which to perform this operation by using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section. If no parameters to select hosts are given, the operation is performed on all VMs.

### `vm-destroy`

```
vm-destroy uuid=uuid_of_vm
```

Destroy the specified VM. This leaves the storage associated with the VM intact. To delete storage as well, use `xe vm-uninstall`.

### `vm-disk-add`

```
vm-disk-add disk-size=size_of_disk_to_add device=uuid_of_device [vm-selector=vm_selector_value...]
```

Add a disk to the specified VMs. Select the `device` parameter from the value of the `allowed-VBD-devices` parameter of the VMs.

The `disk-size` parameter can be specified in bytes or using the IEC standard suffixes KiB, MiB, GiB, and TiB.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-disk-list`

```
vm-disk-list [vbd-params] [vdi-params] [vm-selector=vm_selector_value...]
```

Lists disks attached to the specified VMs. The `vbd-params` and `vdi-params` parameters control the fields of the respective objects to output. Give the parameters as a comma-separated list, or the special key `all` for the complete list.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-disk-remove`

```
vm-disk-remove device=integer_label_of_disk [vm-selector=vm_selector_value...]
```

Remove a disk from the specified VMs and destroy it.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-export`

```
vm-export filename=export_filename [metadata=true|false] [vm-selector=vm_selector_value...]
```

Export the specified VMs (including disk images) to a file on the local machine. Specify the file name to export the VM into using the `filename` parameter. By convention, the file name should have a `.xva` extension.

If the `metadata` parameter is `true`, the disks are not exported. Only the VM metadata is written to the output file. Use this parameter when the underlying storage is transferred through other mechanisms, and permits the VM information to be recreated. For more information, see [vm-import](#vm-import).

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-import`

```
vm-import filename=export_filename [metadata=true|false] [preserve=true|false][sr-uuid=destination_sr_uuid]
```

Import a VM from a previously exported file. If `preserve` is set to `true`, the MAC address of the original VM is preserved. The `sr-uuid` determines the destination SR to import the VM into. If this parameter is not specified, the default SR is used.

If the `metadata` is `true`, you can import a previously exported set of metadata without their associated disk blocks. Metadata-only import fails if any VDIs cannot be found (named by SR and `VDI.location`) unless the `--force` option is specified, in which case the import proceeds regardless. If disks can be mirrored or moved out-of-band, metadata import/export is a fast way of moving VMs between disjoint pools. For example, as part of a disaster recovery plan.

:::tip
Multiple VM imports are performed faster in serial that in parallel.
:::

### `vm-install`

```
vm-install new-name-label=name [template-uuid=uuid_of_desired_template] [template=template_uuid_or_name] [sr-uuid=sr_uuid | sr-name-label=name_of_sr][copy-bios-strings-from=host_uuid]
```

Install or clone a VM from a template. Specify the template name using either the `template-uuid` or `template` argument. Specify an SR using either the `sr-uuid` or `sr-name-label` argument. Specify to install BIOS-locked media using the `copy-bios-strings-from` argument.

:::tip
When installing from a template that has existing disks, by default, new disks are created in the same SR as these existing disks. Where the SR supports it, these disks are fast copies. If a different SR is specified on the command line, the new disks are created there. In this case, a fast copy is not possible and the disks are full copies.
When installing from a template that doesn’t have existing disks, any new disks are created in the SR specified, or the pool default SR when an SR is not specified.
:::

### `vm-is-bios-customized`

```
vm-is-bios-customized
```

Indicates whether the BIOS strings of the VM have been customized.

### `vm-memory-balloon`

```
vm-memory-balloon target=target
```

Set the memory target for a running VM. The given value must be within the range defined by the VM’s memory\_dynamic\_min and memory\_dynamic\_max values.

### `vm-memory-dynamic-range-set`

```
vm-memory-dynamic-range-set min=min max=max
```

Configure the dynamic memory range of a VM. The dynamic memory range defines soft lower and upper limits for a VM’s memory. It’s possible to change these fields when a VM is running or halted. The dynamic range must fit within the static range.

### `vm-memory-limits-set`

```
vm-memory-limits-set static-min=static_min static-max=static_max dynamic-min=dynamic_min dynamic-max=dynamic_max
```

Configure the memory limits of a VM.

### `vm-memory-set`

```
vm-memory-set memory=memory
```

Configure the memory allocation of a VM.

### `vm-memory-shadow-multiplier-set`

```
vm-memory-shadow-multiplier-set [vm-selector=vm_selector_value...] [multiplier=float_memory_multiplier]
```

Set the shadow memory multiplier for the specified VM.

This is an advanced option which modifies the amount of *shadow memory* assigned to a hardware-assisted VM.

In some specialized application workloads, such as Citrix Virtual Apps, extra shadow memory is required to achieve full performance.

This memory is considered to be an overhead. It is separated from the normal memory calculations for accounting memory to a VM. When this command is invoked, the amount of free host memory decreases according to the multiplier and the `HVM_shadow_multiplier` field is updated with the value that Xen has assigned to the VM. If there is not enough XCP-ng server memory free, an error is returned.

The VMs on which this operation should be performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors).

### `vm-memory-static-range-set`

```
vm-memory-static-range-set min=min max=max
```

Configure the static memory range of a VM. The static memory range defines hard lower and upper limits for a VM’s memory. It’s possible to change these fields only when a VM is halted. The static range must encompass the dynamic range.

### `vm-memory-target-set`

```
vm-memory-target-set target=target
```

Set the memory target for a halted or running VM. The given value must be within the range defined by the VM’s memory\_static\_min and memory\_static\_max values.

### `vm-memory-target-wait`

```
vm-memory-target-wait
```

Wait for a running VM to reach its current memory target.

### `vm-migrate`

```
vm-migrate [copy=true|false] [host-uuid=destination_host_uuid] [host=name_or_ uuid_of_destination_host] [force=true|false] [live=true|false] [vm-selector=vm_selector_value...] [remote-master=destination_pool_master_uuid] [remote-username=destination_pool_username] [remote-password=destination_pool_password] [remote-network=destination_pool_network_uuid ][vif:=vif_uuid] [vdi=vdi_uuid]
```

This command migrates the specified VMs between physical hosts. The `host` parameter can be either the name or the UUID of the XCP-ng server. For example, to migrate the VM to another host in the pool, where the VM disks are on storage shared by both hosts:

```
xe vm-migrate uuid=vm_uuid host-uuid=host_uuid
```

To move VMs between hosts in the same pool, which do not share storage (storage live migration):

```
xe vm-migrate uuid=vm_uuid remote-master=12.34.56.78 remote-username=username remote-password=password host-uuid=desination_host_uuid vdi=vdi_uuid
```

You can choose the SR where each VDI gets stored:

```
xe vm-migrate uuid=vm_uuid host-uuid=destination_host_uuid vdi1:vdi_1_uuid=destination_sr_uuid vdi2:vdi_2_uuid=destination_sr2_uuid vdi3:vdi_3_uuid=destination_sr3_uuid
```

Additionally, you can choose which network to attach the VM after migration:

```
xe vm-migrate uuid=vm_uuid vdi1:vdi_1_uuid=destination_sr_uuid vdi2:vdi_2_uuid=destination_sr2_uuid vdi3:vdi_3_uuid=destination_sr3_uuid vif:vif_uuid=network_uuid
```

For cross-pool migration:

```
xe vm-migrate uuid=vm_uuid remote-master=12.34.56.78 remote-username=username remote-password=password host-uuid=desination_host_uuid vdi=vdi_uuid
```

By default, the VM is suspended, migrated, and resumed on the other host. The `live` parameter selects live migration. Live migration keeps the VM running while performing the migration, thus minimizing VM downtime to less than a second. In some circumstances, such as extremely memory-heavy workloads in the VM, live migration falls back into default mode and suspends the VM for a short time before completing the memory transfer.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-pause`

```
vm-pause
```

Pause a running VM. Note this operation does not free the associated memory (see `vm-suspend`).

### `vm-query-services`

```
vm-query-services
```

Query the system services offered by the given VMs.

### `vm-reboot`

```
vm-reboot [vm-selector=vm_selector_value...] [force=true]
```

Reboot the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

Use the `force` argument to cause an ungraceful reboot. Where the shutdown is akin to pulling the plug on a physical server.

### `vm-recover`

```
vm-recover vm-uuid [database] [vdi-uuid] [force]
```

Recovers a VM from the database contained in the supplied VDI.

### `vm-reset-powerstate`

```
vm-reset-powerstate [vm-selector=vm_selector_value...] {force=true}
```

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

This is an *advanced* command only to be used when a member host in a pool goes down. You can use this command to force the pool master to reset the power-state of the VMs to be `halted`. Essentially, this command forces the lock on the VM and its disks so it can be started next on another pool host. This call *requires* the force flag to be specified, and fails if it is not on the command-line.

### `vm-resume`

```
vm-resume [vm-selector=vm_selector_value...] [force=true|false] [on=host_uuid]
```

Resume the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

If the VM is on a shared SR in a pool of hosts, use the `on` argument to specify which pool member to start it on. By default the system determines an appropriate host, which might be any of the members of the pool.

### `vm-retrieve-wlb-recommendations`

```
vm-retrieve-wlb-recommendations
```

Retrieve the workload balancing recommendations for the selected VM.

### `vm-shutdown`

```
vm-shutdown [vm-selector=vm_selector_value...] [force=true|false]
```

Shut down the specified VM.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

Use the `force` argument to cause an ungraceful shutdown, similar to pulling the plug on a physical server.

An HVM mode VM requires `force=true` to be shutdown, unless [Guest Tools](../../vms#guest-tools) have been installed.

### `vm-snapshot`

```
vm-snapshot new-name-label=name_label [new-name-description+name_description]
```

Snapshot an existing VM, using storage-level fast disk snapshot operation where available.

### `vm-start`

```
vm-start [vm-selector=vm_selector_value...] [force=true|false] [on=host_uuid] [--multiple]
```

Start the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

If the VMs are on a shared SR in a pool of hosts, use the `on` argument to specify which pool member to start the VMs on. By default the system determines an appropriate host, which might be any of the members of the pool.

### `vm-suspend`

```
vm-suspend [vm-selector=vm_selector_value...]
```

Suspend the specified VM.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-uninstall`

```
vm-uninstall [vm-selector=vm_selector_value...] [force=true|false]
```

Uninstall a VM, destroying its disks (those VDIs that are marked RW and connected to this VM only) in addition to its metadata record. To destroy just the VM metadata, use `xe vm-destroy`.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

### `vm-unpause`

```
vm-unpause
```

Unpause a paused VM.

### `vm-vcpu-hotplug`

```
vm-vcpu-hotplug new-vcpus=new_vcpu_count [vm-selector=vm_selector_value...]
```

Dynamically adjust the number of vCPUs available to a running Linux VM. The number of vCPUs is bounded by the parameter `VCPUs-max`. Windows VMs always run with the number of vCPUs set to `VCPUs-max` and must be rebooted to change this value.

The Linux VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

:::tip
When running Linux VMs without XCP-ng VM Tools installed, run the following command on the VM as `root` to ensure the newly hot plugged vCPUs are used: `# for i in /sys/devices/system/cpu/cpu[1-9]*/online; do if [ "$(cat $i)" = 0 ]; then echo 1 > $i; fi; done`
:::

### `vm-vif-list`

```
vm-vif-list [vm-selector=vm_selector_value...]
```

Lists the VIFs from the specified VMs.

The VM or VMs on which this operation is performed are selected using the standard selection mechanism. For more information, see [VM selectors](#vm-selectors). The selectors operate on the VM records when filtering, and *not* on the VIF values. Optional arguments can be any number of the [VM parameters](#vm-parameters) listed at the beginning of this section.

## Scheduled snapshots

:::warning
We advise to use Xen Orchestra instead of this method. See [Xen Orchestra rolling snapshots](https://xen-orchestra.com/docs/rolling_snapshots.html).
:::

Commands for controlling VM scheduled snapshots and their attributes.

The vmss objects can be listed with the standard object listing command (`xe vmss-list`), and the parameters manipulated with the standard parameter commands. For more information, see [Low-level parameter commands](#low-level-parameter-commands)

### `vmss-create`

```
vmss-create enabled=True/False name-label=name type=type frequency=frequency retained-snapshots=value name-description=description schedule:schedule
```

Creates a snapshot schedule in the pool.

For example:

```
xe vmss-create retained-snapshots=9 enabled=true frequency=daily name-description=sample name-label=samplepolicy type=snapshot schedule:hour=10 schedule:min=30
```

Snapshot schedules have the following parameters:

|Parameter Name|Description|Type|
|:-------------|:----------|:---|
|`name-label`|Name of the snapshot schedule.|Read/write|
|`name-description`|Description of the snapshot schedule.|Read/write|
|`type`|Disk snapshot or memory snapshot.|Read/write|
|`frequency`|Hourly; Daily; Weekly|Read/write|
|`retained-snapshots`|Snapshots to be retained. Range: 1-10.|Read/write|
|`schedule`|`schedule:days` (Monday to Sunday), `schedule:hours` (0 to 23), `schedule:minutes` (0, 15, 30, 45)|Read/write|

### `vmss-destroy`

```
vmss-destroy uuid=uuid
```

Destroys a snapshot schedule in the pool.

## USB passthrough

## USB passthrough enable/disable

```
pusb-param-set uuid=pusb_uuid passthrough-enabled=true/false
```

Enable/disable USB Pass-through.

### `pusb-scan`

```
pusb-scan host-uuid=host_uuid
```

Scan PUSB and update.

### `vusb-create`

```
vusb-create usb-group-uuid=usb_group_uuid vm-uuid=vm_uuid
```

Creates a virtual USB in the pool. Start the VM to pass through the USB to the VM.

### `vusb-unplug`

```
vusb-unplug uuid=vusb_uuid
```

Unplugs USB from VM.

### `vusb-destroy`

```
vusb-destroy uuid=vusb_uuid
```

Removes the virtual USB list from VM.
