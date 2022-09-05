# Answer file

To create a fully automated and unattended installation of XCP-ng, you can rely on an answer file.

This file is an XML, here is an example:

```xml
<?xml version="1.0"?>
    <installation srtype="ext">
        <primary-disk>sda</primary-disk>
        <guest-disk>sdb</guest-disk>
        <keymap>us</keymap>
        <root-password>myrootpassword</root-password>
        <source type="url">http://pxe.example.org/xcp-ng/</source>
        <post-install-script type="url">
          http://pxe.example.org/myscripts/post-install-script
        </post-install-script>
        <admin-interface name="eth0" proto="dhcp" />
        <timezone>Europe/Paris</timezone>
    </installation>
```

:::tip
In order to use thin provisionned local disks, you need to add an `srtype` attribute to `ext`. Without this, it will create a local LVM SR by default.
:::

## Answer file values

Here is the list of all entries.

### Install

```xml
<installation>
…
</installation>
```

:::tip
`<installation mode="fresh">` will not make any backup if there's a previous installation
:::

Re-install (backup, no config preservation):

```xml
<installation mode="reinstall">
…
</installation>
```

Upgrade (backup, preserve config):

```xml
<installation mode="upgrade">
…
</installation>
```

Restore:

```xml
<restore>
…
</restore>
```

#### Install options

```
netinstall-gpg-check=bool
```

Check authenticity of repository metadata and RPMs (GPG signatures) (new in 8.0). It's `True` by default.

### Common Elements

#### Source

```xml
  <source type="type">repo</source>
  <driver-source type="type">repo</driver-source>
```

Where type is one of:

* `local` (repo ignored)
* `url`
* `nfs`

`source` defines the location of the installation repository or a Supplemental Pack. There may be multiple 'source' elements.

`driver-source` defines the source of a Supplemental Pack containing device drivers to be loaded by  the installer and included after installation of the main repository. It can be 

Repository formats:

* nfs - `server:/path/`
* url - one of:
    * `http://[user[:passwd]]@host[:port]/path/`
    * `https://[user[:passwd]]@host[:port]/path/`
    * `ftp://[user[:passwd]]@host[:port]/path/`
    * `file:///path/`
    * `nfs://server:/path/`

#### Bootloader

Defines the bootloader variant and location. Optional.

```xml
  <bootloader location="mbr|partition">grub2</bootloader>
```

Default is `mbr`.

The optional attribute is `write-boot-entry=bool`, whether to modify the EFI Boot manager and write a boot entry for a UEFI installation. It's `true` by default.

#### Network backend

Defines the network stack variant. Optional.

```xml
  <network-backend>bridge|openvswitch|vswitch</network-backend>
```

Default: `vswitch`.

#### Stage

Defines a shell or python script to be invoked at the defined stage. Optional.

```xml
<script stage="stage" type="type">url</script>
```

Where stage is one of:

* `installation-start`
* `filesystem-populated`
* `installation-complete`

And type is one of:

* `nfs`
* `url`

Args passed to the script:

* `installation-start`: None
* `filesystem-populated`: mnt (mount point of root filesystem)
* `installation-complete`: 0 | 1 (success or failure)


#### FCoE

Specifies interfaces to run Fibre Channel over Ethernet VLAN Discovery on.

```xml
<fcoe-interface name="eth"/> | <fcoe-interface hwaddr="mac"/>
```

### (Re)Install Elements

#### Initial Partitions

Create primary partitions before installation. Used by XenRT to test preservation of Dell utility partitions.

```xml
  <initial-partitions>
    <partition number="n" size="sz" id="id"/>
  </initial-partitions>
```

#### Software RAID

Specifies the target disks and md device for creating a software RAID 1 array. The md device can then be used in `<primary-disk>` below. Nnew in xcp-ng 7.5.0-2 and 7.6.

```xml
  <raid device="dev">
    <disk>dev1</disk>
    <disk>dev2</disk>
  </raid>
```
#### Primary disk

Specifies the target disk for installation.

```xml
  <primary-disk>dev</primary-disk>
```

Optional attribute:
* `guest-storage`=bool. Include the remaining space of the primary disk in the local SR. `True` by default.
* `sr-at-end`=bool. Location of SR partition on the physical disk. Used by XenRT to simulate a host that has been migrated from an OEM release. Default: `True`.
* `preserve-first-partition`=`true|yes|false|no|if-utility`. Defines the action to perform on detecting a non-XS partition at the start of the disk. Default : if-utility. Values:
  * `true`|`yes`: Unconditionally preserve
  * `false`|`no`: Unconditionally destroy
  * `if-utility`: Preserve if `ID == 0xDE` (MBR) or `GUID == C12A7328-F81F-11D2-BA4B-00A0C93EC93B` and partition label == `'DELLUTILITY'` (GPT).

#### Guest disks

Specifies additional devices to be included in the local SR.

```xml
  <guest-disks>
    <guest-disk>dev</guest-disk>
  </guest-disks>
```

#### Admin interface

Specifies the initial management interface.

```xml
  <admin-interface name="eth"/> | <admin-interface hwaddr="mac"/>
```
    
Mandatory attributes:
* `proto`="static|dhcp|none"

If the interface is static then the following elements must be present:
```xml
      <ipaddr>ip</ipaddr>

      <subnet>subnet</subnet>

      <gateway>gw</gateway>
```

If proto is specified as "none" then protov6 must be specified and must not be none. Default: `none`. Optional attributes:
* `vlan`="vlan". Specifies tagged VLAN id for management interface. If not present, untagged VLAN is used as default. VLAN is supported from 1 to 4094.
* `protov6`="static|dhcp|autoconf|none". Default: `none`.

If `protov6` is static then the following elements must be present:
```xml
      <ipv6>ipv6/prefix_length</ipv6>
      <gatewayv6>gw</gatewayv6>
```

#### Root password

Specifies the root password. The value `!!` and a type of "hash" defers setting a password until first boot. Default: type="hash", `!!`.

```xml
  <root-password type="plaintext|hash">passwd</root-password>
```

How to create a hash.
```
mkpasswd -m SHA-512 'Password1'
$6$Vv6DgmVWmbZ.SdRl$AUWzbpE5luuNQIyW.CUEztWLKEJkSrBhfTKFdMaX1eJhPrtXworF4RIG.GQ9cBtxE0yNBI4weakgnHdGjljFg/
```

#### Name Server

Specifies one or more DNS entries.
    
```xml
  <name-server>ip</name-server>
```
    
#### Hostname

Specifies the hostname. Default: `localhost.localdomain`.

```xml
  <hostname>name</hostname>
```

#### Timezone

Specifies the timezone (region/city).

```xml
  <timezone>tz</timezone>
```

#### NTP

Specifies one or more NTP servers.

```xml
  <ntp-server>ntp</ntp-server>
```

#### Keymap

Specifies the console keymap. Default: `us`.

```xml
  <keymap>kbd</keymap>
```

### (Re)Install Attributes

#### SR type

Local SR type. Default: `lvm`.

```xml
  <installation sr-type="lvm|ext"?>
```

### Upgrade Elements

#### Existing installation

Specifies the device containing the XCP-ng installation to be upgraded.

```xml
  <existing-installation>dev</existing-installation>
```

### Restore Elements

#### Backup disk

Specifies the device containing the XCP-ng backup to be restored.

```xml
  <backup-disk>dev</backup-disk>
```

## Upgrade answer file

Your answer file can also be used to upgrade your machines. Here is an example:

```xml
<?xml version="1.0"?>
<installation mode="upgrade">
    <existing-installation>sda</existing-installation>
    <source type="url">http://pxehost.example.com/xcp-ng/</source>
    <post-install-script type="url">
        http://pxehost.example.com/myscripts/post-install-script
    </post-install-script>
</installation>
```

As you can see, `mode` is set on `upgrade`. Be sure to target the right disk to search for previous existing installations (here `sda`). Do NOT specify `primary-disk` and `guest-disk`!
