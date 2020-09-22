# Networking

XCP-ng is using Open vSwitch as its core, and supports various features from it.

:::tip
If one NIC can be enough for your host, having a dedicated NIC for storage will be really important to get consistent performances (if you use shared storage (iSCSI or NFS).
:::

## Concepts

This section describes the general concepts of networking in XCP-ng.

XCP-ng creates a network for each physical NIC during installation. When you add a server to a pool, the default networks **are merged**. This is meant to be sure that all physical NICs with the same device name are attached to the same network, authorizing seamless VM flexibility on any host of the pool.

Typically, you add a network to create a new external network (bridge), set up a new VLAN using an existing NIC, or create a NIC bond.

You can configure four different types of networks in XCP-ng:

* Default Networks have an association with a physical network interface. Those are also called "External networks" provide a bridge between a virtual machine and the physical network interface connected to the network. External networks enable a virtual machine to connect to resources available through the server’s physical NIC.
* Bonded networks create a bond between two or more NICs to create a single, high-performing channel between the virtual machine and the network.
* Global Private Networks extend the single server private network concept to allow VMs on different pools and/or hosts to communicate with each other by using the XOA SDN controller.

### Network objects

This section uses three types of server-side software objects to represent networking entities. These objects are:

* A PIF, which represents a physical NIC on a host. PIF objects have a name and description, a UUID, the parameters of the NIC they represent, and the network and server they are connected to.
* A VIF, which represents a virtual NIC on a virtual machine. VIF objects have a name and description, a UUID, and the network and VM they are connected to.
* A network, which is a virtual Ethernet switch on a host. Network objects have a name and description, a UUID, and the collection of VIFs and PIFs connected to them.

`xe` CLI, Xen Orchestra or XCP-ng center allow you to configure networking options. You can control the NIC used for management operations, and create advanced networking features such as VLANs and NIC bonds.
Networks

Each XCP-ng server has one or more networks, which are virtual Ethernet switches. Networks that are not associated with a PIF are considered internal. Internal networks can be used to provide connectivity only between VMs on a given XCP-ng server, with no connection to the outside world. Networks associated with a PIF are considered external. External networks provide a bridge between VIFs and the PIF connected to the network, enabling connectivity to resources available through the PIF’s NIC.

## VLANs

VLANs, as defined by the IEEE 802.1Q standard, allow a single physical network to support multiple logical networks. XCP-ng hosts support VLANs in multiple ways.

### VLANs for VMs

Switch ports configured as 802.1Q VLAN trunk ports can be used with XCP-ng VLAN features to connect guest virtual network interfaces (VIFs) to specific VLANs. In this case, XCP-ng server performs the VLAN tagging/untagging functions for the guest, which is unaware of any VLAN configuration.

XCP-ng VLANs are represented by additional PIF objects representing VLAN interfaces corresponding to a specified VLAN tag. You can connect XCP-ng networks to the PIF representing the physical NIC to see all traffic on the NIC. Alternatively, connect networks to a PIF representing a VLAN to see only the traffic with the specified VLAN tag. You can also connect a network such that it only sees the native VLAN traffic, by attaching it to VLAN 0.

To use VLANs for your network logical isolation, it's really easy. You'll create a new network with a VLAN ID, and all virtual interfaces created on this network will transparently have traffic tagged in this VLAN. No need to configure anything inside your VM.

First step, go in Xen Orchestra menu, "New" then "Network":

![](https://xcp-ng.org/assets/img/screenshots/newnetwork1.png)

Then, select a pool where you want to create this network, and fill what's required, like physical interface selection, name and description and also VLAN number:

![](https://xcp-ng.org/assets/img/screenshots/newnetwork2.png)

Finally, click on "Create network":

![](https://xcp-ng.org/assets/img/screenshots/newnetwork3.png)

That's it!

## Bonds

It's same as previous section, just check the "Bonded Network" and select multiple PIFs in the Interface selector. You can either use VLANs or not, it doesn't matter!

## Manage physical NICs

### Add a new NIC

After physically installing a new NIC, you'll need to run a `xe pif-scan` command on the host to get this NIC added as an available PIF.

## Remove a physical NIC

Before removing it, just be sure to remove its associated networks, so it won't cause trouble. Then, shutdown, remove the NIC and finally boot. After the boot, do a `xe pif-forget uuid=<OLD PIF UUID>` to get rid of the object record.

## SDN controller

An SDN controller is provided by a [Xen Orchestra](management.md#xen-orchestra) plugin. Thanks to that, you can enjoy advanced network features.

### GRE/VXLAN tunnels

Private network (using tunnels) are very handy when you want to access resources in a secure manner, that are not in the same physical network.

So we want a network that is:
- reachable by all the hosts in a pool or **even between different pools!**
- unreachable by anything outside the network
- reactive when the pool changes (new host, host ejected, `PIF` unplugged etc):

That's exactly what you can have thanks to XO SDN controller (here via GRE tunnels):

![](https://xen-orchestra.com/blog/content/images/2019/06/sdn-controller-1.png)

To create a private network, go in Xen Orchestra, New/Network and select "Private Network":

![](https://xcp-ng.org/assets/img/screenshots/sdn-controller.png)

#### Encryption

To be able to encrypt the networks, `openvswitch-ipsec` package must be installed on all the hosts:

* `yum install openvswitch-ipsec --enablerepo=xcp-ng-testing`
* `systemctl enable ipsec`
* `systemctl enable openvswitch-ipsec`
* `systemctl start ipsec`
* `systemctl start openvswitch-ipsec`

More information available on [XO official documentation for SDN controller](https://xen-orchestra.com/docs/sdn_controller.html).

### OpenFlow rules

:::tip
This feature is coming very soon!
:::

## Static routes

Sometimes you need to add extra routes to an XCP-ng host. It can be done manually with an `ip route add 10.88.0.0/14 via 10.88.113.193` (for example). But it won't persist after a reboot.

To properly create persistent static routes, first create your xen network interface as usual. If you already have this network created previously, just get its UUID with an `xe network-list`. You're looking for the interface you have a management IP on typically, something like `xapi0` or `xapi1` for example. If you're not sure which one it is, you can run `ifconfig` and find the interface name that has the IP address this static route traffic will be exiting. Then get that interfaces UUID using the previous `xe network-list` command.

Now insert the UUID in the below example command. Also change the IPs to what you need, using the following format: `<network>/<netmask>/gateway IP>`. For example, our previous `ip route add 10.88.0.0/14 via 10.88.113.193` will be translated into:

```
xe network-param-set uuid=<network UUID> other-config:static-routes=10.88.0.0/14/10.88.113.193
```

:::tip
You **must** restart the toolstack on the host for the new route to be added!
:::

You can check the result with a `route -n` afterwards to see if the route is now present.

### Removing static routes

To **remove** static routes you have added, stick the same network UUID from before in the below command:
```
xe network-param-remove uuid=<network UUID> param-key=static-routes param-name=other-config
```
A toolstack restart is needed as before.

:::tip
XAPI might not remove the already-installed route until the host is rebooted. If you need to remove it ASAP,  you can use `ip route del 10.88.0.0/14 via 10.88.113.193`. Check that it's gone with `route -n`.
:::

## Full mesh network

This page describes how to configure a three node meshed network ([see Wikipedia](https://en.wikipedia.org/wiki/Mesh_networking)) which is a very cheap approach to create a 3 node HA cluster, that can be used to host a Ceph cluster, or similar clustered solutions that require 3 nodes in order to operate with full high-availability.

Meshed network requires no physical network switches, the 3 physical nodes are interlinked with each other using multiple network interfaces.

Example with 3 nodes that each has 3 NIC, 1 is for WAN connection and 2 are used to interlink with remaining 2 nodes:

![Meshed network example](https://petr.insw.cz/mesh.png)

:::warning
Right now only known-to-work option is to use bridge network backend, but hopefully in future it should be possible to setup meshed network using Open vSwitch as well (should you know how, please update this wiki)
:::

### Using bridge backend

:::warning
These steps will require reboot of all 3 nodes multiple times. They will also require you to use bridge network backend instead of Open vSwitch, which will result in loss of some functionality and is not commercially supported
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

Now SSH to each dom0 and try if you can ping all 3 IP addresses. If you can, you successfully created a meshed network. This network is going to provide interconnection between all 3 nodes and even if some node die, connectivity between remaining 2 nodes will remain operational.

This setup will save you costs of 2 network switches you would otherwise have to purchase and use instead to achieve HA connectivity.

#### References

* Forum post: <https://xcp-ng.org/forum/topic/1897/mesh-network>
* Proxmox wiki: <https://pve.proxmox.com/wiki/Full_Mesh_Network_for_Ceph_Server>

## Network Troubleshooting

### Network corruption

Disabling TX offload might help to diagnose NIC issues:

```
xe pif-param-set uuid=<PIF UUID> other-config:ethtool-tx=off
```

### Disabling FCoE

If you are using bonds on FCoE capable devices, it's preferable to disable it entirely:

```
systemctl stop fcoe
systemctl stop xs-fcoe
systemctl disable fcoe
systemctl disable xs-fcoe
```

See <https://github.com/xcp-ng/xcp/issues/138>.

### Emergency Network Reset

Incorrect networking settings can cause loss of network connectivity. When there is no network connectivity, XCP-ng host can become inaccessible through Xen Orchestra or remote SSH. Emergency Network Reset provides a simple mechanism to recover and reset a host’s networking.

The Emergency network reset feature is available from the CLI using the `xe-reset-networking` command, and within the Network and Management Interface section of xsconsole.

Incorrect settings that cause a loss of network connectivity include renaming network interfaces, creating bonds or VLANs, or mistakes when changing the management interface. For example, typing the wrong IP address. You may also want to run this utility in the following scenarios:

:::warning
If a Pool master or host in a resource pool is unable to contact with other hosts.
:::

Use the `xe-reset-networking` utility only in an emergency because it deletes the configuration for all PIFs, bonds, VLANs, and tunnels associated with the host. Guest Networks and VIFs are preserved. As part of this utility, VMs are shut down forcefully. Before running this command, cleanly shut down the VMs where possible. Before you apply a reset, you can change the management interface and specify which IP configuration, DHCP, or Static can be used.

If the pool master requires a network reset, reset the network on the pool master first before applying a network reset on pool members. Apply the network reset on all remaining hosts in the pool to ensure that the pool’s networking configuration is homogeneous. Network homogeneity is an important factor for live migration.

:::tip
* If the pool master’s IP address (the management interface) changes as a result of a network reset or xe host-management-reconfigure, apply the network reset command to other hosts in the pool. This is to ensure that the pool members can reconnect to the Pool Master on its new IP address. In this situation, the IP address of the Pool Master must be specified.
* Network reset is NOT supported when High Availability is enabled. To reset network configuration in this scenario, you must first manually disable high availability, and then run the network reset command.
:::

#### Verifying the network reset

After you specify the configuration mode to be used after the network reset, xsconsole and the CLI display settings that will be applied after host reboot. It is a final chance to modify before applying the emergency network reset command. After restart, the new network configuration can be verified in Xen Orchestra and xsconsole. In Xen Orchestra, with the host selected, select the Networking tab to see the new network configuration. The Network and Management Interface section in xsconsole display this information.

### Intel i218/i219 slow speed

With kernel version 4.15 a fix in the e1000e driver [has been introduced](https://github.com/torvalds/linux/commit/b10effb92e272051dd1ec0d7be56bf9ca85ab927). However, this fix slightly slows down DMA access times to prevent the NIC to hang up on heavy UDP traffic. This impacts the TCP performance. A workaround to regain full transfer speeds, you can turn off TCP segmentation offloading via the following command:

```
ethtool -K <interface> tso off gso off
```

There is currently no fix available / announced that allows offloading TCP segmentation to the NIC without sacrificing performance.

:::tip
The following error message can be ignored: `Cannot get device udp-fragmentation-offload settings: Operation not supported`
:::
