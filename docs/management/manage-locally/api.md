# XCP-ng API

XCP-ng is entirely managed by its API, called "XAPI". XAPI project is hosted [on GitHub](https://github.com/xapi-project/xen-api) and the documentation is available on [its dedicated website](https://xapi-project.github.io/xen-api/).

XAPI is requested by multiple **clients**, like Xen Orchestra or `xe` CLI. See [our management](../../../management) section for more details.

:::note
We strongly encourage to build applications on top of XO API and not XAPI. In fact, XAPI is made with very specific calls (close to the Xen logic), so it's a lot better to build a solution on top of a more global API, the one [provided by Xen Orchestra](https://xen-orchestra.com/docs/architecture.html#api). It will act as a central point for all your pools and you won't have to handle all the Xen specifics.
:::

## 📐 Architecture

XAPI is using a database (Read/write on the master, replicated to slaves in read only). It's an XML file located at `/var/lib/xcp/state.db`. All the metadata and settings of your pool, hosts, VMs and so on are stored there.

![](../../../static/img/xapiclasses.png)

## 🧑‍⚕️ Troubleshooting

### Restarting the API

Sometimes, you might want to restart the toolstack (API and storage stack). You can do it with the following command from the host console (or directly with Xen Orchestra):

 ```
 xe-toolstack-restart
 ```

Restarting XAPI won't affect any running VMs. However, all backup/export tasks will be removed.

### Modifications

:::warning
Those changes aren't officially supported, and will be also wiped after an ISO upgrade.
:::

:::warning
Do NOT modify `/etc/xapi.conf` directly: any changes to this file may be overwritten in future XCP-ng updates.
:::

#### 24h task timeout

Create a new configuration file in `/etc/xapi.conf.d/`. Files in this directory are automatically loaded by XAPI when it starts.

For example, you can name it `/etc/xapi.conf.d/increase-task-timeout.conf`.

Define the new value for `pending_task_timeout`, in seconds.

Example:
```ini
# set XAPI task timeout to 48h
pending_task_timeout = 172800
```

After changing the configuration, restart the toolstack with `xe-toolstack-restart`. 

#### Enable/Disable HSTS

If you want to enable HTTP Strict Transport Security: 
- Create a new configuration file in `/etc/xapi.conf.d/`.
- You can name it `/etc/xapi.conf.d/hsts.conf`.
- Define the new value for `hsts_max_age`, in seconds.

Example:
```ini
# Set HSTS retained for 1y
hsts_max_age = 31536000
```
:::tip
Common values are:
- 1 year --> 31536000
- 2 years --> 63072000
:::
After changing the configuration, restart the toolstack with `xe-toolstack-restart`. 

Example with one command to enable HSTS and restart XAPI (example sets 1 year = 31536000):
```bash
echo "hsts_max_age = 31536000" > /etc/xapi.conf.d/hsts.conf' && sudo xe-toolstack-restart
```

:::note
Please wait (~30s) for the service to become fully available before issuing further XAPI requests.
:::

Automatic OK/KO result:
```bash
curl -skD- https://localhost/ -o /dev/null | grep -iq '^Strict-Transport-Security:.*max-age=[1-9]' && echo "HSTS: OK" || echo "HSTS: KO"
```

To disable HSTS, set `hsts_max_age` to `0` in your XAPI config file:

```ini
# Disable HSTS
hsts_max_age = 0
```

After changing the file, restart XAPI:
```bash
xe-toolstack-restart
```

:::warning
Setting `hsts_max_age = 0` disables the HSTS but does not revert to the package default.
The explicit presence of this key overrides the default value. To restore the default configuration, remove the key or the configuration file, then restart XAPI.
:::
