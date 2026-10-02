---
title: 'ZFS SR not imported after reboot'
---

# ZFS SR not imported after reboot

After a host reboot, a ZFS SR may come back as unavailable, even though the
underlying zpool is completely healthy: `xe pbd-list` shows
`currently-attached: false`.

Manually running `zpool import` shows the pool as `ONLINE` with no errors,
and other ZFS SRs on the same host may have imported just fine. As there is
no retry, and no errors are logged for the pool that was skipped, the
missing SR capacity can easily go unnoticed.

## Root cause

By default, XCP-ng enables `zfs-import-cache.service`, which runs
`zpool import -c /etc/zfs/zpool.cache -aN`, therefore only importing pools
listed in the cache, but not `zfs-import-scan.service`, which would skip the
cache and scan for existing pools.

If a pool's entry is missing from `/etc/zfs/zpool.cache` at boot time, for
whatever reason, the cache-based import silently skips it: the exit status
is still a success, since the pools it *does* know about imported properly;
there's no per-pool warning for the one it doesn't. In the case this page is
based on, the pool had been up and healthy for an extended period (weeks to
months) before a later reboot came back without it, with no `zpool export`,
PBD unplug, or other obvious action preceding it. **Exactly why the pool's
entry went missing from the cache is unconfirmed.** This page covers how to
recognize the symptom, recover the pool, and prevent it from mattering again,
not why the cache entry disappears in the first place.

## Diagnosis

```
# Is the pool physically present and importable, even though it's not imported?
zpool import

# What does the on-disk cache used at boot actually contain?
zdb -C

# Cross-check against XAPI:
xe pbd-list sr-uuid=<SR_UUID> params=currently-attached,device-config
```

If `zpool import` lists a pool as `ONLINE` but that pool is absent from
`zdb -C`'s output, the pool will not be imported on the next boot either,
even though the disks and pool are fine.

## Fix

### Reattach the pool now

Run the following to recover the pool; it only reattaches the existing pool
to XAPI, no data is touched:

```
zpool import <pool-name>
xe pbd-plug uuid=<PBD_UUID>
```

Importing the pool this way also automatically adds it back to
`/etc/zfs/zpool.cache`, so it will be picked up by the cache-based import on
the next boot.

### Prevent it from recurring for any pool

Since the trigger isn't confirmed, don't rely on avoiding it. Instead,
enable the device-scan fallback alongside the cache-based import, so a
missing cache entry stops mattering regardless of cause. It finds pools by
probing disks directly for ZFS labels, rather than relying solely on the
cache file:

```
systemctl enable zfs-import-scan.service
```

The two services don't conflict. `zfs-import-scan.service` depends on
`systemd-udev-settle.service`, and `zpool import` is idempotent, so the scan
simply skips pools that were already imported by the cache-based service. It
acts as a safety net for any pools the cache-based import missed.
