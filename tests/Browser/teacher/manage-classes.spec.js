// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.teacher });

let classId = null;

test.describe('F-02: Manage Classes Dashboard', () => {

    test('F-02.1: manage classes page loads without server error', async ({ page }) => {
        const response = await page.goto('/mypage/manage-class');
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page).toHaveURL(/\/mypage\/manage-class/);

        // Page must show either a data table or an empty state card
        const hasTable = await page.locator('.MuiTable-root').count() > 0;
        const hasCard  = await page.locator('.MuiCard-root').count() > 0;
        expect(hasTable || hasCard).toBe(true);
    });

    test.describe('Tab navigation (requires at least one class)', () => {

        test.beforeAll(async ({ browser }) => {
            const context = await browser.newContext({
                storageState: STORAGE_STATE.teacher,
            });
            const page = await context.newPage();

            await page.goto('/mypage/manage-class');
            await waitForApp(page);

            const settingsLinks = page.locator('a[href*="/mypage/manage-class/"]');
            const count = await settingsLinks.count();

            if (count > 0) {
                const href = await settingsLinks.first().getAttribute('href');
                const match = href && href.match(/\/mypage\/manage-class\/(\d+)\//);
                if (match) {
                    classId = match[1];
                }
            }

            await context.close();
        });

        test('F-02.2: manage class tabs are visible', async ({ page }) => {
            test.skip(classId === null, 'No classes in seed data for teacher account — skipping tab tests');

            const response = await page.goto(`/mypage/manage-class/${classId}/schedules`);
            expect(response).not.toBeNull();
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);

            const tabs = page.locator('[role="tab"]');
            const tabCount = await tabs.count();
            expect(tabCount).toBeGreaterThanOrEqual(4);

            await expect(tabs.nth(0)).toBeVisible();
            await expect(tabs.nth(1)).toBeVisible();
            await expect(tabs.nth(2)).toBeVisible();
            await expect(tabs.nth(3)).toBeVisible();
        });

        test('F-02.3: feedbacks tab renders without errors', async ({ page }) => {
            test.skip(classId === null, 'No classes in seed data — skipping');

            const response = await page.goto(`/mypage/manage-class/${classId}/feedbacks`);
            expect(response).not.toBeNull();
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);

            await expect(page).toHaveURL(/\/mypage\/manage-class\/\d+\/feedbacks/);
            const hasCard = await page.locator('.MuiCard-root').count() > 0;
            expect(hasCard).toBe(true);
        });

        test('F-02.4: exams tab renders without errors', async ({ page }) => {
            test.skip(classId === null, 'No classes in seed data — skipping');

            const response = await page.goto(`/mypage/manage-class/${classId}/exams`);
            expect(response).not.toBeNull();
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);

            await expect(page).toHaveURL(/\/mypage\/manage-class\/\d+\/exams/);
            const hasCard = await page.locator('.MuiCard-root').count() > 0;
            expect(hasCard).toBe(true);
        });

        test('F-02.5: schedules tab renders without errors', async ({ page }) => {
            test.skip(classId === null, 'No classes in seed data — skipping');

            const response = await page.goto(`/mypage/manage-class/${classId}/schedules`);
            expect(response).not.toBeNull();
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);

            await expect(page).toHaveURL(/\/mypage\/manage-class\/\d+\/schedules/);
            const hasCard = await page.locator('.MuiCard-root').count() > 0;
            const hasButton = await page.locator('button').count() > 0;
            expect(hasCard && hasButton).toBe(true);
        });

        test('F-02.6: certificates tab renders without errors', async ({ page }) => {
            test.skip(classId === null, 'No classes in seed data — skipping');

            const response = await page.goto(`/mypage/manage-class/${classId}/certificates`);
            expect(response).not.toBeNull();
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);

            await expect(page).toHaveURL(/\/mypage\/manage-class\/\d+\/certificates/);
            const hasContent = await page.locator('.MuiBox-root').count() > 0;
            expect(hasContent).toBe(true);
        });

    });

});
