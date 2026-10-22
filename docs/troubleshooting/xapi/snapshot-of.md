---
title: 'VDI.snapshot_of issues'
---

A rare race condition during VM.revert could inadvertently corrupt the `snapshot_of` field of other VDI objects. XAPI received a fix for this issue in the version `xapi-26.1.21-1.1`, but the fallout from previously corrupted database entries can lead to issues, since some API users can then interpret the non-snapshot VDI as if it was a snapshot VDI. A [helper script](https://github.com/xcp-ng/xcp/blob/master/scripts/snapshot-fixer.py) is provided to fix xapi databases with incongruent snapshot metadata.

:::note
The script requires XCP-ng 8.3 or later. It refuses to run on earlier versions because they do not produce correct results. There is no equivalent for XCP-ng 8.2, which has reached end of life. Upgrade to a supported release to use this script.
:::

:::danger
The script temporarily disables HA and stops xapi to apply the changes to the database. This means that the pool is not running operations like handling backups, migrating, starting or stopping VMs, and HA is disabled during the operation. To check for issues in the pool without stopping xapi and rewriting the database, the `dry-run` option can be used:

<Terminal title="console">{`
./snapshot-fixer.py dry-run
INFO:root:Regenerating database...
INFO:root:The VDI 38dd4f0e-6d0e-46e1-bb1a-980ec3d3efd2 has OpaqueRef:3664c45a-2943-52b6-529b-693e8275130b as its "snapshot_of" value, changing to null.
`}</Terminal>

:::

The script needs to be run on the master host of the affected pool:

<Terminal title="./snapshot-fixer.py rewrite">{`
./snapshot-fixer.py rewrite
INFO:root:Check HA...
INFO:root:Shutting down xapi...
INFO:root:Regenerating database...
INFO:root:The VDI 38dd4f0e-6d0e-46e1-bb1a-980ec3d3efd2 has OpaqueRef:3664c45a-2943-52b6-529b-693e8275130b as its "snapshot_of" value, changing to null.
INFO:root:Writing database to /var/lib/xcp/state.db
INFO:root:Starting up xapi...
`}</Terminal>

In the unlikely case the script corrupts the database, the script provides the `restore-backup` option to restore the database from the backup (which is automatically generated on every script invocation).
