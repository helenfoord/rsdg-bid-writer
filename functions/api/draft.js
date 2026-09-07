// Cloudflare Pages Function — POST /api/draft
// Forwards the request body to Anthropic's Messages API, attaching the
// secret API key server-side so it never reaches the browser.
//
// Requires an environment variable set in the Cloudflare Pages project:
//   ANTHROPIC_API_KEY  (Settings > Environment variables > add as a secret)

export async function onRequestPost(context) {
  try {
    const body = await context.request.text();

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': context.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body,
    });

    const data = await anthropicResponse.text();
    return new Response(data, {
      status: anthropicResponse.status,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
}
