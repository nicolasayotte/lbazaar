// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.student });

test.describe('F-02: Profile Management', () => {

    test('F-02.1: profile page loads with pre-populated fields', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/profile/);

        const firstNameInput = page.locator('input[name="first_name"]');
        const lastNameInput  = page.locator('input[name="last_name"]');
        const emailInput     = page.locator('input[name="email"]');

        await expect(firstNameInput).toBeVisible();
        await expect(lastNameInput).toBeVisible();
        await expect(emailInput).toBeVisible();

        const emailValue = await emailInput.inputValue();
        expect(emailValue.length).toBeGreaterThan(0);
    });

    test('F-02.2: editing first name and submitting shows success toast and persists on reload', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        const firstNameInput = page.locator('input[name="first_name"]');

        // Capture original value for restoration (SC-05)
        const originalFirstName = await firstNameInput.inputValue();
        const testFirstName = `${originalFirstName}_e2e`;

        // Edit the field
        await firstNameInput.fill(testFirstName);

        // Submit the profile form (scoped to form containing first_name)
        const profileForm = page.locator('form').filter({ has: page.locator('input[name="first_name"]') });
        await profileForm.locator('button[type="submit"]').click();

        // Wait for Inertia navigation (POST → redirect → GET)
        await waitForInertiaNavigation(page);

        // Success toast must appear
        const toast = page.locator('[role="alert"]');
        await expect(toast).toBeVisible({ timeout: 5000 });

        // Value persists after reload
        await page.reload();
        await waitForApp(page);

        const persistedValue = await page.locator('input[name="first_name"]').inputValue();
        expect(persistedValue).toBe(testFirstName);

        // SC-05 RESTORE: put back the original first_name value
        await page.locator('input[name="first_name"]').fill(originalFirstName);
        const restoreForm = page.locator('form').filter({ has: page.locator('input[name="first_name"]') });
        await restoreForm.locator('button[type="submit"]').click();
        await waitForInertiaNavigation(page);
    });

    test('F-02.3: password change section visible with current/new/confirm fields', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        const currentPasswordInput  = page.locator('input[name="current_password"]');
        const newPasswordInput       = page.locator('input[name="new_password"]');
        const confirmPasswordInput   = page.locator('input[name="new_password_confirmation"]');

        await expect(currentPasswordInput).toBeVisible();
        await expect(newPasswordInput).toBeVisible();
        await expect(confirmPasswordInput).toBeVisible();

        await expect(currentPasswordInput).toHaveAttribute('type', 'password');
        await expect(newPasswordInput).toHaveAttribute('type', 'password');
        await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });

    test('F-02.4: mismatched password confirmation shows validation error', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        // Fill with intentionally mismatched confirmation (alpha_num only on new_password!)
        await page.locator('input[name="current_password"]').fill('Test1234!');
        await page.locator('input[name="new_password"]').fill('NewPass99');
        await page.locator('input[name="new_password_confirmation"]').fill('DifferentPass99');

        // Submit the password form (scoped)
        const passwordForm = page.locator('form').filter({ has: page.locator('input[name="current_password"]') });
        await passwordForm.locator('button[type="submit"]').click();

        // Wait for validation errors to appear after Inertia re-render
        await expect(page.locator('.Mui-error').first()).toBeVisible({ timeout: 5000 });

        // No success toast should appear
        await expect(page.locator('[role="alert"][class*="success"]')).not.toBeVisible();
        await expect(page).toHaveURL(/\/mypage\/profile/);
    });
});
