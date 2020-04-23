# Quick start

This guide will help you to set up XCP-ng quickly.

## Download and create media

You can download the ISO here: https://updates.xcp-ng.org/isos/8.1

Then, create the install media (eg USB key):

```
dd if=xcp-ng-8.1.0-2.iso of=/dev/sdX bs=8M oflag=direct
```

Finally, boot on that media and go to the next section.

:::tip
On Windows, you can use Rufus to create the bootable USB stick.
:::

## Start the host

Start the host and boot on the USB media.