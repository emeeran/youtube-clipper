#!/usr/bin/env node
// Best-effort model discovery script
// Fetch provider pages and extract model-like tokens with regex; print preview snippets.

const providers = {
  'Google Gemini': {
    url: 'https://developers.generativeai.google/models',
    regex: /gemini[-_.]?\d+(?:\.\d+)?(?:-[a-z0-9\-]+)?/gi
  },
  'Groq': {
    url: 'https://groq.com',
    regex: /llama[-_.]?\d+(?:\.\d+)?(?:-[a-z0-9\-]+)?/gi
  }
};

const TIMEOUT_MS = 15000;

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

(async () => {
  const result = {};
  for (const [name, cfg] of Object.entries(providers)) {
    console.log(`\n=== ${name} -> ${cfg.url}`);
    try {
      const res = await fetchWithTimeout(cfg.url, TIMEOUT_MS);
      if (!res.ok) {
        console.warn(`Failed to fetch ${cfg.url}: ${res.status} ${res.statusText}`);
        result[name] = { error: `${res.status} ${res.statusText}`, models: [] };
        continue;
      }
      const text = await res.text();
      const matches = Array.from(new Set((text.match(cfg.regex) || []).map(s => s.trim())));
      if (matches.length === 0) {
        console.log('No model-like tokens found with regex.');
        result[name] = { models: [] };
        continue;
      }
      const entries = matches.map(m => {
        const idx = text.toLowerCase().indexOf(m.toLowerCase());
        const start = Math.max(0, idx - 80);
        const snippet = (idx >= 0) ? text.substring(start, Math.min(text.length, idx + m.length + 80)).replace(/\s+/g, ' ') : '';
        return { model: m, preview: snippet };
      });
      console.log(`Found ${entries.length} unique model(s):`);
      entries.forEach((e) => console.log(` - ${e.model}\n   preview: ${e.preview.slice(0,240)}...`));
      result[name] = { models: entries };
    } catch (err) {
      console.warn(`Error fetching ${cfg.url}:`, err.message || err);
      result[name] = { error: String(err), models: [] };
    }
  }

  console.log('\n=== SUMMARY JSON ===');
  console.log(JSON.stringify(result, null, 2));
})();
