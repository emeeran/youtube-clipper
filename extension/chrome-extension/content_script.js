// Injects a "Clip" button into the YouTube player and handles sending the current URL
(function () {
  const BUTTON_ID = 'youtube-clipper-button';

  function getVideoControls() {
    // try a few known selectors for the right control area in the YouTube player
    return document.querySelector('.ytp-right-controls') || document.querySelector('#top-level-buttons-computed') || document.querySelector('#info-contents');
  }

  function createButton() {
    if (document.getElementById(BUTTON_ID)) return null;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.title = 'Send to YouTube Clipper';
    btn.style.cssText = 'margin-left:8px;padding:6px 8px;background:#ff0000;color:#fff;border-radius:2px;border:none;font-weight:600;cursor:pointer';
    btn.textContent = 'Clip';
    btn.addEventListener('click', onClick);
    return btn;
  }

  async function getWebhookUrl() {
    return new Promise((resolve) => {
      try {
        chrome.storage && chrome.storage.sync && chrome.storage.sync.get(['webhookUrl'], (res) => {
          resolve(res && res.webhookUrl ? res.webhookUrl : '');
        });
      } catch (e) {
        resolve('');
      }
    });
  }

  async function sendUrl(currentUrl) {
    // Simplified behavior per user request:
    // 1) copy the URL to the clipboard
    // 2) open the Obsidian protocol handler `obsidian://youtube-clipper?url=...`
    // This opens/focuses Obsidian (if the OS/Obsidian allows it) and relies on
    // the plugin's registered protocol handler to process the URL.
    //
    // NOTE: A Chrome extension cannot send global OS-level keyboard shortcuts
    // or synthesize keypresses to other native applications for security
    // reasons. If you need a specific plugin command executed, install the
    // Advanced URI plugin (or use the plugin's custom protocol) so the
    // extension can invoke it via an `obsidian://` link.
    try {
      await navigator.clipboard.writeText(currentUrl);
      showToast('URL copied to clipboard');
    } catch (e) {
      console.warn('Clipper: clipboard write failed', e);
    }

    try {
      const base = 'obsidian://youtube-clipper';
      const params = new URLSearchParams();
      params.set('url', currentUrl);
      const uri = base + '?' + params.toString();
      // Opening the obsidian:// URI should focus Obsidian on most systems
      // and hand the URL to the plugin via the registered handler.
      try {
        window.open(uri);
        showToast('Opening Obsidian...');
      } catch (e) {
        // fallback to a generic obsidian open if the custom protocol isn't handled
        try {
          window.open('obsidian://open');
        } catch (e2) {
          console.warn('Clipper: failed to open obsidian uri', e2);
        }
      }
    } catch (e) {
      console.warn('Clipper: failed to build/open obsidian uri', e);
    }
  }

  function showToast(text) {
    const id = 'youtube-clipper-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.cssText = 'position:fixed;right:20px;bottom:80px;background:rgba(0,0,0,0.85);color:#fff;padding:10px 14px;border-radius:6px;z-index:999999;font-size:13px';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    setTimeout(() => {
      try { el.style.opacity = '0'; } catch (e) {}
    }, 1800);
  }

  function onClick() {
    const url = location.href;
    // Copy to clipboard immediately so the URL is available even if the POST/open step fails
    try {
      navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText(url).then(() => {
        showToast('URL copied to clipboard');
      }).catch(() => {
        // ignore
      });
    } catch (e) { /* ignore */ }
    sendUrl(url);
  }

  // Listen for messages from the background (keyboard command)
  chrome.runtime && chrome.runtime.onMessage && chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'send-current-video') {
      sendUrl(location.href);
    }
  });

  // MutationObserver to handle SPA navigations and add the button when player appears
  const observer = new MutationObserver(() => {
    const controls = getVideoControls();
    if (controls) {
      if (!document.getElementById(BUTTON_ID)) {
        const btn = createButton();
        if (btn) controls.appendChild(btn);
      }
    }
  });

  function start() {
    // initial try
    const controls = getVideoControls();
    if (controls && !document.getElementById(BUTTON_ID)) {
      const btn = createButton();
      if (btn) controls.appendChild(btn);
    }
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Start after short delay to let player load
  setTimeout(start, 1000);
})();
