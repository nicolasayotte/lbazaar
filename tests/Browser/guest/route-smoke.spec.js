// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp } from '../helpers/wait-for-app.js';

test.describe('F-11.1: Public guest routes return non-500', () => {
    const routes = [
        { name: 'Home page',            path: '/' },
        { name: 'Course listing',       path: '/classes' },
        { name: 'Inquiries form',       path: '/inquiries' },
        { name: 'Registration index',   path: '/register' },
        { name: 'Student registration', path: '/register/student' },
        { name: 'Teacher registration', path: '/register/teacher' },
        { name: 'Portal login',         path: '/portal/login' },
        { name: 'Admin login',          path: '/admin/login' },
        { name: 'Forgot password',      path: '/forgot-password' },
    ];

    for (const route of routes) {
        test(`${route.name} (${route.path}) returns non-500`, async ({ page }) => {
            const response = await page.goto(route.path);
            expect(response.status()).toBeLessThan(500);
            try {
                await waitForApp(page);
            } catch (_) {
                // React failed to mount — HTTP status already asserted
            }
        });
    }
});
