---
sidebar_position: 8
---

# Time synchronization

XCP-ng keeps the dom0 clock synchronized using `chronyd`. A host whose date is wrong keeps
working normally until something needs to trust that date. When that happens, the resulting
failures rarely point to the clock as the cause. This page explains why the clock matters, how
to configure NTP, and how to check and correct it.

## ⏰ Why the clock must be correct {#why-the-clock-must-be-correct}

- **Access to the repositories.** Updates are fetched over HTTPS, and TLS validates the
  server's certificate against the host's own date. If the host's clock is set too far in the
  past, the TLS handshake fails because, from the host's perspective, the mirror's certificate
  is not yet valid. The error `yum` prints in that situation does not mention time.
- **Pool membership.** A host joining a pool must have its clock synchronized with the pool
  master. See [Pool Requirements](../../installation/requirements#pool-requirements).
- **Certificates.** Certificates are only valid inside a validity window. A host whose date
  falls outside that window will reject, or be rejected by, connections that would otherwise
  succeed.
- **Logs and scheduled operations.** Correlating events across the hosts of a pool, and
  anything that runs on a schedule such as backups, depend on the hosts agreeing on what
  time it is.

## 🕰️ How XCP-ng keeps time {#how-xcp-ng-keeps-time}

The time daemon on dom0 is `chronyd`, configured through `/etc/chrony.conf`.

The default configuration enables `rtcsync`, allowing chronyd to keep the hardware clock
synchronized with the system clock automatically. There is no need to manually update the
hardware clock after correcting the system time, and the correction persists across reboots.

## 🔧 Configuring the time sources {#configuring-the-time-sources}

### During installation

At step 11, the installer prompts you to enter the time, select a time zone and either
configure NTP servers or set the time manually. Always configure at least one NTP server. See
[Install XCP-ng](../../installation/install-xcp-ng).

:::warning
If you set the time manually at this step, the host can end up with `chronyd` running but no
time source configured at all. It will keep whatever date it was installed with. See
[Checking the time sources](#checking-the-time-sources) below.
:::

### During an automated installation

The installation answer file accepts one or more NTP servers through the `<ntp-server>`
element. See [Answer file](../../appendix/answerfile).

### On an installed host

You can configure NTP from `xsconsole`, or by editing `/etc/chrony.conf` directly and
restarting the service.

## 🔍 Checking the time sources {#checking-the-time-sources}

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

When sources are configured, `chronyc sources` lists them. In the `MS` column, the second
character is the state of that source:

- `*` marks the one currently being used.
- `+` marks another acceptable source being combined with it.
- `?` means the source is unreachable.

At least one source should reach the `*` state.

To see the offset chrony believes it has, and whether it has settled:

```bash
chronyc tracking
```

## 🛠️ Correcting a wrong clock {#correcting-a-wrong-clock}

Start with `chronyc sources`, because the answer decides which of the two paths below
applies.

### If sources are listed

Correct the clock and check the result:

```bash
chronyc makestep
date
```

`chronyc makestep` is what does the work here. By default, chrony corrects time offsets by
gradually slewing the system clock, which never converges for an offset of months or years.

### If `Number of sources = 0`

Do not start with `makestep`. It will report success and move nothing, because chrony has no
measured offset to step to.

1. Add time sources to `/etc/chrony.conf`:

   ```
   server 0.pool.ntp.org iburst
   server 1.pool.ntp.org iburst
   server 2.pool.ntp.org iburst
   server 3.pool.ntp.org iburst
   ```

2. Restart the service and confirm that a source has become reachable, as described in
   [Checking the time sources](#checking-the-time-sources):

   ```bash
   systemctl restart chronyd
   chronyc sources
   ```

3. Once a source is reachable, correct the clock:

   ```bash
   chronyc makestep
   date
   ```

:::note
Correcting the date does not invalidate the host's own certificate. XAPI issues it with a
ten-year validity, so a host installed with a wrong date still holds a certificate that
covers the corrected date. `xe host-refresh-server-certificate` is not needed for this.
:::

:::tip
If `date` is wrong again after every power cycle, the motherboard's RTC battery is probably
dead and should be replaced. `rtcsync` can only keep the hardware clock in step while the
host is running; it cannot help a clock that loses its value when the power goes.
:::

## 🌐 Networks without internet access {#networks-without-internet-access}

Hosts without Internet access cannot reach the public NTP pool. The result is the same as
having no sources at all: `chronyc sources` lists servers that never leave the `?` state.

On such networks, point `/etc/chrony.conf` to a time source that hosts can actually reach,
such as an appliance on the same network, or a local server that is itself synchronized and
acts as the reference time for the network.

## 🎱 Pools {#pools}

Keep every host in a pool synchronized, ideally against the same sources. A host whose clock
differs from the pool master is not just inconvenient: clock synchronization is one of
the requirements for joining a pool, along with the other requirements listed in
[Pool Requirements](../../installation/requirements#pool-requirements).
