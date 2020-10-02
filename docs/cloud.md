# Cloud features with XCP-ng

You have multiple possibilities:

1. Using Xen Orchestra Cloud features (ACLs, Self Service)
2. Using CloudStack or OpenStack (adapted to very large deployments)

## Xen Orchestra

Some interesting "cloud-like" features are available in Xen Orchestra : ACLs and Self-service

### ACLs

ACLs can be used to allow some XO users to only see some resources. See more about ACLs [on the official documentation](https://xen-orchestra.com/docs/acls.html).

![](https://xen-orchestra.com/docs/assets/acllist.png)

### Self-service

The self-service feature allows users to create new VMs within a **limited amount of resources** (quotas). This is different from delegating existing resources (VMs) to them, and it leads to a lot of possibilities. [Read XO official doc on it](https://xen-orchestra.com/docs/self_service.html) to know more.

![](https://xen-orchestra.com/docs/assets/selfservice_recap_quotas.png)

## CloudStack

At the outset this writeup is an outcome of this XCP-ng forum [discussion](https://xcp-ng.org/forum/topic/1109/xcp-ng-issues-with-cloudstack-4-11-2-with-iscsi-sr/10). Basically, setting up XCP-Ng using XCP-ng Center is very straightforward but to overlay Cloudstack and get them all to work in unison is the tricky part. To provide more background , consider a 2 node XCP-ng 7.6.0 pool setup with iSCSI target running on a different host with all necessary traffic segregation principles applied (guest, storage and management).

### Installation Steps (with tips and tricks)

1. Follow along the Cloudstack Management Server installation [steps](http://docs.cloudstack.apache.org/en/4.11.2.0/installguide/hypervisor/xenserver.html#system-requirements-for-xenserver-hosts).

> Tip #1: if you need iSCSI , when you login to Cloudstack Management UI avoid the "Basic setup" and choose the option "I have used CloudStack before" (the button that is less obvious) since with basic for some reasons forces you into NFS.
But don't proceed  with configuring your Cloudstack Management Server just yet.

2. If you have not setup your iSCSI storage on the XCP-ng pool . Please proceed to do it and ensure that they list in XCP-ng Center or Xen Orchestra and ensure everything looks good. So as listed in the Cloudstack Installation guide, we will be using the "Presetup" option to setup Primary ISCSI storage on Cloudstack.

3. Now SSH into the Cloudstack Management host, go to the folder (`/usr/share/cloudstack-common/scripts/vm/hypervisor/xenserver/`) . This folder contains several useful scripts which comes in handy pick the one that says `setup_heartbeat_sr.sh` and copy that over to the Xen Pool master host and ensure you have executable rights on script file .

4. Before you run the script , run the `lvscan` command which scan for presence of LVM on your pool and produce some result if you had made any undesirable edits to `/etc/lvm/lvm.conf` file this step will most likely fail. If it does , make sure you restore the `lvm.conf` to its original state.

5. Now execute the `setup_heartbeat_sr.sh` with the UUID of the iSCSI SR that you had setup in Step #2. Internally does lvcreate with a bunch of params . Which basically creates a hb-volume (heartbeat volume) for the SR.

6. After this succeeds proceed to setting up your Cloudstack Management host and your infrastructure and that point of adding your primary storage use the "Presetup" option. You'll see that it works without issues.

> Note: At the time of writing this page: Cloudstack 4.12 and XCP-Ng 7.6.0  where the latest versions of the respective software.
