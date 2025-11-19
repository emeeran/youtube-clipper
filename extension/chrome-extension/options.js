document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('webhook');
  const saveBtn = document.getElementById('save');
  const testBtn = document.getElementById('test');

  function load() {
    try {
      chrome.storage.sync.get(['webhookUrl'], (res) => {
        input.value = res && res.webhookUrl ? res.webhookUrl : '';
      });
    } catch (e) {
      input.value = '';
    }
  }

  function save() {
    const url = input.value.trim();
    chrome.storage.sync.set({ webhookUrl: url }, () => {
      saveBtn.textContent = 'Saved';
      setTimeout(() => (saveBtn.textContent = 'Save'), 1200);
    });
  }

  async function testSend() {
    const url = input.value.trim();
    if (!url) return alert('Please set an endpoint URL first.');
    try {
      // If user provided an Obsidian URI, open it to trigger the handler (POSTs won't work for obsidian://)
      if (url.startsWith('obsidian://')) {
        if (chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url });
        } else {
          window.open(url);
        }
        return alert('Opened Obsidian URI. Obsidian should handle the link.');
      }

      // Try a normal fetch first. If blocked by CORS, retry with a no-cors attempt and inform the user.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      try {
        await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ url: 'https://youtube.com/test' }), signal: controller.signal });
        clearTimeout(timeout);
        return alert('Test send attempted. Check your endpoint logs for the incoming POST.');
      } catch (firstErr) {
        // Retry with no-cors so we at least attempt to send without CORS blocking the response.
        try {
          clearTimeout(timeout);
          const controller2 = new AbortController();
          const timeout2 = setTimeout(() => controller2.abort(), 4000);
          await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ url: 'https://youtube.com/test' }), mode: 'no-cors', signal: controller2.signal });
          clearTimeout(timeout2);
          return alert('Send attempted (no-cors). If your server received it, you should see a request. If not, check network reachability and CORS settings.');
        } catch (secondErr) {
          return alert('Test send failed (network). Check that the URL is reachable from this browser and that any CORS rules allow the request. As an alternative, use an Obsidian URI (obsidian://...) or run a local helper server.');
        }
      }
    } catch (e) {
      alert('Test send failed (unexpected). ' + (e && e.message ? e.message : ''));
    }
  }

  saveBtn.addEventListener('click', save);
  testBtn.addEventListener('click', testSend);
  const installBtn = document.getElementById('install-advanced-uri');
  if (installBtn) {
    installBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Open the Advanced URI plugin page on GitHub so users can install it.
      const url = 'https://github.com/Vinzent/obsidian-advanced-uri';
      try {
        if (chrome.tabs && chrome.tabs.create) {
          chrome.tabs.create({ url });
        } else {
          window.open(url, '_blank');
        }
      } catch (err) {
        window.open(url, '_blank');
      }
    });
  }
  load();
});
