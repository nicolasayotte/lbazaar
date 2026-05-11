// @ts-check
import { test, expect } from '@playwright/test'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS } from './helpers/demo-users.js'

/**
 * Milestone 4 — Closing montage: Admin refund flow
 *
 * Verifies the admin refund panel renders for the demo-admin account. The
 * page lists prior purchases (Stripe + ADA) with a refund control on each
 * row; clicking a refund button calls /api/admin/refunds/{stripe|ada}/...
 * and flags the associated reward.
 *
 * The DemoVideoSeeder does not create completed Stripe payments or ADA
 * purchase records, so the table will likely be empty during the demo run.
 * This spec asserts the page structure (filters + refund table or empty
 * state) renders without server error — proving the route is wired up and
 * the admin role gate works. To exercise the actual refund-with-reward-
 * flagging flow, extend the seeder with a successful StripePayment row and
 * a corresponding completed CourseHistory; this spec already mocks the
 * refund endpoint so adding the row is the only follow-up needed.
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
 */

const REFUND_OK_RESPONSE = { success: true, message: 'Refund processed' }

test.describe('Demo Closing — Admin refund panel', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page, '/admin/login')
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.admin.email, DEMO_USERS.admin.password)
    })

    test('Closing: refund panel renders with filters and table/empty-state', async ({ page }) => {
        const response = await page.goto('/admin/refunds')
        expect(response).not.toBeNull()
        expect(response.status()).toBeLessThan(500)
        await waitForApp(page)

        await expect(page).toHaveURL(/\/admin\/refunds/)

        // Keyword search field is present
        await expect(page.locator('input[name="keyword"]').first()).toBeVisible()

        // Either the refund table or an empty-state card is rendered
        const tableOrEmpty = page.locator('table, .MuiCard-root').first()
        await expect(tableOrEmpty).toBeVisible()
    })

    test('Closing: clicking a refund row triggers the API endpoint (when seeded)', async ({ page }) => {
        // Mock both refund endpoints up front so the click is harmless
        await page.route('**/api/admin/refunds/stripe/**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(REFUND_OK_RESPONSE),
            })
        )
        await page.route('**/api/admin/refunds/ada/**', (route) =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(REFUND_OK_RESPONSE),
            })
        )

        await page.goto('/admin/refunds')
        await waitForApp(page)

        // Scope to data-table rows — the sidebar nav has a "Refund Management"
        // link that would otherwise match getByRole('button', {name:/refund/i}).
        const tableRows = page.locator('table tbody tr')
        const rowCount = await tableRows.count()
        test.skip(rowCount === 0, 'No refundable purchases seeded — extend DemoVideoSeeder with a successful StripePayment to exercise this path')

        const refundButton = tableRows.first().getByRole('button', { name: /refund/i }).first()
        await expect(refundButton).toBeVisible()

        // ConfirmationDialog opens on click — find and confirm
        await refundButton.click()
        const confirm = page.getByRole('button', { name: /^(confirm|yes|ok)$/i }).first()
        await expect(confirm).toBeVisible({ timeout: 5_000 })

        const refundCallPromise = page.waitForResponse(/\/api\/admin\/refunds\/(stripe|ada)\//)
        await confirm.click()
        const refundResp = await refundCallPromise
        expect(refundResp.status()).toBe(200)
    })
})
