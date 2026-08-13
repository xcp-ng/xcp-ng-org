/**
 * Rehype plugin: make the emoji in the built page readable to assistive tech.
 *
 * The markdown sources hold no emoji characters — contributors write `:name:`
 * and the build inserts the character (see inline.js) — but that only ever fixed
 * the *sources*. The rendered page still put the character in the heading text,
 * where a screen reader announces the decoration before the label on every
 * heading, and a braille display, having no cell for the code point, shows a
 * placeholder the reader has to route the cursor to in order to identify.
 *
 * Neither is fixable at the character: what a braille display receives is text,
 * so the only lever is changing the text. This plugin does that, two ways.
 *
 * A heading's leading emoji is decoration — the heading reads correctly without
 * it — so it is hidden from assistive tech where it stands:
 *
 *     <h2 id="serial-console-access"><span aria-hidden="true">🧵</span> Serial…</h2>
 *
 * toc.js does the same to the table of contents, which Docusaurus builds from
 * the markdown, too early for a rehype plugin to reach.
 *
 * Why aria-hidden rather than drawing the emoji from a data attribute as CSS
 * generated content — which would additionally keep it out of the text copied
 * with the heading and out of the search index? Because support. `aria-hidden`
 * is ARIA 1.0 and needs no CSS at all, where `content: … / ''` is recent
 * (roughly Chrome 77, Safari 17.4, Firefox 137) and absent from text-mode
 * browsers entirely, so in w3m and in anything older the heading emoji would
 * simply disappear. Keeping the character in the DOM is the price of having it
 * render everywhere.
 *
 * That trade is forced, not an oversight: in a text browser the visible text
 * *is* the accessibility tree, so nothing can show w3m the emoji while hiding it
 * from a screen reader. CSS works in graphical browsers only because it offers a
 * visual-only channel that a terminal does not have.
 *
 * Every other emoji is content rather than decoration — the ⚠️ opening a caveat
 * means something — so it stays, and gets a real accessible name instead:
 *
 *     <span role="img" aria-label="rocket">🚀</span>
 *
 * `role="img"` is the part that matters. `aria-label` on a bare <span> is a
 * generic role and is not reliably exposed; with the role, the accessible name
 * replaces the content, so a braille display receives the word in ordinary cells
 * rather than an unmapped character. Speech is unchanged: the name is the one a
 * screen reader would have announced for the character anyway.
 *
 * A heading whose emoji is not leading, or which has a second one, keeps it in
 * the text and it falls through to the span treatment. That is a correct result
 * rather than a failure, so it is deliberately not an error — no contributor has
 * to remember a rule about it.
 */

const {EMOJI_SOURCE, label} = require('./vocabulary');

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

// Quoted material keeps its characters and must not be touched: fenced blocks
// and code spans hold sample output such as the saxophone in the xo-api payload,
// and the ★ that labels a footnote lives in an inline SVG.
const SKIP = new Set(['pre', 'code', 'svg']);

/**
 * Whether assistive tech has already been told what to do with this subtree.
 *
 * Two cases. The heading emoji this plugin has just hidden, which must not then
 * be labelled as well. And the footnote back-references remark-gfm generates —
 * `<a aria-label="Back to reference 1">↩</a>` is already named, so labelling the
 * ↩ inside it would nest a role for no gain.
 */
function carriesOwnAria(node) {
  const properties = node.properties ?? {};
  return Boolean(
    properties['aria-label'] ??
      properties.ariaLabel ??
      properties['aria-hidden'] ??
      properties.ariaHidden,
  );
}

const LEADING_EMOJI = new RegExp(`^${EMOJI_SOURCE}`, 'u');
const HAS_EMOJI = new RegExp(EMOJI_SOURCE, 'u');
const EMOJI = new RegExp(EMOJI_SOURCE, 'gu');

/**
 * Hide a heading's leading emoji from assistive tech, in place.
 *
 * The space after the emoji stays in the text, so the heading still reads as
 * `🧵 Serial console access` on screen with no styling involved.
 */
function hideLeadingEmoji(heading) {
  const first = heading.children?.[0];
  if (first?.type !== 'text') {
    return;
  }

  const [emoji] = first.value.match(LEADING_EMOJI) ?? [];
  if (!emoji) {
    return;
  }

  // The emoji and the text after it may be one node or two, depending on what
  // produced them. Drop the node if the emoji was all of it.
  first.value = first.value.slice(emoji.length);
  if (first.value === '') {
    heading.children.shift();
  }

  heading.children.unshift({
    type: 'element',
    tagName: 'span',
    properties: {'aria-hidden': 'true'},
    children: [{type: 'text', value: emoji}],
  });
}

/** The children that replace a text node, with each emoji in it wrapped. */
async function wrapEmoji(value) {
  const children = [];
  let done = 0;

  for (const match of value.matchAll(EMOJI)) {
    const emoji = match[0];
    const name = await label(emoji);
    // Nothing knows this one. Leaving the character alone is what remark-emoji
    // does with a name it cannot resolve, and a label we made up would be worse
    // than the one the screen reader already has. `done` deliberately does not
    // move, so the character stays in the text that follows.
    if (!name) {
      continue;
    }

    if (match.index > done) {
      children.push({type: 'text', value: value.slice(done, match.index)});
    }
    children.push({
      type: 'element',
      tagName: 'span',
      properties: {role: 'img', 'aria-label': name},
      children: [{type: 'text', value: emoji}],
    });
    done = match.index + emoji.length;
  }

  if (children.length === 0) {
    return undefined;
  }
  if (done < value.length) {
    children.push({type: 'text', value: value.slice(done)});
  }
  return children;
}

module.exports = function emojiAccessibility() {
  return async (tree) => {
    const texts = [];

    (function walk(node, parent) {
      if (node.type === 'element') {
        if (SKIP.has(node.tagName) || carriesOwnAria(node)) {
          return;
        }
        // Before the children are walked, so the emoji it hides ends up inside
        // an aria-hidden span that the walk then skips rather than labels.
        if (HEADINGS.has(node.tagName)) {
          hideLeadingEmoji(node);
        }
      }

      // Collected rather than replaced here, because wrapping is async and this
      // walk would otherwise have to rebuild children mid-traversal.
      if (node.type === 'text' && parent && HAS_EMOJI.test(node.value)) {
        texts.push({parent, node});
      }

      node.children?.forEach((child) => walk(child, node));
    })(tree, undefined);

    for (const {parent, node} of texts) {
      const children = await wrapEmoji(node.value);
      if (children) {
        parent.children.splice(parent.children.indexOf(node), 1, ...children);
      }
    }
  };
};
