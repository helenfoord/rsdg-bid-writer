// Cloudflare Worker entry point.
//
// Requests to /api/draft and /api/pipeline are handled here directly.
// Everything else (the site itself) is served from the ./public folder,
// configured via the "assets" block in wrangler.jsonc.
//
// Bindings needed (set these in the Cloudflare dashboard, on this Worker's
// Settings page — Variables & Secrets, and Bindings):
//   ANTHROPIC_API_KEY   (a secret, from your own Anthropic Console account)
//   PIPELINE_KV         (a KV namespace binding, for the funding pipeline)

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/draft' && request.method === 'POST') {
      return handleDraft(request, env);
    }

    if (url.pathname === '/api/pipeline') {
      return handlePipeline(request, env);
    }

    // Not an API route — serve the static site.
    return env.ASSETS.fetch(request);
  },
};

async function handleDraft(request, env) {
  try {
    const body = await request.text();
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
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

async function handlePipeline(request, env) {
  const KEY = 'funders';

  if (request.method === 'GET') {
    try {
      const value = await env.PIPELINE_KV.get(KEY);
      return new Response(JSON.stringify({ value: value || null }), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Load failed', detail: String(err) }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  if (request.method === 'POST') {
    try {
      const { value } = await request.json();
      await env.PIPELINE_KV.put(KEY, value);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Save failed', detail: String(err) }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  }

  return new Response('Method not allowed', { status: 405 });
}
