/**
 * Emoji vocabulary shared by the two emoji build plugins.
 *
 * Docs markdown contains no emoji characters at all: headings map a heading id
 * to an emoji name in their front matter (see headings.js) and content uses
 * `:name:` shortcodes. Both need to turn a name into a character, so they share
 * this module.
 *
 * The base vocabulary is node-emoji, the dataset Docusaurus's own remark-emoji
 * uses, so every shortcode that worked before still works. Two layers on top:
 */

// Names node-emoji does not know. Its dataset is built on emojilib, whose
// vocabulary predates Unicode 12 and the ZWJ profession sequences, so it is
// missing everything below. The names follow gemoji (what GitHub uses) so
// contributors' habits keep working.
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

// Names where node-emoji returns the text-presentation codepoint, without the
// U+FE0F variation selector. Some browser and font combinations render those as
// a flat monochrome glyph. These are the emoji-presentation forms the docs
// displayed back when the characters lived in the markdown, so keep them.
const PRESENTATION = {
  artificial_satellite: '🛰️',
  balance_scale: '⚖️',
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
  wastebasket: '🗑️',
  world_map: '🗺️',
  writing_hand: '✍️',
};

/** Names this module handles itself, i.e. everything node-emoji would get wrong. */
const OWN_NAMES = {...ALIASES, ...PRESENTATION};

// node-emoji is ESM-only and this file is required from a CommonJS config, so it
// has to be imported dynamically. Cache the promise: the plugins call resolve()
// once per emoji, on every page.
let nodeEmojiPromise;

function nodeEmoji() {
  nodeEmojiPromise ??= import('node-emoji');
  return nodeEmojiPromise;
}

/**
 * Resolve an emoji name to its character, or undefined if no such emoji exists.
 * @param {string} name an emoji name, without the surrounding colons
 * @returns {Promise<string | undefined>}
 */
async function resolve(name) {
  return OWN_NAMES[name] ?? (await nodeEmoji()).get(name);
}

module.exports = {OWN_NAMES, resolve};
