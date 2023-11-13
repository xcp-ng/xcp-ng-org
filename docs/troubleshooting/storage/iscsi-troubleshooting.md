# iSCSI Troubleshooting

This page is dedicated to common issues you might have with iSCSI.

## 🎓 Basic iSCSI commands

Discover available targets from a discovery portal:
```sh
iscsiadm -m discovery -t sendtargets -p <IP_address>
```

Log into a specific target:
```sh
iscsiadm -m node -T targetname -p <IP_address> -l
```

Log into all targets:
```sh
iscsiadm -m node -l
```

Display a list of all current sessions logged in:
```sh
iscsiadm -m session
```

## 💓 iSCSI in storage-cluster environment

This apply to setup using DRBD/Corosync/Pacemaker.

#### iSCSI reconnect after reboot fails permanently ( Unsupported SCSI Opcode )

The problem is that in a storage-cluster environment every time the node changes or pacemaker start /stop /restart iSCSI resources the "iSCSI SN" for a lun are new generated and differs from that before.
Xen uses the "iSCSI SN" as an identifier, so you have to ensure that "iSCSI SN" is the same on all cluster nodes.
You can read more about it [here](https://smcleod.net/tech/2015/12/14/iscsi-scsiid-persistence.html).

* error message xen orchestra

```
SR_BACKEND_FAILURE_47(, The SR is not available [opterr=Error reporting error, unknown key Device not appeared yet], )

```

* possible and misleading error message on storage servers

```
kernel: [11219.445255] rx_data returned 0, expecting 48.
kernel: [11219.446656] iSCSI Login negotiation failed.
kernel: [11219.642772] iSCSI/iqn.2018-12.com.example.server:33init: Unsupported SCSI Opcode 0xa3, sending CHECK_CONDITION.

```

### Solution

The trick is to extend the Lio iSCSI lun configuration in pacemaker with a hard coded iscsi_sn (scsi_sn=d27dab3f-c8bf-4385-8f7e-a4772673939d) and `lio_iblock`, so that every node uses the same.

* while pacemaker iscsi resource is running you can get the actual iSCSI_SN:
`cat /sys/kernel/config/target/core/iblock_0/lun_name/wwn/vpd_unit_serial`

* extend your pacemaker iSCSI configuration with a `scsi_sn` and the matching `lio_iblock`

```
primitive p_iscsi_lun_1 iSCSILogicalUnit \
        params target_iqn="iqn.2019-01.com.example.server:example" implementation=lio-t lun=0 path="/dev/drbd0" \
        scsi_sn=d27dab3f-c8bf-4385-8f7e-a4772673939d lio_iblock=0 \
        op start timeout=20 interval=0 \
        op stop timeout=20 interval=0 \
        op monitor interval=20 timout=40

```