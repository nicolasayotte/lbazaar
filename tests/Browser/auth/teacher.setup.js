// @ts-check
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { TEST_USERS, STORAGE_STATE } from '../helpers/test-users.js';

setup('authenticate as teacher', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForRedirect(TEST_USERS.teacher.email, TEST_USERS.teacher.password);
    await page.context().storageState({ path: STORAGE_STATE.teacher });
});
