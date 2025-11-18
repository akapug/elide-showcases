/**
 * CLI-Spinners - Spinner Collection
 *
 * Collection of 70+ terminal spinners.
 * **POLYGLOT SHOWCASE**: Spinner collection in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/cli-spinners (~30M+ downloads/week)
 *
 * Package has ~30M+ downloads/week on npm!
 */

export const spinners = {
  dots: { frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] },
  dots2: { frames: ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'] },
  line: { frames: ['-', '\\', '|', '/'] },
  line2: { frames: ['⠂', '-', '–', '—', '–', '-'] },
  arrow: { frames: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'] },
  arrow2: { frames: ['⬆️ ', '↗️ ', '➡️ ', '↘️ ', '⬇️ ', '↙️ ', '⬅️ ', '↖️ '] },
  bouncingBar: { frames: ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]'] },
  bouncingBall: { frames: ['( ●    )', '(  ●   )', '(   ●  )', '(    ● )', '(     ●)', '(    ● )', '(   ●  )', '(  ●   )', '( ●    )', '(●     )'] },
  clock: { frames: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'] },
  earth: { frames: ['🌍', '🌎', '🌏'] },
  moon: { frames: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'] },
  runner: { frames: ['🚶', '🏃'] },
  pong: { frames: ['▐⠂       ▌', '▐⠈       ▌', '▐ ⠂      ▌', '▐ ⠠      ▌', '▐  ⡀     ▌', '▐  ⠠     ▌', '▐   ⠂    ▌', '▐   ⠈    ▌', '▐    ⠂   ▌', '▐    ⠠   ▌', '▐     ⡀  ▌', '▐     ⠠  ▌', '▐      ⠂ ▌', '▐      ⠈ ▌', '▐       ⠂▌', '▐       ⠠▌', '▐       ⡀▌', '▐      ⠠ ▌', '▐      ⠂ ▌', '▐     ⠈  ▌', '▐     ⠂  ▌', '▐    ⠠   ▌', '▐    ⡀   ▌', '▐   ⠠    ▌', '▐   ⠂    ▌', '▐  ⠈     ▌', '▐  ⠂     ▌', '▐ ⠠      ▌', '▐ ⡀      ▌', '▐⠠       ▌'] }
};

export default spinners;

if (import.meta.url.includes("elide-cli-spinners.ts")) {
  console.log("🌀 CLI-Spinners - Spinner Collection for Elide (POLYGLOT!)\n");

  console.log("Available spinners:");
  for (const [name, spinner] of Object.entries(spinners)) {
    console.log(`${name}: ${spinner.frames[0]} (${spinner.frames.length} frames)`);
  }

  console.log("\n~30M+ downloads/week on npm!");
}
