// @ts-check
import { test, expect } from '@playwright/test'
import path from 'path'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'
import { findDemoCourseId } from './helpers/find-demo-course.js'

/**
 * Milestone 4 — Story 1: Student Buys a Class with ADA
 *
 * Walks the on-chain payment flow from the Demo ADA Course detail page:
 *   wallet connect → build-purchase-tx → student signTx → submit-purchase-tx
 *
 * Stubs the CIP-30 wallet (no real Eternl) and the two server endpoints
 * that would otherwise call out to Node.js / Blockfrost.
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder` (idempotent).
 */

const MOCK_WALLET_PATH = path.resolve(__dirname, '../helpers/mock-cip30-wallet.js')

const WALLET_INFO_RESPONSE = {
    accountAmt: '50000000',
    changeAddrBech32: 'addr_test1qr5xvq9jr0k8gku354pxn3u9cx4vq7qqcfaam2nfeq20xv',
    stakeKeyAddr: 'e0b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c',
    stakeAddrBech32: 'stake_test1uzctml7jksd2kf5gvxr9g7pew8xevl72aclr3ag43',
    stakeKeyHash: 'b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c',
    verified: false,
}

const BUILD_PURCHASE_TX_RESPONSE = {
    success: true,
    data: {
        cborTx: 'a0'.repeat(128),
        quoteExpiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    },
}

const SUBMIT_PURCHASE_TX_RESPONSE = {
    success: true,
    tx_hash: '00'.repeat(32),
}

async function setupWalletAndPaymentMocks(page) {
    await page.addInitScript({ path: MOCK_WALLET_PATH })

    await page.route('**/wallet/info', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(JSON.stringify(WALLET_INFO_RESPONSE)),
        })
    )

    await page.route('**/classes/*/build-purchase-tx', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(BUILD_PURCHASE_TX_RESPONSE),
        })
    )

    await page.route('**/classes/*/submit-purchase-tx', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(SUBMIT_PURCHASE_TX_RESPONSE),
        })
    )
}

test.describe('Demo Story 1 — Student buys a class with ADA', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.student.email, DEMO_USERS.student.password)
    })

    test('Story 1: ADA purchase flow signs and submits successfully', async ({ page }) => {
        const courseId = await findDemoCourseId(page, DEMO_COURSES.ada)
        test.skip(!courseId, 'Demo ADA Course not seeded — run DemoVideoSeeder')

        await setupWalletAndPaymentMocks(page)

        await page.goto(`/classes/${courseId}`)
        await waitForApp(page)

        // Title visible
        await expect(page.getByRole('heading', { name: DEMO_COURSES.ada })).toBeVisible()

        // Dual JPY+ADA price visible (story acceptance: live JPY→ADA conversion shown)
        await expect(page.getByText(/¥6,500/).first()).toBeVisible()
        await expect(page.getByText(/~₳/).first()).toBeVisible()

        // Connect Eternl wallet (mock)
        await page.getByRole('button', { name: 'eternl' }).click()
        await expect(page.getByText('₳').first()).toBeVisible({ timeout: 10_000 })

        // The "Buy with ADA" button should now enable
        const adaButton = page.getByRole('button', { name: /Buy with ADA/i })
        await expect(adaButton).toBeEnabled({ timeout: 10_000 })

        // Track that build-purchase-tx and submit-purchase-tx are both invoked
        const buildPromise  = page.waitForResponse(/\/classes\/\d+\/build-purchase-tx/)
        const submitPromise = page.waitForResponse(/\/classes\/\d+\/submit-purchase-tx/)

        await adaButton.click()

        const buildResp = await buildPromise
        expect(buildResp.status()).toBe(200)
        const submitResp = await submitPromise
        expect(submitResp.status()).toBe(200)

        // After a successful purchase the page navigates back to the course detail
        await waitForInertiaNavigation(page)
        await expect(page).toHaveURL(new RegExp(`/classes/${courseId}`))
    })
})
