/**
 * Cultigen course-sketch Worker
 * ------------------------------------------------------------------
 * Holds your Anthropic API key server-side and returns a real,
 * Claude-generated course PLAN as JSON. The static site (index.html)
 * POSTs { url, topic, filename } here and renders the plan.
 *
 * Deploy (Cloudflare, free):
 *   1. dash.cloudflare.com → Workers & Pages → Create → Worker
 *   2. Paste this file as the Worker code, Deploy.
 *   3. Worker → Settings → Variables → add a SECRET named
 *      ANTHROPIC_API_KEY with your key (starts with sk-ant-...).
 *   4. Copy the Worker URL (…​.workers.dev) and paste it into
 *      index.html at:  const SKETCH_ENDPOINT = '';
 * ------------------------------------------------------------------
 */
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method !== 'POST') return json({ error: 'POST only' }, 405, cors);

    let body = {};
    try { body = await req.json(); } catch (_) {}
    const topic = String(body.topic || '').slice(0, 200);
    const url = String(body.url || '').slice(0, 500);
    const filename = String(body.filename || '').slice(0, 200);

    // Best-effort grounding: pull the visible text of the link.
    let context = '';
    if (/^https?:\/\//i.test(url)) {
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'CultigenBot/1.0' } });
        const html = await r.text();
        context = html
          .replace(/<script[\s\S]*?<\/script>/gi, ' ')
          .replace(/<style[\s\S]*?<\/style>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 6000);
      } catch (_) {}
    }

    const source = url || filename || topic || 'the source';
    const prompt =
`You are Cultigen's course engine. From the SOURCE below, produce a concise, hands-on COURSE PLAN.
Return ONLY valid minified JSON (no markdown, no prose) with exactly this shape:
{"title": string, "summary": string (<=30 words),
 "modules": [{"name": string, "goal": string (<=16 words)}]  // 3 to 5 items,
 "interactive": string (<=22 words: one interactive learners can play with),
 "kit": string (<=22 words: one buildable physical kit)}

SOURCE: ${source}
${context ? 'CONTENT:\n' + context : (topic ? 'TOPIC: ' + topic : '')}`;

    let ar;
    try {
      ar = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-5',
          max_tokens: 700,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
    } catch (_) {
      return json({ error: 'network' }, 502, cors);
    }
    if (!ar.ok) return json({ error: 'upstream', status: ar.status }, 502, cors);

    const data = await ar.json();
    let text = (data.content && data.content[0] && data.content[0].text) || '{}';
    text = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

    let plan;
    try { plan = JSON.parse(text); }
    catch (_) { plan = { title: topic || 'Your course', summary: '', modules: [], interactive: '', kit: '' }; }

    return json(plan, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
