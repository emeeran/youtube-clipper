# YouTube Clipper helper

Small local helper server that accepts POST requests and appends a markdown entry to a vault note. Useful when you want the Chrome extension to send URLs directly into your Obsidian vault.

Install
1. cd into the helper folder:

```bash
cd extension/chrome-extension/helper
```
2. Install dependencies:

```bash
npm install
```

Run

```bash
# basic: will create YouTube Clips.md next to this helper folder
npm start

# with vault dir set (append to a note inside your Obsidian vault):
VAULT_DIR="/path/to/your/vault" npm start

# or provide exact file path:
VAULT_FILE="/path/to/your/vault/Notes/YouTube Clips.md" npm start

# optional security token - set the same token in the extension options (X-CLIPPER-TOKEN header)
CLIPPER_TOKEN="somesecret" npm start
```

Endpoint
- POST /clip
  - JSON body: { url: string, title?: string, timestamp?: string }
  - Response: { ok: true, path: "..." }

Notes
- The helper adds a simple markdown bullet with timestamp and URL. You can customize `server.js` to change the format or append to a particular folder in your vault.
- Ensure the helper is reachable by the extension (e.g., running on the same machine and port 3000). If you run on a different port, update the extension Options to point to the full URL (e.g., http://localhost:3001/clip).
