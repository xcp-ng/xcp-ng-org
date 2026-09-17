# OpenSSH Configuration

This page describes:
- how OpenSSH is configured on XCP-ng dom0
- what you can safely customize
- how to generate and use SSH keys

:::note
This page applies to **XCP-ng 8.3**. Configuration file layout and defaults may differ on other versions.
:::

## Do not edit our configuration files

XCP-ng ships two configuration files that are managed by Vates:

- `/etc/ssh/sshd_config` (server configuration)
- `/etc/ssh/ssh_config` (client configuration)

These files are fully managed by Vates and are **overwritten with every update** to keep ciphers, key exchange algorithms, and other OpenSSH security settings up to date. **Do not modify them.** Any manual changes will be silently lost on the next update and may conflict with the values we ship in the meantime.

If you need your own configuration, use the drop-in directories instead. These are never modified by updates:

- `/etc/ssh/sshd_config.d/` for the server
- `/etc/ssh/ssh_config.d/` for the client

Create a file there with a `.conf` extension, for example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/50-local.conf <<'EOF'
Port 2222
EOF
`}</Terminal>

## Do not override our settings

:::danger
Overriding our settings weakens security. The security level of any parameter you override is no longer guaranteed to match the level we maintain and update over time. Deviating from our defined settings may result in unauthorized access or insecure key exchange, and you will be entirely responsible for the resulting configuration.
:::

It is **strongly discouraged** to use a drop-in file to override a parameter that we already define in `/etc/ssh/sshd_config` or `/etc/ssh/ssh_config` (ciphers, key exchange algorithms, MACs, host key types, etc.).

## What you can safely customize

Some parameters can be changed as needed. However, once you change one, **you** are responsible for maintaining it over time. This includes ensuring that it remains compatible with future OpenSSH updates:

- **The SSH port**, via `Port` in a `sshd_config.d` drop-in.
- **The number of authentication attempts**, via `MaxAuthTries`.
- **Connection penalties** (rate-limiting/blocking of abusive source addresses), via `PerSourcePenalties` and related directives (`PerSourceNetBlockSize`, `PerSourcePenaltyExemptList`).

Example:

<Terminal shell title="root@xcp-ng-host — Custom sshd drop-in">{`
cat > /etc/ssh/sshd_config.d/50-local.conf <<'EOF'
Port 2222
MaxAuthTries 3
PerSourcePenalties authfail:5s max:10m
EOF
systemctl restart sshd
`}</Terminal>

## Post-quantum key exchange

The OpenSSH 9.9p1 version included in XCP-ng 8.3 automatically negotiates a hybrid post-quantum-resistant key exchange method (such as `mlkem768x25519-sha256` or `sntrup761x25519-sha512`), provided your SSH client also supports it. If it does not, the exchange method used will not be post-quantum, but this has no impact on your ability to manage your server. No configuration is required on your side: this happens as part of the normal algorithm negotiation at connection time.

## Generating and using an Ed25519 key

### 1. Generate the key (on your client machine)

<Terminal shell title="Generate an Ed25519 key pair">{`
ssh-keygen -t ed25519 -C "your-name@example.com" -f ~/.ssh/id_ed25519
`}</Terminal>

This creates a private key `~/.ssh/id_ed25519` (keep it secret) and a public key `~/.ssh/id_ed25519.pub`.

### 2. Add the public key to the server

Copy it automatically:

<Terminal shell title="Copy your public key to the XCP-ng host">{`
ssh-copy-id -i ~/.ssh/id_ed25519.pub root@<host>
`}</Terminal>

### 3. Connect using the key

<Terminal shell title="Connect to the XCP-ng host with your key">{`
ssh -i ~/.ssh/id_ed25519 root@<host>
`}</Terminal>

If the key is at the default path (`~/.ssh/id_ed25519`) and loaded in your SSH agent, `-i` is not even required: `ssh root@<host>` will use it automatically.

## FIDO2/U2F security keys

OpenSSH on XCP-ng also supports **FIDO2/U2F hardware security keys** (such as YubiKey, SoloKey, Nitrokey, etc.) as SSH keys, via the `ed25519-sk` and `ecdsa-sk` key types. The private key material is generated on the hardware token and never leaves it. Each authentication requires you to physically touch the device. This provides additional protection, even if the machine you use to SSH from is compromised. Our default server configuration accepts these key types like any other SSH key type, so there is nothing to enable on the XCP-ng host itself.

This requires a FIDO2/U2F-capable security key and an SSH client with security-key support. OpenSSH 8.2 and later support this by default, so any recent Linux, macOS, or Windows OpenSSH client should work.

### 1. Generate the key (on your client machine, with the token plugged in)

<Terminal shell title="Generate a FIDO2 Ed25519 security-key pair">{`
ssh-keygen -t ed25519-sk -O resident -O verify-required -C "your-name@example.com" -f ~/.ssh/id_ed25519_sk
`}</Terminal>

Touch the security key when prompted. This produces `~/.ssh/id_ed25519_sk` and `~/.ssh/id_ed25519_sk.pub`.

- `-O resident` stores the key handle on the token itself, so you can regenerate the local key files from the token later with `ssh-keygen -K` (handy if you use the same token on another machine).
- `-O verify-required` additionally requires a PIN or biometric verification on the token, on top of the touch, for stronger 2FA.
- If your token doesn't support FIDO2 resident keys, drop `-O resident`; `ecdsa-sk` is a fallback for tokens that only support U2F rather than FIDO2.

### 2. Add the public key to the server

Same as any other key:

<Terminal shell title="Copy your FIDO2 public key to the XCP-ng host">{`
ssh-copy-id -i ~/.ssh/id_ed25519_sk.pub root@<host>
`}</Terminal>

### 3. Connect using the key

<Terminal shell title="Connect to the XCP-ng host with your security key">{`
ssh -i ~/.ssh/id_ed25519_sk root@<host>
`}</Terminal>

Touch (and, if `verify-required` was used, unlock) the security key when prompted to complete authentication.

## Key-only authentication

Xen Orchestra (XOA or self-hosted XO) does **not** use SSH to manage your hosts: it talks to hosts over XAPI (HTTPS). This means you can freely harden SSH without affecting Xen Orchestra's ability to manage the pool.

In particular, you can enforce public-key authentication and disable password authentication, which Vates supports:

<Terminal shell title="root@xcp-ng-host — Enforce key-only authentication">{`
cat > /etc/ssh/sshd_config.d/50-local.conf <<'EOF'
PasswordAuthentication no
PubkeyAuthentication yes
EOF
systemctl restart sshd
`}</Terminal>

:::warning
Make sure your public key is installed and working (test a new connection in a separate session) **before** disabling password authentication, to avoid locking yourself out.
:::

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
