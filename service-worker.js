// Cool New Tab — Service Worker (Manifest V3)
// Handles periodic background image pre-fetching via chrome.alarms

chrome.alarms.create('prefetch-background', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'prefetch-background') {
    try {
      const data = await chrome.storage.local.get(['settings']);
      const settings = data.settings || {};
      const apiKey = settings.unsplashApiKey;
      if (!apiKey) return;

      const theme = settings.backgroundTheme || 'nature';
      const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(theme)}&orientation=landscape&client_id=${apiKey}`;

      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();

      await chrome.storage.local.set({
        prefetchedBackground: {
          url: json.urls.regular,
          photographer: json.user.name,
          photographerUrl: json.user.links.html,
          downloadLocation: json.links.download_location,
          fetchedAt: Date.now()
        }
      });
    } catch (e) {
      console.error('[CoolNewTab] Background prefetch failed:', e);
    }
  }
});
