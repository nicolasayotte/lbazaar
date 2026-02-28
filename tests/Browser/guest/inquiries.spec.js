// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';

const INQUIRIES_URL = '/inquiries';

// F-08.1: Inquiries page renders the contact form
test.describe('F-08.1: Inquiries page renders the contact form', () => {
    test('contact form shows name input', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);
        await expect(page.locator('input[name="name"]')).toBeVisible();
    });

    test('contact form shows email input', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('contact form shows subject input', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);
        await expect(page.locator('input[name="subject"]')).toBeVisible();
    });

    test('contact form shows message textarea', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);
        // MUI TextField with multiline renders as <textarea>
        await expect(page.locator('textarea[name="message"]')).toBeVisible();
    });

    test('contact form has a submit button', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);
        // Button uses onClick (not type="submit") — locate by text
        const submitBtn = page.locator('button').filter({ hasText: /submit/i });
        await expect(submitBtn).toBeVisible();
    });
});

// F-08.2: Submitting valid inquiry shows confirmation (dynamic field discovery)
test.describe('F-08.2: Submitting valid inquiry shows success', () => {
    test('fills form fields dynamically and submits — success alert appears', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);

        const card = page.locator('.MuiCard-root').first();

        // Fill inputs dynamically
        const inputs = card.locator('input[name]');
        const inputCount = await inputs.count();
        for (let i = 0; i < inputCount; i++) {
            const input = inputs.nth(i);
            const name = await input.getAttribute('name');
            const type = await input.getAttribute('type');
            if (type === 'email' || name === 'email') {
                await input.fill('test@example.com');
            } else {
                // alpha_spaces: only letters and spaces
                await input.fill('Test Value');
            }
        }

        // Fill textareas (message field renders as <textarea>)
        const textareas = card.locator('textarea[name]');
        const textareaCount = await textareas.count();
        for (let i = 0; i < textareaCount; i++) {
            await textareas.nth(i).fill('This is a test inquiry message for the form.');
        }

        // Submit
        const submitBtn = page.locator('button').filter({ hasText: /submit/i });
        await submitBtn.click();
        await waitForInertiaNavigation(page);

        // MUI Snackbar Alert with role="alert"
        await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8000 });
    });
});

// F-08.3: Empty inquiry shows validation errors
test.describe('F-08.3: Empty inquiry shows validation errors', () => {
    test('empty form submission shows MUI error state', async ({ page }) => {
        await page.goto(INQUIRIES_URL);
        await waitForApp(page);

        const submitBtn = page.locator('button').filter({ hasText: /submit/i });
        await submitBtn.click();
        await waitForApp(page);

        const errorEl = page.locator('.Mui-error').first();
        await expect(errorEl).toBeVisible();
    });
});
