---
sidebar_position: 10.5
---

# Pull Request Guidelines {#pull-request-guidelines}

- [Introduction](#introduction)
- [Why we work this way](#why-we-work-this-way)
- [A few core principles](#core-principles)
    - [Assume positive intent](#assume-positive-intent)
    - [Make other people's job as easy as possible](#make-other-peoples-job-as-easy-as-possible)
    - [Own your work](#own-your-work)
    - [Make PRs accessible](#make-prs-accessible)
- [Where to discuss](#where-to-discuss)
- [Expectations from authors](#expectations-from-authors)
    - [Preparing the change](#preparing-the-change)
    - [Take responsibility for your PR](#take-responsibility-for-your-pr)
    - [Keeping the review moving](#keeping-the-review-moving)
    - [Answering a review](#answering-a-review)
- [Expectations from reviewers](#expectations-from-reviewers)
    - [Staying with the review](#staying-with-the-review)
    - [Judging the change](#judging-the-change)
    - [Writing review comments](#writing-review-comments)
- [Merging](#merging)
    - [Two approvals from maintainers](#two-approvals-from-maintainers)
    - [Who merges?](#who-merges)
- [When discussions stall](#when-discussions-stall)
    - [Ask](#ask)
    - [Escalate early](#escalate-early)
- [Open questions](#open-questions)
- [Packaging pull requests](#packaging-pull-requests) (RPM repositories only)
    - [Who reviews](#who-reviews)
    - [If the pull request changes the release](#if-the-pull-request-changes-the-release)
    - [If the pull request does not change the release](#if-the-pull-request-does-not-change-the-release)
    - [Packaging pull requests with several commits](#packaging-pull-requests-with-several-commits)

## Introduction {#introduction}

XCP-ng's git repositories are hosted on GitHub under the [xcp-ng](https://github.com/xcp-ng/)
and [xcp-ng-rpms](https://github.com/xcp-ng-rpms/) organizations.

Contributions to XCP-ng are welcome, from people of all backgrounds and levels of experience.
This page is written to help contributors and maintainers work together effectively, by setting
out what each side can expect of the other. Knowing pull requests in general is not the same as
knowing how we use them: people who all know them well still work with them differently, and
this page says which way we do it here. If the mechanics themselves are new to you, GitHub's
[pull request documentation](https://docs.github.com/en/pull-requests/reference/pull-requests)
covers those.

XCP-ng is made of several sub-projects that work together, maintained by various teams. Some
teams have their own customs. **Members of these teams should not feel constrained by the
principles and rules described in this document.** Have we forgotten to state that there are
several different ways to do something? Have we overstated the importance of a specific rule?
Use your best judgment, and suggest a change if it seems useful. We do try, however, when it
makes sense, to share principles and common rules across the whole XCP-ng team. Cross team
interaction happens all the time.

**Upstream projects may have different rules.** Many of the principles laid out here to help
individuals work together probably still hold, but when we contribute to upstream projects,
which have more stakeholders than just the XCP-ng team, we must conform to the upstream
project's rules.

**Target audience.** The principles, the guidance on preparing a pull request,
and the review etiquette are written both for occasional contributors and regular team
members. A few practices only make sense for members of the XCP-ng team and are marked where
they appear.

**What this document is.** These are the practices the XCP-ng team has agreed on, and they are
not exhaustive. A few of them are enforced, by tooling or by maintainers who will not merge
without them. Most are strong recommendations drawn from experience rather than obligations,
and where the difference matters, we say so. XCP-ng is a live project, its customs evolve, and
we will strive to keep this page current as they do. Individual projects and teams may also
have conventions of their own on top of what is written here, so it is worth asking if you are
unsure.

**If you get something wrong.** That is normal while you are still learning how we work with
pull requests in the XCP-ng project, and it is generally recoverable. A first pull request
often takes a few rounds, and nobody is keeping score of how many. If a review comment doesn't
make sense to you, say so and ask: that is expected of you, not held against you.

## Why we work this way {#why-we-work-this-way}

What we are here for is that the people who run XCP-ng get something that works, keeps working,
and keeps getting better. Pull requests are one of the places where that is decided: the last
point where a mistake is still cheap, and the point where one person's work becomes the
project's.

We hold high standards regarding commit messages, git history, and pull request quality. They
come from years of experience maintaining complex software projects, and from practices widely
adopted across successful open-source communities. None of it is meant as a hurdle. It is how we
reach the quality and the reliability we aim for.

What follows in this page is how we usually meet the project's needs. The needs are what matters:
if you are in a situation where a practice does not serve them, do it differently and state it
if useful.

People run XCP-ng in production, often on critical infrastructure. Whatever form a regression
takes, it reaches the work of everyone whose workloads depend on those machines.

Not every repository carries that weight, and these guidelines do not pretend otherwise. Each
kind of work has its own version of it: documentation is a reference that people act on, so it
has to be accurate; a test is only worth having if it is maintainable and actually tests
something; the tooling we write is what the rest of the team relies on to do their work. Judge
the care a change deserves by what depends on it.

Review is one of the few systematic checks we have, and what it catches depends on what it can
see. A reviewer works from the code, from what the change says about itself, and from what the
author chose to point out. Providing all of it is what gives an approval its meaning.

As most of us don't see each other in person, we also put a strong emphasis on the importance
of context and communication.

## A few core principles {#core-principles}

Reviews go well when there is shared context, clear expectations, prompt replies,
responsibility, and a willingness to give each other the benefit of the doubt. Those matter
more than technical brilliance, which is why the principles below are mostly not about code.

They apply to authors and to reviewers alike.

### Assume positive intent {#assume-positive-intent}

**Review comments are about the proposed change, not about the person proposing it.**

As an author, assume that comments are made in the interest of the project. As a reviewer,
assume that the author acted thoughtfully and with good intentions unless there is evidence
to the contrary. Most conflicts disappear when everyone starts from this assumption.

### Make other people's job as easy as possible {#make-other-peoples-job-as-easy-as-possible}

PRs are merged faster and are of better quality when the author cares about the reviewers' needs
and vice versa.

### Own your work {#own-your-work}

Generally, in the XCP-ng project (there can be local exceptions in some repositories):

**As an author**, opening a pull request usually means: "I believe this change is ready to
be considered for integration as it is."

**As a reviewer**, your approval means "I agree with the proposed change and I consider
that I have enough information about its impact" (including possible regressions, tests,
documentation that needs updating, impact on other projects...).

### Make PRs accessible {#make-prs-accessible}

**Prefer text to images. When an image is genuinely the right medium, describe it.**

A screenshot does not reach a blind or low-vision reader, and much of what gets screenshotted
was text to begin with. A terminal session, a log excerpt, a stack trace: paste those into a
fenced code block instead. Text can be read aloud, searched, quoted, and copy-pasted; a
screenshot of a terminal is none of those things, however careful its alt text.

When you show a chart or a benchmark, give the numbers as well. The picture shows the shape of
the result; the data is what a reviewer can check.

Some things really are visual, such as a UI layout or a rendering glitch. Describe what the
image shows, not what it is. Consider any tool that renders images, not only GitHub.

> **Prefer:**
> `![The host list, with the second host greyed out and marked "unreachable"](screenshot.png)`
>
> **Over:**
> `![screenshot](screenshot.png)`

## Where to discuss {#where-to-discuss}

In several places in this document we stress that talking can overcome many obstacles. But
where should those discussions happen?

For occasional contributors, the main channels are
[GitHub issues](https://github.com/xcp-ng/xcp/issues), the pull request's own description and
comments ([when there is a pull request](#designs-and-discussion-before-impactful-changes)), and
[the forum](https://xcp-ng.org/forum/), which is a good place to collectively diagnose an issue
or discuss improvements. See
[Where discussion happens](../release-process-overview#where-discussion-happens) for the full
list of the project's channels.

XCP-ng team members use these too, and have extra channels at hand: internal chat, and live
conversation, in person or remote. Those are precious tools and the team should use them,
especially when discussions in the PR itself seem to stall. But XCP-ng is an open project,
so the outcome must be public: design documents, code, and the reasoning behind a decision
all belong somewhere anyone can read them. When a discussion that shaped a pull request
happened out of sight, summarize it in the pull request itself. A contributor or a user who
cannot see why a decision was made is entitled to ask for that context.

## Expectations from authors {#expectations-from-authors}

### Preparing the change {#preparing-the-change}

#### Designs and discussion before impactful changes {#designs-and-discussion-before-impactful-changes}

If you are going to work on a change that involves refactoring code you don't maintain, that
impacts other teams because it adds new requirements, that changes the way a product behaves
for users before you have talked to the maintainers (to fix a complex bug, for example), or
that affects other people's tooling and processes...

**Then it's probably not time yet for a pull request.**

Instead, it's probably time to write down the requirements, if that is not done already, and to
produce a design together with every party involved.

Similarly, if you are already deep into implementing something and discover that you need
changes with that kind of impact...

**Step back, and go talk with the stakeholders.**

See [Where to discuss](#where-to-discuss).

:::warning
This is not a rule about how you work (though, some maintainers can enforce it for components
they maintain). It is a strong recommendation drawn from experience: it can spare you a long
implementation you then have to start over, and spare the maintainers from having to tell you
that your requirements were wrong or incomplete, or your design not the right one.
:::

#### Draft pull requests {#draft-pull-requests}

In the general case (individual teams may work differently on some repositories), submitting a
pull request in the XCP-ng project means "I believe this change is ready to be considered for
integration as it is."

A draft pull request can be a way to ask for early feedback while making it obvious that the
change is not ready for inclusion yet.

Note: not all reviewers watch draft pull requests. We recommend stating explicitly that you
need feedback, and considering asking for a real-time discussion if useful.

When taking a pull request out of draft, add the reviewers (GitHub usually suggests them)
and leave a comment saying that it is ready for review. The state change on its own is
very easy to miss.

#### Choose the target repository and branch {#choose-the-target-repository-and-branch}

See [Git repositories](../../gitrepo) for where the code lives, and
[Tags and maintenance branches](../tags-maintenance-branches-in-our-code) for which branch to
target. Individual repositories may also have their own documentation covering this.

If this doesn't answer your questions, feel free to [reach out](#where-to-discuss).

Regular contributors who have write access to the repositories should create their PR branches
directly on the repository rather than in external forks. This facilitates running CI checks
(usually disabled by default for external PRs due to security settings) and working together
on a branch.

#### Keep pull requests focused {#keep-pull-requests-focused}

**Each pull request should address a single concern whenever practical.**

Focused pull requests are easier to understand, review, test, merge, and revert if necessary. A
mixed pull request cannot be accepted or rejected as a unit: if the cleanup is fine but the
feature needs another round, everything waits, including the cleanup.

This is a general principle, not a strict rule. Feel free to adapt to the situation.

#### Keep pull requests reasonably small {#keep-pull-requests-reasonably-small}

**Review quality decreases as change size increases.**

A 100-line pull request is usually reviewed carefully.

A 1,000-line pull request is often skimmed.

When possible, split large changes into smaller logical steps.

This is a general principle, not a strict rule. Feel free to adapt to the situation, of course.

#### Keep your commit history meaningful {#keep-your-commit-history-meaningful}

**Commit history is part of the project. Commits should tell a coherent story.**

Read [XCP-ng's commit message conventions](../commit-message-conventions). Two things to avoid,
for example: commits with just a title and no body, and overly verbose commit messages with a
low signal-to-noise ratio.

Inside a single PR, avoid histories that:

- introduce something only to remove it later
- require readers to reconstruct what happened

Reviewers may need to review pull requests commit by commit, in order to digest larger
changes as smaller chunks and provide a more pertinent review. And a clean git history inside
the PR branch is anyway beneficial to the project's git history after the merge.

It is usually worth taking a few minutes to rework your history before requesting review. Doing
so may well save a round of review.

#### Write a meaningful PR title and description {#write-a-meaningful-pr-title-and-description}

Context is key to empowering the reviewer.

**The title must describe what changes. The description must explain why, and give the
reviewers enough context to make their review efficient.**

The description should usually address the following questions.

- Why are we doing this? (What problem exists or what goal are you pursuing?)
- What does this PR change?
- Why was it implemented this way? (Is this the implementation of a design that the reviewers
  can consult? If not, what design decisions have you taken that are worth considering during
  the review?)
- What was tested, and how can we verify it works?
- What should we pay particular attention to? Will it have an impact worth knowing about?
  (especially if it changes user habits, documented behaviours, processes, or significantly
  affects components maintained by other people)
- What are the known limitations or trade-offs? (better state them upfront rather than let the
  reviewers find out themselves)

The goal isn't to make the description exhaustive. It is to provide the context and reasoning
that help the reviewers understand your changes better and faster, and to give them some
insight into how you worked, so that they can judge how far to trust that the design is sound,
the changes are tested, and the impact has been assessed.

You may also add links to build logs, artifacts and test results when relevant.

Repository-specific pull request templates must be followed when available.

Titles are worth a moment of thought, because they are what everyone else sees in e-mail
notifications or in a list of fifty pull requests:

> **Weak:** device lock release
>
> **Better:** storage: release the device lock when attach fails

#### Be your first reviewer {#be-your-first-reviewer}

**Opening a pull request is not the next step after pushing commits. Self-review is.**

This is probably one of the most important and most underestimated principles.

Review:

- the code
- the commit history
- the commit messages
- the pull request description
- the target branch
- anything else worth checking before asking for the review

Many review comments should never need to be written, because the author caught the issue
first. With experience comes the ability to review one's own pull requests almost as if
reviewing somebody else's work.

**Minutes not spent here are not saved.** They will very likely come back as other people's
work, another round of review, and a delayed merge.

Of course, it is fine not to be an expert, and to miss things that an expert would spot.
That is not what this is about. It is about the mistakes that a few extra minutes of
self-review would have caught.

:::tip
An AI tool can be a useful extra pair of eyes here, especially if you ask it to be critical,
and to look at the commit messages and the description as well as the code. It replaces neither
your own review nor your responsibility for the result.
:::

### Take responsibility for your PR {#take-responsibility-for-your-pr}

As stated earlier, in the XCP-ng project, opening a pull request means: "I believe this change
is ready to be considered for integration as it is."

You own the proposed changes. You have reviewed them yourself. You have tested them. You have
considered the impact. **Reviewers are not your primary quality-control mechanism.**

If you have doubts about important parts of the pull request, don't open it yet. Go back to
design and discussion, possibly around a draft.

If you have doubts about minor details, state them upfront when opening the PR. A note in the
description or a comment on the line usually does it.

Reviewers much prefer that to discovering mid-review that part of the change relies on
assumptions that should have been either verified or made explicit.

**If you used tools to help produce the changes, you remain fully responsible for the result.**
You should understand every line you are proposing and be able to explain why it is there:

> "I'm not sure why that line is there. The tool added it."

That is not an answer a reviewer who has spent time reviewing should ever have to read.

There may be exceptions in particular repositories. By default, the above applies.

### Keeping the review moving {#keeping-the-review-moving}

Now the pull request is open. Let's bring it to completion together with the reviewers.

#### Ask for review {#ask-for-review}

Review requests are usually created automatically when you open a pull request (see [Reviewer
teams](#reviewer-teams)), so most of the time there is nothing for you to do here.

#### Reviewer teams {#reviewer-teams}

Many git repositories in the XCP-ng project have a CODEOWNERS file that points to teams
rather than to individuals, so GitHub requests the review from a whole team automatically.

The members of a reviewer team share the responsibility for reviewing the pull request. The
first member to leave a review becomes the team's representative on it. If they would rather
not decide on the team's behalf alone, they can re-request a review from the team to get a
second opinion.

Do not re-request a review from a team just to notify it of what is happening on the pull
request. Re-requesting means that we will wait for another review before merging.

You can also request from individuals if you know exactly who you need and they agree with
being asked directly for review. However, avoid adding lots of reviewers just in case one may
have time to review. Unless that's how your team works on this repository, this is not
wanted.

#### Be responsive {#be-responsive}

**Reviews only work when participants remain engaged.**

Participants involved in a review are expected to monitor review notifications and respond
in a timely manner. Review workflows break down when participants become unreachable. Long
delays create context switching, merge conflicts, frustration, and reduced throughput.

It's important for reviewers to be responsive. It is possibly even more important for authors
to be responsive to reviews: a reviewer who has paged your change into their head loses that
context quickly, and a pull request that goes quiet for some time usually has to be reviewed
again from the start once updated.

### Answering a review {#answering-a-review}

#### Craft and test your PR updates {#craft-and-test-your-pr-updates}

Never assume that a small change is automatically safe. A surprising number of review
cycles are spent catching mistakes introduced while addressing previous comments. The last
edit, made when the work already feels finished, is the one that tends to get the least
attention.

Treat pull request updates with the same attention as the initial pull request. Resist the
urge to rush them.

And, most importantly, **when addressing review comments, test the updated code again**, and
say so explicitly.

There are, of course, exceptions to this rule. Use your best judgment. But don't
underestimate the risk.

#### Reply to comments, and request re-review explicitly {#reply-to-comments-and-request-re-review-explicitly}

**Reply to the comments you addressed, and let the reviewer mark them resolved.**

General XCP-ng project rule. May differ in some specific team workflows.

The reviewer should generally be the one who decides whether a concern has been resolved.
Closing your own threads removes the conversation from view before the person who raised it
has agreed that it is settled.

Then ask for re-review explicitly. Do not assume that pushing commits means "please come
back and review again": reviewers cannot tell whether you are done with your changes. Ask
again after **any meaningful change**, not only when the pull request carries a "changes
requested" status. A diligent reviewer may come back on their own after a push, which is
fine, but nothing except an explicit request reliably marks the pull request as ready for
another round.

Leave a comment saying what you changed:

> Addressed all the review comments: error handling reworked as suggested, and the two
> nitpicks fixed.

**Then re-request the review through GitHub's UI or API.** In the UI, the button sits next
to the name of each reviewer who has requested changes, previously approved, or left
comments.

There is one exception. A reviewer who is still pending, meaning that they have not reviewed
since the last time they were asked, has no re-request button, so mentioning them in a
comment is the only way to notify them.

#### Explain what your push contains {#explain-what-your-push-contains}

Some reviewers will get a notification for every push made to a PR they follow. Some will not,
depending on their settings.

For those who get them, the notification alone is not enough to tell whether they should come
back and review or wait for more changes.

And the rest won't even know that you pushed an update.

**Thus, it is strongly recommended to always add a comment to explain what the last push
was about.**

Even when notified of the push by GitHub, a reviewer cannot tell from the notification alone
whether you rewrote the heart of the change, fixed a typo, or simply rebased. The difference
decides whether they need to review from scratch and whether an earlier approval still means
anything.

And, as stated earlier, re-request a review if necessary.

Examples:

> That was just a rebase onto master. The diff is unchanged.

> Force-pushed: reworked the second commit, the other three are untouched.

You may choose to ignore this recommendation if you are **sure** that the reviewers will know
what to do anyway.

## Expectations from reviewers {#expectations-from-reviewers}

Reviewing can sometimes be seen as time taken away from your real work. On the contrary, it is
some of the most important work you do on the project.

Reviewing is real engineering work. It is also how somebody else gets to move forward, and it
is where you act as a (helpful) gatekeeper: nothing reaches our users without a reviewer
having said yes to it.

### Staying with the review {#staying-with-the-review}

#### Review promptly {#review-promptly}

Reviewing someone's work is a way to help them move forward with their task. Doing so promptly
reduces context switching and encourages the author to answer promptly in turn, in a virtuous
circle.

On the other hand, review delay is a common source of friction in software development. We
don't want to be one of these projects where opening a pull request comes with uncertainty
about the review delays, and where authors may give up after weeks or months of waiting.

In general, most PRs should receive their first reviews within one day, unless they are
particularly big. Even earlier, if possible.

This is not just individual responsibility: many review requests are addressed to teams, and,
collectively, these teams must ensure they tend to their reviews. Especially when they
involve other teams.

If you are directly involved in a pull request and cannot give it a proper review for a
while, see [See the review through, or hand it over](#see-the-review-through-or-hand-it-over).

#### See the review through, or hand it over {#see-the-review-through-or-hand-it-over}

**The reviewers who start on a pull request stay with it until it is merged or closed, unless
they say otherwise.**

If you do need to stop, say so explicitly, because GitHub will not say it for you. Your
reviewer state is computed from the history of events on the pull request, so removing
yourself from the list of reviewers usually does not work, and even dismissing your previous
review is often not enough. The author is left unable to tell whether they are still waiting
for you. Also consider adding another reviewer (team or individual) to replace you if needed.

State it in a comment, and make sure any thread you started is either resolved or explicitly
taken over by another reviewer.

> I'm dropping off this one. Someone closer to the storage code should judge that part. My
> thread about error handling is resolved as far as I'm concerned.

### Judging the change {#judging-the-change}

#### Review more than the code {#review-more-than-the-code}

**The diff is only part of the change.**

Also review the pull request description, the commit history and messages, evaluate the overall
impact, **ensure that the requirements are clear** and conform to the objectives of the project,
consider documentation updates and testing, if appropriate...

**In general, approving means you also approve the commit messages and the pull request
description.**

Do not approve if they are not ready yet, or we may end up merging without ever fixing them.

Instead, you can leave a comment saying that you are ready to approve as soon as the last
details are settled.

#### Take responsibility for your review {#take-responsibility-for-your-review}

Your review may engage your team, or the XCP-ng project. It is real engineering work.
That a review must be prompt does not mean that it has to be rushed.
It is a difficult balance, but a fundamental one.

### Writing review comments {#writing-review-comments}

#### Distinguish preferences from requirements {#distinguish-preferences-from-requirements}

**Make it obvious whether your comment is blocking, a suggestion, or a nitpick.**

Not every comment has the same weight, and the author cannot read your mind: an unlabelled
remark about naming looks exactly like an unlabelled remark about a race condition.
Be explicit about it.

> nitpicking: I'd have called this `device_id`, but it's fine as it is.

> A question rather than a request: is the retry count deliberate here?

> This must be fixed before merge: the error path leaves the lock held, so a failed attach
> wedges the device until reboot.

The last one has earned the word *must*, because it says what breaks and why. Reserve it
for those cases and authors will trust it.

#### Explain your reasoning {#explain-your-reasoning}

Avoid:

> Don't do this.

Prefer:

> This introduces a dependency cycle that may complicate testing and maintenance.

Review comments are more useful when they explain both the concern and the reasoning behind
it. Teach rather than command: ideally the author finishes the review able to make the same
judgement themselves next time.

#### Prefer threads over pull-request-level comments {#prefer-threads-over-pull-request-level-comments}

**Attach comments to code whenever you can, so that they become resolvable threads.**

On GitHub, a pull-request-level comment cannot be resolved and cannot be tracked. It scrolls
away as the conversation grows, and it's harder to tell whether it was ever addressed. A
thread has a state, open or resolved, that everyone can see.

When your comment is not about a specific line, **you can still start a thread by attaching
it to a file instead of to the pull request**. It is a workaround for a weakness in GitHub's
interface, and it is worth the small detour.

#### Be aware of comment volume {#be-aware-of-comment-volume}

Large numbers of comments can be intimidating. Provide overall context. Thirty comments with no
summary read as "this change is a disaster", even when twenty-eight of them are minor.
One sentence fixes that:

> Overall looks good. Most comments are minor readability suggestions. Only the comments
> regarding error handling are blocking.

Also, avoid using review comments to "think out loud", or to comment on things outside the
focus of the current pull request. No comment is better than a confusing comment.

Regarding comment length: sometimes a comment needs to be long, to provide enough context and
enough nuance. Still, consider the cost for those who will have to read it.

#### Acknowledge good work {#acknowledge-good-work}

**Reviews should not always consist exclusively of criticism.**

Positive feedback reinforces good practices and helps maintain a healthy review culture. It
is also useful information: knowing which parts you found clear tells the author what to do
again.

> The way you split these commits made this very easy to follow. Thanks!

This is not a rule, this is a recommendation: when you honestly find something positive,
consider stating it.

## Merging {#merging}

### Two approvals from maintainers {#two-approvals-from-maintainers}

This is a general rule. Some repositories of the project may follow different rules.

In the XCP-ng project, a pull request is generally mergeable once two maintainers of the target
repository have approved it. The maintainers are usually identified as a team rather than as
individuals.

When more than two people are involved in the review, we try to get an approval from each of
them, or a statement that they are happy to leave the decision to the others and have no
unaddressed blocking comment.

An open nitpick is not a reason to hold a merge. An unresolved blocking comment is.

A pull request should not stay blocked, however, because one reviewer commented once and never
came back to approve. Try to reach out to them first. If they remain unresponsive, you can
reach out to their team (via the team's GitHub handle) or, if applicable to your situation, ask
a project lead to arbitrate and merge anyway. They will check whether any blocking comment is
left, and if there is none and enough people have approved, they will merge without waiting for
the unresponsive reviewer.

If at any point anyone feels stuck with a pull request, whether as the author or as a
reviewer waiting for the author to respond, the right reflex is to talk quickly (see
[Where to discuss](#where-to-discuss)).

### Who merges? {#who-merges}

The general rule is: let the maintainers merge.

Then, there are notable exceptions. In particular, in the whole `xcp-ng-rpms` GitHub
organization, it is usually the author of the PR who will merge the PR and then
immediately trigger a build in koji. Except when the author doesn't have enough
credentials to trigger builds by themselves. Then, let the maintainers merge.

Outside this, specific repositories may also follow different rules. When in doubt, as the
author, don't merge it yourself.

## When discussions stall {#when-discussions-stall}

### Ask {#ask}

**You are entitled to ask again for a review that has not come, or for a response from an
unresponsive author.**

Really, you shouldn't hesitate to ask, and a polite reminder on the pull request itself is
always acceptable. Members of the XCP-ng team who would rather not ask directly can ask a
coordinator or facilitator to relay it for them.

### Escalate early {#escalate-early}

**Long comment threads are often a sign that written communication is no longer the most
effective tool.**

If a discussion is not converging after several exchanges, move it to a channel with more
bandwidth (see [Where to discuss](#where-to-discuss)):

- schedule a call
- pair review
- discuss synchronously

Many disagreements that take hours in comments, and days or weeks in delays, disappear in
minutes of conversation.

If this is not enough to resolve the issue, escalate to a person or a team who can
arbitrate.

## Open questions {#open-questions}

One point is still under discussion, so it is **not policy and should not be cited as a
rule**: it has been suggested that comments and commit messages refer to people by their
e-mail address or GitHub handle rather than by their full name. No decision has been taken,
and it is recorded here so that anyone who wants to weigh in knows the question is open.

## Packaging pull requests {#packaging-pull-requests}

*This section only concerns the RPM packaging repositories (`xcp-ng-rpms`).
If you are not touching one, you can stop reading here.*

Packaging pull requests carry an extra obligation: the change is not finished when it is
merged, because the package still has to be built.

### Who reviews {#who-reviews}

Each package has a maintainer team, which must approve the pull request. The release team
(OS Platform & Release) must approve it as well.

When the maintainer team is the OS Platform & Release team itself, two members of that team
must approve.

### If the pull request changes the release {#if-the-pull-request-changes-the-release}

**A build from the target branch must follow the merge.**

Bumping the release is a statement that a build carrying that release exists, or is about
to. Merging and then forgetting the build leaves the branch claiming a version that was
never produced.

### If the pull request does not change the release {#if-the-pull-request-does-not-change-the-release}

On rare occasions, a pull request brings changes that we do not want to build yet, and
that should be stacked for the next build instead. In that case, leave the `Release:` tag
alone and list the changes in a comment above the changelog, for inclusion in the changelog
of the next build.

Otherwise the work disappears: the next person to bump the release is likely to miss what
accumulated since the last build, and the changelog silently loses entries.

> ```spec
> # Changes since the last build, to fold into the next changelog entry:
> # - fix the device lock leak on failed attach
> # - drop the patch that went upstream
> %changelog
> * ...
> ```

Another accepted convention:

> ```spec
> %changelog
> # * next
> # - fix the device lock leak on failed attach
> # - drop the patch that went upstream
> * ...
> ```

In both cases these are comments rather than an incomplete changelog entry, so that the spec
file does not trigger linting errors.

### Packaging pull requests with several commits {#packaging-pull-requests-with-several-commits}

Ideally, only the last commit updates the `Release:` tag and the changelog, and the earlier
commits stack their changelog items as comments, as described above. When rebasing on
upstream packaging, however, `Release:` and the changelog may have to be updated right from
the first commit, which is a merge commit from a branch describing the upstream packaging
state.

One way to handle this is to bump the `Release:` tag as soon as it makes sense, but to
suffix the changelog entry with ` - WIP`.

```spec
%changelog
* Mon Aug 10 2026 Firstname Lastname <firstname.lastname@...> - 3.14-2.1 - WIP
- Rebased, but our patchqueue must be updated in next commit
- Rebase on upstream 3.14-2 package.
- *** Upstream changelog ***
  [...]
```

The suffix doesn't cause linting errors.

Then, in the last commit, complete the changelog, and remove the suffix.

```spec
%changelog
* Mon Aug 10 2026 Firstname Lastname <firstname.lastname@...> - 3.14-2.1
- Patch xxx.patch dropped, merged upstream.
- Patch yyy.patch re-diffed to apply on the new sources.
- Rebase on upstream 3.14-2 package.
- *** Upstream changelog ***
  [...]
```
