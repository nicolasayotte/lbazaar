// @ts-check
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

/**
 * Page Object for the portal login page (/portal/login).
 */
export class LoginPage {
    /**
     * @param {import('@playwright/test').Page} page
     * @param {string} [loginUrl='/portal/login']
     */
    constructor(page, loginUrl = '/portal/login') {
        this.page = page;
        this.loginUrl = loginUrl;
        this.emailInput = page.locator('input[name="email"]');
        this.passwordInput = page.locator('input[name="password"]');
        this.submitButton = page.locator('button[type="submit"]');
    }

    /** Navigate to the login page and wait for the app to mount. */
    async goto() {
        await this.page.goto(this.loginUrl);
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
            this.page.waitForURL(url => !url.href.includes(this.loginUrl), { timeout: 15000 }),
            this.login(email, password),
        ]);
        // Do NOT call waitForApp — redirect target (/) crashes React (null course_type)
    }
}
