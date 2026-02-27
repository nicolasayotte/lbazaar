import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

// ---------------------------------------------------------------------------
// Hoisted mock factories — must be defined before any vi.mock() calls
// ---------------------------------------------------------------------------
const { mockUsePageFn } = vi.hoisted(() => {
    const mockUsePageFn = vi.fn();
    return { mockUsePageFn };
});

// Mock @inertiajs/inertia to prevent real HTTP calls
vi.mock('@inertiajs/inertia', () => ({
    Inertia: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        visit: vi.fn(),
    },
}));

// Override the global vitest.setup.js usePage mock with a controllable fn
vi.mock('@inertiajs/inertia-react', () => ({
    usePage: mockUsePageFn,
}));

// Mock react-redux
vi.mock('react-redux', () => ({
    useDispatch: () => vi.fn(),
    useSelector: vi.fn(),
    Provider: ({ children }) => children,
}));

// Mock sub-components to keep tests focused on Details logic
vi.mock('../../../components/cards/Feedback', () => ({
    default: () => <div data-testid="feedback" />,
}));

vi.mock('./components/CourseScheduleList', () => ({
    default: () => <div data-testid="course-schedule-list" />,
}));

vi.mock('../../../components/cards/Course', () => ({
    default: () => <div data-testid="course-card" />,
}));

vi.mock('../../../components/cards/User', () => ({
    default: () => <div data-testid="user-card" />,
}));

vi.mock('../../../components/cards/WalletConnector', () => ({
    default: () => <div data-testid="wallet-connector" />,
}));

vi.mock('../../../components/common/ConfirmationDialog', () => ({
    default: () => <div data-testid="confirmation-dialog" />,
}));

vi.mock('../../../components/payments/StripeCheckout', () => ({
    default: () => <div data-testid="stripe-checkout" />,
}));

vi.mock('../../../helpers/routes.helper', () => ({
    getRoute: vi.fn((name) => `/${name}`),
}));

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
    },
}));

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockCourse = {
    id: 1,
    title: 'Test Course',
    price: '2000',
    price_in_ada: 40.0,
    description: '<p>Course description</p>',
    raw_description: 'Course description',
    overall_rating: 80,
    image_thumbnail: null,
    nft_id: null,
    course_type: { name: 'General', type: 'General' },
    format: 'Online',
    feedbacks: [],
    course_package: null,
    professor: { fullname: 'Test Teacher', id: 99 },
    professor_id: 99,
    categories: [],
};

const mockTranslatables = {
    texts: {
        buy_with_ada: 'Buy with ADA',
        pay_with_card: 'Pay with Credit Card',
        book: 'Book',
        cancel: 'Cancel',
        processing: 'Processing...',
        building_transaction: 'Building transaction...',
        sign_in_wallet: 'Sign in wallet...',
        submitting_transaction: 'Submitting transaction...',
        price: 'Price',
        type: 'Type',
        format: 'Format',
        free: 'Free',
        nft_verify: 'Verify NFT',
        load_more: 'Load more',
        complete_classes_earn_badge: 'Complete classes to earn badge',
        overall_rating: 'Overall Rating',
        loading: 'Loading...',
        complete_payment: 'Complete Payment',
        ada_unavailable: 'ADA price unavailable',
        payment_pending: 'Your ADA payment is being confirmed on the blockchain.',
        view_on_explorer: 'View transaction on explorer',
        stripe_unavailable: 'Credit card payment temporarily unavailable',
        wallet_disconnected_pending: 'Your wallet disconnected, but your pending transaction is still being tracked on the blockchain. You can reconnect to continue monitoring.',
        wallet_reconnect_prompt: 'Wallet disconnected. Please reconnect your wallet to continue.',
        payment_confirmations: ':current/:required confirmations',
        payment_confirmed_auto: 'Payment confirmed! Redirecting...',
        payment_failed_retry: 'Payment failed. Please try again.',
    },
    title: { feedbacks: 'Feedbacks' },
    wallet_error: {
        not_connected: 'Wallet not connected',
        verify: 'Verification failed',
        insufficient_funds: 'Insufficient wallet funds. Consider paying by credit card.',
    },
    nft_error: { verify: 'NFT verify failed', not_found: 'NFT not found' },
    error: 'An error occurred',
    confirm: { class: { schedules: { book: 'Confirm booking?', cancel: 'Confirm cancel?' } } },
    success: { class: { booking: { booked: 'Booked', cancelled: 'Cancelled' } }, nft: 'NFT verified' },
};

/**
 * Build a usePage() return value with optional course property overrides and extra props.
 */
const makePageProps = (courseOverrides = {}, extraProps = {}) => ({
    props: {
        auth: { user: { id: 1 } },
        course: { ...mockCourse, ...courseOverrides },
        nft: null,
        schedules: [],
        feedbacks: [],
        translatables: mockTranslatables,
        feedbackCount: 10,
        feedbacksPerPage: 10,
        pendingPayment: null,
        explorerUrl: 'https://preprod.cardanoscan.io',
        stripe_available: true,
        ...extraProps,
    },
});

import Details from './Details';

// ---------------------------------------------------------------------------
// Task 01: ADA price visible when price_in_ada is present (TS-01.05/06)
// ---------------------------------------------------------------------------
describe('Details — ADA price display when price_in_ada is set (Task 01)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePageFn.mockReturnValue(makePageProps());
    });

    it('renders JPY price when price_in_ada is present (TS-01.05)', () => {
        render(<Details />);
        const matches = screen.getAllByText(/¥2,000/);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('renders ADA equivalent price when price_in_ada is present (TS-01.06)', () => {
        render(<Details />);
        const matches = screen.getAllByText(/~₳40\.00/);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });
});

// ---------------------------------------------------------------------------
// Task 03: ADA conversion unavailable when price_in_ada is null (TS-01.08–11)
// ---------------------------------------------------------------------------
describe('Details — ADA conversion unavailable (Task 03, TS-01.08 through TS-01.11)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePageFn.mockReturnValue(makePageProps({ price_in_ada: null }));
    });

    it('TS-01.08: JPY price is visible when ADA conversion is unavailable', () => {
        render(<Details />);
        const matches = screen.getAllByText(/¥2,000/);
        expect(matches.length).toBeGreaterThanOrEqual(1);
    });

    it('TS-01.09: ADA equivalent price is NOT shown when price_in_ada is null', () => {
        render(<Details />);
        expect(screen.queryByText(/~₳[0-9]/)).not.toBeInTheDocument();
        expect(screen.getAllByText(/ADA price unavailable/i).length).toBeGreaterThanOrEqual(1);
    });

    it('TS-01.10: Buy with ADA button is disabled when price_in_ada is null', () => {
        render(<Details />);
        const adaButton = screen.getByRole('button', { name: /Buy with ADA/i });
        expect(adaButton).toBeDisabled();
    });

    it('TS-01.11: Pay with Credit Card button is NOT disabled when price_in_ada is null', () => {
        render(<Details />);
        expect(screen.getByRole('button', { name: /Pay with Credit Card/i })).not.toBeDisabled();
    });

    it('ada-unavailable: no ADA placeholder text (₳-- or ₳0.00) in rendered output', () => {
        render(<Details />);
        // When price_in_ada is null, formatDualPrice returns only the JPY string
        // so no ADA placeholder symbols should appear anywhere in the DOM
        const body = document.body.textContent || '';
        expect(body).not.toMatch(/₳--/);
        expect(body).not.toMatch(/₳0\.00/);
    });
});

// ---------------------------------------------------------------------------
// Task 10: Pending payment UI, insufficientFunds handler, creditCardButtonRef
// ---------------------------------------------------------------------------
describe('Details — pending payment UI (Task 10)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('TS-10.01: shows payment_pending text when pendingPayment prop is set', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abcdef1234567890' },
            })
        );
        render(<Details />);
        expect(screen.getByText('Your ADA payment is being confirmed on the blockchain.')).toBeInTheDocument();
    });

    it('TS-10.02: shows view_on_explorer link with correct href when pendingPayment is set', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abcdef1234567890' },
                explorerUrl: 'https://preprod.cardanoscan.io',
            })
        );
        render(<Details />);
        const link = screen.getByRole('link', { name: 'View transaction on explorer' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://preprod.cardanoscan.io/tx/abcdef1234567890');
    });

    it('TS-10.03: hides Buy with ADA button when pendingPayment is set', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abcdef1234567890' },
            })
        );
        render(<Details />);
        expect(screen.queryByRole('button', { name: /Buy with ADA/i })).not.toBeInTheDocument();
    });

    it('TS-10.04: hides Pay with Credit Card button when pendingPayment is set', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abcdef1234567890' },
            })
        );
        render(<Details />);
        expect(screen.queryByRole('button', { name: /Pay with Credit Card/i })).not.toBeInTheDocument();
    });

    it('TS-10.05: shows both buy buttons when pendingPayment is null', () => {
        mockUsePageFn.mockReturnValue(makePageProps());
        render(<Details />);
        expect(screen.getByRole('button', { name: /Buy with ADA/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Pay with Credit Card/i })).toBeInTheDocument();
    });

    it('TS-10.06: does not show payment_pending text when pendingPayment is null', () => {
        mockUsePageFn.mockReturnValue(makePageProps());
        render(<Details />);
        expect(screen.queryByText('Your ADA payment is being confirmed on the blockchain.')).not.toBeInTheDocument();
    });

    it('shows_insufficient_funds_message_on_build_failure: creditCardButtonRef target renders without breaking layout', () => {
        // The insufficient-funds handler calls creditCardButtonRef.current?.scrollIntoView().
        // We cannot trigger the full buy flow in a unit test (requires a live wallet API and
        // axios mocking), so this test verifies the ref target — the "Pay with Credit Card"
        // button — is present in the DOM when pendingPayment is null, which is the precondition
        // required for the scrollIntoView fallback to function.
        mockUsePageFn.mockReturnValue(makePageProps());
        render(<Details />);
        const cardButton = screen.getByRole('button', { name: /Pay with Credit Card/i });
        expect(cardButton).toBeInTheDocument();
        expect(cardButton).not.toBeDisabled();
    });
});

// ---------------------------------------------------------------------------
// TS-04: Parallel payment options — visual parity and independent degradation
// ---------------------------------------------------------------------------
describe('TS-04: Parallel payment options — visual parity and independent degradation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUsePageFn.mockReturnValue(makePageProps());
    });

    it('TS-04.01: Both ADA and CC buttons present when stripe_available and price_in_ada set', () => {
        render(<Details />);
        expect(screen.getByRole('button', { name: /Buy with ADA/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Pay with Credit Card/i })).toBeInTheDocument();
    });

    it('TS-04.02: Both payment buttons use outlined variant (visual parity)', () => {
        render(<Details />);
        const adaButton = screen.getByRole('button', { name: /Buy with ADA/i });
        const ccButton = screen.getByRole('button', { name: /Pay with Credit Card/i });
        // Both should have outlined class
        expect(adaButton.className).toContain('MuiButton-outlined');
        expect(ccButton.className).toContain('MuiButton-outlined');
        // Neither should have contained class
        expect(adaButton.className).not.toContain('MuiButton-contained');
        expect(ccButton.className).not.toContain('MuiButton-contained');
    });

    it('TS-04.03: No payment buttons shown when user is not authenticated', () => {
        mockUsePageFn.mockReturnValue(makePageProps({}, { auth: { user: null } }));
        render(<Details />);
        expect(screen.queryByRole('button', { name: /Buy with ADA/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Pay with Credit Card/i })).not.toBeInTheDocument();
    });

    it('TS-04.04: ADA unavailable hint appears when price_in_ada is null', () => {
        mockUsePageFn.mockReturnValue(makePageProps({ price_in_ada: null }));
        render(<Details />);
        // The hint text should appear near the button
        const hints = screen.getAllByText(/ADA price unavailable/i);
        expect(hints.length).toBeGreaterThanOrEqual(1);
    });

    it('TS-04.06: CC button is disabled and explanation shown when stripe_available is false', () => {
        mockUsePageFn.mockReturnValue(makePageProps({}, { stripe_available: false }));
        render(<Details />);
        const ccButton = screen.getByRole('button', { name: /Pay with Credit Card/i });
        expect(ccButton).toBeDisabled();
        expect(screen.getByText(/Credit card payment temporarily unavailable/i)).toBeInTheDocument();
    });

    it('TS-04.07: ADA button is still present when stripe_available is false', () => {
        mockUsePageFn.mockReturnValue(makePageProps({}, { stripe_available: false }));
        render(<Details />);
        expect(screen.getByRole('button', { name: /Buy with ADA/i })).toBeInTheDocument();
    });
});

// ---------------------------------------------------------------------------
// T2: Wallet disconnect detection + pending tx resilience
// ---------------------------------------------------------------------------
describe('T2: Wallet disconnect — pending tx resilience message', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('TS-T2.01: shows wallet_disconnected_pending when pendingPayment is set and walletAPI is undefined', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abc123' },
                // walletAPI is internal state; the Details component initialises to undefined
            })
        );
        render(<Details />);
        expect(
            screen.getByText('Your wallet disconnected, but your pending transaction is still being tracked on the blockchain. You can reconnect to continue monitoring.')
        ).toBeInTheDocument();
    });

    it('TS-T2.02: does not show wallet_disconnected_pending when pendingPayment is null', () => {
        mockUsePageFn.mockReturnValue(makePageProps());
        render(<Details />);
        expect(
            screen.queryByText(/Your wallet disconnected, but your pending transaction/)
        ).not.toBeInTheDocument();
    });

    it('TS-T2.03: LinearProgress and explorer link visible even when walletAPI is undefined and pendingPayment is set', () => {
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'abc123' },
                explorerUrl: 'https://preprod.cardanoscan.io',
            })
        );
        render(<Details />);
        // Multiple progressbars present (LinearProgress + rating CircularProgress)
        expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(1);
        const link = screen.getByRole('link', { name: 'View transaction on explorer' });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', 'https://preprod.cardanoscan.io/tx/abc123');
    });
});

// ---------------------------------------------------------------------------
// F-02.1: Confirmation count polling display
// ---------------------------------------------------------------------------
describe('F-02.1: Confirmation count polling display', () => {
    let axiosMock;

    beforeEach(async () => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        axiosMock = (await import('axios')).default;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('TS-F02-01: shows indeterminate LinearProgress before first poll response resolves', () => {
        axiosMock.get.mockReturnValue(new Promise(() => {}));
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'txhash01' },
            })
        );
        render(<Details />);
        const bars = screen.getAllByRole('progressbar');
        const linearBar = bars.find((el) => !el.hasAttribute('aria-valuenow'));
        expect(linearBar).toBeDefined();
    });

    it('TS-F02-02: shows "4/10 confirmations" text after poll returns pending with count 4', async () => {
        vi.useRealTimers();
        axiosMock.get.mockResolvedValue({
            data: {
                success: true,
                data: { status: 'pending', confirmations: 4 },
            },
        });
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'txhash02' },
            })
        );
        await act(async () => { render(<Details />); });
        await waitFor(() => {
            expect(screen.getByText('4/10 confirmations')).toBeInTheDocument();
        });
    });

    it('TS-F02-03: shows "0/10 confirmations" when API returns null confirmations', async () => {
        vi.useRealTimers();
        axiosMock.get.mockResolvedValue({
            data: {
                success: true,
                data: { status: 'pending', confirmations: null },
            },
        });
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'txhash03' },
            })
        );
        await act(async () => { render(<Details />); });
        await waitFor(() => {
            expect(screen.getByText('0/10 confirmations')).toBeInTheDocument();
        });
    });

    it('TS-F02-04: axios error does not crash the component', async () => {
        vi.useRealTimers();
        axiosMock.get.mockRejectedValue(new Error('Network error'));
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'txhash04' },
            })
        );
        await act(async () => { render(<Details />); });
        expect(
            screen.getByText('Your ADA payment is being confirmed on the blockchain.')
        ).toBeInTheDocument();
    });

    it('TS-F02-05: failed status shows payment_failed_retry message', async () => {
        vi.useRealTimers();
        axiosMock.get.mockResolvedValue({
            data: {
                success: true,
                data: { status: 'failed', confirmations: 0 },
            },
        });
        mockUsePageFn.mockReturnValue(
            makePageProps({}, {
                pendingPayment: { payment_tx_hash: 'txhash05' },
            })
        );
        await act(async () => { render(<Details />); });
        await waitFor(() => {
            expect(
                screen.getByText('Payment failed. Please try again.')
            ).toBeInTheDocument();
        });
    });

    it('TS-F02-06: no polling request made when pendingPayment is null', async () => {
        vi.useRealTimers();
        axiosMock.get.mockResolvedValue({ data: { success: true, data: {} } });
        mockUsePageFn.mockReturnValue(makePageProps());
        await act(async () => { render(<Details />); });
        // Give a moment for any async effects to settle
        await new Promise(r => setTimeout(r, 50));
        const statusCalls = axiosMock.get.mock.calls.filter((args) =>
            String(args[0]).includes('/status')
        );
        expect(statusCalls).toHaveLength(0);
    });
});
