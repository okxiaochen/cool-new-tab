// Cool New Tab — Service Worker (Manifest V3)
// Handles periodic background pre-fetching via chrome.alarms
// Supports both Unsplash (static) and Pexels (dynamic) modes

// Video theme queries for random selection (must match background.js)
const VIDEO_THEME_QUERIES = [
  'nature', 'ocean waves', 'mountains landscape', 'aerial landscape',
  'city timelapse', 'rain', 'sunset clouds', 'forest trees',
  'snow winter', 'night sky stars', 'fire flames', 'underwater',
  'aurora borealis', 'clouds sky', 'abstract motion'
];
chrome.alarms.create('prefetch-background', { periodInMinutes: 60 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'prefetch-background') {
    try {
      const data = await chrome.storage.local.get(['settings']);
      const settings = data.settings || {};
      const mode = settings.backgroundMode || 'static';
      const theme = settings.backgroundTheme || 'nature';

      if (mode === 'dynamic') {
        await prefetchPexelsVideo(settings.pexelsApiKey, theme);
      } else {
        await prefetchUnsplashPhoto(settings.unsplashApiKey, theme);
      }
    } catch (e) {
      console.error('[CoolNewTab] Background prefetch failed:', e);
    }
  }
});

async function prefetchUnsplashPhoto(apiKey, theme) {
  if (!apiKey) return;

  const queryParam = theme && theme !== 'random' ? `query=${encodeURIComponent(theme)}&` : '';
  const url = `https://api.unsplash.com/photos/random?${queryParam}orientation=landscape&client_id=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) return;
  const json = await res.json();

  await chrome.storage.local.set({
    prefetchedBackground: {
      url: `${json.urls.raw}&w=5120&q=85&fit=crop`,
      photographer: json.user.name,
      photographerUrl: json.user.links.html,
      photoUrl: json.links.html,
      photoTitle: json.description || json.alt_description || '',
      photoLocation: (json.location && json.location.name) || '',
      downloadLocation: json.links.download_location,
      fetchedAt: Date.now()
    }
  });
}

async function prefetchPexelsVideo(apiKey, theme) {
  if (!apiKey) return;

  const query = theme && theme !== 'random'
    ? theme
    : VIDEO_THEME_QUERIES[Math.floor(Math.random() * VIDEO_THEME_QUERIES.length)];
  const randomPage = Math.floor(Math.random() * 50) + 1;
  const perPage = 15;
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=${perPage}&page=${randomPage}&size=medium`;

  const res = await fetch(url, {
    headers: { 'Authorization': apiKey }
  });
  if (!res.ok) return;
  const json = await res.json();

  if (!json.videos || json.videos.length === 0) return;

  // Pick a random video from the results
  const video = json.videos[Math.floor(Math.random() * json.videos.length)];

  // Pick best mp4 file
  const mp4Files = (video.video_files || []).filter(f => f.file_type === 'video/mp4');
  const hdFile = mp4Files.find(f => f.quality === 'hd' && f.width >= 1920);
  const bestFile = hdFile || mp4Files.sort((a, b) => (b.width || 0) - (a.width || 0))[0];
  if (!bestFile) return;

  await chrome.storage.local.set({
    prefetchedVideoBackground: {
      videoUrl: bestFile.link,
      videographer: video.user.name,
      videographerUrl: video.user.url,
      pexelsUrl: video.url,
      theme,
      fetchedAt: Date.now()
    }
  });
}
