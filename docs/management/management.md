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