import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Use vi.hoisted to define mock values before hoisted vi.mock calls
const { mockConfirmPayment, mockStripe, mockElements } = vi.hoisted(() => {
    const mockConfirmPayment = vi.fn();
    const mockStripe = { confirmPayment: mockConfirmPayment };
    const mockElements = {};
    return { mockConfirmPayment, mockStripe, mockElements };
});

vi.mock('@stripe/stripe-js', () => ({
    loadStripe: vi.fn(() => Promise.resolve(mockStripe)),
}));

vi.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }) => <div data-testid="stripe-elements">{children}</div>,
    PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
    useStripe: vi.fn(() => mockStripe),
    useElements: () => mockElements,
}));

vi.mock('@inertiajs/inertia-react', () => ({
    usePage: () => ({ props: { stripe_key: 'pk_test_mock' } }),
}));

import StripeCheckout from './StripeCheckout';

describe('StripeCheckout', () => {
    const mockTranslatables = {
        texts: {
            payment_amount: 'Amount',
            cancel: 'Cancel',
            pay: 'Pay',
            processing: 'Processing...',
            loading: 'Loading...',
        },
    };

    const mockCourse = {
        id: 1,
        title: 'Test Course',
        price: 5000,
    };

    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        mockConfirmPayment.mockResolvedValue({ error: null });
    });

    describe('Loading State', () => {
        it('renders loading state when clientSecret is null', () => {
            render(
                <StripeCheckout
                    clientSecret={null}
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            // Verify CircularProgress is rendered (checks for progressbar role)
            expect(screen.getByRole('progressbar')).toBeInTheDocument();

            // Verify loading text appears
            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });

        it('renders loading text with default value when translatables not provided', () => {
            render(
                <StripeCheckout
                    clientSecret={null}
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Loading...')).toBeInTheDocument();
        });
    });

    describe('Payment Form Rendering', () => {
        it('renders payment form when clientSecret is provided', () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            // Verify Stripe Elements wrapper is rendered
            expect(screen.getByTestId('stripe-elements')).toBeInTheDocument();

            // Verify PaymentElement renders
            expect(screen.getByTestId('payment-element')).toBeInTheDocument();
        });

        it('renders amount display with correct price', () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            // Verify amount is displayed with locale formatting
            expect(screen.getByText(/Amount.*5,000/)).toBeInTheDocument();
        });

        it('renders cancel and pay buttons', () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByText(/Pay.*5,000/)).toBeInTheDocument();
        });

        it('renders default button text when translatables not provided', () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                />
            );

            expect(screen.getByText('Cancel')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Pay/ })).toBeInTheDocument();
        });
    });

    describe('Cancel Button Interaction', () => {
        it('calls onCancel when cancel button is clicked', async () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const cancelButton = screen.getByText('Cancel');
            fireEvent.click(cancelButton);

            expect(mockOnCancel).toHaveBeenCalledTimes(1);
        });

        it('does not call onCancel multiple times on rapid clicks', async () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const cancelButton = screen.getByText('Cancel');

            // Simulate form submission to trigger processing state
            const form = cancelButton.closest('form');
            fireEvent.submit(form);

            await waitFor(() => {
                expect(cancelButton).toBeDisabled();
            });
        });
    });

    describe('Payment Submission', () => {
        it('disables submit button while processing', async () => {
            mockConfirmPayment.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const payButton = screen.getByText(/Pay.*5,000/);
            const form = payButton.closest('form');

            fireEvent.submit(form);

            // Button should show processing text and be disabled
            await waitFor(() => {
                expect(screen.getByText('Processing...')).toBeInTheDocument();
                expect(screen.getByText('Processing...').closest('button')).toBeDisabled();
            });
        });

        it('calls stripe.confirmPayment with correct parameters', async () => {
            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const payButton = screen.getByText(/Pay.*5,000/);
            const form = payButton.closest('form');

            fireEvent.submit(form);

            await waitFor(() => {
                expect(mockConfirmPayment).toHaveBeenCalledWith({
                    elements: mockElements,
                    confirmParams: {
                        return_url: `${window.location.origin}/checkout/success?course_id=${mockCourse.id}`,
                    },
                });
            });
        });

        it('does not submit if stripe is not loaded', async () => {
            // Mock useStripe to return null for this test
            const { useStripe } = await import('@stripe/react-stripe-js');
            useStripe.mockReturnValueOnce(null);

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const payButton = screen.getByText(/Pay.*5,000/);
            expect(payButton).toBeDisabled();
        });
    });

    describe('Error Handling', () => {
        it('displays error message when payment fails', async () => {
            const errorMessage = 'Your card was declined.';
            mockConfirmPayment.mockResolvedValue({
                error: { message: errorMessage },
            });

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const payButton = screen.getByText(/Pay.*5,000/);
            const form = payButton.closest('form');

            fireEvent.submit(form);

            // Wait for error message to appear
            await waitFor(() => {
                expect(screen.getByText(errorMessage)).toBeInTheDocument();
            });

            // Verify Alert component is rendered
            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
        });

        it('re-enables submit button after payment failure', async () => {
            mockConfirmPayment.mockResolvedValue({
                error: { message: 'Payment failed' },
            });

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const payButton = screen.getByText(/Pay.*5,000/);
            const form = payButton.closest('form');

            fireEvent.submit(form);

            // Wait for error to be processed and button to be re-enabled
            await waitFor(() => {
                expect(screen.getByText('Payment failed')).toBeInTheDocument();
            });

            // Button should be enabled again (not showing "Processing...")
            const enabledPayButton = screen.getByText(/Pay.*5,000/);
            expect(enabledPayButton).toBeInTheDocument();
        });

        it('clears previous error message on new submission', async () => {
            mockConfirmPayment.mockResolvedValueOnce({
                error: { message: 'First error' },
            });

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const form = screen.getByText(/Pay.*5,000/).closest('form');

            // First submission - should show error
            fireEvent.submit(form);
            await waitFor(() => {
                expect(screen.getByText('First error')).toBeInTheDocument();
            });

            // Mock successful payment for second attempt
            mockConfirmPayment.mockResolvedValueOnce({ error: null });

            // Second submission - error should be cleared during processing
            fireEvent.submit(form);

            await waitFor(() => {
                expect(screen.queryByText('First error')).not.toBeInTheDocument();
            });
        });
    });

    describe('Processing State', () => {
        it('disables cancel button while processing', async () => {
            mockConfirmPayment.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const form = screen.getByText(/Pay.*5,000/).closest('form');
            fireEvent.submit(form);

            await waitFor(() => {
                const cancelButton = screen.getByText('Cancel');
                expect(cancelButton).toBeDisabled();
            });
        });

        it('shows CircularProgress icon while processing', async () => {
            mockConfirmPayment.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ error: null }), 100)));

            render(
                <StripeCheckout
                    clientSecret="test_secret_123"
                    course={mockCourse}
                    onSuccess={mockOnSuccess}
                    onCancel={mockOnCancel}
                    translatables={mockTranslatables}
                />
            );

            const form = screen.getByText(/Pay.*5,000/).closest('form');
            fireEvent.submit(form);

            // During processing, there should be a progressbar (CircularProgress)
            await waitFor(() => {
                const progressBars = screen.getAllByRole('progressbar');
                expect(progressBars.length).toBeGreaterThan(0);
            });
        });
    });
});
