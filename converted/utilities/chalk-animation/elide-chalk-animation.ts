/**
 * Chalk Animation - Animated Terminal Text
 *
 * Create animated colorful terminal text.
 * **POLYGLOT SHOWCASE**: Terminal animations for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/chalk-animation (~100K+ downloads/week)
 *
 * Features:
 * - Animated terminal text
 * - Multiple animation effects
 * - Color cycling
 * - Start/stop control
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

export class ChalkAnimation {
  private text: string;
  private interval: NodeJS.Timeout | null = null;
  private frame: number = 0;

  constructor(text: string) {
    this.text = text;
  }

  rainbow(): void {
    const colors = [31, 33, 32, 36, 34, 35];
    this.interval = setInterval(() => {
      const color = colors[this.frame % colors.length];
      process.stdout.write(`\r\x1b[${color}m${this.text}\x1b[0m`);
      this.frame++;
    }, 100);
  }

  pulse(): void {
    this.interval = setInterval(() => {
      const bright = this.frame % 2 === 0 ? '1;' : '';
      process.stdout.write(`\r\x1b[${bright}32m${this.text}\x1b[0m`);
      this.frame++;
    }, 500);
  }

  glitch(): void {
    this.interval = setInterval(() => {
      const chars = this.text.split('').map(c =>
        Math.random() > 0.9 ? String.fromCharCode(33 + Math.random() * 94) : c
      ).join('');
      process.stdout.write(`\r\x1b[31m${chars}\x1b[0m`);
    }, 100);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      process.stdout.write('\n');
    }
  }
}

export function chalkAnimation(text: string, effect: string = 'rainbow'): ChalkAnimation {
  const anim = new ChalkAnimation(text);
  if (effect === 'rainbow') anim.rainbow();
  else if (effect === 'pulse') anim.pulse();
  else if (effect === 'glitch') anim.glitch();
  return anim;
}

export default chalkAnimation;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Chalk Animation - Animated Text (POLYGLOT!)\n");

  const anim = chalkAnimation('ELIDE RUNTIME', 'rainbow');

  setTimeout(() => {
    anim.stop();
    console.log("\n🚀 ~100K+ downloads/week on npm!");
    process.exit(0);
  }, 3000);
}
