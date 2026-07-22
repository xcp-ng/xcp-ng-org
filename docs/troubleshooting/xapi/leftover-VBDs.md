---
title: 'Leftover VBDs'
---

A regression in `VM.revert` was introduced in `xapi-26.1.4-3.3` and fixed in `xapi-26.1.11-1.3`. The bug left VBDs attached to the VM when they are not present in the reverted-to snapshot (instead of destroying such VBDs, as done before the issue was introduced and after the fix).

Thus, VMs that were reverted to their snapshots between `xapi-26.1.4-3.3` and `xapi-26.1.11-1.3` may have such "leftover" VBDs. A helper script can be used to detect possible cases in XCP-ng pools. Sadly, there is no way to automatically distinguish a VBD that was created after a `VM.revert` from a VBD that (wrongly) survived the `VM.revert`, so this script relies on the user to determine if the suspicious VBDs are indeed affected or not.

Running the [detector script](https://github.com/xcp-ng/xcp/blob/master/scripts/xapi_leaked_vbds.py) will produce a list of possibly-affected VBDs (if there is no output, this means no affected VBDs were found), for example:

```
# ./xapi_leaked_vbds.py
VM e2678368-596d-1b6e-7211-9ee45f60dec1 ("Alpine") has
VBDs that are not present in the snapshot it was reverted to
(303ead66-9515-b1c8-0dc5-d33b7644b161 "Alpine_snapshot1"):
xvdb (ca8610d2-76e3-6c54-4378-ee599619b4bb))
```

It's up to the user to deal with such VBDs (after determining if they were indeed affected) by, for example, detaching them from the VM.

The script follows this algorithm:

1. Find all VMs that are children of snapshots (i.e. were reverted to a particular snapshot at some point in time)
2. Find VBDs that are currently present in such VMs but are not present in the snapshot
