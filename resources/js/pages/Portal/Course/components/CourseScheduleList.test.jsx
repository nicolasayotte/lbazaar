import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Hoisted mock values
// ---------------------------------------------------------------------------
const { mockUsePage } = vi.hoisted(() => {
    const mockUsePage = vi.fn()
    return { mockUsePage }
})

// ---------------------------------------------------------------------------
// Module mocks — must be declared before component import
// ---------------------------------------------------------------------------
vi.mock('@inertiajs/inertia-react', () => ({
    usePage: mockUsePage,
    Link: ({ href, children }) => <a href={href}>{children}</a>,
}))

vi.mock('../../../../helpers/routes.helper', () => ({
    getRoute: (name, params) => `/${name}/${params?.id ?? ''}`,
    default: {},
}))

vi.mock('../../../../helpers/currency.helper', () => ({
    formatDualPrice: (jpy, ada) => `¥${jpy} / ${ada} ADA`,
    formatJpy: (jpy) => `¥${jpy}`,
    parseJpy: (price) => price,
}))

vi.mock('../../../../components/common/EmptyCard', () => ({
    default: ({ message }) => <div data-testid="empty-card">{message}</div>,
}))

// ---------------------------------------------------------------------------
// Component import — MUST come after all vi.mock() declarations
// ---------------------------------------------------------------------------
import CourseScheduleList from './CourseScheduleList'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const SCHEDULE_ID = 42

/**
 * Build a minimal schedule row for the list.
 * @param {string} status - 'Upcoming' | 'Ongoing' | 'Done'
 */
function makeScheduleRow(status = 'Upcoming') {
    return {
        id: SCHEDULE_ID,
        status,
        is_cancellable: true,
        is_bookable: false,
        formatted_start_datetime: 'Wednesday Jan 01 2025 10:00 AM JST',
        course_id: 1,
        course: {
            id: 1,
            professor_id: 99,
            is_live: true,
            max_participant: 10,
            price: 5000,
            price_in_ada: 100,
            course_type: {
                type: 'General',
            },
        },
        course_history: [],
    }
}

/**
 * Build minimal auth.user props.
 * @param {boolean} paidWithMoney - whether the user's booking is paid
 */
function makeAuthUser(paidWithMoney = false) {
    return {
        id: 1,
        course_histories: [
            {
                id: 10,
                course_schedule_id: SCHEDULE_ID,
                is_cancelled: false,
                paid_with_money: paidWithMoney,
            },
        ],
        completed_schedules: [],
    }
}

const baseTranslatables = {
    texts: {
        no_schedules_available: 'No schedules available',
        book_class: 'Book Class',
        cancel_class_booking: 'Cancel Booking',
        attend_class: 'Attend',
        complete: 'Completed',
        fully_booked: 'Fully Booked',
        seats_available: 'seats available',
        live: 'Live',
        on_demand: 'On Demand',
        view: 'View',
    },
    title: {
        schedules: { view: 'View Schedule' },
    },
}

function setupPage({ user = null, isLoggedIn = false } = {}) {
    mockUsePage.mockReturnValue({
        props: {
            isLoggedIn,
            translatables: baseTranslatables,
            auth: user ? { user } : { user: null },
        },
    })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('CourseScheduleList — paid vs free cancel button', () => {

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders cancel button for a FREE upcoming booking (paid_with_money: false)', () => {
        const user = makeAuthUser(false)
        setupPage({ user, isLoggedIn: true })

        render(
            <CourseScheduleList
                data={[makeScheduleRow('Upcoming')]}
                handleOnBook={vi.fn()}
                handleOnCancelBook={vi.fn()}
            />
        )

        // The real cancel button should be present
        expect(screen.getByText(baseTranslatables.texts.cancel_class_booking)).toBeTruthy()

        // The admin-refund notice should NOT be present
        expect(screen.queryByText(/Refunds for paid bookings/i)).toBeNull()
    })

    it('renders admin-refund notice for a PAID upcoming booking (paid_with_money: true)', () => {
        const user = makeAuthUser(true)
        setupPage({ user, isLoggedIn: true })

        render(
            <CourseScheduleList
                data={[makeScheduleRow('Upcoming')]}
                handleOnBook={vi.fn()}
                handleOnCancelBook={vi.fn()}
            />
        )

        // The admin-refund notice should be present (disabled button text)
        expect(screen.getByText(/Refunds for paid bookings/i)).toBeTruthy()

        // The standard cancel button should NOT be present
        expect(screen.queryByText(baseTranslatables.texts.cancel_class_booking)).toBeNull()
    })

    it('paid booking admin-refund button is disabled (not clickable)', () => {
        const handleCancel = vi.fn()
        const user = makeAuthUser(true)
        setupPage({ user, isLoggedIn: true })

        render(
            <CourseScheduleList
                data={[makeScheduleRow('Upcoming')]}
                handleOnBook={vi.fn()}
                handleOnCancelBook={handleCancel}
            />
        )

        const refundNotice = screen.getByText(/Refunds for paid bookings/i).closest('button')
        expect(refundNotice).toBeTruthy()
        expect(refundNotice).toBeDisabled()
    })

    it('free booking cancel button calls handleOnCancelBook when clicked', async () => {
        const handleCancel = vi.fn()
        const user = makeAuthUser(false)
        setupPage({ user, isLoggedIn: true })

        const { getByText } = render(
            <CourseScheduleList
                data={[makeScheduleRow('Upcoming')]}
                handleOnBook={vi.fn()}
                handleOnCancelBook={handleCancel}
            />
        )

        getByText(baseTranslatables.texts.cancel_class_booking).closest('button').click()
        expect(handleCancel).toHaveBeenCalledWith(SCHEDULE_ID)
    })

    it('shows no cancel UI for past (Done) booking regardless of paid status', () => {
        const user = makeAuthUser(false)
        setupPage({ user, isLoggedIn: true })

        render(
            <CourseScheduleList
                data={[makeScheduleRow('Done')]}
                handleOnBook={vi.fn()}
                handleOnCancelBook={vi.fn()}
            />
        )

        expect(screen.queryByText(baseTranslatables.texts.cancel_class_booking)).toBeNull()
        expect(screen.queryByText(/Refunds for paid bookings/i)).toBeNull()
    })

})
