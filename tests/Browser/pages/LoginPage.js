// @ts-check
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

/**
 * Page Object for the portal login page (/portal/login).
 */
export class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     */
    constructor(page) {
        this.page = page;
        this.emailInput = page.locator('input[name="email"]');
        this.passwordInput = page.locator('input[name="password"]');
        this.submitButton = page.locator('button[type="submit"]');
    }

    /** Navigate to /portal/login and wait for the React app to mount. */
    async goto() {
        await this.page.goto('/portal/login');
        await waitForApp(this.page);
    }

    /**
     * Fill email and password fields, then click the submit button.
     * @param {string} email
     * @param {string} password
     */
    async login(email, password) {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

    /**
     * Log in and wait for Inertia navigation to complete after redirect.
     * @param {string} email
     * @param {string} password
     */
    async loginAndWaitForRedirect(email, password) {
        await Promise.all([
            this.page.waitForURL(url => !url.href.includes('/portal/login'), { timeout: 15000 }),
            this.login(email, password),
        ]);
        // Do NOT call waitForApp — redirect target (/) crashes React (null course_type)
    }
}
