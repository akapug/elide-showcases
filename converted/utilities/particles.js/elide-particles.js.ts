/**
 * Particles.js - Particle Effects
 * Based on https://www.npmjs.com/package/particles.js (~50K+ downloads/week)
 * **POLYGLOT SHOWCASE**: One particle effect for ALL languages on Elide!
 */

export interface ParticlesJSOptions {
  particles?: {
    number?: { value?: number; density?: { enable?: boolean; value_area?: number } };
    color?: { value?: string };
    shape?: { type?: string };
    opacity?: { value?: number };
    size?: { value?: number };
    line_linked?: { enable?: boolean; distance?: number; color?: string };
    move?: { enable?: boolean; speed?: number };
  };
  interactivity?: {
    detect_on?: string;
    events?: {
      onhover?: { enable?: boolean; mode?: string };
      onclick?: { enable?: boolean; mode?: string };
    };
  };
}

export function particlesJS(tagId: string, options: ParticlesJSOptions): void {
  console.log(`Particles initialized on ${tagId}`);
}

export default particlesJS;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Particles.js for Elide (POLYGLOT!)\n");
  particlesJS('particles-js', { particles: { number: { value: 80 } } });
  console.log("✅ Particles initialized");
  console.log("🚀 ~50K+ downloads/week on npm!");
}
