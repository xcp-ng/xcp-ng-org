# What XCP-ng is made of

What's inside XCP-ng?

XCP-ng is a collection of components, that put together create a complete turnkey virtualization solution that you can install to bare-metal servers. Those components are packaged in the [RPM](http://rpm.org) format.

As usual in the Free Software world, we stand *on the shoulders of giants*:
* **CentOS**: many RPM packages come from the [CentOS](https://www.centos.org/) Linux distribution, which in turn is based on Red Hat's [RHEL](https://en.wikipedia.org/wiki/Red_Hat_Enterprise_Linux), mostly based itself on the work of the [Fedora](https://getfedora.org/) project, all based on the work of all the developers who wrote the [FLOSS](https://en.wikipedia.org/wiki/Free/Libre_Open_Source_Software) software that is packaged in those Linux distributions. Examples: glibc, GNU coreutils, crontabs, iptables and many others. However, the list keeps shrinking while we rebuild, patch or update sensitive components directly in XCP-ng repositories.
* **EPEL**: a few packages come from [EPEL](https://fedoraproject.org/wiki/EPEL).
* **XenServer**: most packages that make XCP-ng what it is have been rebuilt from source RPMs released by the [XenServer](https://xenserver.org/) project, with or without modifications. This includes xen, a patched Linux kernel, the Xen API, and many others. This also includes redistributable drivers or tools from third party vendors.
* **XCP-ng**: the remaining packages are additions (or replacements of closed-source components) to the original XenServer distribution.