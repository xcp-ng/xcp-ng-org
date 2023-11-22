---
sidebar_position: 1
---

# Xen Orchestra Web UI

If you see for a central console to manage all your hosts at a single point, Xen Orchestra (XO) is the right tool for that mission.

Xen Orchestra is the **officially supported client for XCP-ng**. It's currently developed by the same team as the XCP-ng project ([Vates](https://vates.tech)).

![](https://xen-orchestra.com/assets/featuresadmin.png)

It's also far more than just a client: because it runs 24/7 in a daemon, a lot of extra cool stuff is possible:
* Various reports
* ACLs
* Self Service
* VM load balancing
* SDN controller
* Backup
* Delta backup
* Disaster Recovery
* Continuous Replication
* Backup with RAM
* Warm migration
* and much more!

Take a look at [the official doc](https://xen-orchestra.com/docs/) to take a tour on what's possible.

Xen Orchestra is fully Open Source, and it comes in 2 "flavors":

1. the turnkey/preinstalled virtual appliance, called **XOA** that you can [deploy in a minute](https://vates.tech/deploy/) tested and bundled with actuel commercial support
2. manual install from GitHub ([documentation](https://xen-orchestra.com/docs/from_the_sources.html)), no QA nor stable version, community supported only

:::info
We advise to start using XOA by deploying it really easily in [few clicks on this page](https://vates.tech/deploy/). You can always decide later to build it yourself from GitHub.
:::

## 🚀 Deploy Xen Orchestra virtual Appliance
You can deploy Xen Orchestra from a web UI, using:
* [Web deploy directly](https://vates.tech/deploy/) (fastest & recommended)
* Using [XO Lite](../manage-locally/xo-lite.md)

### Alternative way to deploy XOA

From the CLI using a deploy script, by running this in your XCP-ng host:
```
bash -c "$(wget -qO- https://xoa.io/deploy)"
```

## 🪙 XOA vs XO from GitHub?

XOA is meant to be used as the easiest way to test it, but also to use it in production: this is the version **professionally supported**, with an updater and a support tunnel mechanism.

If you are an individual, feel free to enjoy the version from [GitHub directly](https://github.com/vatesfr/xen-orchestra)!

:::warning
XO from the sources doesn't have QA and there's no stable version. It's great for a home lab or to make tests, but not for production.
:::

## 🌐 Web UI

You have access to all XCP-ng possibilities (and more!) from a web UI:

![](https://xen-orchestra.com/assets/main_view.jpg)

![](https://xen-orchestra.com/assets/stats.png)

Please report to [XO official documentation](https://xen-orchestra.com/docs) for more!