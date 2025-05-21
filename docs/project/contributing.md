# Contributing

How to contribute to XCP-ng? There are many ways of contributing:
* by giving some of your time to work on the project. Code isn't the only way! Community support, translation, documentation, testing…
* with money, by subscribing to [Pro Support](https://vates.tech), which funds further developments.

## 💁 Help others

You don't have to be a programmer/IT-nerd to help at this project. Just ask or offer your help:

* Forum: [https://xcp-ng.org/forum](https://xcp-ng.org/forum)
* IRC: [irc://irc.oftc.net/#xcp-ng](irc://irc.oftc.net/#xcp-ng)
* Discord: [https://discord.gg/aNCR3yPaPn](https://discord.gg/aNCR3yPaPn)

We are happy about every helping hand!

## 🌍 Translations

[Help us translate the built-in web interface (XO Lite) in more languages!](http://translate.vates.tech/engage/xen-orchestra/)

## ✍️ Write documentation

Contribute to our documentation with pull requests modifying the files in this very documentation. At the bottom of each page (including this one!), you can find a "🖊️ Edit this page" link. Click on it and contribute!

## 🧑‍🔬 Test

It's important to test XCP-ng on many different platforms and devices. You have gear laying around or access to some special devices? -> be a tester and test all the features of XCP-ng 🚀

Your results are very welcome in our [Hardware Compatibility List (HCL)](../../installation/hardware)!

It's also important to test Operating Systems on XCP-ng. You have fun to install different Operating Systems? -> great! Test them all on XCP-ng!

Most community testing is organized on the forum, on dedicated threads.
* Watch the [thread dedicated to update candidates on stable releases](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing) (and make sure you enable mail notifications in your forum settings).
* Check beta and RC announcements for new releases of XCP-ng [on the forum](https://xcp-ng.org/forum), and provide feedback before the final releases. Usually announced in the [News](https://xcp-ng.org/forum/category/11/news) section.
* Check other topics created by our developers who look for feedback about new features. Topics usually created in the [Development](https://xcp-ng.org/forum/category/7/development) section.

You can also read [this](../development-process/tests) for test ideas.

## 🧑‍💻 Develop

You are a developer and want to code with us? Cool!

There are many components, in various languages: C, ocaml, python and more.

* Connect with us via
    * IRC: [irc://irc.oftc.net/#xcp-ng](irc://irc.oftc.net/#xcp-ng) and [irc://irc.oftc.net/#xcp-ng-dev](irc://irc.oftc.net/#xcp-ng-dev)
    * [Discord](https://discord.gg/aNCR3yPaPn)
    * Forum -> Development Corner: [https://xcp-ng.org/forum/category/7/development](https://xcp-ng.org/forum/category/7/development)
* Read [this introduction](../development-process/development). The rest of the [Development Process Tour](../../category/development-process) is also of interest for anyone who wants to help on development.

## 📦 Package

Development is one thing, but for your changes to reach actual users, they need to be packaged into RPMs.

See the [Development Process Tour](../../category/development-process) for an introduction about the packaging process, and useful tips (like: [how to rebuild a RPM for XCP-ng locally](../development-process/local-rpm-build)).

## 📣 Talk about us

Another valuable way to help is by talking about XCP-ng to people you know or to your audience.

## 🪪 Developer Certificate of Origin (DCO)

As a member of the Linux Foundation, XCP-ng asks that every contributor certifies that they are allowed to contribute the code or documentation they submit to us. This is done with a simple
```
Signed-off-by: Full Name <email>
````
line added at the end of the commit message. Git even has an option to add it for you: `git commit -s`. By adding this mention to your commit message, you state that you agree to the terms published at [https://developercertificate.org/](https://developercertificate.org/) (and also written below) for that contribution.

```
Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

DCO is enforced for every repository under the GitHub [`xcp-ng`](https://github.com/xcp-ng) and [`xcp-ng-rpms`](https://github.com/xcp-ng-rpms) organizations.
