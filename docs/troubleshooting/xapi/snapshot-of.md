---
title: 'VDI.snapshot_of issues'
---

Corrupted VDIs or interrupted operations can inadvertently corrupt the `snapshot_of` field of other VDI objects. This can lead to issues, since some API users can then interpret the non-snapshot VDI as if it was a snapshot VDI.

A fix for this long-standing issue is being developed for several storage backends, and a [helper script](https://github.com/xcp-ng/xcp/blob/master/scripts/snapshot-fixer.py) is provided to fix xapi databases with incongruent snapshot metadata.

:::danger
The script temporarily disables HA and stops xapi to apply the changes to the database. This means that the pool is not running operations like handling backups, migrating, starting or stopping VMs, and HA is disabled during the operation. To check for issues in the pool without stopping xapi and rewriting the database, the `dry-run` option can be used:

```
# ./snapshot-fixer.py dry-run
INFO:root:Regenerating database...
INFO:root:The VDI 38dd4f0e-6d0e-46e1-bb1a-980ec3d3efd2 has OpaqueRef:3664c45a-2943-52b6-529b-693e8275130b as its "snapshot_of" value, changing to null.
```
:::

The script needs to be run on the master host of the affected pool:
```
# ./snapshot-fixer.py rewrite
INFO:root:Check HA...
INFO:root:Shutting down xapi...
INFO:root:Regenerating database...
INFO:root:The VDI 38dd4f0e-6d0e-46e1-bb1a-980ec3d3efd2 has OpaqueRef:3664c45a-2943-52b6-529b-693e8275130b as its "snapshot_of" value, changing to null.
INFO:root:Writing database to /var/lib/xcp/state.db
INFO:root:Starting up xapi...
```

In unlikely case the script corrupts the database, the script provides the `restore-backup` option to restore the database from the backup (which is automatically generated on every script invocation).
