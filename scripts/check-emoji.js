#!/usr/bin/env node
/**
 * Check that no documentation file contains an emoji character: they are written
 * as `:name:` shortcodes instead, so that the sources stay readable to anyone
 * using a screen reader or a braille display. See the Emoji section of README.md.
 *
 * Run with `npm run lint:emoji`. Fenced code blocks and code spans are exempt:
 * an emoji there is part of quoted output, and remark does not convert
 * shortcodes inside them anyway. For a case outside those, put
 * `<!-- allow-emoji -->` on the line before.
 */

const fs = require('fs');
const path = require('path');
const {EMOJI_SOURCE} = require('../src/plugins/emoji/vocabulary');

const ROOT = path.join(__dirname, '..');
const TARGETS = ['docs', 'README.md'];
const ALLOW = '<!-- allow-emoji -->';

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

/** Blank out code spans, so an emoji quoted inline is not reported. */
function withoutCodeSpans(line) {
  return line.replace(/`+[^`]*`+/g, (span) => ' '.repeat(span.length));
}

const problems = [];

for (const file of TARGETS.flatMap(markdownFiles)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  let fence = false;

  lines.forEach((line, index) => {
    if (/^\s*(```+|~~~+)/.test(line)) {
      fence = !fence;
      return;
    }
    if (fence || lines[index - 1]?.includes(ALLOW)) {
      return;
    }
    for (const match of withoutCodeSpans(line).matchAll(new RegExp(EMOJI_SOURCE, 'gu'))) {
      problems.push(
        `${path.relative(ROOT, file)}:${index + 1}:${match.index + 1}: ${match[0]}  in: ${line.trim()}`,
      );
    }
  });
}

if (problems.length > 0) {
  console.error(
    `Emoji characters in documentation sources (${problems.length}). Write the ` +
      '`:name:` shortcode instead — see the Emoji section of README.md.\n',
  );
  problems.forEach((problem) => console.error(`  ${problem}`));
  process.exit(1);
}

console.log('No emoji characters in the documentation sources.');
