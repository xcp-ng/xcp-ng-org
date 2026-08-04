# Display

## Changing screen resolution

XCP-ng doesn't touch the screen resolution by default and keeps the one used
at boot (usually from the firmware). However, in some cases, it may be useful
to increase the screen resolution or adjust it for specific needs or to work around
some display hardware limitations.

:::warning
Xen versions prior to `4.17.6-9.5` unconditionally reconfigure the display to the highest
screen resolution, regardless of the `vga` parameter when booting in UEFI mode.
:::

To change resolutions, you can try adding the `vga` parameter to the Xen command line.

The parameter follows this format `vga=gfx-WxHx24` (where W is screen width and H is
screen height, 24 being the standard 8bpp color depth). For instance,
`vga=gfx-1920x1080x24` configures a 1920x1080 (1080p 16:9) screen resolution.

This can be configured temporarly from GRUB (editor), or permanently, using
```
/opt/xensource/libexec/xen-cmdline --set-xen "vga=gfx-WxHx24"
```

And reverted using
```
/opt/xensource/libexec/xen-cmdline --delete-xen vga
```

:::note
This parameter only works if the firmware display driver supports such resolution.
Incorrect values may cause the parameter to be ignored, or make you lose the display output.
:::