# XCP-ng website & documentation


## Website

Our website is a simple and static HTML page.

## Documentation

Our documentation is built using [Docusaurus 3](https://docusaurus.io/), a modern static website and documentation generator. It's available at https://docs.xcp-ng.org

### Installation

```
$ npm i
```

### Local Development

```
$ npm run start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.


### Autogeneration

This documentation is automatically rebuilt after each push event on `master` branch.

### Emoji

**Never put an emoji character in a documentation file.** Not in a heading, not in a
paragraph, not in a table. People read our markdown sources directly, and a braille display
turns an emoji into a question mark, so a heading like `## 📋 Contents` reads as noise to a
blind contributor. Write the name instead, and the build inserts the character.

**Headings** declare their emoji in front matter, keyed by the heading's `{#id}`:

```markdown
---
heading_emoji:
  contents: clipboard
  merging: twisted_rightwards_arrows
---

## Contents {#contents}

## Merging {#merging}
```

The emoji is then drawn by CSS, as decoration: screen readers announce "Contents", the
character is not copied along with the heading text, and it stays out of the table of contents
and of the search index. A heading with no entry in the map simply gets no emoji.

Mistyping an emoji name, or leaving an entry behind after renaming a heading, **fails the
build** — otherwise the emoji would just silently vanish and nobody would notice.

**Anywhere else**, write the `:name:` shortcode inline, the same one GitHub understands:

```markdown
- `zfs` updated to version 2.1.15. :warning: Existing ZFS pools may need an upgrade.
```

Unlike a heading emoji, this one ends up in the page text and *is* announced by a screen
reader — which is what you want when the emoji carries meaning. If it carries meaning, though,
make sure the sentence still works without it.

Names come from [gemoji](https://github.com/github/gemoji), the set GitHub uses, plus a few
listed in `src/plugins/emoji/vocabulary.js`. If a name resolves to nothing, add it there.