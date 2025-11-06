---
sidebar_position: 14
---

# Koji initial setup

How to configure Koji as a user.

## Certificates

Once accepted as a proven packager or as an apprentice, you will receive your connection certificate as well as the server's CA public certificate:

```
client.crt # your certificate
serverca.crt
clientca.crt
```

Copy them to `~/.koji/` (create it if it doesn't exist yet).
Make sure not to lose them and to not let anyone put their hands on them.

You may also receive a browser certificate for the connection to Koji's web interface. It has little use, though. Unless you have admin rights, the only actions available are cancelling and resubmitting builds, which you can already do with the `koji` CLI tool.
```
{login}_browser_certificate.p12
```
You need to import it into your web browser's certificate store and then use it when you log in to [https://koji.xcp-ng.org/](https://koji.xcp-ng.org/)

## Installing koji
The preferred, distro-independent way is to install it from PyPi with `pip`, `uv` or your preferred tool. Alternatively, your distro might provide the `koji` client as a package you can install from its repositories. You could also run it from a Fedora container, but that's mostly a last resort option if anything else fails for some reason.

Example on Ubuntu 24.04+:
```bash
# Install dependencies
sudo apt install -y build-essential python3-dev libkrb5-dev krb5-user libssl-dev libffi-dev python3-requests-gssapi

# Install koji
pipx install koji
```

## Configuring koji
Put this in `~/.koji/config`:
```
[koji]

;url of XMLRPC server
server = https://kojihub.xcp-ng.org

;url of web interface
weburl = https://koji.xcp-ng.org

;url of package download site
topurl = https://koji.xcp-ng.org/kojifiles

;path to the koji top directory
topdir = /mnt/koji

; configuration for SSL authentication

;client certificate
cert = ~/.koji/client.crt

;certificate of the CA that issued the HTTP server certificate
serverca = ~/.koji/serverca.crt

; select authentication type
authtype = ssl
```

In some cases (with older versions of koji), we've found that the `cert` directive in `~/.koji/config ` was not used if there was no such directive in `/etc/koji.conf`. Workaround: add a `cert = ~/.koji/client.crt` to `/etc/koji.conf`, or possibly even `cp ~/.koji/config /etc/koji.conf`.

## Test your connection
`koji moshimoshi`. If it greats you (in any language), then your connection to the server works.

## Get more permissions
After your first connection, your user gets added by koji to its database. Now you need permissions to be able to tag builds. Ask an administrator for the `build` permission.

## Koji in Docker container

This used to be useful when our koji server was a bit too old for recent crypto, but now **installing from `PyPi` is probably the best choice**.

However, if you really want to run the `koji` client from a container, here's a small guide.

Prepare an image:
```
docker build -t koji:latest - <<EOF
FROM fedora:41
RUN dnf install -qy koji
EOF
```

Then, to run koji with it, which will use the `~/.koji` directory that you've prepared outside the container:
```
docker run -it --rm -v$HOME/.koji:/root/.koji:ro koji:latest koji moshimoshi
```

### Alternative as a one-liner

This command does the same as above, but relies on docker caching the result of a `docker build`:
```
docker run -it --rm -v$HOME/.koji:/root/.koji:ro $(docker build -q - <<<$'FROM fedora:41\nRUN dnf install -qy koji') koji moshimoshi
```

## Useful commands

Just a quick list. Make sure to have read and understood our [development process tour](../../../category/development-process).

* Get help about the commands: `koji help` or `koji {command name} --help`.
* Start a build: `koji build [--scratch] {target} {SCM URL}`
* List the builds in a tag: `koji list-tagged {tag name}`
