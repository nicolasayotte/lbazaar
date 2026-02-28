// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { TEST_USERS } from '../helpers/test-users.js';
import { LoginPage } from '../pages/LoginPage.js';

// Each logout test does a fresh login so it gets its own independent
// server-side session.  Using the shared storageState fixture would cause
// whichever test runs first to invalidate the session for the other
// (both tests actually log out, so concurrent shared-session use causes
// a 419 CSRF error for the second test to arrive at the server).
test.use({ storageState: { cookies: [], origins: [] } });

// In Navbar.jsx the sign-out item renders as:
//   <Link as="div" href="/portal/logout" method="POST"> ... </Link>
// Inertia renders this as a <div> with a data-method attribute,
// or as a form-triggering element. We target it by its href value.
const LOGOUT_SELECTOR = 'button:has-text("Sign Out")';

test('logged-in user can logout', async ({ page }) => {
    // Fresh login gives this test its own session, independent of other tests.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(TEST_USERS.student.email, TEST_USERS.student.password);

    await page.goto('/classes');
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
    // Fresh login gives this test its own session, independent of other tests.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(TEST_USERS.student.email, TEST_USERS.student.password);

    await page.goto('/classes');
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
