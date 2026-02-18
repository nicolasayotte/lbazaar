// @ts-check
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { TEST_USERS, STORAGE_STATE } from '../helpers/test-users.js';

setup('authenticate as admin', async ({ page }) => {
    const loginPage = new LoginPage(page, '/admin/login');
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.context().storageState({ path: STORAGE_STATE.admin });
});
