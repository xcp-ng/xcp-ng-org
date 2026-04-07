# VLAN Trunking in a VM

How to configure a VLAN trunk?

This document describes how to configure a VLAN trunk port for use in a VM running on XCP-ng.
The typical use case for this is you want to run your network's gateway as a VM and your network has multiple vlans.

:::note
This document is based on previous work from [@Slugger](https://xcp-ng.org/forum/user/slugger).
See the [history](https://github.com/xcp-ng/xcp-ng-org/commits/master/docs/guides/VLAN-trunking-vm.md)
or the [original version](https://github.com/xcp-ng/xcp-ng-org/blob/e829aab3dad9c487b8925cef221b65bd27014604/docs/guides/VLAN-trunking-vm.md).
:::

The guide will document how to:
- install [OPNsense](https://opnsense.org/) router on a VM
- attach the VLAN trunk port directly to it
- handle the VLANs in OPNsense directly

The configuration needs at least 2 different physical interfaces on XCP-ng.
One for the management network, and a second for traffic network.
This is because the VLAN trunk needs its interface MTU to 1504,
and XCP-ng requires MTU 1500 on the management network for Xen to operate properly.

For this scenario, we are assuming a configuration of 3 physical interfaces:
- `eth0`: management network - ethernet
- `eth1`: WAN side - ethernet
- `eth2`: LAN side - VLAN trunk

## MTU configuration

The [MTU](https://en.wikipedia.org/wiki/Maximum_transmission_unit) needs to be the same on all the switch's ports carrying 802.1Q packets.
As the VLAN header adds 4-byte overhead, a standard 1500 ethernet MTU should be configured with MTU 1504.

1. Modify the MTU setting of **the port** on the switch carrying the trunk to be 1504.
To change this setting, consult the documentation of your switch.

2. Apply the same setting on XCP-ng **PIF** for this interface.
You can achieve the same result using Xen-Orchestra, or directly on the XCP-ng host (via `xe` utility).

With Xen-Orchestra:
- Select the right *Pool*
- Go to *Network* panel
- Modify the MTU of the **Pool-wide network associated with eth2**:
    - Associated PIF is `eth2`, which is the LAN side used for VLAN trunking in your example.
    - The VLAN property is `None`: if it is `0` or another number,
      it isn't the right network and this network couldn't be used for VLAN trunking
      (802.1Q tagged packets would be dropped).
    - Finally, you can click on the MTU to modify it to `1504` (it will disconnect and reconnect the PIF on the host).
- On the *Host* configuration, check that the *eth2* network is properly reconnected,
  or do it if it isn't the case
  (it could happens if some host on the pool aren't fully up).

As an alternative to using XO,
you can see the network list using `xe network-list`,
directly on the master host:

```
# xe network-list params=uuid,name-label,MTU
uuid ( RO)          : e1012298-fdd6-595a-c81f-dae5c3a6d4f6
    name-label ( RW): Host internal management network
           MTU ( RW): 1500

uuid ( RO)          : 027fab18-e3b6-8bc9-7e9c-281b040d2897
    name-label ( RW): Pool-wide network associated with eth0
           MTU ( RW): 1500

uuid ( RO)          : ea1a8810-43ba-0f8c-499a-22442ad5ea11
    name-label ( RW): Pool-wide network associated with eth1
           MTU ( RW): 1500

uuid ( RO)          : 015bda3e-830b-d33d-ab91-098632ef61a3
    name-label ( RW): Pool-wide network associated with eth2
           MTU ( RW): 1500
```

choose the LAN network that will have the VLAN trunk,
and modify it:

```
# xe network-param-set uuid=015bda3e-830b-d33d-ab91-098632ef61a3 MTU=1504
# xe network-list params=uuid,name-label,MTU
uuid ( RO)          : e1012298-fdd6-595a-c81f-dae5c3a6d4f6
    name-label ( RW): Host internal management network
           MTU ( RW): 1500

uuid ( RO)          : 027fab18-e3b6-8bc9-7e9c-281b040d2897
    name-label ( RW): Pool-wide network associated with eth0
           MTU ( RW): 1500

uuid ( RO)          : ea1a8810-43ba-0f8c-499a-22442ad5ea11
    name-label ( RW): Pool-wide network associated with eth1
           MTU ( RW): 1500

uuid ( RO)          : 015bda3e-830b-d33d-ab91-098632ef61a3
    name-label ( RW): Pool-wide network associated with eth2
           MTU ( RW): 1504

```

You need to unplug and plug each PIF of the changed network to properly apply the setting on the underlying physical interface,
or more simply, just reboot the host.

```
# xe network-param-get uuid=015bda3e-830b-d33d-ab91-098632ef61a3 param-name=PIF-uuids 
50594040-3b64-6a1c-2dff-d607d6ac5b35; 0683c09f-f241-b66e-a98b-92e1a54a7e86
# xe pif-unplug uuid=50594040-3b64-6a1c-2dff-d607d6ac5b35
# xe pif-plug uuid=50594040-3b64-6a1c-2dff-d607d6ac5b35
# xe pif-unplug uuid=0683c09f-f241-b66e-a98b-92e1a54a7e86
# xe pif-plug uuid=0683c09f-f241-b66e-a98b-92e1a54a7e86

```

## VM interfaces

Once the MTU is properly configured, create a new VM for OPNsense with several VIFs:
- `VIF #0` - the management interface (MTU 1500)
- `VIF #1` - the WAN interface (MTU 1500)
- `VIF #2` - the LAN interface (MTU 1504): `Pool-wide network associated with eth2`

The MTU isn't configurable here and the value is taken from the underlying network.
If the MTU isn't 1504 for your trunk network,
please go back and review the configuration.

## OPNsense installation

Once you've booted OPNsense, start the manual interface assignment and configure VLANs.

The interfaces are shown as `xn0`, `xn1`, `xn2` etc...
The order is the same as the VIF ordering.

You can create a first set of VLANs on top of the third interface (`xn2`).
Next, choose the *WAN interface* (`xn1`).
For the *LAN interface*,
we recommend you select an interface that you will be able to use,
to connect to OPNsense webgui interface.
You can select other interfaces as *Optional interface*.

In the webgui interface,
configure the MTU of `xn2`.
To do that, go to menu *Interfaces → Assignments*,
and assign a new interface with the device `xn2` and the name `trunk`.
Edit the `trunk` interface, enable it, and set MTU to 1504.

:::tip
Ensure that **Disable hardware checksum offload** is checked
under the menu *Interfaces → Settings*.
It is documented in [`xnb(4)`](https://man.freebsd.org/cgi/man.cgi?query=xnb&apropos=0&sektion=4&manpath=FreeBSD+14.2-RELEASE&format=html#end) as workaround for interface driver bug.
:::
