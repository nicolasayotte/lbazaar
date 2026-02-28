// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { TEST_USERS } from '../helpers/test-users.js';

test.use({ storageState: { cookies: [], origins: [] } });

// F-07.1: Registration index shows role selection
test.describe('F-07.1: Registration index role selection', () => {
    test('renders student and teacher registration links', async ({ page }) => {
        await page.goto('/register');
        await waitForApp(page);
        await expect(page.locator('a[href*="register/student"]')).toBeVisible();
        await expect(page.locator('a[href*="register/teacher"]')).toBeVisible();
    });
});

// F-07.4: Duplicate email shows error
test.describe('F-07.4: Duplicate email validation', () => {
    test('registering with existing email shows error', async ({ page }) => {
        await page.goto('/register/student');
        await waitForApp(page);
        await page.locator('input[name="first_name"]').fill('Test');
        await page.locator('input[name="last_name"]').fill('Duplicate');
        await page.selectOption('select[name="country_id"]', { index: 1 });
        await page.locator('input[name="email"]').fill(TEST_USERS.student.email);
        await page.locator('input[name="password"]').fill('Test1234!');
        await page.locator('input[name="password_confirmation"]').fill('Test1234!');
        await page.locator('button[type="submit"]').click();
        await waitForInertiaNavigation(page);
        const errorEl = page.locator('.Mui-error, [class*="error"]').first();
        await expect(errorEl).toBeVisible();
    });
});

// F-07.5: Teacher registration form renders all fields
test.describe('F-07.5: Teacher registration form fields', () => {
    test('renders all required inputs', async ({ page }) => {
        await page.goto('/register/teacher');
        await waitForApp(page);
        await expect(page.locator('input[name="first_name"]')).toBeVisible();
        await expect(page.locator('input[name="last_name"]')).toBeVisible();
        await expect(page.locator('input[name="email"]')).toBeVisible();
        await expect(page.locator('input[name="university"]')).toBeVisible();
        await expect(page.locator('input[name="specialty"]')).toBeVisible();
        // "about" is a textarea (MUI multiline)
        await expect(page.locator('textarea[name="about"]')).toBeVisible();
    });

    test('renders submit button', async ({ page }) => {
        await page.goto('/register/teacher');
        await waitForApp(page);
        await expect(page.locator('button[type="submit"].MuiButton-contained').first()).toBeVisible();
    });
});

// F-07.6: Successful teacher registration
test.describe('F-07.6: Successful teacher registration', () => {
    test('valid teacher form redirects to /register/teacher/success', async ({ page }) => {
        await page.goto('/register/teacher');
        await waitForApp(page);

        const uniqueEmail = `pw-e2e-teacher-${Date.now()}@example.com`;
        await page.locator('input[name="first_name"]').fill('Teacher');
        await page.locator('input[name="last_name"]').fill('Test');
        await page.locator('input[name="email"]').fill(uniqueEmail);
        await page.locator('input[name="university"]').fill('Test University');
        await page.locator('input[name="specialty"]').fill('Computer Science');
        await page.locator('textarea[name="about"]').fill('Test teacher bio for E2E testing.');

        // Education required — click first "Add" button for education section
        const addButtons = page.locator('button').filter({ hasText: /add/i });
        await addButtons.first().click();
        const startDateInput = page.locator('input[name="education.0.start_date"]');
        await startDateInput.fill('2020-01-01');

        // Use the contained variant submit button (not the Cancel button which is also type="submit")
        await page.locator('button[type="submit"].MuiButton-contained').first().click();
        await waitForInertiaNavigation(page);
        await expect(page).toHaveURL(/\/register\/teacher\/success/);
    });
});
