// Cool New Tab — Background Image Module
// Fetches from Unsplash API, handles caching, crossfade, and fallback

const Background = {
    async init(forceRefresh = false) {
        const settings = await Storage.get();
        const refresh = settings.backgroundRefresh || 'daily';
        const apiKey = settings.unsplashApiKey;

        // Try to use cached / prefetched background first for instant load
        const cached = await Storage.getCache('currentBackground');
        if (cached && cached.url && !forceRefresh) {
            this._applyBackground(cached.url, cached.photographer, cached.photographerUrl, cached.photoUrl, cached.photoTitle, cached.photoLocation);

            // Check if we need a fresh one (also refresh if theme changed)
            const themeChanged = cached.theme && cached.theme !== (settings.backgroundTheme || 'nature');
            if (!themeChanged && !this._shouldRefresh(cached.fetchedAt, refresh)) {
                return;
            }
        }

        // Try prefetched image from service worker (skip if force refresh)
        if (!forceRefresh) {
            const prefetched = await Storage.getCache('prefetchedBackground');
            if (prefetched && prefetched.url) {
                this._applyBackground(prefetched.url, prefetched.photographer, prefetched.photographerUrl, prefetched.photoUrl, prefetched.photoTitle, prefetched.photoLocation);
                await Storage.setCache('currentBackground', prefetched);
                await Storage.setCache('prefetchedBackground', null);
                return;
            }
        }

        // Fetch fresh image
        if (apiKey) {
            await this._fetchNewImage(apiKey, settings.backgroundTheme || 'nature');
        } else {
            this._applyFallback();
        }
    },

    _shouldRefresh(fetchedAt, frequency) {
        if (!fetchedAt) return true;
        const age = Date.now() - fetchedAt;
        switch (frequency) {
            case 'every-tab': return true;
            case 'hourly': return age > 60 * 60 * 1000;
            case 'daily': return age > 24 * 60 * 60 * 1000;
            default: return age > 24 * 60 * 60 * 1000;
        }
    },

    async _fetchNewImage(apiKey, theme) {
        try {
            const queryParam = theme && theme !== 'random' ? `query=${encodeURIComponent(theme)}&` : '';
            const url = `https://api.unsplash.com/photos/random?${queryParam}orientation=landscape&client_id=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.warn('[CoolNewTab] Unsplash API error:', res.status);
                this._applyFallback();
                return;
            }
            const json = await res.json();
            const imgUrl = `${json.urls.raw}&w=5120&q=85&fit=crop`;
            const photographer = json.user.name;
            const photographerUrl = json.user.links.html;
            const photoUrl = json.links.html;
            const photoTitle = json.description || json.alt_description || '';
            const photoLocation = (json.location && json.location.name) || '';

            this._applyBackground(imgUrl, photographer, photographerUrl, photoUrl, photoTitle, photoLocation);
            await Storage.setCache('currentBackground', {
                url: imgUrl,
                photographer,
                photographerUrl,
                photoUrl,
                photoTitle,
                photoLocation,
                theme,
                fetchedAt: Date.now()
            });
        } catch (err) {
            console.error('[CoolNewTab] Background fetch error:', err);
            this._applyFallback();
        }
    },

    _applyBackground(url, photographer, photographerUrl, photoUrl, photoTitle, photoLocation) {
        const bg = document.getElementById('background');
        if (!bg) return;

        const img = new Image();
        img.onload = () => {
            bg.style.backgroundImage = `url(${url})`;
            bg.classList.add('loaded');
        };
        img.onerror = () => this._applyFallback();
        img.src = url;

        // Build two-line credit
        const credit = document.getElementById('photo-credit');
        if (credit && photographer) {
            // Line 1: title + location
            let line1Parts = [];
            if (photoTitle) {
                line1Parts.push(`<a href="${photoUrl}?utm_source=cool_new_tab&utm_medium=referral" target="_blank" rel="noopener">${photoTitle}</a>`);
            }
            if (photoLocation) {
                const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(photoLocation)}`;
                line1Parts.push(`<a href="${mapsUrl}" target="_blank" rel="noopener">📍 ${photoLocation}</a>`);
            }
            const line1 = line1Parts.length > 0 ? `<div class="photo-credit-line">${line1Parts.join(' · ')}</div>` : '';

            // Line 2: photographer + unsplash + refresh
            const line2 = `<div class="photo-credit-line">Photo by <a href="${photographerUrl}?utm_source=cool_new_tab&utm_medium=referral" target="_blank" rel="noopener">${photographer}</a> on <a href="https://unsplash.com?utm_source=cool_new_tab&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a> · <a href="#" id="refresh-bg-btn" title="New background">↻</a></div>`;

            credit.innerHTML = line1 + line2;
            credit.style.display = 'block';

            const refreshBtn = document.getElementById('refresh-bg-btn');
            if (refreshBtn) {
                refreshBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    Background.init(true);
                });
            }
        }
    },

    _applyFallback() {
        const bg = document.getElementById('background');
        if (!bg) return;
        bg.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';
        bg.classList.add('loaded');
    }
};

window.Background = Background;
