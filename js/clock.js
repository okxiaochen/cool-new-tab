// Cool New Tab — Clock & Greeting Module
// Uses 12-hour format without AM/PM

const Clock = {
    _interval: null,

    async init() {
        this.render();
        this._interval = setInterval(() => this.render(), 1000);
    },

    async render() {
        const now = new Date();
        const hours24 = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');

        // 12-hour format, no AM/PM
        let hours12 = hours24 % 12;
        if (hours12 === 0) hours12 = 12;

        const timeEl = document.getElementById('clock-time');
        if (timeEl) {
            timeEl.textContent = `${hours12}:${minutes}`;
        }

        const dateEl = document.getElementById('clock-date');
        if (dateEl) {
            const options = { weekday: 'long', month: 'long', day: 'numeric' };
            dateEl.textContent = now.toLocaleDateString('en-US', options);
        }

        const greetingEl = document.getElementById('greeting');
        if (greetingEl) {
            const name = await Storage.get('name');
            let greeting;
            if (hours24 < 5) greeting = 'Good night';
            else if (hours24 < 12) greeting = 'Good morning';
            else if (hours24 < 17) greeting = 'Good afternoon';
            else if (hours24 < 21) greeting = 'Good evening';
            else greeting = 'Good night';

            greetingEl.textContent = name ? `${greeting}, ${name}.` : `${greeting}.`;
        }
    },

    destroy() {
        if (this._interval) clearInterval(this._interval);
    }
};

window.Clock = Clock;
