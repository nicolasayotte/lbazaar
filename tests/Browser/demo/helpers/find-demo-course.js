// @ts-check
import { waitForApp } from '../../helpers/wait-for-app.js'

/**
 * Resolve a demo course's numeric ID by searching the public listing for its
 * title and reading the first matching `/classes/{id}` link.
 *
 * Returns null when the course is not found (test should `test.skip`).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} courseTitle exact title from DemoVideoSeeder (e.g. "Demo ADA Course")
 * @returns {Promise<string | null>}
 */
export async function findDemoCourseId(page, courseTitle) {
    await page.goto(`/classes?search_text=${encodeURIComponent(courseTitle)}`)
    await waitForApp(page)

    const cards = page.locator('.MuiCard-root').filter({ hasText: courseTitle })
    const count = await cards.count()
    if (count === 0) return null

    const link = cards.first().locator('a[href*="/classes/"]').first()
    const href = await link.getAttribute('href')
    const match = href && href.match(/\/classes\/(\d+)/)
    return match ? match[1] : null
}
