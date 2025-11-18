/**
 * joi-password-complexity - Joi Password Complexity Validation
 *
 * Password complexity validation for Joi.
 * **POLYGLOT SHOWCASE**: One password validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/joi-password-complexity (~300K+ downloads/week)
 *
 * Package has ~300K+ downloads/week on npm!
 */

function passwordComplexity(options?: any) {
  return {
    validate(password: string) {
      const errors: string[] = [];

      if (password.length < (options?.min || 8)) {
        errors.push('Password too short');
      }

      if (!/[A-Z]/.test(password)) {
        errors.push('Must contain uppercase');
      }

      if (!/[a-z]/.test(password)) {
        errors.push('Must contain lowercase');
      }

      if (!/[0-9]/.test(password)) {
        errors.push('Must contain number');
      }

      if (!/[!@#$%^&*]/.test(password)) {
        errors.push('Must contain special character');
      }

      if (errors.length > 0) {
        return { error: { message: errors.join(', ') } };
      }

      return { value: password };
    }
  };
}

export default passwordComplexity;

if (import.meta.url.includes("elide-joi-password-complexity.ts")) {
  console.log("✅ joi-password-complexity - Password Validation (POLYGLOT!)\n");
  const validator = passwordComplexity({ min: 8 });
  console.log("Valid:", validator.validate("Abc123!@#"));
  console.log("Invalid:", validator.validate("weak"));
  console.log("~300K+ downloads/week on npm!");
}
