// Cool New Tab — Weather Module
// Click to toggle F/C, geocoding for city names, auto geolocation

const Weather = {
    _CACHE_DURATION: 10 * 60 * 1000,

    async init() {
        const settings = await Storage.get();
        if (!settings.showWeather) {
            this._hide();
            return;
        }

        const apiKey = settings.weatherApiKey;
        if (!apiKey) {
            this._showNoKey();
            return;
        }

        const container = document.getElementById('weather-widget');
        if (!container) return;
        container.innerHTML = '';

        let locations = [];

        // Always try geolocation first — local weather goes on top
        // Use cached geo location if available to avoid re-requesting GPS every load
        const cachedGeo = await Storage.getCache('geoLocation');
        if (cachedGeo && cachedGeo.lat) {
            locations.push({ name: cachedGeo.name, lat: cachedGeo.lat, lon: cachedGeo.lon, _isGeo: true });
        } else {
            try {
                const pos = await this._getGeolocation();
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                // Reverse geocode to get city name
                let cityName = null;
                try {
                    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`);
                    if (geoRes.ok) {
                        const geoData = await geoRes.json();
                        if (geoData.length > 0) {
                            cityName = geoData[0].name + (geoData[0].state ? `, ${geoData[0].state}` : '');
                            // Also save country for news
                            if (geoData[0].country) {
                                await Storage.set('newsCountry', geoData[0].country.toLowerCase());
                            }
                        }
                    }
                } catch (e) { /* use null name, will fall back to API response name */ }
                await Storage.setCache('geoLocation', { name: cityName, lat, lon });
                locations.push({ name: cityName, lat, lon, _isGeo: true });
            } catch (e) {
                console.warn('[CoolNewTab] Geolocation unavailable:', e.message);
            }
        }

        // Add manual locations after
        const manualLocations = (settings.weatherLocations || []).filter(l => !l._isGeo);
        locations = locations.concat(manualLocations);

        if (locations.length === 0) {
            container.innerHTML = '<p class="widget-hint">Add a location in settings</p>';
            return;
        }

        for (const loc of locations) {
            await this._renderLocation(container, loc, apiKey, settings.temperatureUnit);
        }

        // Click to toggle F/C — update in place, no re-render
        container.style.cursor = 'pointer';
        container.title = 'Click to toggle °F/°C';
        container.addEventListener('click', async () => {
            const s = await Storage.get();
            const oldUnit = s.temperatureUnit || 'F';
            const newUnit = oldUnit === 'C' ? 'F' : 'C';
            await Storage.set('temperatureUnit', newUnit);

            // Update all temperature displays in-place
            container.querySelectorAll('.weather-temp').forEach(el => {
                const match = el.textContent.match(/^(-?\d+)/);
                if (!match) return;
                const oldTemp = parseInt(match[1]);
                let newTemp;
                if (oldUnit === 'F' && newUnit === 'C') {
                    newTemp = Math.round((oldTemp - 32) * 5 / 9);
                } else {
                    newTemp = Math.round(oldTemp * 9 / 5 + 32);
                }
                el.textContent = `${newTemp}°${newUnit}`;
            });

            // Clear caches so next full load uses new unit
            for (const loc of locations) {
                await Storage.setCache(`weather_${loc.name}_F`, null);
                await Storage.setCache(`weather_${loc.name}_C`, null);
            }
        });

        container.classList.add('fade-in');
    },

    async _renderLocation(container, loc, apiKey, unit) {
        const cacheKey = `weather_${loc.name}_${unit}`;
        const cached = await Storage.getCache(cacheKey);

        let data;
        if (cached && (Date.now() - cached.fetchedAt) < this._CACHE_DURATION) {
            data = cached.data;
        } else {
            try {
                const units = unit === 'C' ? 'metric' : 'imperial';
                let lat = loc.lat;
                let lon = loc.lon;

                if (!lat || !lon) {
                    const coords = await this._geocode(loc.query || loc.name, apiKey);
                    if (!coords) {
                        const errCard = document.createElement('div');
                        errCard.className = 'weather-card';
                        errCard.innerHTML = `<div class="weather-location">${loc.name}</div><div class="weather-desc" style="color:var(--text-tertiary)">City not found</div>`;
                        container.appendChild(errCard);
                        return;
                    }
                    lat = coords.lat;
                    lon = coords.lon;
                }

                const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`;
                const res = await fetch(url);
                if (!res.ok) {
                    console.error('[CoolNewTab] Weather API error:', res.status);
                    const errCard = document.createElement('div');
                    errCard.className = 'weather-card';
                    errCard.innerHTML = `<div class="weather-location">${loc.name}</div><div class="weather-desc" style="color:var(--text-tertiary)">Unable to load</div>`;
                    container.appendChild(errCard);
                    return;
                }
                data = await res.json();
                await Storage.setCache(cacheKey, { data, fetchedAt: Date.now() });
            } catch (err) {
                console.error('[CoolNewTab] Weather fetch error:', err);
                return;
            }
        }

        const unitSymbol = unit === 'C' ? '°C' : '°F';
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        const card = document.createElement('div');
        card.className = 'weather-card';
        const cityName = (loc.name || data.name || '').split(',')[0].trim();
        card.innerHTML = `
      <div class="weather-location">${cityName}</div>
      <div class="weather-main">
        <img class="weather-icon" src="${iconUrl}" alt="${data.weather[0].description}" />
        <span class="weather-temp">${Math.round(data.main.temp)}${unitSymbol}</span>
      </div>
      <div class="weather-desc">${data.weather[0].description}</div>
      <div class="weather-details">
        <span>${data.main.humidity}%</span>
        <span>${Math.round(data.wind.speed)} ${unit === 'C' ? 'm/s' : 'mph'}</span>
      </div>
    `;
        container.appendChild(card);
    },

    async _geocode(query, apiKey) {
        try {
            let geoQuery = query.trim();
            const parts = geoQuery.split(',').map(p => p.trim());
            if (parts.length === 2 && parts[1].length === 2 && /^[A-Z]{2}$/i.test(parts[1])) {
                geoQuery = `${parts[0]},${parts[1]},US`;
            }
            const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(geoQuery)}&limit=1&appid=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            const results = await res.json();
            if (!results || results.length === 0) return null;
            return { lat: results[0].lat, lon: results[0].lon };
        } catch (err) {
            console.error('[CoolNewTab] Geocoding error:', err);
            return null;
        }
    },

    _getGeolocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: false });
        });
    },

    _showNoKey() {
        const container = document.getElementById('weather-widget');
        if (container) {
            container.innerHTML = '<p class="widget-hint">Add weather API key in settings</p>';
        }
    },

    _hide() {
        const container = document.getElementById('weather-widget');
        if (container) container.style.display = 'none';
    }
};

window.Weather = Weather;
