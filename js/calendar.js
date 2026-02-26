// Cool New Tab — Google Calendar Module
// Uses chrome.identity.getAuthToken() for OAuth2
// Shows compact next-event in top-right, full list in popover

const Calendar = {
    async init() {
        const settings = await Storage.get();
        if (!settings.showCalendar) {
            this._hide();
            return;
        }

        const container = document.getElementById('calendar-widget');
        if (!container) return;

        // Check if chrome.identity is available
        if (typeof chrome === 'undefined' || !chrome.identity) {
            // Not in extension context — hide entirely
            this._hide();
            return;
        }

        // Check if we have a token (non-interactive check)
        const cached = await Storage.getCache('calendarEvents');
        if (cached && (Date.now() - cached.fetchedAt) < 15 * 60 * 1000) {
            this._renderCompact(container, cached.events);
            return;
        }

        try {
            const token = await this._getToken(false);
            if (!token) {
                // Not connected — hide widget (user connects via settings)
                this._hide();
                return;
            }
            const events = await this._fetchEvents(token);
            await Storage.setCache('calendarEvents', { events, fetchedAt: Date.now() });
            this._renderCompact(container, events);
        } catch (err) {
            console.error('[CoolNewTab] Calendar error:', err);
            // Not connected — hide widget
            this._hide();
        }
    },

    _getToken(interactive = false) {
        return new Promise((resolve, reject) => {
            if (typeof chrome !== 'undefined' && chrome.identity) {
                chrome.identity.getAuthToken({ interactive }, (token) => {
                    if (chrome.runtime.lastError) {
                        if (interactive) {
                            reject(chrome.runtime.lastError);
                        } else {
                            resolve(null); // Non-interactive failure = not connected
                        }
                    } else {
                        resolve(token);
                    }
                });
            } else {
                resolve(null);
            }
        });
    },

    async _fetchEvents(token) {
        const now = new Date();
        // Get events for today and tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const timeMin = now.toISOString();
        const timeMax = tomorrow.toISOString();

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10`;

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                if (typeof chrome !== 'undefined' && chrome.identity) {
                    chrome.identity.removeCachedAuthToken({ token });
                }
                throw new Error('Token expired');
            }
            throw new Error(`Calendar API error: ${res.status}`);
        }

        const data = await res.json();
        return (data.items || []).map(event => ({
            title: event.summary || 'No title',
            start: event.start.dateTime || event.start.date,
            end: event.end.dateTime || event.end.date,
            allDay: !event.start.dateTime,
            color: event.colorId ? this._getColor(event.colorId) : '#4285f4',
            htmlLink: event.htmlLink
        }));
    },

    _getColor(colorId) {
        const colors = {
            '1': '#7986cb', '2': '#33b679', '3': '#8e24aa', '4': '#e67c73',
            '5': '#f6bf26', '6': '#f4511e', '7': '#039be5', '8': '#616161',
            '9': '#3f51b5', '10': '#0b8043', '11': '#d50000'
        };
        return colors[colorId] || '#4285f4';
    },

    // Compact view for top-right: show next event + count badge
    _renderCompact(container, events) {
        container.innerHTML = '';
        container.style.display = '';

        if (!events || events.length === 0) {
            container.innerHTML = `
        <div class="calendar-compact">
          <span class="calendar-icon">📅</span>
          <span class="calendar-compact-text">No events</span>
        </div>
      `;
            container.classList.add('fade-in');
            return;
        }

        const nextEvent = events[0];
        const time = nextEvent.allDay ? 'All day' : this._formatTime(nextEvent.start);
        const remaining = events.length - 1;
        const badge = remaining > 0 ? `<span class="calendar-badge">+${remaining}</span>` : '';

        container.innerHTML = `
      <div class="calendar-compact" id="calendar-compact-trigger">
        <div class="calendar-compact-header">
          <span class="calendar-icon">📅</span>
          <span class="calendar-compact-label">Next</span>
          ${badge}
        </div>
        <a class="calendar-compact-event" href="${nextEvent.htmlLink}" target="_blank" rel="noopener">
          <span class="event-color" style="background:${nextEvent.color}"></span>
          <div class="calendar-compact-details">
            <span class="calendar-compact-time">${time}</span>
            <span class="calendar-compact-title">${nextEvent.title}</span>
          </div>
        </a>
      </div>
      <div class="calendar-popover" id="calendar-popover" style="display:none;">
        <div class="calendar-popover-header">Today's Events</div>
        ${events.map(ev => {
            const t = ev.allDay ? 'All day' : this._formatTime(ev.start);
            return `
            <a class="calendar-event" href="${ev.htmlLink}" target="_blank" rel="noopener">
              <span class="event-color" style="background:${ev.color}"></span>
              <span class="event-time">${t}</span>
              <span class="event-title">${ev.title}</span>
            </a>
          `;
        }).join('')}
      </div>
    `;
        container.classList.add('fade-in');

        // Click badge/header to show/hide popover
        const trigger = container.querySelector('#calendar-compact-trigger');
        const popover = container.querySelector('#calendar-popover');
        if (trigger && popover && remaining > 0) {
            trigger.style.cursor = 'pointer';
            trigger.addEventListener('click', (e) => {
                if (e.target.closest('a')) return; // Don't toggle when clicking the event link
                popover.style.display = popover.style.display === 'none' ? 'block' : 'none';
            });
        }
    },

    _formatTime(dateStr) {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    },

    _hide() {
        const container = document.getElementById('calendar-widget');
        if (container) container.style.display = 'none';
    }
};

window.Calendar = Calendar;
