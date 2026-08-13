/**
 * Emoji vocabulary, shared by the three emoji build plugins (inline.js,
 * headings.js, toc.js) and by the check script that enforces the rule
 * (scripts/check-emoji.js).
 *
 * Documentation sources contain no emoji characters: contributors write the
 * `:name:` shortcode and the build inserts the character. Docusaurus does that
 * conversion itself (markdown.emoji, on by default, via remark-emoji), so the
 * only thing needed here is the handful of names remark-emoji gets wrong.
 *
 * The two tables below are the ones to extend when a name does not work. Which
 * one depends on the symptom, and the Emoji section of README.md walks a
 * contributor through it — keep the two in step if you change how this works.
 */

// Names remark-emoji does not know. Its dataset is node-emoji, built on
// emojilib, whose vocabulary predates Unicode 12 and the ZWJ profession
// sequences, so it is missing everything below. The names follow gemoji (what
// GitHub uses) so contributors' habits keep working.
//
// The regional_indicator_* entries are the Slack/Discord convention. We use
// four of them as vendor initials in "From VMware" and friends.
const ALIASES = {
  adhesive_bandage: '🩹',
  cartwheeling: '🤸',
  coin: '🪙',
  green_circle: '🟢',
  guide_dog: '🦮',
  health_worker: '🧑‍⚕️',
  ice_cube: '🧊',
  identification_card: '🪪',
  ladder: '🪜',
  magic_wand: '🪄',
  placard: '🪧',
  regional_indicator_h: '🇭',
  regional_indicator_k: '🇰',
  regional_indicator_v: '🇻',
  regional_indicator_x: '🇽',
  scientist: '🧑‍🔬',
  shaking_face: '🫨',
  stethoscope: '🩺',
  technologist: '🧑‍💻',
  wheel: '🛞',
  window: '🪟',
  yellow_circle: '🟡',
};

// Names where remark-emoji returns the text-presentation codepoint, without the
// U+FE0F variation selector. Some browser and font combinations render those as
// a flat monochrome glyph. These are the emoji-presentation forms the docs
// displayed back when the characters lived in the markdown, so keep them.
const PRESENTATION = {
  artificial_satellite: '🛰️',
  balance_scale: '⚖️',
  biohazard: '☣️',
  building_construction: '🏗️',
  card_file_box: '🗃️',
  card_index_dividers: '🗂️',
  computer_mouse: '🖱️',
  control_knobs: '🎛️',
  desktop_computer: '🖥️',
  file_cabinet: '🗄️',
  framed_picture: '🖼️',
  gear: '⚙️',
  hammer_and_wrench: '🛠️',
  houses: '🏘️',
  keyboard: '⌨️',
  label: '🏷️',
  motorway: '🛣️',
  pen: '🖊️',
  radioactive: '☢️',
  rescue_worker_helmet: '⛑️',
  shield: '🛡️',
  spider_web: '🕸️',
  thermometer: '🌡️',
  wastebasket: '🗑️',
  world_map: '🗺️',
  writing_hand: '✍️',
};

/** The names this plugin handles itself, i.e. everything remark-emoji gets wrong. */
const NAMES = {...ALIASES, ...PRESENTATION};

// What counts as "an emoji character" for the check script, as a regexp source
// string to be compiled with the 'u' flag. Deliberately a list
// of the emoji ranges rather than the whole Miscellaneous Symbols and Dingbats
// blocks: those blocks also hold characters the docs legitimately use as text —
// ★ labels a footnote in an inline SVG, → appears in prose, and the build system
// pages draw trees out of box-drawing characters. None of those have an emoji
// name, and none of them read as an emoji to a screen reader.
const EMOJI_SOURCE = [
  '[',
  '\\u00A9\\u00AE\\u203C\\u2049\\u2122\\u2139',
  '\\u2194-\\u2199\\u21A9\\u21AA',
  '\\u231A\\u231B\\u2328\\u23CF\\u23E9-\\u23F3\\u23F8-\\u23FA',
  '\\u24C2\\u25AA\\u25AB\\u25B6\\u25C0\\u25FB-\\u25FE',
  '\\u2600-\\u2604\\u260E\\u2611\\u2614\\u2615\\u2618\\u261D\\u2620\\u2622\\u2623',
  '\\u2626\\u262A\\u262E\\u262F\\u2638-\\u263A\\u2640\\u2642\\u2648-\\u2653',
  '\\u265F\\u2660\\u2663\\u2665\\u2666\\u2668\\u267B\\u267E\\u267F',
  '\\u2692-\\u2697\\u2699\\u269B\\u269C\\u26A0\\u26A1\\u26A7\\u26AA\\u26AB',
  '\\u26B0\\u26B1\\u26BD\\u26BE\\u26C4\\u26C5\\u26C8\\u26CE\\u26CF\\u26D1',
  '\\u26D3\\u26D4\\u26E9\\u26EA\\u26F0-\\u26F5\\u26F7-\\u26FA\\u26FD',
  '\\u2702\\u2705\\u2708-\\u270D\\u270F\\u2712\\u2714\\u2716\\u271D\\u2721\\u2728',
  '\\u2733\\u2734\\u2744\\u2747\\u274C\\u274E\\u2753-\\u2755\\u2757\\u2763\\u2764',
  '\\u2795-\\u2797\\u27A1\\u27B0\\u27BF',
  '\\u2934\\u2935\\u2B05-\\u2B07\\u2B1B\\u2B1C\\u2B50\\u2B55',
  '\\u3030\\u303D\\u3297\\u3299',
  '\\u{1F000}-\\u{1FAFF}',
  ']',
  // Keep a variation selector, skin tone or ZWJ sequence together with its base,
  // so a single emoji is reported once instead of two or three times.
  '(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?',
  '(?:\\u200D.(?:\\uFE0F|[\\u{1F3FB}-\\u{1F3FF}])?)*',
].join('');

// The other direction, character to name, for the plugins that have to label an
// emoji they find in the built page. node-emoji's own `which` covers everything
// remark-emoji converted; this covers the names it had never heard of, which are
// exactly the ones ALIASES exists for.
//
// The two gemoji names that are not words go in as well: `+1` would reach a
// screen reader as "plus one", which is not what 👍 means to a reader.
const OWN_LABELS = {
  ...Object.fromEntries(Object.entries(NAMES).map(([name, character]) => [character, name])),
  '👍': 'thumbs_up',
  '👎': 'thumbs_down',
};

// node-emoji is ESM-only and this file is required from a CommonJS config, so it
// has to be imported dynamically. Cache the promise: label() is called once per
// emoji, on every page.
let nodeEmojiPromise;

function nodeEmoji() {
  nodeEmojiPromise ??= import('node-emoji');
  return nodeEmojiPromise;
}

/**
 * The accessible name for an emoji character: its emoji name, spelled out.
 *
 * This is what a braille display receives in place of the character, so it has
 * to be words rather than a shortcode — `desktop computer`, not
 * `desktop_computer`. It matches what a screen reader announces for the bare
 * character anyway, so speech is unchanged.
 *
 * @param {string} character a single emoji, variation selector and all
 * @returns {Promise<string | undefined>} undefined if nothing knows this emoji
 */
async function label(character) {
  const name = OWN_LABELS[character] ?? (await nodeEmoji()).which(character);
  return name?.replace(/_/g, ' ');
}

module.exports = {NAMES, EMOJI_SOURCE, label};
