# Managing pools and hosts

You have multiple ways to manage your hosts and your pool: all of those are called **clients**.

## 🔭 Local management

If you have one host or small pool (a cluster), you can use those following tools:

* [`xe` CLI](manage-locally/cli) (talking to a host [<abbr title="Xen Project Management API">XAPI</abbr>](manage-locally/api.md) directly)
* [<abbr title="Xen Orchestra">XO</abbr> Lite](manage-locally/xo-lite) (embedded lightweight web client)
* [Xen API](manage-locally/api) (<abbr title="Xen Project Management API">XAPI</abbr>)
* [*XCP-ng Center*](https://github.com/xcp-ng/xenadmin/) (Windows client, deprecated and **not supported** :warning:)

## 🛰️ Manage at scale

As soon you start to management multiple hosts and/or pools, you might need a single/central orchestrator. That's the point of <abbr title="Xen Orchestra">XO</abbr>, which can be used via a web UI, a CLI or its API:


* [<abbr title="Xen Orchestra">XO</abbr> web UI](manage-at-scale/xo-web-ui) (web interface)
* [<abbr title="Xen Orchestra">XO</abbr> CLI](manage-at-scale/xo-cli) (command line tool)
* [<abbr title="Xen Orchestra">XO</abbr> API](manage-at-scale/xo-api) (REST and JSON-RPC APIs)

:::tip
<abbr title="Xen Orchestra">XO</abbr> is not just an XCP-ng orchestrator at scale: it's also a backup tool. See the [backup section](backup.md) for more details.
:::