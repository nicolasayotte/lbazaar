// @ts-check

/** Credentials for Playwright test users (created by PlaywrightTestSeeder) */
export const TEST_USERS = {
    student: {
        email: 'pw-student@example.com',
        password: 'Test1234!',
    },
    teacher: {
        email: 'pw-teacher@example.com',
        password: 'Test1234!',
    },
    admin: {
        email: 'pw-admin@example.com',
        password: 'Test1234!',
    },
};

/** Paths where Playwright stores auth session cookies (gitignored) */
export const STORAGE_STATE = {
    student: 'tests/Browser/fixtures/student.json',
    teacher: 'tests/Browser/fixtures/teacher.json',
    admin: 'tests/Browser/fixtures/admin.json',
};
