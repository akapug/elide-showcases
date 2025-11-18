/**
 * jsx-a11y - JSX Accessibility Utilities
 *
 * Accessibility utilities for JSX/React development.
 * **POLYGLOT SHOWCASE**: JSX a11y for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/jsx-a11y (~500K+ downloads/week)
 *
 * Features:
 * - JSX accessibility rules
 * - ARIA attribute validation
 * - Interactive element checks
 * - Alt text validation
 * - Label association checking
 * - Zero dependencies
 *
 * Use cases:
 * - ESLint plugin foundation
 * - JSX linting
 * - Accessibility testing
 * - Development tooling
 *
 * Package has ~500K+ downloads/week on npm!
 */

interface JSXElement {
  type: string;
  props: Record<string, any>;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

class JSXAccessibility {
  /**
   * Check if element has accessible name
   */
  hasAccessibleName(element: JSXElement): ValidationResult {
    const errors: string[] = [];
    const { type, props } = element;

    // Buttons need accessible names
    if (type === 'button' && !props.children && !props['aria-label']) {
      errors.push('Button must have accessible name');
    }

    // Links need accessible names
    if (type === 'a' && !props.children && !props['aria-label']) {
      errors.push('Link must have accessible name');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check image alt text
   */
  checkImageAlt(element: JSXElement): ValidationResult {
    const errors: string[] = [];

    if (element.type === 'img' && !element.props.alt) {
      errors.push('Image must have alt attribute');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check form labels
   */
  checkFormLabel(element: JSXElement): ValidationResult {
    const errors: string[] = [];
    const { type, props } = element;

    const inputTypes = ['input', 'select', 'textarea'];
    if (inputTypes.includes(type)) {
      if (!props['aria-label'] && !props.id) {
        errors.push('Form element must have label');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate ARIA attributes
   */
  validateARIA(element: JSXElement): ValidationResult {
    const errors: string[] = [];
    const validRoles = new Set(['button', 'link', 'navigation', 'main', 'dialog']);

    if (element.props.role && !validRoles.has(element.props.role)) {
      errors.push(`Invalid ARIA role: ${element.props.role}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check interactive element accessibility
   */
  checkInteractive(element: JSXElement): ValidationResult {
    const errors: string[] = [];
    const interactive = ['button', 'a', 'input', 'select', 'textarea'];

    if (interactive.includes(element.type)) {
      if (element.props['aria-hidden'] === 'true') {
        errors.push('Interactive element should not be aria-hidden');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Run all checks
   */
  validate(element: JSXElement): ValidationResult {
    const allErrors: string[] = [];

    const checks = [
      this.hasAccessibleName(element),
      this.checkImageAlt(element),
      this.checkFormLabel(element),
      this.validateARIA(element),
      this.checkInteractive(element)
    ];

    checks.forEach(result => {
      allErrors.push(...result.errors);
    });

    return {
      valid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

const jsxA11y = new JSXAccessibility();

export default jsxA11y;
export { JSXAccessibility, JSXElement, ValidationResult };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("♿ jsx-a11y - JSX Accessibility Utilities (POLYGLOT!)\n");

  console.log("=== Example 1: Check Button Accessibility ===");
  const button1 = { type: 'button', props: {} };
  const result1 = jsxA11y.hasAccessibleName(button1);
  console.log(`Valid: ${result1.valid}, Errors: ${result1.errors}`);
  console.log();

  console.log("=== Example 2: Check Image Alt ===");
  const img = { type: 'img', props: { src: 'test.jpg' } };
  const result2 = jsxA11y.checkImageAlt(img);
  console.log(`Valid: ${result2.valid}, Errors: ${result2.errors}`);
  console.log();

  console.log("=== Example 3: Validate ARIA ===");
  const div = { type: 'div', props: { role: 'invalid-role' } };
  const result3 = jsxA11y.validateARIA(div);
  console.log(`Valid: ${result3.valid}, Errors: ${result3.errors}`);
  console.log();

  console.log("=== Example 4: Full Validation ===");
  const input = { type: 'input', props: { type: 'text' } };
  const result4 = jsxA11y.validate(input);
  console.log(`Valid: ${result4.valid}, Errors: ${result4.errors}`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- ESLint plugins");
  console.log("- JSX linting");
  console.log("- Accessibility testing");
  console.log("- Development tooling");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Fast validation");
  console.log("- ~500K+ downloads/week on npm!");
}
