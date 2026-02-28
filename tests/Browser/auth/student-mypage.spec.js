// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.student });

test.describe('F-01: MyPage Navigation', () => {
    test('F-01.1: /mypage redirects authenticated student to /mypage/profile', async ({ page }) => {
        await page.goto('/mypage');
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/profile/);
    });

    test('F-01.2: MyPage sidebar shows all student navigation sections', async ({ page }) => {
        await page.goto('/mypage/profile');
        await waitForApp(page);

        await expect(page.getByText('Profile').first()).toBeVisible();
        await expect(page.getByText('Badges').first()).toBeVisible();
        await expect(page.getByText('Class History').first()).toBeVisible();
        await expect(page.getByText('Purchase History').first()).toBeVisible();
    });

    test('F-01.3: Profile page loads at /mypage/profile', async ({ page }) => {
        const response = await page.goto('/mypage/profile');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/profile/);
    });

    test('F-01.3: Class History page loads at /mypage/class-history', async ({ page }) => {
        const response = await page.goto('/mypage/class-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/class-history/);
    });

    test('F-01.3: Purchase History page loads at /mypage/purchase-history', async ({ page }) => {
        const response = await page.goto('/mypage/purchase-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/purchase-history/);
    });

    test('F-01.3: Badges page loads at /mypage/badges', async ({ page }) => {
        const response = await page.goto('/mypage/badges');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/badges/);
    });
});

test.describe('F-11: Student Route Smoke Tests', () => {
    test('/mypage/profile renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/profile');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/profile/);
    });

    test('/mypage/class-history renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/class-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/class-history/);
    });

    test('/mypage/purchase-history renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/purchase-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/purchase-history/);
    });

    test('/mypage/wallet-history renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/wallet-history');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/wallet-history/);
    });

    test('/mypage/certificates renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/certificates');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/certificates/);
    });

    test('/mypage/badges renders without server error', async ({ page }) => {
        const response = await page.goto('/mypage/badges');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/mypage\/badges/);
    });

    test('/classes renders without server error', async ({ page }) => {
        const response = await page.goto('/classes');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
        await expect(page).toHaveURL(/\/classes/);
    });

    test('/classes/1 returns non-500 response (404 acceptable if course absent)', async ({ page }) => {
        const response = await page.goto('/classes/1');
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);
    });
});
