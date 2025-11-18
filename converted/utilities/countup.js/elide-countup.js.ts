/**
 * CountUp.js - Number Counter Animation
 *
 * Animate numbers with smooth counting effects.
 * **POLYGLOT SHOWCASE**: One counter library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/countup.js (~100K+ downloads/week)
 *
 * Features:
 * - Number animations
 * - Decimal support
 * - Custom formatting
 * - Easing functions
 * - Prefix/suffix
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need number animations
 * - ONE implementation works everywhere on Elide
 * - Consistent counters across languages
 * - Share formatting configs across your stack
 *
 * Use cases:
 * - Statistics displays (metrics, KPIs)
 * - Landing pages (impact numbers)
 * - Dashboards (live counters)
 * - Progress indicators (percentages)
 *
 * Package has ~100K+ downloads/week on npm - essential UI utility!
 */

export interface CountUpOptions {
  startVal?: number;
  decimalPlaces?: number;
  duration?: number;
  useEasing?: boolean;
  useGrouping?: boolean;
  separator?: string;
  decimal?: string;
  prefix?: string;
  suffix?: string;
  easingFn?: (t: number, b: number, c: number, d: number) => number;
  onCompleteCallback?: () => void;
}

/**
 * Easing function (easeOutExpo)
 */
function easeOutExpo(t: number, b: number, c: number, d: number): number {
  return t === d ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
}

/**
 * CountUp - Animated number counter
 */
export class CountUp {
  private el: any;
  private startVal: number;
  private endVal: number;
  private decimals: number;
  private duration: number;
  private useEasing: boolean;
  private useGrouping: boolean;
  private separator: string;
  private decimal: string;
  private prefix: string;
  private suffix: string;
  private easingFn: (t: number, b: number, c: number, d: number) => number;
  private callback?: () => void;
  private frameVal: number;
  private rAF: any;
  private startTime: number | null = null;
  private remaining: number;
  private paused = false;

  constructor(
    target: any,
    endVal: number,
    options: CountUpOptions = {}
  ) {
    this.el = target;
    this.startVal = options.startVal || 0;
    this.endVal = endVal;
    this.decimals = Math.max(0, options.decimalPlaces || 0);
    this.duration = options.duration !== undefined ? options.duration * 1000 : 2000;
    this.useEasing = options.useEasing !== undefined ? options.useEasing : true;
    this.useGrouping = options.useGrouping !== undefined ? options.useGrouping : true;
    this.separator = options.separator || ',';
    this.decimal = options.decimal || '.';
    this.prefix = options.prefix || '';
    this.suffix = options.suffix || '';
    this.easingFn = options.easingFn || easeOutExpo;
    this.callback = options.onCompleteCallback;
    this.frameVal = this.startVal;
    this.remaining = this.duration;
  }

  /**
   * Format number with separators
   */
  private formatNumber(num: number): string {
    const neg = num < 0 ? '-' : '';
    const result = Math.abs(num).toFixed(this.decimals);
    const [integer, decimals] = result.split('.');

    let formattedInteger = integer;
    if (this.useGrouping) {
      formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, this.separator);
    }

    return neg + this.prefix + formattedInteger + (decimals ? this.decimal + decimals : '') + this.suffix;
  }

  /**
   * Update display
   */
  private printValue(value: number): void {
    if (this.el && 'textContent' in this.el) {
      this.el.textContent = this.formatNumber(value);
    }
  }

  /**
   * Animation loop
   */
  private count = (timestamp: number): void => {
    if (!this.startTime) this.startTime = timestamp;
    const progress = timestamp - this.startTime;

    if (this.remaining < this.duration) {
      this.frameVal = this.startVal;
    } else {
      if (this.useEasing) {
        this.frameVal = this.easingFn(progress, this.startVal, this.endVal - this.startVal, this.duration);
      } else {
        this.frameVal = this.startVal + (this.endVal - this.startVal) * (progress / this.duration);
      }
    }

    if (this.frameVal > this.endVal) {
      this.frameVal = this.endVal;
    }

    this.frameVal = Math.round(this.frameVal * Math.pow(10, this.decimals)) / Math.pow(10, this.decimals);
    this.printValue(this.frameVal);

    if (progress < this.duration) {
      this.rAF = requestAnimationFrame(this.count);
    } else {
      this.frameVal = this.endVal;
      this.printValue(this.frameVal);
      this.callback?.();
    }
  };

  /**
   * Start counting
   */
  start(): void {
    if (this.paused) {
      this.resume();
      return;
    }
    this.printValue(this.startVal);
    this.rAF = requestAnimationFrame(this.count);
  }

  /**
   * Pause counting
   */
  pauseResume(): void {
    if (!this.paused) {
      cancelAnimationFrame(this.rAF);
      this.paused = true;
    } else {
      this.paused = false;
      this.startTime = null;
      this.duration = this.remaining;
      this.rAF = requestAnimationFrame(this.count);
    }
  }

  /**
   * Resume counting
   */
  resume(): void {
    if (this.paused) {
      this.pauseResume();
    }
  }

  /**
   * Reset counter
   */
  reset(): void {
    this.paused = false;
    cancelAnimationFrame(this.rAF);
    this.startTime = null;
    this.frameVal = this.startVal;
    this.printValue(this.startVal);
  }

  /**
   * Update end value and restart
   */
  update(newEndVal: number): void {
    cancelAnimationFrame(this.rAF);
    this.startTime = null;
    this.startVal = this.frameVal;
    this.endVal = newEndVal;
    this.rAF = requestAnimationFrame(this.count);
  }
}

export default CountUp;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔢 CountUp.js - Number Animations for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Counter ===");
  const el1 = { textContent: '' };
  const counter1 = new CountUp(el1, 1000);
  counter1.start();
  console.log("Counting to 1,000...");
  setTimeout(() => console.log(`Result: ${el1.textContent}`), 100);
  console.log();

  console.log("=== Example 2: With Decimals ===");
  const el2 = { textContent: '' };
  const counter2 = new CountUp(el2, 99.99, {
    decimalPlaces: 2,
    duration: 2,
  });
  counter2.start();
  console.log("Counting to $99.99 with 2 decimals");
  console.log();

  console.log("=== Example 3: Custom Formatting ===");
  const el3 = { textContent: '' };
  const counter3 = new CountUp(el3, 1234567.89, {
    decimalPlaces: 2,
    prefix: '$',
    suffix: ' USD',
    separator: ',',
    decimal: '.',
  });
  counter3.start();
  console.log("Format: $1,234,567.89 USD");
  console.log();

  console.log("=== Example 4: Percentage Counter ===");
  const el4 = { textContent: '' };
  const counter4 = new CountUp(el4, 95, {
    suffix: '%',
    duration: 1.5,
  });
  counter4.start();
  console.log("Counting to 95%");
  console.log();

  console.log("=== Example 5: No Grouping ===");
  const el5 = { textContent: '' };
  const counter5 = new CountUp(el5, 1000000, {
    useGrouping: false,
  });
  counter5.start();
  console.log("No commas: 1000000");
  console.log();

  console.log("=== Example 6: Configuration Options ===");
  console.log("Option        | Default | Description");
  console.log("--------------|---------|-------------");
  console.log("startVal      | 0       | Starting value");
  console.log("duration      | 2       | Duration (seconds)");
  console.log("decimalPlaces | 0       | Decimal places");
  console.log("useEasing     | true    | Use easing function");
  console.log("useGrouping   | true    | Use thousands separator");
  console.log("separator     | ,       | Thousands separator");
  console.log("decimal       | .       | Decimal separator");
  console.log("prefix        | ''      | Text before number");
  console.log("suffix        | ''      | Text after number");
  console.log();

  console.log("=== Example 7: Control Methods ===");
  console.log("Available methods:");
  console.log("  • start() - Start counting");
  console.log("  • pauseResume() - Pause/resume");
  console.log("  • reset() - Reset to start");
  console.log("  • update(n) - Update end value");
  console.log();

  console.log("=== Example 8: Callback Example ===");
  const el6 = { textContent: '' };
  const counter6 = new CountUp(el6, 100, {
    duration: 1,
    onCompleteCallback: () => {
      console.log("  Counter completed!");
    },
  });
  counter6.start();
  console.log("Counter with callback");
  console.log();

  console.log("=== Example 9: Real-World Examples ===");
  console.log("Use Case         | Format");
  console.log("-----------------|--------");
  console.log("Users Online     | 1,234 users");
  console.log("Revenue          | $1,234,567.89");
  console.log("Success Rate     | 99.5%");
  console.log("Files Processed  | 45,678");
  console.log("Response Time    | 123ms");
  console.log();

  console.log("=== Example 10: POLYGLOT Use Case ===");
  console.log("🌐 Same counter library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One counter library, all languages");
  console.log("  ✓ Consistent formatting everywhere");
  console.log("  ✓ Share number animations across stack");
  console.log("  ✓ Perfect for dashboards");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Statistics displays (metrics, KPIs)");
  console.log("- Landing pages (impact numbers, testimonials)");
  console.log("- Dashboards (live counters, analytics)");
  console.log("- Progress indicators (percentages, completion)");
  console.log("- Financial displays (revenue, prices)");
  console.log("- Social proof (users, downloads, ratings)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Smooth 60fps animations");
  console.log("- Lightweight and fast");
  console.log("- ~100K+ downloads/week on npm!");
}
