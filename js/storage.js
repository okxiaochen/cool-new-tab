// Cool New Tab — Storage Helper
// Wraps chrome.storage.local with defaults and convenience methods
// Falls back to localStorage when chrome.storage is unavailable (dev mode)

const DEFAULTS = {
    name: '',
    backgroundTheme: 'nature',
    backgroundRefresh: 'daily', // 'every-tab', 'hourly', 'daily'
    unsplashApiKey: '',
    weatherApiKey: '',
    newsApiKey: '',
    weatherLocations: [], // [{ name: 'New York', lat: 40.71, lon: -74.01 }]
    useGeolocation: true,
    temperatureUnit: 'F', // 'C' or 'F'
    worldClocks: [], // [{ label: 'Tokyo', timezone: 'Asia/Tokyo' }]
    newsCategory: 'general',
    calendarAccounts: [], // [{ email, token }]
    googleAccountIndex: 0, // Chrome Google account index (0 = default, 1 = second, etc.)
    showCalendar: true,
    showNews: true,
    showWeather: true,
    showWorldClock: true,
    showQuote: true
};

const _hasChromeStorage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local);

// Private helpers for localStorage fallback
function _localGet(keys) {
    const result = {};
    for (const key of keys) {
        try {
            const val = localStorage.getItem('cnt_' + key);
            if (val !== null) result[key] = JSON.parse(val);
        } catch (e) { /* ignore */ }
    }
    return result;
}

function _localSet(obj) {
    for (const [key, value] of Object.entries(obj)) {
        try {
            localStorage.setItem('cnt_' + key, JSON.stringify(value));
        } catch (e) { /* ignore */ }
    }
}

const Storage = {
    async get(key) {
        let data;
        if (_hasChromeStorage) {
            data = await chrome.storage.local.get(['settings']);
        } else {
            data = _localGet(['settings']);
        }
        const settings = data.settings || {};
        if (key) return settings[key] !== undefined ? settings[key] : DEFAULTS[key];
        return { ...DEFAULTS, ...settings };
    },

    async set(key, value) {
        let data;
        if (_hasChromeStorage) {
            data = await chrome.storage.local.get(['settings']);
        } else {
            data = _localGet(['settings']);
        }
        const settings = data.settings || {};
        settings[key] = value;
        if (_hasChromeStorage) {
            await chrome.storage.local.set({ settings });
        } else {
            _localSet({ settings });
        }
    },

    async setAll(obj) {
        let data;
        if (_hasChromeStorage) {
            data = await chrome.storage.local.get(['settings']);
        } else {
            data = _localGet(['settings']);
        }
        const settings = { ...(data.settings || {}), ...obj };
        if (_hasChromeStorage) {
            await chrome.storage.local.set({ settings });
        } else {
            _localSet({ settings });
        }
    },

    async getCache(key) {
        if (_hasChromeStorage) {
            const data = await chrome.storage.local.get([key]);
            return data[key] || null;
        } else {
            const data = _localGet([key]);
            return data[key] || null;
        }
    },

    async setCache(key, value) {
        if (_hasChromeStorage) {
            await chrome.storage.local.set({ [key]: value });
        } else {
            _localSet({ [key]: value });
        }
    },

    getDefaults() {
        return { ...DEFAULTS };
    }
};

window.Storage = Storage;
