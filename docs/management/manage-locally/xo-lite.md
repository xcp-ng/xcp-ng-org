---
sidebar_position: 2
---

# XO Lite

Xen Orchestra Lite is a lightweight version of the Xen Orchestra meant for single-host administration, running directly from your browser without having to deploy anything, hosted on XCP-ng directly.

:::warning
XO Lite is bundled by default in XCP-ng 8.3. If you want to use it on an older release, you can do so by using this URL in your browser: `https://lite.xen-orchestra.com/#/?master=<IP_of_your_XCP-ng_master>`. Don't forget to visit the page of your XCP-ng master first to accept the self-signed certificate!
:::

:::note
XO Lite is still a work in progress! However, it's meant to cover all basic actions you need to boostrap your infrastructure or just do basic operation on your VMs.
:::

## 🔐 Credentials

XO Lite credentials are the same than the host (SSH credentials), usually `root` as user and the password chosen during the installation process.

![](../../../static/img/xolitelogin.png)

## 📊 Dashboard

Once logged, you can see the dashboard:

![](../../../assets/img/xolite.jpg)

## SSL certificate
Xolite use `stunnel@xapi.service` as proxy and SSL certificate can be configured by replace /etc/xensource/xapi-ssl.pem with cerificate-chain or editing `/etc/stunnel/xapi.conf` to pointing to certificate-hain file.

:::info
XO Lite isn't a multi-cluster orchestrator, it's just a local management console. If you want to orchestrate your VMs at scale (load balancing, backup, warm migration and so on), you MUST use [Xen Orchestra](../manage-at-scale/xo-web-ui.md)!
:::
