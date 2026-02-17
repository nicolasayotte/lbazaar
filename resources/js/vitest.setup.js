import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Inertia
global.Inertia = {
  post: vi.fn(),
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  visit: vi.fn(),
};

// Mock axios
global.axios = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock @inertiajs/inertia-react to provide usePage globally
vi.mock('@inertiajs/inertia-react', async () => {
  const actual = await vi.importActual('@inertiajs/inertia-react');
  return {
    ...actual,
    usePage: () => ({
      props: {
        auth: { user: null },
        translatables: {
          texts: {
            no_records_found: 'No records found',
          },
        },
      },
    }),
  };
});

// Mock EmptyCard component
vi.mock('/var/www/html/resources/js/components/common/EmptyCard.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'empty-card' }, 'No records found')
}));
