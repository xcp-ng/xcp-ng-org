---
sidebar_position: 8
---

# Time synchronization

XCP-ng keeps the dom0 clock synchronized using `chronyd`. A host whose date is wrong keeps
working normally until something needs to trust that date. When that happens, the resulting
failures rarely point to the clock as the cause. This page explains why the clock matters, how
to configure NTP, and how to check and correct it.

## Why the clock must be correct {#why-the-clock-must-be-correct}

- **Access to the repositories.** Updates are fetched over HTTPS, and TLS validates the
  server's certificate against the host's own date. If the host's clock is set too far in the
  past, the TLS handshake fails because, from the host's perspective, the mirror's certificate
  is not yet valid. The error `yum` prints in that situation does not mention time.
- **Pool membership.** A host joining a pool must have its clock synchronized with the pool
  master, and must stay synchronized afterwards. A failed join tells you what is wrong. Drift
  that sets in later does not: it surfaces as hosts disagreeing about when things happened,
  each of them convinced by its own clock. Keep every host in a pool on the same time sources.
  See [Pool Requirements](../../installation/requirements#pool-requirements) for the other
  conditions a host has to meet before it can join.
- **Certificates.** Certificates are only valid inside a validity window. A host whose date
  falls outside that window will reject, or be rejected by, connections that would otherwise
  succeed.
- **Logs and scheduled operations.** Correlating events across the hosts of a pool, and
  anything that runs on a schedule such as backups, depend on the hosts agreeing on what
  time it is.

## How XCP-ng keeps time {#how-xcp-ng-keeps-time}

The time daemon on dom0 is `chronyd`, configured through `/etc/chrony.conf`.

The default configuration enables `rtcsync`, allowing chronyd to keep the hardware clock
synchronized with the system clock automatically. There is no need to manually update the
hardware clock after correcting the system time, and the correction persists across reboots.

It also sets `makestep 1.0 3`, which lets chronyd jump the clock rather than ease it into
place, for the first three updates after the service starts. A host that boots with a badly
wrong date therefore fixes itself within seconds, as long as it can reach a time source.
Measured on 8.3: a clock put 45 days in the past was corrected between five and ten seconds
after `chronyd` started.

After those three updates chronyd only slews, which for an offset of months or years never
converges. That is the case the manual correction below exists for, along with the host that
had no time source to begin with.

## Configuring the time sources {#configuring-the-time-sources}

### During installation

The installer prompts you to enter the time, select a time zone, and either configure NTP
servers or set the time manually. Always configure at least one NTP server (see
[Install XCP-ng](../../installation/install-xcp-ng) for where this falls in the installation
sequence).

:::warning
If you set the time manually at this step, the host can end up with `chronyd` running but no
time source configured at all. The clock still ticks, but nothing ever checks it: it drifts
from the date you typed, and if that date was wrong, it stays wrong. This is also the one
case that does not fix itself at boot, since `makestep` needs a source to measure against.
[Checking the time sources](#checking-the-time-sources) below shows how to recognise that
state on a running host.
:::

### During an automated installation

The installation answer file accepts one or more NTP servers through the `<ntp-server>`
element (see [Answer file](../../appendix/answerfile) for its syntax).

### On an installed host

Use `xsconsole`. Its NTP screen adds and removes time servers and restarts `chronyd` for you.

:::warning
Editing `/etc/chrony.conf` by hand is a last resort, for when no other route works. Reach for
`xsconsole` first.

Xen Orchestra does not configure NTP on hosts. Its `xoa network ntp` command sets the time
servers of the XOA appliance itself, which is a Debian VM keeping its own clock, and the NTP
field in the XOA deployment form does the same for the appliance being deployed. Neither
touches the chrony configuration of the hosts XO manages.
:::

## Checking the time sources {#checking-the-time-sources}

Check that the service is running, and that it actually has something to synchronize with:

```bash
systemctl status chronyd
chronyc sources
```

Both matter, and the second is the one that gets skipped. `chronyd` can be running and
enabled while having **no time sources configured at all**:

```
# chronyc sources
210 Number of sources = 0
```

Then, the service behaves exactly as configured, and does nothing. Every other check an
operator would normally run looks healthy, which is what makes this one worth running early
rather than late.

On a host that is synchronizing normally, the same two commands look like this:

```
# systemctl status chronyd
● chronyd.service - NTP client/server
   Loaded: loaded (/usr/lib/systemd/system/chronyd.service; enabled; vendor preset: enabled)
   Active: active (running) since Wed 2026-08-12 08:38:14 CEST; 46min ago

# chronyc sources
210 Number of sources = 4
MS Name/IP address         Stratum Poll Reach LastRx Last sample
===============================================================================
^* ntp1.example.net              2   7   377    59   -361us[ -444us] +/- 8522us
^+ ntp2.example.net              3   9   377   118   +203us[ +122us] +/-   12ms
^+ ntp3.example.net              2   9   377   113  -1029us[-1110us] +/- 9934us
^- ntp4.example.net              3   8   377   506   +688us[ +491us] +/-   49ms
```

In the `MS` column, the first character is the source type, `^` for a server, and the second
is the state of that source:

- `*` marks the one currently being used.
- `+` marks another acceptable source, combined with it.
- `-` marks a source chrony is measuring but has excluded from the combination.
- `?` means the source is unreachable.

At least one source should reach the `*` state. Seeing `-` on some of the others is normal
and does not need correcting.

To see the offset chrony believes it has, and whether it has settled:

```bash
chronyc tracking
```

## Correcting a wrong clock {#correcting-a-wrong-clock}

A host with working time sources does not usually have a wrong clock, because chronyd steps
it within seconds of starting. So a clock that is still wrong is telling you that something
upstream of it is broken. Find that first. Stepping the clock by hand gets you working again
today, and if you stop there the date is wrong again in a few weeks.

Work outward, from the configuration to the network:

1. **Are there any sources?** `chronyc sources`. `Number of sources = 0` means none were
   ever configured, which is the manual-time-at-install case. Add them with `xsconsole`.
2. **Are they reachable?** Sources stuck at `?` are configured but unanswered. NTP goes out
   over UDP 123, so a firewall between the host and its servers produces exactly this, as
   does a network with no route to the public pool, which
   [Networks without internet access](#networks-without-internet-access) below covers.
3. **Is the daemon healthy?** `systemctl status chronyd`, and `journalctl -u chronyd` for
   what it made of its configuration at startup.
4. **Was the configuration changed underneath you?** `rpm -V chrony` reports whether
   `/etc/chrony.conf` still matches the package. Hand edits and `xsconsole` both show up here.

Once sources are reachable, restarting the daemon corrects the clock on its own, because the
`makestep` allowance applies again from a fresh start:

```bash
systemctl restart chronyd
chronyc sources
date
```

### Stepping the clock immediately

If you need the correct date right now and the daemon has been running for a while, its
`makestep` allowance is already spent and it will only slew:

```bash
chronyc makestep
date
```

This is a stopgap. It needs at least one reachable source to have something to step to, and
on a host with `Number of sources = 0` it reports success while moving nothing. It also does
nothing about the reason the clock was wrong, so treat it as buying time for the diagnosis
above rather than as the end of it.

:::note
**Check the host certificate after a large correction.**

XAPI issues certificates with a ten-year validity, anchored on the clock at the moment they
are generated. Small corrections stay comfortably inside that window, so most of the time
there is nothing to do.

A big correction is different. A host that generated its certificates believing the year was
2016 holds them valid 2016 to 2026, and moving the clock to the real date can leave them
expired. A clock set far into the future produces the mirror image: certificates not valid
yet once the date is corrected backwards.

There are two, and they are refreshed by different commands:

| Certificate | What it is | Regenerate with |
|---|---|---|
| `/etc/xensource/xapi-ssl.pem` | The TLS certificate clients see, including Xen Orchestra | `xe host-reset-server-certificate` |
| `/etc/xensource/xapi-pool-tls.pem` | The internal certificate hosts use between themselves | `xe host-refresh-server-certificate host=<host>` |

Check both windows against the corrected date:

```bash
openssl x509 -in /etc/xensource/xapi-ssl.pem -noout -dates
openssl x509 -in /etc/xensource/xapi-pool-tls.pem -noout -dates
date -u
```

If the date falls outside `notBefore` to `notAfter`, regenerate the one concerned using the
table above. Do not reach for `host-refresh-server-certificate` to fix `xapi-ssl.pem`: it
refreshes the internal certificate, reports success, and leaves the TLS one untouched.

On a host whose TLS certificate is already rejected, and which therefore cannot be reached the
usual way, `xe host-emergency-reset-server-certificate` runs locally on the host itself.
:::

:::tip
If `date` is wrong again after every power cycle, the motherboard's RTC battery is probably
dead and should be replaced. `rtcsync` can only keep the hardware clock in step while the
host is running; it cannot help a clock that loses its value when the power goes.
:::

## Networks without internet access {#networks-without-internet-access}

Hosts without Internet access cannot reach the public NTP pool. The result is the same as
having no sources at all: `chronyc sources` lists servers that never leave the `?` state.

On such networks, point the hosts at a time source they can actually reach, using `xsconsole`
as above: an appliance on the same network, or a local server that is itself synchronized and
acts as the reference time for the network.
