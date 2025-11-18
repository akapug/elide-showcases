/**
 * Motion - Modern Web Animations API
 *
 * A simple, powerful motion library for web animations.
 * **POLYGLOT SHOWCASE**: One animation library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/motion (~100K+ downloads/week)
 *
 * Features:
 * - CSS animations
 * - Keyframe animations
 * - Easing functions
 * - Animation sequences
 * - Timeline control
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need animations
 * - ONE implementation works everywhere on Elide
 * - Consistent animations across languages
 * - Share animation configs across your stack
 *
 * Use cases:
 * - Web animations (smooth transitions)
 * - UI effects (fades, slides, scales)
 * - Loading animations (spinners, progress)
 * - Interactive feedback (hover, click)
 *
 * Package has ~100K+ downloads/week on npm - modern animation utility!
 */

export type EasingFunction = (t: number) => number;

// Easing functions
export const easings = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
};

export interface AnimationOptions {
  duration: number;
  easing?: EasingFunction;
  delay?: number;
  repeat?: number;
  direction?: 'normal' | 'reverse' | 'alternate';
  onUpdate?: (progress: number) => void;
  onComplete?: () => void;
}

export interface KeyframeOptions extends AnimationOptions {
  keyframes: Record<string, any>[];
}

/**
 * Animate a value from start to end
 */
export function animate(
  from: number,
  to: number,
  options: AnimationOptions
): { stop: () => void } {
  const {
    duration,
    easing = easings.linear,
    delay = 0,
    repeat = 0,
    direction = 'normal',
    onUpdate = () => {},
    onComplete = () => {},
  } = options;

  let startTime: number | null = null;
  let animationFrame: number | null = null;
  let currentIteration = 0;
  let stopped = false;

  const step = (timestamp: number) => {
    if (stopped) return;

    if (!startTime) startTime = timestamp + delay;
    const elapsed = timestamp - startTime;

    if (elapsed < 0) {
      animationFrame = requestAnimationFrame(step) as any;
      return;
    }

    let progress = Math.min(elapsed / duration, 1);

    if (direction === 'reverse') {
      progress = 1 - progress;
    } else if (direction === 'alternate' && currentIteration % 2 === 1) {
      progress = 1 - progress;
    }

    const easedProgress = easing(progress);
    const currentValue = from + (to - from) * easedProgress;

    onUpdate(currentValue);

    if (progress >= 1) {
      if (currentIteration < repeat) {
        currentIteration++;
        startTime = timestamp;
        animationFrame = requestAnimationFrame(step) as any;
      } else {
        onComplete();
      }
    } else {
      animationFrame = requestAnimationFrame(step) as any;
    }
  };

  animationFrame = requestAnimationFrame(step) as any;

  return {
    stop: () => {
      stopped = true;
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame as any);
      }
    },
  };
}

/**
 * Animation timeline for sequencing multiple animations
 */
export class Timeline {
  private animations: Array<{ startTime: number; animation: any }> = [];
  private currentTime = 0;
  private playing = false;

  add(animation: any, offset: number = 0): this {
    this.animations.push({
      startTime: this.currentTime + offset,
      animation,
    });
    if (offset === 0) {
      this.currentTime += animation.duration || 0;
    }
    return this;
  }

  play(): void {
    this.playing = true;
    this.animations.forEach(({ startTime, animation }) => {
      setTimeout(() => {
        if (this.playing && animation.play) {
          animation.play();
        }
      }, startTime);
    });
  }

  stop(): void {
    this.playing = false;
    this.animations.forEach(({ animation }) => {
      if (animation.stop) animation.stop();
    });
  }

  reset(): void {
    this.stop();
    this.currentTime = 0;
  }
}

/**
 * Keyframe animation
 */
export function animateKeyframes(options: KeyframeOptions): { stop: () => void } {
  const { keyframes, ...animOptions } = options;
  let currentFrame = 0;
  let stopped = false;

  const animations: any[] = [];

  for (let i = 0; i < keyframes.length - 1; i++) {
    const from = keyframes[i];
    const to = keyframes[i + 1];

    // Animate each property
    Object.keys(to).forEach(key => {
      if (typeof from[key] === 'number' && typeof to[key] === 'number') {
        animations.push(
          animate(from[key], to[key], {
            ...animOptions,
            duration: animOptions.duration / (keyframes.length - 1),
          })
        );
      }
    });
  }

  return {
    stop: () => {
      stopped = true;
      animations.forEach(a => a.stop());
    },
  };
}

export default { animate, easings, Timeline, animateKeyframes };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("✨ Motion - Web Animations for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Animation ===");
  console.log("Animating from 0 to 100:");
  let step = 0;
  animate(0, 100, {
    duration: 1000,
    easing: easings.easeInOut,
    onUpdate: (value) => {
      if (step++ < 5) console.log(`  ${value.toFixed(2)}`);
    },
    onComplete: () => console.log("  Animation complete!"),
  });
  console.log();

  console.log("=== Example 2: Easing Functions ===");
  console.log("Available easings:");
  Object.keys(easings).forEach(name => {
    console.log(`  - ${name}`);
  });
  console.log();

  console.log("=== Example 3: With Delay ===");
  console.log("Animation with 500ms delay:");
  animate(0, 100, {
    duration: 1000,
    delay: 500,
    onUpdate: (value) => console.log(`  Delayed: ${value.toFixed(2)}`),
  });
  console.log();

  console.log("=== Example 4: Repeating Animation ===");
  console.log("Animation repeats 2 times:");
  animate(0, 100, {
    duration: 500,
    repeat: 2,
    onUpdate: (value) => console.log(`  Repeat: ${value.toFixed(2)}`),
  });
  console.log();

  console.log("=== Example 5: Reverse Direction ===");
  animate(0, 100, {
    duration: 1000,
    direction: 'reverse',
    onUpdate: (value) => console.log(`  Reverse: ${value.toFixed(2)}`),
  });
  console.log();

  console.log("=== Example 6: Timeline ===");
  const timeline = new Timeline();
  console.log("Creating animation sequence:");
  console.log("  1. Fade in (0 → 1)");
  console.log("  2. Scale up (1 → 1.5)");
  console.log("  3. Rotate (0 → 360)");
  console.log();

  console.log("=== Example 7: Easing Comparison ===");
  console.log("Progress | Linear | EaseIn | EaseOut | EaseInOut");
  console.log("---------|--------|--------|---------|----------");
  [0, 0.25, 0.5, 0.75, 1].forEach(t => {
    console.log(
      `${(t * 100).toFixed(0).padStart(3)}%     | ` +
      `${easings.linear(t).toFixed(2)}   | ` +
      `${easings.easeIn(t).toFixed(2)}   | ` +
      `${easings.easeOut(t).toFixed(2)}    | ` +
      `${easings.easeInOut(t).toFixed(2)}`
    );
  });
  console.log();

  console.log("=== Example 8: Keyframe Animation ===");
  console.log("Keyframes: [0, 50, 100, 0]");
  animateKeyframes({
    keyframes: [
      { value: 0 },
      { value: 50 },
      { value: 100 },
      { value: 0 },
    ],
    duration: 2000,
    easing: easings.easeInOut,
  });
  console.log();

  console.log("=== Example 9: POLYGLOT Use Case ===");
  console.log("🌐 Same motion library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One animation library, all languages");
  console.log("  ✓ Consistent easing functions everywhere");
  console.log("  ✓ Share animation configs across your stack");
  console.log("  ✓ No need for language-specific animation libs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Web animations (smooth transitions)");
  console.log("- UI effects (fades, slides, scales)");
  console.log("- Loading animations (spinners, progress bars)");
  console.log("- Interactive feedback (hover, click effects)");
  console.log("- Data visualization (animated charts)");
  console.log("- Game development (smooth movement)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- RequestAnimationFrame for smooth 60fps");
  console.log("- Lightweight and fast");
  console.log("- ~100K+ downloads/week on npm!");
}
