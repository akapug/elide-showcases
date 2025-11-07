/**
 * Hello World - TypeScript Example
 *
 * Simple edge function that returns a greeting.
 */

export function handler(event: any, context: any): any {
  console.log('Request received:', event.path);

  const name = event.query?.name || 'World';

  return {
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
    function: context.functionName,
    requestId: context.requestId,
  };
}

export default handler;
