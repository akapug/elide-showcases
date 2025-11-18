// Test fetch handler style (declarative pattern)
export default async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

  return new Response(JSON.stringify({
    message: 'Beta 11 RC1 Fetch Handler Works!',
    path: url.pathname,
    method: request.method
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
