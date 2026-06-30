# Display

## Changing screen resolution

XCP-ng doesn't touch the screen resolution by default and keep the one used
at boot (usually from the firmware). However, in some cases, it may be useful
to increase the screen resolution or adjust it for specific needs or to workaround
some display hardware limitations.

:::warning
Xen versions prior `4.17.6-9.5` unconditionally reconfigure the display to highest
screen resolution regardless of `vga` parameter when booting in UEFI mode.
:::

You can add to Xen command-line a `vga` parameter in order to try changing resolutions.

The parameter follows this format `vga=gfx-WxHx24` (where W is screen width and H is
screen height, 24 being the standard 8bpp color depth), for instance,
`vga=gfx-1920x1080x24` configures a 1920x1080 (1080p 16:9) screen resolution.

This can be configured either temporarly from GRUB (editor) or permanently using
```
/opt/xensource/libexec/xen-cmdline --set-xen "vga=gfx-WxHx24"
```

And reverted using
```
/opt/xensource/libexec/xen-cmdline --delete-xen vga
```

:::note
This parameter only works if the firmware display driver supports such resolution,
incorrect values may lead to the parameter being ignored or loss of display output.
:::