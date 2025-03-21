---
sidebar_position: 10
---

# ISO modification

How to modify the installation ISO.

This page aims at guiding you through the modification of the installation ISO images, and also serves as documentation on their internals.

Obviously, a modified installation image is not an official installation image anymore, so it's harder to provide support for that. However, it can still be useful in some cases and we also hope that letting you know how to modify the installer will help getting useful contributions on its [code base](https://github.com/xcp-ng/host-installer).

## Extract an existing ISO image

```
mkdir tmpmountdir/
mount -o loop filename.iso tmpmountdir/ # as root
cp -a tmpmountdir/. iso
umount tmpmountdir/ # as root
```

Now you have the contents of the ISO image in the `iso/` directory. Note that everything in the directory is read-only at this stage, so you will need to change the file permissions or be root to modify the files.

For example:
```
chmod a+w iso/ -R
```

## Contents of the installation ISO image

We'll only list the files that are used during an installation or upgrade. The other files in the ISO are documentation or additional tools.

* `boot/`: stage 1 of the installer: initial boot then loads the second stage
* `EFI/`: used to boot on UEFI
* `install.img`: stage 2 of the installer. This file actually contains a complete Linux filesystem. In that filesystem, the installer comes from the `host-installer` RPM package. More about that below.
* `Packages/`: all the RPMs that will be installed on the system
* `repodata/`: yum metadata about the RPMs
* `.treeinfo`: often forgotten when one copies the contents of the ISO for network installation, this hidden file contains necessary metadata about XCP-ng and its version

## Create a fully automated installation image

[A guide is available in the *Installation* page](../../../installation/install-xcp-ng#unattended-installation-with-a-custom-iso-image).

## Modify the installer itself

The steps to modify the installer are:
* (extract the ISO image, see above)
* extract install.img
* modify the files it contains (a whole Linux filesystem)
* rebuild install.img
* (rebuild the ISO image, see below)

### Extract install.img

```
cd iso/
mkdir install
cd install
bunzip2 < ../install.img | cpio -idm
cd ..
```

### Navigate in the installer's filesystem

If you want to use commands in the installer's filesystem context, as root:
```
chroot install/
```
To use `yum` or `rpm`, you'll also need to mount `urandom` in your chrooted dir.
From outside the chroot run:
```
touch install/dev/urandom
mount -B /dev/urandom install/dev/urandom # As root!
```
Then useful commands will be available to you in the context of that filesystem, such as `rpm`, `yum`, etc.

For example, you can list all RPMs present in that "system":
```
rpm -qa | sort
```

Exit chroot with `exit` or Ctrl + D.

### Alter the filesystem

Using chroot as explained above, you can easily remove, add or update RPMs in the installer's filesystem.

:::warning
This modifies the installer filesystem, not the host!
To modify the installed RPMs on a host see [change the list of installed RPMs](#change-the-list-of-installed-rpms).
:::

Example use cases:
* Update drivers: replace an existing driver module (*.ko) with yours, or, if you have built a RPM with that driver, install it. For example, you could rebuild a patched `qlogic-qla2xxx` RPM package and install it instead of the one that is included by default. Note that this will *not* install the newer driver on the final installed XCP-ng. We're only in the context of the system that runs during the installation phase, here.
* Modify the installer itself to fix a bug or add new features (see below)

### Modify the installer code itself

The installer is a `python` program that comes from the `host-installer`. In chroot, you can easily locate its files with:
```
rpm -ql host-installer
```
Most of them are in `/opt/xensource/installer/`

Our git repository for the installer is: [https://github.com/xcp-ng/host-installer](https://github.com/xcp-ng/host-installer). Feel free to create pull requests for your enhancements or bug fixes.

### Build a new `install.img` with your changes

From the `iso/` directory
```
cd install/
find . | cpio -o -H newc | bzip2 > ../install.img # as root!
rm install/ -rf # as root too. Or move it somewhere else. We don't want it in the final ISO.
```

Then you can either read the next section or jump to "Build a new ISO image with your changes".

## Change the list of installed RPMs

You may want the installer to install more packages, or updated packages.

Read [the usual warnings about the installation of third party RPMs on XCP-ng.](https://github.com/xcp-ng/xcp/wiki/Updates-Howto#be-cautious-with-third-party-repositories-and-packages)

To achieve this:
* Change the RPMs in the `Packages/` directory. If you add new packages, be careful about dependencies, else they'll fail to install and the whole installation process will fail.
* If you need to add new RPMs not just replace existing ones, they need to be pulled by another existing RPM as dependencies. If there's none suitable, you can add the dependency to the [xcp-ng-deps RPM](https://github.com/xcp-ng-rpms/xcp-ng-deps).
* Update `repodata/`
  ```
  rm repodata/ -rf
  createrepo_c . -o .
  ```

## Build a new ISO image with your changes

From the `iso/` directory:
```
OUTPUT=/path/to/destination/iso/file # change me
VERSION=8.2 # change me
genisoimage -o $OUTPUT -v -r -J --joliet-long -V "XCP-ng $VERSION" -c boot/isolinux/boot.cat -b boot/isolinux/isolinux.bin \
            -no-emul-boot -boot-load-size 4 -boot-info-table -eltorito-alt-boot -e boot/efiboot.img -no-emul-boot .
isohybrid --uefi $OUTPUT
```