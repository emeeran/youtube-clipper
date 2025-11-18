# YouTube Clipper Chrome Extension

This small extension injects a "Clip" button into YouTube's player controls and allows sending the current video URL to a configurable endpoint (for example a local webhook or an Obsidian deep-link).

How it works
- A content script adds a "Clip" button into the YouTube player.
- Clicking the button POSTs `{ url: <video-url> }` to the configured endpoint (set in the extension Options).
- If sending fails, the extension falls back to copying the URL to the clipboard.
- A keyboard shortcut (Ctrl/Cmd+Shift+Y) will also trigger a send.

Installation (developer mode)
1. Open Chrome -> Extensions -> Load unpacked.
2. Select this folder: `extension/chrome-extension` inside the repo.

Configuration
1. Click the extension > Options or open the Options page from the extensions list.
2. Set the endpoint. Examples:
	- `http://localhost:3000/clip` — a local helper that accepts POST JSON { url }
		- `obsidian://open?vault=VAULT&file=YouTube%20Clips` — an Obsidian deep-link (the extension will open the URI; POST bodies are not supported for obsidian:// schemes)
		- Tip: If you set an Obsidian URI (obsidian://...), the extension will create a new note using the Obsidian URI scheme (obsidian://new) and populate it with the video URL. This also copies the URL to the clipboard so you can paste elsewhere if needed.

Notes about testing and CORS
- The Options "Test send" will try a normal POST first. If the browser blocks the response due to CORS, it will retry with a no-cors attempt so your server may still receive the request. If the request fails with a network error, ensure the URL is reachable from your browser (for example, check that a local server is running and not blocked by a firewall).
- For Obsidian URIs the Test will open the URI (which should launch Obsidian). If you need a true POST receiver, run a small local helper server and point the extension to that URL.

Integrating with the Obsidian plugin
- If you want the Obsidian plugin to receive URL POSTs, you'll need a small local HTTP endpoint (e.g. an Express server) or a URL handler that Obsidian can accept. Another option is to use an Obsidian URI to open a note — the extension will attempt to POST; if the POST fails it copies the URL to clipboard for manual paste.

Notes & next steps
- You can extend this to support OAuth or direct WebSocket communication with a running helper app if you want real-time integration.
