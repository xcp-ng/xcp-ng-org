# API

XCP-ng uses **XAPI** as main API. This API is used by all clients. For more details go to [XAPI website](https://xapi-project.github.io/).

:::tip
If you want to build an application on top of XCP-ng, we strongly suggest the Xen Orchestra API instead of XAPI. Xen Orchestrator provides an abstraction layer that's easier to use, and also acts as a central point for your whole infrastructure.
:::

## XAPI architecture

XAPI is a toolstack split in two parts: `xenopsd` and XAPI itself (see the diagram below):

![](https://xcp-ng.org/assets/img/Xenstack.png)

:::warning
XCP-ng is meant to use XAPI. Don't use it with `xl` or anything else!
:::

### General design

![](https://xapi-project.github.io/xapi/xapi.png)

### Objects

![](https://xapi-project.github.io/xen-api/classes.png)

### Pool design

![](https://xapi-project.github.io/getting-started/pool.png)


## Modifications

:::warning
Those changes aren't officially supported, and will be also wiped after an ISO upgrade.
:::

### 24h task timeout

Edit the `/etc/xapi.conf` file, and uncomment/change `pending_task_timeout` from:

```ini
# pending_task_timeout = 86400 # 1 day in seconds
```

To:

```ini
pending_task_timeout = 172800
```

:::tip
In this example, `172800` seconds means two days.

After changing the configuration, don't forget to restart the toolstack with `xe-toolstack-restart`.
:::
