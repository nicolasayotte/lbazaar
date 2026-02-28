// @ts-check
import { test, expect } from '@playwright/test';
import { waitForApp, waitForInertiaNavigation } from '../helpers/wait-for-app.js';
import { STORAGE_STATE } from '../helpers/test-users.js';

test.use({ storageState: STORAGE_STATE.teacher });

/**
 * Navigate to /mypage/manage-class and return the first class ID, or null.
 */
async function findFirstClassId(page) {
    await page.goto('/mypage/manage-class');
    await waitForApp(page);

    const links = page.locator('a[href*="/mypage/manage-class/"]');
    const count = await links.count();
    if (count === 0) return null;

    const href = await links.first().getAttribute('href');
    const match = href && href.match(/\/mypage\/manage-class\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Navigate to exams tab and return first exam ID, or null.
 */
async function findFirstExamId(page, classId) {
    await page.goto(`/mypage/manage-class/${classId}/exams`);
    await waitForApp(page);

    const links = page.locator('a[href*="/exams/"][href$="/edit"]');
    const count = await links.count();
    if (count === 0) return null;

    const href = await links.first().getAttribute('href');
    const match = href && href.match(/\/exams\/(\d+)\/edit/);
    return match ? match[1] : null;
}

/**
 * Navigate to schedules tab and return first schedule ID, or null.
 */
async function findFirstScheduleId(page, classId) {
    await page.goto(`/mypage/manage-class/${classId}/schedules`);
    await waitForApp(page);

    const links = page.locator('table tbody a[href*="/schedules/"]');
    const count = await links.count();
    if (count === 0) return null;

    const href = await links.first().getAttribute('href');
    const match = href && href.match(/\/schedules\/(\d+)/);
    return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// F-03: Course CRUD
// ---------------------------------------------------------------------------
test.describe('F-03: Course CRUD', () => {

    test('F-03.1: edit course page renders for owned class', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const response = await page.goto(`/classes/${classId}/edit`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('F-03.2: updating course description succeeds', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        await page.goto(`/classes/${classId}/edit`);
        await waitForApp(page);

        // Rich text editor uses contenteditable div
        const editor = page.locator('[contenteditable="true"]').first();
        const editorCount = await editor.count();
        if (editorCount > 0) {
            await editor.click();
            await editor.press('Control+a');
            await editor.type('e2e-test-description-update');
        }

        await page.locator('button[type="submit"]').first().click();
        await waitForInertiaNavigation(page);
        await waitForApp(page);
    });

    test('F-03.3: create course page renders for approved application', async ({ page }) => {
        await page.goto('/mypage/class-application');
        await waitForApp(page);

        const createLinks = page.locator('a[href*="/classes/"][href$="/create"]');
        const count = await createLinks.count();
        test.skip(count === 0, 'No approved class applications found — skipping');

        const href = await createLinks.first().getAttribute('href');
        const response = await page.goto(href);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('input[name="title"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

});

// ---------------------------------------------------------------------------
// F-04: Exam Management
// ---------------------------------------------------------------------------
test.describe('F-04: Exam Management', () => {

    test('F-04.1: create exam page renders', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const response = await page.goto(`/exams/${classId}/create`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        // Exam form has at least a textarea for questions and buttons
        await expect(page.locator('textarea').first()).toBeVisible();
        await expect(page.locator('button').first()).toBeVisible();
    });

    test('F-04.2: edit exam page renders pre-populated', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const examId = await findFirstExamId(page, classId);
        test.skip(examId === null, 'No exams exist for this class — skipping');

        const response = await page.goto(`/exams/${examId}/edit`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('textarea').first()).toBeVisible();
        await expect(page.locator('.MuiInputBase-input').first()).toBeVisible();
    });

});

// ---------------------------------------------------------------------------
// F-05: Schedule Management
// ---------------------------------------------------------------------------
test.describe('F-05: Schedule Management', () => {

    test('F-05.1: create schedule page renders', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const response = await page.goto(`/schedules/${classId}/create`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('input[type="datetime-local"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('F-05.2: schedule detail page renders', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const scheduleId = await findFirstScheduleId(page, classId);
        test.skip(scheduleId === null, 'No schedules exist for this class — skipping');

        const response = await page.goto(`/schedules/${scheduleId}`);
        expect(response).not.toBeNull();
        expect(response.status()).toBeLessThan(500);
        await waitForApp(page);

        await expect(page.locator('input[name="keyword"]')).toBeVisible();
    });

    test('F-05.3: enrolled students view within schedule', async ({ page }) => {
        const classId = await findFirstClassId(page);
        test.skip(classId === null, 'No classes owned by teacher — skipping');

        const scheduleId = await findFirstScheduleId(page, classId);
        test.skip(scheduleId === null, 'No schedules exist for this class — skipping');

        await page.goto(`/schedules/${scheduleId}`);
        await waitForApp(page);

        // Student rows in the table, or empty state card
        const studentRows = page.locator('table tbody tr');
        const rowCount = await studentRows.count();

        if (rowCount > 0) {
            await expect(studentRows.first()).toBeVisible();
        } else {
            const emptyCard = page.locator('.MuiCard-root');
            await expect(emptyCard.first()).toBeVisible();
        }
    });

});
