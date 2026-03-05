// Cool New Tab — Fun Facts & Jokes Module
// Fetches daily fun fact + joke from free APIs, caches for 24h,
// falls back to bundled data when offline or API fails.

// ── Bundled fallback data ──
const FALLBACK_FACTS = [
    { text: "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still perfectly edible.", category: "Science" },
    { text: "Octopuses have three hearts, nine brains, and blue blood.", category: "Nature" },
    { text: "A teaspoon of a neutron star would weigh about 6 billion tons.", category: "Science" },
    { text: "Bananas are slightly radioactive because they contain potassium-40.", category: "Science" },
    { text: "A bolt of lightning is five times hotter than the surface of the Sun.", category: "Science" },
    { text: "Sharks have been around longer than trees — 400 million years vs 350 million years.", category: "Nature" },
    { text: "Water can boil and freeze at the same time — it's called the triple point.", category: "Science" },
    { text: "Butterflies taste with their feet.", category: "Nature" },
    { text: "Sea otters hold hands while sleeping so they don't drift apart.", category: "Nature" },
    { text: "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.", category: "History" },
    { text: "Oxford University is older than the Aztec Empire.", category: "History" },
    { text: "Nintendo was founded in 1889 — they originally made playing cards.", category: "History" },
    { text: "Scotland's national animal is the unicorn.", category: "Culture" },
    { text: "The first computer bug was an actual bug — a moth found in a Harvard Mark II computer in 1947.", category: "Tech" },
    { text: "The average smartphone has more computing power than all of NASA had during Apollo 11.", category: "Tech" },
    { text: "Strawberries aren't actually berries, but bananas are.", category: "Food" },
    { text: "Ketchup was once sold as medicine in the 1830s.", category: "Food" },
    { text: "Russia spans 11 time zones.", category: "Geography" },
    { text: "Canada has more lakes than the rest of the world combined.", category: "Geography" },
    { text: "Venus is the only planet that spins clockwise.", category: "Space" },
    { text: "A sunset on Mars appears blue.", category: "Space" },
    { text: "It rains diamonds on Saturn and Jupiter.", category: "Space" },
    { text: "A group of flamingos is called a \"flamboyance.\"", category: "Nature" },
    { text: "Cows have best friends and get stressed when they are separated.", category: "Nature" },
    { text: "The dot over the letters 'i' and 'j' is called a tittle.", category: "Language" },
    { text: "If you shuffle a deck of cards properly, the resulting order has almost certainly never existed before.", category: "Science" },
    { text: "The average cloud weighs about 1.1 million pounds.", category: "Science" },
    { text: "There is a species of jellyfish (Turritopsis dohrnii) that is biologically immortal.", category: "Nature" },
    { text: "LEGO is the world's largest tire manufacturer by number of tires produced.", category: "Culture" },
    { text: "Google's original name was \"BackRub.\"", category: "Tech" }
];

const FALLBACK_JOKES = [
    { setup: "Why do programmers prefer dark mode?", punchline: "Because light attracts bugs." },
    { setup: "Parallel lines have so much in common.", punchline: "It's a shame they'll never meet." },
    { setup: "What do you call a fake noodle?", punchline: "An impasta." },
    { setup: "Why don't scientists trust atoms?", punchline: "Because they make up everything." },
    { setup: "What did the ocean say to the beach?", punchline: "Nothing, it just waved." },
    { setup: "Why did the scarecrow win an award?", punchline: "He was outstanding in his field." },
    { setup: "What do you call a bear with no teeth?", punchline: "A gummy bear." },
    { setup: "Why don't eggs tell jokes?", punchline: "They'd crack each other up." },
    { setup: "How does the Moon cut his hair?", punchline: "Eclipse it." },
    { setup: "Why did the developer go broke?", punchline: "Because he used up all his cache." },
    { setup: "A SQL query walks into a bar, sees two tables, and asks...", punchline: "\"Can I join you?\"" },
    { setup: "Why do Java developers wear glasses?", punchline: "Because they can't C#." },
    { setup: "What sits at the bottom of the sea and twitches?", punchline: "A nervous wreck." },
    { setup: "I'm reading a book about anti-gravity.", punchline: "It's impossible to put down." },
    { setup: "I would tell you a construction joke.", punchline: "But I'm still working on it." }
];


const CACHE_KEY = 'cachedFunContent';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const Quotes = {
    /**
     * Fetch a random fun fact from the uselessfacts API.
     * Returns { text, category } or null on failure.
     */
    async _fetchFact() {
        try {
            const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random?language=en');
            if (!res.ok) return null;
            const json = await res.json();
            return { text: json.text, category: 'Fact' };
        } catch {
            return null;
        }
    },

    /**
     * Fetch a random joke from the Official Joke API.
     * Returns { setup, punchline } or null on failure.
     */
    async _fetchJoke() {
        try {
            const res = await fetch('https://official-joke-api.appspot.com/random_joke');
            if (!res.ok) return null;
            const json = await res.json();
            return { setup: json.setup, punchline: json.punchline };
        } catch {
            return null;
        }
    },

    /**
     * Get cached content or fetch fresh content if cache is stale/missing.
     * Stores both a fact and a joke; randomly picks one to display.
     */
    async _getContent() {
        // Check cache first
        const cached = await Storage.getCache(CACHE_KEY);
        if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt < CACHE_TTL)) {
            return cached;
        }

        // Fetch fresh content (fact + joke in parallel)
        const [fact, joke] = await Promise.all([
            this._fetchFact(),
            this._fetchJoke()
        ]);

        const content = {
            fact: fact || this._randomFrom(FALLBACK_FACTS),
            joke: joke || this._randomFrom(FALLBACK_JOKES),
            fetchedAt: Date.now()
        };

        // Cache for 24h
        await Storage.setCache(CACHE_KEY, content);
        return content;
    },

    _randomFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    /**
     * Get today's display item — randomly picks between the cached fact or joke.
     * Uses day-of-year so the same item shows for the full day.
     */
    _pickForToday(content) {
        const now = new Date();
        const dayOfYear = Math.floor(
            (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
        );
        // Alternate between fact and joke based on odd/even day
        if (dayOfYear % 2 === 0) {
            return { type: 'fact', data: content.fact };
        } else {
            return { type: 'joke', data: content.joke };
        }
    },

    async render() {
        const el = document.getElementById('quote');
        if (!el) return;

        // Get content (from cache or API)
        const content = await this._getContent();
        const pick = this._pickForToday(content);

        if (pick.type === 'joke' && pick.data.setup) {
            // Joke format: setup + punchline
            el.innerHTML = `
        <p class="quote-text">${pick.data.setup}</p>
        <p class="quote-punchline">${pick.data.punchline}</p>
        <p class="quote-author">Joke</p>
      `;
        } else {
            // Fun fact format
            el.innerHTML = `
        <p class="quote-text">${pick.data.text}</p>
        <p class="quote-author">${pick.data.category || 'Fun Fact'}</p>
      `;
        }
        el.classList.add('fade-in');
    }
};

window.Quotes = Quotes;
