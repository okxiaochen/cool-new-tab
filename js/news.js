// Cool New Tab — News Module
// Fetches top headlines from GNews API

const News = {
    _CACHE_DURATION: 60 * 60 * 1000, // 1 hour

    async init() {
        const settings = await Storage.get();
        if (!settings.showNews) {
            this._hide();
            return;
        }

        const apiKey = settings.newsApiKey;
        if (!apiKey) {
            this._showNoKey();
            return;
        }

        const container = document.getElementById('news-widget');
        if (!container) return;

        // Determine country: use saved country or default to US
        const country = (settings.newsCountry || 'us').toLowerCase();
        const category = settings.newsCategory || 'general';
        const cacheKey = `news_${category}_${country}`;
        const cached = await Storage.getCache(cacheKey);

        if (cached && (Date.now() - cached.fetchedAt) < this._CACHE_DURATION) {
            this._renderNews(container, cached.articles);
            return;
        }

        try {
            const url = `https://gnews.io/api/v4/top-headlines?category=${category}&lang=en&country=${country}&max=10&apikey=${apiKey}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            const articles = (data.articles || []).map(a => ({
                title: a.title,
                description: a.description,
                source: a.source.name,
                url: a.url,
                image: a.image,
                publishedAt: a.publishedAt
            }));

            await Storage.setCache(cacheKey, { articles, fetchedAt: Date.now() });
            this._renderNews(container, articles);
        } catch (err) {
            console.error('[CoolNewTab] News fetch error:', err);
            if (cached) {
                this._renderNews(container, cached.articles);
            } else {
                container.innerHTML = '<p class="widget-hint">Unable to load news</p>';
            }
        }
    },

    _renderNews(container, articles) {
        if (!articles || articles.length === 0) {
            container.innerHTML = '<p class="widget-hint">No news available</p>';
            return;
        }

        let html = `
      <div class="news-list">
    `;

        for (const article of articles) {
            const timeAgo = this._timeAgo(article.publishedAt);
            html += `
        <a class="news-card" href="${article.url}" target="_blank" rel="noopener">
          ${article.image ? `<img class="news-thumb" src="${article.image}" alt="" loading="lazy" />` : ''}
          <div class="news-content">
            <p class="news-title">${article.title}</p>
            <div class="news-meta">
              <span class="news-source">${article.source}</span>
              <span class="news-time">${timeAgo}</span>
            </div>
          </div>
        </a>
      `;
        }

        html += '</div>';
        container.innerHTML = html;
        container.classList.add('fade-in');
    },

    _timeAgo(dateStr) {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    },

    _showNoKey() {
        const container = document.getElementById('news-widget');
        if (container) {
            container.innerHTML = '<p class="widget-hint">Add news API key in settings</p>';
        }
    },

    _hide() {
        const container = document.getElementById('news-widget');
        if (container) container.style.display = 'none';
    }
};

window.News = News;
