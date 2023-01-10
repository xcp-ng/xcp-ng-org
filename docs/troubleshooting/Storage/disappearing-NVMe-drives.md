# Disappearing NVMe drives

Some NVMe drives do not handle Automatic Power State Transition (APST) well on certain motherboards or adapters and will disappear from the system when attempting to lower their power state.  You may see logs in dmesg that indicate this is happening.

```
[65056.815294] nvme nvme0: controller is down; will reset: CSTS=0xffffffff, PCI_STATUS=0xffff
[65060.797874] nvme 0000:04:00.0: Refused to change power state, currently in D3
[65060.815452] xen: registering gsi 32 triggering 0 polarity 1
[65060.815473] Already setup the GSI :32
[65060.937775] nvme nvme0: Removing after probe failure status: -19
[65060.950019] print_req_error: I/O error, dev nvme1n1, sector 895222784
[65060.950022] print_req_error: I/O error, dev nvme1n1, sector 438385288
[65060.950040] print_req_error: I/O error, dev nvme1n1, sector 223301496
[65060.950072] print_req_error: I/O error, dev nvme1n1, sector 256912800
[65060.950077] print_req_error: I/O error, dev nvme1n1, sector 189604552
[65060.950085] print_req_error: I/O error, dev nvme1n1, sector 390062504
[65060.950087] print_req_error: I/O error, dev nvme1n1, sector 453909496
[65060.950099] print_req_error: I/O error, dev nvme1n1, sector 453915072
[65060.950102] print_req_error: I/O error, dev nvme1n1, sector 246194176
[65060.950107] print_req_error: I/O error, dev nvme1n1, sector 246194288
[65061.030575] nvme nvme0: failed to set APST feature (-19)
```

APST can be disabled by adding `nvme_core.default_ps_max_latency_us=0` to your kernel boot parameters.  For example, in xcp-ng 8.1, edit `/boot/grub/grub.cfg` to include a new parameter on the first `module2` line.

```
menuentry 'XCP-ng' {
	search --label --set root root-jnugiq
	multiboot2 /boot/xen.gz dom0_mem=7584M,max:7584M watchdog ucode=scan dom0_max_vcpus=1-16 crashkernel=256M,below=4G console=vga vga=mode-0x0311
	module2 /boot/vmlinuz-4.19-xen root=LABEL=root-jnugiq ro nolvm hpet=disable console=hvc0 console=tty0 quiet vga=785 splash plymouth.ignore-serial-consoles nvme_core.default_ps_max_latency_us=0
	module2 /boot/initrd-4.19-xen.img
}
```