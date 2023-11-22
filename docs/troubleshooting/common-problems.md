# Common Problems

Here is a list of common problems.

---

## Blank screen (on a Linux VM)

### Cause

Your VM booted just fine. You see a blank console because of driver related issues.

### Solution

Please try to:

* press  <kbd>Alt</kbd> + <kbd>Right Arrow</kbd> to switch to next console
* press <kbd>Tab</kbd> to escape boot splash
* press <kbd>Esc</kbd>

Alternative solution:

:::warning
Please test this solution and report if it worked for you!
:::

Blacklist the problematic driver ([source](https://xcp-ng.org/forum/post/1707)):

> Usually, when you install a recent distro in PVHVM (using other media) and you get a blank screen, try blacklisting by adding the following in your grub command at the end
>
> `modprobe.blacklist=bochs_drm`

---

## Initrd is missing after an update

### Cause

After an update, XCP-ng won't boot and file `/boot/initrd-4.19.0+1.img` is missing.

Can be a `yum` update process interrupted while rebuilding the `initrd`, such as a manual reboot of the host before the post-install scriplets have finished executing.

### Solution

1. Boot on the fallback kernel (last entry in grub menu)
2. Rebuild the initrd with `dracut -f /boot/initrd-<exact-kernel-version>.img <exact-kernel-version>`
3. Reboot on the latest kernel, it works!

:::tip
Here is an example of `dracut` command on a 8.2 host: `dracut -f /boot/initrd-4.19.0+1.img 4.19.0+1`
:::

---

## VM not in expected power state

### Cause

The XAPI database thinks that the VM is On / Off. But this is fake news ;-)

### Solution

Restart toolstack on CLI with the command `xe-toolstack-restart`. This just restarts the management services, all running VMs are untouched.

---

## Host and Pool have incompatible Licenses

### Cause

You may get this error when attempting to add a new host to an existing pool. This occurs when you mix products, for instance adding a XenServer/Citrix Hypervisor host to an XCP-ng pool, or vice versa. 

### Solution

To solve this, simply get your pool "coherent" and do not mix products. Ensure all hosts in the pool as well as hosts you'd like to add to the pool are running XCP-ng. It is not recommended to mix XCP-ng hosts with XenServer hosts in the same pool.

---

## Rebooting hangs the server

### Cause

Hard to tell why, possibly related to the kernel, or BIOS. This has been known to occur on a Dell Poweredge T20.

### Solution

Try these steps:

1. Turn off C-States and Intel SpeedStep in the BIOS.
2. Flash any update(s) to the BIOS firmware.
3. Append `reboot=pci` to kernel boot parameters. This can be done in `/etc/grub.cfg` or `/etc/grub-efi.cfg`.

---

## Server loses time on 14th gen Dell hardware

### Cause

Losing time can be related to the system trying to keep listening to the hardware clock instead of trusting NTP.

### Solution

```
echo "xen" > /sys/devices/system/clocksource/clocksource0/current_clocksource
  printf '%s\n\t%s\n%s\n' 'if test -f /sys/devices/system/clocksource/clocksource0/current_clocksource; then' 'echo xen > /sys/devices/system/clocksource/clocksource0/current_clocksource' 'fi' >> /etc/rc.local
```

---

## Async Tasks/Commands Hang or Execute Extremely Slowly

### Cause

This symptom can be caused by a variety of issues including RAID degradation, ageing HDDs, slow network storage, and external hard drives/usbs. While extremely unintuitive, even a single slow storage device physically connected (attached or unattached to a VM) can cause your entire host to hang during operation.

### Solution

1. Begin by unplugging any external USB hubs, hard drives, and USBs.
2. Run a command such as starting a VM to see if the issue remains.
3. If the command still hangs, physically check to see if your HDDs/SSDs are all functioning normally and any RAID arrays you are using are in a clean non-degraded state.
4. If these measures fail, login to your host and run `cat /var/log/kern.log | grep hung`. If this returns `"echo 0 > /proc/sys/kernel/hung_task_timeout_secs" disables this message.` your lvm layer may be hanging during storage scans. This could be caused by a drive that is starting to fail but has not hard failed yet.
5. If all these measures fail, collect the logs and make your way to the forum for help.

---

## TCP Offload checksum errors

### Cause

When running `# tcpdump -i <device name> -v -nn |grep incorrect`, there are checksum incorrect error messages.
Example: `# tcpdump -i eth0 -v -nn |grep incorrect`

### Solution

**NOTE**: These changes does not guarantee improved network performance, please use iperf3 to check before and after the change.

- If you see transmit TCP offload checksum errors like this:

     `<XCP-ng host IP>.443 > x.x.x.x.19723: Flags [.], cksum 0x848a (incorrect -> 0x1b17), ack 3537, win 1392, length 0`

     then try running
     `# xe pif-param-set uuid=$PIFUUID other-config:ethtool-tx="off"` where $PIFUUID is the UUID of the physical interface.

- If you see receive TCP offload checksum errors like this:

     `x.x.x.x.445 > <XCP-ng host IP>.58710: Flags [.], cksum 0xa189 (incorrect -> 0xc352), seq 469937:477177, ack 53892, win 256, options [nop,nop,TS val 170183446 ecr 146516], length 7240WARNING: Packet is continued in later TCP segments`

     `x.x.x.x.445 > <XCP-ng host IP>.58710: Flags [P.], cksum 0x8e45 (incorrect -> 0xd531), seq 477177:479485, ack 53892, win 256, options [nop,nop,TS val 170183446 ecr 146516], length 2308SMB-over-TCP packet:(raw data or continuation?)`

     then try running
     `# xe pif-param-set uuid=$PIFUUID other-config:ethtool-gro="off"` where $PIFUUID is the UUID of the physical interface.

The PIF UUID can be found by executing:

`# xe pif-list`

---

## Reset XCP-ng root password

### Cause

If you need to modify your XCP-ng root password, you may follow the steps below.

### Solution

The full prodecure can also be found on [this page](https://support.citrix.com/article/CTX214360).

* Reboot your XCP-ng into Grub boot menu.
* Select XCP-ng boot menu entry and press <kbd>e</kbd> key to edit boot options.
* Locate the read-only parameter ```ro``` and replace it with ```rw init=/sysroot/bin/sh```.
* Press <kbd>Ctrl</kbd> + <kbd>X</kbd> to boot into single-mode.
* From the Emergency Mode prompt, execute the command **chroot /sysroot**.
* Once in single-mode, use ```passwd``` command to reset your XCP-ng root password.
* Reboot XCP-ng by sending <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Suppr</kbd>.
* If everything went well, you should now be able to login with your new XCP-ng password.

---

## XenStore related issues

### Cause

You might spot logs telling you about XenStore problems.

### Solution

See the [Xen doc](https://wiki.xenproject.org/wiki/Debugging_Xen#Debugging_Xenstore_Problems).

The `XENSTORED_TRACE` being enabled might give useful information.

---

## Ubuntu 18.04 boot issue

### Cause

Some versions of Ubuntu 18.04 might fail to boot, due to a Xorg bug affecting GDM and causing a crash of it (if you use Ubuntu HWE stack).

### Solution

The solution is to use `vga=normal fb=false` on Grub boot kernel to overcome this. You can add those into ` /etc/default/grub`, for the `GRUB_CMDLINE_LINUX_DEFAULT` variable. Then, a simple `sudo update-grub` will provide the fix forever.

You can also remove the `hwe` kernel and use the `generic` one: this way, the problem won't occur at all.

:::tip
Alternatively, in a fresh Ubuntu 18.04 install, you can switch to UEFI and you won't have this issue.
:::

---

## Missing templates when creating a new VM

### Cause

In specific conditions, the global template generation can fail. If you attempt to create a new VM, and you notice that you only have a handful of templates available, you can try fixing this from the console.

### Solution

Simply go to the console of your XCP-NG host and enter the following command:
```
/usr/bin/create-guest-templates
```

This should recreate all the templates.

---

## The updater plugin is busy

### Cause

The message `The updater plugin is busy (current operation: check_update)` means that the plugin crashed will doing an update. The lock was then active, and it was left that way. You can probably see that by doing:

```
cat /var/lib/xcp-ng-xapi-plugins/updater.py.lock
```

It should be empty, but if you have the bug, you got `check_update`.


### Solution

Remove `/var/lib/xcp-ng-xapi-plugins/updater.py.lock` and that should fix it.

---