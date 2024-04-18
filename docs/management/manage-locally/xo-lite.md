---
sidebar_position: 2
---

# XO Lite

# For Local Management 

Xen Orchestra Lite is a lightweight version of the Xen Orchestra meant for single-host administration, running directly from your browser without having to deploy anything, hosted on XCP-ng directly.

:::note
XO Lite is still a work in progress! However, it's meant to cover all basic actions you need to boostrap your infrastructure or just do basic operation on your VMs.
:::

:::info
XO Lite isn't an orchestrator, it's just a local management console. If you want to orchestrate your VMs (load balancing, backup, warm migration and so on), you MUST use [Xen Orchestra](../manage-at-scale/xo-web-ui.md)!
:::

## 🔐 Credentials

XO Lite credentials are the same than the host (SSH credentials), usually `root` as user and the password chosen during the installation process.

![](../../../static/img/xolitelogin.png)

## 📊 Dashboard

Once logged, you can see the dashboard:

![](../../../assets/img/xolite.jpg)
