// @ts-check

/**
 * Credentials for the Milestone 4 demo accounts.
 * Created by `sail artisan db:seed --class=DemoVideoSeeder`.
 *
 * Tests in tests/Browser/demo/ assume these accounts exist.
 */
export const DEMO_USERS = {
    student: {
        email: 'demo-student@lebazaar.com',
        password: 'Demo1234!',
    },
    teacher: {
        email: 'demo-teacher@lebazaar.com',
        password: 'Demo1234!',
    },
    admin: {
        email: 'demo-admin@lebazaar.com',
        password: 'Demo1234!',
    },
};

/** Course titles used by DemoVideoSeeder. */
export const DEMO_COURSES = {
    ada:     'Demo ADA Course',
    stripe:  'Demo Stripe Course',
    reward:  'Demo Reward Course',
};
