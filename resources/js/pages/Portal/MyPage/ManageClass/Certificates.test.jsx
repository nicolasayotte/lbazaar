import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';

// ---------------------------------------------------------------------------
// Mock dependencies before component import
// ---------------------------------------------------------------------------

vi.mock('@inertiajs/inertia', () => ({
    Inertia: {
        post: vi.fn(),
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        visit: vi.fn(),
    },
}));

vi.mock('@inertiajs/inertia-react', () => ({
    usePage: () => ({
        props: {
            course: {
                id: 1,
                certificate_enabled: true,
                token_reward_enabled: false,
            },
            students: [
                {
                    id: 1,
                    name: 'Alice Smith',
                    delivery_status: 'eligible',
                    completion_status: 'completed',
                    completed_at: '2023-01-15',
                },
                {
                    id: 2,
                    name: 'Bob Johnson',
                    delivery_status: 'delivered',
                    completion_status: 'completed',
                    completed_at: '2023-01-20',
                },
            ],
            has_rewards: true,
            explorerUrl: 'https://preprod.cardanoscan.io',
            translatables: {
                texts: {
                    certificates: 'Completion Certificates',
                    airdrop_selected: 'Airdrop',
                    airdropping: 'Airdropping...',
                    select_all_eligible: 'Select All Eligible',
                    clear_selection: 'Clear',
                    connect_wallet_to_airdrop: 'Connect your wallet to airdrop certificates',
                    no_rewards_configured: 'No rewards configured.',
                    no_students: 'No students.',
                    no_eligible_students: 'No eligible students.',
                },
            },
        },
    }),
}));

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn().mockResolvedValue({ data: { success: true, data: { fee_ada: 2.5 } } }),
    },
}));

// Mock WalletConnector to avoid Cardano/redux complexity
vi.mock('../../../../components/cards/WalletConnector', () => ({
    default: ({ onWalletAPI }) => (
        <div data-testid="wallet-connector">
            <button
                data-testid="mock-connect-wallet"
                onClick={() =>
                    onWalletAPI({
                        getBalance: async () => '1a000f4240', // 1 ADA in CBOR
                    })
                }
            >
                Connect Wallet
            </button>
        </div>
    ),
}));

// Mock CertificateTable
vi.mock('./components/CertificateTable', () => ({
    default: ({ students, selectedStudentIds, onToggleSelect }) => (
        <div data-testid="certificate-table">
            {students.map((student) => (
                <div key={student.id} data-testid={`student-${student.id}`}>
                    {student.name}
                    {student.delivery_status === 'eligible' && (
                        <input
                            type="checkbox"
                            data-testid={`checkbox-${student.id}`}
                            checked={(selectedStudentIds ?? []).includes(student.id)}
                            onChange={() => onToggleSelect(student.id)}
                        />
                    )}
                </div>
            ))}
        </div>
    ),
}));

// Mock dialogs
vi.mock('./components/AirdropFeeDialog', () => ({
    default: ({ open, onConfirm, onClose }) =>
        open ? (
            <div data-testid="fee-dialog">
                <button data-testid="confirm-airdrop" onClick={onConfirm}>
                    Confirm
                </button>
                <button data-testid="close-fee-dialog" onClick={onClose}>
                    Cancel
                </button>
            </div>
        ) : null,
}));

vi.mock('./components/AirdropResultsDialog', () => ({
    default: ({ open, onClose }) =>
        open ? (
            <div data-testid="results-dialog">
                <button data-testid="close-results" onClick={onClose}>
                    Close
                </button>
            </div>
        ) : null,
}));

import Certificates from './Certificates';

// ---------------------------------------------------------------------------
// Minimal Redux store for tests (WalletConnector is mocked, but Provider is
// needed in case any nested real component is accidentally imported)
// ---------------------------------------------------------------------------
const mockStore = configureStore({
    reducer: {
        toaster: (state = { messages: [] }) => state,
    },
});

const renderWithStore = (ui) => render(<Provider store={mockStore}>{ui}</Provider>);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Certificates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UI Rendering', () => {
        it('renders the page heading', () => {
            renderWithStore(<Certificates />);
            expect(screen.getByText('Completion Certificates')).toBeInTheDocument();
        });

        it('renders the certificate table', () => {
            renderWithStore(<Certificates />);
            expect(screen.getByTestId('certificate-table')).toBeInTheDocument();
        });

        it('renders the wallet connector', () => {
            renderWithStore(<Certificates />);
            expect(screen.getByTestId('wallet-connector')).toBeInTheDocument();
        });

        it('shows select all eligible button when eligible students exist', () => {
            renderWithStore(<Certificates />);
            expect(screen.getByText(/Select All Eligible/i)).toBeInTheDocument();
        });

        it('shows airdrop button', () => {
            renderWithStore(<Certificates />);
            expect(screen.getByText(/Airdrop/i)).toBeInTheDocument();
        });
    });

    describe('Selection', () => {
        it('selects all eligible students when select-all is clicked', () => {
            renderWithStore(<Certificates />);
            // First connect wallet so airdrop isn't the only focus
            const selectAll = screen.getByText(/Select All Eligible/i);
            fireEvent.click(selectAll);
            // Checkbox for eligible student (id=1) should now be checked
            const checkbox = screen.getByTestId('checkbox-1');
            expect(checkbox).toBeChecked();
        });

        it('clears selection when clear button is clicked', () => {
            renderWithStore(<Certificates />);
            fireEvent.click(screen.getByText(/Select All Eligible/i));
            const clearBtn = screen.getByText(/^Clear$/i);
            fireEvent.click(clearBtn);
            const checkbox = screen.getByTestId('checkbox-1');
            expect(checkbox).not.toBeChecked();
        });
    });

    describe('Airdrop flow', () => {
        it('airdrop button is disabled when no wallet connected', () => {
            renderWithStore(<Certificates />);
            const airdropBtn = screen.getByText(/Airdrop/i).closest('button');
            expect(airdropBtn).toBeDisabled();
        });

        it('opens fee dialog when airdrop button clicked with wallet + selection', async () => {
            renderWithStore(<Certificates />);

            // Connect wallet
            fireEvent.click(screen.getByTestId('mock-connect-wallet'));

            // Select a student
            fireEvent.click(screen.getByText(/Select All Eligible/i));

            // Click airdrop
            const airdropBtn = screen.getByText(/Airdrop/i).closest('button');
            fireEvent.click(airdropBtn);

            await waitFor(() => {
                expect(screen.getByTestId('fee-dialog')).toBeInTheDocument();
            });
        });
    });
});
