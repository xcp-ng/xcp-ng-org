# Networking

XCP-ng is using OpenVswitch as its core, and supports various features from it.

:::tip
If one NIC can be enough for your host, having a dedicated NIC for storage will be really important to get consistent performances (if you use shared storage (iSCSI or NFS).
:::

## Concepts

Networks, PIF, VIF…

:::tip
This section is still under construction
:::

## VLANs

## Bonds

## SDN controller

### GRE/VxLAN tunnels

### OpenFlow rules

## Static routes

Sometimes you need to add extra routes to an XCP-ng host. It can be done manually with an `ip route add 10.88.0.0/14 via 10.88.113.193` (for example). But it won't persist after a reboot.

To properly create persistent static routes, first create your xen network interface as usual. If you already have this network created previously, just get its UUID with an `xe network-list`. You're looking for the interface you have a management IP on typically, something like `xapi0` or `xapi1` for example. If you're not sure which one it is, you can run `ifconfig` and find the interface name that has the IP address this static route traffic will be exiting. Then get that interfaces UUID using the previous `xe network-list` command.

Now insert the UUID in the below example command. Also change the IPs to what you need, using the following format: `<network>/<netmask>/gateway IP>`. For example, our previous `ip route add 10.88.0.0/14 via 10.88.113.193` will be translated into:

```
xe network-param-set uuid=<network UUID> other-config:static-routes=10.88.0.0/14/10.88.113.193
```

**Note:** You **must** restart the toolstack on the host for the new route to be added!

You can check the result with a `route -n` afterwards to see if the route is now present.

### Removing static routes

To **remove** static routes you have added, stick the same network UUID from before in the below command:
```
xe network-param-remove uuid=<network UUID> param-key=static-routes param-name=other-config
```
A toolstack restart is needed as before. Note: XAPI might not remove the already-installed route until the host is rebooted. If you need to remove it ASAP,  you can use `ip route del 10.88.0.0/14 via 10.88.113.193`. Check that it's gone with `route -n`.

## Full mesh network

This page describes how to configure a three node meshed network ([see Wikipedia](https://en.wikipedia.org/wiki/Mesh_networking)) which is a very cheap approach to create a 3 node HA cluster, that can be used to host CEPH cluster, or similar clustered solutions that require 3 nodes in order to operate in fully HA mode.

Meshed network requires no physical network switches, the 3 physical nodes are interlinked with each other using multiple network interfaces.

Example with 3 nodes that each has 3 NIC, 1 is for WAN connection and 2 are used to interlink with remaining 2 nodes:

![Meshed network example](https://petr.insw.cz/mesh.png)

:::warning
Right now only known-to-work option is to use bridge network backend, but hopefuly in future it should be possible to setup meshed network using Open vSwitch as well (should you know how, please update this wiki)
:::

### Using bridge backend

:::warning
These steps will require reboot of all 3 nodes multiple times. They will also require you to use bridge network backend instead of open vswitch, which will result in loss of some functionality and is not commercially supported
:::

#### Switch to bridge mode on all nodes

SSH to dom0
```
# on dom0 on each hypervisor as root user
xe-switch-network-backend bridge
# reboot the hypervisor
reboot
```

#### Create a bond on all nodes

In XCP-ng Center go to NICs tab and create a bond, selecting eth1 and eth2 as bond devices, leave all options as default

#### Reconfigure the bond device to broadcast mode

Again, ssh to dom0 on all nodes and execute
```
xe pif-list
# Example output
uuid ( RO)                  : f1580a37-6726-6479-d399-635e2cb719b6
                device ( RO): eth2
    currently-attached ( RO): false
                  VLAN ( RO): -1
          network-uuid ( RO): b33187c0-b231-0c69-6ee9-3ad2dcefa6f8


uuid ( RO)                  : 63abf866-890d-79bb-d276-8a50e8e4a94b
                device ( RO): eth0
    currently-attached ( RO): true
                  VLAN ( RO): -1
          network-uuid ( RO): 7404e9f7-7dfe-b666-d6f2-1fe9886498cd


uuid ( RO)                  : 77826c83-4b60-8137-c00f-3027d89b86b2
                device ( RO): eth1
    currently-attached ( RO): false
                  VLAN ( RO): -1
          network-uuid ( RO): ae9847e4-5587-2e61-4870-365143837aba


uuid ( RO)                  : 65380308-0c53-3d96-f564-06a724a792be
                device ( RO): bond0
    currently-attached ( RO): true
                  VLAN ( RO): -1
          network-uuid ( RO): b7e4d20b-64ed-bf38-c56f-4d740b579005

# Replace the UUID with the bond ID and execute following command
xe pif-param-set uuid=65380308-0c53-3d96-f564-06a724a792be other-config:bond-mode=broadcast
reboot
```

#### Configure the interface in XCP-ng center

Go to tab Networking, rename bond1+2 device to something more memorable such as "MeshLAN", then add IP to all dom0 VMs to test it out, click "Configure" in IP configuration, add IP address and insert following addresses (you can use different addresses and range if you prefer to):

On each node respectively
* 192.168.10.1
* 192.168.10.2
* 192.168.10.3

Netmask: 255.255.255.0
Gateway: leave empty

Now SSH to each dom0 and try if you can ping all 3 IP addresses. If you can, you successfuly created a meshed network. This network is going to provide interconnection between all 3 nodes and even if some node die, connectivity between remaining 2 nodes will remain operational.

This setup will save you costs of 2 network switches you would otherwise have to purchase and use instead to achieve HA connectivity.

#### References

* Forum post: [https://xcp-ng.org/forum/topic/1897/mesh-network](https://xcp-ng.org/forum/topic/1897/mesh-network)
* Proxmox wiki: [https://pve.proxmox.com/wiki/Full_Mesh_Network_for_Ceph_Server](https://pve.proxmox.com/wiki/Full_Mesh_Network_for_Ceph_Server)
