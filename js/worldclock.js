// Cool New Tab — World Clock Module
// Uses Intl.DateTimeFormat — no API needed
// Vertical card layout: city label on top, time below, offset badge

const WorldClock = {
    _interval: null,

    async init() {
        const settings = await Storage.get();
        if (!settings.showWorldClock) {
            this._hide();
            return;
        }

        const clocks = settings.worldClocks || [];
        if (clocks.length === 0) return;

        this.render(clocks);
        this._interval = setInterval(() => this.render(clocks), 1000);
    },

    render(clocks) {
        const container = document.getElementById('world-clock-widget');
        if (!container) return;

        const now = new Date();
        // Local UTC offset in hours
        const localOffsetMin = -now.getTimezoneOffset(); // in minutes, positive = ahead of UTC

        container.innerHTML = '';
        for (const clock of clocks) {
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: clock.timezone,
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });

            const dayFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: clock.timezone,
                weekday: 'short'
            });

            // Calculate offset relative to local time
            const offsetStr = this._getRelativeOffset(now, clock.timezone, localOffsetMin);

            const card = document.createElement('div');
            card.className = 'wc-card';
            card.innerHTML = `
                <span class="wc-label">${clock.label}</span>
                <span class="wc-time">${formatter.format(now)}</span>
                <span class="wc-meta">
                    <span class="wc-day">${dayFormatter.format(now)}</span>
                    <span class="wc-offset">${offsetStr}</span>
                </span>
            `;
            container.appendChild(card);
        }

        container.classList.add('fade-in');
    },

    _getRelativeOffset(now, timezone, localOffsetMin) {
        // Get the target timezone's UTC offset by comparing formatted times
        // Create a date formatter that gives us the hour in UTC and in the target tz
        const utcHour = now.getUTCHours() * 60 + now.getUTCMinutes();

        // Get the time in the target timezone
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: false
        }).formatToParts(now);

        let tzHour = 0, tzMin = 0;
        for (const p of parts) {
            if (p.type === 'hour') tzHour = parseInt(p.value);
            if (p.type === 'minute') tzMin = parseInt(p.value);
        }

        // Target offset from UTC in minutes
        let targetOffsetMin = (tzHour * 60 + tzMin) - utcHour;
        // Normalize to range [-720, 720]
        if (targetOffsetMin > 720) targetOffsetMin -= 1440;
        if (targetOffsetMin < -720) targetOffsetMin += 1440;

        // Difference relative to local
        let diffMin = targetOffsetMin - localOffsetMin;
        // Normalize
        if (diffMin > 720) diffMin -= 1440;
        if (diffMin < -720) diffMin += 1440;

        const diffHours = diffMin / 60;
        const sign = diffHours >= 0 ? '+' : '';

        // Format: show half hours if needed
        if (diffHours === 0) return '±0h';
        if (Number.isInteger(diffHours)) return `${sign}${diffHours}h`;
        // Handle half-hour offsets (e.g., India +5:30)
        const h = Math.trunc(diffHours);
        const m = Math.abs(diffMin % 60);
        return `${sign}${h}:${m.toString().padStart(2, '0')}`;
    },

    _hide() {
        const container = document.getElementById('world-clock-widget');
        if (container) container.style.display = 'none';
    },

    destroy() {
        if (this._interval) clearInterval(this._interval);
    }
};

window.WorldClock = WorldClock;
