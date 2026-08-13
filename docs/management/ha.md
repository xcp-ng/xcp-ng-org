---
heading_emoji:
  introduction: clipboard
  concepts: mortar_board
  requirements: white_check_mark
  configuration: gear
  updatesmaintenance: wrench
  behavior: left_right_arrow
  architecture: nerd_face
---

# High availability

In XCP-ng, high availability (or HA) is the ability to detect a failed host and automatically boot all the VMs that were running on this host to the other alive machines.

## Introduction {#introduction}

Implementing VM High availability (HA) is a real challenge.

First, because you need to reliably detect when a server has really failed to avoid unpredictable behavior. 

But that's not the only one. If you lose the network link but not the shared storage, how to ensure you will not write simultaneously on the storage and corrupt all your data as a result?

We'll see how to protect your precious VM in multiple cases, and we'll illustrate that with real examples.

:::info
You can have high availability with as few as 2 hosts, but we strongly recommended to do it with 3 at the minimum, for obvious split-brain issues you might encounter.
:::

:::warning
High availability requires **far more maintenance** and will create some traps if you are not aware. In short, it comes at a cost. 

Before using it, **please think about it carefully**: do you **REALLY** need it? We've seen people having less uptime using HA than when not using it, because you **must understand** what you are doing every time you reboot or update a host.
:::

## Concepts {#concepts}

The pool concept allows hosts to exchange their data and status:

* If you lose a host, that will be detected by the pool master.
* If you lose the master, another host will take over the master role automatically.

To be sure a host is really unreachable, HA in XCP-ng uses multiple heartbeat mechanisms. As you saw in the introduction, it's not enough to check the network: what about storage? That's why there is also a specific heartbeat for shared storage between hosts in a pool. In fact, each host regularly writes some blocks in a dedicated VDI. That's the principle of the [Dead man's switch](http://en.wikipedia.org/wiki/Dead_man%27s_switch). 

This concept is important, and it explains why you need to **configure high availability with a shared storage** (iSCSI, Fiber Channel or NFS) to avoid simultaneous writing in a VM disk.

Here are the possible cases and how they are dealt with:

* **Lost both network and storage heartbeat**: the host is considered unreachable and the HA plan is started
* **Lost storage but not network**: if the host can contact a majority of pool members, it can stay alive. Indeed, in this scenario, there is no harm for the data (can't write to the VM disks). If the host is alone (i.e can't contact any other host or less than the majority), it goes for a reboot procedure.
* **Lost network but not storage (worst case!)**: the host considers itself as problematic and starts a reboot procedure (hard power off and restart). This fencing procedure guarantees the sanity of your data.

## Requirements {#requirements}

Enabling HA in XCP-ng requires thorough planning and validation of several prerequisites:

- **Pool-Level HA only**: HA can only be configured at the pool level, not across different pools.
- **Minimum of 3 hosts recommended**: While HA can function with just 2 XCP-ng servers in a pool, we recommend using **at least 3** to prevent issues such as a split-brain scenario. With only 2 hosts, they risk getting fenced if the connection between them is lost.
- **Shared storage requirements**: You must have shared storage available, including at least one iSCSI, NFS, XOSTOR or Fiber Channel LUN with a minimum size of **4 GiB for the heartbeat Storage Repository (SR)**. The HA mechanism creates two volumes on this SR:
    - A **4 MB heartbeat volume** for monitoring host status.
    - A **256 MB metadata volume** to store pool master information for master failover situations.
- **Dedicated heartbeat SR optional**: While it's not necessary to dedicate a separate SR for the heartbeat, you can choose to do so. Alternatively, you can use the same SR that hosts your VMs.
- **Unsupported storage for heartbeat**: Storage using SMB or iSCSI authenticated via CHAP **cannot be used as the heartbeat SR**.
- **Static IP addresses**: Make sure that all hosts have static IP addresses to avoid disruptions from DHCP servers potentially reassigning IPs.
- **Dedicated bonded interface recommended**: For optimal reliability, we recommend using a dedicated bonded interface for the HA management network.
- **VM agility for HA protection**: For a VM to be protected by HA, it must meet certain agility requirements:
    - The VM’s virtual disks must **reside on shared storage**, such as iSCSI, NFS, or Fibre Channel LUN, which is also necessary for the storage heartbeat.
    - The VM must **support live migration**.
    - The VM should **not have a local DVD drive connection configured**.
    - The VM’s network interfaces should be on **pool-wide networks**.

:::tip
For enabling HA, we **strongly recommend** to use a bonded management interface for servers in the pool, and to configure multipathed storage for the heartbeat SR.
:::


If you create VLANs and bonded interfaces via the CLI, they might not be active or properly connected, causing a VM to appear non-agile and, therefore, unprotected by HA. 

Use the `pif-plug` command in the CLI to activate VLAN and bond PIFs, ensuring the VM becomes agile. 

Additionally, the `xe diagnostic-vm-status` CLI command can help identify why a VM isn’t agile, allowing you to take corrective action as needed.


## Configuration {#configuration}

### Prepare the pool

You can check if your pool has HA enabled or not. 

* In Xen Orchestra, for each pool where HA has been enabled, go to the **Home → Pool** view and you'll see a small "cloud" icon with a green check.
* In the **Pool → Advanced** tab, you'll see a **High Availability** switch that shows if HA is enabled or not:

![Pool's advanced tab showing the heartbeat SR and the High Availability option.](../assets/img/xo-ha-enabled-disabled.png)

To enable HA, just toggle it on, which gives you a SR selector as Heartbeat SR. 

You can also enable it with this xe CLI command:

<Terminal shell title="root@xcp-ng-host — Prepare the pool">{`
xe pool-ha-enable heartbeat-sr-uuids=<SR_UUID>
`}</Terminal>

:::tip
Remember that you need to use a shared storage repository to enable high availability.
:::

Once enabled, HA status will be displayed with the green toggle.

### Maximum host failure number

How many host failures you can tolerate before running out of options? For 2 hosts in a Pool, the answer is pretty simple: **1** is the maximum number: after losing one host, it will be impossible to ensure a HA policy if the last one also fails.

XCP-ng can calculate this value for you. In our sample case, it looks like this:

<Terminal title="root@xcp-ng-host — Maximum host failure number">{`
xe pool-ha-compute-max-host-failures-to-tolerate
1
`}</Terminal>

But it could be also **0**. Because, even if you lose 1 host, is there not enough RAM to boot the HA VM on the last one? If not, you can't ensure their survival. 

If you want to set the number yourself, you can do it with this command:

<Terminal shell title="root@xcp-ng-host — Maximum host failure number">{`
xe pool-param-set ha-host-failures-to-tolerate=1 uuid=<Pool_UUID>
`}</Terminal>

If more hosts fail than this number, the system will raise an **over-commitment** alert.

### Configure a VM for HA

#### VM High availability modes

In XCP-ng, you can choose between 3 high availability modes: restart, best-effort, and disabled:

- **Restart**: if a protected VM cannot be immediately restarted after a server failure, HA will attempt to restart the VM when additional capacity becomes available in the pool. However, there is no guarantee that this attempt will be successful.
- **Best-Effort**: for VMs configured with best-effort, HA will try to restart them on another host if their original host goes offline.\
This attempt will only occur after all VMs set to the "restart" mode have been successfully restarted. HA will make only one attempt to restart a best-effort VM. If it fails, no further attempts will be made.
- **Disabled**: if an unprotected VM or its host is stopped, HA will not attempt to restart the VM.

#### Choosing a high availability mode

This is pretty straightforward with Xen Orchestra. Go to the **Advanced** panel of your VM page and use the **HA** dropdown menu:

![The HA dropdown has the 3 HA modes previously described.](../assets/img/xo-ha-selector.png)

You can also do that configuration with *xe CLI*:

<Terminal shell title="root@xcp-ng-host — Choosing a high availability mode">{`
xe vm-param-set uuid=<VM_UUID> ha-restart-priority=restart
`}</Terminal>

#### Start order

##### What's the start order?

The start order defines the sequence in which XCP-ng HA attempts to restart protected VMs following a failure. The order property of each protected VM determines this sequence.

##### How and when does it apply?

While the order property can be set for any VM, HA only uses it for VMs marked as **protected**. 

The order value is an integer, with the default set to **0**, indicating the **highest priority**. VMs with an order value of 0 are restarted first, and those with higher values are restarted later in the sequence.

##### How do I set the start order?

You can set the order property value of a VM via the command-line interface:

<Terminal shell title="root@xcp-ng-host — How do I set the start order?">{`
xe vm-param-set uuid=<VM UUID> order=<number>
`}</Terminal>

#### Configure HA timeout

##### What's the HA timeout?

The HA timeout represents the duration during which networking or storage might be inaccessible to the hosts in your pool. 

If any XCP-ng server cannot regain access to networking or storage within the specified timeout period, it may self-fence and restart. 

##### How do I configure it?

The **default timeout is 60 seconds**, but you can adjust this value using the following command to suit your needs:

<Terminal shell title="root@xcp-ng-host — How do I configure it?">{`
xe pool-param-set uuid=<pool UUID> other-config:default_ha_timeout=<timeout in seconds>
`}</Terminal>

## Updates/maintenance {#updatesmaintenance}

Before any update or host maintenance, planned reboot and so on, **ALWAYS** put your host in maintenance mode. If you don't do that, XAPI will think it's an unplanned failure, and will act accordingly.

If you have enough memory to put one host in maintenance (migrating all its VMs to another member of the pool), that will be alright. If you don't, you'll need to shut VMs down manually **from a XAPI client** (Xen Orchestra or `xe`), and **NOT from inside the operating system**.

:::warning
- **Be very careful before doing ANY maintenance task**, otherwise HA will kick in and provide unpleasant surprises. You have been warned.
- **Do NOT restart host toolstacks while high availability is enabled!** Attempting to restart the toolstack on an active host will cause the host to be immediately fenced and removed from the active liveset and pool. Always make sure that HA is disabled before restarting toolstacks.
:::

## Behavior {#behavior}

### Halting the VM

If you shut the VM down with `Xen Orchestra` or `xe`, the VM will be stopped normally, because XCP-ng knows that's what you want.

However, if you halt the VM directly in the guest OS (via the console or in SSH), XCP-ng is NOT aware of what's going on. The system will think the VM is down and will consider that an anomaly. As a result, the VM will be **started automatically!**. This behavior prevents an operator from shutting down the system and leaving the VM unavailable for a long time.

#### Configure VM shutdown behavior

:::tip

Starting with XAPI 25.16.0, VM restart behavior can be changed on a pool-wide basis. To do this, run this command:

<Terminal shell title="root@xcp-ng-host — Configure VM shutdown behavior">{`
xe pool-param-set uuid=... ha-reboot-vm-on-internal-shutdown=false
`}</Terminal>

The `ha-reboot-vm-on-internal-shutdown` parameter indicates whether VM-initiated shutdowns will trigger a restart for HA-protected VMs, for example, when a user clicks the shutdown in Windows.

:::

:::warning
Setting the `ha-reboot-vm-on-internal-shutdown` parameter to `false` means that your VMs will stay off after they have been shut down from the guest OS, until you restart them yourself.

If you want to restore the default behavior (i.e. HA-protected VMs restart automatically after getting shut down from the guest OS), set the parameter to `true` again.
:::

:::note
If you don't want a specific VM to reboot automatically, without changing the behavior for the whole pool, you can also temporarily disable HA protection for that VM. To do so, read the instructions at the [Troubleshooting HA section](../troubleshooting/troubleshooting-ha.md#disabling-ha).

Once you have disabled HA for the VM, shut the VM down. After you start the VM again, feel free to re-enable HA.
:::

### Host failure

We'll see 3 different scenarios for the host, with an example on 2 hosts, **lab1** and **lab2**:

* Physically power off the server.
* Physically remove the **storage** connection.
* Physically remove the **network** connection.

**lab1** is not the *Pool Master*, but the results would be the same (just longer to test because of time to the other host becoming the master itself).

Let's stay in our example of 2 hosts in a single pool. We configured the VM **Minion 1** for HA, and this VM is running on the host **lab1**.

After each test, **Minion 1** go back to **lab1** to start in the exact same conditions.

#### Pull the power plug

Now, we will decide to pull the plug for my host **lab1**: this is exactly where my VM currently runs. After some time (when XAPI detects and reports that the host is lost, which usually takes 2 minutes), we can see that **lab1** is reported as **Halted**. In the same time, the VM **Minion 1** is booted on the other running host - **lab 2**:

If you decide to re-plug the **lab1** host, it will be back online, without any VM on it, which is normal.

#### Pull the storage cable

Another scenario: this time, we will unplug the iSCSI/NFS link on **lab1**, even though **Minion 1** is running on it.

So? **Minion 1** lost access to its disks and after some time, **lab1** saw it can't access the heartbeat disk. Fencing protection is activated! The machine is rebooted, and after that, any `xe CLI` command on this host will give you that message:

```
The host could not join the liveset because the HA daemon could not access the heartbeat disk.
```

Immediatly after fencing, **Minion 1** will be booted on the other host.

:::info
**lab1** is not physically halted, you can access it through SSH. But from the XAPI point of view, it's dead. Now, let's try to re-plug the ethernet cable... and just wait! Everything will be back to normal!
:::

#### Pull the network cable

Finally, the worst case: keep the storage operational, but "cut" the (management) network interface. Same procedure: unplug the cable physically and wait... Because **lab1** cannot contact any other host in the pool (in this case, **lab2**), it starts the fencing procedure. The result is exactly the same as the previous test. It's gone for the pool master, displayed as **Halted** until we re-plug the cable.

## Architecture {#architecture}

### General

The diagram below shows how HA is managed on a pool.

<Schema label="HA on a shared SR · two heartbeat paths to tell network and storage failures apart" legend={[["#4a90e2", "network heartbeat"], ["#56c288", "storage heartbeat"], ["#e0a94a", "ha-statefile"]]} maxWidth="640px">
<svg viewBox="0 0 640 400" role="img" aria-label="Three XCP-ng hosts each run an XHA daemon; the daemons exchange a network heartbeat with each other, and each also writes a storage heartbeat into the ha-statefile volume on the shared SR that holds the VM disks">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="20" width="190" height="120" rx="8"/>
    <rect x="225" y="20" width="190" height="120" rx="8"/>
    <rect x="430" y="20" width="190" height="120" rx="8"/>
  </g>
  <g fontSize="12.5" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="42">XCP-ng A</text>
    <text x="320" y="42">XCP-ng B</text>
    <text x="525" y="42">XCP-ng C</text>
  </g>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="66" y="52" width="98" height="24" rx="5"/>
    <rect x="271" y="52" width="98" height="24" rx="5"/>
  </g>
  <g fontSize="10.5" fill="#7a8699" textAnchor="middle">
    <text x="115" y="68">VM A</text>
    <text x="320" y="68">VM B</text>
  </g>
  <g fill="rgba(74,144,226,0.14)" stroke="#4a90e2" strokeOpacity="0.85">
    <rect x="46" y="92" width="138" height="28" rx="5"/>
    <rect x="251" y="92" width="138" height="28" rx="5"/>
    <rect x="456" y="92" width="138" height="28" rx="5"/>
  </g>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="110">XHA daemon</text>
    <text x="320" y="110">XHA daemon</text>
    <text x="525" y="110">XHA daemon</text>
  </g>
  <g stroke="#4a90e2" strokeWidth="1.8">
    <line x1="184" y1="106" x2="251" y2="106"/>
    <line x1="389" y1="106" x2="456" y2="106"/>
  </g>
  <rect x="140" y="210" width="360" height="140" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)"/>
  <text x="488" y="338" fontSize="12" fill="#c6d2e1" textAnchor="end">Shared SR (e.g. NFS)</text>
  <rect x="160" y="266" width="130" height="32" rx="6" fill="rgba(224,169,74,0.14)" stroke="#e0a94a" strokeOpacity="0.85"/>
  <text x="225" y="286" fontSize="11" fill="#e0a94a" textAnchor="middle">ha-statefile</text>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="320" y="240" width="92" height="24" rx="5"/>
    <rect x="320" y="274" width="92" height="24" rx="5"/>
  </g>
  <g fontSize="10" fill="#7a8699" textAnchor="middle">
    <text x="366" y="256">vol_1.vhd</text>
    <text x="366" y="290">vol_2.vhd</text>
    <text x="366" y="316">… VM disks</text>
  </g>
  <g stroke="#56c288" strokeWidth="1.6" fill="none">
    <path d="M100 120 C 100 180, 150 230, 180 264"/>
    <path d="M320 120 C 320 170, 250 220, 222 264"/>
    <path d="M525 120 C 525 190, 340 230, 292 276"/>
  </g>
</svg>
</Schema>

As you can see, a `XHA daemon` is running on each host and two main paths are used: one for the network, another for storage.
For HA to operate properly, two communication paths are used: one over the network and another reserved for storage.
There are two paths because this is the solution chosen to distinguish a network problem between hosts and a storage issue.
In both cases, data is constantly transmitted through these paths to ensure proper HA operation:
- UDP packets are exchanged over the network management interface so that each server can indicate it is alive.
- Disk data is written to and read by the hosts through a volume called `ha-statefile`. In this example, the volume resides on an NFS SR, which is shared and accessible by the entire pool. It’s a standard SR containing VHD files used by VMs.
The only difference is that `ha-statefile` is a raw volume in which data is written directly.

Regarding the structure of this SR heartbeat volume:

<Schema label="ha-statefile layout · one reserved slot per host, readable by all" legend={[["#56c288", "host writes its own slot"], ["#e0a94a", "ha-statefile (raw volume)"]]} maxWidth="640px">
<svg viewBox="0 0 640 250" role="img" aria-label="Three hosts each write a heartbeat into their own slot of the ha-statefile volume; every host reads all the slots to know who is alive">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="40" y="20" width="150" height="36" rx="6"/>
    <rect x="245" y="20" width="150" height="36" rx="6"/>
    <rect x="450" y="20" width="150" height="36" rx="6"/>
  </g>
  <g fontSize="12" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="43">XCP-ng A</text>
    <text x="320" y="43">XCP-ng B</text>
    <text x="525" y="43">XCP-ng C</text>
  </g>
  <g stroke="#56c288" strokeWidth="1.8">
    <line x1="115" y1="56" x2="115" y2="118"/>
    <line x1="320" y1="56" x2="320" y2="118"/>
    <line x1="525" y1="56" x2="525" y2="118"/>
  </g>
  <g fontSize="9.5" fill="#56c288">
    <text x="124" y="92">writes</text>
    <text x="329" y="92">writes</text>
    <text x="534" y="92">writes</text>
  </g>
  <rect x="30" y="120" width="580" height="70" rx="8" fill="rgba(224,169,74,0.08)" stroke="#e0a94a" strokeOpacity="0.85"/>
  <g fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.28)">
    <rect x="46" y="134" width="170" height="42" rx="5"/>
    <rect x="251" y="134" width="170" height="42" rx="5"/>
    <rect x="456" y="134" width="140" height="42" rx="5"/>
  </g>
  <g fontSize="10.5" fill="#c6d2e1" textAnchor="middle">
    <text x="131" y="151">slot A</text>
    <text x="336" y="151">slot B</text>
    <text x="526" y="151">slot C</text>
  </g>
  <g fontSize="9.5" fill="#7a8699" textAnchor="middle">
    <text x="131" y="168">"alive at 10:42:03"</text>
    <text x="336" y="168">"alive at 10:42:03"</text>
    <text x="526" y="168">"alive at 10:42:02"</text>
  </g>
  <text x="36" y="214" fontSize="10.5" fill="#7a8699">no write lock needed: each host only ever writes its own slot…</text>
  <text x="604" y="238" fontSize="10.5" fill="#7a8699" textAnchor="end">…and reads all the others to know who is alive</text>
</svg>
</Schema>

- As the picture shows, this volume contains a single entry for each host, where each host writes to its own dedicated area AND can also read the state of other hosts. In other words, each host writes a “heartbeat” value indicating that it’s alive at a given time, which is verified by the whole pool.

- There is no write lock; each host can write at any time. It's why there is one entry for each host.

### XOSTOR

For DRBD/LINSTOR experts, and with the general architecture explanation, you can understand what happens when we replace the NFS hearbeat volume by a DRBD device.

We must change our architecture because, basically, a DRBD volume can only be opened in one place at a time. We cannot easily write in each volume at the same time, because we would have to open or close the heartbeat volume several times per second. Or, we would have to set up a mechanism in the xha daemon so that each one writes in turn. Since this is complex to set up, we chose another approach.

<Schema label="HA on XOSTOR · the storage heartbeat is proxied to the single DRBD primary" legend={[["#4a90e2", "network heartbeat"], ["#56c288", "storage heartbeat path"], ["#e0a94a", "ha-statefile"]]} maxWidth="640px">
<svg viewBox="0 0 640 470" role="img" aria-label="Three XCP-ng hosts run the XHA daemon over an NBD HTTP server; only host A runs the active HTTP disk server, which owns the DRBD primary and writes the ha-statefile on the shared XOSTOR SR; the other hosts forward their heartbeat through it">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="20" width="190" height="170" rx="8"/>
    <rect x="225" y="20" width="190" height="170" rx="8"/>
    <rect x="430" y="20" width="190" height="170" rx="8"/>
  </g>
  <g fontSize="12.5" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="42">XCP-ng A</text>
    <text x="320" y="42">XCP-ng B</text>
    <text x="525" y="42">XCP-ng C</text>
  </g>
  <g fill="rgba(74,144,226,0.14)" stroke="#4a90e2" strokeOpacity="0.85">
    <rect x="46" y="52" width="138" height="26" rx="5"/>
    <rect x="251" y="52" width="138" height="26" rx="5"/>
    <rect x="456" y="52" width="138" height="26" rx="5"/>
  </g>
  <g fontSize="11" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="69">XHA daemon</text>
    <text x="320" y="69">XHA daemon</text>
    <text x="525" y="69">XHA daemon</text>
  </g>
  <g stroke="#4a90e2" strokeWidth="1.8">
    <line x1="184" y1="65" x2="251" y2="65"/>
    <line x1="389" y1="65" x2="456" y2="65"/>
  </g>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="46" y="92" width="138" height="26" rx="5"/>
    <rect x="251" y="92" width="138" height="26" rx="5"/>
    <rect x="456" y="92" width="138" height="26" rx="5"/>
  </g>
  <g fontSize="10.5" fill="#c6d2e1" textAnchor="middle">
    <text x="115" y="109">NBD HTTP server</text>
    <text x="320" y="109">NBD HTTP server</text>
    <text x="525" y="109">NBD HTTP server</text>
  </g>
  <rect x="46" y="140" width="138" height="30" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.85"/>
  <text x="115" y="159" fontSize="10.5" fill="#56c288" textAnchor="middle">HTTP disk server ★</text>
  <g fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.15)">
    <rect x="251" y="140" width="138" height="30" rx="5"/>
    <rect x="456" y="140" width="138" height="30" rx="5"/>
  </g>
  <g fontSize="10" fill="#5b6577" textAnchor="middle">
    <text x="320" y="159">HTTP disk server (idle)</text>
    <text x="525" y="159">HTTP disk server (idle)</text>
  </g>
  <g stroke="#56c288" strokeWidth="1.6" fill="none">
    <line x1="115" y1="78" x2="115" y2="92"/>
    <line x1="320" y1="78" x2="320" y2="92"/>
    <line x1="525" y1="78" x2="525" y2="92"/>
    <line x1="115" y1="118" x2="115" y2="140"/>
    <path d="M251 105 C 215 105, 205 130, 188 148"/>
    <path d="M456 105 C 446 205, 260 215, 165 174"/>
    <path d="M115 170 C 115 220, 150 260, 178 304"/>
  </g>
  <rect x="140" y="250" width="360" height="150" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)"/>
  <text x="488" y="388" fontSize="12" fill="#c6d2e1" textAnchor="end">Shared XOSTOR SR</text>
  <rect x="160" y="306" width="130" height="32" rx="6" fill="rgba(224,169,74,0.14)" stroke="#e0a94a" strokeOpacity="0.85"/>
  <text x="225" y="326" fontSize="11" fill="#e0a94a" textAnchor="middle">ha-statefile</text>
  <text x="225" y="352" fontSize="9.5" fill="#7a8699" textAnchor="middle">DRBD · primary on A</text>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="330" y="290" width="92" height="24" rx="5"/>
    <rect x="330" y="324" width="92" height="24" rx="5"/>
  </g>
  <g fontSize="10" fill="#7a8699" textAnchor="middle">
    <text x="376" y="306">vol_1</text>
    <text x="376" y="340">vol_2</text>
    <text x="376" y="366">… VM disks</text>
  </g>
  <text x="630" y="462" fontSize="10" fill="#7a8699" textAnchor="end">★ single active instance · another host takes over if A crashes</text>
</svg>
</Schema>

To support the fact that only one DRBD volume can be PRIMARY, and to avoid making significant changes to the xha/XHAPI modules, we had to be a bit creative. Instead of writing to or reading directly from the heartbeat volume on all hosts, we use an `NBD HTTP server` daemon. It's a process that listens through an NBD device, which is seen as the heartbeat volume by the XHA daemon.

As a result, each read and write request from the XHA daemon goes through an NBD device. It is then transmitted via the HTTP protocol to another daemon called `HTTP disk server`, which is responsible for writing to the DRBD heartbeat volume.
This whole new path acts as a proxy, hiding direct access to the actual heartbeat volume of the SR.

Now, what happens if the host running the active `HTTP disk server` daemon crashes?
In that case, the heartbeat volume loses its PRIMARY status on that host. Among the surviving hosts, another server daemon will then attempt to become PRIMARY in its place.
Then, the one that successfully becomes PRIMARY will start receiving the heartbeat requests from the `NBD HTTP server` daemons.

For those curious about the LINSTOR/DRBD options used behind the heartbeat volume, these are the ones used by LINBIT in their LINSTOR guide for creating a Highly Available LINSTOR cluster:

```
'DrbdOptions/auto-quorum': 'disabled',
'DrbdOptions/Resource/auto-promote': 'no',
'DrbdOptions/Resource/on-no-data-accessible': 'io-error',
'DrbdOptions/Resource/on-no-quorum': 'io-error',
'DrbdOptions/Resource/on-suspended-primary-outdated': 'force-secondary',
'DrbdOptions/Resource/quorum': 'majority'
```
