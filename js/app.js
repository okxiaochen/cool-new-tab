// Cool New Tab — Main App Entry Point

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize all modules in parallel where possible
        // Storage must be available first (it's synchronous module)

        // Start background image loading immediately
        Background.init();

        // Initialize clock & greeting (instant, no API)
        Clock.init();

        // Initialize quotes (instant, bundled data)
        Quotes.render();

        // Initialize settings panel (event listeners)
        Settings.init();

        // Initialize API-dependent modules
        await Promise.allSettled([
            Weather.init(),
            WorldClock.init(),
            Calendar.init(),
            News.init()
        ]);

        // Show the page after a brief delay for smooth appearance
        document.body.classList.add('loaded');

    } catch (err) {
        console.error('[CoolNewTab] Initialization error:', err);
        document.body.classList.add('loaded');
    }
});
