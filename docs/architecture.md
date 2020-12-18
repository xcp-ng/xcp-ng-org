# Architecture

This page contains advanced info regarding XCP-ng architecture.

## Storage

### Virtual disks on HVMs and PV guests

![](../assets/img/tapdisk-architecture.jpg)

#### `qemu-dm` and `tapdisk` at startup

When a VM starts, whether it is a HVM or a PV guest, it is always started as a HVM. So during the boot process, the device of the VM is emulated. The process for mapping a virtual device from a host to a guest is called `qemu-dm`. There is one instance per disk like `tapdisk`, another process used to read/write in a VHD file the disk data. `qemu-dm` reads and writes to a `/dev/blktap/blktapX` host device, which is created by tapdisk and is managed by a driver in Dom 0: `blktap`.

For each read/write in the VM disk, requests pass through an emulated driver, then `qemu-dm` and finally they are sent to `blktap`; since `tapdisk` is the creator/manager of the `blktap` device, it handles requests by reading them through a shared ring. The requests are consumed by reading or writing in the VHD file representing the disk of the VM, the `libaio` is used to access/modify the physical blocks. Finally `tapdisk` responds to `qemu-dm` by writing responses in the same ring.

#### tapdisk & PV guests

The process described above is used for HVMs and also for PV guests (at startup, PV drivers are not loaded).
After starting a PV guest, the emulated driver in the VM is replaced by `blkfront` (a PV driver) which allows to communicate directly with `tapdisk` using a protocol: `blkif`; `blktap` and `qemu-dm` then become useless to handle devices requests. Note that system calls are used with two drivers: `eventchn dev` and `gntdev` to map VM memory pages in the user space of the host. Thus a shared ring can be used to receive requests directly from `tapdisk` in host user space instead of using the kernel space.

## API

XCP-ng uses **XAPI** as main API. This API is used by all clients. For more details go to [XAPI website](https://xapi-project.github.io/).

:::tip
If you want to build an application on top of XCP-ng, we strongly suggest the Xen Orchestra API instead of XAPI. *Xen Orchestra* provides an abstraction layer that's easier to use, and also acts as a central point for your whole infrastructure.
:::

### XAPI architecture

XAPI is a toolstack split in two parts: `xenopsd` and XAPI itself (see the diagram below):

![](https://xcp-ng.org/assets/img/Xenstack.png)

:::warning
XCP-ng is meant to use XAPI. Don't use it with `xl` or anything else!
:::

#### General design

![](https://xapi-project.github.io/xapi/xapi.png)

#### Objects

![](https://xapi-project.github.io/xen-api/classes.png)

#### Pool design

![](https://xapi-project.github.io/getting-started/pool.png)


### Modifications

:::warning
Those changes aren't officially supported, and will be also wiped after an ISO upgrade.
:::

#### 24h task timeout

Edit the `/etc/xapi.conf` file, and uncomment/change `pending_task_timeout` from:

```ini
# pending_task_timeout = 86400 # 1 day in seconds
```

To:

```ini
pending_task_timeout = 172800
```

:::tip
In this example, `172800` seconds means two days.

After changing the configuration, don't forget to restart the toolstack with `xe-toolstack-restart`.
:::
