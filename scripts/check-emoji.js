#!/usr/bin/env node
/**
 * Check how the documentation writes emoji. See the Emoji section of README.md
 * for the rule; run with `npm run lint:emoji`.
 *
 * Two directions go wrong, and both are silent, which is why they are checked:
 *
 *   - an emoji *character* in the markdown, which is what the rule forbids: it
 *     reaches anyone reading the source as noise or a question mark;
 *   - a `:name:` shortcode that will not become an emoji — a name nothing knows,
 *     a name that resolves to a flat monochrome glyph, or a shortcode written
 *     somewhere shortcodes are never converted. Each of those renders as the
 *     literal text `:name:`, or as the wrong glyph, and nobody notices until
 *     someone looks at the page.
 *
 * Names are resolved with node-emoji, the dataset Docusaurus's own remark-emoji
 * uses, so this agrees with the build about which names exist. Keep the version
 * range in package.json in step with remark-emoji's (^2.1.0) so npm can dedupe
 * them to a single copy.
 *
 * Exempt: fenced code blocks, code spans, and the JSX template literals that
 * `<Terminal>` blocks are written with. Those hold quoted output, where the
 * character is part of what is quoted and no shortcode would be converted
 * anyway. For a quoted case outside them, put `<!-- allow-emoji -->` on the line
 * before.
 */

const fs = require('fs');
const path = require('path');
const nodeEmoji = require('node-emoji');
const {NAMES, EMOJI_SOURCE} = require('../src/plugins/emoji/vocabulary');

const ROOT = path.join(__dirname, '..');
const TARGETS = ['docs', 'README.md'];
const ALLOW = '<!-- allow-emoji -->';

// remark-emoji's own shortcode pattern, which is what contributors write against.
const SHORTCODE = /:\+1:|:-1:|:[\w-]+:/g;
// Attribute values, in HTML and in JSX: title="...", label={`...`}.
const ATTRIBUTE = /=\s*("[^"]*"|'[^']*'|\{`[^`]*`\})/g;

/** The character a shortcode will produce, or undefined if nothing knows the name. */
const resolve = (name) => NAMES[name] ?? nodeEmoji.get(name);

/**
 * Is this shortcode-shaped text actually meant as an emoji? A MAC address, a
 * timestamp, a table alignment row and a log line like `INFO:root:done` all
 * contain `:...:`, so require a letter in the name and nothing word-like or
 * colon-like touching either end.
 *
 * The cost is that a typo written flush against a word — `Gear:gaer:` — is not
 * reported. A correct name there works and is left alone, so this only loses the
 * warning, and only in a spot nobody writes.
 */
function looksIntentional(line, match) {
  const before = line[match.index - 1] ?? '';
  const after = line[match.index + match[0].length] ?? '';
  return /[a-zA-Z]/.test(match[0]) && !/[\w:]/.test(before) && !/[\w:]/.test(after);
}

function markdownFiles(target) {
  const abs = path.join(ROOT, target);
  if (!fs.statSync(abs).isDirectory()) {
    return abs.endsWith('.md') ? [abs] : [];
  }
  return fs
    .readdirSync(abs, {withFileTypes: true})
    .flatMap((entry) =>
      entry.isDirectory()
        ? markdownFiles(path.join(target, entry.name))
        : entry.name.endsWith('.md')
          ? [path.join(abs, entry.name)]
          : [],
    );
}

/** Blank out code spans, so what they quote is not checked. */
const withoutCodeSpans = (line) => line.replace(/`+[^`]*`+/g, (span) => ' '.repeat(span.length));

/**
 * Walk a file's lines, yielding the ones that carry prose, with a flag for the
 * front matter — code blocks, code spans and JSX template literals are gone.
 */
function* proseLines(text) {
  const lines = text.split('\n');
  const frontMatterEnd = lines[0]?.trim() === '---' ? lines.indexOf('---', 1) : -1;
  let fence = false;
  let template = false;

  for (const [index, line] of lines.entries()) {
    if (/^\s*(```+|~~~+)/.test(line)) {
      fence = !fence;
      continue;
    }
    // A JSX expression template literal, as <Terminal>{`...`}</Terminal> uses.
    const opens = line.includes('{`');
    const closes = line.includes('`}');
    if (template) {
      template = !closes;
      continue;
    }
    if (opens && !closes) {
      template = true;
      continue;
    }
    if (fence || lines[index - 1]?.includes(ALLOW)) {
      continue;
    }
    yield {
      number: index + 1,
      raw: line,
      prose: withoutCodeSpans(line),
      inFrontMatter: index > 0 && index < frontMatterEnd,
    };
  }
}

const problems = [];
const report = (file, line, kind, detail) =>
  problems.push({kind, where: `${path.relative(ROOT, file)}:${line.number}`, detail, line});

for (const file of TARGETS.flatMap(markdownFiles)) {
  for (const line of proseLines(fs.readFileSync(file, 'utf8'))) {
    for (const match of line.prose.matchAll(new RegExp(EMOJI_SOURCE, 'gu'))) {
      report(file, line, 'character', `${match[0]} at column ${match.index + 1}`);
    }

    const attributes = line.prose.match(ATTRIBUTE) ?? [];

    for (const match of line.prose.matchAll(SHORTCODE)) {
      const name = match[0].slice(1, -1);
      const emoji = resolve(name);

      if (!emoji) {
        if (looksIntentional(line.prose, match)) {
          report(file, line, 'unknown', `${match[0]} — no emoji has this name`);
        }
        continue;
      }
      if (line.inFrontMatter) {
        report(file, line, 'dead', `${match[0]} in front matter`);
      } else if (attributes.some((attribute) => attribute.includes(match[0]))) {
        report(file, line, 'dead', `${match[0]} in an attribute value`);
      }
      // No variation selector and a base that fonts render as text: a flat,
      // monochrome glyph instead of the emoji.
      if (!emoji.includes('️') && !/^\p{Emoji_Presentation}/u.test(emoji)) {
        report(file, line, 'flat', `${match[0]} resolves to ${emoji}, without U+FE0F`);
      }
      if (/^#{1,6}\s/.test(line.raw.trim()) && !/\{#[^}]+\}/.test(line.raw)) {
        report(file, line, 'heading', `${match[0]} in a heading with no {#id}`);
      }
    }
  }
}

const EXPLANATIONS = {
  character:
    'Emoji characters in the sources. Write the `:name:` shortcode instead, so\n' +
    '  the markdown stays readable to anyone using a screen reader.',
  unknown:
    'Names nothing resolves, which render as the literal text `:name:`. Fix the\n' +
    '  typo, or add the emoji to ALIASES in src/plugins/emoji/vocabulary.js if\n' +
    '  gemoji has a name for it.',
  flat:
    'Names that resolve without the U+FE0F variation selector, so some fonts draw\n' +
    '  a flat monochrome glyph. Add the colourful form to PRESENTATION in\n' +
    '  src/plugins/emoji/vocabulary.js.',
  dead: 'Shortcodes where nothing converts them: front matter and attribute values\n' +
    '  are not markdown text. Rewrite so the emoji sits in the page text.',
  heading:
    'Headings with an emoji and no explicit {#id}: the id is built before the\n' +
    '  shortcode is converted, so it would be made out of the emoji name. Add the\n' +
    '  id, or run `npm run write-heading-ids`.',
};

if (problems.length > 0) {
  console.error(`Emoji problems in the documentation sources (${problems.length}).\n`);
  for (const [kind, explanation] of Object.entries(EXPLANATIONS)) {
    const found = problems.filter((problem) => problem.kind === kind);
    if (found.length === 0) {
      continue;
    }
    console.error(`${explanation}\n`);
    for (const problem of found) {
      console.error(`  ${problem.where}: ${problem.detail}`);
      console.error(`    ${problem.line.raw.trim().slice(0, 100)}`);
    }
    console.error('');
  }
  console.error('See the Emoji section of README.md.');
  process.exit(1);
}

console.log('Emoji: no characters in the sources, every shortcode resolves.');
