# CPU Masking

## Introduction

This guide explains how CPU masking works in XCP-ng and its impact on virtual machine migration, particularly in environments with mixed CPU architectures or generations. 

The goal is to help you understand why some migrations succeed while others fail, what compatibility guarantees XCP-ng provides at the pool level, and how to safely migrate your VMs during hardware upgrades. This applies whether you're moving across different CPU vendors or between generations of the same vendor.

## Definitions

CPU masking is **how XCP-ng controls which CPU features are visible to virtual machines**.

Since modern CPUs offer a wide range of features — and not all hosts in a pool support the same set — exposing unsupported features could make live migration unsafe. Without masking, a VM might end up on a host that lacks the CPU capabilities it requires, leading to crashes or unpredictable behavior.

To prevent this, XCP-ng uses Xen to present each VM with a consistent, safe set of CPU features. From the VM's perspective, the CPU appears virtualized (it may not perfectly match the host's physical CPU). Certain features are hidden (or *masked*) to ensure compatibility across all hosts in the pool.

CPU masking isn’t about performance. **It’s a safety mechanism**. Its primary role is to enable smooth migration while preventing guest crashes or unpredictable behavior.

## When CPU Masking is Applied

A CPU mask is applied when a VM starts, not while it's running. This means the VM's CPU features are locked in at boot and remain fixed throughout its uptime, even during live migration.

:::tip
Because of this, **CPU masking can't be adjusted on the fly**. Removing features from a running VM would almost certainly cause it to crash. 

Even a simple reboot won’t update the CPU features if the VM’s state is preserved. To apply any changes, you must fully shut down the VM and restart it.
:::

## Pool-level Masking

In XCP-ng, **CPU masking works at the pool level**. The pool exposes a shared set of CPU features — the lowest common denominator across all hosts.

When a new host joins the pool, its CPU features are compared against those of existing members:

- If the new host has a **newer CPU**, its extra features are masked to align with the pool level.
- If the new host has an **older CPU**, the pool level drops, and some features are masked for all hosts in the pool.

By default, VMs started in the pool automatically use the pool-level CPU feature set. This ensures that, from the moment they boot, they can migrate to any host in the pool, without no manual CPU configuration. The approach balances safety and performance while keeping pool management straightforward.

## Live Migration Behavior

Live migration checks rely on the CPU features the VM was assigned at boot. Before migration, XCP-ng confirms the destination host supports all the VM’s required features. If even one is missing, the migration is blocked.

Since the pool level adjusts dynamically, changes in pool membership directly impact migration:

- **Adding a host with fewer features** may lower the pool baseline. Running VMs keep their original feature set but might lose the ability to migrate to the new host (though they can still move to other compatible hosts).
- **Removing a host with older features** can raise the pool baseline. New VMs will benefit immediately, but existing ones must be fully shut down and restarted to adopt the updated features.

## Migrating Across CPU Vendors

Cross-vendor VM migration — such as moving from Intel to AMD — presents unique challenges. Live migration isn’t feasible in these cases, as the CPU architectures and feature sets differ fundamentally.

:::tip
For these scenarios, XCP-ng recommends warm migration [via Xen Orchestra](https://docs.xen-orchestra.com/v2v-migration-guide#-troubleshooting-migration-issues). 

This method involves a brief service interruption (usually just a few minutes) but eliminates the risks and complexity of cross-vendor live migration.

Warm migration is ideal for planned transitions where minimal downtime is acceptable. It offers a safer, more reliable alternative to unsupported live migration attempts.
:::

## Migrating Between CPU Generations

Upgrading from older to newer CPU generations — like moving from an older Intel CPU to a newer model — is a common scenario. While live migration is possible, it requires a structured approach to avoid compatibility issues.

### Recommended Process:

1. Add newer hosts to the pool.
:::note
At this stage, the pool baseline remains limited by the older CPUs.
:::
2. Migrate VMs off the older hosts.
:::tip
Some migrations may fail due to feature constraints. In these cases, shutting down and restarting the VMs updates their CPU features to match the current pool level, which enables migration.
:::
3. Remove the older hosts from the pool. 
:::note
This may raise the pool baseline, as the lowest common denominator shifts.
:::
4. Restart all VMs to ensure they adopt the updated CPU feature set now available in the pool.

This method ensures a smooth transition, maintaining compatibility and performance.

## Practical recommendations

:::tip
While live migration is incredibly useful, it does come with **time and resource costs**. For VMs that don’t need 24/7 uptime, shutting them down before migration can:

- Speed up the process significantly
- Simplify CPU compatibility requirements
- Make the entire operation more predictable

Often, migrating fewer running VMs and rebooting them afterward is faster and more reliable than relying solely on live migration.
:::

It's essential to understand CPU masking (and how it works with live and warm migration) when planning hardware upgrades or operating mixed-CPU pools in XCP-ng.

