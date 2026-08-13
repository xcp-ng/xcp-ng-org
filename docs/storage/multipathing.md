---
sidebar_position: 3
---

# Multipathing

How to properly setup a new SR with multipathing on Xen Orchestra and XCP-ng.

Multipathing uses several independent network or SAN paths between each host and the storage unit. It is the recommended setup for iSCSI and Fibre Channel SRs: a path failure (NIC, cable, switch, controller) doesn't interrupt storage traffic, and total throughput can be higher.

What requires care is *when* you enable it, not whether you should:

:::warning
Do not attempt to enable multipathing on a production pool with existing and active iSCSI and/or HBA and/or FC SRs: the device topology changes when multipathing takes over, which must not happen under active I/O. Enable it **before** creating these SRs.

You can activate it on the "fly", per XCP-ng host (Advanced tab), but it is recommended to do so with XCP-ng hosts that have no VMs running.
:::

## :globe_with_meridians: iSCSI {#iscsi}

### Requirements
* Two different network interfaces.
* Two different switches.
* Multiple targets per LUN on your storage unit.
* iSCSI target ports are operating in portal mode.

:::info
Keep the default MTU (1500) on your storage networks. Non-standard MTUs are a frequent source of hard-to-diagnose storage issues, for little to no gain on modern networks: see [MTUs](../networking/networking.md#mtus).
:::

:::warning
1. We recommend that you do not use bonded network interfaces on the XCP-ng host and on the storage unit for iSCSI interfaces.
2. We recommend that you do not configure network routes on iSCSI interfaces.

This could have an impact on expected performance.
:::


### Target architecture

#### Configuration example
| Path | Vlan | Subnet | XCP-ng Host PIF address | Storage Controller 1 address | Storage Controller 2 address |
| :---: | :---: | :---: | :---: | :---: | :---: |
| :large_blue_circle: | 421 | 10.42.1.0/24 | 10.42.1.11 | 10.42.1.101 | 10.42.1.102 |
| :green_circle: | 422 | 10.42.2.0/24 | 10.42.2.11 | 10.42.2.101 | 10.42.2.102 |

#### Target architecture diagram

<Schema label="iSCSI multipathing · two independent paths from host to storage" legend={[["#4a90e2", "path A · VLAN 421"], ["#56c288", "path B · VLAN 422"]]} maxWidth="560px">
<svg viewBox="0 0 560 445" role="img" aria-label="An XCP-ng host with two NICs on top; each NIC goes through its own switch and VLAN; each switch reaches one port on each of the two storage controllers; the LUN sits below both controllers">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="160" y="16" width="240" height="104" rx="8"/>
    <rect x="60" y="180" width="180" height="52" rx="8"/>
    <rect x="320" y="180" width="180" height="52" rx="8"/>
    <rect x="50" y="290" width="460" height="140" rx="8"/>
  </g>
  <text x="280" y="40" fontSize="14" fill="#c6d2e1" textAnchor="middle">XCP-ng host</text>
  <rect x="175" y="52" width="100" height="44" rx="5" fill="rgba(74,144,226,0.14)" stroke="#4a90e2" strokeOpacity="0.85"/>
  <text x="225" y="70" fontSize="12" fill="#4a90e2" textAnchor="middle">pif1</text>
  <text x="225" y="86" fontSize="9" fill="#7a8699" textAnchor="middle">10.42.1.11/24</text>
  <rect x="285" y="52" width="100" height="44" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.85"/>
  <text x="335" y="70" fontSize="12" fill="#56c288" textAnchor="middle">pif2</text>
  <text x="335" y="86" fontSize="9" fill="#7a8699" textAnchor="middle">10.42.2.11/24</text>
  <text x="150" y="210" fontSize="13" fill="#c6d2e1" textAnchor="middle">Switch 1</text>
  <text x="150" y="226" fontSize="11" fill="#4a90e2" textAnchor="middle">VLAN 421 · 10.42.1.0/24</text>
  <text x="410" y="210" fontSize="13" fill="#c6d2e1" textAnchor="middle">Switch 2</text>
  <text x="410" y="226" fontSize="11" fill="#56c288" textAnchor="middle">VLAN 422 · 10.42.2.0/24</text>
  <text x="66" y="420" fontSize="13" fill="#c6d2e1">Storage unit</text>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="70" y="326" width="200" height="56" rx="6"/>
    <rect x="290" y="326" width="200" height="56" rx="6"/>
  </g>
  <circle cx="120" cy="326" r="7" fill="rgba(74,144,226,0.25)" stroke="#4a90e2"/>
  <circle cx="220" cy="326" r="7" fill="rgba(86,194,136,0.25)" stroke="#56c288"/>
  <circle cx="340" cy="326" r="7" fill="rgba(74,144,226,0.25)" stroke="#4a90e2"/>
  <circle cx="440" cy="326" r="7" fill="rgba(86,194,136,0.25)" stroke="#56c288"/>
  <g fontSize="9.5" fill="#7a8699" textAnchor="middle">
    <text x="120" y="348">.1.101</text>
    <text x="220" y="348">.2.101</text>
    <text x="340" y="348">.1.102</text>
    <text x="440" y="348">.2.102</text>
  </g>
  <text x="170" y="372" fontSize="12" fill="#c6d2e1" textAnchor="middle">Controller 1</text>
  <text x="390" y="372" fontSize="12" fill="#c6d2e1" textAnchor="middle">Controller 2</text>
  <rect x="230" y="394" width="100" height="28" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)"/>
  <text x="280" y="412" fontSize="12" fill="#c6d2e1" textAnchor="middle">LUN</text>
  <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.4">
    <line x1="170" y1="382" x2="230" y2="397"/>
    <line x1="390" y1="382" x2="330" y2="397"/>
  </g>
  <g stroke="#4a90e2" strokeWidth="1.6" fill="none">
    <path d="M225 96 C 225 130, 170 145, 152 178"/>
    <path d="M150 232 C 150 265, 130 290, 120 319"/>
    <path d="M150 232 C 160 270, 300 280, 338 319"/>
  </g>
  <g stroke="#56c288" strokeWidth="1.6" fill="none">
    <path d="M335 96 C 335 130, 390 145, 408 178"/>
    <path d="M410 232 C 410 265, 430 290, 440 319"/>
    <path d="M410 232 C 400 270, 260 280, 222 319"/>
  </g>
</svg>
</Schema>

### Operating procedure

#### 1. Prepare XCP-ng hosts
1. On one of the XCP-ng hosts, make sure that the `multipath.conf` configuration includes your storage equipment.

   This can be found in the file `/etc/multipath.xenserver/multipath.conf`

   :::warning
   Do not modify `/etc/multipath.xenserver/multipath.conf` directly, as any changes may be overwritten by future system updates
   :::
2. If your equipment is not present, ask the manufacturer for the multipath configuration for GNU/Linux otherwise move on to the [next step (Prepare the pool)](../../storage/multipathing/#2-prepare-the-pool).

   Add it to the file ```/etc/multipath/conf.d/custom.conf```

   For example:
   ```
   devices {

     # Configuration for ACME CORP UltraSAN
     # This is an example of syntax; do not use it in production.
     device {
        vendor  "ACME"
        product "UltraSAN"
        path_selector "service-time 0"
        path_grouping_policy group_by_prio
        prio alua
        features "1 queue_if_no_path"
        hardware_handler "1 alua"
        failback immediate
        rr_weight uniform
        rr_min_io 100
        no_path_retry 10
     }
   }
   ```

   :::info
   In this case, the configuration will be kept after updates.
   :::

3. If necessary, migrate the VMs active on the XCP-ng host in question to another one.
4. Reboot the XCP-ng host.
5. Do the same for all XCP-ng hosts in the pool (step 2. to 4.).

#### 2. Prepare the pool
Make sure that multipathing is enabled on the pool. To do this, go to the advanced configuration of the pool.

If this is not the case:
1. Make sure there are **no VMs running** on an iSCSI and/or HBA SR in the pool.
2. Activate "Enable multipathing for all XCP-ng hosts.

#### 3. Configure the SR
Proceed with the iSCSI SR configuration as indicated in the [storage documentation](../../storage/#iscsi).

## :thread: Fibre Channel (HBA) {#fibre-channel-hba}
### Requirements
* Check that the Fibre Channel cards model(s) is supported via the [HCL](../../installation/hardware/#hardware-compatibility-list-hcl).
* Two different Fibre Channel ports.
* Two different SAN switches.
* Multiple targets per LUN on your storage unit.
* Zoning performed.

:::warning
Make sure not to mix Fibre Channel speeds.
:::

### Target architecture
#### Target architecture diagram

<Schema label="Fibre Channel multipathing · two independent fabrics from host to storage" legend={[["#4a90e2", "fabric A"], ["#56c288", "fabric B"]]} maxWidth="560px">
<svg viewBox="0 0 560 420" role="img" aria-label="An XCP-ng host with two Fibre Channel ports on top; each port goes through its own SAN switch; each switch reaches one port on each of the two storage controllers; the LUN sits below both controllers">
  <g fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.28)">
    <rect x="160" y="16" width="240" height="96" rx="8"/>
    <rect x="60" y="160" width="180" height="48" rx="8"/>
    <rect x="320" y="160" width="180" height="48" rx="8"/>
    <rect x="50" y="266" width="460" height="140" rx="8"/>
  </g>
  <text x="280" y="40" fontSize="14" fill="#c6d2e1" textAnchor="middle">XCP-ng host</text>
  <text x="280" y="56" fontSize="10" fill="#7a8699" textAnchor="middle">Fibre Channel HBA</text>
  <rect x="180" y="66" width="90" height="30" rx="5" fill="rgba(74,144,226,0.14)" stroke="#4a90e2" strokeOpacity="0.85"/>
  <text x="225" y="85" fontSize="12" fill="#4a90e2" textAnchor="middle">port 1</text>
  <rect x="290" y="66" width="90" height="30" rx="5" fill="rgba(86,194,136,0.14)" stroke="#56c288" strokeOpacity="0.85"/>
  <text x="335" y="85" fontSize="12" fill="#56c288" textAnchor="middle">port 2</text>
  <text x="150" y="181" fontSize="13" fill="#c6d2e1" textAnchor="middle">SAN switch 1</text>
  <text x="150" y="198" fontSize="11" fill="#4a90e2" textAnchor="middle">fabric A</text>
  <text x="410" y="181" fontSize="13" fill="#c6d2e1" textAnchor="middle">SAN switch 2</text>
  <text x="410" y="198" fontSize="11" fill="#56c288" textAnchor="middle">fabric B</text>
  <text x="66" y="396" fontSize="13" fill="#c6d2e1">Storage unit</text>
  <g fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)">
    <rect x="70" y="302" width="200" height="56" rx="6"/>
    <rect x="290" y="302" width="200" height="56" rx="6"/>
  </g>
  <circle cx="120" cy="302" r="7" fill="rgba(74,144,226,0.25)" stroke="#4a90e2"/>
  <circle cx="220" cy="302" r="7" fill="rgba(86,194,136,0.25)" stroke="#56c288"/>
  <circle cx="340" cy="302" r="7" fill="rgba(74,144,226,0.25)" stroke="#4a90e2"/>
  <circle cx="440" cy="302" r="7" fill="rgba(86,194,136,0.25)" stroke="#56c288"/>
  <text x="170" y="344" fontSize="12" fill="#c6d2e1" textAnchor="middle">Controller 1</text>
  <text x="390" y="344" fontSize="12" fill="#c6d2e1" textAnchor="middle">Controller 2</text>
  <rect x="230" y="370" width="100" height="28" rx="12" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.28)"/>
  <text x="280" y="388" fontSize="12" fill="#c6d2e1" textAnchor="middle">LUN</text>
  <g stroke="rgba(255,255,255,0.35)" strokeWidth="1.4">
    <line x1="170" y1="358" x2="230" y2="373"/>
    <line x1="390" y1="358" x2="330" y2="373"/>
  </g>
  <g stroke="#4a90e2" strokeWidth="1.6" fill="none">
    <path d="M225 96 C 225 125, 170 130, 152 158"/>
    <path d="M150 208 C 150 240, 130 268, 120 295"/>
    <path d="M150 208 C 160 246, 300 258, 338 295"/>
  </g>
  <g stroke="#56c288" strokeWidth="1.6" fill="none">
    <path d="M335 96 C 335 125, 390 130, 408 158"/>
    <path d="M410 208 C 410 240, 430 268, 440 295"/>
    <path d="M410 208 C 400 246, 260 258, 222 295"/>
  </g>
</svg>
</Schema>
### Operating procedure

#### 1. Prepare XCP-ng hosts
1. On one of the XCP-ng hosts, make sure that the multipath.conf configuration includes your storage equipment.

   This can be found in the file `/etc/multipath.xenserver/multipath.conf`.

   :::warning
   Do not modify `/etc/multipath.xenserver/multipath.conf` directly, as any changes may be overwritten by future system updates.
   :::
2. If your equipment is not present, ask the manufacturer for the multipath configuration for GNU/Linux otherwise move on to the [next step (Prepare the pool)](../../storage/multipathing/#2-prepare-the-pool-1).

   Add it to the file ```/etc/multipath/conf.d/custom.conf```

   For example:
   ```
   devices {

     # Configuration for ACME CORP UltraSAN
     # This is an example of syntax; do not use it in production.
     device {
        vendor  "ACME"
        product "UltraSAN"
        path_selector "service-time 0"
        path_grouping_policy group_by_prio
        prio alua
        features "1 queue_if_no_path"
        hardware_handler "1 alua"
        failback immediate
        rr_weight uniform
        rr_min_io 100
        no_path_retry 10
     }
   }
   ```

   :::info
   In this case, the configuration will be kept after updates.
   :::

3. If necessary, migrate the VMs active on the XCP-ng host in question to another one.
4. Reboot the XCP-ng host.
5. Do the same for all XCP-ng hosts in the pool (step 2. to 4.).

#### 2. Prepare the pool
Make sure that multipathing is enabled on the pool. To do this, go to the advanced configuration of the pool.

If this is not the case:
1. Make sure there are **no VMs running** on an iSCSI and/or HBA SR in the pool.
2. Activate "Enable multipathing for all XCP-ng hosts.

#### 3. Configure the SR
Proceed with the HBA SR configuration as indicated in the [storage documentation](../../storage/#hba).


## :wrench: Maintenance operations {#maintenance-operations}
### Add a new XCP-ng host to an existing multipathing pool

:::warning
Do not add the new XCP-ng host to the pool without completing these steps.
:::

1. Prepare the XCP-ng host as specified in this [operating procedure for iSCSI](../../storage/multipathing/#operating-procedure) or this [operating procedure for FC](../../storage/multipathing/#operating-procedure-1).
2. Ensure that the iSCSI PIF configuration is completed if you are using iSCSI.
3. Add the new XCP-ng host to the pool.

## :health_worker: Troubleshooting {#troubleshooting}

### Verify multipathing
You can use the command ```multipath -ll``` to check if multipathing is active.

```
3600a098765432100000123456789abcd dm-3 ACME,UltraSAN
size=500G features='1 queue_if_no_path' hwhandler='1 alua' wp=rw
|-+- policy='service-time 0' prio=50 status=active
| |- 8:0:0:1  sdb  8:16   active ready running
| |- 8:0:1:1  sdd  8:48   active ready running
|-+- policy='service-time 0' prio=10 status=enabled
  |- 8:0:2:1  sdf  8:80   active ready running
  |- 8:0:3:1  sdh  8:112  active ready running
```
:::info
In this example, we have four active paths: our multipathing is working correctly.
:::

### iSCSI
#### Verify iSCSI sessions
You can use the command ```iscsiadm -m session``` to check if iSCSI session is active.

```
tcp: [1] 10.42.1.101:3260,1 iqn.2024-02.com.acme:ultrasan.lun01 (non-flash)
tcp: [2] 10.42.1.102:3260,1 iqn.2024-02.com.acme:ultrasan.lun01 (non-flash)
tcp: [3] 10.42.2.101:3260,2 iqn.2024-02.com.acme:ultrasan.lun01 (non-flash)
tcp: [4] 10.42.2.102:3260,2 iqn.2024-02.com.acme:ultrasan.lun01 (non-flash)
```
:::info
In this example, we have four iSCSI sessions with one LUN.
:::

#### iSCSI: verify MTU consistency
An MTU mismatch between the host, the switches and the storage unit causes erratic storage behavior. To check for one, connect to a XCP-ng host and ping all IP addresses involved in your iSCSI storage (target and initiator) with a full-size, non-fragmentable packet:

<Terminal shell title="iSCSI: verify MTU consistency">{`
ping -M do -s 1472 <REMOTE_IP_ADDRESS>
`}</Terminal>

(1472 is for the standard MTU of 1500: packet size minus the 28 bytes of IP and ICMP headers. If your network uses another MTU, subtract 28 from it.)

:::warning
If you get an error, usually ```ping: sendmsg: Message too long```, your MTU settings are inconsistent along the path, and you need to fix your network configuration.
:::
