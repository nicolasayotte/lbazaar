import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Override global vitest.setup.js usePage mock with richer translatables
vi.mock('@inertiajs/inertia-react', () => ({
    usePage: () => ({
        props: {
            translatables: {
                texts: {
                    view_more: 'View More',
                    package: 'Package',
                    ada_unavailable: 'ADA price unavailable',
                },
            },
        },
    }),
    Link: ({ children, href }) => <a href={href}>{children}</a>,
}));

vi.mock('../../helpers/routes.helper', () => ({
    getRoute: (_name, params) => `/classes/${params?.id ?? ''}`,
}));

import Course from './Course';

const makeGeneralCourse = (overrides = {}) => ({
    id: 1,
    title: 'Japanese for Beginners',
    price: '¥1,000',
    price_in_ada: 20.00,
    raw_description: 'Learn Japanese from scratch.',
    image_thumbnail: null,
    course_type: { name: 'General' },
    professor: { fullname: 'Tanaka Sensei' },
    categories: [],
    course_package: null,
    ...overrides,
});

// ---------------------------------------------------------------------------
// TS-01.01 / TS-01.03: ADA price visible on course card listing
// ---------------------------------------------------------------------------
describe('Course card — ADA price display (TS-01.01, TS-01.03)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('TS-01.01: shows JPY price on General course card', () => {
        render(<Course course={makeGeneralCourse()} />);
        expect(screen.getByText(/¥1,000/)).toBeInTheDocument();
    });

    it('TS-01.03: shows ADA equivalent with live-conversion indicator (~₳) when price_in_ada is set', () => {
        render(<Course course={makeGeneralCourse()} />);
        expect(screen.getByText(/~₳20\.00/)).toBeInTheDocument();
    });

    it('hides ADA portion when price_in_ada is null (conversion unavailable)', () => {
        render(<Course course={makeGeneralCourse({ price_in_ada: null })} />);

        expect(screen.getByText(/¥1,000/)).toBeInTheDocument();
        expect(screen.queryByText(/~₳/)).not.toBeInTheDocument();
        expect(screen.getByText(/ADA price unavailable/i)).toBeInTheDocument();
    });

    it('hides price entirely for Free courses (course_type.name !== General)', () => {
        render(<Course course={makeGeneralCourse({ course_type: { name: 'Free' }, price: null, price_in_ada: null })} />);

        expect(screen.queryByText(/¥/)).not.toBeInTheDocument();
        expect(screen.queryByText(/~₳/)).not.toBeInTheDocument();
    });

    it('hides price for General course with no price set', () => {
        render(<Course course={makeGeneralCourse({ price: null, price_in_ada: null })} />);

        expect(screen.queryByText(/~₳/)).not.toBeInTheDocument();
    });
});
