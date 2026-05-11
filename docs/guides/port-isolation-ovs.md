# VM Port Isolation with Open vSwitch

How to prevent VM-to-VM traffic within a shared VLAN.

This guide covers two approaches to isolating VM network traffic on XCP-ng: restricting
which IP and MAC addresses a virtual interface is allowed to use (VIF locking mode), and
blocking lateral VM-to-VM forwarding at the [OVS](../project/architecture#ovs) bridge level
using OpenFlow rules.

:::note
This guide is based on the community discussion at
[Blocking intravlan traffic](https://xcp-ng.org/forum/topic/9417) and adapted from the
XenServer 8 administrator's guide (switch port locking, p. 332).
:::

## Use case

In shared web hosting and multi-tenant environments, multiple VMs often sit in the same
VLAN but must not be able to reach each other: only the uplink gateway and the internet
beyond it. Without explicit isolation, any VM can send packets directly to any other VM on
the same bridge, bypassing all upstream firewall rules. This is the network equivalent of
leaving every tenant's door unlocked on the same corridor.

## Approaches at a glance

| Approach | What it blocks | Persists across restarts | Complexity |
|----------|---------------|--------------------------|------------|
| [VIF locking mode](#approach-1--vif-locking-mode) | IP/MAC spoofing from a VIF | Yes (XAPI manages it) | Low |
| [OpenFlow rules](#approach-2--openflow-rules-for-intra-vlan-isolation) | All VM-to-VM forwarding on a bridge | No (wiped on toolstack restart) | Medium |

## Approach 1: VIF locking mode

XCP-ng inherits the VIF locking feature from XAPI. It lets you restrict which source IPs
and MACs a given [VIF](../project/architecture#vifs) is allowed to emit. Any packet from that
VIF using a different source address is silently dropped at the hypervisor level.

:::warning
VIF locking mode controls **source address spoofing**, not lateral forwarding. A VM that
uses its permitted IP can still reach any other VM on the same bridge. This is **not** true
port isolation. It is IP and MAC enforcement.
:::

### Find the VIF UUID

```
# List VMs to get the VM UUID
xe vm-list name-label="<vm name>" params=uuid

# List VIFs for that VM
xe vif-list vm-uuid=<vm-uuid>
```

### Enable locking and set allowed addresses

```
# Lock the VIF so only permitted addresses are forwarded
xe vif-param-set uuid=<vif-uuid> locking-mode=locked

# Allow a specific IPv4 address
xe vif-param-set uuid=<vif-uuid> ipv4-allowed=192.168.1.10

# Allow a specific IPv6 address (if applicable)
xe vif-param-set uuid=<vif-uuid> ipv6-allowed=fd00::1
```

You can permit multiple addresses by repeating the command with additional values, or
by passing a comma-separated list. To return a VIF to unrestricted mode:

```
xe vif-param-set uuid=<vif-uuid> locking-mode=unlocked
```

:::note
VIF locking mode is inherited from XenServer via XAPI. Community experience confirms it
works on XCP-ng, but the exact syntax for `ipv4-allowed` and `ipv6-allowed` should be
verified against your XCP-ng version with `xe vif-param-list uuid=<vif-uuid>` before
deploying. When in doubt, ask on the forum or ping @Team-XAPI-Network.
:::

## Approach 2: OpenFlow rules for intra-VLAN isolation

True port isolation, where no VM can reach another VM on the same bridge and only the
uplink is reachable, requires custom OpenFlow rules on the OVS bridge. The idea is
straightforward: delete the default forwarding table, then add per-port rules that allow
each VM port to send traffic only toward the uplink port, and allow the uplink port to
forward normally toward any VM port.

This approach was documented by community member Pilow in the
[original forum thread](https://xcp-ng.org/forum/topic/9417).

### Step 1: Identify the bridge and port numbers

```bash
# Show bridge topology and port names; note the actual bridge name
ovs-vsctl show

# Show the internal OpenFlow port numbers assigned to each port
# Replace <bridge> with the name shown by ovs-vsctl show
ovs-ofctl show <bridge>
```

:::note
In XCP-ng, XAPI-managed network bridges are typically named `xapi<N>` (e.g. `xapi3`,
`xapi7`), not `xenbr0`. The management bridge is `xenbr0`, but the bridge carrying your
VM traffic on a secondary network will almost certainly have a different name. Use
`ovs-vsctl show` to find the right one before running any of the commands below.
:::

The output of `ovs-ofctl show` lists each port with its OpenFlow number in parentheses,
for example `1(vif3.0)`, `2(vif4.0)`, `10(eth0)`. Note the number of your uplink port
(the physical NIC, e.g. `eth0` or `bond0`).

### Step 2: Replace the flow table

```bash
# Remove all existing flows; VMs will lose connectivity until new rules are added
ovs-ofctl del-flows <bridge>

# For each VM port, add a rule that sends traffic only to the uplink port
# Replace 1, 2, 3... with the actual VM port numbers from Step 1
# Replace 10 with the actual uplink port number
ovs-ofctl add-flow <bridge> "priority=100,in_port=1,actions=output:10"
ovs-ofctl add-flow <bridge> "priority=100,in_port=2,actions=output:10"
ovs-ofctl add-flow <bridge> "priority=100,in_port=3,actions=output:10"

# Allow forwarding from the uplink toward VMs
ovs-ofctl add-flow <bridge> "priority=100,in_port=10,actions=normal"
```

Repeat the VM-port rules for every VIF on the bridge that should be isolated.

:::warning
The ingress rule (`in_port=10,actions=normal`) may not be sufficient on its own to
correctly route return traffic to individual VMs in all configurations. Community
experience with this approach is limited. Test carefully in a non-production
environment before relying on it. If ingress behaves unexpectedly, per-port ingress
rules may be needed, which makes the setup considerably more complex.
:::

:::warning
These rules apply immediately but are **not persistent**. XAPI reprograms OVS bridges
whenever the toolstack restarts (`xe-toolstack-restart`), when VMs start or stop, or when
the host reboots. After any such event the bridge returns to its default forwarding behavior
and VMs can reach each other again.
:::

## Making OpenFlow rules persistent

### Option A: XO SDN controller plugin (recommended)

XCP-ng 8.2 and later supports persistent per-VIF OpenFlow rules through the Xen Orchestra
SDN controller plugin. This is the supported path: XAPI is aware of the rules and re-applies
them when the bridge is reprogrammed.

See the [OpenFlow Rules](../networking/networking#openflow-rules) section in the networking
guide for setup instructions. Per-VIF rules can be configured through Xen Orchestra's web UI
or via `xo-cli`.

:::note
The current traffic rules implementation has known limitations: it applies only to the
management network and reliability is inconsistent in some configurations. A new
implementation is currently in beta: persistent, VM-lifecycle aware (including live
migration), and designed to replace the manual `ovs-ofctl` approach. See the
[XAPI plugin documentation](https://docs.xen-orchestra.com/xo5/sdn_controller#xapi-plugin)
for details and to follow beta progress. Full production support is not yet available as
of May 2026.
:::

### Option B: Startup script (community workaround, unsupported)

As an alternative, you can re-apply the `ovs-ofctl` commands from a dom0 startup script
(e.g., `/etc/rc.d/rc.local` or a systemd unit). This approach has significant caveats:

- The script must run **after** XAPI has finished starting and programming the bridges,
  not just after the host boots.
- Port numbers change when VMs start or stop; the script must re-discover port numbers
  dynamically using `ovs-ofctl show` each time it runs.
- A `xe-toolstack-restart` will wipe the rules again; the script does not hook into that
  event automatically.

:::warning
Using a startup script may conflict with XAPI's OVS management in unexpected ways. Test
thoroughly in a non-production pool before relying on this approach. The supported path for
persistent OpenFlow rules is Option A.
:::

## Verification

After applying the rules, confirm they are in place and test connectivity:

```bash
# List active flows on the bridge
ovs-ofctl dump-flows xenbr0

# From VM1: this should fail (port isolation working)
ping <ip-of-vm2>

# From VM1: this should succeed (egress to gateway working)
ping <gateway-ip>
```

If `dump-flows` shows only the rules you added and the ping to the gateway succeeds while
the VM-to-VM ping fails, port isolation is working correctly.

## Comparison with XenServer switch port locking

XenServer 8 exposes switch port locking as a dedicated feature in the XenCenter GUI and
via the `xe vif-param-set locking-mode` command, with full documentation on exactly which
XAPI parameters control IP and MAC filtering. XCP-ng inherits the same XAPI layer and
exposes the same `locking-mode` parameter, but does not yet have equivalent GUI support in
Xen Orchestra for the full locking-mode workflow. The OpenFlow rules approach gives XCP-ng
users more flexibility than XenServer's GUI feature; you can express any forwarding policy,
but it requires more manual work and the persistence story is different: XenServer
manages persistence through its toolstack; on XCP-ng the supported equivalent is the
SDN controller plugin.

## See also

- [OVS architecture](../project/architecture#ovs): bridge structure, port naming, flow tables
- [OpenFlow Rules](../networking/networking#openflow-rules): SDN controller plugin setup
- [SDN controller](../networking/networking#-sdn-controller): GRE/VXLAN tunnels and XO plugin
- Forum thread: [Blocking intravlan traffic](https://xcp-ng.org/forum/topic/9417)
