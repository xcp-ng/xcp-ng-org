/**
 * Remark plugin: convert the `:name:` shortcodes that Docusaurus's built-in
 * remark-emoji cannot, so every emoji in the docs can be written as ASCII.
 *
 * Docusaurus already converts shortcodes (markdown.emoji, on by default). This
 * only fills the gaps in its dataset, listed in vocabulary.js: names it does not
 * know at all, such as `:green_circle:`, and names where it returns a
 * text-presentation codepoint, such as `:gear:`. Everything else keeps going
 * through the mechanism Docusaurus documents.
 *
 * Registered as a beforeDefaultRemarkPlugin so it runs first and remark-emoji
 * finds nothing left to do for these names. Headings go through it like any
 * other text: their ids are computed by the default headings plugin, which runs
 * earlier still, which is why an emoji heading needs an explicit `{#id}`.
 *
 * Unknown shortcodes are left alone, exactly as remark-emoji and GitHub leave
 * them: `:foo:` renders as `:foo:`, visible enough that review catches it.
 */

const {NAMES} = require('./vocabulary');

// Same shape as remark-emoji's own pattern, which is what contributors already
// write against. `:+1:` and `:-1:` need the special case.
const SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;

module.exports = function inlineEmoji() {
  return (tree) => {
    (function walk(node) {
      // Only text nodes: code spans and fenced blocks have their own node types,
      // so a shortcode written inside them is left alone for free.
      if (node.type === 'text') {
        node.value = node.value.replace(
          SHORTCODE,
          (shortcode) => NAMES[shortcode.slice(1, -1)] ?? shortcode,
        );
      }
      node.children?.forEach(walk);
    })(tree);
  };
};
