const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// Allow requests from browser extensions / local testing
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CLIPPER-TOKEN');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Config via env or query: VAULT_FILE (absolute path) or VAULT_DIR + FILENAME
const VAULT_FILE = process.env.VAULT_FILE || null; // full path to file
const VAULT_DIR = process.env.VAULT_DIR || null; // dir containing vault
const FILENAME = process.env.FILENAME || 'YouTube Clips.md';
const PORT = process.env.PORT || 3000;

function resolveTargetFile() {
  if (VAULT_FILE) return VAULT_FILE;
  if (VAULT_DIR) return path.join(VAULT_DIR, FILENAME);
  // default: helper folder
  return path.join(__dirname, FILENAME);
}

function appendEntry(filePath, entry) {
  const line = '\n' + entry + '\n';
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, line, { encoding: 'utf8' });
}

app.post('/clip', (req, res) => {
  try {
    const token = process.env.CLIPPER_TOKEN;
    if (token) {
      const header = req.get('X-CLIPPER-TOKEN');
      if (!header || header !== token) {
        return res.status(401).json({ error: 'unauthorized' });
      }
    }

    const body = req.body || {};
    const url = body.url || body.videoUrl || '';
    const title = body.title || '';
    const timestamp = body.timestamp || '';

    if (!url) return res.status(400).json({ error: 'missing url in body' });

    const filePath = resolveTargetFile();

    const now = new Date().toISOString();
    let entry = `- ${now}`;
    if (title) entry += ` - **${title}**`;
    entry += `\n\n  ${url}`;
    if (timestamp) entry += `\n\n  _at ${timestamp}_`;

    appendEntry(filePath, entry);
    console.log('Appended clip to', filePath);
    res.json({ ok: true, path: filePath });
  } catch (e) {
    console.error('Failed to append clip', e);
    res.status(500).json({ error: 'failed', message: String(e) });
  }
});

app.get('/', (req, res) => res.send('YouTube Clipper helper is running. POST /clip with JSON { url }'));

app.listen(PORT, () => {
  console.log(`YouTube Clipper helper listening on port ${PORT}`);
  console.log('Target file:', resolveTargetFile());
});
