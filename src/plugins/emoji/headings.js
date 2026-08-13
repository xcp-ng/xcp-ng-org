/**
 * Rehype plugin: put the heading emoji on the heading element as a data
 * attribute, for CSS to render (see the [data-emoji] rule in custom.css).
 *
 * A page declares its heading emoji in front matter, keyed by heading id:
 *
 *     ---
 *     heading_emoji:
 *       contents: clipboard
 *       merging: twisted_rightwards_arrows
 *     ---
 *
 *     ## Contents {#contents}
 *
 * The emoji character therefore appears nowhere in the markdown, and nowhere in
 * the rendered text either: it is generated content, so assistive technology
 * never sees it, it is not copied with the text, and it stays out of the table
 * of contents and the search index. These emoji are decoration, and the heading
 * reads correctly without them.
 *
 * Being a rehype plugin is what keeps the table of contents clean: it runs after
 * the remark toc plugin has already serialised the heading text.
 */

const {resolve} = require('./vocabulary');

const HEADINGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

/** Collect heading elements, depth first. */
function findHeadings(tree) {
  const headings = [];
  (function walk(node) {
    if (node.type === 'element' && HEADINGS.has(node.tagName)) {
      headings.push(node);
    }
    node.children?.forEach(walk);
  })(tree);
  return headings;
}

module.exports = function headingEmoji() {
  return async (tree, file) => {
    const map = file.data?.frontMatter?.heading_emoji;
    if (!map) {
      return;
    }

    const problems = [];
    // Anything left here at the end names a heading that does not exist, which
    // usually means a heading was renamed and its emoji left behind.
    const unmatched = new Set(Object.keys(map));

    for (const heading of findHeadings(tree)) {
      const id = heading.properties?.id;
      if (!id || !unmatched.has(id)) {
        continue;
      }
      unmatched.delete(id);

      // A name like 1234 (🔢) is a number once YAML is done with it, so accept
      // that rather than making everyone remember to quote it.
      const name = typeof map[id] === 'number' ? String(map[id]) : map[id];
      if (typeof name !== 'string') {
        problems.push(`"${id}": expected an emoji name, got ${JSON.stringify(map[id])}`);
        continue;
      }

      const emoji = await resolve(name);
      if (!emoji) {
        problems.push(
          `"${id}": no emoji named "${name}". Add it to src/plugins/emoji/vocabulary.js if it is missing.`,
        );
        continue;
      }

      heading.properties['data-emoji'] = emoji;
    }

    for (const id of unmatched) {
      problems.push(`"${id}": no heading has this id`);
    }

    // Fail the build rather than silently dropping an emoji, which nobody would
    // notice. Same reasoning as onBrokenLinks/onBrokenAnchors: 'throw'.
    if (problems.length > 0) {
      throw new Error(
        `Invalid heading_emoji front matter in ${file.path}:\n  ${problems.join('\n  ')}`,
      );
    }
  };
};
