// Background service worker to handle commands (keyboard shortcuts)
chrome.commands && chrome.commands.onCommand && chrome.commands.onCommand.addListener((command) => {
  if (command === 'send-current-video') {
    // send a message to the active tab
    chrome.tabs && chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const tabId = tabs[0].id;
      chrome.tabs.sendMessage(tabId, { type: 'send-current-video' });
    });
  }
});
