// Cloudflare Pages Function — GET and POST /api/pipeline
// Stores the funding pipeline as a single JSON blob in Cloudflare KV, shared
// by everyone who opens the site (there's no per-user separation here).
//
// Requires a KV namespace bound to this Pages project:
//   Settings > Functions > KV namespace bindings
//   Variable name: PIPELINE_KV   ->  bind to a namespace you create
//   (Workers & Pages > KV > Create namespace, e.g. "rsdg-pipeline")

const KEY = 'funders';

export async function onRequestGet(context) {
  const value = await context.env.PIPELINE_KV.get(KEY);
  return new Response(JSON.stringify({ value: value || null }), {
    headers: { 'content-type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  try {
    const { value } = await context.request.json();
    await context.env.PIPELINE_KV.put(KEY, value);
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
