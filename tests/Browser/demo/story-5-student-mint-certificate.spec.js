// @ts-check
import { test, expect } from '@playwright/test'
import path from 'path'
import { LoginPage } from '../pages/LoginPage.js'
import { waitForApp } from '../helpers/wait-for-app.js'
import { DEMO_USERS, DEMO_COURSES } from './helpers/demo-users.js'

/**
 * Milestone 4 — Story 5: Student Receives NFT Certificate on Completion
 *
 * The Demo Reward Course is seeded as completed for demo-student with both
 * certificate_status='eligible' and token_reward_status='eligible'. This spec
 * walks the CIP-30 self-mint flow:
 *
 *   wallet connect → /wallet/build-mint-tx → walletAPI.signTx →
 *   /wallet/submit-mint-tx → page reload
 *
 * Stubs: mock CIP-30 wallet, both /wallet/* mint endpoints. The submit
 * response triggers `window.location.reload()` in RewardsTable; we just wait
 * for the reload to complete and confirm both backend calls fired.
 *
 * Pre-req: `sail artisan db:seed --class=DemoVideoSeeder`.
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

const BUILD_MINT_TX_RESPONSE = {
    success: true,
    cborTx: 'a0'.repeat(128),
    nftName: 'SmartContractDeveloperCert-1',
    serialNum: '1',
    mph: 'aabb'.repeat(14),
}

const SUBMIT_MINT_TX_RESPONSE = {
    success: true,
    tx_hash: '00'.repeat(32),
    explorer_url: 'https://preprod.cardanoscan.io/transaction/' + '00'.repeat(32),
}

async function setupMintMocks(page) {
    await page.addInitScript({ path: MOCK_WALLET_PATH })

    await page.route('**/wallet/info', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(JSON.stringify(WALLET_INFO_RESPONSE)),
        })
    )

    await page.route('**/wallet/build-mint-tx', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(BUILD_MINT_TX_RESPONSE),
        })
    )

    await page.route('**/wallet/submit-mint-tx', (route) =>
        route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(SUBMIT_MINT_TX_RESPONSE),
        })
    )
}

test.describe('Demo Story 5 — Student mints NFT certificate', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test.beforeEach(async ({ page }) => {
        const login = new LoginPage(page)
        await login.goto()
        await login.loginAndWaitForRedirect(DEMO_USERS.student.email, DEMO_USERS.student.password)
    })

    test('Story 5: Mint button triggers double-signed CIP-30 mint flow', async ({ page }) => {
        await setupMintMocks(page)

        await page.goto('/mypage/certificates')
        await waitForApp(page)

        // Demo Reward Course row is visible in the rewards table
        await expect(page.getByText(DEMO_COURSES.reward).first()).toBeVisible()

        // Connect Eternl wallet (mock)
        await page.getByRole('button', { name: 'eternl' }).click()
        await expect(page.getByText('₳').first()).toBeVisible({ timeout: 10_000 })

        // The certificate row's Mint button — track both backend calls
        const buildPromise  = page.waitForResponse('**/wallet/build-mint-tx')
        const submitPromise = page.waitForResponse('**/wallet/submit-mint-tx')

        const mintButton = page.getByRole('button', { name: /^Mint$/i }).first()
        await expect(mintButton).toBeVisible()
        await mintButton.click()

        const buildResp = await buildPromise
        expect(buildResp.status()).toBe(200)
        const submitResp = await submitPromise
        expect(submitResp.status()).toBe(200)

        // Page reloads on success — the URL stays at /mypage/certificates
        await page.waitForLoadState('load', { timeout: 15_000 })
        await expect(page).toHaveURL(/\/mypage\/certificates/)
    })
})
