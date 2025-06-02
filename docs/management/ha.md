# High availability

In XCP-ng, high availability (or HA) is the ability to detect a failed host and automatically boot all the VMs that were running on this host to the other alive machines.

## 📋 Introduction

Implementing VM High availability (HA) is a real challenge.

First, because you need to reliably detect when a server has really failed to avoid unpredictable behavior. 

But that's not the only one. If you lose the network link but not the shared storage, how to ensure you will not write simultaneously on the storage and corrupt all your data as a result?

We'll see how to protect your precious VM in multiple cases, and we'll illustrate that with real examples.

:::info
You can have high availability with as few as 2 hosts, but we strongly recommended to do it with 3 at the minimum, for obvious split-brains issues you might encounter.
:::

:::warning
High availability requires **far more maintenance** and will create some traps if you are not aware. In short, it comes at a cost. 

Before using it, **please think about it carefully**: do you **REALLY** need it? We've seen people having less uptime using HA than when not using it, because you **must understand** what you are doing every time you reboot or update a host.
:::

## 🎓 Concepts

The pool concept allows hosts to exchange their data and status:

* If you lose a host, that will be detected by the pool master.
* If you lose the master, another host will take over the master role automatically.

To be sure a host is really unreachable, HA in XCP-ng uses multiple heartbeat mechanisms. As you saw in the introduction, it's not enough to check the network: what about storage? That's why there is also a specific heartbeat for shared storage between hosts in a pool. In fact, each host regularly writes some blocks in a dedicated VDI. That's the principle of the [Dead man's switch](http://en.wikipedia.org/wiki/Dead_man%27s_switch). 

This concept is important, and it explains why you need to **configure high availability with a shared storage** (iSCSI, Fiber Channel or NFS) to avoid simultaneous writing in a VM disk.

Here are the possible cases and how they are dealt with:

* **Lost both network and storage heartbeat**: the host is considered unreachable and the HA plan is started
* **Lost storage but not network**: if the host can contact a majority of pool members, it can stay alive. Indeed, in this scenario, there is no harm for the data (can't write to the VM disks). If the host is alone (i.e can't contact any other host or less than the majority), it goes for a reboot procedure.
* **Lost network but not storage (worst case!)**: the host considers itself as problematic and starts a reboot procedure (hard power off and restart). This fencing procedure guarantees the sanity of your data.

## ⚙️ Configuration

### Prepare the pool

You can check if your pool has HA enabled or not. In Xen Orchestra, you'll have a small "cloud" icon in the **Home/pool** view for each pool with HA enabled.

You can enable it with this xe CLI command:

```
xe pool-ha-enable heartbeat-sr-uuids=<SR_UUID>
```

:::tip
Remember that you need to use a shared storage repository to enable high availability.
:::

### Maximum host failure number

How many host failures you can tolerate before running out of options? For 2 hosts in a Pool, the answer is pretty simple: **1** is the maximum number: after losing one host, it will be impossible to ensure a HA policy if the last one also fails.

This value can be computed by XCP-ng, and in our sample case:

```
xe pool-ha-compute-max-host-failures-to-tolerate
1
```

But it could be also **0**. Because, even if you lose 1 host, is there not enough RAM to boot the HA VM on the last one? If not, you can't ensure their survival. If you want to set the number yourself, you can do it with this command:

```
xe pool-param-set ha-host-failures-to-tolerate=1 uuid=<Pool_UUID>
```

When you have more hosts failed equal to this number, a system alert is raised: you are in an **over-commitment** situation.

### Configure a VM for HA

This is pretty straightforward with Xen Orchestra. Go to your VM page and edit the **Advanced** panel: just tick the **HA** checkbox.

You can also do that configuration with *xe CLI*:

```
xe vm-param-set uuid=<VM_UUID> ha-restart-priority=restart
```

## 🔧 Updates/maintenance

Before any update or host maintenance, planned reboot and so on, **ALWAYS** put your host in maintenance mode. If you don't do that, XAPI will think it's an unplanned failure, and will act accordingly.

If you have enough memory to put one host in maintenance (migrating all its VMs to another member of the pool), that will be alright. If you don't, you'll need to shut VMs down manually **from a XAPI client** (Xen Orchestra or `xe`), and **NOT from inside the operating system**.

:::warning
**Be very careful before doing ANY maintenance task**, otherwise HA will kick in and provide unpleasant surprises. You have been warned.
:::

## ↔️ Behavior

### Halting the VM

If you shut the VM down with `Xen Orchestra` or `xe`, the VM will be stopped normally, because XCP-ng knows that's what you want.

However, if you halt the VM directly in the guest OS (via the console or in SSH), XCP-ng is NOT aware of what's going on. The system will think the VM is down and will consider that an anomaly. As a result, the VM will be **started automatically!**. This behavior prevents operators from shutting down the system, and leaves the VM unavailable for a long time.

### Host failure

We'll see 3 different scenarios for the host, with an example on 2 hosts, **lab1** and **lab2**:

* Physically "hard" shutdown the server
* Physically remove the **storage** connection
* Physically remove the **network** connection

**lab1** is not the *Pool Master*, but the results would be the same (just longer to test because of time to the other host becoming the master itself).

Let's stay in our example of 2 hosts in a single pool. We configured the VM **Minion 1** for HA, and this VM is running on the host **lab1**.

After each test, **Minion 1** go back to **lab1** to start in the exact same conditions.

#### Pull the power plug

Now, we will decide to pull the plug for my host **lab1**:  this is exactly where my VM currently runs. After some time (when XAPI detects and reports that the host is lost, which usually takes 2 minutes), we can see that **lab1** is reported as **Halted**. In the same time, the VM **Minion 1** is booted on the other running host - **lab 2**:

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

Finally, the worst case: keep the storage operational, but "cut" the (management) network interface. Same procedure: unplug the cable physically and wait... Because **lab1** cannot contact any other host in the pool (in this case, **lab2**), it starts the fencing procedure. The result is exaclty the same as the previous test. It's gone for the pool master, displayed as **Halted** until we re-plug the cable.
