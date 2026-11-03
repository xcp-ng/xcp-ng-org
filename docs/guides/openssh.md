# OpenSSH Configuration

This page describes:
- how OpenSSH is configured on XCP-ng dom0
- what you can safely customize
- which SSH key authentication options are available

:::note
This page applies to **XCP-ng 8.3**. Configuration file layout and defaults may differ on other versions.
:::

## Do not edit our configuration files

XCP-ng ships two configuration files that are provided by Vates:

- `/etc/ssh/sshd_config` (server configuration)
- `/etc/ssh/ssh_config` (client configuration)

These files are provided by Vates and are **overwritten with every update** to keep ciphers, key exchange algorithms, and other OpenSSH security settings up to date. **Do not modify them.** Any manual changes will be silently lost on the upcoming updates and may conflict with the configuration we ship in the meantime.

If you need your own configuration, use the drop-in directories instead. These are never modified by updates:

- `/etc/ssh/sshd_config.d/` for the server
- `/etc/ssh/ssh_config.d/` for the client

:::info
When using these drop-in directories, the file name prefix matters: OpenSSH reads the files in lexical order, and the first value it encounters for a given directive is the one that is applied.
:::

Create a file there with a `.conf` extension, for example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/50-port.conf <<'EOF'
# XCP-ng's user configuration file (Refer to https://docs.xcp-ng.org )
# User custom port
Port 2222
EOF
`}</Terminal>

:::danger
The dom0 firewall only allows incoming SSH connections on port `22`. If you change the SSH port, you must also allow the new port in `/etc/sysconfig/iptables` (change the existing `--dport 22` rule with your new port) and restart `iptables` and `sshd`. Otherwise, you will lock yourself out of SSH.
:::

## Do not override our settings

:::danger
Overriding XCP-ng's settings weakens security. The security level of any parameter overridden by the user is no longer guaranteed to match the level XCP-ng maintains and updates over time. Deviating from XCP-ng's defined settings may result in unauthorized access or insecure key exchange, and the user will be entirely responsible for the resulting configuration.
:::

It is **strongly discouraged** to use a drop-in file to override a parameter that we already define in `/etc/ssh/sshd_config` or `/etc/ssh/ssh_config` (ciphers, key exchange algorithms, MACs, host key types, etc.).

The only exceptions documented here are:

- `PubkeyAcceptedAlgorithms`, which you must override to enable FIDO2 security keys or SSH certificates: follow [Enabling FIDO2 keys](#enabling-fido2-keys) or [SSH user certificates](#ssh-user-certificates) to do it without removing the algorithms we enable by default.
- `DisableForwarding`, which you must override to use local port forwarding (`ssh -L`) to the host itself: follow [Re-enabling local port forwarding](#re-enabling-local-port-forwarding).

## Forwarding

All forwarding is disabled (`DisableForwarding yes`): TCP port forwarding (`ssh -L`, `ssh -R`, `ssh -D`), agent forwarding and Unix socket forwarding. As a consequence, an XCP-ng host cannot be used as an SSH jump host (`ssh -J`/`ProxyJump`), which we do not recommend anyway: dom0 is not meant to give access to other machines.

X11 forwarding is not possible on XCP-ng hosts. The other kinds of forwarding are disabled to reduce the attack surface of dom0.

### Re-enabling local port forwarding

Some procedures, such as [connecting a VNC client to a VM console](../vms/vms.md#use-a-vnc-client), use a local port forward to a service listening on the host itself (`ssh -L <LOCAL_PORT>:localhost:<REMOTE_PORT>`). To allow it again, without allowing the host to be used to reach other machines:

<Terminal shell title="root@xcp-ng-host — Re-enable local port forwarding">{`
cat > /etc/ssh/sshd_config.d/00-forwarding.conf <<'EOF'
# Local port forwarding to the host itself (as suggested at https://docs.xcp-ng.org)
DisableForwarding no
AllowTcpForwarding local
PermitOpen localhost:* 127.0.0.1:* [::1]:*
AllowAgentForwarding no
AllowStreamLocalForwarding no
EOF

sshd -t # Testing config file
`}</Terminal>

- `DisableForwarding` overrides all other forwarding-related options: a drop-in that only sets `AllowTcpForwarding yes` has **no effect**. You must set `DisableForwarding no`.
- `AllowTcpForwarding local` allows `ssh -L` and refuses `ssh -R`.
- `PermitOpen` restricts forwards to the host itself: forwards to other machines (jump host, `ssh -D` SOCKS proxy) are refused. Names are matched literally, without any DNS lookup, so use `localhost`, `127.0.0.1` or `[::1]` as the destination of your `ssh -L` command (a forward to the host's management IP address is refused).
- `AllowAgentForwarding no` and `AllowStreamLocalForwarding no` are required: our configuration does not set them, and OpenSSH enables both by default once `DisableForwarding` is set to `no`. Agent forwarding would let anyone with root access on the host use the keys loaded in your SSH agent.

`sshd -t` checks the configuration syntax without applying it. It must return no error before you go further.

:::warning
Restarting `sshd` applies the new configuration to new connections only: sessions that are already open are kept. **Keep your current session open** until you have confirmed that you can still log in, so you can revert the change if needed.
:::

Once the configuration is validated and your current session is kept open, restart `sshd`:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

Then, **from another terminal on your client**, open a new SSH connection with your `ssh -L` tunnel. For example, replace the placeholders with the local port, host-side service port, and host address you need:

```sh
ssh -N -L <LOCAL_PORT>:localhost:<REMOTE_PORT> root@<XCP_NG_HOST>
```

`-N` opens the tunnel without starting a remote shell. Keep this connection open and test the service through `localhost:<LOCAL_PORT>` on your client. Only close your original session once the tunnel works. If it fails, remove the drop-in file from your original session and restart `sshd` again.

## What you can safely customize

Some parameters can be changed as needed. However, once you change one, **you** are responsible for maintaining it over time. This includes ensuring that it remains compatible with future OpenSSH updates:

- **The SSH port**, via `Port` in an `sshd_config.d` drop-in. (default: `22`)
- **The number of authentication attempts**, via `MaxAuthTries`. (default: `3`)
- **The time allowed to log in**, via `LoginGraceTime`. (default: `60` seconds)
- **Connection penalties** (rate-limiting/blocking of abusive source addresses), via `PerSourcePenalties` and related directives (`PerSourceNetBlockSize`, `PerSourcePenaltyExemptList`). (default: `persourcepenalties crash:90 authfail:5 noauth:1 grace-exceeded:10 refuseconnection:10 max:600 min:15 max-sources4:65536 max-sources6:65536 overflow:permissive overflow6:permissive`)

Connection penalties are enabled on our OpenSSH 9.9p1 as a protection against brute-force attacks: when an address repeatedly fails to authenticate, or opens connections that never authenticate, `sshd` refuses new connections from it for a while, even with valid credentials. This can affect several users or scripts behind the same NAT address, monitoring tools that only check that port `22` is open, or SSH agents offering several wrong keys before the right one. If you are affected, exempt the trusted addresses with `PerSourcePenaltyExemptList` rather than disabling penalties entirely.

Example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/60-penalties.conf <<'EOF'
PerSourcePenalties crash:120 authfail:30 noauth:5 grace-exceeded:60 refuseconnection:60 max:1200 min:10 max-sources4:65536 max-sources6:65536 overflow:deny-all overflow6:deny-all
PerSourcePenaltyExemptList 192.0.2.10,198.51.100.0/24
EOF
`}</Terminal>

Then restart `sshd` to apply it:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

## Post-quantum key exchange

The OpenSSH 9.9p1 version included in XCP-ng 8.3 automatically negotiates a hybrid post-quantum-resistant key exchange method (such as `mlkem768x25519-sha256` or `sntrup761x25519-sha512`), provided your SSH client also supports it. If it does not, the exchange method used will not be post-quantum, but this has no impact on your ability to manage your server. No configuration is required on your side: this happens as part of the normal algorithm negotiation at connection time.

## SSH key authentication

OpenSSH on XCP-ng supports **public-key authentication**, which is more convenient than password login and helps protect against certain attacks, such as password brute-force. A key pair is made of a private key, which stays on your client machine and must be kept secret, and a public key, which you install on the XCP-ng host in `/root/.ssh/authorized_keys`.

Several key types are supported: **Ed25519**, **ECDSA** (`nistp256`, `nistp384`, `nistp521`) and **RSA** (with SHA-2 signatures only: `rsa-sha2-256` and `rsa-sha2-512`). The exact list of accepted key types is defined by `PubkeyAcceptedAlgorithms` in the configuration we ship in `/etc/ssh/sshd_config`.

What you can do with it:

- Generate a key pair on your client machine, optionally protected by a passphrase
- Install the public key on one or more XCP-ng hosts (with `ssh-copy-id` or by adding it to `/root/.ssh/authorized_keys` manually)
- Load the key into an SSH agent so you do not have to type the passphrase for every connection
- Once key authentication works, disable password login entirely (see [Key-only authentication](#key-only-authentication))

For the actual key generation and installation steps, follow the documentation of your SSH client and operating system, as tools and procedures vary. For example:

- OpenSSH (Linux, macOS, BSD): [`ssh-keygen(1)`](https://man.openbsd.org/ssh-keygen), [`ssh-agent(1)`](https://man.openbsd.org/ssh-agent)
- Other clients (PuTTY, terminal emulators, password managers with an SSH agent, etc.): refer to their own documentation.

:::warning
The server only allows 3 authentication attempts per connection (`MaxAuthTries 3`), and each key offered by your client counts as one attempt.

If your SSH agent holds more than 3 keys, the connection may be closed with `Too many authentication failures` before the right key is tried, and repeated failures can get your address temporarily blocked (see `PerSourcePenalties`). To avoid this, tell your client which key to use, for example with `IdentityFile` and `IdentitiesOnly yes` in your OpenSSH client configuration.
:::

## FIDO2/U2F security keys

OpenSSH on XCP-ng also supports **FIDO2/U2F hardware security keys** (such as YubiKey, SoloKey or Nitrokey) as SSH keys, via the `ed25519-sk` and `ecdsa-sk` key types. This support is available but **not enabled by default**: see [Enabling FIDO2 keys](#enabling-fido2-keys). The private key material can be generated on the hardware token and never leaves it. Each authentication requires you to physically touch the device. As a result, the private key cannot be stolen or silently reused, even from a compromised client machine.

This requires a FIDO2/U2F-capable security key and an SSH client with security-key support. OpenSSH clients support this since version 8.2, so any recent Linux, macOS, or Windows OpenSSH client should work.

For the actual key generation and enrollment steps, follow the official documentation for your security key model and operating system. Procedures vary by manufacturer and by OS.

### Available FIDO2 algorithms

FIDO2 algorithms are not enabled in the configuration we ship. The following algorithms exist for FIDO2 keys:

- **Plain keys**, where the server trusts the public key listed in `/root/.ssh/authorized_keys`:
  - `sk-ssh-ed25519@openssh.com` (for `ed25519-sk` keys)
  - `sk-ecdsa-sha2-nistp256@openssh.com` (for `ecdsa-sk` keys)
- **Certificates** (`-cert-v01`), where the public key is signed by an SSH certificate authority (CA). The server trusts the CA (via `TrustedUserCAKeys`) instead of each individual key, and the certificate can carry a validity period and a list of allowed principals:
  - `sk-ssh-ed25519-cert-v01@openssh.com`
  - `sk-ecdsa-sha2-nistp256-cert-v01@openssh.com`

Only enable the algorithms matching the keys you actually use. If you do not use an SSH certificate authority, you do not need the `-cert-v01` variants.

### Enabling FIDO2 keys

`PubkeyAcceptedAlgorithms` replaces the whole list of accepted algorithms. Therefore, you must also include the algorithms we enable by default (`ssh-ed25519,ecdsa-sha2-nistp521,ecdsa-sha2-nistp384,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256`). Otherwise, **only FIDO2 keys will be accepted**: you may lock yourself out, and your configuration will no longer be supported by Vates.

The following ready-to-use drop-in enables plain FIDO2 keys while keeping the default algorithms.

:::info
The `00-` prefix makes this file load first, provided no other drop-in file matches `00-[0-e]*`; such files are read before it:
:::

<Terminal shell title="root@xcp-ng-host — Enable FIDO2 keys">{`
cat > /etc/ssh/sshd_config.d/00-fido.conf <<'EOF'
# FIDO2 security keys (as suggested at https://docs.xcp-ng.org)
PubkeyAcceptedAlgorithms sk-ssh-ed25519@openssh.com,sk-ecdsa-sha2-nistp256@openssh.com,ssh-ed25519,ecdsa-sha2-nistp521,ecdsa-sha2-nistp384,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256
EOF
sshd -t
`}</Terminal>

If you use SSH certificates, add `sk-ssh-ed25519-cert-v01@openssh.com` and/or `sk-ecdsa-sha2-nistp256-cert-v01@openssh.com` to this list.

:::tip
Only the first `PubkeyAcceptedAlgorithms` value read is applied. If you also need [SSH user certificates](#ssh-user-certificates), put all the algorithms in this single drop-in file instead of creating a second one.
:::

`sshd -t` checks the configuration syntax without applying it. It must return no error before you go further.

:::warning
Restarting `sshd` applies the new configuration to new connections only: sessions that are already open are kept. **Keep your current session open** until you have confirmed that you can still log in, so you can revert the change if needed.
:::

Once the configuration is validated and your current session is kept open, restart `sshd`:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

Then, **from another terminal**, open a new SSH connection with your FIDO2 key, and another one with a regular key. Only close your original session once both work.

If you are hardening SSH more aggressively, keep the configuration precise and minimal:

- Stay informed of developments in OpenSSH on XCP-ng: Vates will update this documentation if necessary.
- If you are using a key-only setup, combine this with `PasswordAuthentication no` and keep a validated backup access path before disabling password login.

## SSH user certificates

SSH user certificates (`*-cert-v01@openssh.com` key types, used with `TrustedUserCAKeys`) were accepted by previous OpenSSH packages of XCP-ng 8.3. Since OpenSSH 9.9p1, `PubkeyAcceptedAlgorithms` only lists plain keys, so **certificate logins are refused** after the update.

If you log in with SSH certificates, create this drop-in **before updating** (it is harmless on the previous version), while keeping the algorithms we enable by default:

<Terminal shell title="root@xcp-ng-host — Accept SSH user certificates">{`
cat > /etc/ssh/sshd_config.d/00-certificates.conf <<'EOF'
# SSH user certificates (as suggested at https://docs.xcp-ng.org)
PubkeyAcceptedAlgorithms ssh-ed25519-cert-v01@openssh.com,ecdsa-sha2-nistp521-cert-v01@openssh.com,ecdsa-sha2-nistp384-cert-v01@openssh.com,ecdsa-sha2-nistp256-cert-v01@openssh.com,rsa-sha2-512-cert-v01@openssh.com,rsa-sha2-256-cert-v01@openssh.com,ssh-ed25519,ecdsa-sha2-nistp521,ecdsa-sha2-nistp384,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256
EOF

sshd -t
`}</Terminal>

Only keep the certificate types you actually use. Only the first `PubkeyAcceptedAlgorithms` value read is applied: if you also use FIDO2 keys, add their algorithms (`sk-ssh-ed25519@openssh.com`, `sk-ecdsa-sha2-nistp256@openssh.com` and their `-cert-v01` variants) to this same list instead of creating a second drop-in file.

`sshd -t` checks the configuration syntax without applying it. It must return no error before you go further.

:::warning
Restarting `sshd` applies the new configuration to new connections only: sessions that are already open are kept. **Keep your current session open** until you have confirmed that you can still log in, so you can revert the change if needed.
:::

Once the configuration is validated and your current session is kept open, restart `sshd`:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

Then, **from another terminal**, open a new SSH connection with your certificate. Only close your original session once it works. If it fails, remove the drop-in file from your original session and restart `sshd` again.

## Key-only authentication

Xen Orchestra (XOA or self-hosted XO) does **not** use SSH to manage your hosts: it talks to hosts over XAPI (HTTPS). This means you can freely harden SSH without affecting Xen Orchestra's ability to manage the pool.

In particular, you can enforce public-key authentication and disable password authentication, which Vates supports:

<Terminal shell title="root@xcp-ng-host — Enforce key-only authentication">{`
cat > /etc/ssh/sshd_config.d/70-auth.conf <<'EOF'
# User hardening (as suggested at https://docs.xcp-ng.org)
PasswordAuthentication no
PubkeyAuthentication yes
EOF

sshd -t
`}</Terminal>

:::warning
To avoid locking yourself out, make sure your public key is installed and working (test a new connection in a separate session) **before** disabling password authentication. **Keep your current session open** until you have confirmed that you can still log in: restarting `sshd` does not close sessions that are already open.
:::

Once `sshd -t` returns no error and your current session is kept open, restart `sshd`:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

Then, **from another terminal**, open a new SSH connection with your key. Only close your original session once it works. If it fails, remove the drop-in file from your original session and restart `sshd` again.

## Staying up to date

This page describes the behavior of OpenSSH as shipped in **XCP-ng 8.3**; it may differ on other versions.
OpenSSH security recommendations evolve over time, and so does the configuration Vates ships in `/etc/ssh/sshd_config` and `/etc/ssh/ssh_config`. We update these settings to keep them aligned with current security recommendations.
Keep an eye on XCP-ng release notes and OpenSSH updates, as the measures described here may change over time to maintain an up-to-date level of security.
