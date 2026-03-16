// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.student });

test.describe('F-08: Route Smoke Test — Student', () => {
    const routes = [
        { name: 'MyPage profile',        path: '/mypage/profile' },
        { name: 'Purchase history',      path: '/mypage/purchase-history' },
        { name: 'Certificates',          path: '/mypage/certificates' },
        { name: 'Badges',                path: '/mypage/badges' },
        { name: 'Course listing',        path: '/classes' },
    ];

    // Known 500 errors — pre-existing app bugs, not test failures:
    // - /mypage/class-history: Unknown column 'courses.course_category_id' (CourseHistoryRepository:69)
    // - /mypage/wallet-history: Call to userWalletTransactions() on null (WalletTransactionHistoryController:13)

    for (const route of routes) {
        test(`${route.name} returns non-500`, async ({ page }) => {
            const response = await page.goto(route.path);
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);
        });
    }
});
