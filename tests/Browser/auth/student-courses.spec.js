// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.student });

// ---------------------------------------------------------------------------
// F-06: Certificates page
// ---------------------------------------------------------------------------
test.describe('F-06: Student Certificates Page', () => {

    test('F-06.1: page loads without server error', async ({ page }) => {
        const response = await page.goto('/mypage/certificates');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/certificates/);
    });

    test('F-06.2: displays rewards table or empty-state card', async ({ page }) => {
        await page.goto('/mypage/certificates');
        await waitForApp(page);

        const hasTable = await page.locator('.MuiTable-root').count() > 0;
        const hasCard  = await page.locator('.MuiCard-root').count() > 0;

        expect(hasTable || hasCard).toBe(true);

        if (hasTable) {
            await expect(page.locator('.MuiTableHead-root')).toBeVisible();
        } else {
            await expect(page.locator('.MuiCard-root').first()).toBeVisible();
        }
    });

});

// ---------------------------------------------------------------------------
// F-07: Badges page
// ---------------------------------------------------------------------------
test.describe('F-07: Student Badges Page', () => {

    test('F-07.1: page loads without server error', async ({ page }) => {
        const response = await page.goto('/mypage/badges');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/badges/);
    });

    test('F-07.2: displays badges/rewards or empty-state card', async ({ page }) => {
        await page.goto('/mypage/badges');
        await waitForApp(page);

        const hasTable = await page.locator('.MuiTable-root').count() > 0;
        const hasCard  = await page.locator('.MuiCard-root').count() > 0;

        expect(hasTable || hasCard).toBe(true);
    });

});

// ---------------------------------------------------------------------------
// F-08: Course Attendance Flow
// ---------------------------------------------------------------------------
test.describe('F-08: Course Attendance Flow', () => {

    test('F-08.1: attend page loads and shows stepper for a booked schedule', async ({ page }) => {
        const response = await page.goto('/classes/1/attend/1');
        const status = response.status();
        test.skip(status === 404, 'No booked schedule with course_id=1 schedule_id=1 in seed data');
        expect(status).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('.MuiStepper-root')).toBeVisible();
    });

    test('F-08.2: watch page renders for a video/live class', async ({ page }) => {
        const response = await page.goto('/classes/1/attend/1/watch');
        const status = response.status();
        test.skip(status === 404, 'No watch page for course_id=1 schedule_id=1 in seed data');
        expect(status).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('h5').first()).toBeVisible();
    });

    test('F-08.3: exam page renders if accessible', async ({ page }) => {
        const response = await page.goto('/classes/1/attend/1/exams/1');
        const status = response.status();
        test.skip(status === 404, 'No exam with id=1 for schedule_id=1 in seed data');
        expect(status).toBeLessThan(500);
        await waitForApp(page);
    });

    test('F-08.4: feedback page renders if accessible', async ({ page }) => {
        const response = await page.goto('/classes/1/attend/1/feedback');
        const status = response.status();
        test.skip(status === 404, 'No feedback page for schedule_id=1 in seed data');
        expect(status).toBeLessThan(500);
        await waitForApp(page);
    });

});

// ---------------------------------------------------------------------------
// F-09: Course Browsing as Authenticated Student
// ---------------------------------------------------------------------------
test.describe('F-09: Course Browsing as Authenticated Student', () => {

    test('F-09.1: /classes listing displays filter panel and course cards when authenticated', async ({ page }) => {
        const response = await page.goto('/classes');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/classes/);
        await expect(page.locator('input[name="search_text"]')).toBeVisible();

        const cardCount = await page.locator('.MuiCard-root').count();
        expect(cardCount).toBeGreaterThan(0);
    });

    test('F-09.2: course detail page shows booking/purchase actions for authenticated student', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseLinks = page.locator('.MuiCard-root a[href*="/classes/"]');
        const linkCount = await courseLinks.count();
        test.skip(linkCount === 0, 'No course cards in seed data');

        const href = await courseLinks.first().getAttribute('href');
        await page.goto(href);
        await waitForInertiaNavigation(page);

        // Course title should be visible
        await expect(page.locator('h4').first()).toBeVisible();

        // Check for purchase/booking affordances
        const hasAdaIcon    = await page.locator('[data-testid="AccountBalanceWalletIcon"]').count() > 0;
        const hasCreditIcon = await page.locator('[data-testid="CreditCardIcon"]').count() > 0;
        const buttonCount   = await page.locator('button').count();

        expect(hasAdaIcon || hasCreditIcon || buttonCount > 0).toBe(true);
    });

});
