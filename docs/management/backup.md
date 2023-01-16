# Backup

It's really important to backup your VMs. You have multiple options, but only Xen Orchestra is both **advanced, agentless, fully Open Source and officially supported** (tested for all XCP-ng releases).

## Xen Orchestra

A lot of different backup options are supported via Xen Orcherstra:

* Automated Snapshots
* Backup
* Forever incremental backups (delta)
* DR (backup to another XCP-ng storage repository)
* CR (delta backup to another XCP-ng storage repository)
* Metadata backup
* File level restore
* XO Proxy (backup remote sites without any VPN requirement)
* S3 compatible backup storage

![](https://xen-orchestra.com/assets/backups-solutions.png)

All options are explained in the [official documentation](https://xen-orchestra.com/docs/). Xen Orchestra is [available as a turnkey virtual appliance](https://xen-orchestra.com), called XOA which [you can deploy in a minute](https://xen-orchestra.com/#!/xoa).

Alternatively, you can install and build it yourself [from the GitHub repository](https://github.com/vatesfr/xen-orchestra/).

You can also find a video describing various backup options here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/FfUqIwT8KzI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Other solutions

There's other solutions officially compatible with XCP-ng to make VM backups. Please check our [ecosystem](../project/ecosystem.md#vm-backup) page on the backup section!