# Encrypting VMs

XCP-ng doesn't have built-in encryption for VMs or storage repositories (SRs), but you can still protect your data with a couple of effective workarounds.

This guide covers two common methods: encrypting data inside the VM and using encrypted shared storage (SRs).

:::warning

- These are just suggestions. The methods below are not officially supported by XCP-ng.
- This guide focuses on VM encryption and doesn't cover [dom0](../appendix/glossary.md) encryption.

:::

## Encrypting inside the VM

The easiest and most flexible way to secure your VM's data is by enabling encryption directly within the operating system.

### Full disk encryption during Debian installation

If you want to encrypt the entire VM filesystem, the simplest approach is to enable encryption during OS installation. For instance, the Debian installer lets you set up LUKS-based full disk encryption. This has to be done during installation since encryption requires reformatting the whole disk.

Check out the [official Debian documentation](https://www.debian.org/releases/trixie/amd64/ch06s03.en.html#di-partition) for step-by-step instructions.

### Encrypting additional volumes

You can also encrypt specific volumes inside the VM if you don't need full disk encryption.

For Linux VMs, here are two popular tools:

- **LUKS (Linux Unified Key Setup):** Encrypts entire partitions or logical volumes. Learn more from the [cryptsetup repository](https://gitlab.com/cryptsetup/cryptsetup).
- **eCryptfs:** Encrypts individual directories (e.g., home directories).

### Example: Setting up LUKS encryption in Debian

1. Install the required package:

    ```bash
    sudo apt-get update && sudo apt-get install cryptsetup
    ```

2. Prepare the partition:

    ```bash
    sudo cryptsetup luksFormat /dev/sdX
    sudo cryptsetup open /dev/sdX encrypted_volume
    ```

3. Create a filesystem and mount the encrypted volume:

    ```bash
    sudo mkfs.ext4 /dev/mapper/encrypted_volume
    sudo mount /dev/mapper/encrypted_volume /mnt
    ```

## Encrypting a shared storage repository

If you want to protect data across multiple hosts, consider using an encrypted storage repository (SR) for your VM disks. A popular option for this is TrueNAS, which can manage and encrypt SRs.

For detailed instructions, refer to the TrueNAS guide on [storage encryption](https://www.truenas.com/docs/core/13.0/coretutorials/storage/pools/storageencryption/).

## Things to keep in mind

- **Encryption inside the VM** is the easiest and most flexible option. It works regardless of your storage setup and lets you choose the encryption method you prefer. However, this only protects data inside the VM. Your hypervisor and storage layer stay unencrypted.
- **Encrypted storage repositories** secure data at the storage level, protecting all virtual disks in the SR. This is useful if you want to safeguard data across multiple VMs or hosts. Just be aware that it may affect performance and requires compatible storage hardware.
- **Full disk encryption** has to be set up during OS installation—you can't add it later to an existing VM.
- Neither method is natively supported by Xen Orchestra or XCP-ng, so you'll need to manage encryption keys and access control on your own.