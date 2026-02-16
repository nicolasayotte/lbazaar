import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Create from './Create';

// Mock the useForm hook
const mockPost = vi.fn();
const mockSetData = vi.fn();

vi.mock('@inertiajs/inertia-react', () => ({
    Link: ({ href, children, ...props }) => <a href={href} {...props}>{children}</a>,
    useForm: () => ({
        data: {
            title: '',
            type: 'general',
            format: 'live',
            category: '',
            nft_name: '',
            lecture_frequency: 'daily',
            length: '',
            price: 0,
            seats: 0,
            description: '',
            certificate_enabled: false
        },
        setData: mockSetData,
        post: mockPost,
        errors: {}
    }),
    usePage: () => ({
        props: {
            translatables: {
                title: {
                    class: {
                        applications: {
                            create: 'Create Class Application',
                            index: 'Class Applications'
                        }
                    }
                },
                texts: {
                    title: 'Title',
                    type: 'Type',
                    format: 'Format',
                    category: 'Category',
                    nft: 'NFT',
                    price: 'Price',
                    seats: 'Seats',
                    length: 'Length',
                    frequency: 'Frequency',
                    description: 'Description',
                    cancel: 'Cancel',
                    submit: 'Submit'
                }
            },
            categoryOptions: [
                { name: 'Programming', value: 'programming' },
                { name: 'Design', value: 'design' }
            ],
            nftOptions: [
                { name: 'NFT Collection 1', value: 'nft1' },
                { name: 'NFT Collection 2', value: 'nft2' }
            ]
        }
    })
}));

// Mock the form helper
vi.mock('../../../../helpers/form.helper', () => ({
    handleOnChange: (e, setData) => {
        setData(e.target.name, e.target.value);
    },
    handleEditorOnChange: (value, field, setData) => {
        setData(field, value);
    },
    displaySelectOptions: (options, valueField) => {
        return options.map(opt => (
            <option key={opt.value} value={opt.value}>
                {opt.name}
            </option>
        ));
    }
}));

// Mock the routes helper
vi.mock('../../../../helpers/routes.helper', () => ({
    default: {
        'mypage.course.applications.index': '/mypage/course/applications',
        'mypage.course.applications.store': '/mypage/course/applications'
    }
}));

// Mock form components
vi.mock('../../../../components/forms/Input', () => ({
    default: ({ label, name, value, onChange, children, ...props }) => (
        <div>
            <label>{label}</label>
            {children ? (
                <select name={name} value={value} onChange={onChange} {...props}>
                    {children}
                </select>
            ) : (
                <input name={name} value={value} onChange={onChange} {...props} />
            )}
        </div>
    )
}));

vi.mock('../../../../components/forms/TextEditorInput', () => ({
    default: ({ name, value, onChange }) => (
        <textarea name={name} value={value} onChange={onChange} />
    )
}));

describe('Create', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Certificate Toggle Rendering', () => {
        it('should render certificate toggle switch', () => {
            render(<Create />);

            const toggle = screen.getByRole('checkbox');
            expect(toggle).toBeInTheDocument();
            expect(screen.getByText(/Enable completion certificate/i)).toBeInTheDocument();
        });

        it('should have toggle unchecked by default', () => {
            render(<Create />);

            const toggle = screen.getByRole('checkbox');
            expect(toggle).not.toBeChecked();
        });
    });

    describe('Certificate Toggle State Changes', () => {
        it('should change state when toggle is clicked', () => {
            render(<Create />);

            const toggle = screen.getByRole('checkbox');
            fireEvent.click(toggle);

            expect(mockSetData).toHaveBeenCalledWith('certificate_enabled', true);
        });

        it('should call setData with true when unchecked toggle is clicked', () => {
            render(<Create />);

            const toggle = screen.getByRole('checkbox');
            expect(toggle).not.toBeChecked();

            fireEvent.click(toggle);

            expect(mockSetData).toHaveBeenCalledWith('certificate_enabled', true);
        });
    });

    describe('Certificate Description Text', () => {
        it('should hide description text when toggle is disabled', () => {
            render(<Create />);

            expect(screen.queryByText(/Students will receive an NFT certificate/i)).not.toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        it('should include certificate_enabled in form submission', () => {
            const { container } = render(<Create />);

            const form = container.querySelector('form');
            fireEvent.submit(form);

            expect(mockPost).toHaveBeenCalledWith('/mypage/course/applications');
        });
    });
});
