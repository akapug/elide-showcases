/**
 * Email Bounce Parser - Email Bounce Message Parser
 *
 * Parse bounce messages to extract failure reasons.
 * **POLYGLOT SHOWCASE**: One bounce parser for ALL languages on Elide!
 */

export interface BounceResult {
  isBounce: boolean;
  bounceType?: 'hard' | 'soft';
  recipient?: string;
  reason?: string;
}

export function parseBounce(message: string): BounceResult {
  const isBounce = message.includes('550') || message.includes('Mail Delivery Failed');

  if (!isBounce) {
    return { isBounce: false };
  }

  const hardBounce = message.includes('550') || message.includes('User unknown');
  const recipientMatch = message.match(/(?:to|for)\s+<?([^\s>]+@[^\s>]+)>?/i);

  return {
    isBounce: true,
    bounceType: hardBounce ? 'hard' : 'soft',
    recipient: recipientMatch ? recipientMatch[1] : undefined,
    reason: hardBounce ? 'User does not exist' : 'Temporary failure'
  };
}

export default { parseBounce };

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("📮 Email Bounce Parser - Bounce Parsing for Elide (POLYGLOT!)\n");

  const bounce = "550 User unknown: user@example.com";
  const result = parseBounce(bounce);
  console.log(result);

  console.log("\n🌐 POLYGLOT - Works everywhere via Elide!");
}
