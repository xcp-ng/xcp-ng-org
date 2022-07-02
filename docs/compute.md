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

:::warning
You may not be able to passthrough USB controllers
:::

When attempting to enable PCI passthrough on USB controllers, you may see an error when starting the VM in your logs similar to

```
Internal error: xenopsd internal error: Cannot_add(0000:00:1d.0, Xenctrlext.Unix_error(30, "1: Operation not permitted"))
```

and an error in `/var/log/xen/hypervisor.log`

```
[2020-08-22 10:09:03] (XEN) [  297.542134] [VT-D] It's disallowed to assign 0000:08:00.0 with shared RMRR at 7ba77000 for Dom32753.
[2020-08-22 10:09:03] (XEN) [  297.542136] d[IO]: assign (0000:08:00.0) failed (-1)
```

This indicates that your device is using [RMRR](https://access.redhat.com/sites/default/files/attachments/rmrr-wp1.pdf).  Intel [IOMMU does not allow DMA to these devices](https://www.kernel.org/doc/Documentation/Intel-IOMMU.txt) and therefore PCI passthrough is not supported.

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
/opt/xensource/libexec/xen-cmdline --set-dom0 "xen-pciback.hide=(0000:04:01.0)"
```
> You can hide multiple devices. If you wanted to add another device at `00:19.0` just append it to the parameter.
>
> `/opt/xensource/libexec/xen-cmdline --set-dom0 "xen-pciback.hide=(0000:04:01.0)(0000:00:19.0)"`

To remove any passthrough devices from dom0:
```bash
/opt/xensource/libexec/xen-cmdline --delete-dom0 xen-pciback.hide
```

:::tip
This kernel parameter is not retained when you upgrade an XCP-ng host [using the installation ISO](upgrade.md#upgrade-via-installation-iso-recommended). Remember to re-do this step after the upgrade.
:::

### 3. Reboot the XCP-ng host

`[root@xen ~]# reboot`

### 4. Check with `xl pci-assignable-list` on CLI

```
[root@xen ~]# xl pci-assignable-list
0000:04:01.0
```

### 5. Put this PCI device 'into' your VM

`[root@xen ~]# xe vm-param-set`**`other-config:pci=0/0000:04:01.0`**`uuid=<vm uuid>`

> You can also pass through multiple devices. If you wanted to pass through another device at `00:19.0` just append it to the parameter.
>
> `[root@xen ~]# xe vm-param-set`**` other-config:pci=0/0000:04:01.0,0/0000:00:19.0 `**`uuid=<vm uuid>`

### 6. Start your VM and be happy :-)

`[root@xen ~]# xe vm-start uuid=<vm uuid>`

## GPU Passthrough
To passthrough a complete graphics card to a VM (not virtualize it into multiple virtual vGPUs, which is different, see the vGPU section below), just follow the regular PCI passthrough instructions, no special steps are needed. Most Nvidia and AMD video cards should work without issue.  

:::tip
Previously, Nvidia would block the use of gaming/consumer video cards for passthrough (the Nvidia installer would throw an **Error 43** when installing the driver inside your VM). They lifted this restriction in 2021 with driver R465 and above, so be sure to use the latest driver. [Details from Nvidia here.](https://nvidia.custhelp.com/app/answers/detail/a_id/5173/)
:::

## vGPU

### NVIDIA vGPU

:::warning
Due to a proprietary piece of code in XenServer, XCP-ng doesn't have (yet) support for NVIDIA vGPUs.
:::

### MxGPU (AMD vGPU)

AMD GPU are trivial using industry standard.  
Version 2.0 of the mxgpu iso should work on any 8.X version of XCP-ng

1. Enable SR-IOV in the server's BIOS
2. Install XCP-ng
3. Download Citrix XenServer from AMD's Drivers & Support page. (Currently version 2.0.0 for XenServer 8.1)
4. Copy the `mxgpu-2.0.0.amd.iso` to the host
5. Install the supplemental pack:

`cd /tmp`

`xe-install-supplemental-pack mxgpu-2.0.0.amd.iso`

6. Reboot the XCP-ng
7. Assign an MxGPU to the VM from the VM properties page.  Go to the GPU section.  From the Drop down choose how big of a slice of the GPU you want on the VM and click OK

Start the VM and log into the guest OS and load the appropriate guest driver from AMD's Drivers & Support page.

> Known working cards:
* S7150x2

## USB Passthrough

:::tip
There's no need to alter any files manually as some older guides suggest
:::

It's fairly easy using the `xe` CLI. First use `xe pusb-list` to list all the physical USB devices on your host available for passthrough:

```
[root@xenserver ~]# xe pusb-list
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

Find your USB device there, and note the `uuid`. Then use that uuid to enable passthrough for it:
```
[root@xenserver ~]# xe pusb-param-set uuid=10fbec89-4472-c215-5d55-17969b473ee6 passthrough-enabled=true
```
This will create a `usb-group` containing this USB device. We need to find the uuid of that group, so we use the `usb-group-list` command, specifying the physical USB uuid we got in step one: 
```
[root@xenserver ~]# xe usb-group-list PUSB-uuids=10fbec89-4472-c215-5d55-17969b473ee6
uuid ( RO)                : 1f731f6a-6025-8858-904d-c98548f8bb23
name-label ( RW): Group of 0781 5591 USBs
name-description ( RW):
```
Note the uuid of this usb-group, then use it in the following command to attach this USB device to your desired VM. Remember to first shut down the target VM as hot-plug for USB passthrough is not supported:
```
xe vusb-create usb-group-uuid=<usb_group_uuid> vm-uuid=<vm_uuid>
```
So using the examples above, it would look like:
```
xe vusb-create usb-group-uuid=1f731f6a-6025-8858-904d-c98548f8bb23 vm-uuid=4feeb9b2-2176-b69d-b8a8-cf7289780a3f
```
Finally, start the target guest VM:
```
[root@xenserver ~]# xe vm-start uuid=<vm_uuid>
```

**Note:** If you get a message containing `internal error` when trying to start the VM after assigning it a USB device, try the following command to ensure its `platform:usb` parameter is set correctly:
```
xe vm-param-set uuid=<vm_uuid> platform:usb=True
```
In the future if you ever need to unplug the virtual USB device from your VM, or remove and unassign it completely, find the uuid of the virtual USB device by running `xe vusb-list`. Then use the uuid of the virtual USB device in one or both of the following commands:
```
xe vusb-unplug uuid=<vusb_uuid>
xe vusb-destroy uuid=<vusb_uuid>
```

## VM load balancing

This feature is available via Xen Orchestra, and its plugin "Load balancer":

![](https://xcp-ng.org/assets/img/screenshots/loadbalancer.png)

When using a virtualization platform, you have multiple physical hosts, which runs your virtual machines (VMs). Each host has a limited set of resources: CPU, RAM, network bandwidth etc.

:::tip
Maybe you already heard about VMWare DRS (Distributed Resource Scheduler): that's the same principle here, but for XCP-ng.
:::

So the first objective is to **adapt your VM placement in live** (without service interruption), depending of the load. Let's take a simple example:

These 2 hosts are running 6 VMs:

![](https://xen-orchestra.com/blog/content/images/2016/03/loadbalance1.png)

> Let's say both hosts are using only 5% of all their CPUs

Suddenly, one of your VM starts to have a very high CPU load (**in yellow**): performance of other VMs on this same host could be impacted negatively (**in pink**):

![](https://xen-orchestra.com/blog/content/images/2016/03/loadbalance3.png)

> Host 1 still using 5% of its CPUs, but host 2 is now a 95%.

We are detecting it and now move others VM to the other host, like this:

![](https://xen-orchestra.com/blog/content/images/2016/03/loadbalance4.png)

> Host 1 has a slightly increased load, but host 2 can be fully used for the "problematic" VM without disrupting service of other VMs.

This way, the impact of your high load usage on one VM doesn't penalize everyone.

But it's not the only way to see this: there is multiple possibilities to "optimize" your existing resource usage:

* maybe you want to **spread the VM load** on the maximum number of server, to get the most of your hardware? (previous example)
* maybe you want to **reduce power consumption** and migrate your VMs to the minimum number of hosts possible? (and shutdown useless hosts)
* or maybe **both**, depending of your own schedule?

Those ways can be also called **modes**: "performance" for 1, "density" for number 2 and "mixed" for the last.

### In Xen Orchestra

We started to work on the "performance" mode inside Xen Orchestra. Our first objectives were:

* to provide an easy way to create "plans" to supervise load balancing with simple rules
* to work only on the host CPU usage
* to start a detection every 2 minutes
* to work across various pools
* to be able to exclude hosts

#### Creating a plan

Creating a plan is the first step. In our example, we want to create a plan called "perf1", using "performance mode", and acting only on one pool, labelled "Lab Pool":

By default, the CPU threshold is 90%, but it could be set manually (here at 80%):

![](https://xen-orchestra.com/blog/content/images/2016/03/plan_creation.png)

#### Let's play!

Here is the initial situation:

![](https://xen-orchestra.com/blog/content/images/2016/03/beforeload-1.png)

> 4x VMs on 2 hosts, *lab1* and *lab2*

CPU usage on both hosts is very low:

![](https://xen-orchestra.com/blog/content/images/2016/03/lab1.png)

> CPU usage on *lab1*

![](https://xen-orchestra.com/blog/content/images/2016/03/lab2.png)

> CPU usage on *lab2*

Let's trigger a very high CPU load on the VM "Windows Server NFS Share" (using Prime95), which is on *lab1*:

![](https://xen-orchestra.com/blog/content/images/2016/03/maxloadlab1.png)

> *lab1* starts to work at 100% on all it's CPUs

Both "nfs share" and "Salt Master" VMs will suffer this concurrent CPU usage and won't have enough power to deliver if necessary. And when the average on last 2 minutes hits the threshold (80% here), actions are taken:

![](https://xen-orchestra.com/blog/content/images/2016/03/actionloadbalancing.png)

![](https://xen-orchestra.com/blog/content/images/2016/03/migrated.png)


> *lab1* is now working a full speed with the only the VM using all it's CPUs.

Let's check the new CPU load on *lab2*:

![](https://xen-orchestra.com/blog/content/images/2016/03/aftermigration.png)

> Load is only slightly increased due to 2 new VMs

### Conclusion

With this simple but first initial algorithm, we managed to mitigate automatically an issue of VM resource usage. Of course, it works also in cases when you have to really spread the load on all your servers (i.e. when the sum of all VM usage is higher than the threshold): that's the exact same principle.

You have more than 2 hosts? Again, same idea, it will also work.

## VM anti-affinity

VM anti-affinity is a feature that prevents VMs with the same user tags to run on the same host. To use this functionality, feel free to read the Xen Orchestra documentation: [Xen Orchestra VM anti-affinity](https://xen-orchestra.com/docs/load_balancing.html#vm-anti-affinity).

## Advanced Xen

### NUMA affinity

On multi-socket and MCM systems, the NUMA affinity may benefit memory-bound applications by restricting a VM to a specific NUMA node. That way, memory and cache accesses are kept local.

The Xen scheduler implements two types of affinity: `soft` and `hard`. By default, it uses `soft`, a best effort algorithm which tries to achieve the memory locality. Since there's no guarantee, if the sysadmin wants to make sure that a VM will only run on a certain node they will need to configure the hard affinity through the `VCPUs-params:mask` VM attribute.

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

Other useful commands for listing the VM core affinity and cores per NUMA node(s):
```
xl vcpu-list
xenpm get-cpu-topology
xl info --numa
```

Other ways control the vCPUs placement, using the `xl` CLI:
```
xl vcpu-pin <Domain> <vcpu id> <cpu id>
xl vcpu-pin "Domain 0" all 2-5
```
You can use the domain name or the domain ID you can obtain from the `xl list` command.

Or using the CPUPool functionality:
```
xl cpupool-numa-split # Will create a cpupool by NUMA node
xl cpupool-migrate <VM> <Pool> # Will migrate a VM to the given pool
```

:::warning
Be careful, the changes done using `xl` only affect vCPU at the moment, the memory of the VM will not be moved between node nor the pinning stay after a reboot. You need to use `xe` for it to be taken into account at the VM startup.
:::

You can see the current memory scheme of the VM using the `debug-key` interface with the `u` key. e.g. `xl debug-key u; xl dmesg`.

References:
* <https://xcp-ng.org/forum/topic/2265/using-numa-split-on-xcp-ng>
* <https://wiki.xen.org/wiki/Xen_on_NUMA_Machines>
* <https://wiki.xenproject.org/wiki/Tuning_Xen_for_Performance>
