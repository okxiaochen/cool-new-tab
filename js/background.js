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
            this._applyBackground(cached.url, cached.photographer, cached.photographerUrl);

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
                this._applyBackground(prefetched.url, prefetched.photographer, prefetched.photographerUrl);
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
            const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(theme)}&orientation=landscape&client_id=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.warn('[CoolNewTab] Unsplash API error:', res.status);
                this._applyFallback();
                return;
            }
            const json = await res.json();
            const imgUrl = json.urls.regular;
            const photographer = json.user.name;
            const photographerUrl = json.user.links.html;

            this._applyBackground(imgUrl, photographer, photographerUrl);
            await Storage.setCache('currentBackground', {
                url: imgUrl,
                photographer,
                photographerUrl,
                theme,
                fetchedAt: Date.now()
            });
        } catch (err) {
            console.error('[CoolNewTab] Background fetch error:', err);
            this._applyFallback();
        }
    },

    _applyBackground(url, photographer, photographerUrl) {
        const bg = document.getElementById('background');
        if (!bg) return;

        // Preload the image, then crossfade
        const img = new Image();
        img.onload = () => {
            bg.style.backgroundImage = `url(${url})`;
            bg.classList.add('loaded');
        };
        img.onerror = () => this._applyFallback();
        img.src = url;

        // Update photographer credit
        const credit = document.getElementById('photo-credit');
        if (credit && photographer) {
            credit.innerHTML = `Photo by <a href="${photographerUrl}?utm_source=cool_new_tab&utm_medium=referral" target="_blank" rel="noopener">${photographer}</a> on <a href="https://unsplash.com?utm_source=cool_new_tab&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;
            credit.style.display = 'block';
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
