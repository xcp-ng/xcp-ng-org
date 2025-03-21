---
sidebar_position: 11
---

# Commit message conventions

Our conventions on commit messages.

## Foreword

XCP-ng and Xen Orchestra are made of many different projects and components. This document is an attempt at defining a minimal, common set of rules for git commit messages we want to follow in the context of those projects. They should be generic and consensual enough that we can follow them for our internal commits, but also when contributing upstream (while following the upstream project's rules, of course).

Individual projects part of XCP-ng or Xen Orchestra can also define additional rules and exceptions. For example, Xen Orchestra developers follow [additional rules coming from the AngularJS guidelines](https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y).

## Goals

The main goals behind the commit message rules are:

* consistency among our repositories,
* easier code review,
* easier code archeology (Good commit messages help a lot when trying to understand a piece of code, especially to answer this essential question: *WHY*?),
* following a set of largely accepted conventions in Free and Open Source Software development,
* be good citizens when contributing to upstream projects.

There could be more goals, but they are not covered by the minimal set of rules in this document. For example: permitting scripting changelog generation, with a separation between security fixes, features and bug fixes. This is left for each individual project to define.

## Structure of a commit message

The widely accepted structure is:

```
Short subject
                             [blank line]
Body:
description
of the
changes
(why and what)
                             [blank line]
Footer
```

## First line: short subject

Here's a challenge: it must remain really short (50 characters is the convention, but in this minimal set of rules we'll allow up to 70 characters), but also ideally answer three essential questions:

* Is it a feature, a bugfix, a security fix, a refactoring, a documentation update, etc. (*type*)?
* What component is modified, if this information is relevant (*scope*)?
* What changed? If contains a verb (recommended), must be in the imperative form (*short change description*).

Why must it be short? So that it fits well in the various tools that display just the first commit history: `git log --oneline`, `gitk`, GitHub, GitLab, etc.

And for the same reason it must be descriptive enough, because there are many situations where only the first line of each commit message is displayed, when browsing the history.

Starts with a capital letter unless the first word is a component name or the subject follows a structured convention that uses lowercase keywords to start the subject. No ending dot.

### Structured subjects vs free structure

Depending on a project's conventions, the format of the first line can be left free, or structured. This document does not enforce one way or the other. Check what conventions the project follows.

An example of structure: `type(scope): short change description`. Example commit subject taken from Xen Orchestra: `feat(xo-server-netbox): optionally allow self-signed certificates`. The first part means that the commit adds a feature to the xo-server-netbox component. If the scope is not relevant, it can be omitted: `type: short change description`.

On the other side, here's an example of a commit subject that doesn't follow a structured convention but still conveys enough information: `Unify documentation style and document all plugins`. The type is documentation, the scope is all plugins, and the change is style unification and added documentation to all plugins.

When there's no structured convention, ask yourself: are the type, the scope and the change obvious in the subject I wrote?

## Second line: blank

Nothing on that line. Period. No exceptions.

## Message body: commit description

This part gets easily forgotten, but it's really important. You don't know who will read your commit, when (could be in ten years from now), what knowledge they will have about the project or about the code. Maybe they're someone from the support that has only minimal knowledge in the programming language. Maybe they're a project manager. Maybe it's a developer who took over this component after you left. And often enough, it will just be yourself scratching your head and asking yourself: "Why the h\*\*\* did I make this change???".

So, here's your opportunity to save someone's day in the future, and maybe yours.

That's why the description must clearly explain:

* The **context** of the change
* **Why** it was needed in the first place (motivation for the change)
* **Why** you chose the solution you chose
* **What** the change is. Contrasts with previous behaviour. Don't paraphrase the code: your description can be higher level. But don't expect people to read your code in order to understand your description either.

To emphasize more on this, here are rules extracted from [this guide about good commit messages](https://www.freecodecamp.org/news/writing-good-commit-messages-a-practical-guide/):

> * Use the body to explain what changes you have made and why you made them
> * Do not assume the reviewer understands what the original problem was, ensure you add it.
> * Do not think your code is self-explanatory

The description is also an introduction, a guide, for people who will review your code before they accept it (or not) in their project. GitHub's interface does not make it straightforward for reviewers to read the commit messages before they review the code, but some reviewers still go for the commit message before anything (and some other review tools give commit messages a better place and allow to comment them as part of the review).

For good examples, go look at the commit history [from the Xen project](http://xenbits.xenproject.org/gitweb/?p=xen.git;a=log;h=HEAD) or [from the linux kernel project](https://github.com/torvalds/linux/commits/master). At first, maybe you'll think "Wow, those commit messages are really verbose, why don't they just rely on the code to understand the changes?". But it's done precisely for the reasons exposed above and is necessary for projects of that scope and gathering so many different contributors, some of which just contribute once then disappear.

Verbs that describe what you did are in the imperative form. Lines should not be longer than 70 characters.

## Message footer

### Referencing issues

Whenever possible, reference public issues or forum threads. No specific wording enforced. It can be for example any of the following, unless the project you are committing to enforces stricter rules:

* `Related to ...`
* `See ...`
* `References: ...`
* `Refs: ...`
* (`Fixes: ...`)
* (`Closes: ...`)
* Etc.

Be careful with "Fixes" or "Closes", because they can automatically close issues when the commit is merged. But what if we want the issues to be closed only when the fix or feature has been fully tested, or publically released? Check the project's processes.

### Developer Certificate of Origin (DCO)

As a member of the Linux Foundation, XCP-ng asks every contributor to certify that they are allowed to contribute the code or documentation they submit to us. See our [contributing](../../contributing#-developer-certificate-of-origin-dco) section for details. This is enforced for every repository under the GitHub `xcp-ng` and `xcp-ng-rpms` organizations.