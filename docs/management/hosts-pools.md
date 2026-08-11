---
sidebar_position: 5
---

# Hosts and pools operations

Day-to-day operations on your XCP-ng hosts and resource pools: creating a pool, adding and removing hosts, maintenance mode, passwords, time synchronization, remote power-on and pool-wide settings.

:::tip
Almost everything on this page can be done in a few clicks from [Xen Orchestra](manage-at-scale/xo-web-ui.md), which is the recommended way to operate XCP-ng at scale. The `xe` commands are given so you can also work directly on a host, script operations, or troubleshoot when the orchestrator is not available.
:::

## 🎓 Concepts {#concepts}

A **resource pool** is a group of up to 64 XCP-ng hosts managed as a single entity. One host is the **pool coordinator** (formerly called "pool master"): it exposes the XAPI endpoint for the whole pool, holds the pool database and forwards operations to the other members. All members keep a replicated copy of that database, which is why another host can take over the coordinator role if needed.

Why create a pool rather than managing standalone hosts?

* **Live migration** of VMs between hosts of the pool.
* **Shared storage**: an SR created on the pool is visible to all members, so VMs can start anywhere.
* **Single point of management**: one connection, one inventory, pool-wide networks and settings.
* **[High availability](ha.md)** and [VM load balancing](vm-load-balancing.md) both operate at the pool level.

<Schema label="A resource pool · one XAPI endpoint, a replicated database, shared storage" legend={[["#8e83fe", "XAPI"], ["#56c288", "replicated pool DB"]]} maxWidth="720px">
<svg viewBox="0 0 640 312" role="img" aria-label="Clients talk to the pool coordinator's XAPI endpoint; the coordinator and two members each hold a copy of the pool database and all hosts reach the same shared SR">
  <text x="130" y="30" fontSize="13" fill="#c6d2e1" textAnchor="middle">Xen Orchestra · xe · API</text>
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="20" y="90" width="180" height="120" rx="8"/>
    <rect x="230" y="90" width="180" height="120" rx="8"/>
    <rect x="440" y="90" width="180" height="120" rx="8"/>
  </g>
  <text x="110" y="114" fontSize="13" fill="#c6d2e1" textAnchor="middle">pool coordinator</text>
  <text x="320" y="114" fontSize="13" fill="#c6d2e1" textAnchor="middle">member</text>
  <text x="530" y="114" fontSize="13" fill="#c6d2e1" textAnchor="middle">member</text>
  <rect x="36" y="128" width="148" height="30" rx="5" fill="rgba(142,131,254,0.14)" stroke="#8e83fe" strokeOpacity="0.85"/>
  <text x="110" y="147" fontSize="11.5" fill="#8e83fe" textAnchor="middle">XAPI endpoint</text>
  <g fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.8">
    <rect x="36" y="168" width="148" height="28" rx="5"/>
    <rect x="246" y="168" width="148" height="28" rx="5"/>
    <rect x="456" y="168" width="148" height="28" rx="5"/>
  </g>
  <g fontSize="11" fill="#56c288" textAnchor="middle">
    <text x="110" y="186">pool DB</text>
    <text x="320" y="186">pool DB (copy)</text>
    <text x="530" y="186">pool DB (copy)</text>
  </g>
  <path d="M125 38 C 118 60, 112 70, 108 88" stroke="#8e83fe" strokeWidth="1.6" fill="none"/>
  <g stroke="#56c288" strokeWidth="1.2" strokeDasharray="4 4" fill="none">
    <line x1="184" y1="182" x2="246" y2="182"/>
    <line x1="394" y1="182" x2="456" y2="182"/>
  </g>
  <g stroke="#7a8699" strokeWidth="1.4">
    <line x1="110" y1="210" x2="270" y2="252"/>
    <line x1="320" y1="210" x2="310" y2="252"/>
    <line x1="530" y1="210" x2="370" y2="252"/>
  </g>
  <rect x="240" y="252" width="160" height="34" rx="8" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)"/>
  <text x="320" y="273" fontSize="12" fill="#c6d2e1" textAnchor="middle">shared SR</text>
  <text x="608" y="304" fontSize="10.5" fill="#7a8699" textAnchor="end">VMs can start and migrate anywhere</text>
</svg>
</Schema>

The requirements for pooling hosts (hardware, CPU vendor, versions…) are described in the [pool requirements](../installation/requirements.md#pool-requirements) section.

:::info
A standalone host is simply a pool of one: there's no special "pool creation" step. You create a pool by joining a second host to the first one.
:::

## 🏗️ Create a pool {#create-a-pool}

### Name the pool

A freshly installed host belongs to its own unnamed pool. Give it a name, which will be the pool's name once you add more hosts:

<Terminal shell title="root@xcp-ng-host — Name the pool">{`
xe pool-param-set uuid=<pool-uuid> name-label="My pool"
`}</Terminal>

From Xen Orchestra, simply edit the pool name from the pool view.

### Add a host to the pool

From Xen Orchestra: open the pool and use the **Add hosts** action, then pick the standalone host(s) to include.

With `xe`, run this **on the host that should join** the pool:

<Terminal shell title="root@xcp-ng-host — Add a host to the pool">{`
xe pool-join master-address=<coordinator-ip-or-fqdn> master-username=root master-password=<password>
`}</Terminal>

What happens on join:

* The host fetches the pool database and becomes a member: from now on, you manage it through the pool coordinator.
* Its local SRs remain available, as local storage of that member.
* Pool-wide settings (networks, TLS verification, update channels…) are inherited from the pool.

:::warning
The joining host must be "clean": no running or suspended VMs, and its version must match the rest of the pool. VMs should be exported/moved before the join, or shut down.
:::

### Heterogeneous pools

Hosts with different CPUs (same vendor!) can be pooled: XAPI automatically levels the CPU feature set exposed to VMs down to the common denominator, so live migration stays safe across all members. Mixing Intel and AMD hosts in the same pool is not possible.

If the hosts differ in a way that blocks a regular join, you can force it, and take responsibility for the consequences:

<Terminal shell title="root@xcp-ng-host — Heterogeneous pools">{`
xe pool-join master-address=<coordinator> master-username=root master-password=<password> force=true
`}</Terminal>

## 🚪 Remove a host from a pool {#remove-a-host-from-a-pool}

From Xen Orchestra, use the host's **Detach** action. With `xe`:

<Terminal shell title="root@xcp-ng-host — Remove a host from a pool">{`
xe pool-eject host-uuid=<host-uuid>
`}</Terminal>

:::warning
Ejecting a host **reinstalls its XAPI state**: the host reboots and comes back as a fresh standalone host. The contents of its **local SRs are destroyed** in the process. Move or export any VM disk you care about beforehand. Shared SR contents are not affected.
:::

If the host to remove is dead and cannot be ejected cleanly, you can remove its record from the pool database instead:

<Terminal shell title="root@xcp-ng-host — Remove a host from a pool">{`
xe host-forget uuid=<host-uuid>
`}</Terminal>

`host-forget` doesn't touch the (dead) host itself: if it ever comes back online, it will still believe it belongs to the pool, so reinstall it before reuse.

## 👑 Change the pool coordinator {#change-the-pool-coordinator}

### Planned change

With all hosts up and reachable, you can hand the coordinator role to another member at any time. This is transparent for running VMs:

<Terminal shell title="root@xcp-ng-host — Planned change">{`
xe pool-designate-new-master host-uuid=<new-coordinator-uuid>
`}</Terminal>

### Coordinator is down

If the coordinator is lost and you don't use [HA](ha.md) (which handles this automatically), promote a surviving member. Run these **on that member**:

<Terminal shell title="root@xcp-ng-host — Coordinator is down">{`
xe pool-emergency-transition-to-master
xe pool-recover-slaves
`}</Terminal>

The first command makes the local host the new coordinator; the second tells the remaining members to point at it. See also [HA troubleshooting](../troubleshooting/troubleshooting-ha.md) when high availability is involved.

## 🔧 Maintenance mode {#maintenance-mode}

Before rebooting a host or working on its hardware, put it in maintenance mode: it stops accepting new VMs and evacuates the running ones (live migrating them to the other members).

From Xen Orchestra: **Maintenance mode** toggle on the host view. With `xe`:

<Terminal shell title="root@xcp-ng-host — Maintenance mode">{`
xe host-disable uuid=<host-uuid>
xe host-evacuate uuid=<host-uuid>
`}</Terminal>

If some VMs cannot be moved (e.g. a disk on that host's local SR, or not enough memory elsewhere), the evacuation tells you why; you can also ask beforehand:

<Terminal shell title="root@xcp-ng-host — Maintenance mode">{`
xe host-get-vms-which-prevent-evacuation uuid=<host-uuid>
`}</Terminal>

When you're done, bring the host back into service:

<Terminal shell title="root@xcp-ng-host — Maintenance mode">{`
xe host-enable uuid=<host-uuid>
`}</Terminal>

See also the dedicated guide about [rebooting or shutting down a host](../guides/host-reboot.md), and the [updates documentation](updates.md) for the recommended way to patch a whole pool (Rolling Pool Update in Xen Orchestra).

## 🔑 Root password {#root-password}

The `root` password of the hosts is what XAPI clients (Xen Orchestra, XO Lite, `xe`…) use to authenticate. All members of a pool are meant to share the same root password (a joining host adopts the pool's credentials).

To change it, from the pool coordinator:

<Terminal shell title="root@xcp-ng-host — Root password">{`
xe user-password-change old=<current-password> new=<new-password>
`}</Terminal>

You can also use `xsconsole` (the text console you get on the host's physical/serial display), in **Authentication** → **Change Password**.

Lost the root password? See the [reset procedure](../troubleshooting/common-problems.md#reset-xcp-ng-root-password) in the troubleshooting section.

## ⏰ Time synchronization (NTP) {#time-synchronization-ntp}

Correct and consistent clocks across the pool matter more than on ordinary servers: XAPI coordination, live migration, HA heartbeats, logs correlation and Windows guests (which get their initial time from the host) all rely on it. NTP servers are normally configured at [installation time](../installation/install-xcp-ng.md).

See [Time synchronization](time-synchronization.md) for what a wrong clock breaks, how to check whether `chronyd` has any time sources, and how to correct a clock that is already wrong.

To change them afterwards on XCP-ng 8.3, edit `/etc/chrony.conf`, then:

<Terminal shell title="Time synchronization (NTP)">{`
systemctl restart chronyd
chronyc sources
`}</Terminal>

On XCP-ng 8.2, the NTP daemon is `ntpd`: edit `/etc/ntp.conf`, then `systemctl restart ntpd` and check with `ntpq -p`. In both cases, `xsconsole` also offers an NTP configuration menu under **Network and Management Interface**.

## 🔌 Remote host power-on {#remote-host-power-on}

XCP-ng can power hosts back on remotely, using either Wake-on-LAN or the server's out-of-band controller. Configure the method per host:

<Terminal shell title="root@xcp-ng-host — Remote host power-on">{`
xe host-set-power-on-mode host=<host-uuid> power-on-mode=wake-on-lan
`}</Terminal>

`power-on-mode` also accepts `iLO`, `DRAC` or `custom` (with `power-on-config:` parameters for the controller's IP and credentials), or an empty string to disable the feature. Then, to power on a host from anywhere in the pool:

<Terminal shell title="root@xcp-ng-host — Remote host power-on">{`
xe host-power-on host=<host-uuid>
`}</Terminal>

This capability is also what allows [VM load balancing](vm-load-balancing.md) density plans to power hosts off and on according to the load.

## 🤝 Pool-wide settings {#pool-wide-settings}

### Rotate the pool secret

Members of a pool authenticate each other with a shared secret. Rotate it if you suspect it leaked, or after removing hosts you don't fully trust anymore:

<Terminal shell title="root@xcp-ng-host — Rotate the pool secret">{`
xe pool-secret-rotate
`}</Terminal>

### IGMP snooping

If your VMs use multicast, enabling IGMP snooping avoids flooding every VIF of a network with multicast traffic:

<Terminal shell title="root@xcp-ng-host — IGMP snooping">{`
xe pool-param-set uuid=<pool-uuid> igmp-snooping-enabled=true
`}</Terminal>

### Restrict port 80 (HTTPS only)

Starting with XCP-ng 8.3, plain HTTP on port 80 is restricted by default. You can control it explicitly:

<Terminal shell title="root@xcp-ng-host — Restrict port 80 (HTTPS only)">{`
xe pool-param-set uuid=<pool-uuid> https-only=true
`}</Terminal>

Leave it to `true` unless something in your tooling still requires port 80.

### Certificate verification

XCP-ng 8.3 pools can verify TLS certificates for pool-internal communication:

<Terminal shell title="root@xcp-ng-host — Certificate verification">{`
xe pool-enable-tls-verification
`}</Terminal>

See the [TLS certificates guide](../guides/TLS-certificates-xcpng.md#pool-certificate-verification) for certificate management (custom certificates, renewal, resets).

### Migration compression

Starting with XCP-ng 8.3, the live migration memory stream can be compressed. Very useful when the migration network is the bottleneck, at the cost of some dom0 CPU:

<Terminal shell title="root@xcp-ng-host — Migration compression">{`
xe pool-param-set uuid=<pool-uuid> migration-compression=true
`}</Terminal>

The setting applies pool-wide to subsequent migrations; Xen Orchestra also exposes it in the pool's advanced settings.

## 🩺 Pool database backup {#pool-database-backup}

The pool database (all your XAPI objects: VMs, SRs, networks…) is replicated on every member, and can also be exported and restored: see the [backup page](backup.md) for pool metadata backup and restore procedures.
