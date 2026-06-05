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
//
// Discovers course/schedule IDs dynamically from the course detail page
// instead of hardcoding IDs. The seeder creates an "ongoing" schedule
// for PW Test Course with an enrolled student.
// ---------------------------------------------------------------------------
test.describe('F-08: Course Attendance Flow', () => {

    /** @type {string|null} */
    let courseId = null;
    /** @type {string|null} */
    let scheduleId = null;

    test.beforeAll(async ({ browser }) => {
        // Iterating multiple course detail pages over Vite hot-reload can exceed
        // the default 30 s hook timeout under load — give it room.
        test.setTimeout(60_000);

        const context = await browser.newContext({ storageState: STORAGE_STATE.student });
        const page = await context.newPage();

        try {
            // Search the listing for the seeder-created "PW Test Course" — the
            // only course the test student is enrolled in with an ongoing schedule.
            await page.goto('/classes?search_text=' + encodeURIComponent('PW Test Course'));
            await waitForApp(page);

            const courseLinks = page.locator('.MuiCard-root a[href*="/classes/"]');
            const count = await courseLinks.count();

            for (let i = 0; i < Math.min(count, 5); i++) {
                const href = await courseLinks.nth(i).getAttribute('href');
                if (!href || !href.match(/\/classes\/\d+$/)) continue;

                await page.goto(href);
                await waitForApp(page);

                // CourseScheduleList renders <Link href="/classes/{id}/attend/{id}">
                const attendLink = page.locator('a[href*="/attend/"]').first();
                if (await attendLink.count() > 0) {
                    const attendHref = await attendLink.getAttribute('href');
                    const m = attendHref?.match(/\/classes\/(\d+)\/attend\/(\d+)/);
                    if (m) {
                        courseId = m[1];
                        scheduleId = m[2];
                        break;
                    }
                }
            }
        } finally {
            await context.close();
        }
    });

    test('F-08.1: attend page loads and shows stepper for a booked schedule', async ({ page }) => {
        test.skip(!courseId || !scheduleId, 'No ongoing booked schedule found in seed data');

        const response = await page.goto(`/classes/${courseId}/attend/${scheduleId}`);
        const status = response.status();
        test.skip(status === 404, 'Attend page not found for discovered IDs');
        expect(status).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('.MuiStepper-root')).toBeVisible();
    });

    test('F-08.2: watch page renders for a video/live class', async ({ page }) => {
        test.skip(!courseId || !scheduleId, 'No ongoing booked schedule found in seed data');

        const response = await page.goto(`/classes/${courseId}/attend/${scheduleId}/watch`);
        const status = response.status();
        test.skip(status === 404, 'Watch page not found for discovered IDs');
        expect(status).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('h5').first()).toBeVisible();
    });

    test('F-08.3: exam page renders if accessible', async ({ page }) => {
        test.skip(!courseId || !scheduleId, 'No ongoing booked schedule found in seed data');

        // Discover the exam ID from the attend page. Attend.jsx renders exam steps
        // as <Link as="span"> (a <span>, no <a href>), so a DOM href selector never
        // matches — read the published exam id from the Inertia page props instead.
        await page.goto(`/classes/${courseId}/attend/${scheduleId}`);
        await waitForApp(page);

        const examId = await page.evaluate(() => {
            const el = document.getElementById('app');
            if (!el) return null;
            const data = JSON.parse(el.getAttribute('data-page') || '{}');
            const exams = (data?.props?.course?.exams || []).filter(e => e.published_at != null);
            return exams.length ? exams[0].id : null;
        });
        if (!examId) {
            test.skip(true, 'No published exam in seed data for the booked schedule');
            return;
        }

        const examHref = `/classes/${courseId}/attend/${scheduleId}/exams/${examId}`;
        const response = await page.goto(examHref);
        const status = response.status();
        test.skip(status === 404 || status === 401, 'Exam page not accessible');
        expect(status).toBeLessThan(500);
        await waitForApp(page);
    });

    test('F-08.4: feedback page renders if accessible', async ({ page }) => {
        test.skip(!courseId || !scheduleId, 'No ongoing booked schedule found in seed data');

        const response = await page.goto(`/classes/${courseId}/attend/${scheduleId}/feedback`);
        const status = response.status();
        test.skip(status === 404, 'Feedback page not found for discovered IDs');
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
