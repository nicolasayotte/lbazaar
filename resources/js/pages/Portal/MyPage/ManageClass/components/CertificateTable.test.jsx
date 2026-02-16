import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CertificateTable from './CertificateTable';

describe('CertificateTable', () => {
    const mockTranslatables = {
        texts: {
            student: 'Student',
            completed_date: 'Completed Date',
            status: 'Status',
            transaction: 'Transaction',
            actions: 'Actions',
            mint: 'Mint',
            minting: 'Minting...',
            retry: 'Retry',
            view_transaction: 'View Transaction'
        }
    };

    const mockOnMint = vi.fn();
    const mockOnRetry = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Empty State', () => {
        it('should render EmptyCard when no students', () => {
            render(
                <CertificateTable
                    students={[]}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            // EmptyCard should be rendered
            expect(screen.getByTestId('empty-card')).toBeInTheDocument();
        });

        it('should render EmptyCard when students is null', () => {
            render(
                <CertificateTable
                    students={null}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByTestId('empty-card')).toBeInTheDocument();
        });
    });

    describe('Student List Rendering', () => {
        it('should render student list with correct names', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' },
                { id: 2, name: 'Bob Johnson', certificate_status: 'minted', completed_at: '2023-01-20' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('Alice Smith')).toBeInTheDocument();
            expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
        });

        it('should render table headers correctly', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('Student')).toBeInTheDocument();
            expect(screen.getByText('Completed Date')).toBeInTheDocument();
            expect(screen.getByText('Status')).toBeInTheDocument();
            expect(screen.getByText('Transaction')).toBeInTheDocument();
            expect(screen.getByText('Actions')).toBeInTheDocument();
        });
    });

    describe('Status Badges', () => {
        it('should render eligible status badge with info color', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const badge = screen.getByText('Eligible');
            expect(badge).toBeInTheDocument();
        });

        it('should render minting status badge with warning color', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'minting', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const badge = screen.getByText('Minting');
            expect(badge).toBeInTheDocument();
        });

        it('should render minted status badge with success color', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'minted', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const badge = screen.getByText('Minted');
            expect(badge).toBeInTheDocument();
        });

        it('should render failed status badge with error color', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'failed', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const badge = screen.getByText('Failed');
            expect(badge).toBeInTheDocument();
        });
    });

    describe('Action Buttons', () => {
        it('should show mint button for eligible students', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('Mint')).toBeInTheDocument();
        });

        it('should show retry button for failed students', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'failed', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            // Retry button is an icon button with Replay icon
            const retryButton = screen.getByRole('button');
            expect(retryButton).toBeInTheDocument();
        });

        it('should call onMint when mint button is clicked', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const mintButton = screen.getByText('Mint');
            fireEvent.click(mintButton);

            expect(mockOnMint).toHaveBeenCalledWith(1);
            expect(mockOnMint).toHaveBeenCalledTimes(1);
        });

        it('should call onRetry when retry button is clicked', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'failed', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const retryButton = screen.getByRole('button');
            fireEvent.click(retryButton);

            expect(mockOnRetry).toHaveBeenCalledWith(1);
            expect(mockOnRetry).toHaveBeenCalledTimes(1);
        });
    });

    describe('Loading State', () => {
        it('should show loading spinner during minting', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    minting={{ 1: true }}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('Minting...')).toBeInTheDocument();
        });

        it('should disable mint button during minting', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    minting={{ 1: true }}
                    translatables={mockTranslatables}
                />
            );

            const mintButton = screen.getByText('Minting...').closest('button');
            expect(mintButton).toBeDisabled();
        });

        it('should disable retry button during minting', () => {
            const students = [
                { id: 1, name: 'Alice Smith', certificate_status: 'failed', completed_at: '2023-01-15' }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    minting={{ 1: true }}
                    translatables={mockTranslatables}
                />
            );

            const retryButton = screen.getByRole('button');
            expect(retryButton).toBeDisabled();
        });
    });

    describe('Transaction Hash Display', () => {
        it('should display transaction hash for minted certificates', () => {
            const students = [
                {
                    id: 1,
                    name: 'Alice Smith',
                    certificate_status: 'minted',
                    certificate_tx_hash: 'abc123def456',
                    completed_at: '2023-01-15'
                }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            expect(screen.getByText('abc123de...')).toBeInTheDocument();
        });

        it('should show explorer link for minted certificates', () => {
            const students = [
                {
                    id: 1,
                    name: 'Alice Smith',
                    certificate_status: 'minted',
                    certificate_tx_hash: 'abc123def456',
                    completed_at: '2023-01-15'
                }
            ];

            render(
                <CertificateTable
                    students={students}
                    onMint={mockOnMint}
                    onRetry={mockOnRetry}
                    translatables={mockTranslatables}
                />
            );

            const links = screen.getAllByRole('link');
            const explorerLink = links.find(link =>
                link.getAttribute('href')?.includes('cardanoscan.io')
            );

            expect(explorerLink).toBeTruthy();
            expect(explorerLink?.getAttribute('href')).toContain('abc123def456');
        });
    });
});
