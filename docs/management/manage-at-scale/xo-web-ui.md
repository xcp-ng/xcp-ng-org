---
sidebar_position: 1
---

# Xen Orchestra Web UI (XO)

If you see for a central console to manage all your hosts at a single point, <abbr title="Xen Orchestra">XO</abbr> is the right tool for that mission.

<abbr title="Xen Orchestra">XO</abbr> is the **officially supported client for XCP-ng**. It's currently developed by the same team as the XCP-ng project ([Vates](https://vates.tech)).

![Xen Orchestra (XO) VMs list view, with the "New" submenu opened.](https://xen-orchestra.com/assets/featuresadmin.png)

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

<abbr title="Xen Orchestra">XO</abbr> is fully Open Source, and it comes in 2 "flavors":

1. the turnkey/preinstalled virtual appliance, called **<abbr title="Xen Orchestra Appliance">XOA</abbr>** that you can [deploy in a minute](https://vates.tech/deploy/) tested and bundled with actual commercial support
2. manual install from GitHub ([documentation](https://docs.xen-orchestra.com/installation#from-the-sources)), no QA nor stable version, community supported only

:::info
We advise to start using <abbr title="Xen Orchestra Appliance">XOA</abbr> by deploying it really easily in [few clicks on this page](https://vates.tech/deploy/). You can always decide later to build it yourself from GitHub.
:::

## 🚀 Deploy <abbr title="Xen Orchestra">XO</abbr> virtual Appliance
You can deploy <abbr title="Xen Orchestra">XO</abbr> from a web UI, using:
* [Web deploy directly](https://vates.tech/deploy/) (fastest & recommended)
* Using [<abbr title="Xen Orchestra">XO</abbr> Lite](../manage-locally/xo-lite.md)

:::info
The deployment process may take some time, as it involves importing an <abbr title="Xen Orchestra Appliance">XOA</abbr> VM.
You can check the progress in [<abbr title="Xen Orchestra">XO</abbr> Lite](../manage-locally/xo-lite.md)
(Pool -> Host -> Tasks)
:::

### Alternative way to deploy <abbr title="Xen Orchestra Appliance">XOA</abbr>

From the CLI using a deploy script, by running this in your XCP-ng host:
```
bash -c "$(wget -qO- https://xoa.io/deploy)"
```

## 🪙 <abbr title="Xen Orchestra Appliance">XOA</abbr> vs <abbr title="Xen Orchestra">XO</abbr> from GitHub?

<abbr title="Xen Orchestra Appliance">XOA</abbr> is meant to be used as the easiest way to test it, but also to use it in production: this is the version **professionally supported**, with an updater and a support tunnel mechanism.

If you are an individual, feel free to enjoy the version from [GitHub directly](https://github.com/vatesfr/xen-orchestra)!

:::warning
<abbr title="Xen Orchestra">XO</abbr> from the sources doesn't have QA and there's no stable version. It's great for a home lab or to make tests, but not for production.
:::

## 🌐 Web UI

You have access to all XCP-ng possibilities (and more!) from a web UI:

![Zoomed in view of the VMs list in <abbr title="Xen Orchestra">XO</abbr>.](https://xen-orchestra.com/assets/main_view.jpg)

![Stats view of the Network througput in <abbr title="Xen Orchestra">XO</abbr>.](https://xen-orchestra.com/assets/stats.png)

Please report to [<abbr title="Xen Orchestra">XO</abbr> official documentation](https://xen-orchestra.com/docs) for more!
