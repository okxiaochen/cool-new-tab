// Cool New Tab — Settings Panel Module

const TIMEZONE_OPTIONS = [
  { label: 'UTC', timezone: 'UTC' },
  { label: 'New York', timezone: 'America/New_York' },
  { label: 'Los Angeles', timezone: 'America/Los_Angeles' },
  { label: 'Chicago', timezone: 'America/Chicago' },
  { label: 'London', timezone: 'Europe/London' },
  { label: 'Paris', timezone: 'Europe/Paris' },
  { label: 'Berlin', timezone: 'Europe/Berlin' },
  { label: 'Moscow', timezone: 'Europe/Moscow' },
  { label: 'Dubai', timezone: 'Asia/Dubai' },
  { label: 'Mumbai', timezone: 'Asia/Kolkata' },
  { label: 'Singapore', timezone: 'Asia/Singapore' },
  { label: 'Beijing', timezone: 'Asia/Shanghai' },
  { label: 'Tokyo', timezone: 'Asia/Tokyo' },
  { label: 'Seoul', timezone: 'Asia/Seoul' },
  { label: 'Sydney', timezone: 'Australia/Sydney' },
  { label: 'Auckland', timezone: 'Pacific/Auckland' },
  { label: 'São Paulo', timezone: 'America/Sao_Paulo' },
  { label: 'Toronto', timezone: 'America/Toronto' },
  { label: 'Vancouver', timezone: 'America/Vancouver' },
  { label: 'Hawaii', timezone: 'Pacific/Honolulu' },
  { label: 'Anchorage', timezone: 'America/Anchorage' }
];

const BACKGROUND_THEMES = [
  { value: 'random', label: 'Random (All)' },
  { value: 'nature', label: 'Nature' },
  { value: 'mountains', label: 'Mountains' },
  { value: 'ocean', label: 'Ocean' },
  { value: 'forest', label: 'Forest' },
  { value: 'city', label: 'City' },
  { value: 'architecture', label: 'Architecture' },
  { value: 'space', label: 'Space' },
  { value: 'abstract', label: 'Abstract' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'sunset', label: 'Sunset' },
  { value: 'snow', label: 'Snow' },
  { value: 'desert', label: 'Desert' }
];

const VIDEO_THEMES = [
  { value: 'random', label: 'Random (All)' },
  { value: 'nature', label: 'Nature' },
  { value: 'ocean waves', label: 'Ocean Waves' },
  { value: 'mountains landscape', label: 'Mountains' },
  { value: 'aerial landscape', label: 'Aerial View' },
  { value: 'city timelapse', label: 'City Timelapse' },
  { value: 'rain', label: 'Rain' },
  { value: 'sunset clouds', label: 'Sunset' },
  { value: 'forest trees', label: 'Forest' },
  { value: 'snow winter', label: 'Snow' },
  { value: 'night sky stars', label: 'Night Sky' },
  { value: 'fire flames', label: 'Fire' },
  { value: 'underwater', label: 'Underwater' },
  { value: 'aurora borealis', label: 'Aurora' },
  { value: 'clouds sky', label: 'Clouds' },
  { value: 'abstract motion', label: 'Abstract' }
];

const NEWS_CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'world', label: 'World' },
  { value: 'nation', label: 'Nation' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Technology' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' }
];

const Settings = {
  _isOpen: false,

  init() {
    const toggleBtn = document.getElementById('settings-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggle());
    }

    const overlay = document.getElementById('settings-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this.close());
    }

    const closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this._isOpen) this.close();
    });
  },

  async toggle() {
    if (this._isOpen) {
      this.close();
    } else {
      await this.open();
    }
  },

  async open() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    if (!panel) return;

    const settings = await Storage.get();
    this._renderForm(panel, settings);

    panel.classList.add('open');
    overlay?.classList.add('open');
    this._isOpen = true;
  },

  close() {
    const panel = document.getElementById('settings-panel');
    const overlay = document.getElementById('settings-overlay');
    panel?.classList.remove('open');
    overlay?.classList.remove('open');
    this._isOpen = false;
  },

  _renderForm(panel, settings) {
    const content = panel.querySelector('.settings-content');
    if (!content) return;

    // Check if calendar is connected
    const calendarConnected = !!settings._calendarConnected;

    content.innerHTML = `
      <!-- Profile Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">Profile</h3>
        <div class="settings-field">
          <label for="setting-name">Your Name</label>
          <input type="text" id="setting-name" value="${settings.name || ''}" placeholder="Enter your name" />
        </div>
      </div>

      <!-- Background Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">Background</h3>
        <div class="settings-field">
          <label for="setting-bg-mode">Mode</label>
          <select id="setting-bg-mode">
            <option value="static" ${(settings.backgroundMode || 'static') === 'static' ? 'selected' : ''}>📷 Static (Photo)</option>
            <option value="dynamic" ${settings.backgroundMode === 'dynamic' ? 'selected' : ''}>🎬 Dynamic (Video)</option>
          </select>
          <p class="settings-hint" style="margin-top:4px;margin-bottom:0" id="bg-mode-hint">${(settings.backgroundMode || 'static') === 'dynamic' ? 'Requires a Pexels API key' : 'Requires an Unsplash API key'}</p>
        </div>
        <div class="settings-field">
          <label for="setting-bg-theme">Theme</label>
          <select id="setting-bg-theme">
            ${((settings.backgroundMode || 'static') === 'dynamic' ? VIDEO_THEMES : BACKGROUND_THEMES).map(t => `<option value="${t.value}" ${settings.backgroundTheme === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="settings-field">
          <label for="setting-bg-refresh">Refresh Frequency</label>
          <select id="setting-bg-refresh">
            <option value="every-tab" ${settings.backgroundRefresh === 'every-tab' ? 'selected' : ''}>Every new tab</option>
            <option value="hourly" ${settings.backgroundRefresh === 'hourly' ? 'selected' : ''}>Hourly</option>
            <option value="daily" ${settings.backgroundRefresh === 'daily' ? 'selected' : ''}>Daily</option>
          </select>
        </div>
      </div>

      <!-- Weather Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">Weather</h3>
        <div class="settings-field">
          <label class="settings-toggle-label">
            <span>Show Weather</span>
            <input type="checkbox" id="setting-show-weather" ${settings.showWeather ? 'checked' : ''} />
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-field">
          <label for="setting-temp-unit">Temperature Unit</label>
          <select id="setting-temp-unit">
            <option value="F" ${settings.temperatureUnit === 'F' ? 'selected' : ''}>°F</option>
            <option value="C" ${settings.temperatureUnit === 'C' ? 'selected' : ''}>°C</option>
          </select>
          <p class="settings-hint" style="margin-top:4px;margin-bottom:0">Tip: click on the weather widget to toggle °F/°C</p>
        </div>
        <div class="settings-field">
          <label>Locations</label>
          <div id="weather-locations-list" class="tag-list">
            ${(settings.weatherLocations || []).map((loc, i) => `
              <span class="tag">${loc.name} <button class="tag-remove" data-type="weather" data-index="${i}">×</button></span>
            `).join('')}
          </div>
          <div class="inline-add">
            <input type="text" id="add-weather-city" placeholder="e.g. Miami, FL" style="flex:2" />
            <button class="btn-add" id="add-weather-btn">Add</button>
          </div>
          <button class="connect-btn" id="use-my-location-btn" style="margin-top:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
            Use My Location
          </button>
          <p class="settings-hint" style="margin-top:6px;margin-bottom:0">Or enter city name like "Seattle, WA"</p>
        </div>
      </div>

      <!-- World Clock Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">World Clock</h3>
        <div class="settings-field">
          <label class="settings-toggle-label">
            <span>Show World Clock</span>
            <input type="checkbox" id="setting-show-worldclock" ${settings.showWorldClock ? 'checked' : ''} />
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-field">
          <label>Clocks</label>
          <div id="world-clock-list" class="tag-list">
            ${(settings.worldClocks || []).map((c, i) => `
              <span class="tag">${c.label} <button class="tag-remove" data-type="worldclock" data-index="${i}">×</button></span>
            `).join('')}
          </div>
          <div class="inline-add">
            <select id="add-timezone-select">
              <option value="">Select timezone...</option>
              ${TIMEZONE_OPTIONS.map(t => `<option value="${t.timezone}">${t.label}</option>`).join('')}
            </select>
            <button class="btn-add" id="add-timezone-btn">Add</button>
          </div>
        </div>
      </div>

      <!-- Calendar Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">Calendar</h3>
        <div class="settings-field">
          <label class="settings-toggle-label">
            <span>Show Calendar</span>
            <input type="checkbox" id="setting-show-calendar" ${settings.showCalendar ? 'checked' : ''} />
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-field">
          <label for="setting-google-account">Google Account Index</label>
          <select id="setting-google-account">
            <option value="0" ${(settings.googleAccountIndex || 0) == 0 ? 'selected' : ''}>0 (Default)</option>
            <option value="1" ${(settings.googleAccountIndex || 0) == 1 ? 'selected' : ''}>1</option>
            <option value="2" ${(settings.googleAccountIndex || 0) == 2 ? 'selected' : ''}>2</option>
            <option value="3" ${(settings.googleAccountIndex || 0) == 3 ? 'selected' : ''}>3</option>
          </select>
          <p class="settings-hint" style="margin-top:4px;margin-bottom:0">If calendar links open with the wrong Google account, change this to match your account position in Chrome.</p>
        </div>
        <div class="settings-field">
          <button class="connect-btn" id="connect-calendar-btn" style="margin-top:4px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="10 17 15 12 10 7"/>
            </svg>
            ${calendarConnected ? '✓ Connected — Reconnect' : 'Connect Google Calendar'}
          </button>
        </div>
      </div>

      <!-- News Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">News</h3>
        <div class="settings-field">
          <label class="settings-toggle-label">
            <span>Show News</span>
            <input type="checkbox" id="setting-show-news" ${settings.showNews ? 'checked' : ''} />
            <span class="toggle-switch"></span>
          </label>
        </div>
        <div class="settings-field">
          <label for="setting-news-category">Category</label>
          <select id="setting-news-category">
            ${NEWS_CATEGORIES.map(c => `<option value="${c.value}" ${settings.newsCategory === c.value ? 'selected' : ''}>${c.label}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- API Keys Section -->
      <div class="settings-section">
        <h3 class="settings-section-title">API Keys</h3>
        <p class="settings-hint">Free keys required for some features. Your keys are stored locally and never shared.</p>
        <div class="settings-field">
          <label for="setting-unsplash-key">Unsplash API Key <span style="font-size:0.65rem;color:var(--text-tertiary)">(for static bg)</span></label>
          <input type="password" id="setting-unsplash-key" value="${settings.unsplashApiKey || ''}" placeholder="Get one at unsplash.com/developers" />
        </div>
        <div class="settings-field">
          <label for="setting-pexels-key">Pexels API Key <span style="font-size:0.65rem;color:var(--text-tertiary)">(for dynamic bg)</span></label>
          <input type="password" id="setting-pexels-key" value="${settings.pexelsApiKey || ''}" placeholder="Get one at pexels.com/api" />
        </div>
        <div class="settings-field">
          <label for="setting-weather-key">OpenWeatherMap API Key</label>
          <input type="password" id="setting-weather-key" value="${settings.weatherApiKey || ''}" placeholder="Get one at openweathermap.org" />
        </div>
        <div class="settings-field">
          <label for="setting-news-key">GNews API Key</label>
          <input type="password" id="setting-news-key" value="${settings.newsApiKey || ''}" placeholder="Get one at gnews.io" />
        </div>
      </div>

      <button class="btn-save" id="save-settings-btn">Save Settings</button>
    `;

    // Bind events
    this._bindEvents(content, settings);
  },

  _bindEvents(content, currentSettings) {
    // Background mode hint + theme list toggle
    content.querySelector('#setting-bg-mode')?.addEventListener('change', (e) => {
      const hint = content.querySelector('#bg-mode-hint');
      if (hint) {
        hint.textContent = e.target.value === 'dynamic' ? 'Requires a Pexels API key' : 'Requires an Unsplash API key';
      }
      // Swap theme options
      const themeSelect = content.querySelector('#setting-bg-theme');
      if (themeSelect) {
        const themes = e.target.value === 'dynamic' ? VIDEO_THEMES : BACKGROUND_THEMES;
        const currentVal = themeSelect.value;
        themeSelect.innerHTML = themes.map(t => `<option value="${t.value}" ${t.value === currentVal ? 'selected' : ''}>${t.label}</option>`).join('');
      }
    });

    // Save button
    content.querySelector('#save-settings-btn')?.addEventListener('click', async () => {
      const oldTheme = currentSettings.backgroundTheme;
      const newTheme = content.querySelector('#setting-bg-theme')?.value || 'nature';
      const themeChanged = oldTheme !== newTheme;
      const oldMode = currentSettings.backgroundMode || 'static';
      const newMode = content.querySelector('#setting-bg-mode')?.value || 'static';
      const modeChanged = oldMode !== newMode;

      const newSettings = {
        name: content.querySelector('#setting-name')?.value?.trim() || '',
        backgroundMode: newMode,
        backgroundTheme: newTheme,
        backgroundRefresh: content.querySelector('#setting-bg-refresh')?.value || 'daily',
        showWeather: content.querySelector('#setting-show-weather')?.checked ?? true,
        temperatureUnit: content.querySelector('#setting-temp-unit')?.value || 'F',
        showWorldClock: content.querySelector('#setting-show-worldclock')?.checked ?? true,
        showCalendar: content.querySelector('#setting-show-calendar')?.checked ?? true,
        googleAccountIndex: parseInt(content.querySelector('#setting-google-account')?.value || '0'),
        showNews: content.querySelector('#setting-show-news')?.checked ?? true,
        newsCategory: content.querySelector('#setting-news-category')?.value || 'general',
        unsplashApiKey: content.querySelector('#setting-unsplash-key')?.value?.trim() || '',
        pexelsApiKey: content.querySelector('#setting-pexels-key')?.value?.trim() || '',
        weatherApiKey: content.querySelector('#setting-weather-key')?.value?.trim() || '',
        newsApiKey: content.querySelector('#setting-news-key')?.value?.trim() || '',
        weatherLocations: currentSettings.weatherLocations || [],
        worldClocks: currentSettings.worldClocks || [],
        _calendarConnected: currentSettings._calendarConnected || false
      };

      await Storage.setAll(newSettings);

      // If theme or mode changed, clear background cache so it refreshes
      if (themeChanged || modeChanged) {
        await Storage.setCache('currentBackground', null);
        await Storage.setCache('prefetchedBackground', null);
        await Storage.setCache('currentVideoBackground', null);
        await Storage.setCache('prefetchedVideoBackground', null);
        await Storage.setCache('seenVideoIds', null);
      }

      // Show save confirmation
      const btn = content.querySelector('#save-settings-btn');
      if (btn) {
        btn.textContent = '✓ Saved!';
        btn.classList.add('saved');
        setTimeout(() => {
          btn.textContent = 'Save Settings';
          btn.classList.remove('saved');
        }, 2000);
      }

      // Reload to apply changes
      setTimeout(() => location.reload(), 500);
    });

    // Add weather location (city name only — use OpenWeatherMap q= parameter)
    content.querySelector('#add-weather-btn')?.addEventListener('click', async () => {
      const input = content.querySelector('#add-weather-city');
      const cityInput = input?.value?.trim();
      if (!cityInput) {
        input?.focus();
        return;
      }

      const locations = currentSettings.weatherLocations || [];
      // Store as name (display) and query (for API)
      locations.push({ name: cityInput, query: cityInput });
      currentSettings.weatherLocations = locations;
      await Storage.set('weatherLocations', locations);

      // Re-render settings
      await this.open();
    });

    // Use My Location button — updates the auto-detected geolocation
    content.querySelector('#use-my-location-btn')?.addEventListener('click', async () => {
      const btn = content.querySelector('#use-my-location-btn');
      if (btn) btn.innerHTML = '⏳ Getting location...';
      try {
        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 60000, enableHighAccuracy: true, maximumAge: 600000 });
        });
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        // Reverse geocode to get city name
        const apiKey = currentSettings.weatherApiKey;
        let name = 'My Location';
        let countryCode = '';
        if (apiKey) {
          try {
            const res = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
            if (res.ok) {
              const data = await res.json();
              if (data.length > 0) {
                name = data[0].name + (data[0].state ? `, ${data[0].state}` : '');
                countryCode = data[0].country || '';
              }
            }
          } catch (e) { /* use default name */ }
        }
        // Save country for news localization
        if (countryCode) {
          await Storage.set('newsCountry', countryCode.toLowerCase());
        }
        // Update geo cache (not weatherLocations — weather.js handles geo separately)
        const oldGeo = await Storage.getCache('geoLocation');
        if (oldGeo && oldGeo.name) {
          // Clear cached weather for the old location
          await Storage.setCache(`weather_${oldGeo.name}_F`, null);
          await Storage.setCache(`weather_${oldGeo.name}_C`, null);
        }
        await Storage.setCache('geoLocation', { name, lat, lon, fetchedAt: Date.now() });
        if (btn) btn.innerHTML = '✓ Updated';
        setTimeout(() => location.reload(), 800);
      } catch (err) {
        if (btn) btn.innerHTML = '❌ Location denied';
        console.error('[CoolNewTab] Geolocation error:', err);
      }
    });

    // Connect Google Calendar
    content.querySelector('#connect-calendar-btn')?.addEventListener('click', async () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.identity) {
          const token = await new Promise((resolve, reject) => {
            chrome.identity.getAuthToken({ interactive: true }, (token) => {
              if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
              else resolve(token);
            });
          });
          if (token) {
            currentSettings._calendarConnected = true;
            await Storage.set('_calendarConnected', true);
            const btn = content.querySelector('#connect-calendar-btn');
            if (btn) btn.innerHTML = '✓ Connected!';
          }
        } else {
          alert('Calendar connection requires loading as a Chrome extension.');
        }
      } catch (err) {
        console.error('[CoolNewTab] Calendar connect error:', err);
        alert('Failed to connect. Make sure you have configured the OAuth client ID in manifest.json.');
      }
    });

    // Add timezone
    content.querySelector('#add-timezone-btn')?.addEventListener('click', async () => {
      const select = content.querySelector('#add-timezone-select');
      const tz = select?.value;
      if (!tz) return;

      const option = TIMEZONE_OPTIONS.find(t => t.timezone === tz);
      if (!option) return;

      const clocks = currentSettings.worldClocks || [];
      if (clocks.some(c => c.timezone === tz)) return;

      clocks.push({ label: option.label, timezone: option.timezone });
      currentSettings.worldClocks = clocks;
      await Storage.set('worldClocks', clocks);

      await this.open();
    });

    // Remove tags
    content.querySelectorAll('.tag-remove').forEach(btn => {
      btn.addEventListener('click', async () => {
        const type = btn.dataset.type;
        const index = parseInt(btn.dataset.index);

        if (type === 'weather') {
          const locations = currentSettings.weatherLocations || [];
          locations.splice(index, 1);
          currentSettings.weatherLocations = locations;
          await Storage.set('weatherLocations', locations);
        } else if (type === 'worldclock') {
          const clocks = currentSettings.worldClocks || [];
          clocks.splice(index, 1);
          currentSettings.worldClocks = clocks;
          await Storage.set('worldClocks', clocks);
        }

        await this.open();
      });
    });
  }
};

window.Settings = Settings;
