# Development

How XCP-ng is developed.

Development in the context of the XCP-ng project means either to contribute to existing upstream projects, such as the Xen API ([XAPI](https://github.com/xapi-project/xen-api/), the [Xen project](https://xenproject.org/) and many other components of XCP-ng, or to develop new software specifically for the XCP-ng project.

## Contribution to upstream projects
Development (as in "write code") in XCP-ng project is mostly made of contributions to upstream projects such as <https://github.com/xapi-project/>, <https://wiki.xenproject.org/wiki/Submitting_Xen_Project_Patches> or <https://github.com/xenserver/>.

For some pieces of upstream software, we have GitHub "forks" at <https://github.com/xcp-ng>. For others we contribute directly without a GitHub fork and apply the patches directly on the RPMs at <https://github.com/xcp-ng-rpms/>.

## Components we **are** the upstream for
Components for which we are the main developers.

Our policy is to upstream everything if possible. However, there are some exceptions:
* Components that have no "upstream" open source equivalent. `xcp-emu-manager` (<https://github.com/xcp-ng/xcp-emu-manager>) is such a component that we had to write from scratch because the corresponding component in XenServer, `emu-manager`, is closed-source.
* Bits specific to the act of building XCP-ng (various scripts, branding stuff...). The main example is <https://github.com/xcp-ng/xcp>.

## How to help at development
It all depends on your skills and areas of interest so it's hard to tell specifically in advance. It usually starts with a feature that you want, or a bug that is annoying you. Alternatively, having a look at the open GitHub issues and picking one (<https://github.com/xcp-ng/xcp/issues>) can be a way to get started. Even if you don't know where to start, just come and talk with us (see [Where discussion happens](#where-discussion-happens) above).
