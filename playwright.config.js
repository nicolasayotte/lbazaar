import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/Browser',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : 2,
    reporter: 'html',
    use: {
        baseURL: process.env.APP_URL || 'http://localhost:8080',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        // Setup projects — run auth login and save storageState
        {
            name: 'student-setup',
            testMatch: '**/auth/student.setup.js',
        },
        {
            name: 'teacher-setup',
            testMatch: '**/auth/teacher.setup.js',
        },
        // Unauthenticated tests — no storageState needed
        {
            name: 'unauthenticated',
            testMatch: ['**/top-page.spec.js', '**/course-browsing.spec.js'],
            use: { browserName: 'chromium' },
        },
        // Authenticated tests — depend on setup projects
        {
            name: 'student',
            testMatch: '**/auth/**/*.spec.js',
            use: {
                browserName: 'chromium',
                storageState: 'tests/Browser/fixtures/student.json',
            },
            dependencies: ['student-setup'],
        },
        {
            name: 'teacher',
            testMatch: [],  // reserved for future teacher-specific tests
            use: {
                browserName: 'chromium',
                storageState: 'tests/Browser/fixtures/teacher.json',
            },
            dependencies: ['teacher-setup'],
        },
    ],
});
