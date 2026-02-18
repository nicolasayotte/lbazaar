// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

// All tests in this file run as the authenticated student
test.use({ storageState: STORAGE_STATE.student });

// In Navbar.jsx the sign-out item renders as:
//   <Link as="div" href="/portal/logout" method="POST"> ... </Link>
// Inertia renders this as a <div> with a data-method attribute,
// or as a form-triggering element. We target it by its href value.
const LOGOUT_SELECTOR = 'button:has-text("Sign Out")';

test('logged-in user can logout', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Click the logout link (Inertia Link with method="POST")
    const logoutEl = page.locator(LOGOUT_SELECTOR).first();
    await expect(logoutEl).toBeVisible();
    await logoutEl.click();

    await waitForInertiaNavigation(page);

    // After logout, should be redirected to the top page or login page
    const url = page.url();
    const isAtTopOrLogin = url.endsWith('/') || url.includes('/portal/login');
    expect(isAtTopOrLogin).toBe(true);
});

test('after logout, /mypage redirects to login', async ({ page }) => {
    await page.goto('/');
    await waitForApp(page);

    // Perform logout
    const logoutEl = page.locator(LOGOUT_SELECTOR).first();
    await logoutEl.click();
    await waitForInertiaNavigation(page);

    // Now attempt to access /mypage without auth
    await page.goto('/mypage');
    await waitForApp(page);

    await expect(page).toHaveURL(/\/portal\/login/);
});
