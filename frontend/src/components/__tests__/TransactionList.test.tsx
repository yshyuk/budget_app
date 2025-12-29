import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import TransactionList from '../TransactionList';
import { mockTransaction } from '../../tests/test-utils';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

const mockOnUpdate = vi.fn();

describe('TransactionList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays empty state when no transactions', () => {
    render(<TransactionList transactions={[]} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/거래 내역이 없습니다/i)).toBeInTheDocument();
  });

  it('displays list of transactions', () => {
    const transactions = [
      mockTransaction({
        id: '1',
        type: 'income',
        category: 'Salary',
        amount: 3000000,
        description: 'Monthly salary',
      }),
      mockTransaction({
        id: '2',
        type: 'expense',
        category: 'Food',
        amount: 50000,
        description: 'Groceries',
      }),
      mockTransaction({
        id: '3',
        type: 'saving',
        category: 'Emergency Fund',
        amount: 500000,
        description: 'Monthly savings',
      }),
    ];

    render(<TransactionList transactions={transactions} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument();
    expect(screen.getByText('Monthly salary')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('displays transaction types with correct badges', () => {
    const transactions = [
      mockTransaction({ id: '1', type: 'income', category: 'Salary' }),
      mockTransaction({ id: '2', type: 'expense', category: 'Food' }),
      mockTransaction({ id: '3', type: 'saving', category: 'Savings' }),
    ];

    render(<TransactionList transactions={transactions} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('수입')).toBeInTheDocument();
    expect(screen.getByText('지출')).toBeInTheDocument();
    expect(screen.getByText('저축')).toBeInTheDocument();
  });

  it('allows editing a transaction', async () => {
    const user = userEvent.setup();

    const transaction = mockTransaction({
      id: '1',
      type: 'expense',
      category: 'Food',
      amount: 50000,
      description: 'Original description',
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<TransactionList transactions={[transaction]} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /수정/i });
    await user.click(editButton);

    const categoryInput = screen.getByDisplayValue('Food');
    await user.clear(categoryInput);
    await user.type(categoryInput, 'Restaurant');

    const saveButton = screen.getByRole('button', { name: /저장/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('allows canceling edit mode', async () => {
    const user = userEvent.setup();

    const transaction = mockTransaction({
      id: '1',
      category: 'Food',
      amount: 50000,
    });

    render(<TransactionList transactions={[transaction]} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /수정/i });
    await user.click(editButton);

    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /취소/i })).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: /취소/i });
    await user.click(cancelButton);

    expect(screen.queryByRole('button', { name: /저장/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /수정/i })).toBeInTheDocument();
  });

  it('allows deleting a transaction', async () => {
    const user = userEvent.setup();

    const transaction = mockTransaction({
      id: '1',
      category: 'Food',
      amount: 50000,
    });

    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<TransactionList transactions={[transaction]} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });

  it('does not delete when user cancels confirmation', async () => {
    const user = userEvent.setup();

    const transaction = mockTransaction({
      id: '1',
      category: 'Food',
      amount: 50000,
    });

    vi.stubGlobal('confirm', vi.fn(() => false));

    render(<TransactionList transactions={[transaction]} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    expect(supabase.from).not.toHaveBeenCalled();
    expect(mockOnUpdate).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it('displays formatted amounts correctly', () => {
    const transactions = [
      mockTransaction({
        id: '1',
        type: 'income',
        category: 'Salary',
        amount: 3000000,
      }),
      mockTransaction({
        id: '2',
        type: 'expense',
        category: 'Food',
        amount: 50000,
      }),
    ];

    render(<TransactionList transactions={transactions} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/3,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/50,000/)).toBeInTheDocument();
  });

  it('handles update errors gracefully', async () => {
    const user = userEvent.setup();

    const transaction = mockTransaction({
      id: '1',
      category: 'Food',
      amount: 50000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      }),
    } as any);

    render(<TransactionList transactions={[transaction]} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /수정/i });
    await user.click(editButton);

    const saveButton = screen.getByRole('button', { name: /저장/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
