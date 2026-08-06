# Autostart VM on boot

How to start VM on host boot?

A VM can be started at XCP-ng boot itself, it's called **Auto power on**. We have two ways to configure it: using Xen Orchestra or via the CLI.

## 🛰️ With Xen Orchestra {#with-xen-orchestra}

In Xen Orchestra we can just enable a toggle in VM "Advanced" view, called **Auto power on**. Everything will be set accordingly.

![XO's VM advanced tab showing the Auto power on option.](../../assets/img/autopoweron1.png)


## 🧑‍💻 With the CLI {#with-the-cli}

1. Determine the UUID of the pool for which we want to enable Auto Start. To do this, run the console command on the server:

<Terminal title="root@xcp-ng-host — With the CLI">{`
xe pool-list
uuid ( RO) : <VM_UUID>
`}</Terminal>

2. Allow autostart of virtual machines at the pool level with the found UUID command:
`# xe pool-param-set uuid=<VM_UUID> other-config:auto_poweron=true`

Now we enable autostart at the virtual machine level.
3. Execute the command to get the UUID of the virtual machine:

<Terminal title="root@xcp-ng-host — xe pool-list">{`
xe vm-list
    uuid ( RO)           : <VM_UUID>
    name-label ( RW)     : VM
    power-state ( RO)    : running
`}</Terminal>

4. Enable autostart for each virtual machine with the UUID found:
`# xe vm-param-set uuid=<VM_UUID> other-config:auto_poweron=true`

5. Checking the output
`# xe vm-param-list uuid=<VM_UUID> | grep other-config`

## Controlling the boot order and delay

Two separate VM parameters affect how a VM comes up alongside autostart, and setting one
incorrectly can look like autostart itself is broken:

- `other-config:start_order=<int>` sets the relative order in which VMs start (lower values
  first).
- `start-delay=<seconds>` controls how long the startup sequence waits **after** this VM
  before moving on to the next one. Note that two official descriptions exist and they read
  differently: the CLI reference calls it "the delay to wait before a call to start up the VM
  returns", while the XenAPI field description calls it "the delay to wait before proceeding
  to the next order in the startup sequence". They describe the same blocking behaviour, but
  the second is the one that matches what you observe, because the delay lands on the *next*
  VM to start rather than on the VM the parameter is set on. A misconfigured `start-delay`
  can also make a VM appear never to autostart, even though the parameter is unrelated to the
  autostart toggle itself.

```
# xe vm-param-set uuid=<VM_UUID> other-config:start_order=1
# xe vm-param-set uuid=<VM_UUID> start-delay=30
```
