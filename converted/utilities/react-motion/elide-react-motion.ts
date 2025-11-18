/**
 * React Motion - Spring Physics Animation Library
 *
 * A spring-based animation library for React with natural physics.
 * **POLYGLOT SHOWCASE**: One motion library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/react-motion (~300K+ downloads/week)
 *
 * Features:
 * - Spring physics animations
 * - Natural motion curves
 * - Chainable animations
 * - Stagger effects
 * - Velocity tracking
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need smooth animations
 * - ONE implementation works everywhere on Elide
 * - Consistent motion across languages
 * - Share animation configs across your stack
 *
 * Use cases:
 * - UI animations (smooth transitions)
 * - Interactive elements (drag, hover)
 * - Data visualizations (animated charts)
 * - Game development (physics-based movement)
 *
 * Package has ~300K+ downloads/week on npm - essential animation utility!
 */

// Spring configuration presets
export const SPRING_PRESETS = {
  noWobble: { stiffness: 170, damping: 26 },
  gentle: { stiffness: 120, damping: 14 },
  wobbly: { stiffness: 180, damping: 12 },
  stiff: { stiffness: 210, damping: 20 },
  slow: { stiffness: 280, damping: 60 },
  molasses: { stiffness: 280, damping: 120 },
};

export interface SpringConfig {
  stiffness: number;
  damping: number;
  precision?: number;
}

export interface SpringValue {
  value: number;
  velocity: number;
}

/**
 * Calculate spring physics for one step
 */
function stepSpring(
  current: number,
  target: number,
  velocity: number,
  config: SpringConfig,
  deltaTime: number = 1 / 60
): SpringValue {
  const { stiffness, damping, precision = 0.01 } = config;

  // Spring force equation
  const springForce = -stiffness * (current - target);
  const dampingForce = -damping * velocity;
  const acceleration = springForce + dampingForce;

  // Update velocity and position
  const newVelocity = velocity + acceleration * deltaTime;
  const newValue = current + newVelocity * deltaTime;

  // Check if spring has settled
  const isSettled =
    Math.abs(newVelocity) < precision && Math.abs(newValue - target) < precision;

  return {
    value: isSettled ? target : newValue,
    velocity: isSettled ? 0 : newVelocity,
  };
}

/**
 * Motion - Animated value with spring physics
 */
export class Motion {
  private currentValue: number;
  private currentVelocity: number;
  private targetValue: number;
  private config: SpringConfig;
  private animationFrame: number | null = null;
  private callbacks: Set<(value: number) => void> = new Set();

  constructor(initialValue: number = 0, config: SpringConfig = SPRING_PRESETS.noWobble) {
    this.currentValue = initialValue;
    this.currentVelocity = 0;
    this.targetValue = initialValue;
    this.config = config;
  }

  /**
   * Set target value and start animation
   */
  spring(target: number, config?: SpringConfig): this {
    this.targetValue = target;
    if (config) {
      this.config = config;
    }
    this.startAnimation();
    return this;
  }

  /**
   * Get current value
   */
  get value(): number {
    return this.currentValue;
  }

  /**
   * Get current velocity
   */
  get velocity(): number {
    return this.currentVelocity;
  }

  /**
   * Subscribe to value changes
   */
  onChange(callback: (value: number) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  /**
   * Start animation loop
   */
  private startAnimation(): void {
    if (this.animationFrame !== null) return;

    const animate = () => {
      const { value, velocity } = stepSpring(
        this.currentValue,
        this.targetValue,
        this.currentVelocity,
        this.config
      );

      this.currentValue = value;
      this.currentVelocity = velocity;

      // Notify subscribers
      this.callbacks.forEach(cb => cb(value));

      // Continue if not settled
      if (Math.abs(value - this.targetValue) > 0.01 || Math.abs(velocity) > 0.01) {
        this.animationFrame = requestAnimationFrame(animate) as any;
      } else {
        this.animationFrame = null;
      }
    };

    this.animationFrame = requestAnimationFrame(animate) as any;
  }

  /**
   * Stop animation
   */
  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame as any);
      this.animationFrame = null;
    }
  }

  /**
   * Set value immediately without animation
   */
  set(value: number): this {
    this.stop();
    this.currentValue = value;
    this.targetValue = value;
    this.currentVelocity = 0;
    this.callbacks.forEach(cb => cb(value));
    return this;
  }
}

/**
 * StaggeredMotion - Multiple springs with stagger effect
 */
export class StaggeredMotion {
  private springs: Motion[] = [];
  private staggerDelay: number;

  constructor(count: number, staggerDelay: number = 50) {
    this.staggerDelay = staggerDelay;
    for (let i = 0; i < count; i++) {
      this.springs.push(new Motion());
    }
  }

  /**
   * Animate all springs with stagger
   */
  spring(targets: number[], config?: SpringConfig): this {
    this.springs.forEach((spring, i) => {
      setTimeout(() => {
        spring.spring(targets[i] || 0, config);
      }, i * this.staggerDelay);
    });
    return this;
  }

  /**
   * Get all current values
   */
  get values(): number[] {
    return this.springs.map(s => s.value);
  }

  /**
   * Subscribe to value changes
   */
  onChange(callback: (values: number[]) => void): () => void {
    const unsubscribers = this.springs.map(spring =>
      spring.onChange(() => callback(this.values))
    );
    return () => unsubscribers.forEach(unsub => unsub());
  }

  /**
   * Stop all animations
   */
  stop(): void {
    this.springs.forEach(s => s.stop());
  }
}

/**
 * Presets for common animations
 */
export const presets = SPRING_PRESETS;

export default Motion;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🌊 React Motion - Spring Physics Animation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Spring Animation ===");
  const motion1 = new Motion(0);
  let step = 0;
  motion1.onChange((value) => {
    if (step++ < 10) {
      console.log(`Value: ${value.toFixed(2)}, Velocity: ${motion1.velocity.toFixed(2)}`);
    }
  });
  motion1.spring(100);
  console.log();

  console.log("=== Example 2: Spring Presets ===");
  console.log("Available presets:");
  Object.entries(SPRING_PRESETS).forEach(([name, config]) => {
    console.log(`  ${name}: stiffness=${config.stiffness}, damping=${config.damping}`);
  });
  console.log();

  console.log("=== Example 3: Wobbly Animation ===");
  const motion2 = new Motion(0);
  console.log("Animating with wobbly preset:");
  motion2.spring(100, SPRING_PRESETS.wobbly);
  console.log(`Current: ${motion2.value.toFixed(2)}, Target: 100`);
  console.log();

  console.log("=== Example 4: Staggered Animation ===");
  const staggered = new StaggeredMotion(5, 100);
  console.log("5 springs with 100ms stagger:");
  staggered.spring([100, 90, 80, 70, 60]);
  console.log(`Initial values: [${staggered.values.join(', ')}]`);
  console.log();

  console.log("=== Example 5: Custom Spring Config ===");
  const motion3 = new Motion(0);
  const customConfig: SpringConfig = {
    stiffness: 150,
    damping: 20,
    precision: 0.001,
  };
  motion3.spring(100, customConfig);
  console.log("Custom config:", customConfig);
  console.log();

  console.log("=== Example 6: Multiple Springs ===");
  const x = new Motion(0);
  const y = new Motion(0);
  x.spring(100);
  y.spring(50);
  console.log(`Position: (${x.value.toFixed(2)}, ${y.value.toFixed(2)})`);
  console.log();

  console.log("=== Example 7: Velocity Tracking ===");
  const motion4 = new Motion(0);
  motion4.spring(100, SPRING_PRESETS.wobbly);
  console.log(`Velocity: ${motion4.velocity.toFixed(2)} units/sec`);
  console.log();

  console.log("=== Example 8: Immediate Set ===");
  const motion5 = new Motion(0);
  motion5.spring(100);
  motion5.set(50); // Jump to 50 immediately
  console.log(`Value after set: ${motion5.value}`);
  console.log();

  console.log("=== Example 9: Physics Comparison ===");
  console.log("Spring Type | Stiffness | Damping | Feel");
  console.log("------------|-----------|---------|-----");
  console.log("No Wobble   | 170       | 26      | Smooth, no bounce");
  console.log("Gentle      | 120       | 14      | Slow and smooth");
  console.log("Wobbly      | 180       | 12      | Bouncy");
  console.log("Stiff       | 210       | 20      | Quick response");
  console.log("Slow        | 280       | 60      | Very slow");
  console.log("Molasses    | 280       | 120     | Extremely slow");
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same motion library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One animation library, all languages");
  console.log("  ✓ Consistent physics across platforms");
  console.log("  ✓ Share motion configs across your stack");
  console.log("  ✓ No need for language-specific animation libs");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- UI animations (buttons, modals, transitions)");
  console.log("- Interactive elements (drag, swipe gestures)");
  console.log("- Data visualizations (animated charts)");
  console.log("- Game development (physics-based movement)");
  console.log("- Loading indicators (smooth progress)");
  console.log("- Page transitions (route changes)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- RequestAnimationFrame for smooth 60fps");
  console.log("- Instant execution on Elide");
  console.log("- ~300K+ downloads/week on npm!");
  console.log();

  console.log("💡 Polyglot Tips:");
  console.log("- Use in Python/Ruby/Java UI frameworks via Elide");
  console.log("- Share spring configs across languages");
  console.log("- One motion system for all platforms");
  console.log("- Perfect for polyglot animation pipelines!");
}
