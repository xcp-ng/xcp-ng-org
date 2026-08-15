---
sidebar_position: 6
---

# Monitoring and alerts

How to watch the health and performance of your hosts, VMs and storage, and get alerted before users notice a problem.

## With Xen Orchestra {#with-xen-orchestra}

Xen Orchestra is the natural place to monitor a whole XCP-ng infrastructure:

* **Dashboards and stats**: every pool, host, VM and SR has a *Stats* view (CPU, RAM, network, disk I/O) with history, plus a global dashboard with health indicators (orphaned VDIs, missing patches, unhealthy VDI chains...).
* **Performance alerts**: the *perf-alert* plugin emails you when CPU usage, memory usage or SR usage crosses a threshold you define, for the objects you select.
* **Backup reports**: every backup job can send a detailed success/failure report (email, and messaging platforms via plugins).
* **Audit trail**: records who did what on your infrastructure.

See the [Xen Orchestra documentation](https://docs.xen-orchestra.com/) for the details of each feature.

## Host-level metrics (RRDs) {#host-level-metrics-rrds}

Each host continuously records metrics (CPU, memory, network, storage, per-VM and per-host) in round-robin databases (RRDs), with several months of history at decreasing granularity. This is what powers the graphs in Xen Orchestra and XO Lite.

You can query these metrics yourself:

<Terminal shell title="root@xcp-ng-host — Host-level metrics (RRDs)">{`
# List the metrics recorded for a host, then fetch values
xe host-data-source-list host=<host>
xe host-data-source-query host=<host> data-source=cpu_avg

# Same for a VM
xe vm-data-source-list vm=<vm>
xe vm-data-source-query vm=<vm> data-source=memory_internal_free
`}</Terminal>

Individual data sources can be enabled or disabled (`xe host-data-source-record`/`-forget`, same for VMs), and the `rrd2csv` tool (shipped with XAPI) streams selected metrics as CSV for quick exports.

The raw RRDs are also exposed over HTTP for external collectors: `https://<host>/rrd_updates?start=<unix-timestamp>&host=true` returns everything that changed since the given time, in XML. This endpoint is a simple way to feed XCP-ng metrics into your own tooling without installing anything in dom0.

## Live view on the host {#live-view-on-the-host}

For an instant view directly on a host (SSH or console):

* `xentop`: per-VM CPU, memory, network and disk usage, as seen from the hypervisor. The `%CPU` column is relative to one physical CPU.
* `xl info`: global hypervisor information (total/free memory, number of pCPUs...).
* Standard Linux tools (`top`, `iostat`...) inside dom0 show the control domain's own resource usage. Remember that dom0 only sees its own slice of the machine: use `xentop` for the whole picture.

High dom0 load, or dom0 running out of memory, degrades every VM on the host: see the [dom0 memory guide](../guides/dom0-memory.md).

## Netdata {#netdata}

For detailed real-time dashboards on a host, XCP-ng provides `netdata` packages, and Xen Orchestra Premium can install and integrate them in one click (host view, *Advanced* tab). Netdata gives you per-second metrics with a modern web UI, and can stream to a central Netdata parent if you have one.

You can also install it manually as an [additional package](additional-packages.md), keeping in mind the general rule: dom0 is not a regular Linux box, keep extra software minimal.

## SNMP and external supervision {#snmp-and-external-supervision}

If your organization has a central supervision system (Zabbix, Centreon, LibreNMS, Prometheus...), a few options:

* **Agentless**: scrape the RRD HTTP endpoint (above), or use the supervision system's API integration with Xen Orchestra.
* **SNMP**: `net-snmp` is available in the XCP-ng repositories as an [additional package](additional-packages.md):

<Terminal shell title="root@xcp-ng-host — SNMP and external supervision">{`
yum install net-snmp
# configure a read-only community in /etc/snmp/snmpd.conf, e.g.: rocommunity monitoring 192.0.2.0/24
systemctl enable --now snmpd
`}</Terminal>

  Then open UDP port 161 in the dom0 firewall (add the rule to `/etc/sysconfig/iptables` and restart `iptables`, so it survives reboots). Keep the community/users **read-only**.
* **NRPE**: XCP-ng doesn't ship a Nagios NRPE integration. For Nagios-family systems, use SNMP (above), or netdata's collectors.
* **Dedicated agents** (Zabbix agent...) can be installed in dom0 as additional packages, with the usual caution about keeping dom0 minimal.

:::warning
Whatever you install, never let a monitoring agent modify dom0's configuration or update its packages: see the [additional packages rules](additional-packages.md#rules).
:::

## What should I watch? {#what-should-i-watch}

A reasonable minimal set of alerts for an XCP-ng infrastructure:

* **SR free space**: a full SR stops VMs from writing. Watch thin-provisioned SRs closely, snapshots and [coalesce](../storage/storage.md#coalesce) can consume space quickly.
* **Host memory**: pool capacity to absorb a host failure ([HA](ha.md) needs headroom).
* **dom0 CPU and memory**: an overloaded control domain slows every VM.
* **Backup job results**: a backup that silently stopped working is only discovered when you need it.
* **Hardware**: use your server vendor's out-of-band management (iDRAC, iLO...) for disks, PSUs and fans; XCP-ng won't see everything the BMC sees.
