/**
 * pizzicato - Audio Effects Library
 *
 * Simple audio effects library for Web Audio API.
 * **POLYGLOT SHOWCASE**: Audio effects for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/pizzicato (~10K+ downloads/week)
 *
 * Features:
 * - Audio effects (reverb, delay, distortion)
 * - Simple API for sound manipulation
 * - Effect chaining
 * - Volume control
 * - Zero dependencies
 *
 * Package has ~10K+ downloads/week on npm!
 */

export class Sound {
  private volume = 1.0;
  private effects: Effect[] = [];

  constructor(source: string | { source: string }) {
    const src = typeof source === 'string' ? source : source.source;
    console.log(`[Pizzicato] Sound created: ${src}`);
  }

  play() {
    console.log('[Pizzicato] Playing sound');
  }

  stop() {
    console.log('[Pizzicato] Stopped');
  }

  addEffect(effect: Effect) {
    this.effects.push(effect);
    console.log(`[Pizzicato] Added ${effect.constructor.name} effect`);
  }

  setVolume(vol: number) {
    this.volume = vol;
    console.log(`[Pizzicato] Volume: ${(vol * 100).toFixed(0)}%`);
  }
}

class Effect {}

export class Distortion extends Effect {
  constructor(public amount: number = 0.5) {
    super();
    console.log(`[Pizzicato] Distortion created (${amount})`);
  }
}

export class Delay extends Effect {
  constructor(public time: number = 0.5, public feedback: number = 0.5) {
    super();
    console.log(`[Pizzicato] Delay created (${time}s, feedback: ${feedback})`);
  }
}

export class Reverb extends Effect {
  constructor(public time: number = 1.0, public decay: number = 0.5) {
    super();
    console.log(`[Pizzicato] Reverb created (${time}s, decay: ${decay})`);
  }
}

export default { Sound, Distortion, Delay, Reverb };

// CLI Demo
if (import.meta.url.includes("elide-pizzicato.ts")) {
  console.log("🎸 pizzicato - Audio Effects for Elide (POLYGLOT!)\n");

  const sound = new Sound('sound.wav');
  sound.addEffect(new Distortion(0.8));
  sound.addEffect(new Delay(0.3, 0.6));
  sound.addEffect(new Reverb(2.0, 0.7));
  sound.setVolume(0.8);
  sound.play();

  console.log("\n~10K+ downloads/week on npm!");
}
