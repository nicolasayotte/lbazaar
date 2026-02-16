import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Certificates from './Certificates';
import { Inertia } from '@inertiajs/inertia';

// Mock the usePage hook
vi.mock('@inertiajs/inertia-react', () => ({
    usePage: () => ({
        props: {
            course: { id: 1, certificate_enabled: true },
            students: [
                { id: 1, name: 'Alice Smith', certificate_status: 'eligible', completed_at: '2023-01-15' },
                { id: 2, name: 'Bob Johnson', certificate_status: 'minted', completed_at: '2023-01-20' }
            ],
            translatables: {
                texts: {
                    certificates: 'Completion Certificates',
                    mint_all_eligible: 'Mint All Eligible',
                    minting_all: 'Minting All...',
                    certificates_not_enabled: 'Certificates are not enabled for this course.',
                    no_students: 'No students have enrolled in this course yet.',
                    no_eligible_students: 'No students are currently eligible for certificates.',
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
            }
        }
    })
}));

// Mock CertificateTable component
vi.mock('./components/CertificateTable', () => ({
    default: ({ students, onMint, onRetry, minting, translatables }) => (
        <div data-testid="certificate-table">
            {students.map(student => (
                <div key={student.id} data-testid={`student-${student.id}`}>
                    {student.name}
                    {student.certificate_status === 'eligible' && (
                        <button onClick={() => onMint(student.id)}>Mint</button>
                    )}
                    {student.certificate_status === 'failed' && (
                        <button onClick={() => onRetry(student.id)}>Retry</button>
                    )}
                    {minting[student.id] && <span>Minting...</span>}
                </div>
            ))}
        </div>
    )
}));

describe('Certificates', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UI Rendering', () => {
        it('should render UI when certificates are enabled', () => {
            render(<Certificates />);

            expect(screen.getByText('Completion Certificates')).toBeInTheDocument();
            expect(screen.getByTestId('certificate-table')).toBeInTheDocument();
        });

        it('should show batch mint button when eligible students exist', () => {
            render(<Certificates />);

            expect(screen.getByText(/Mint All Eligible/i)).toBeInTheDocument();
        });
    });

    describe('Single Certificate Minting', () => {
        it('should call API when minting single certificate', async () => {
            const mockPost = vi.spyOn(Inertia, 'post');

            render(<Certificates />);

            const mintButton = screen.getAllByText('Mint')[0];
            fireEvent.click(mintButton);

            await waitFor(() => {
                expect(mockPost).toHaveBeenCalledWith(
                    '/api/certificates/courses/1/students/1/mint',
                    {},
                    expect.objectContaining({
                        preserveScroll: true,
                        onSuccess: expect.any(Function),
                        onError: expect.any(Function),
                        onFinish: expect.any(Function)
                    })
                );
            });
        });

        it('should show success message after successful mint', async () => {
            const mockPost = vi.spyOn(Inertia, 'post').mockImplementation((url, data, options) => {
                options.onSuccess();
            });

            const consoleLogSpy = vi.spyOn(console, 'log');

            render(<Certificates />);

            const mintButton = screen.getAllByText('Mint')[0];
            fireEvent.click(mintButton);

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith(
                    'Certificate minted successfully for student:',
                    1
                );
            });

            consoleLogSpy.mockRestore();
        });

        it('should show error message on mint failure', async () => {
            const mockPost = vi.spyOn(Inertia, 'post').mockImplementation((url, data, options) => {
                options.onError({ message: 'Mint failed' });
            });

            const consoleErrorSpy = vi.spyOn(console, 'error');

            render(<Certificates />);

            const mintButton = screen.getAllByText('Mint')[0];
            fireEvent.click(mintButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Failed to mint certificate:',
                    { message: 'Mint failed' }
                );
            });

            consoleErrorSpy.mockRestore();
        });
    });

    describe('Batch Certificate Minting', () => {
        it('should call API when batch minting certificates', async () => {
            const mockPost = vi.spyOn(Inertia, 'post');

            render(<Certificates />);

            const batchMintButton = screen.getByText(/Mint All Eligible/i);
            fireEvent.click(batchMintButton);

            await waitFor(() => {
                expect(mockPost).toHaveBeenCalledWith(
                    '/api/certificates/courses/1/batch-mint',
                    { student_ids: [1] },
                    expect.objectContaining({
                        preserveScroll: true,
                        onSuccess: expect.any(Function),
                        onError: expect.any(Function),
                        onFinish: expect.any(Function)
                    })
                );
            });
        });

        it('should disable batch mint button during minting', async () => {
            vi.spyOn(Inertia, 'post').mockImplementation((url, data, options) => {
                // Don't call onFinish to simulate ongoing request
            });

            render(<Certificates />);

            const batchMintButton = screen.getByText(/Mint All Eligible/i);
            fireEvent.click(batchMintButton);

            await waitFor(() => {
                expect(screen.getByText(/Minting All/i)).toBeInTheDocument();
                expect(screen.getByText(/Minting All/i).closest('button')).toBeDisabled();
            });
        });

        it('should show success message after successful batch mint', async () => {
            const mockPost = vi.spyOn(Inertia, 'post').mockImplementation((url, data, options) => {
                options.onSuccess();
                options.onFinish();
            });

            const consoleLogSpy = vi.spyOn(console, 'log');

            render(<Certificates />);

            const batchMintButton = screen.getByText(/Mint All Eligible/i);
            fireEvent.click(batchMintButton);

            await waitFor(() => {
                expect(consoleLogSpy).toHaveBeenCalledWith('Batch minting completed');
            });

            consoleLogSpy.mockRestore();
        });

        it('should show error message on batch mint failure', async () => {
            const mockPost = vi.spyOn(Inertia, 'post').mockImplementation((url, data, options) => {
                options.onError({ message: 'Batch mint failed' });
                options.onFinish();
            });

            const consoleErrorSpy = vi.spyOn(console, 'error');

            render(<Certificates />);

            const batchMintButton = screen.getByText(/Mint All Eligible/i);
            fireEvent.click(batchMintButton);

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Batch minting failed:',
                    { message: 'Batch mint failed' }
                );
            });

            consoleErrorSpy.mockRestore();
        });
    });
});
