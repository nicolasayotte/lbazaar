// @ts-check
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'

/**
 * Milestone 4 — Story 6: Student Receives Token Reward on Completion
 *
 * The Demo Reward Course is seeded with token_reward_status='eligible' and
 * token_reward_amount=100 for demo-student. This spec verifies that the
 * rewards page lists the token row alongside the certificate row, with the
 * correct course title, "Token" type label, and amount.
 *
 * Together with Story 5 this proves the demo-plan claim:
 *   "Same transaction as the certificate — one signature, both rewards delivered."
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
 */

test.describe('Demo Story 6 — Student receives token reward', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.student.email, DEMO_USERS.student.password)
    })

    test('Story 6: token reward row appears alongside the certificate row', async ({ page }) => {
        await page.goto('/mypage/certificates')
        await waitForApp(page)

        const table = page.locator('.MuiTable-root').first()
        await expect(table).toBeVisible()

        // Both reward types reference the Demo Reward Course
        const rewardRows = table.locator('tbody tr', { hasText: DEMO_COURSES.reward })
        // At least 2 rows: one certificate, one token
        await expect(rewardRows).toHaveCount(2, { timeout: 10_000 })

        // Token row: type cell says "Token", amount cell says "100"
        const tokenRow = rewardRows.filter({ hasText: /Token/ })
        await expect(tokenRow).toHaveCount(1)
        await expect(tokenRow.first()).toContainText('100')

        // Certificate row also present
        const certRow = rewardRows.filter({ hasText: /Certificate/ })
        await expect(certRow).toHaveCount(1)
    })
})
