---
sidebar_position: 2
---

# Xen Orchestra CLI

Xen Orchestra CLI or `xo-cli` is a module allowing you to send commands directly from the command line to your Xen Orchestra server.

Thanks to introspection, `xo-cli` will detect all the available features exposed in the xo-server API.


```
> xo-cli --help
Usage:

  xo-cli --register <XO-Server URL> <username> [<password>]
    Registers the XO instance to use.

  xo-cli --unregister
    Remove stored credentials.

  xo-cli --list-commands [--json] [<pattern>]...
    Returns the list of available commands on the current XO instance.

    The patterns can be used to filter on command names.

  xo-cli --list-objects [--<property>]… [<property>=<value>]...
    Returns a list of XO objects.

    --<property>
      Restricts displayed properties to those listed.

    <property>=<value>
      Restricted displayed objects to those matching the patterns.

  xo-cli <command> [<name>=<value>]...
    Executes a command on the current XO instance.
```

Check [XO CLI documentation](https://xen-orchestra.com/docs/architecture.html#xo-cli-cli) for more details.

:::tip
Unlike `xe` which is only connected to one pool, `xo-cli` has access to all pools connected via Xen Orchestra. This is the preferred way to manage your infrastructure, using XO as a central point.
:::