// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';

// storageState injected by 'student' Playwright project (pw-student@example.com)
// Student role only — not admin, not teacher

// F-06.3: Non-admin accessing admin routes
test.describe('F-06.3: Admin route protection (authenticated non-admin)', () => {
    test('student visiting /admin/profile is redirected away from admin', async ({ page }) => {
        await page.goto('/admin/profile');
        await waitForApp(page);
        await expect(page).not.toHaveURL(/\/admin/);
    });
});

// F-06.4: Non-teacher accessing teacher routes
test.describe('F-06.4: Teacher route protection (authenticated non-teacher)', () => {
    test('student visiting /mypage/class-application is redirected away', async ({ page }) => {
        await page.goto('/mypage/class-application');
        await waitForApp(page);
        await expect(page).not.toHaveURL(/\/mypage\/class-application/);
    });
});
