# Managing pools and hosts

You have multiple ways to manage your hosts and your pool: all of those are called **clients**.

* [`xe` CLI](management.md#xe) (talking to a host [XAPI](api.md) directly)
* [*XCP-ng Center*](management.md#xcp-ng-center) (Windows client, only community supported)
* [Xen Orchestra web UI](management.md#xen-orchestra) (need an XO virtual appliance running)
* [Xen Orchestra CLI](management.md#xo-cli) (`xo-cli`, same requirement)
* [Xen Orchestra API](management.md#xo-api) (same requirement)
* [XO Lite](management.md#xo-lite) (future embeded lightweight client)

:::tip
As soon you start to work with multiple pools, or if you want to have advanced features, you'll need more advanced clients. For example, `xe`, XO Lite and *XCP-ng Center* are considered "basic", and Xen Orchestra web UI, CLI or API is so far the only one considered "advanced".
:::

## xe

The `xe` command line interface is installed by default on all XCP-ng hosts. A stand-alone remote CLI is also available for Linux.

Please read the [xe dedicated section here](./cli_reference.md).

:::tip
`xe` however, works within a pool. If you want a cross-pool CLI (ie your whole infrastructure), please take a look at [Xen Orchestra CLI!](https://xen-orchestra.com/docs/xo-cli.html)
:::

## XCP-ng Center

:::warning
*XCP-ng Center* is only community maintained, and right now, by one person. It fills a gap between `xe` and Xen Orchestra, until XO Lite is available. Use it with caution.
:::

This is the heavy client working on Windows only. You can [download here](https://github.com/xcp-ng/xenadmin/releases/) on the GitHub project page.

## Xen Orchestra

Xen Orchestra is the **officially supported client for XCP-ng**. It's currently dev by the same team that's at the origin of XCP-ng project ([Vates](https://vates.fr)).

![](https://xen-orchestra.com/assets/featuresadmin.png)

It's also far more than just a client: because it runs 24/7 in a daemon, a lot of extra cool stuff is possible:
* reports
* ACLs
* Self Service
* load balancing
* SDN controller
* backup
* delta backup
* Disaster Recovery
* Continuous Replication
* backup with RAM etc…

Take a look at [the official doc](https://xen-orchestra.com/docs/) to take a tour on what's possible.

Xen Orchestra is fully Open Source, and it comes in 2 "flavors":

1. the turnkey/preinstalled virtual appliance, called **XOA** that you can [deploy in a minute](https://xen-orchestra.com/#!/xoa)
2. manual install from GitHub ([documentation](https://xen-orchestra.com/docs/from_the_sources.html))

:::tip
We advise to start using XOA by deploying it really easily in [few clicks on this page](https://xen-orchestra.com/#!/xoa). You can always decide later to build it yourself from GitHub.
:::

### XOA vs XO from GitHub?

XOA is meant to be used as the easiest way to test it, but also to use it in production: this is the version **professionally supported**. If you are an individual, feel free to enjoy version from GitHub directly!

### Web UI

You have access to all XCP-ng possibilities (and more!) from a web UI:

![](https://xen-orchestra.com/assets/main_view.jpg)

![](https://xen-orchestra.com/assets/stats.png)

Please report to [XO official documentation](https://xen-orchestra.com/docs) for more!

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

Check [XO CLI documentation](https://xen-orchestra.com/docs/xo-cli.html) for more details.

:::tip
Unlike `xe` which is only connected to one pool, `xo-cli` has access to all pools connected via Xen Orchestra. This is the prefered way to manage your infrastructure, using XO as a central point.
:::

### XO API

You can also build your own application or automation on top of XO API. It's a JSON-RPC API, using the same function calls that `xo-cli`.

## XO Lite

:::tip
XO Lite is not there yet, but it will be embed in each host in a reasonable future
:::
