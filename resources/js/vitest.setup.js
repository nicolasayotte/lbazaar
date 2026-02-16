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

// Mock EmptyCard component
vi.mock('/var/www/html/resources/js/components/common/EmptyCard.jsx', () => ({
  default: () => React.createElement('div', { 'data-testid': 'empty-card' }, 'No records found')
}));
