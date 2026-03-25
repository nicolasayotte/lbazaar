// @ts-check
import { test, expect } from '@playwright/test'
import { waitForApp } from '../helpers/wait-for-app.js'
import path from 'path'

const MOCK_WALLET_PATH = path.resolve(__dirname, '../helpers/mock-cip30-wallet.js')

// ── Shared mock responses for backend endpoints that call Node.js scripts ──

/** POST /wallet/info — normally calls `node run/wallet-info.mjs` */
const WALLET_INFO_RESPONSE = JSON.stringify({
    accountAmt: '50000000',
    changeAddrBech32: 'addr_test1qr5xvq9jr0k8gku354pxn3u9cx4vq7qqcfaam2nfeq20xv',
    stakeKeyAddr: 'e0b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c',
    stakeAddrBech32: 'stake_test1uzctml7jksd2kf5gvxr9g7pew8xevl72aclr3ag43',
    stakeKeyHash: 'b0b7dfe4ad81ab53d08c0c65a2e14e6e5a67f2ae3f8e9a2b1c',
    verified: false,
})

/** POST /wallet/verify — normally calls `node run/wallet-verify.mjs` */
const WALLET_VERIFY_RESPONSE = JSON.stringify({ status: 200 })

// POST /wallet/build-mint-tx — backend builds tx, owner-signs, returns CBOR
const BUILD_MINT_TX_RESPONSE = {
    success: true,
    cborTx: 'a0'.repeat(128), // placeholder CBOR
    nftName: 'Certificate-1-1',
    serialNum: '1234567890',
    mph: 'aabb'.repeat(14),
}

// ── Helpers ─────────────────────────────────────────────────────────────

/**
 * Inject mock CIP-30 wallet and intercept backend wallet endpoints.
 * Call before navigating to any page that renders WalletConnector.
 */
async function setupWalletMocks(page) {
    // Inject mock window.cardano.eternl before any page JS runs
    await page.addInitScript({ path: MOCK_WALLET_PATH })

    // Intercept POST /wallet/info (calls node wallet-info.mjs on server)
    await page.route('**/wallet/info', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(WALLET_INFO_RESPONSE),
        })
    })
}

// ── Tests ───────────────────────────────────────────────────────────────

test.describe('CIP-30 Wallet (mock Eternl)', () => {
    test.use({ storageState: 'tests/Browser/fixtures/student.json' })

    test('connect wallet — shows balance and stake key', async ({ page }) => {
        await setupWalletMocks(page)

        await page.goto('/mypage/profile')
        await waitForApp(page)

        // Click the Eternl wallet button to connect
        await page.getByRole('button', { name: 'eternl' }).click()

        // Wait for wallet info to load (balance display)
        await expect(page.getByText('₳')).toBeVisible({ timeout: 10_000 })

        // Stake key display should appear (first6...last6 format)
        await expect(page.getByText(/b0b7df\.\.\.9a2b1c/)).toBeVisible()
    })

    test('verify wallet ownership — signature flow', async ({ page }) => {
        await setupWalletMocks(page)

        // Also intercept POST /wallet/verify
        await page.route('**/wallet/verify', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(WALLET_VERIFY_RESPONSE),
            })
        })

        await page.goto('/mypage/profile')
        await waitForApp(page)

        // Connect wallet first
        await page.getByRole('button', { name: 'eternl' }).click()
        await expect(page.getByText('₳')).toBeVisible({ timeout: 10_000 })

        // Click the verify button (TaskAltIcon — the checkmark icon button)
        const verifyButton = page.locator('button').filter({ has: page.locator('[data-testid="TaskAltIcon"]') })
        await verifyButton.click()

        // The verify icon should change from disabled to enabled (colored).
        await expect(
            page.locator('[data-testid="TaskAltIcon"]').first()
        ).not.toHaveAttribute('color', 'disabled', { timeout: 5_000 })
    })

    test('mint reward via CIP-30 — double-signed certificate', async ({ page }) => {
        await setupWalletMocks(page)

        // Intercept build-mint-tx (backend builds + owner-signs tx)
        await page.route('**/wallet/build-mint-tx', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(BUILD_MINT_TX_RESPONSE),
            })
        })

        // Intercept submit-mint-tx (server merges witnesses and submits to chain)
        await page.route('**/wallet/submit-mint-tx', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ success: true, tx_hash: '00'.repeat(32) }),
            })
        })

        await page.goto('/mypage/certificates')
        await waitForApp(page)

        // Connect wallet on the certificates page
        await page.getByRole('button', { name: 'eternl' }).click()
        await expect(page.getByText('₳')).toBeVisible({ timeout: 10_000 })

        // Find and click the Mint button
        const mintButton = page.getByRole('button', { name: /mint/i })
        await expect(mintButton.first()).toBeVisible({ timeout: 10_000 })
        await mintButton.first().click()

        // The CIP-30 flow: build-mint-tx → signTx → submitTx → self-mint
        // On success the page reloads. Wait for it.
        await page.waitForLoadState('load', { timeout: 15_000 })
    })
})
