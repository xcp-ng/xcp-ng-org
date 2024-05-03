---
title: 'Ecosystem'
---
# XCP-ng Ecosystem

Projects and technological partners around XCP-ng.

Initiated by [Vates](https://vates.tech), the development of XCP-ng was conceived as an open-source alternative to Citrix XenServer, with a dedication to establishing a fully open-source virtualization solution suitable for production use in businesses. This venture also emphasized the importance of building a robust and diverse ecosystem to complement the platform.

:::tip
If you're looking to become a reseller rather than a technological partner, we have dedicated opportunities just for you. Please [visit our Partner Page](https://vates.tech/partners/become-a-partner) to learn about our reseller program and start the application process. Join us in bringing innovative solutions to the market!
:::

<div style={{textAlign: 'center'}}>
![](../../assets/img/vates-partner.png)
</div>

## ⚙️ Server hardware

We pride ourselves on offering extensive hardware compatibility with XCP-ng. Beyond basic compatibility, we actively collaborate with our partners to validate designs and provide detailed information on specific hardware configurations. Additionally, it is possible to purchase models with XCP-ng pre-installed from our partners.

### 2CRSi

The entire Mona product line (Mainstream Compute Server) is certified to work seamlessly with XCP-ng. Selected models come with XCP-ng pre-installed, offering a ready-to-use solution tailored to your needs.

* [Mona 1.12GG](https://2crsi.com/catalog/mona-1-12-gg-57421?category=17)
* [Mona 1.14GG](https://2crsi.com/catalog/mona-1-14gg-57426?category=17#attr=1222,1217,1223,1224,1225,1221)
* [Mona 1.44GG](https://2crsi.com/catalog/mona-1-44gg-57430?category=17#attr=1259,1254,1260,1261,1262,1258)

For more details, you can read our blog post: https://vates.tech/blog/simplifying-it-2crsis-mona-servers-with-xcp-ng-onboard/

![](../../assets/img/partners/2CRSi.png)

### Ampere Computer

We have initiated a technical collaboration with Ampere Computer to extend XCP-ng capabilities to the Arm architecture. This partnership is not just a short-term endeavor but a testament to our commitment to expanding XCP-ng beyond the conventional x86 server framework.

For more details on this innovative project, please visit our blog: https://vates.tech/blog/bringing-modern-virtualization-in-the-arm-powered-datacenter/

## 🖥️ Desktop virtualization

### UDS Enterprise

UDS Enterprise is a top performance multiplatform connection broker to deploy and administer Windows and Linux virtual desktops and applications. It automatically manages its full life cycle in a safe, quick and simple way. Here are some of the biggest advantages:

* VDI: Windows & Linux virtual desktop management and deployment
* Windows & Linux application virtualization
* Automatic resource lifecycle management
* Very easy installation, administration and usability
* Multiple hypervisors, authenticators and connection protocols running simultaneously
* Open Source core: platform customization
* Unlimited flexibility and scalability
* SSL secured WAN Access & split authentication system
* User access management to IT resources in Data Center or Cloud
*  Inverse costs scaling: the more users, the more the platform cost decreases

![](../../assets/img/partners/uds-logo-xcp.png)

Learn more about UDS Enterprise [on their website](https://www.udsenterprise.com/en/).

We have carefully tested UDS deployment in an XCP-ng environment and UDS Enterprise is the first solution to join the XCP-ng ecosystem with an official Seal of Approval.

## 🕸️ Network

Everything related to network specialists in XCP-ng and Xen Orchestra ecosystem.

:::tip
If you want SDN capabilities for XCP-ng, take a look at [Xen Orchestra SDN controller](https://xen-orchestra.com/docs/sdn_controller.html) documentation!
:::

### VyOS

VyOS is an open source network OS that provides flexible network features such as traffic filtering, flow analysis, HA topologies, IPsec, OpenVPN, and NAT.Routing
Key points of using VyOS:

* Basic network resources for virtual machines (DNS, DHCP, NTP);
* Wide range of VPN technologies (OpenVPN, IPSec, L2TP);
* Secure connectivity: Built-in firewall to separate virtual machines, restrict access from outside, and protect workloads;
* High availability features provide active/backup redundancy for routers to avoid disruption of critical operations;
* No limits or requirements for license purchases.

![](../../assets/img/partners/vyospartner.png)

VyOS is now fully compatible with XCP-ng and comes with paravirtual drivers dedicated included in the image for best performances.


:::tip
More to come soon on this side!
:::

## 💽 Storage

In order to build the best platform with multiple storage options, we are also working with companies being expert in storage solutions.

:::tip
We are integrating storage solution available directly from Xen Orchestra (XOSTOR). Don't forget to take a look at [XO website](https://xen-orchestra.com) to learn more!
:::

### LINBIT

LINBIT is a software clustering company specialized in data replication – including persistent block storage. The heart of LINBIT’s open-source technology is DRBD®. DRBD allows block storage between  servers to be replicated asynchronously or synchronously without sacrificing performance or reliability. LINBIT has led the way in High Availability since 2001 and developed the solution LINSTOR.

![](../../assets/img/partners/linbit.png)

With this alliance, we are aiming to offer DRBD support inside the XCP-ng hypervisor and provide a way to access the solution developed by LI, including:

* LINBIT Software Define Storage (SDS)
* LINBIT High Availability
* LINBIT Disaster Recovery

Making XCP-ng compatible with LINBIT's solutions will allow us to provide new solutions for users that are looking  for performance and reliability with DRBD in their infrastructure.

There is still a lot of work to do in order to package DRBD in the XCP-ng kernel, make LINBIT's solutions compatible with XCP-ng, and finally provide an easy way to stay up-to-date.

We will work on all these goals in collaboration with LINBIT's teams this year and you will be informed through a series of blog posts regarding our progress.

The ecosystem around XCP-ng is getting bigger and bigger and we are really proud to associate our effort to provide the best Open Source virtualization platform with another leading Open Source project like LINBIT.

![](../../assets/img/partners/linbitteam.jpg)

## 💾 VM backup

**The main backup solution for XCP-ng is Xen Orchestra, see the dedicated [backup](../management/backup.md) section.**

### Xen Orchestra

* Website: [https://vates.tech](https://vates.tech/xen-orchestra/)
* Documentation: ✅ [Available here](https://xen-orchestra.com/docs/)
* Agentless: ✅
* Open Source: ✅

![](../../assets/img/xobadge.png)

If you seek for alternatives, here is some 3rd party backup solutions that are officially compatible with XCP-ng.

### Commvault

Commvault is fully compatible with the XCP-ng API, enabling comprehensive backup capabilities from all Commvault features.

* Website: [https://www.commvault.com](https://www.commvault.com)
* Documentation: ✅ [Available here](https://documentation.commvault.com/)
* Agentless: ✅
* Open Source: ❌

![](../../assets/img/partners/commvault.png)

### VEEAM

You can use VEEAM to deal with "application-aware" backup, by running the VEEAM agent inside your VMs. This is perfectly fine to use VEEAM with an agent in the VMs while using Xen Orchestra for the VM backup itself.

* Website: [https://www.veeam.com](https://www.veeam.com/)
* Documentation: ✅ [Available here](https://www.veeam.com/documentation-guides-datasheets.html)
* Agentless: ❌ (not yet)
* Open Source: ❌

:::note
We are currently pushing VEEAM to provide a tighter integration with XCP-ng. If you want to accelerate it, please tell them on [this dedicated VEEAM forum thread](https://forums.veeam.com/veeam-backup-replication-f2/xcp-ng-support-t93030.html). More popular demand will make it happen sooner.
:::

![](../../assets/img/partners/veeamlogo.png)

### Storware Backup and Recovery

It's agentless but closed source. However, it supports a large variety of virtualization platforms, including [XCP-ng](https://storware.eu/storware-and-xcp-ng-technology-alliance/)!

* Website: [https://storware.eu](https://storware.eu/solutions/virtual-machine-backup-and-recovery/xcp-ng-backup-and-recovery/)
* Documentation: ✅ [Available here](https://storware.gitbook.io/backup-and-recovery)
* Agentless: ✅
* Open Source: ❌

![](../../assets/img/partners/storware_xcpng_www.jpg)

### Vinchin Backup & Recovery

Another solution, which isn't agentless (you need to deploy some code in each host). XCP-ng is supported.

* Website: [https://www.vinchin.com](https://www.vinchin.com)
* Documentation: ✅ [Available here](https://www.vinchin.com/en/res/pdf/Vinchin_Product_Manual_2020.pdf)
* Agentless: ❌
* Open Source: ❌

![](../../assets/img/partners/vinchin-logo-1.png)

## 💻 Edge Computing

Edge Computing is, in short, bringing compute power outside the datacenter. And the combo XCP-ng/Xen Orchestra is great for that! Take a look on our intro on "[What's Edge Computing](https://xcp-ng.org/blog/2020/07/31/edge-case-0/)".

Here is a list of hardware XCP-ng team tested and validated directly!

### Protectli

The **Protectli Vault** helps thousands of network professionals and self-professed geeks like us to keep our networks safe. It runs on advanced firmware. [Read more here](https://protectli.com).

![](../../assets/img/partners/logoprtectli.jpg)

#### Protectli Vault – 6 Port

XCP-ng is validated on this appliance: it just works out of the box. Completely fanless, idle at less than 10W, and enough firepower for almost all compute tasks.

![](../../assets/img/partners/protectli.png)

### HPE Edgeline

![](../../assets/img/partners/hpelogo.png)

HPE is selling a [complete range](https://buy.hpe.com/us/en/servers/edgeline-systems/edgeline-systems/edgeline-converged-edge-systems/hpe-edgeline-el4000-converged-edge-system/p/1008670180) of systems built directly for Edge Computing, called **EdgeLine**.

#### HPE EdgeLine EL300

We validated the **EL300** on XCP-ng, thanks to HPE letting us test the hardware.

![](../../assets/img/partners/hpe_el300.jpg)

You can read more on our tests inside the blog post [Edge Case #1 - HPE Edgeline server](https://xcp-ng.org/blog/2020/08/31/edge-case-1-xcp-ng/).


## 🏢 Hosting

Everything related to host XCP-ng at various providers.

You can decide to host XCP-ng "outside" your wall for various reasons:

* Get rid of your own hardware
* Disaster recovery
* Hybrid solution (both on-prem and hosted)

:::tip
In any case, you can [contact us to discuss](https://vates.tech/contact/) the best option regarding your private cloud needs.
:::

### IONOS

As an official partner, IONOS can give you everything you need to host your XCP-ng private cloud. See https://vates.tech/blog/vates-and-ionos-partnership/ for more details.

https://www.ionos.com/

### Equinix Metal

Vates is an Equinix Metal partner, so if you need any assistance to run your XCP-ng on their machine, just let us know!

https://deploy.equinix.com

### OVH

OVH supports XenServer, so you can decide to deploy a host on XenServer, then to upgrade to XCP-ng.

https://www.ovh.com/world/dedicated-servers

### Scaleway

Their hosts can be used with XCP-ng, via their IPMI to use any ISO to install XCP-ng. Tested and working.

https://www.scaleway.com/en/dedibox

### Hetzner

Same as Scaleway, however their IPMI are a bit "weird". You can ask support to plug a USB key for OS install and use the IPMI to continue the installation.

https://www.hetzner.com

## 🫵 Join the XCP-ng ecosystem

Do you have a solution or product and you want to join the XCP-ng ecosystem? [Contact us!](https://vates.tech/contact)
