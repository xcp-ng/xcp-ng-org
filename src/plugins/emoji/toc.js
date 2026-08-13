/**
 * Remark plugin: hide the leading emoji in the table of contents entries too,
 * the same way headings.js hides it in the headings themselves.
 *
 * Docusaurus builds the `toc` export from the markdown, well before headings.js
 * gets a rehype tree to work on, so hiding it in the heading would leave the
 * table of contents still announcing the character — and still showing a
 * placeholder cell on a braille display.
 *
 * Each entry carries a `value` of ready-made HTML, rendered with
 * dangerouslySetInnerHTML, so wrapping the emoji is all it takes:
 *
 *     value: '<span aria-hidden="true">🧵</span> Serial console access'
 *
 * Why not put the span in the heading and let the toc plugin serialise it?
 * Because that serialiser keeps only `className` and drops every other
 * attribute (toc/utils.js, mdxJsxTextElementToHtml), so `aria-hidden` would not
 * survive the trip.
 *
 * This has to run after the default toc plugin, so register it in
 * `remarkPlugins` rather than `beforeDefaultRemarkPlugins`.
 */

const {EMOJI_SOURCE} = require('./vocabulary');

// Just the emoji: the space after it stays in the text, so the entry still reads
// as `🧵 Serial console access` on screen.
const LEADING_EMOJI = new RegExp(`^${EMOJI_SOURCE}`, 'u');

/** Read a string out of an estree Identifier or Literal key. */
function keyName(key) {
  return key?.type === 'Identifier' ? key.name : key?.type === 'Literal' ? key.value : undefined;
}

/** Collect every ObjectExpression in an estree, however deeply nested. */
function findObjectExpressions(node, found = []) {
  if (!node || typeof node !== 'object') {
    return found;
  }
  if (Array.isArray(node)) {
    node.forEach((child) => findObjectExpressions(child, found));
    return found;
  }
  if (node.type === 'ObjectExpression') {
    found.push(node);
  }
  Object.values(node).forEach((value) => findObjectExpressions(value, found));
  return found;
}

/** The exported `toc` declaration, or undefined if this page has none. */
function findTocExport(tree) {
  for (const node of tree.children) {
    if (node.type !== 'mdxjsEsm' || !node.data?.estree) {
      continue;
    }
    for (const statement of node.data.estree.body) {
      const declared =
        statement.type === 'ExportNamedDeclaration' && statement.declaration?.declarations?.[0];
      if (declared && keyName(declared.id) === 'toc') {
        return declared;
      }
    }
  }
  return undefined;
}

module.exports = function tocEmoji() {
  return (tree) => {
    const tocExport = findTocExport(tree);
    if (!tocExport) {
      // Nothing to do: a page can legitimately have no table of contents, and an
      // .md file may export its own toc.
      return;
    }

    for (const entry of findObjectExpressions(tocExport.init)) {
      const value = entry.properties?.find((property) => keyName(property.key) === 'value')?.value;
      if (value?.type !== 'Literal' || typeof value.value !== 'string') {
        continue;
      }

      const [emoji] = value.value.match(LEADING_EMOJI) ?? [];
      if (!emoji) {
        continue;
      }

      value.value = `<span aria-hidden="true">${emoji}</span>${value.value.slice(emoji.length)}`;
      // valueToEstree may have left a `raw` behind, which would win over `value`
      // when this is printed back out.
      delete value.raw;
    }
  };
};
