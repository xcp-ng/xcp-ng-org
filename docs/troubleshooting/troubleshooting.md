# Troubleshooting

If you have a problem on XCP-ng, there's 2 options:

* Community support (mostly on [XCP-ng Forum](https://xcp-ng.org/forum))
* [Pro support](https://xcp-ng.com)

## The 3-Step-Guide
Here is our handy **3-Step-Guide**:

1. Check the [logs](troubleshooting.md#log-files). Check your settings. [Read below](troubleshooting.md#common-problems)... if you already did, proceed to Step 2.
2. Get help at our [Forum](https://xcp-ng.org/forum) or get help [on Discord](https://discord.gg/aNCR3yPaPn) or [on IRC](irc://irc.oftc.net/#xcp-ng) and provide as much information as you can:
    * ☑️ What did you **exactly** do to expose the bug?
    * :rocket: XCP-ng Version
    * :desktop_computer: Hardware
    * :factory: Infrastructure
    * :newspaper_roll: Logs
    * :tv: Screenshots
    * :stop_sign: Error messages
3. Share your solution ([forum](https://xcp-ng.org/forum), [wiki](https://github.com/xcp-ng/xcp/wiki)) - others can benefit from your experience.
    * And we are therefore officially proud of you! :heart:

## Pro Support

If you have subscribed to [Pro support](https://xcp-ng.com/), well, don't hesitate to use it!

## Reset root password

If you need to modify your XCP-ng root password, you may follow the steps below. The full prodecure can also be found on [this page](https://support.citrix.com/article/CTX214360).

* Reboot your XCP-ng into Grub boot menu.
* Select XCP-ng boot menu entry and press <kbd>e</kbd> key to edit boot options.
* Locate the read-only parameter ```ro``` and replace it with ```rw init=/sysroot/bin/sh```.
* Press <kbd>Ctrl</kbd> + <kbd>X</kbd> to boot into single-mode.
* From the Emergency Mode prompt, execute the command **chroot /sysroot**.
* Once in single-mode, use ```passwd``` command to reset your XCP-ng root password.
* Reboot XCP-ng by sending <kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>Suppr</kbd>.
* If everything went well, you should now be able to login with your new XCP-ng password.

## XenStore related issues

See the [Xen doc](https://wiki.xenproject.org/wiki/Debugging_Xen#Debugging_Xenstore_Problems).

The `XENSTORED_TRACE` being enabled might give useful information.

## Ubuntu 18.04 boot issue

Some versions of Ubuntu 18.04 might fail to boot, due to a Xorg bug affecting GDM and causing a crash of it (if you use Ubuntu HWE stack).

The solution is to use `vga=normal fb=false` on Grub boot kernel to overcome this. You can add those into ` /etc/default/grub`, for the `GRUB_CMDLINE_LINUX_DEFAULT` variable. Then, a simple `sudo update-grub` will provide the fix forever.

You can also remove the `hwe` kernel and use the `generic` one: this way, the problem won't occur at all.

:::tip
Alternatively, in a fresh Ubuntu 18.04 install, you can switch to UEFI and you won't have this issue.
:::

## Missing templates when creating a new VM

If you attempt to create a new VM, and you notice that you only have a handful of templates available, you can try fixing this from the console. Simply go to the console of your XCP-NG host and enter the following command:
```
/usr/bin/create-guest-templates
```

This should recreate all the templates.


## The updater plugin is busy

The message `The updater plugin is busy (current operation: check_update)` means that the plugin crashed will doing an update. The lock was then active, and it was left that way. You can probably see that by doing:

```
cat /var/lib/xcp-ng-xapi-plugins/updater.py.lock
```

It should be empty, but if you have the bug, you got `check_update`.

Remove `/var/lib/xcp-ng-xapi-plugins/updater.py.lock` and that should fix it.