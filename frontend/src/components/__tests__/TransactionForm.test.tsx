import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import TransactionForm from '../TransactionForm';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

const mockOnSuccess = vi.fn();

describe('TransactionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: 'test-user-id', email: 'test@example.com' },
        },
      },
      error: null,
    });
  });

  it('renders transaction form with all fields', () => {
    render(<TransactionForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/유형/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/카테고리/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/금액/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/날짜/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/설명/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /추가/i })).toBeInTheDocument();
  });

  it('has default type set to expense', () => {
    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const expenseRadio = screen.getByRole('radio', { name: /지출/i });
    expect(expenseRadio).toBeChecked();
  });

  it('allows selecting different transaction types', async () => {
    const user = userEvent.setup();

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const incomeRadio = screen.getByRole('radio', { name: /수입/i });
    const savingRadio = screen.getByRole('radio', { name: /저축/i });

    await user.click(incomeRadio);
    expect(incomeRadio).toBeChecked();

    await user.click(savingRadio);
    expect(savingRadio).toBeChecked();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-transaction-id',
              type: 'expense',
              category: 'Food',
              amount: 15000,
              transaction_date: '2024-01-15',
              description: 'Lunch',
            },
            error: null,
          }),
        }),
      }),
    } as any);

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const categoryInput = screen.getByLabelText(/카테고리/i);
    const amountInput = screen.getByLabelText(/금액/i);
    const dateInput = screen.getByLabelText(/날짜/i);
    const descriptionInput = screen.getByLabelText(/설명/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(categoryInput, 'Food');
    await user.type(amountInput, '15000');
    await user.type(dateInput, '2024-01-15');
    await user.type(descriptionInput, 'Lunch');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'new-id' },
            error: null,
          }),
        }),
      }),
    } as any);

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const categoryInput = screen.getByLabelText(/카테고리/i) as HTMLInputElement;
    const amountInput = screen.getByLabelText(/금액/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(/설명/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(categoryInput, 'Food');
    await user.type(amountInput, '15000');
    await user.type(descriptionInput, 'Lunch');
    await user.click(submitButton);

    await waitFor(() => {
      expect(categoryInput.value).toBe('');
      expect(amountInput.value).toBe('');
      expect(descriptionInput.value).toBe('');
    });
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to insert transaction' },
          }),
        }),
      }),
    } as any);

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const categoryInput = screen.getByLabelText(/카테고리/i);
    const amountInput = screen.getByLabelText(/금액/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(categoryInput, 'Food');
    await user.type(amountInput, '15000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to insert transaction/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('requires category and amount fields', async () => {
    const user = userEvent.setup();

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /추가/i });
    await user.click(submitButton);

    const categoryInput = screen.getByLabelText(/카테고리/i);
    const amountInput = screen.getByLabelText(/금액/i);

    expect(categoryInput).toBeInvalid();
    expect(amountInput).toBeInvalid();
  });

  it('validates amount is a positive number', async () => {
    const user = userEvent.setup();

    render(<TransactionForm onSuccess={mockOnSuccess} />);

    const amountInput = screen.getByLabelText(/금액/i);

    await user.type(amountInput, '-100');
    expect(amountInput).toBeInvalid();

    await user.clear(amountInput);
    await user.type(amountInput, '0');
    expect(amountInput).toBeInvalid();

    await user.clear(amountInput);
    await user.type(amountInput, '1000');
    expect(amountInput).toBeValid();
  });
});
