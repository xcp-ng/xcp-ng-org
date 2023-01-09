# Contributing

There are two ways of contributing:
* by giving some of your time to work on the project (support, documentation, development...)
* with money, by subscribing to [Pro Support](https://xcp-ng.com/), which funds further developments.

## Help others

You don't have to be a programmer/IT-nerd to help at this project. Just ask or offer your help:

* Forum: <https://xcp-ng.org/forum>
* IRC: <irc://irc.oftc.net/#xcp-ng>
* [Discord](https://discord.gg/aNCR3yPaPn>)

We are happy about every helping hand!

## Write documentation

Contribute to our documentation with pull requests modifying the files at <https://github.com/xcp-ng/xcp-ng-org/tree/master/docs>

If you're not familiar will pull requests, but can also simply click the "Help us to improve this page" link at the bottom of any page of the documentation, which will offer a modification form and create a pull request for you.

## Test

It's important to test XCP-ng on many different platforms and devices. You have gear laying around or access to some special devices? -> be a tester and test all the features of XCP-ng 🚀

Your results are very welcome in our [Hardware Compatibility List (HCL)](../Installation/hardware.md)!

It's also important to test Operating Systems on XCP-ng. You have fun to install different Operating Systems? -> great! Test them all on XCP-ng!

Most community testing is organized on the forum, on dedicated threads.
* Watch the [thread dedicated to update candidates on stable releases](https://xcp-ng.org/forum/topic/365/updates-announcements-and-testing) (and make sure you enable mail notifications in your forum settings).
* Check beta and RC announcements for new releases of XCP-ng [on the forum](https://xcp-ng.org/forum), and provide feedback before the final releases. Usually announced in the [News](https://xcp-ng.org/forum/category/11/news) section.
* Check other topics created by our developers who look for feedback about new features. Topics usually created in the [Development](https://xcp-ng.org/forum/category/7/development) section.

You can also read [this](develprocess.md#tests) for test ideas.

## Develop

You are a developer and want to code with us? Cool!

There are many components, in various languages: C, ocaml, python and more.

* Connect with us via
    * IRC: <irc://irc.oftc.net/#xcp-ng> and <irc://irc.oftc.net/#xcp-ng-dev>
    * [Discord](https://discord.gg/aNCR3yPaPn>)
    * Forum -> Development Corner: <https://xcp-ng.org/forum/category/7/development>
* Read [this introduction](develprocess.md#development). The rest of the [Development Process Tour](develprocess.md) is also of interest for anyone who wants to help on development.

## Package

Development is one thing, but for your changes to reach actual users, they need to be packaged into RPMs.

See the [Development Process Tour](develprocess.md) for an introduction about the packaging process, and useful tips (like: [how to rebuild a RPM for XCP-ng locally](develprocess.md#local-rpm-build)).

## Talk about us

Another valuable way to help is by talking about XCP-ng to people you know or to your audience.

## Developer Certificate of Origin (DCO)

As a member of the Linux Foundation, XCP-ng asks that every contributor certifies that they are allowed to contribute the code or documentation they submit to us. This is done with a simple
```
Signed-off-by: Full Name <email>
````
line added at the end of the commit message. Git even has an option to add it for you: `git commit -s`. By adding this mention to your commit message, you state that you agree to the terms published at <https://developercertificate.org/> (and also written below) for that contribution.

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
