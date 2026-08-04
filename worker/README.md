# Cultigen demo — real course-plan generation

The homepage demo ("Sketch a course") can generate a **real** course plan with Claude.
Because cultigen.ai is a static site, the API key lives in a tiny Cloudflare Worker,
never in the browser.

## Deploy (free, ~5 min)

1. Go to **dash.cloudflare.com → Workers & Pages → Create → Worker**.
2. Paste the contents of [`cultigen-sketch.js`](./cultigen-sketch.js) as the Worker code → **Deploy**.
3. Open the Worker → **Settings → Variables and Secrets** → **Add** a secret:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key (`sk-ant-...`) → **Encrypt** / Save.
4. Copy the Worker URL (looks like `https://cultigen-sketch.<you>.workers.dev`).
5. In `index.html`, set:
   ```js
   const SKETCH_ENDPOINT = 'https://cultigen-sketch.<you>.workers.dev';
   ```
   Commit + push. Done — the demo now returns real, Claude-generated plans.

## Notes
- Until `SKETCH_ENDPOINT` is set, the demo falls back to the local template, so the
  site never breaks.
- Model is `claude-sonnet-5` (change in `cultigen-sketch.js` if you prefer another).
- For a link, the Worker fetches the page text to ground the plan. PDFs are used by
  filename only (no server-side PDF parsing).
- Cost is roughly a fraction of a cent per generation (short JSON output).
