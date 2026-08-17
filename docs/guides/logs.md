# Logging system

How to get further with XCP-ng logs?

:::warning
Any manual modification to the configuration files described below may prevent future XCP-ng updates to update the contents of those files. Avoid modifying them and ask for advice if you have a use case that appears to require such modifications.
:::

## logrotate {#logrotate}

`logrotate` is the tool to administrate the rotation, compression, removal, ... of log files.
The configuration is located in `/etc/logrotate.conf`; the `/etc/logrotate.d` directory is included by this file for additional rules (for example for specific packages after RPM installation like `xha`, `blktap`, `SMlog`...).
This configuration is used by the daily cron task `/etc/cron.daily/logrotate`.

By default a file is rotated if:
  - its size is greater than 100 MiB (since XCP-ng 8.2.1)
  - it's a new day (daily rotation)

Also a file is compressed after two rotations, the first time it is just renamed.

## rsyslog {#rsyslog}

Because a file must be rotated if a log exceeds 100 MiB, the `rsyslog` daemon is used to trigger automatically the `/etc/cron.daily/logrotate` script without waiting for the logrotate cron job to run. (Conf location: `/etc/rsyslog.d/xenserver.conf`)

## Specific config: `xensource.log` {#specific-config-xensourcelog}

`xensource.log` has many particular and different configuration parameters, so another `logrotate` config is used: `/etc/xensource/xapi-logrotate.conf` in a shell script `/opt/xensource/libexec/xapi-logrotate.sh` that executes `logrotate` with this specific config.

There is normally no need to run it manually, a cron task `/etc/cron.d/xapi-logrotate.cron` is present to schedule it each hour.
The goal of this special config is to keep the `xensource.log` files for one month, and to limit the number of log files to 100.

## Remote syslog {#remote-syslog}

Sending logs to a central syslog server keeps them available even when a host dies, and offloads the (very verbose) log writing from the host's disk:

<Terminal shell title="root@xcp-ng-host — Remote syslog">{`
xe host-param-set uuid=<host-uuid> logging:syslog_destination=<syslog-server-ip-or-fqdn>
xe host-syslog-reconfigure host-uuid=<host-uuid>
`}</Terminal>

To revert, remove the key with `xe host-param-remove uuid=<host-uuid> param-name=logging param-key=syslog_destination` and run `host-syslog-reconfigure` again.
