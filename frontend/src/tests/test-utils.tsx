import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  role: 'authenticated',
};

export const mockTransaction = (overrides = {}) => ({
  id: 'test-transaction-id',
  user_id: 'test-user-id',
  type: 'expense' as const,
  category: 'Food',
  amount: 10000,
  transaction_date: '2024-01-15',
  description: 'Test transaction',
  created_at: '2024-01-15T00:00:00.000Z',
  updated_at: '2024-01-15T00:00:00.000Z',
  ...overrides,
});

export const mockBudget = (overrides = {}) => ({
  id: 'test-budget-id',
  user_id: 'test-user-id',
  year: 2024,
  month: 1,
  income_budget: 3000000,
  expense_budget: 2000000,
  saving_budget: 500000,
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const mockWishlistItem = (overrides = {}) => ({
  id: 'test-wishlist-id',
  user_id: 'test-user-id',
  item_name: 'New Laptop',
  target_amount: 2000000,
  current_amount: 500000,
  priority: 5,
  target_date: '2024-12-31',
  is_purchased: false,
  notes: 'For work',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});
