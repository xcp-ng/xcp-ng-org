# Compute and GPU

This section is dedicated to compute related things, from Xen to GPU/vGPU or PCI passthrough.

## PCI Passthrough

### 0. Prerequisites 

:::warning
Ensure VT-d/IOMMU Support Is Enabled
:::

In order to use PCI passthrough your host system must have VT-d/IOMMU functionality enabled. This should be more commonly enabled by default on enterprise hardware than on consumer hardware. It can be enabled in the BIOS/UEFI of systems with CPUs and chipsets which support it. For Intel platforms the feature is typically referred to as VT-d (Intel Virtualization Technology for Directed I/O); on AMD platforms it is typically listed as IOMMU or AMD-Vi. Please note that this is not the same as VT-x/AMD-v virtualisation support, and so these options are often listed separately.

Consult your system or motherboard manual for instructions on where to find the setting in your BIOS/UEFI. In addition, system BIOS updates may reset the feature to its default state, which may require you to re-enable it.

If you attempt to perform PCI passthrough on a system which does not have VT-d/IOMMU enabled, you may encounter the following error when you start the target virtual machine:

```
Internal error: xenopsd internal error: Device.PCI.Cannot_add(_, _)
```

### 1. Find your devices ID ([B/D/F](https://en.wikipedia.org/wiki/PCI_configuration_space#BDF)) on the PCI bus using one of the following methods:

**Method 1: List PCI Devices with `lspci`**

_This method is the easiest way to find devices._

```
[root@xen ~]# lspci
...
04:01.0 Ethernet controller: Intel Corporation 82541PI Gigabit Ethernet Controller (rev 05)
```

**Method 2: List System Device Classes with `find`**

_This method works best for finding the device ID by class. The example below the class is `net` and shows how to find the device ID of a specific network interface._

```
[root@xen ~]# find /sys/class/net -exec readlink {} +
../../devices/virtual/net/lo
../../devices/pci0000:00/0000:04:01.0/net/eth1
```

### 2. Tell XCP-ng not to use this device ID for Dom0

Add the **`xen-pciback.hide`** parameter to the kernel boot parameters:
```bash
/opt/xensource/libexec/xen-cmdline --set-dom0 "xen-pciback.hide=(04:01.0)"
```
> You can hide multiple devices. If you wanted to add another device at `00:19.0` just append it to the parameter.
> 
> `/opt/xensource/libexec/xen-cmdline --set-dom0 "xen-pciback.hide=(04:01.0)(00:19.0)"`

To remove any passthrough devices from dom0:
```bash
/opt/xensource/libexec/xen-cmdline --delete-dom0 xen-pciback.hide
```

### 3. Reboot the XCP-ng host

`[root@xen ~]# reboot`

### 4. Check with `xl pci-assignable-list` on CLI

```
[root@xen ~]# xl pci-assignable-list
0000:04:01.0
```

### 5. Put this PCI device 'into' your VM

`[root@xen ~]# xe vm-param-set`**`other-config:pci=0/0000:04:01.0`**`uuid=<vm uuid>`

> You can also passtrough multiple devices. If you wanted to passtrough another device at `00:19.0` just append it to the parameter.
> 
> `[root@xen ~]# xe vm-param-set`**` other-config:pci=0/0000:04:01.0,0/0000:00:19.0 `**`uuid=<vm uuid>`

### 6. Start your VM and be happy :-)

`[root@xen ~]# xe vm-start uuid=<vm uuid>`


## GPU Passthrough

:::warning
nVIDIA consumer grade GPUs won't work due to a driver limitation (on purpose). AMD chips will work perfectly.
:::

## USB Passthrough

:::tip
No need to tinker any file manually
:::

It's fairly easy using `xe` CLI:

```
[root@xenserver ~]# xe pusb-list
uuid ( RO)            : 9c14c8b3-f30b-b5b8-2b01-201f703d2497
            path ( RO): 2-1.6
       vendor-id ( RO): 1f75
     vendor-desc ( RO): Innostor Technology Corporation
      product-id ( RO): 0903
    product-desc ( RO):
          serial ( RO): 000000000000000244
         version ( RO): 2.10
     description ( RO): Innostor Technology Corporation_000000000000000244


uuid ( RO)            : 10fbec89-4472-c215-5d55-17969b473ee6
            path ( RO): 2-1.1
       vendor-id ( RO): 0781
     vendor-desc ( RO): SanDisk Corp.
      product-id ( RO): 5591
    product-desc ( RO):
          serial ( RO): 4C530001151223117134
         version ( RO): 2.10
     description ( RO): SanDisk Corp._4C530001151223117134
```

Find your USB device there, and note the `uuid`. Then enable passthrough:

```
[root@xenserver ~]# xe pusb-param-set uuid=10fbec89-4472-c215-5d55-17969b473ee6 passthrough-enabled=true
```

Then, shut down the target guest VM that you want to pass the USB device through since hot plug is not supported. Attach the USB device to the VM, run the following command:

```
[root@xenserver ~]# xe vusb-create usb-group-uuid=<usb_group_uuid> vm-uuid=<vm_uuid>
```

Check the following as an example, firstly get usb-group uuid from command usb-group-list and then attach the device to target VM through command vusb-create:

```
[root@xenserver ~]# xe usb-group-list PUSB-uuids=10fbec89-4472-c215-5d55-17969b473ee6
uuid ( RO)                : 1f731f6a-6025-8858-904d-c98548f8bb23
name-label ( RW): Group of 0781 5591 USBs
name-description ( RW):
...
[root@xenserver ~]# xe vusb-create usb-group-uuid=1f731f6a-6025-8858-904d-c98548f8bb23 vm-uuid=4feeb9b2-2176-b69d-b8a8-cf7289780a3f
aac4a96f-3fd9-0150-7138-fbd5a80e068a
```

Finally, start the target guest VM:

```
[root@xenserver ~]# xe vm-start uuid=<vm_uuid>
```

## vGPU

### nVIDIA vGPU

:::warning
Due to a proprietary piece of code in XenServer, XCP-ng doesn't have (yet) support for nVIDIA vGPUs.
:::

### MxGPU (AMD vGPU)

AMD GPU are trivial using industry standard.

1. Enable SR-IOV in the server's BIOS
2. Install XCP-ng
3. Download Citrix XenServer from AMD's Drivers & Support page. (Currently version 1.0.5 for XenServer 7.4)
4. Copy the `mxgpu-1.0.5.amd.iso` to the host
5. Install the supplemental pack:

`cd /tmp`

`xe-install-supplemental-pack mxgpu-1.0.5.amd.iso`

6. Reboot the XCP-ng
7. Assign an MxGPU to the VM from the VM properties page.  Go to the GPU section.  From the Drop down choose how big of a slice of the GPU you want on the VM and click OK

Start the VM and log into the guest OS and load the appropriate guest driver from AMD's Drivers & Support page.


> Known working cards:
* S7150x2

## Advanced Xen

### NUMA affinity

On multi-socket and MCM systems, the NUMA affinity may benefit memory-bound applications by restricting a VM to a specific NUMA node. That way, memory and cache accesses are kept local.

The Xen scheduler implements two types of affinity: `soft` and `hard`. By default, it uses `soft`, a best effort algorithm which tries to achieve the memory locality. Since there's no guarantee, if the sysadmin wants to make sure that a VM will only run on a certain node, he needs to configure the hard affinity through the `VCPUs-params:mask` VM attribute.

Taking a **8C/16T** dual socket as example, the topology would be:

```
node0: 0-7
node1: 8-15
```

If we run `xl list --numa`, it'll return `all` as the node affinity. This indicates that the VM can run on any available nodes and cores. Now, change the VM affinity to node1 (VM reboot required):

```
xe vm-param-set uuid=[VM-UUID] VCPUs-params:mask=8,9,10,11,12,13,14,15`
```

Check the new affinity. It'll now display `1` instead of `all`, indicating that the VM will only be allowed to run on `node1` cores:
```
xl list --numa
```

In order to reset the config, just remove the attribute (VM reboot required):
```
xe vm-param-remove uuid=[VM-UUID] param-name=VCPUs-params param-key=mask`
```

Other useful commands for listing the VM core affinity and cores per numa node(s):
```
xl vcpu-list
xenpm get-cpu-topology
```
References:
* [https://xcp-ng.org/forum/topic/2265/using-numa-split-on-xcp-ng](https://xcp-ng.org/forum/topic/2265/using-numa-split-on-xcp-ng)
* [https://wiki.xen.org/wiki/Xen_on_NUMA_Machines](https://wiki.xen.org/wiki/Xen_on_NUMA_Machines)
* [https://wiki.xenproject.org/wiki/Tuning_Xen_for_Performance](https://wiki.xenproject.org/wiki/Tuning_Xen_for_Performance)
