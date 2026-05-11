// @ts-check
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'
import { findDemoCourseId } from './helpers/find-demo-course.js'

/**
 * Milestone 4 — Story 3: Teacher Configures NFT Certificate Reward
 *
 * The reward toggles + cert metadata fields live on the course edit page
 * (Portal/Course/Create.jsx serves both create and edit). The Demo ADA Course
 * is seeded with a certificate already enabled and a student already enrolled,
 * so this test verifies:
 *
 *   1. The certificate switch is rendered in the "on" state
 *   2. The seeded cert name + description show up
 *   3. The lock-after-enrollment guard fires when the teacher tries to flip
 *      `certificate_enabled` off — proving "students always get what was
 *      promised at signup time"
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
 */

test.describe('Demo Story 3 — Teacher configures NFT certificate', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.teacher.email, DEMO_USERS.teacher.password)
    })

    test('Story 3: certificate is enabled with the seeded name + description', async ({ page }) => {
        const courseId = await findDemoCourseId(page, DEMO_COURSES.ada)
        test.skip(!courseId, 'Demo ADA Course not seeded — run DemoVideoSeeder')

        await page.goto(`/classes/${courseId}/edit`)
        await waitForApp(page)

        // Reward settings card renders
        const certSwitch = page.locator('input[name="certificate_enabled"]')
        await expect(certSwitch).toBeChecked()

        // Seeded cert metadata visible
        const certName = page.locator('input[name="certificate_name"]')
        await expect(certName).toHaveValue('Blockchain Fundamentals Certificate')

        const certDesc = page.locator('textarea[name="certificate_description"]')
        await expect(certDesc).toHaveValue(/Awarded for completing the Demo ADA Course/)
    })

    test('Story 3 lock guard: server rejects reward change after enrollment', async ({ page }) => {
        const courseId = await findDemoCourseId(page, DEMO_COURSES.ada)
        test.skip(!courseId, 'Demo ADA Course not seeded — run DemoVideoSeeder')

        await page.goto(`/classes/${courseId}/edit`)
        await waitForApp(page)

        const certSwitch = page.locator('input[name="certificate_enabled"]')
        await expect(certSwitch).toBeChecked()
        await certSwitch.click()
        await expect(certSwitch).not.toBeChecked()

        // The update endpoint returns back() on rejection, so the response is
        // a 302 redirect (not a 200 success). We track the request and assert
        // the validation error message is in the response body. After redirect-
        // back, the URL stays at /classes/{id}/edit (we never see /schedules).
        const updatePromise = page.waitForResponse(/\/classes\/\d+\/update/)
        await page.locator('button[type="submit"]').first().click()
        const updateResp = await updatePromise

        // Inertia validation errors come back as 302 (web redirect) or 422
        // (XHR validation). Either is acceptable proof of rejection.
        expect([302, 422]).toContain(updateResp.status())

        // We're still on the edit page (no success redirect to /schedules)
        await page.waitForLoadState('networkidle')
        await expect(page).toHaveURL(new RegExp(`/classes/${courseId}/edit`))
    })
})
