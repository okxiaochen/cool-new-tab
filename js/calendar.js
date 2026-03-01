// Cool New Tab — Google Calendar Module
// Uses chrome.identity.getAuthToken() for OAuth2
// Shows compact next-event in top-right, full list in popover

const Calendar = {
    async init() {
        const settings = await Storage.get();
        this._authUser = settings.googleAccountIndex || 0;
        if (!settings.showCalendar) {
            this._hide();
            return;
        }

        const container = document.getElementById('calendar-widget');
        if (!container) return;

        // Check if chrome.identity is available
        if (typeof chrome === 'undefined' || !chrome.identity) {
            this._hide();
            return;
        }

        // Check if we have a token (non-interactive check)
        const cached = await Storage.getCache('calendarEvents');

        if (cached && cached.events && (Date.now() - cached.fetchedAt) < 15 * 60 * 1000) {
            const events = cached.events.map(ev => {
                if (ev.meetingUrl === undefined) ev.meetingUrl = null;
                return ev;
            });
            this._renderCompact(container, events);
            return;
        }

        try {
            const token = await this._getToken(false);
            if (!token) {
                this._hide();
                return;
            }
            // Uses manual googleAccountIndex setting for authuser
            const events = await this._fetchEvents(token);
            await Storage.setCache('calendarEvents', { events, fetchedAt: Date.now() });
            this._renderCompact(container, events);
        } catch (err) {
            console.error('[CoolNewTab] Calendar error:', err);
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
                            resolve(null);
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

        const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=10&conferenceDataVersion=1`;

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
            htmlLink: event.htmlLink,
            meetingUrl: this._extractMeetingUrl(event)
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

    _extractMeetingUrl(event) {
        // 1. Google Meet / Hangout link
        if (event.hangoutLink) return event.hangoutLink;
        // 2. Conference data entry points (Zoom, Teams, etc.)
        if (event.conferenceData && event.conferenceData.entryPoints) {
            const video = event.conferenceData.entryPoints.find(ep => ep.entryPointType === 'video');
            if (video && video.uri) return video.uri;
        }
        // 3. Regex fallback — search in location and description
        const meetingPattern = /https?:\/\/[^\s"<>]*(zoom\.us|teams\.microsoft\.com|meet\.google\.com|webex\.com)[^\s"<>]*/i;
        const text = (event.location || '') + ' ' + (event.description || '');
        const match = text.match(meetingPattern);
        if (match) return match[0];
        return null;
    },

    _addAuthUser(url) {
        if (!url || !this._authUser) return url;
        try {
            const u = new URL(url);
            // Only add authuser to Google domains
            if (u.hostname.endsWith('google.com') || u.hostname.endsWith('googleapis.com')) {
                u.searchParams.set('authuser', this._authUser);
                return u.toString();
            }
        } catch (e) { /* not a valid URL, return as-is */ }
        return url;
    },

    // Compact view for top-right: show next event + count badge
    _renderCompact(container, events) {
        container.innerHTML = '';
        container.style.display = '';

        if (!events || events.length === 0) {
            container.innerHTML = `
        <div class="calendar-compact" id="calendar-compact-trigger" style="cursor:pointer;text-align:right" title="Open Google Calendar">
          <span class="calendar-compact-text">No events</span>
        </div>
      `;
            container.classList.add('fade-in');
            // Click to open Google Calendar when no events
            const trigger = container.querySelector('#calendar-compact-trigger');
            if (trigger) {
                const calUrl = this._addAuthUser('https://calendar.google.com');
                trigger.addEventListener('click', () => {
                    window.open(calUrl, '_blank');
                });
            }
            return;
        }

        const nextEvent = events[0];
        const time = nextEvent.allDay ? 'All day' : this._formatTime(nextEvent.start);
        const remaining = events.length - 1;
        const badgeHtml = remaining > 0 ? `
        <div class="calendar-compact-header">
          <span class="calendar-compact-label"></span>
          <span class="calendar-badge">+${remaining}</span>
        </div>` : '';

        const joinBtnHtml = nextEvent.meetingUrl ? `
          <a class="calendar-join-btn" href="${this._addAuthUser(nextEvent.meetingUrl)}" target="_blank" rel="noopener" title="Join meeting">Join</a>` : '';

        container.innerHTML = `
      <div class="calendar-compact" id="calendar-compact-trigger">
        ${badgeHtml}
        <div class="calendar-compact-event-row">
          <a class="calendar-compact-event" href="${this._addAuthUser(nextEvent.htmlLink)}" target="_blank" rel="noopener">
            <span class="event-color" style="background:${nextEvent.color}"></span>
            <div class="calendar-compact-details">
              <span class="calendar-compact-time">${time}</span>
              <span class="calendar-compact-title">${nextEvent.title}</span>
            </div>
          </a>
          ${joinBtnHtml}
        </div>
      </div>
      <div class="calendar-popover" id="calendar-popover" style="display:none;">
        <div class="calendar-popover-header">Upcoming</div>
        ${events.map(ev => {
            const t = ev.allDay ? 'All day' : this._formatTime(ev.start);
            const joinBtn = ev.meetingUrl ? `<a class="calendar-join-btn" href="${this._addAuthUser(ev.meetingUrl)}" target="_blank" rel="noopener">Join</a>` : '';
            return `
            <div class="calendar-event-row">
              <a class="calendar-event" href="${this._addAuthUser(ev.htmlLink)}" target="_blank" rel="noopener">
                <span class="event-color" style="background:${ev.color}"></span>
                <span class="event-time">${t}</span>
                <span class="event-title">${ev.title}</span>
              </a>
              ${joinBtn}
            </div>
          `;
        }).join('')}
      </div>
    `;
        container.classList.add('fade-in');

        // Click header area to show/hide popover (always, not just when remaining > 0)
        const trigger = container.querySelector('#calendar-compact-trigger');
        const popover = container.querySelector('#calendar-popover');
        if (trigger && popover) {
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
