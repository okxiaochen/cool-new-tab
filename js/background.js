// Cool New Tab — Background Module
// Supports Static (Unsplash photo) and Dynamic (Pexels video) modes

const Background = {
    async init(forceRefresh = false) {
        const settings = await Storage.get();
        const mode = settings.backgroundMode || 'static';

        if (mode === 'dynamic') {
            await this._initDynamic(settings, forceRefresh);
        } else {
            await this._initStatic(settings, forceRefresh);
        }
    },

    // ========================
    // STATIC MODE (Unsplash)
    // ========================

    async _initStatic(settings, forceRefresh) {
        const refresh = settings.backgroundRefresh || 'daily';
        const apiKey = settings.unsplashApiKey;

        // Hide video element
        this._hideVideo();

        // Try cached background first
        const cached = await Storage.getCache('currentBackground');
        if (cached && cached.url && !forceRefresh) {
            this._applyImageBackground(cached.url, cached.photographer, cached.photographerUrl, cached.photoUrl, cached.photoTitle, cached.photoLocation);

            const themeChanged = cached.theme && cached.theme !== (settings.backgroundTheme || 'nature');
            if (!themeChanged && !this._shouldRefresh(cached.fetchedAt, refresh)) {
                return;
            }
        }

        // Try prefetched image
        if (!forceRefresh) {
            const prefetched = await Storage.getCache('prefetchedBackground');
            if (prefetched && prefetched.url) {
                this._applyImageBackground(prefetched.url, prefetched.photographer, prefetched.photographerUrl, prefetched.photoUrl, prefetched.photoTitle, prefetched.photoLocation);
                await Storage.setCache('currentBackground', prefetched);
                await Storage.setCache('prefetchedBackground', null);
                return;
            }
        }

        // Fetch fresh from Unsplash
        if (apiKey) {
            await this._fetchNewImage(apiKey, settings.backgroundTheme || 'nature');
        } else {
            this._applyFallback();
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

            this._applyImageBackground(imgUrl, photographer, photographerUrl, photoUrl, photoTitle, photoLocation);
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

    _applyImageBackground(url, photographer, photographerUrl, photoUrl, photoTitle, photoLocation) {
        const bg = document.getElementById('background');
        if (!bg) return;

        // Make sure video mode is off
        bg.classList.remove('video-mode');

        const img = new Image();
        img.onload = () => {
            bg.style.backgroundImage = `url(${url})`;
            bg.classList.add('loaded');
        };
        img.onerror = () => this._applyFallback();
        img.src = url;

        this._renderCredit({
            title: photoTitle,
            titleUrl: photoUrl ? `${photoUrl}?utm_source=cool_new_tab&utm_medium=referral` : null,
            location: photoLocation,
            author: photographer,
            authorUrl: photographerUrl ? `${photographerUrl}?utm_source=cool_new_tab&utm_medium=referral` : null,
            source: 'Unsplash',
            sourceUrl: 'https://unsplash.com?utm_source=cool_new_tab&utm_medium=referral'
        });
    },

    // ========================
    // DYNAMIC MODE (Pexels)
    // ========================

    async _initDynamic(settings, forceRefresh) {
        const refresh = settings.backgroundRefresh || 'daily';
        const apiKey = settings.pexelsApiKey;

        // Try cached video first
        const cached = await Storage.getCache('currentVideoBackground');
        if (cached && cached.videoUrl && !forceRefresh) {
            this._applyVideoBackground(cached);

            const themeChanged = cached.theme && cached.theme !== (settings.backgroundTheme || 'nature');
            if (!themeChanged && !this._shouldRefresh(cached.fetchedAt, refresh)) {
                return;
            }
        }

        // Try prefetched video
        if (!forceRefresh) {
            const prefetched = await Storage.getCache('prefetchedVideoBackground');
            if (prefetched && prefetched.videoUrl) {
                this._applyVideoBackground(prefetched);
                await Storage.setCache('currentVideoBackground', prefetched);
                await Storage.setCache('prefetchedVideoBackground', null);
                return;
            }
        }

        // Fetch fresh from Pexels
        if (apiKey) {
            await this._fetchNewVideo(apiKey, settings.backgroundTheme || 'nature');
        } else {
            this._applyFallback();
        }
    },

    async _fetchNewVideo(apiKey, theme) {
        try {
            const query = theme && theme !== 'random' ? theme : 'nature';
            // Randomize page to get variety
            const randomPage = Math.floor(Math.random() * 15) + 1;
            const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=landscape&per_page=1&page=${randomPage}&size=medium`;

            const res = await fetch(url, {
                headers: { 'Authorization': apiKey }
            });

            if (!res.ok) {
                console.warn('[CoolNewTab] Pexels API error:', res.status);
                this._applyFallback();
                return;
            }

            const json = await res.json();
            if (!json.videos || json.videos.length === 0) {
                console.warn('[CoolNewTab] Pexels: no videos found');
                this._applyFallback();
                return;
            }

            const video = json.videos[0];
            const videoFile = this._pickBestVideoFile(video.video_files);
            if (!videoFile) {
                console.warn('[CoolNewTab] Pexels: no suitable video file');
                this._applyFallback();
                return;
            }

            const videoData = {
                videoUrl: videoFile.link,
                videographer: video.user.name,
                videographerUrl: video.user.url,
                pexelsUrl: video.url,
                theme,
                fetchedAt: Date.now()
            };

            this._applyVideoBackground(videoData);
            await Storage.setCache('currentVideoBackground', videoData);
        } catch (err) {
            console.error('[CoolNewTab] Pexels video fetch error:', err);
            this._applyFallback();
        }
    },

    _pickBestVideoFile(files) {
        if (!files || files.length === 0) return null;

        // Filter for mp4 files only
        const mp4Files = files.filter(f => f.file_type === 'video/mp4');
        if (mp4Files.length === 0) return files[0];

        // Prefer HD quality (around 1920px width), fallback to largest available
        const hdFile = mp4Files.find(f => f.quality === 'hd' && f.width >= 1920);
        if (hdFile) return hdFile;

        // Fallback: largest width mp4
        mp4Files.sort((a, b) => (b.width || 0) - (a.width || 0));
        return mp4Files[0];
    },

    _applyVideoBackground(data) {
        const bg = document.getElementById('background');
        const video = document.getElementById('background-video');
        if (!bg || !video) return;

        bg.classList.add('video-mode');
        video.src = data.videoUrl;

        video.oncanplay = () => {
            bg.classList.add('loaded');
        };
        video.onerror = () => {
            console.warn('[CoolNewTab] Video load error, falling back');
            this._applyFallback();
        };
        video.load();

        this._renderCredit({
            author: data.videographer,
            authorUrl: data.videographerUrl,
            titleUrl: data.pexelsUrl,
            source: 'Pexels',
            sourceUrl: 'https://www.pexels.com'
        });
    },

    _hideVideo() {
        const bg = document.getElementById('background');
        const video = document.getElementById('background-video');
        if (bg) bg.classList.remove('video-mode');
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
    },

    // ========================
    // SHARED HELPERS
    // ========================

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

    _renderCredit({ title, titleUrl, location, author, authorUrl, source, sourceUrl }) {
        const credit = document.getElementById('photo-credit');
        if (!credit || !author) return;

        // Line 1: title + location (optional)
        let line1Parts = [];
        if (title && titleUrl) {
            line1Parts.push(`<a href="${titleUrl}" target="_blank" rel="noopener">${title}</a>`);
        } else if (titleUrl) {
            line1Parts.push(`<a href="${titleUrl}" target="_blank" rel="noopener">View on ${source}</a>`);
        }
        if (location) {
            const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(location)}`;
            line1Parts.push(`<a href="${mapsUrl}" target="_blank" rel="noopener">📍 ${location}</a>`);
        }
        const line1 = line1Parts.length > 0 ? `<div class="photo-credit-line">${line1Parts.join(' · ')}</div>` : '';

        // Line 2: author + source + refresh
        const authorLink = authorUrl ? `<a href="${authorUrl}" target="_blank" rel="noopener">${author}</a>` : author;
        const sourceLink = sourceUrl ? `<a href="${sourceUrl}" target="_blank" rel="noopener">${source}</a>` : source;
        const line2 = `<div class="photo-credit-line">By ${authorLink} on ${sourceLink} · <a href="#" id="refresh-bg-btn" title="New background">↻</a></div>`;

        credit.innerHTML = line1 + line2;
        credit.style.display = 'block';

        const refreshBtn = document.getElementById('refresh-bg-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault();
                Background.init(true);
            });
        }
    },

    _applyFallback() {
        const bg = document.getElementById('background');
        if (!bg) return;
        bg.classList.remove('video-mode');
        this._hideVideo();
        bg.style.background = 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)';
        bg.classList.add('loaded');
    }
};

window.Background = Background;
