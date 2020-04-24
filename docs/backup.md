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

![](https://xen-orchestra.com/assets/backups-solutions.png)

All options are explained in the [official documentation](https://xen-orchestra.com/docs/). Xen Orchestra is [available as a turnkey virtual appliance](https://xen-orchestra.com), called XOA which [you can deploy in a minute](https://xen-orchestra.com/#!/xoa).

Alternatively, you can install and build it yourself [from the GitHub repository](https://github.com/vatesfr/xen-orchestra/).

You can also find a video describing various backup options here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/FfUqIwT8KzI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Other solutions

Here is 3rd party solutions that are officially compatible with XCP-ng.

### Storware vProtect

It's agentless but closed source. However, it supports a large variety of virtualization platforms, including [XCP-ng](https://storware.eu/storware-and-xcp-ng-technology-alliance/)!

* Website: [https://storware.eu/](https://storware.eu/)
* Documentation [is available here](https://storware.gitbook.io/storware-vprotect/)
* Agentless: yes
* Open Source: no

### VinChin backup

Another solution, which isn't agentless (you need to deploy some code in each host). XCP-ng is supported.

* Website: [https://www.vinchin.com/en/](https://www.vinchin.com/en/)
* Documentation: [available in PDF](https://www.vinchin.com/en/res/pdf/Vinchin_Product_Manual_2020.pdf)
* Agentless: no
* Open Source: no
