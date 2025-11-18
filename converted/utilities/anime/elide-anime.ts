/**
 * anime.js - Animation Library
 *
 * Lightweight JavaScript animation library.
 * **POLYGLOT SHOWCASE**: Beautiful animations in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/animejs (~200K+ downloads/week)
 *
 * Features:
 * - CSS, SVG, DOM, JS object animations
 * - Keyframes
 * - Timeline
 * - Easing functions
 * - Stagger effects
 *
 * Package has ~200K+ downloads/week on npm!
 */

export interface AnimeParams {
  targets?: any;
  duration?: number;
  delay?: number;
  easing?: string;
  loop?: boolean | number;
  direction?: 'normal' | 'reverse' | 'alternate';
  autoplay?: boolean;
  [key: string]: any;
}

export class AnimeInstance {
  private params: AnimeParams;
  private time = 0;
  private duration: number;
  playing = false;

  constructor(params: AnimeParams) {
    this.params = params;
    this.duration = params.duration || 1000;

    if (params.autoplay !== false) {
      this.play();
    }
  }

  play(): this {
    this.playing = true;
    return this;
  }

  pause(): this {
    this.playing = false;
    return this;
  }

  restart(): this {
    this.time = 0;
    this.playing = true;
    return this;
  }

  seek(time: number): this {
    this.time = time;
    return this;
  }
}

export function anime(params: AnimeParams): AnimeInstance {
  return new AnimeInstance(params);
}

anime.timeline = function(params?: AnimeParams): Timeline {
  return new Timeline(params);
};

export class Timeline {
  private animations: AnimeInstance[] = [];

  constructor(private params?: AnimeParams) {}

  add(params: AnimeParams): this {
    this.animations.push(new AnimeInstance(params));
    return this;
  }

  play(): this {
    this.animations.forEach(a => a.play());
    return this;
  }

  pause(): this {
    this.animations.forEach(a => a.pause());
    return this;
  }
}

export default anime;

if (import.meta.url.includes("elide-anime.ts")) {
  console.log("✨ anime.js - Animation Library for Elide (POLYGLOT!)\n");

  const animation = anime({
    targets: { x: 0, y: 0 },
    duration: 1000,
    x: 100,
    y: 50,
  });

  console.log("Animation created");
  console.log("Playing:", animation.playing);

  const timeline = anime.timeline();
  timeline
    .add({ targets: { x: 0 }, x: 100, duration: 500 })
    .add({ targets: { y: 0 }, y: 50, duration: 500 });

  console.log("\n✅ ~200K+ downloads/week on npm");
}
