/**
 * Remark plugin: give the table of contents the same emoji as the headings it
 * points at, drawn the same way.
 *
 * Docusaurus builds the `toc` export from the markdown headings, and our
 * headings no longer contain their emoji, so the table of contents came out
 * bare. Each toc entry carries a `value` of ready-made HTML, rendered with
 * dangerouslySetInnerHTML, so an empty span is all it takes:
 *
 *     value: '<span data-emoji="🟢"></span>LTS Releases'
 *
 * The [data-emoji] rule in custom.css then draws the emoji as generated content
 * with empty alt text, exactly as it does in the heading. Nothing is added to
 * the entry's text, so the emoji stays out of the accessibility tree here too.
 *
 * Why not inject a JSX span into the heading and let the toc plugin serialise
 * it? Because that serialiser keeps only `className` and drops every other
 * attribute (toc/utils.js, mdxJsxTextElementToHtml), so `data-emoji` would not
 * survive the trip.
 *
 * This has to run after the default toc plugin, so register it in
 * `remarkPlugins` rather than `beforeDefaultRemarkPlugins`.
 */

const {resolve} = require('./vocabulary');

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
      const declared = statement.type === 'ExportNamedDeclaration' && statement.declaration?.declarations?.[0];
      if (declared && keyName(declared.id) === 'toc') {
        return declared;
      }
    }
  }
  return undefined;
}

module.exports = function tocEmoji() {
  return async (tree, file) => {
    const map = file.data?.frontMatter?.heading_emoji;
    if (!map) {
      return;
    }

    const tocExport = findTocExport(tree);
    if (!tocExport) {
      // Nothing to decorate: a page can legitimately have no table of contents,
      // and an .md file may export its own toc.
      return;
    }

    // A page can end up with two headings sharing an id, when an explicit {#id}
    // collides with another heading's generated slug. Only the first one is
    // reachable, and headings.js decorates only the first, so match that here.
    const decorated = new Set();

    for (const entry of findObjectExpressions(tocExport.init)) {
      const properties = {};
      for (const property of entry.properties ?? []) {
        properties[keyName(property.key)] = property.value;
      }
      const {id, value} = properties;
      if (id?.type !== 'Literal' || value?.type !== 'Literal' || decorated.has(id.value)) {
        continue;
      }

      const name = typeof map[id.value] === 'number' ? String(map[id.value]) : map[id.value];
      if (typeof name !== 'string') {
        // headings.js reports bad entries; no need to say it twice.
        continue;
      }

      const emoji = await resolve(name);
      if (!emoji) {
        continue;
      }

      decorated.add(id.value);
      value.value = `<span data-emoji="${emoji}"></span>${value.value}`;
      // valueToEstree may have left a `raw` behind, which would win over `value`
      // when this is printed back out.
      delete value.raw;
    }
  };
};
