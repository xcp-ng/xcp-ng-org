# Managing pools and hosts

You have multiple ways to manage your hosts and your pool: all of those are called **clients**.

## :telescope: Local management {#local-management}

If you have one host or small pool (a cluster), you can use those following tools:

* [`xe` CLI](manage-locally/cli) (talking to a host [XAPI](manage-locally/api.md) directly)
* [XO Lite](manage-locally/xo-lite) (embedded lightweight web client)
* [Xen API](manage-locally/api) (XAPI)
* [*XCP-ng Center*](https://github.com/xcp-ng/xenadmin/) (Windows client, deprecated and **not supported** :warning:)

## :artificial_satellite: Manage at scale {#manage-at-scale}

As soon you start to management multiple hosts and/or pools, you might need a single/central orchestrator. That's the point of Xen Orchestra, which can be used via a web UI, a CLI or its API:


* [Xen Orchestra web UI](manage-at-scale/xo-web-ui) (web interface)
* [Xen Orchestra CLI](manage-at-scale/xo-cli) (command line tool)
* [Xen Orchestra API](manage-at-scale/xo-api) (REST and JSON-RPC APIs)

:::tip
Xen Orchestra is not just an XCP-ng orchestrator at scale: it's also a backup tool. See the [backup section](backup.md) for more details.
:::

## :world_map: Common operations {#common-operations}

Whatever the client you use, the main operation guides are here:

* [Hosts and pools operations](hosts-pools.md) (pool creation, maintenance mode, passwords, NTP...)
* [Updates](updates.md)
* [Backup](backup.md) and [High availability](ha.md)
* [Monitoring and alerts](monitoring.md)
* [Users and permissions](users-permissions.md)
* [VM load balancing](vm-load-balancing.md)
