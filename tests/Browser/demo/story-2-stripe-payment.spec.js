// @ts-check
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'
import { findDemoCourseId } from './helpers/find-demo-course.js'

/**
 * Milestone 4 — Story 2: Student Buys a Class with Stripe
 *
 * Verifies the Stripe-checkout path opens correctly when the student clicks
 * "Pay with Credit Card" on the Demo Stripe Course detail page.
 *
 * We stub `POST /api/stripe/payment-intent/{course}` to return a fake
 * client_secret — that's enough to open the checkout dialog. We do NOT drive
 * the Stripe Elements iframe (too brittle) — the demo plan just shows the
 * card form rendering and submission completing; verifying the dialog opens
 * is the strongest E2E assertion possible without real Stripe keys.
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
 */

const PAYMENT_INTENT_RESPONSE = {
    success: true,
    data: {
        client_secret: 'pi_test_demoSecret_abc123_secret_xyz',
    },
}

async function setupStripeMocks(page) {
    await page.route('**/api/stripe/payment-intent/**', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(PAYMENT_INTENT_RESPONSE),
        })
    )

    // Stripe.js makes outbound calls to api.stripe.com — block them so the
    // Elements iframe gracefully no-ops. The dialog still opens and renders
    // the "Complete Payment" header, which is what we're asserting on.
    await page.route('https://js.stripe.com/**', (route) =>
        route.fulfill({ status: 204, body: '' })
    )
    await page.route('https://api.stripe.com/**', (route) =>
        route.fulfill({ status: 204, body: '' })
    )
}

test.describe('Demo Story 2 — Student buys a class with Stripe', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.student.email, DEMO_USERS.student.password)
    })

    test('Story 2: Pay with Credit Card opens Stripe checkout dialog', async ({ page }) => {
        const courseId = await findDemoCourseId(page, DEMO_COURSES.stripe)
        test.skip(!courseId, 'Demo Stripe Course not seeded — run DemoVideoSeeder')

        await setupStripeMocks(page)

        await page.goto(`/classes/${courseId}`)
        await waitForApp(page)

        // Title + price
        await expect(page.getByRole('heading', { name: DEMO_COURSES.stripe })).toBeVisible()
        await expect(page.getByText(/¥5,800/).first()).toBeVisible()

        // Click the Stripe button — track the payment-intent call
        const intentPromise = page.waitForResponse(/\/api\/stripe\/payment-intent\//)

        const ccButton = page.getByRole('button', { name: /Pay with Credit Card/i }).first()
        await expect(ccButton).toBeEnabled()
        await ccButton.click()

        const intentResp = await intentPromise
        expect(intentResp.status()).toBe(200)

        // Checkout dialog opens — header is "Complete Payment"
        await expect(page.getByText(/Complete Payment/i)).toBeVisible({ timeout: 10_000 })
    })
})
