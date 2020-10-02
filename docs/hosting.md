# Hosting

Everything related to host XCP-ng at various providers.

You can decide to host XCP-ng "outside" your wall for various reasons:

* Get rid of your own hardware
* Disaster recovery
* Hybrid solution (both on-prem and hosted)

## XCP-ng Cloud

The main contributor to XCP-ng, [Vates](https://vates.fr) is not just offering Pro Support for your XCP-ng hosts running on-premises: there's also hosting possibilities, on fully dedicated hardware.

See <https://xcp-ng.com/cloud/> for more details.

## Alternatives

XCP-ng Cloud is the only 100% validated hosting solution (hardware compatibility and tested with XCP-ng). However, other well known players will work with XCP-ng.

### OVH

OVH supports XenServer, so you can decide to deploy a host on XenServer, then to upgrade to XCP-ng.

<https://www.ovh.com/world/dedicated-servers/>

### Scaleway

Their hosts can be used with XCP-ng, via their IPMI to use any ISO to install XCP-ng. Tested and working.

<https://www.scaleway.com/en/dedibox/>

### Hetzner

Same as Scaleway, however their IPMI are a bit "weird". You can ask support to plug an USB key for OS install and use the IPMI to continue the installation.

<https://www.hetzner.com/>
