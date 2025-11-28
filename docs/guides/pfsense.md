# pfSense / OPNsense VM

A guide to run pfSense in a VM.

Despite pfSense and OPNsense do work great in a VM, there are a few extra steps that need to be taken first.

## 1. Create VM as normal.

* When creating the VM, choose the `other install media` VM template
* Prefer `UEFI` boot mode for pfSense versions > 2.4 (`BIOS` mode works but will be slower to boot)
* Continue through the installer like normal

## 2. Install Guest Utilities

There are 2 ways of doing that, either using the CLI (pfSense or OPNsense) or the Web UI (OPNsense).

Option 1 via console/ssh:
Now that you have the VM running, we need to install guest utilities and tell them to run on boot. SSH (or other CLI method) to the VM and perform the following:

```
pkg install xe-guest-utilities
echo 'xenguest_enable="YES"' >> /etc/rc.conf.local
ln -s /usr/local/etc/rc.d/xenguest /usr/local/etc/rc.d/xenguest.sh
service xenguest start
```

Option 2 is via the Web GUI (only available on OPNsense):
Open the web UI on `http(s)://your-configured-ip` and go to:
*System -> Firmware -> Plugins*, 
above the list header (in center) tick **Show (Tier 3) community plugins** (otherwise it will not be shown even via search box), scroll down to / search **os-xen** and click the plus sign next to it to install them.  
Next: Reboot the system to have the guest tools started (installer doesn't do this the first time):
*Power -> Reboot*

Guest Tools are now installed and running, and will automatically run on every boot of the VM.

## 3. Disable TX Checksum Offload

Now is the most important step: we must disable TX checksum offload on the virtual xen interfaces of the VM. This is because network traffic between VMs in a hypervisor is not populated with a typical Ethernet checksum, since they only traverse server memory and never leave over a physical cable. The majority of operating systems know to expect this when virtualized and handle Ethernet frames with empty checksums without issue. However `pf` in FreeBSD does not handle them correctly and will drop them, leading to broken performance.

The solution is to simply turn off checksum-offload on the virtual xen interfaces for pfSense in the TX direction only (TX towards the VM itself). Then the packets will be checksummed like normal and `pf` will no longer complain.

:::tip
Disabling checksum offloading is only necessary for virtual interfaces. When using [PCI Passthrough](../compute.md#-pci-passthrough) to provide a VM with direct access to physical or virtual (using [SR-IOV](https://en.wikipedia.org/wiki/Single-root_input/output_virtualization)) devices it is unnecessary to disable TX checksum offloading on any interfaces on those devices.
:::

:::warning
Many guides on the internet for pfSense in Xen VMs will tell you to uncheck checksum options in the pfSense web UI, or to also disable RX offload on the Xen side. These are not only unnecessary, but some of them will make performance worse.
:::

## Using Xen Orchestra

- Head to the "Network" tab of your VM : in the advanced settings (click the blue gear icon) for each adapter, disable TX checksumming.
- Restart the VM.

That's it !

## Using CLI

SSH to dom0 on your XCP-NG hypervisor and run the following:

First get the UUID of the VM to modify:

```
xe vm-list
```
Find your pfSense / OPNsense VM in the list, and copy the UUID. Now stick the UUID in the following command:

```
xe vif-list vm-uuid=57a27650-6dab-268e-1200-83ee17ee3a55
```

This will list all the virtual interfaces assigned to the VM:

```
uuid ( RO)            : 789358b4-54c8-87d3-bfb3-0b7721e4661b
         vm-uuid ( RO): 57a27650-6dab-268e-1200-83ee17ee3a55
          device ( RO): 1
    network-uuid ( RO): 5422a65f-4ff0-0f8c-e8c3-a1e926934eed


uuid ( RO)            : a9380705-8da2-4bf7-bbb0-f167d8f0d645
         vm-uuid ( RO): 57a27650-6dab-268e-1200-83ee17ee3a55
          device ( RO): 0
    network-uuid ( RO): 4f7e43ef-d28a-29bd-f933-68f5a8f36241
```

For each interface, you need to take the UUID (the one at the top labeled `uuid ( RO)`) and insert it in the `xe vif-param-set uuid=xxx other-config:ethtool-tx="off"` command. So for our two virtual interfaces the commands to run would look like this:

```
xe vif-param-set uuid=789358b4-54c8-87d3-bfb3-0b7721e4661b other-config:ethtool-tx="off"
xe vif-param-set uuid=a9380705-8da2-4bf7-bbb0-f167d8f0d645 other-config:ethtool-tx="off"
```

That's it! For this to take effect you need to fully shut down the VM then power it back on. Then you are good to go!

:::tip
If you ever add more virtual NICs to your VM, you will need to go back and do the same steps for these interfaces as well.
:::

### 4. Optimize VM Boot Process (Optional)

During the boot process, pfSense will detect and try to use the virtual `parallel` and `serial` ports.

The virtual `parallel` port will be scanned during the boot process which lasts ~30 seconds at `ppbus0: <Parallel port bus> on ppc0`.

The virtual `serial` port can be chosen as the "default output" which will hide the boot output between `Hypervisor: Origin = "Microsoft Hv"` and `Bootup complete`.

#### Remove Parallel / Serial Ports Using CLI

SSH to dom0 on your XCP-NG hypervisor and find your pfSense / OPNsense VM UUID (see steps above: 3. "Using CLI").

Configure the VM `parallel` port to `none` using the following command:

```
xe vm-param-set platform:parallel=none uuid=57a27650-6dab-268e-1200-83ee17ee3a55
```

Configure the VM `serial` port to `none` using the following command:

```
xe vm-param-set platform:hvm_serial=none uuid=57a27650-6dab-268e-1200-83ee17ee3a55
```

:::tip
If your pfSense VM is experiencing long delays during the boot process, it may be due to the [VM communicating with the disks using the emulated IDE controller instead of the SCSI controller](https://blog.3mdeb.com/2019/2019-12-13-pfsense-boot-under-xen/#debug-xen). If this is the case, the pre-boot process can take a few minutes before the pfSense "Starting Device Manager (devd)" step which normally takes ~1 minute or less, then the boot process continues at the "normal" speed. This issue has been observed when the VM is using the `BIOS` boot mode (default for `Other install media` in XCP-ng Center) with recent pfSense > 2.4 versions. This problem only delays the boot process (booted VM performance is "normal") and is not observed when using the `UEFI` boot mode (as recommended in step 1).
:::
