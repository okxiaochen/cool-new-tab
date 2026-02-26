// Cool New Tab — World Clock Module
// Uses Intl.DateTimeFormat — no API needed
// 12-hour format with AM/PM

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

        container.innerHTML = '';
        for (const clock of clocks) {
            const now = new Date();
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

            const card = document.createElement('div');
            card.className = 'world-clock-card';
            card.innerHTML = `
        <span class="wc-city">${clock.label}</span>
        <span class="wc-time">${formatter.format(now)}</span>
        <span class="wc-day">${dayFormatter.format(now)}</span>
      `;
            container.appendChild(card);
        }

        container.classList.add('fade-in');
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
