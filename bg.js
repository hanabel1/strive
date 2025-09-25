// Optional: ping the API on install so on-device-internals shows activity
chrome.runtime.onInstalled.addListener(async () => {
    try { await LanguageModel.availability({}); } catch {}
  });