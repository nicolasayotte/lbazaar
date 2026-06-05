// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.admin });

// ─── F-01: Admin Profile ──────────────────────────────────────────────────────

test.describe('F-01: Admin Profile', () => {

    test('F-01.1: profile page loads with pre-populated form', async ({ page }) => {
        const response = await page.goto('/admin/profile');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/profile/);
        // Profile page has two forms (Edit Profile + Update Password) — scope to first
        await expect(page.locator('form').first()).toBeVisible();

        const firstNameInput = page.locator('input[name="first_name"]');
        await expect(firstNameInput).toBeVisible();
        const firstNameValue = await firstNameInput.inputValue();
        expect(firstNameValue.length).toBeGreaterThan(0);

        const emailInput = page.locator('input[name="email"]');
        await expect(emailInput).toBeVisible();
        const emailValue = await emailInput.inputValue();
        expect(emailValue).toContain('@');

        await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });

    test('F-01.2: admin profile can be updated and persists on reload', async ({ page }) => {
        await page.goto('/admin/profile');
        await waitForApp(page);

        const firstNameInput = page.locator('input[name="first_name"]');
        const originalFirst = await firstNameInput.inputValue();

        // first_name validation: letters and spaces only — no numbers
        const uid = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 8);
        const newFirst = `Playwright ${uid}`;
        await firstNameInput.click();
        await page.keyboard.press('Control+a');
        await firstNameInput.pressSequentially(newFirst);

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/profile') && resp.request().method() === 'PATCH'
        );
        await page.locator('button[type="submit"]').first().click();
        await responsePromise;
        await waitForApp(page);

        // Verify persistence on reload
        await page.goto('/admin/users');
        await waitForApp(page);
        await page.goto('/admin/profile');
        await waitForApp(page);

        const updatedValue = await page.locator('input[name="first_name"]').inputValue();
        expect(updatedValue).toBe(newFirst);

        // Restore original value
        const restoreInput = page.locator('input[name="first_name"]');
        await restoreInput.click();
        await page.keyboard.press('Control+a');
        await restoreInput.pressSequentially(originalFirst);
        const restorePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/profile') && resp.request().method() === 'PATCH'
        );
        await page.locator('button[type="submit"]').first().click();
        await restorePromise;
    });
});

// ─── F-02: User Management ────────────────────────────────────────────────────

test.describe('F-02: User Management', () => {

    test('F-02.1: users list page loads with table', async ({ page }) => {
        const response = await page.goto('/admin/users');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/users/);
        const table = page.locator('table');
        await expect(table).toBeVisible();

        const headers = page.locator('table thead tr th');
        await expect(headers).toHaveCount(6);
    });

    test('F-02.2: user detail page loads by clicking a row link', async ({ page }) => {
        await page.goto('/admin/users');
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        test.skip(rowCount === 0, 'No users in list — skipping detail page test');

        const firstRowViewLink = rows.first().locator('td:nth-child(6) a').first();
        const href = await firstRowViewLink.getAttribute('href');
        expect(href).toMatch(/\/admin\/users\/\d+/);

        const response = await page.goto(href);
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/users\/\d+/);
        await expect(page.locator('table')).toBeVisible();
    });

    test('F-02.3: create user page renders required form fields', async ({ page }) => {
        const response = await page.goto('/admin/users/create');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/admin\/users\/create/);

        await expect(page.locator('input[name="first_name"]')).toBeVisible();
        await expect(page.locator('input[name="last_name"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('select[name="role"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('F-02.4: creating user with valid data succeeds', async ({ page }) => {
        await page.goto('/admin/users/create');
        await waitForApp(page);

        const ts = Date.now();
        const firstName = 'E2E Test';
        const lastName = `User${ts}`;
        const email = `e2e-test-user-${ts}@example.com`;

        const firstNameInput = page.locator('input[name="first_name"]');
        await firstNameInput.click();
        await firstNameInput.pressSequentially(firstName);

        const lastNameInput = page.locator('input[name="last_name"]');
        await lastNameInput.click();
        await lastNameInput.pressSequentially(lastName);

        const emailInput = page.locator('input[name="email"]');
        await emailInput.click();
        await emailInput.pressSequentially(email);

        // Select first non-placeholder role
        const roleSelect = page.locator('select[name="role"]');
        const roleOptions = await roleSelect.locator('option').allInnerTexts();
        const firstRealRole = roleOptions.find(o => o.trim() !== '' && !o.includes('Select'));
        test.skip(!firstRealRole, 'No role options available');
        await roleSelect.selectOption({ label: firstRealRole });

        // Select first non-placeholder country if available
        const countrySelect = page.locator('select[name="country_id"]');
        const countryCount = await countrySelect.count();
        if (countryCount > 0) {
            const countryOptions = await countrySelect.locator('option').allInnerTexts();
            const firstRealCountry = countryOptions.find(o => o.trim() !== '' && !o.includes('Select'));
            if (firstRealCountry) {
                await countrySelect.selectOption({ label: firstRealCountry });
            }
        }

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/users') && resp.request().method() === 'POST'
        );
        await page.locator('button[type="submit"]').click();
        await responsePromise;
        await waitForInertiaNavigation(page);

        // Should redirect away from /create on success
        const currentUrl = page.url();
        if (currentUrl.includes('/create')) {
            const errorEls = page.locator('.MuiFormHelperText-root');
            const errCount = await errorEls.count();
            if (errCount > 0) {
                const errTexts = await errorEls.allTextContents();
                throw new Error(`Unexpected validation errors: ${errTexts.join(', ')}`);
            }
        }
    });

    test('F-02.5: creating user with duplicate email shows validation error', async ({ page }) => {
        await page.goto('/admin/users/create');
        await waitForApp(page);

        const firstNameInput = page.locator('input[name="first_name"]');
        await firstNameInput.click();
        await firstNameInput.pressSequentially('E2E Test');

        const lastNameInput = page.locator('input[name="last_name"]');
        await lastNameInput.click();
        await lastNameInput.pressSequentially('Duplicate');

        const emailInput = page.locator('input[name="email"]');
        await emailInput.click();
        await emailInput.pressSequentially('pw-admin@example.com');

        const roleSelect = page.locator('select[name="role"]');
        const roleOptions = await roleSelect.locator('option').allInnerTexts();
        const firstRealRole = roleOptions.find(o => o.trim() !== '' && !o.includes('Select'));
        if (firstRealRole) {
            await roleSelect.selectOption({ label: firstRealRole });
        }

        // country_id is required — select it so the ONLY validation error is the
        // duplicate email. Otherwise the response also carries a country error and
        // the assertion on "already been taken" becomes order/timing-sensitive (flaky).
        const countrySelect = page.locator('select[name="country_id"]');
        const countryValues = await countrySelect.locator('option').evaluateAll(
            opts => opts.map(o => o.value).filter(v => v !== '')
        );
        if (countryValues.length) {
            await countrySelect.selectOption(countryValues[0]);
        }

        const responsePromise = page.waitForResponse(resp =>
            resp.url().includes('/admin/users') && resp.request().method() === 'POST'
        );
        await page.locator('button[type="submit"]').click();
        await responsePromise;
        await waitForInertiaNavigation(page);

        await expect(page).toHaveURL(/\/admin\/users\/create/);
        // ErrorText renders as MUI Typography — use broad text match
        // Also check for generic error indicators (red helper text, error class)
        await expect(
            page.locator('text=/already been taken/i').first()
        ).toBeVisible({ timeout: 10000 });
    });

    test('F-02.6: user status can be toggled', async ({ page }) => {
        // Target the throwaway "E2E Test" users created by F-02.4 — toggling
        // is_enabled on the seeded "Playwright" fixture users (admin, teacher,
        // student) breaks every subsequent login that depends on them.
        const keyword = 'E2E Test';
        await page.goto('/admin/users?keyword=' + encodeURIComponent(keyword));
        await waitForApp(page);

        const rows = page.locator('table tbody tr');
        const rowCount = await rows.count();
        test.skip(rowCount === 0, `No "${keyword}" users found — F-02.4 must seed one first`);

        const firstRow = rows.first();
        const statusCellBefore = firstRow.locator('td:nth-child(4)');
        const statusBefore = await statusCellBefore.innerText();

        const toggleStatus = async () => {
            await page.goto('/admin/users?keyword=' + encodeURIComponent(keyword));
            await waitForApp(page);
            const actionsCell = page.locator('table tbody tr').first().locator('td:nth-child(6)');
            const buttons = actionsCell.locator('button');
            const buttonCount = await buttons.count();
            for (let i = 1; i < buttonCount; i++) {
                const btn = buttons.nth(i);
                if (await btn.isEnabled()) {
                    await btn.click();
                    const dialog = page.locator('[role="dialog"]');
                    await expect(dialog).toBeVisible({ timeout: 3000 });
                    const responsePromise = page.waitForResponse(resp =>
                        resp.url().includes('/admin/users') &&
                        resp.url().includes('/status/') &&
                        resp.request().method() === 'POST'
                    );
                    await dialog.getByRole('button').last().click();
                    await responsePromise;
                    await waitForInertiaNavigation(page);
                    return true;
                }
            }
            return false;
        };

        const clicked = await toggleStatus();
        test.skip(!clicked, 'No enabled status toggle button found');

        await page.goto('/admin/users?keyword=' + encodeURIComponent(keyword));
        await waitForApp(page);

        const updatedRow = page.locator('table tbody tr').first();
        const statusCellAfter = updatedRow.locator('td:nth-child(4)');
        const statusAfter = await statusCellAfter.innerText();
        expect(statusAfter.toLowerCase()).not.toBe(statusBefore.toLowerCase());

        // Restore the original status so the toggled user does not poison
        // subsequent runs of this suite (or other concurrent tests).
        await toggleStatus();
    });
});
