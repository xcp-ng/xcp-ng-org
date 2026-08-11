---
sidebar_position: 10.5
---

# Pull Request Guidelines

XCP-ng's git repositories are hosted on GitHub under the [xcp-ng](https://github.com/xcp-ng/)
and [xcp-ng-rpms](https://github.com/xcp-ng-rpms/) organizations.

Contributions to XCP-ng are welcome, from people of all backgrounds and levels of experience.
This page is written to help contributors and maintainers work together effectively, by setting
out what each side can expect of the other.

Good code review is not only about code quality. It is also about collaboration, knowledge
sharing, collective ownership, and efficient use of everyone's time.

We do hold high standards regarding commit messages, git history, and pull request quality,
and those standards come from years of experience maintaining complex software projects, as
well as practices widely adopted across successful open-source communities. None of what
follows is meant as a hurdle. It is here to spare someone, quite possibly you, a wasted round
of review.

**Who this document applies to.** The principles, the guidance on preparing a pull request,
and the review etiquette apply to everyone. A few practices only make sense for members of the
XCP-ng team and are marked where they appear.

**What this document is.** These are the rules the team has agreed on, and they are not
exhaustive. XCP-ng is a live project, its customs evolve, and we will strive to keep this page
current as they do. Individual projects and teams may also have conventions of their own on
top of what is written here, so it is worth asking if you are unsure.

**If you get something wrong** while you are still learning how we work with pull requests,
that is normal, and it is generally recoverable. A first pull request often takes a few
rounds, and nobody is keeping score of how many. If a review comment doesn't make sense to
you, say so and ask: that is expected of you, not held against you.

## Contents

- [A simple rule](#a-simple-rule)
- [Core principles](#core-principles)
- [Before opening a pull request](#before-opening-a-pull-request)
    - [Is a pull request the right vehicle?](#is-a-pull-request-the-right-vehicle)
    - [Preparing the change](#preparing-the-change)
- [During review: expectations for authors](#during-review-expectations-for-authors)
    - [Keeping the review moving](#keeping-the-review-moving)
    - [Answering a review](#answering-a-review)
- [During review: expectations for reviewers](#during-review-expectations-for-reviewers)
    - [Staying with the review](#staying-with-the-review)
    - [Judging the change](#judging-the-change)
    - [Writing comments](#writing-comments)
- [Merging](#merging)
- [When discussions stall](#when-discussions-stall)
- [Open questions](#open-questions)
- [Packaging pull requests](#packaging-pull-requests) (RPM repositories only)

## A simple rule

Many experienced teams follow the same simple principle, stated once for each side of a
review.

For authors:

> Take responsibility for what you propose, and make the reviewer's job as easy as possible.

A review does not transfer ownership. You are answerable for the change before you open it,
and still answerable after it merges.

For reviewers:

> Take responsibility for what you approve, and leave the author feeling respected.

Both rules open the same way on purpose: each side is answerable for what it puts its name
to. When both sides follow these principles, reviews are faster, discussions are more
productive, what gets merged is of high quality, and the project benefits.

## Core principles

Reviews go well when there is shared context, clear expectations, prompt replies, and a
willingness to give each other the benefit of the doubt. Those matter more than technical
brilliance, which is why the principles below are mostly not about code.

### Assume positive intent

**Review comments are about the proposed change, not about the person proposing it.**

As an author, assume that comments are made in the interest of the project. As a reviewer,
assume that the author acted thoughtfully and with good intentions unless there is evidence
to the contrary. Most conflicts disappear when everyone starts from this assumption.

A blunt comment is usually a rushed comment rather than a hostile one. It costs nothing to
read it as the technical observation it almost certainly is:

> **Read "This lock is held across the whole loop" as:** here is a problem with the code.
>
> **Not as:** you clearly don't understand locking.

### Don't make people guess

**Be explicit. Provide context, explain your reasoning, and state your assumptions.**

The reviewer should not have to reverse-engineer the author's intentions from a diff, and
the author should not have to reverse-engineer the reviewer's concerns.
**A few minutes spent writing context can save hours of back-and-forth discussion.**

The same change, described two ways:

> Fix the timeout.

> The default timeout is shorter than the worst case we measured on slow storage, so attach
> operations fail intermittently under load. This raises it to cover the measured worst
> case. I deliberately left the retry logic alone. The second commit explains why.

The second version answers the questions a reviewer would otherwise have to ask, and each
question they don't have to ask saves a round trip.

This applies to the state of a pull request as much as to its content. Taking it out of
draft, what a push contained, whether you are still waiting or have already finished
reviewing: none of that announces itself, so several of the rules further down are this same
rule applied to those moments.

### Respect everyone's time

**Reviewing is part of the job, not an interruption to it.**

A reviewer who treats review as what they do once their real work is done will always be
late, and the team pays for it in stale branches, conflicts and rework.

It belongs in your week like any other engineering task, and it is worth protecting time
for.

### Own your work

**Opening a pull request means: "I believe this change is ready to be considered for
integration."**

You own the proposed changes. You have reviewed them yourself. You have tested them.
Reviewers are not your primary quality-control mechanism.

If you used tools to help produce the changes, you remain fully responsible for the result.
You should understand every line you are proposing and be able to explain why it is there:

> "I'm not sure why that line is there. The tool added it."

That is not an answer a reviewer can do anything with.

### Make PRs accessible

**If a description or a comment includes an image, add a text alternative.** A screenshot of
a failure, a graph, a UI change: none of it reaches a blind or low-vision reader without alt
text, so describe what the image shows. This holds in any tool that renders images, not only
GitHub.

> `![The host list, with the second host greyed out and marked "unreachable"](screenshot.png)`

## Before opening a pull request

### Is a pull request the right vehicle?

#### A pull request is not an RFC

**A pull request proposes to integrate a change. Whether the change should exist at all is a
different conversation, and it should usually happen first.**

Large architectural changes, process changes, workflow changes, significant new features,
and unplanned changes that noticeably affect users should generally begin with discussion
before code is written: an issue, a design document, a discussion thread, or a meeting with
the relevant stakeholders.

Starting from a solution shifts the work onto reviewers, who then have to recover the
underlying need, identify missing constraints, supply the architectural context and weigh the
alternatives, all without taking the change over and doing it themselves. It also frames the
discussion around your implementation instead of around the need, and it can crowd out work
that was already planned.

Initiative is good, though, and a prototype is genuinely useful: building and testing one
answers questions that a design document cannot, such as whether the approach works at all,
what it costs, and what it breaks. A draft pull request is therefore an acceptable place to
hold this discussion, as long as the design rather than the code remains the subject of it.
That means:

- Saying in the description that the design is what you want discussed, and that the
  prototype may be thrown away.
- Explaining the need, the design, and the alternatives you considered in words. Nobody
  should have to reconstruct your reasoning from the diff.
- Accepting that the discussion may move elsewhere if the question turns out to be wider
  than the prototype.

The lighter option is to ask first:

> I ran into this problem and prototyped something to understand the shape of it. Before I
> open a pull request: is this a problem we want to solve now, and is this the right
> direction? I can share the branch if it's useful.

#### A pull request is not a bug report

**If you discover a bug but are not familiar with the code, consider discussing it before
investing significant effort in a fix.**

A proposed fix from a newcomer may solve the symptom while missing part of the problem.
Maintainers may already be aware of the issue, have additional context, or have a preferred
direction for addressing it. This applies equally, perhaps especially, before setting an
AI agent to work on it.

When in doubt, start by discussing the problem.

This is general advice, not a strict rule.

#### Draft pull requests

**Use a draft when the pull request is not ready to be merged.**

Two everyday cases: the work is still in progress and you want early feedback, or it is
finished but you would like someone to help you proofread it before you submit it to the
maintainers. Using a draft to discuss whether a change should exist at all is the different
matter covered above.

When taking a pull request out of draft, add the right reviewers and leave a comment saying
that it is ready for review. The state change on its own is easy to miss.

### Preparing the change

#### Keep pull requests focused

**Each pull request should address a single concern whenever practical.**

Avoid:

- feature + refactoring
- bug fix + cleanup
- documentation update + unrelated code changes
- "while I was here" changes

Focused pull requests are easier to understand, review, test, and merge. A mixed pull
request cannot be accepted or rejected as a unit: if the cleanup is fine but the feature
needs another round, everything waits, including the cleanup.

#### Keep pull requests reasonably small

**Review quality decreases as change size increases.**

A 100-line pull request is usually reviewed carefully.

A 1,000-line pull request is often skimmed.

When possible, split large changes into smaller logical steps.

#### Review your own work first

**Opening a pull request is not the next step after pushing commits. Self-review is.**

This is probably one of the most important and most underestimated principles.

Review:

- the code
- the commit structure
- the commit messages
- the pull request description

Many review comments should never need to be written, because the author caught the issue
first. Many experienced engineers review their own pull requests as if they were reviewing
somebody else's work.

**Minutes not spent here are not saved.** They often come back as other people's work,
another round of review, and a later merge.

Of course, it is fine not to be an expert, and to miss things that an expert would spot.
That is not what this is about. It is about the mistakes that a few extra minutes of
self-review would have caught.

#### Write meaningful commits

**Commit history is part of the project. Commits should tell a coherent story.**

Avoid histories that:

- introduce something only to remove it later
- mix unrelated concerns
- contain "fix review comment" commits
- require readers to reconstruct what happened

Rework your history before requesting review. The audience for a commit message is whoever
runs `git blame` on that line in three years, which may well be you.

As a reminder, see also
[XCP-ng's commit message conventions](https://docs.xcp-ng.org/project/development-process/commit-message-conventions/).

#### Write a meaningful PR title and description

**The title must explain what the change does. The description must explain why it exists.**

The description should answer:

- What problem exists?
- Why was this approach chosen?
- What alternatives were considered?
- What should reviewers focus on?

Repository-specific pull request templates must be followed when available.

Titles are worth a moment of thought, because they are what everyone else sees in a list of
fifty pull requests:

> **Weak:** device lock release
>
> **Better:** storage: release the device lock when attach fails

## During review: expectations for authors

### Keeping the review moving

#### Ask for review

Review requests are usually created automatically when you open a pull request, so most of
the time there is nothing for you to do here.

#### Reviewer teams

Many git repositories in the XCP-ng project have a CODEOWNERS file that points to teams
rather than to individuals, so GitHub requests the review from a whole team automatically.

The members of a reviewer team share the responsibility for reviewing the pull request. The
first member to leave a review becomes the team's representative on it. If they would rather
not decide on the team's behalf alone, they can re-request a review from the team to get a
second opinion.

Do not re-request a review from a team just to notify it of what is happening on the pull
request. Re-requesting means that we will wait for another review before merging.

#### Requesting review: prefer a team over several individuals

*This applies to team members: outside contributors are not expected to know who should
review their change.*

**Do not request a review from several people in the hope that one of them will be
available.**

They all receive the request, and each one reasonably concludes that they are expected to
review. That is several times the work you needed. It can also be slower than asking one
person, because each of them may wait to see whether somebody else gets there first.

Requesting a team solves this. Any member of the team can review and approve on the team's
behalf. A reviewer who does not feel comfortable deciding alone can request another review
from the team after their own; that is the right way to ask for a second opinion.

It is also fine to request a review from specific individuals when you know that they are
the right people to look at the change.

#### Be responsive

**Reviews only work when participants remain engaged.**

Contributors involved in a review are expected to monitor review notifications and respond
in a timely manner. Review workflows break down when participants become unreachable. Long
delays create context switching, merge conflicts, frustration, and reduced throughput.

Being responsive is important for reviewers. It is even more important for authors: a
reviewer who has paged your change into their head loses that context quickly, and a pull
request that goes quiet usually has to be reviewed again from the start.

### Answering a review

#### Re-test after making changes

**When addressing review comments, test the updated code again.**

Never assume that a small change is automatically safe. A surprising number of review
cycles are spent catching mistakes introduced while addressing previous comments. The last
edit, made when the work already feels finished, is the one that tends to get the least
attention.

#### Reply to comments, and request re-review explicitly

**Reply to the comments you addressed, and let the reviewer mark them resolved.**

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

#### Explain what your push contains

**Every push notifies your reviewers. Tell them what it was.**

From a notification alone, a reviewer cannot tell whether you rewrote the heart of the
change, fixed a typo, or rebased. The difference decides whether they need to review from
scratch and whether their earlier approval still means anything.

Say it even when the answer is "nothing":

> That was just a rebase onto master. The diff is unchanged.

> Force-pushed: reworked the second commit, the other three are untouched.

## During review: expectations for reviewers

### Staying with the review

#### Review promptly

Review delay is one of the largest sources of friction in software development. Prompt
reviews reduce the same costs described under [Be responsive](#be-responsive): context
switching, waiting time, merge conflicts, and rework.

If you are directly involved in a pull request and cannot give it a proper review for a
while, say so there, so that the author can look for somebody else instead of waiting.

#### See the review through, or hand it over

**The reviewers who start on a pull request stay with it until it is merged or closed, unless
they say otherwise.**

Handing over a half-finished review costs the next person everything you had already
understood, so seeing it through is the default.

If you do need to stop, say so explicitly, because GitHub will not say it for you. Your
reviewer state is computed from the history of events on the pull request, so removing
yourself from the list of reviewers usually does not work, and even dismissing your previous
review is often not enough. The author is left unable to tell whether they are still waiting
for you.

State it in a comment, and make sure any thread you started is either resolved or explicitly
taken over by another reviewer.

> I'm dropping off this one. Someone closer to the storage code should judge that part. My
> thread about error handling is resolved as far as I'm concerned.

### Judging the change

#### Understand before judging

**Make sure you understand the problem being solved before you review the implementation.**

Many review discussions become unproductive because the author and the reviewer are solving
different problems, and neither of them notices for several rounds. If the intent is
unclear, ask questions first.

> Before I get into the implementation: is the goal here to make this path faster, or to
> make it survive a disconnect? The description reads both ways to me.

#### Focus on important issues

**Prioritize correctness, reliability, security, maintainability, and consistency.**

Do not block changes solely because you would have implemented them differently. A
different but sound approach is not a defect, and the author has usually spent longer
thinking about their particular context than you have.

#### Review more than the code

**The diff is only part of the change.**

Review:

- the pull request description
- the commit messages
- the commit structure
- documentation impact
- testing impact
- user impact

#### What an approval covers

**Approving means you also approve the commit messages and the pull request description.**

Do not approve if they are not ready yet, or we may end up merging without ever fixing them.

Instead, you can leave a comment saying that you are ready to approve as soon as the last
details are settled.

### Writing comments

#### Distinguish preferences from requirements

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

#### Explain your reasoning

Avoid:

> Don't do this.

Prefer:

> This introduces a dependency cycle that may complicate testing and maintenance.

Review comments are more useful when they explain both the concern and the reasoning behind
it. Teach rather than command: ideally the author finishes the review able to make the same
judgement themselves next time.

#### Assume competence

**Avoid language that assumes mistakes.**

Instead of:

> You forgot to handle this case.

Prefer:

> Was this case intentionally excluded?

Often it was. The goal is to understand before concluding, and when it really was an
oversight, the question costs the author nothing to answer.

#### Prefer threads over pull-request-level comments

**Attach comments to code whenever you can, so that they become resolvable threads.**

On GitHub, a pull-request-level comment cannot be resolved and cannot be tracked. It scrolls
away as the conversation grows, and it's harder to tell whether it was ever addressed. A
thread has a state, open or resolved, that everyone can see.

When your comment is not about a specific line, you can still start a thread by attaching
it to a file instead of to the pull request. It is a workaround for a weakness in GitHub's
interface, and it is worth the small detour.

#### Be aware of comment volume

**Large numbers of comments can be intimidating. Provide overall context.**

Thirty comments with no summary read as "this change is a disaster", even when twenty-eight
of them are minor. One sentence fixes that:

> Overall looks good. Most comments are minor readability suggestions. Only the comments
> regarding error handling are blocking.

#### Acknowledge good work

**Reviews should not consist exclusively of criticism.**

Positive feedback reinforces good practices and helps maintain a healthy review culture. It
is also useful information: knowing which parts you found clear tells the author what to do
again.

> The way you split these commits made this very easy to follow. Thanks!

## Merging

### Two approvals from maintainers

A pull request is mergeable once two maintainers of the target repository have approved it.
The maintainers are usually identified as a team rather than as individuals.

When more than two people are involved in the review, we try to get an approval from each of
them, or a statement that they are happy to leave the decision to the others and have no
unaddressed blocking comment.

A pull request should not stay blocked, however, because one reviewer commented once and
never came back to approve. Try to reach out to them first. If they remain unresponsive, you
can ask a project lead to arbitrate and merge anyway. They will check whether any blocking
comment is left, and if there is none and enough people have approved, they will merge
without waiting for the unresponsive reviewer.

If at any point anyone feels stuck with a pull request, whether as the author or as a
reviewer waiting for the author to respond, the right reflex is to talk quickly.

Let's not let pull requests rot, for any reason.

### Who merges?

**By default, the last reviewer to have approved is the one who merges, once no requested
review is still outstanding and nothing blocking is unresolved.**

An open nitpick is not a reason to hold a merge. An unresolved blocking comment is.

Some repositories depart from that default, usually because merging is coupled to something
else: a build, a deployment, a release process.

| Repository or group | Who merges |
|---|---|
| RPM packaging repositories | The author, who then makes a build |
| Source repositories managed by the Storage team | A project lead |
| `xcp-ng/xcp-ng-org` (documentation and website) | The documentation maintainers |

> **This table is not exhaustive.** It records the customs that have been written down so
> far, not all of them. If your repository is not listed, the default above applies: ask its
> maintainers, and then add the answer here.

If you are contributing from outside the XCP-ng team, none of this is yours to do. You will
not have merge rights, and you are not expected to produce a build. A maintainer takes the
change from approval onwards.

## When discussions stall

### Ask

**You are entitled to ask again for a review that has not come, or for a response from an
unresponsive author.**

Really, you shouldn't hesitate to ask, and a polite reminder on the pull request itself is
always acceptable. Members of the XCP-ng team who would rather not ask directly can ask a
coordinator or facilitator to relay it for them.

### Escalate early

**Long comment threads are often a sign that written communication is no longer the most
effective tool.**

If a discussion is not converging after several exchanges:

- schedule a call
- pair review
- discuss synchronously

Many disagreements that take hours in comments, and days or weeks in delays, disappear in
minutes of conversation.

If this is not enough to resolve the issue, escalate to a person or a team who can
arbitrate.

## Open questions

One point is still under discussion, so it is **not policy and should not be cited as a
rule**: it has been suggested that comments and commit messages refer to people by their
e-mail address or GitHub handle rather than by their full name. No decision has been taken,
and it is recorded here so that anyone who wants to weigh in knows the question is open.

## Packaging pull requests

*This section only concerns the RPM packaging repositories (`xcp-ng-rpms`).
If you are not touching one, you can stop reading here.*

Packaging pull requests carry an extra obligation: the change is not finished when it is
merged, because the package still has to be built.

### Who reviews

Each package has a maintainer team, which must approve the pull request. The release team
(OS Platform & Release) must approve it as well.

When the maintainer team is the OS Platform & Release team itself, two members of that team
must approve.

### If the pull request changes the release

**A build from the target branch must follow the merge.**

Bumping the release is a statement that a build carrying that release exists, or is about
to. Merging and then forgetting the build leaves the branch claiming a version that was
never produced.

### If the pull request does not change the release

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

### Packaging pull requests with several commits

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
