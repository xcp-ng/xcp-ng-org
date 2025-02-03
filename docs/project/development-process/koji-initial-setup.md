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
If your Linux distribution provides `koji` in its repositories (e.g. Fedora, CentOS or Mageia), simply install it from there. Else you can either run it from a container, or clone it from [https://pagure.io/koji](https://pagure.io/koji), then run it from there with something like `PYTHONPATH=$(realpath .):/usr/lib/python3.5/site-packages/ cli/koji help`. If it fails, you probably need to install additional python dependencies.

## Configuring koji
Put this in `~/.koji/config`:
```
[koji]

;url of XMLRPC server
server = https://kojihub.xcp-ng.org

;url of web interface
weburl = http://koji.xcp-ng.org

;url of package download site
topurl = http://koji.xcp-ng.org/kojifiles

;path to the koji top directory
topdir = /mnt/koji

; configuration for SSL authentication

;client certificate
cert = ~/.koji/client.crt

;certificate of the CA that issued the HTTP server certificate
serverca = ~/.koji/serverca.crt
```

In some cases, we've found that the `cert` directive in `~/.koji/config ` was not used if there was no such directive in `/etc/koji.conf`. Workaround: add a `cert = ~/.koji/client.crt` to `/etc/koji.conf`, or possibly even `cp ~/.koji/config /etc/koji.conf`.

## Test your connection
`koji moshimoshi`. If it greats you (in any language), then your connection to the server works.

## Useful commands

Just a quick list. Make sure to have read and understood our [development process tour](../../../category/development-process).

* Get help about the commands: `koji help` or `koji {command name} --help`.
* Start a build: `koji build [--scratch] {target} {SCM URL}`
* List the builds in a tag: `koji list-tagged {tag name}`
