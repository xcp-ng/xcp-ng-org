---
title: 'ZFS SR not imported after reboot'
---

# ZFS SR not imported after reboot

After a host reboot, a ZFS-backed SR can come back as unavailable — `xe pbd-list`
shows `currently-attached: false` for it — even though the underlying zpool
itself is completely healthy. `zpool import` (run manually) reports it as
`ONLINE` with no errors, and other ZFS SRs on the same host may have imported
just fine. Because nothing retries or logs an error for the pool that was
skipped, this is easy to miss until someone notices the missing capacity.

## Root cause

By default, XCP-ng only enables `zfs-import-cache.service`
(`zpool import -c /etc/zfs/zpool.cache -aN`), not `zfs-import-scan.service`.
The cache-based import only imports pools that are actually listed in
`/etc/zfs/zpool.cache`. If a pool's entry ever drops out of that cache — for
example, it was `zpool export`ed at some point (manually, during
troubleshooting, or around a disk being reseated) and never re-imported before
the next reboot — the cache-based import silently skips it. Exit status is
still success, since the pools it *does* know about imported fine; there's no
per-pool warning for the one it doesn't know about.

## Diagnosis

```
# Is the pool physically present and importable, even though it's not imported?
zpool import

# What does the on-disk cache used at boot actually contain?
zdb -C

# Cross-check against XAPI:
xe pbd-list sr-uuid=<SR_UUID> params=currently-attached,device-config
```

If `zpool import` lists a pool as `ONLINE` but it's absent from `zdb -C`'s
output, it will not be imported on the next boot either, even though the
disks and pool are fine.

## Fix

Recover the pool now — this only reattaches the existing pool, no data is
touched:

```
zpool import <pool-name>
xe pbd-plug uuid=<PBD_UUID>
```

Importing a pool this way also re-adds it to `/etc/zfs/zpool.cache`
automatically, so it will be picked up by the cache-based import at the next
boot too, as things stand.

To stop this from silently recurring after any future export/detach, also
enable the device-scan fallback alongside the cache-based import — it finds
pools by probing disks for ZFS labels directly, instead of relying solely on
the cache file:

```
systemctl enable zfs-import-scan.service
```

The two services don't conflict: `zfs-import-scan.service` depends on
`systemd-udev-settle.service`, and `zpool import` is idempotent, so the scan
pass is a no-op for pools the cache-based import already found, and a safety
net for anything it missed.
