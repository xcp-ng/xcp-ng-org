# Contributing

There are two ways of contributing:
* by giving some of your time to work on the project (support, documentation, development...)
* with money, by subscribing to [Pro Support](https://xcp-ng.com/), which funds further developments.

## Helping others

You don't have to be a programmer/IT-nerd to help at this project. Just ask or offer your help:

* Forum: <https://xcp-ng.org/forum>
* IRC: #xcp-ng and #xcp-ng-dev on irc.freenode.net

We are happy about every helping hand!

## Documentation

Contribute to our documentation with pull requests modifying the files at <https://github.com/xcp-ng/xcp-ng-org/tree/master/docs>

## Developing

You are a developer and want to code with us? Cool!

* Connect to us via
    * IRC: #xcp-ng and #xcp-ng-dev on irc.freenode.net
    * Forum -> Development Corner: <https://xcp-ng.org/forum/category/7/development>
* Scroll through our open [Issues](https://github.com/xcp-ng/xcp/issues) to find your first project 🔨

## Testing

It's important to test XCP-ng on many different platforms and devices. You have gear laying around or access to some special devices? -> be a tester and test all the features of XCP-ng 🚀

Your results are very welcome in our [Hardware Compatibility List (HCL)](hardware.md)!

It's also important to test Operating Systems on XCP-ng. You have fun to install different Operating Systems? -> great! Test them all on XCP-ng!


## RPM Packaging

See [Development process tour](develprocess.md) for an introduction about the packaging process and Koji.

### Koji initial setup

#### Certificates
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
You need to import it into your web browser's certificate store and then use it when you log in to <https://koji.xcp-ng.org/>

#### Installing koji
If your Linux distribution provides `koji` in its repositories (e.g. Fedora, CentOS or Mageia), simply install it from there. Else you can either run it from a container, or clone it from <https://pagure.io/koji>, then run it from there with something like `PYTHONPATH=$(realpath .):/usr/lib/python3.5/site-packages/ cli/koji help`. If it fails, you probably need to install additional python dependencies.

#### Configuring koji
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

;certificate of the CA that issued the client certificate
ca = ~/.koji/clientca.crt

;certificate of the CA that issued the HTTP server certificate
serverca = ~/.koji/serverca.crt
```

In some cases, we've found that the configuration file in ~/.koji was not used. Solution: `cp ~/.koji /etc/koji.conf`.

#### Test your connection
`koji moshimoshi`. If it replies to you (in any language), then your connection to the server works.

#### Useful commands

Just a quick list. Make sure to have read and understood [Development process tour](develprocess.md).

* Get help about the commands: `koji help` or `koji {command name} --help`.
* Start a build: `koji build [--scratch] {target} {SCM URL}`
* List the builds in a tag: `koji list-tagged {tag name}`
