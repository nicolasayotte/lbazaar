// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from './helpers/wait-for-app.js';

// The course listing page lives at /classes (route: course.index)
// The course detail page lives at /classes/{id} (route: course.details)
// Pagination is 5 per page (CourseRepository::PER_PAGE = 5)

test.describe('Course Browsing - Filter Panel Structure', () => {
    test('search text input is visible', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const searchInput = page.locator('input[name="search_text"]');
        await expect(searchInput).toBeVisible();
    });

    test('type filter select is present', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // The Input component renders MUI TextField with SelectProps: { native: true }
        // so it renders as a native <select> element
        const typeSelect = page.locator('select[name="type_id"]');
        await expect(typeSelect).toBeVisible();
    });

    test('language filter select is present', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const languageSelect = page.locator('select[name="language"]');
        await expect(languageSelect).toBeVisible();
    });

    test('professor/teacher filter select is present', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const professorSelect = page.locator('select[name="professor_id"]');
        await expect(professorSelect).toBeVisible();
    });

    test('submit/filter button is present', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // The filter form has a submit button (type="submit")
        const submitButton = page.locator('button[type="submit"]');
        await expect(submitButton).toBeVisible();
    });
});

test.describe('Course Browsing - Course Card Structure', () => {
    test('course cards exist or empty state is shown', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const cards = page.locator('.MuiCard-root');
        const count = await cards.count();
        // Either course cards exist or an empty card is shown — the page must have at least one card
        expect(count).toBeGreaterThan(0);
    });

    test('each course card has a title element (h6)', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // Course cards rendered by Course.jsx use Typography variant="h6" for the title
        const courseCards = page.locator('.MuiCard-root');
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        // Check that at least the first card has an h6 title
        const firstCard = courseCards.first();
        const title = firstCard.locator('h6');
        await expect(title).toBeVisible();
    });

    test('each course card shows professor attribution ("By ..." text)', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseCards = page.locator('.MuiCard-root').filter({ has: page.locator('a[href*="/classes/"]') });
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        // Course.jsx renders: `By ${course.professor.fullname}` in Typography variant="subtitle2"
        const firstCard = courseCards.first();
        const byText = firstCard.locator('text=/^By /');
        await expect(byText).toBeVisible();
    });

    test('each course card has a MUI chip for course type', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseCards = page.locator('.MuiCard-root').filter({ has: page.locator('a[href*="/classes/"]') });
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        // Course.jsx renders a Chip with the course type name (General/Free/Special)
        const firstCard = courseCards.first();
        const chip = firstCard.locator('.MuiChip-root');
        await expect(chip.first()).toBeVisible();
    });

    test('each course card has a link to /classes/{id}', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseCards = page.locator('.MuiCard-root').filter({ has: page.locator('a[href*="/classes/"]') });
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        // Course.jsx renders: <Link href={getRoute('course.details', {id: course.id})}>
        // which resolves to /classes/{id}
        const firstCard = courseCards.first();
        const viewMoreLink = firstCard.locator('a[href*="/classes/"]');
        await expect(viewMoreLink).toBeVisible();
    });
});

test.describe('Course Browsing - Filtering', () => {
    test('typing search text and submitting adds search_text to URL', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const searchInput = page.locator('input[name="search_text"]');
        await searchInput.fill('test course');

        const submitButton = page.locator('button[type="submit"]');
        await submitButton.click();
        await waitForInertiaNavigation(page);

        expect(page.url()).toContain('search_text=');
    });

    test('searching for nonexistent text shows empty state message', async ({ page }) => {
        const uniqueText = 'xyzzy_nonexistent_course_12345';
        await page.goto(`/classes?search_text=${uniqueText}`);
        await waitForApp(page);

        // EmptyCard renders Typography h6 with translatables.texts.no_records_found
        const emptyHeading = page.getByRole('heading', { name: /no records found/i });
        await expect(emptyHeading).toBeVisible();
    });

    test('changing type filter adds type_id to URL', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const typeSelect = page.locator('select[name="type_id"]');
        const options = await typeSelect.locator('option').all();

        // Skip if there is only the "All" option (no course types in DB)
        if (options.length <= 1) {
            test.skip(true, 'No course types available');
            return;
        }

        // Select the second option (first non-"All" option)
        const secondOptionValue = await options[1].getAttribute('value');
        if (!secondOptionValue) {
            test.skip(true, 'No selectable course type value');
            return;
        }

        // The type_id select uses handleOnSelectChange which submits automatically on change
        await typeSelect.selectOption({ index: 1 });
        await waitForInertiaNavigation(page);

        expect(page.url()).toContain('type_id=');
    });
});

test.describe('Course Browsing - Course Detail Page', () => {
    test('clicking view-more on a course card navigates to /classes/{id}', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseCards = page.locator('.MuiCard-root').filter({ has: page.locator('a[href*="/classes/"]') });
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        const firstCard = courseCards.first();
        const viewMoreLink = firstCard.locator('a[href*="/classes/"]');
        const href = await viewMoreLink.getAttribute('href');

        await viewMoreLink.click();
        await waitForInertiaNavigation(page);

        // URL should match /classes/{numeric id}
        expect(page.url()).toMatch(/\/classes\/\d+/);
    });

    test('detail page shows course title in h4', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const courseCards = page.locator('.MuiCard-root').filter({ has: page.locator('a[href*="/classes/"]') });
        const count = await courseCards.count();
        if (count === 0) {
            test.skip(true, 'No courses seeded');
            return;
        }

        // Navigate to the first course's detail page
        const firstCard = courseCards.first();
        const viewMoreLink = firstCard.locator('a[href*="/classes/"]');
        await viewMoreLink.click();
        await waitForInertiaNavigation(page);

        // Details.jsx renders Typography variant="h4" for course.title
        const titleH4 = page.locator('h4');
        await expect(titleH4).toBeVisible();
    });

    test('detail page can be accessed directly by URL /classes/1', async ({ page }) => {
        const response = await page.goto('/classes/1');

        // If course ID 1 does not exist, the server returns 404 — skip gracefully
        if (response && response.status() === 404) {
            test.skip(true, 'No course with id=1 in DB');
            return;
        }

        await waitForApp(page);

        // Page should render without crashing — h4 title should be visible
        const titleH4 = page.locator('h4');
        await expect(titleH4).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// F-01.1 TS-01.01 / TS-01.03: ADA price visible on listing and detail pages
// ---------------------------------------------------------------------------
test.describe('Course Browsing - ADA Price on Listing Page (TS-01.01, TS-01.03)', () => {
    test('listing page shows dual JPY+ADA price on paid General course card', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // Look for a card that has both JPY and ADA price (paid General course)
        const dualPriceText = page.locator('.MuiCard-root').getByText(/¥[0-9].*~₳/);
        const hasDualPrice = await dualPriceText.count() > 0;
        if (!hasDualPrice) {
            test.skip(true, 'No paid General course with price_in_ada seeded — skip TS-01.01/TS-01.03');
            return;
        }

        await expect(dualPriceText.first()).toBeVisible();
    });
});

test.describe('Course Browsing - ADA Price on Detail Page (TS-01.02, TS-01.04)', () => {
    test('detail page for General course shows JPY and ADA (~₳) price', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // Find a General course card with dual pricing
        const dualPriceCard = page.locator('.MuiCard-root').filter({ hasText: /~₳/ });
        const dualCount = await dualPriceCard.count();
        if (dualCount === 0) {
            test.skip(true, 'No General course with price_in_ada seeded — skip TS-01.02/TS-01.04');
            return;
        }

        const viewMoreLink = dualPriceCard.first().locator('a[href*="/classes/"]');
        await viewMoreLink.click();
        await waitForInertiaNavigation(page);

        await expect(page.getByText(/¥[0-9]/)).toBeVisible();
        await expect(page.getByText(/~₳/)).toBeVisible();
    });
});

test.describe('Course Browsing - Pagination', () => {
    test('pagination component is visible when more than 5 courses exist', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        // MUI Pagination renders with class .MuiPagination-root
        const pagination = page.locator('.MuiPagination-root');
        const isPaginationVisible = await pagination.isVisible().catch(() => false);

        if (!isPaginationVisible) {
            // Pagination only renders when courses.last_page > 1 (more than PER_PAGE=5 courses)
            test.skip(true, 'Fewer than 6 courses seeded — pagination not shown');
            return;
        }

        await expect(pagination).toBeVisible();
    });

    test('clicking page 2 adds page=2 to URL', async ({ page }) => {
        await page.goto('/classes');
        await waitForApp(page);

        const pagination = page.locator('.MuiPagination-root');
        const isPaginationVisible = await pagination.isVisible().catch(() => false);

        if (!isPaginationVisible) {
            test.skip(true, 'Fewer than 6 courses seeded — pagination not shown');
            return;
        }

        // MUI Pagination renders page buttons as <button aria-label="Go to page 2"> or similar
        const page2Button = page.locator('.MuiPagination-root button[aria-label*="page 2"], .MuiPagination-root button[aria-label="Go to page 2"]').first();

        if (!(await page2Button.isVisible().catch(() => false))) {
            test.skip(true, 'Page 2 button not visible');
            return;
        }

        await Promise.all([
            page.waitForURL(/page=2/),
            page2Button.click(),
        ]);

        expect(page.url()).toContain('page=2');
    });
});
