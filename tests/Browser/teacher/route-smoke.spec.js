// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.teacher });

test.describe('F-08: Route Smoke Test — Teacher', () => {
    const routes = [
        { name: 'MyPage profile',        path: '/mypage/profile' },
        { name: 'Class history',         path: '/mypage/class-history' },
        { name: 'Purchase history',      path: '/mypage/purchase-history' },
        { name: 'Wallet history',        path: '/mypage/wallet-history' },
        { name: 'Certificates',          path: '/mypage/certificates' },
        { name: 'Badges',                path: '/mypage/badges' },
        { name: 'Class applications',    path: '/mypage/class-application' },
        { name: 'Manage classes',        path: '/mypage/manage-class' },
        { name: 'Teaching schedules',    path: '/mypage/schedules' },
        { name: 'Course listing',        path: '/classes' },
    ];

    for (const route of routes) {
        test(`${route.name} returns non-500`, async ({ page }) => {
            const response = await page.goto(route.path);
            expect(response.status()).toBeLessThan(500);
            await waitForApp(page);
        });
    }
});
