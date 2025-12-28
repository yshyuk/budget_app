import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import BudgetForm from '../BudgetForm';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

const mockOnSuccess = vi.fn();

describe('BudgetForm', () => {
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

  it('renders budget form with all fields', () => {
    render(<BudgetForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/연도/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/월/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/수입 예산/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/지출 예산/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/저축 목표/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /예산 설정/i })).toBeInTheDocument();
  });

  it('has default year and month set to current date', () => {
    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const yearInput = screen.getByLabelText(/연도/i) as HTMLInputElement;
    const monthInput = screen.getByLabelText(/월/i) as HTMLSelectElement;

    expect(yearInput.value).toBe(currentYear.toString());
    expect(monthInput.value).toBe(currentMonth.toString());
  });

  it('submits form with valid budget data', async () => {
    const user = userEvent.setup();

    // Mock: Check if budget exists (no existing budget)
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any);

    // Mock: Insert new budget
    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-budget-id',
              year: 2024,
              month: 1,
              income_budget: 3000000,
              expense_budget: 2000000,
              saving_budget: 500000,
            },
            error: null,
          }),
        }),
      }),
    } as any);

    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const incomeInput = screen.getByLabelText(/수입 예산/i);
    const expenseInput = screen.getByLabelText(/지출 예산/i);
    const savingInput = screen.getByLabelText(/저축 목표/i);
    const submitButton = screen.getByRole('button', { name: /예산 설정/i });

    await user.type(incomeInput, '3000000');
    await user.type(expenseInput, '2000000');
    await user.type(savingInput, '500000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('updates existing budget when one exists', async () => {
    const user = userEvent.setup();

    const existingBudget = {
      id: 'existing-budget-id',
      year: 2024,
      month: 1,
      income_budget: 2500000,
      expense_budget: 1800000,
      saving_budget: 400000,
    };

    // Mock: Check if budget exists (existing budget found)
    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: existingBudget,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any);

    // Mock: Update existing budget
    vi.mocked(supabase.from).mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const incomeInput = screen.getByLabelText(/수입 예산/i);
    const submitButton = screen.getByRole('button', { name: /예산 설정/i });

    await user.clear(incomeInput);
    await user.type(incomeInput, '3000000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('validates that budget amounts are positive numbers', async () => {
    const user = userEvent.setup();

    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const incomeInput = screen.getByLabelText(/수입 예산/i);
    const expenseInput = screen.getByLabelText(/지출 예산/i);

    await user.type(incomeInput, '-1000');
    await user.type(expenseInput, '-500');

    expect(incomeInput).toBeInvalid();
    expect(expenseInput).toBeInvalid();
  });

  it('allows month selection from 1 to 12', () => {
    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const monthSelect = screen.getByLabelText(/월/i);
    const options = Array.from(monthSelect.querySelectorAll('option'));

    expect(options).toHaveLength(12);
    expect(options[0]).toHaveTextContent('1월');
    expect(options[11]).toHaveTextContent('12월');
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      }),
    } as any);

    vi.mocked(supabase.from).mockReturnValueOnce({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to create budget' },
          }),
        }),
      }),
    } as any);

    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const incomeInput = screen.getByLabelText(/수입 예산/i);
    const submitButton = screen.getByRole('button', { name: /예산 설정/i });

    await user.type(incomeInput, '3000000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create budget/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(
                () =>
                  new Promise((resolve) =>
                    setTimeout(
                      () =>
                        resolve({
                          data: null,
                          error: null,
                        }),
                      100
                    )
                  )
              ),
            }),
          }),
        }),
      }),
    } as any);

    render(<BudgetForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /예산 설정/i });
    const incomeInput = screen.getByLabelText(/수입 예산/i);

    await user.type(incomeInput, '3000000');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 2000 }
    );
  });
});
