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

These files are provided by Vates and are **overwritten with every update** to keep ciphers, key exchange algorithms, and other OpenSSH security settings up to date. **Do not modify them.** Any manual changes will be silently lost on the next update and may conflict with the values we ship in the meantime.

If you need your own configuration, use the drop-in directories instead. These are never modified by updates:

- `/etc/ssh/sshd_config.d/` for the server
- `/etc/ssh/ssh_config.d/` for the client

:::info
When using these drop-in directories, the file name prefix matters: OpenSSH reads the files in lexical order, and the first value it encounters for a given directive is the one that is applied.
:::

Create a file there with a `.conf` extension, for example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/50-port.conf <<'EOF'
# User custom port (not maintained by XCP-ng)
Port 2222
EOF
`}</Terminal>

## Do not override our settings

:::danger
Overriding XCP-ng's settings weakens security. The security level of any parameter overridden by the user is no longer guaranteed to match the level XCP-ng maintains and updates over time. Deviating from XCP-ng's defined settings may result in unauthorized access or insecure key exchange, and the user will be entirely responsible for the resulting configuration.
:::

It is **strongly discouraged** to use a drop-in file to override a parameter that we already define in `/etc/ssh/sshd_config` or `/etc/ssh/ssh_config` (ciphers, key exchange algorithms, MACs, host key types, etc.).

## What you can safely customize

Some parameters can be changed as needed. However, once you change one, **you** are responsible for maintaining it over time. This includes ensuring that it remains compatible with future OpenSSH updates:

- **The SSH port**, via `Port` in an `sshd_config.d` drop-in. (default: `22`)
- **The number of authentication attempts**, via `MaxAuthTries`. (default: `3`)
- **Connection penalties** (rate-limiting/blocking of abusive source addresses), via `PerSourcePenalties` and related directives (`PerSourceNetBlockSize`, `PerSourcePenaltyExemptList`). (default: `persourcepenalties crash:90 authfail:5 noauth:1 grace-exceeded:10 refuseconnection:10 max:600 min:15 max-sources4:65536 max-sources6:65536 overflow:permissive overflow6:permissive`)

Example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/60-penalties.conf <<'EOF'
PerSourcePenalties crash:120 authfail:30 noauth:5 grace-exceeded:60 refuseconnection:60 max:1200 min:10 max-sources4:65536 max-sources6:65536 overflow:deny-all overflow6:deny-all
EOF
`}</Terminal>

Then restart `sshd` to apply it:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

## Post-quantum key exchange

The OpenSSH 9.9p1 version included in XCP-ng 8.3 automatically negotiates a hybrid post-quantum-resistant key exchange method (such as `mlkem768x25519-sha256` or `sntrup761x25519-sha512`), provided your SSH client also supports it. If it does not, the exchange method used will not be post-quantum, but this has no impact on your ability to manage your server. No configuration is required on your side: this happens as part of the normal algorithm negotiation at connection time.

## SSH key authentication

OpenSSH on XCP-ng supports **public-key authentication**, which is more secure and more convenient than password login. A key pair is made of a private key, which stays on your client machine and must be kept secret, and a public key, which you install on the XCP-ng host in `/root/.ssh/authorized_keys`.

Several key types are supported: **Ed25519**, **ECDSA** (`nistp256`, `nistp384`, `nistp521`) and **RSA** (with SHA-2 signatures only: `rsa-sha2-256` and `rsa-sha2-512`). The exact list of accepted key types is defined by `PubkeyAcceptedAlgorithms` in the configuration we ship in `/etc/ssh/sshd_config`.

What you can do with it:

- Generate a key pair on your client machine, optionally protected by a passphrase
- Install the public key on one or more XCP-ng hosts (with `ssh-copy-id` or by adding it to `/root/.ssh/authorized_keys` manually)
- Load the key into an SSH agent so you do not have to type the passphrase for every connection
- Once key authentication works, disable password login entirely (see [Key-only authentication](#key-only-authentication))

For the actual key generation and installation steps, follow the documentation of your SSH client and operating system, as tools and procedures vary. For example:

- OpenSSH (Linux, macOS, BSD): [`ssh-keygen(1)`](https://man.openbsd.org/ssh-keygen), [`ssh-agent(1)`](https://man.openbsd.org/ssh-agent)
- Other clients (PuTTY, terminal emulators, password managers with an SSH agent, etc.): refer to their own documentation.

## FIDO2/U2F security keys

OpenSSH on XCP-ng also supports **FIDO2/U2F hardware security keys** (such as YubiKey, SoloKey, Nitrokey, etc.) as SSH keys, via the `ed25519-sk` and `ecdsa-sk` key types. This support is available but **not enabled by default**: see [Enabling FIDO2 keys](#enabling-fido2-keys). The private key material can be generated on the hardware token and never leaves it. Each authentication requires you to physically touch the device. As a result, the private key cannot be stolen or silently reused, even from a compromised client machine.

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

The following ready-to-use drop-in enables plain FIDO2 keys while keeping the default algorithms. The `00-` prefix ensures it is read first, so its value is the one applied:

<Terminal shell title="root@xcp-ng-host — Enable FIDO2 keys">{`
cat > /etc/ssh/sshd_config.d/00-fido.conf <<'EOF'
# FIDO2 security keys (as suggested at https://docs.xcp-ng.org)
PubkeyAcceptedAlgorithms sk-ssh-ed25519@openssh.com,sk-ecdsa-sha2-nistp256@openssh.com,ssh-ed25519,ecdsa-sha2-nistp521,ecdsa-sha2-nistp384,ecdsa-sha2-nistp256,rsa-sha2-512,rsa-sha2-256
EOF
sshd -t
`}</Terminal>

If you use SSH certificates, add `sk-ssh-ed25519-cert-v01@openssh.com` and/or `sk-ecdsa-sha2-nistp256-cert-v01@openssh.com` to this list.

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

- Stay informed of developments in OpenSSH on XCP-ng, we will update this documentation if necessary.
- If you are using a key-only setup, combine this with `PasswordAuthentication no` and keep a validated backup access path before disabling password login.

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
Make sure your public key is installed and working (test a new connection in a separate session) **before** disabling password authentication, to avoid locking yourself out. **Keep your current session open** until you have confirmed that you can still log in: restarting `sshd` does not close sessions that are already open.
:::

Once `sshd -t` returns no error and your current session is kept open, restart `sshd`:

<Terminal shell title="root@xcp-ng-host — Apply the configuration">{`
systemctl restart sshd
`}</Terminal>

Then, **from another terminal**, open a new SSH connection with your key. Only close your original session once it works. If it fails, remove the drop-in file from your original session and restart `sshd` again.

## Enabling/disabling SSH via XAPI

SSH can be enabled or disabled through XAPI, without touching `xsconsole`:

<Terminal shell title="Enable/disable SSH via XAPI">{`
xe host-disable-ssh host=<host-uuid>
xe host-enable-ssh host=<host-uuid>
`}</Terminal>

:::warning
For reliability reasons, if XAPI becomes unresponsive, SSH access is automatically restored within a few minutes to allow emergency troubleshooting.
:::

Pool-wide equivalents are also available: `xe pool-disable-ssh` and `xe pool-enable-ssh`.

## Staying up to date

This page describes the behavior of OpenSSH as shipped in **XCP-ng 8.3**; it may differ on other versions.
OpenSSH security recommendations evolve over time, and so does the configuration Vates ships in `/etc/ssh/sshd_config` and `/etc/ssh/ssh_config`. We update these settings to keep them aligned with current security recommendations.
Keep an eye on XCP-ng release notes and OpenSSH updates, as the measures described here may change over time to maintain an up-to-date level of security.
