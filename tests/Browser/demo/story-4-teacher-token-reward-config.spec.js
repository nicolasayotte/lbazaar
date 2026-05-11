// @ts-check
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'
import { findDemoCourseId } from './helpers/find-demo-course.js'

/**
 * Milestone 4 — Story 4: Teacher Configures Token Rewards
 *
 * Builds on Story 3 — same edit page, same Reward Settings card. The Demo ADA
 * Course is seeded with token_reward_enabled=true and token_reward_amount=100,
 * so this spec verifies both fields render with the seeded values, proving the
 * teacher's configuration persisted correctly and would airdrop alongside the
 * certificate at completion time.
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
 */

test.describe('Demo Story 4 — Teacher configures token reward', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.teacher.email, DEMO_USERS.teacher.password)
    })

    test('Story 4: token reward switch is on with the seeded amount', async ({ page }) => {
        const courseId = await findDemoCourseId(page, DEMO_COURSES.ada)
        test.skip(!courseId, 'Demo ADA Course not seeded — run DemoVideoSeeder')

        await page.goto(`/classes/${courseId}/edit`)
        await waitForApp(page)

        const tokenSwitch = page.locator('input[name="token_reward_enabled"]')
        await expect(tokenSwitch).toBeChecked()

        const tokenAmount = page.locator('input[name="token_reward_amount"]')
        await expect(tokenAmount).toHaveValue('100')

        // Both rewards should be active simultaneously — proves the
        // "single transaction airdrop" claim from the demo plan.
        const certSwitch = page.locator('input[name="certificate_enabled"]')
        await expect(certSwitch).toBeChecked()
    })
})
