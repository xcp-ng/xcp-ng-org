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

**Never write an emoji character in a documentation file.** Not in a heading, not in a
paragraph, not in a table. People read our markdown sources directly — on GitHub, in an
editor, through the "Edit this page" link — and a screen reader or a braille display turns an
emoji into noise or a question mark, so a heading like `## 📋 Contents` reads as gibberish to a
blind contributor.

Write the name instead, in the `:name:` form GitHub uses, and the build inserts the character:

```markdown
## :rocket: Where to start {#where-to-start}

- `zfs` updated to version 2.1.15. :warning: Existing ZFS pools may need an upgrade.
```

Names are the ones [gemoji](https://github.com/github/gemoji) lists, the set GitHub
understands, so anything you are used to typing in an issue works here too.

**A heading with an emoji needs an explicit `{#id}`**, as every heading here already has.
Heading ids are computed before the shortcode is converted, so without one the id would be
built out of the emoji name. `npm run write-heading-ids` adds the missing ones.

The one exception to the no-characters rule is **quoted material**: sample terminal output, a
JSON payload, a code span, an inline SVG. There the character is part of what is being quoted,
and a shortcode would not be converted anyway. Keep it as it is.

`npm run lint:emoji` checks all of this, in both directions. It reports emoji characters in the
sources, and it reports shortcodes that would silently not work:

- a name nothing resolves — a typo, or an emoji missing from the tables below — which renders as
  the literal text `:name:`;
- a name that resolves without the U+FE0F variation selector, which some fonts draw as a flat
  monochrome glyph;
- a shortcode in front matter or in an attribute value such as `title=":rocket: Install"`, where
  nothing converts it;
- a heading with an emoji and no explicit `{#id}`.

Fenced code blocks, code spans and the JSX template literals in `<Terminal>` blocks are exempt,
in both directions: quoted output keeps its characters, and shortcodes are not converted there
anyway. For a quoted case outside them, put `<!-- allow-emoji -->` on the line before.

#### When a name does not work

Docusaurus converts the shortcodes, and its emoji dataset is a few Unicode versions behind
gemoji: names for anything recent, and for the profession sequences like `:technologist:`, are
missing. Two tables in `src/plugins/emoji/vocabulary.js` fill the gap, and that file is the one
place in the documentation build where emoji characters belong. `npm run lint:emoji` tells you
which table to add to, and so does the built page:

- **The literal text `:melting_face:`, shortcode and all** — Docusaurus has never heard of the
  name. Add it to `ALIASES`, keeping the list alphabetical:

  ```js
  const ALIASES = {
    // ...
    melting_face: '🫠',
  };
  ```

  Use the name [gemoji](https://github.com/github/gemoji) gives the emoji, not one of your own:
  the point is that contributors can write what they are used to. If gemoji has no name for it
  either, the emoji is too new or too obscure to be worth using.

- **The emoji, but flat and monochrome** instead of in colour — the name resolved to the
  text-presentation codepoint, without the U+FE0F variation selector that asks for the colourful
  form. Add that form to `PRESENTATION`, again alphabetically:

  ```js
  const PRESENTATION = {
    // ...
    skull_and_crossbones: '☠️',
  };
  ```

  Copy the character from somewhere that keeps the variation selector — pasting the bare glyph
  gives you back exactly what you were trying to fix — and confirm it comes out in colour.

Either way, run `npm run start` and look at the page: a name that resolves to nothing renders as
`:name:`, which is the failure you are checking for. Nothing else to update — both tables are
read by the remark plugin sitting next to them, with no build step and no dependency involved.
Adding a name Docusaurus already handles is harmless but pointless; the tables exist only to
cover what it gets wrong, so keeping them short keeps them reviewable.
