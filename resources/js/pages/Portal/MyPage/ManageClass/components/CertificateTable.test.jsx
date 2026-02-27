import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock EmptyCard to avoid usePage dependency
vi.mock('../../../../../components/common/EmptyCard', () => ({
    default: () => <div data-testid="empty-card">No records found</div>,
}));

import CertificateTable from './CertificateTable';

describe('CertificateTable', () => {
    const mockTranslatables = {
        texts: {
            student: 'Student',
            completed_date: 'Completed',
            completion_status: 'Progress',
            delivery_status: 'Delivery',
            transaction: 'Transaction',
            delivery_eligible: 'Eligible',
            delivery_delivered: 'Delivered',
            delivery_self_minted: 'Self-minted',
            delivery_failed: 'Failed',
            delivery_not_eligible: 'Not eligible',
            completed: 'Completed',
            in_progress: 'In progress',
            view_transaction: 'View Transaction',
        },
    };

    const mockOnToggleSelect = vi.fn();
    const mockExplorerUrl = 'https://preprod.cardanoscan.io';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // -----------------------------------------------------------------------
    // Empty state
    // -----------------------------------------------------------------------

    describe('Empty State', () => {
        it('renders EmptyCard when no students', () => {
            render(
                <CertificateTable
                    students={[]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );
            expect(screen.getByTestId('empty-card')).toBeInTheDocument();
        });

        it('renders EmptyCard when students is null', () => {
            render(
                <CertificateTable
                    students={null}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );
            expect(screen.getByTestId('empty-card')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Student rendering
    // -----------------------------------------------------------------------

    describe('Student List Rendering', () => {
        it('renders student names', () => {
            const students = [
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
            ];

            render(
                <CertificateTable
                    students={students}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        });

        it('renders table headers', () => {
            const students = [
                {
                    id: 1,
                    name: 'Alice Smith',
                    delivery_status: 'eligible',
                    completion_status: 'completed',
                    completed_at: '2023-01-15',
                },
            ];

            render(
                <CertificateTable
                    students={students}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            expect(screen.getByText('Student')).toBeInTheDocument();
            // 'Completed' may appear in both header and badge — check header exists
            const completedElements = screen.getAllByText('Completed');
            expect(completedElements.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText('Progress')).toBeInTheDocument();
            expect(screen.getByText('Delivery')).toBeInTheDocument();
        });

        it('hides reward columns when hasRewards is false', () => {
            const students = [
                {
                    id: 1,
                    name: 'Alice Smith',
                    delivery_status: 'eligible',
                    completion_status: 'completed',
                    completed_at: '2023-01-15',
                },
            ];

            render(
                <CertificateTable
                    students={students}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={false}
                />
            );

            expect(screen.queryByText('Delivery')).not.toBeInTheDocument();
            expect(screen.queryByText('Transaction')).not.toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Delivery status badges
    // -----------------------------------------------------------------------

    describe('Delivery Status Badges', () => {
        const renderWithStatus = (deliveryStatus) => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: deliveryStatus,
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );
        };

        it('shows Eligible badge for eligible status', () => {
            renderWithStatus('eligible');
            expect(screen.getByText('Eligible')).toBeInTheDocument();
        });

        it('shows Delivered badge for delivered status', () => {
            renderWithStatus('delivered');
            expect(screen.getByText('Delivered')).toBeInTheDocument();
        });

        it('shows Self-minted badge for self_minted status', () => {
            renderWithStatus('self_minted');
            expect(screen.getByText('Self-minted')).toBeInTheDocument();
        });

        it('shows Failed badge for failed status', () => {
            renderWithStatus('failed');
            expect(screen.getByText('Failed')).toBeInTheDocument();
        });

        it('shows Not eligible badge for not_eligible status', () => {
            renderWithStatus('not_eligible');
            expect(screen.getByText('Not eligible')).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------------------------
    // Checkbox behavior
    // -----------------------------------------------------------------------

    describe('Checkbox', () => {
        it('renders checkbox for eligible students', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: 'eligible',
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeInTheDocument();
            expect(checkbox).not.toBeChecked();
        });

        it('does not render checkbox for non-eligible students', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Bob Johnson',
                            delivery_status: 'delivered',
                            completion_status: 'completed',
                            completed_at: '2023-01-20',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        });

        it('shows checkbox as checked when student is selected', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: 'eligible',
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                        },
                    ]}
                    selectedStudentIds={[1]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            const checkbox = screen.getByRole('checkbox');
            expect(checkbox).toBeChecked();
        });

        it('calls onToggleSelect when checkbox is clicked', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: 'eligible',
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            fireEvent.click(screen.getByRole('checkbox'));
            expect(mockOnToggleSelect).toHaveBeenCalledWith(1);
            expect(mockOnToggleSelect).toHaveBeenCalledTimes(1);
        });
    });

    // -----------------------------------------------------------------------
    // Transaction link
    // -----------------------------------------------------------------------

    describe('Transaction Link', () => {
        it('shows explorer link for delivered students with tx hash', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: 'delivered',
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                            certificate_tx_hash: 'abc123def456',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={mockExplorerUrl}
                    hasRewards={true}
                />
            );

            const link = screen.getByRole('link');
            expect(link).toHaveAttribute(
                'href',
                `${mockExplorerUrl}/transaction/abc123def456`
            );
        });

        it('shows truncated hash when no explorerUrl', () => {
            render(
                <CertificateTable
                    students={[
                        {
                            id: 1,
                            name: 'Alice Smith',
                            delivery_status: 'delivered',
                            completion_status: 'completed',
                            completed_at: '2023-01-15',
                            certificate_tx_hash: 'abc123def456',
                        },
                    ]}
                    selectedStudentIds={[]}
                    onToggleSelect={mockOnToggleSelect}
                    translatables={mockTranslatables}
                    explorerUrl={null}
                    hasRewards={true}
                />
            );

            expect(screen.getByText('abc123de...')).toBeInTheDocument();
            expect(screen.queryByRole('link')).not.toBeInTheDocument();
        });
    });
});
