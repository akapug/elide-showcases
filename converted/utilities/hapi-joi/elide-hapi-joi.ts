/**
 * hapi-joi - Hapi Framework Joi Integration
 *
 * Joi integration for Hapi framework.
 * **POLYGLOT SHOWCASE**: One Hapi validator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@hapi/joi (~1M+ downloads/week)
 *
 * Package has ~1M+ downloads/week on npm!
 */

// This is a re-export of Joi for Hapi compatibility
import Joi from '../joi/elide-joi.ts';

export default Joi;

if (import.meta.url.includes("elide-hapi-joi.ts")) {
  console.log("✅ hapi-joi - Hapi Framework Joi Integration (POLYGLOT!)\n");
  console.log("~1M+ downloads/week on npm!");
}
