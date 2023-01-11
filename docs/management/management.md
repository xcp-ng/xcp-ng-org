# Managing pools and hosts

You have multiple ways to manage your hosts and your pool: all of those are called **clients**.

## Local management

If you have one host or small pool (a cluster), you can use those following tools:

* [`xe` CLI](../Management#xe) (talking to a host [XAPI](api.md) directly)
* [XO Lite](../Management#xo-lite) (future embedded lightweight client)
* [Xen API](https://xapi-project.github.io/) (XAPI)
* [*XCP-ng Center*](../Management#xcp-ng-center) (Windows client, only community supported and not updated often)
## Manage at scale

As soon you start to management multiple hosts and/or pools, you might need a single/central orchestrator. That's the point of Xen Orchestra, which can be used via a web UI, a CLI or its API:


* [Xen Orchestra web UI](../Management#xen-orchestra) (need an XO virtual appliance running)
* [Xen Orchestra CLI](../Management#xo-cli) (`xo-cli`, same requirement)
* [Xen Orchestra API](../Management#xo-api) (same requirement)

:::tip
Xen Orchestra is not just an XCP-ng orchestrator at scale: it's also a backup tool. See the backup section for more details.
:::

### XO CLI

This is another client of `xo-server` (like XO Web) - this time in command line form.

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

### XO API

You can also build your own application or automation on top of XO API. It's a JSON-RPC API, using the same function calls that `xo-cli`.

## XO Lite

:::tip
XO Lite is not there yet, but it will be embed in each host in a reasonable future
:::
