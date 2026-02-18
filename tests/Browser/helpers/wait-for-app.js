// @ts-check

/**
 * Wait for Inertia/React app to mount before asserting on React-rendered content.
 * Requires Vite dev server running: sail npm run dev
 * @param {import('@playwright/test').Page} page
 */
export const waitForApp = async (page) => {
    await page.waitForSelector('#app', { state: 'attached' });
    await page.waitForFunction(() => {
        const app = document.querySelector('#app');
        return app && app.children.length > 0;
    }, { timeout: 10000 });
};

/**
 * Wait for Inertia navigation to complete (network idle + React hydration).
 * @param {import('@playwright/test').Page} page
 */
export const waitForInertiaNavigation = async (page) => {
    await page.waitForLoadState('networkidle');
    await waitForApp(page);
};
