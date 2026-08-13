---
sidebar_position: 7
heading_emoji:
  the-model-in-short: mortar_board
  host-level-the-root-account: key
  xen-orchestra-users-groups-and-acls: busts_in_silhouette
  recommended-setup: compass
---

# Users and permissions

Who can access your XCP-ng infrastructure, and with which rights.

## The model in short {#the-model-in-short}

There are two distinct layers:

1. **On the hosts**: a single `root` account. It's what XAPI clients (Xen Orchestra, XO Lite, `xe`) and SSH use. Everyone who knows it can do everything on the pool, so treat it like the infrastructure key it is.
2. **In Xen Orchestra**: real user management. Individual accounts, groups, external identity providers, fine-grained ACLs, self-service and an audit log. This is where "users" as an organization understands them belong.

In other words: XCP-ng authenticates *management planes*, Xen Orchestra authenticates *people*.

## Host level: the root account {#host-level-the-root-account}

* Change the password with `xe user-password-change` or `xsconsole`: see [root password management](hosts-pools.md#root-password).
* All pool members share the same root password.
* Protect SSH access as you would on any critical Linux server (strong password, or keys plus disabled password authentication). XCP-ng 8.3 also tightened the default SSH ciphers and configuration. SSH can be disabled entirely from `xsconsole` (**Remote Service Configuration** → **Enable/Disable Remote Shell**) if your policies require it.
* XAPI listens on HTTPS (port 443): you can install a proper TLS certificate, see the [TLS certificates guide](../guides/TLS-certificates-xcpng.md), and on XCP-ng 8.3, [certificate verification](../releases/release-8-3.md#certificate-verification-xs) between pool members.

:::info
XAPI historically supports external authentication (Active Directory) and role-based access control at the host level. In XCP-ng this path is deprecated (see the [8.3 release notes](../releases/release-8-3.md#active-directory-in-xcp-ng)) and not recommended: user management is done in Xen Orchestra, which offers much more flexibility without touching dom0.
:::

## Xen Orchestra: users, groups and ACLs {#xen-orchestra-users-groups-and-acls}

What Xen Orchestra provides on top of your pools:

* **Users and groups**: local accounts, or synchronized from your identity provider via plugins (LDAP/Active Directory, SAML, OIDC, GitHub...).
* **ACLs**: grant a user or group a role on specific objects (a VM, a pool, an SR, a network). Three roles: *Viewer* (see), *Operator* (use: start, stop, snapshot...), *Admin* (full control including destroy).
* **Self-service**: delegate a quota of CPU, RAM and disk to a group; its members create and manage their own VMs inside that envelope, without seeing the rest of the infrastructure.
* **Audit log**: traceability of the actions performed through XO.

See the Xen Orchestra documentation for details: [users](https://docs.xen-orchestra.com/xo5/users), [ACLs](https://docs.xen-orchestra.com/xo5/users#acls), [self-service](https://docs.xen-orchestra.com/xo5/users#self-service-portal).

## Recommended setup {#recommended-setup}

For a team of any size:

1. Keep the hosts' `root` password in a password manager, known to as few people as possible. Day to day, nobody should log into a host directly.
2. Connect Xen Orchestra to your identity provider, create groups matching your teams.
3. Give admins ACLs on the pools, and application teams self-service resource sets or per-VM ACLs.
4. Enable the audit log plugin if you need traceability.
