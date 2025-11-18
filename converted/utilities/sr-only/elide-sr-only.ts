/**
 * sr-only - Screen Reader Only Utility
 *
 * CSS utility class for screen reader only content.
 * **POLYGLOT SHOWCASE**: SR-only for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/sr-only (~50K+ downloads/week)
 *
 * Features:
 * - SR-only class generation
 * - Focusable variant
 * - CSS-in-JS support
 * - Tailwind compatible
 * - Bootstrap compatible
 * - Zero dependencies
 *
 * Package has ~50K+ downloads/week on npm!
 */

const SR_ONLY_CSS = `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
`;

class SrOnly {
  getCSS(): string {
    return SR_ONLY_CSS;
  }

  getStyles(): Record<string, string> {
    return {
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: '0',
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      borderWidth: '0'
    };
  }

  apply(element: Element): void {
    element.classList.add('sr-only');
    console.log('[sr-only] Applied sr-only class');
  }

  applyFocusable(element: Element): void {
    element.classList.add('sr-only', 'sr-only-focusable');
    console.log('[sr-only] Applied sr-only-focusable classes');
  }

  remove(element: Element): void {
    element.classList.remove('sr-only', 'sr-only-focusable');
    console.log('[sr-only] Removed sr-only classes');
  }
}

const srOnly = new SrOnly();

export default srOnly;
export { SrOnly, SR_ONLY_CSS };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("♿ sr-only - Screen Reader Only Utility (POLYGLOT!)\n");

  console.log("=== CSS Output ===");
  console.log(srOnly.getCSS().substring(0, 150) + '...');
  console.log();

  console.log("=== Styles Object ===");
  const styles = srOnly.getStyles();
  console.log(`position: ${styles.position}`);
  console.log(`width: ${styles.width}`);
  console.log();

  console.log("=== Apply to Element ===");
  const element = document.createElement('span');
  srOnly.apply(element);
  console.log(`Classes: ${element.className}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Skip navigation links");
  console.log("- Accessible form labels");
  console.log("- Icon descriptions");
  console.log("- Focus indicators");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Pure CSS");
  console.log("- ~50K+ downloads/week on npm!");
}
