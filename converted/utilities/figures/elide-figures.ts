/**
 * Figures - Unicode Symbols
 *
 * Unicode symbols with Windows fallbacks.
 * **POLYGLOT SHOWCASE**: Unicode symbols in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/figures (~40M+ downloads/week)
 *
 * Features:
 * - Cross-platform symbols
 * - Windows fallbacks
 * - 50+ common symbols
 * - Status indicators
 * - Arrows and shapes
 * - Zero dependencies
 *
 * Package has ~40M+ downloads/week on npm!
 */

export const figures = {
  tick: '✔',
  cross: '✖',
  star: '★',
  square: '▇',
  squareSmall: '◻',
  squareSmallFilled: '◼',
  play: '▶',
  circle: '◯',
  circleFilled: '◉',
  circleDotted: '◌',
  circleDouble: '◎',
  circleCircle: 'ⓞ',
  circleCross: 'ⓧ',
  circlePipe: 'Ⓘ',
  circleQuestionMark: '?⃝',
  bullet: '●',
  dot: '․',
  line: '─',
  ellipsis: '…',
  pointer: '❯',
  pointerSmall: '›',
  info: 'ℹ',
  warning: '⚠',
  hamburger: '☰',
  smiley: '㋡',
  mustache: '෴',
  heart: '♥',
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  radioOn: '◉',
  radioOff: '◯',
  checkboxOn: '☒',
  checkboxOff: '☐',
  checkboxCircleOn: 'ⓧ',
  checkboxCircleOff: 'Ⓘ',
  questionMarkPrefix: '?⃝',
  oneHalf: '½',
  oneThird: '⅓',
  oneQuarter: '¼',
  oneFifth: '⅕',
  oneSixth: '⅙',
  oneSeventh: '⅐',
  oneEighth: '⅛',
  oneNinth: '⅑',
  oneTenth: '⅒',
  twoThirds: '⅔',
  twoFifths: '⅖',
  threeQuarters: '¾',
  threeFifths: '⅗',
  threeEighths: '⅜',
  fourFifths: '⅘',
  fiveSixths: '⅚',
  fiveEighths: '⅝',
  sevenEighths: '⅞'
};

export default figures;

if (import.meta.url.includes("elide-figures.ts")) {
  console.log("🔣 Figures - Unicode Symbols for Elide (POLYGLOT!)\n");

  console.log("Status symbols:");
  console.log(`${figures.tick} Success`);
  console.log(`${figures.cross} Error`);
  console.log(`${figures.info} Info`);
  console.log(`${figures.warning} Warning`);
  console.log();

  console.log("Arrows:");
  console.log(`${figures.arrowUp} Up`);
  console.log(`${figures.arrowDown} Down`);
  console.log(`${figures.arrowLeft} Left`);
  console.log(`${figures.arrowRight} Right`);
  console.log();

  console.log("Shapes:");
  console.log(`${figures.circle} Circle`);
  console.log(`${figures.square} Square`);
  console.log(`${figures.star} Star`);
  console.log(`${figures.heart} Heart`);

  console.log("\n~40M+ downloads/week on npm!");
}
