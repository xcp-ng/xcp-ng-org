# API

XCP-ng is using XAPI as main API. This API is used by all clients. For more details go to [XAPI website](https://xapi-project.github.io/).

![](https://xapi-project.github.io/xen-api/classes.png)

:::tip
If you want to build an application on top of XCP-ng, we strongly suggest to use Xen Orchestra API instead of XCP-ng API. Indeed, XO provides an abstraction layer that's really easier to use, and also acts as a central point for your whole infrastructure.
:::

## Architecture

![](https://xapi-project.github.io/getting-started/pool.png)


## Modifications

:::warning
Those changes aren't officially supported, and will be also wiped after an ISO upgrade
:::

### 24h task timeout

Edit the `/etc/xapi.conf` file, and uncomment/change that line:

```
# pending_task_timeout = 86400 # 1 day in seconds
```

To:


```
pending_task_timeout = 172800 # 2 days in seconds
```

Don't forget to restart the toolstack after that with a `xe-toolstack-restart`.