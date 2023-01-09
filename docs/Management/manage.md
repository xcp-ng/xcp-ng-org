# Managing XCP-ng

Now you have your hosts running, the next step is to manage it. You have various options to do so, choose the one that fits best!

:::tip
Xen Orchestra is the only professionally supported and maintained solution to manage your hosts. *XCP-ng Center* is only community maintained.
:::

## Concepts

All XCP-ng clients are communicating with the pool master, through the Xen API ([XAPI](api.md)). You only need to open a connection to the master, even if there's multiple hosts.

Some clients are stateless (only running when you open or use them) and others are stateful (running in a daemon, often in a dedicated VM). For very basic management tasks, stateless clients are fine. However, for more advanced features, you need stateful clients.

![](https://xcp-ng.org/assets/img/xapiclients.png)

## Web UI, CLI, heavy clients?

You have multiple solutions to manage your hosts, see the dedicated [Management](management.md) section.

## Backup

Some XCP-ng clients are also capable of doing backup. Please read the dedicated [backup section](backup.md).
