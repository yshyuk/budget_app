import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../../tests/test-utils';
import BudgetProgress from '../BudgetProgress';
import { mockBudget } from '../../tests/test-utils';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

describe('BudgetProgress', () => {
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

  it('displays budget information', () => {
    const budget = mockBudget({
      year: 2024,
      month: 1,
      income_budget: 3000000,
      expense_budget: 2000000,
      saving_budget: 500000,
    });

    render(<BudgetProgress budget={budget} />);

    expect(screen.getByText(/2024년 1월 예산/i)).toBeInTheDocument();
  });

  it('displays all budget categories', () => {
    const budget = mockBudget({
      income_budget: 3000000,
      expense_budget: 2000000,
      saving_budget: 500000,
    });

    render(<BudgetProgress budget={budget} />);

    expect(screen.getByText(/수입 예산/i)).toBeInTheDocument();
    expect(screen.getByText(/지출 예산/i)).toBeInTheDocument();
    expect(screen.getByText(/저축 목표/i)).toBeInTheDocument();
  });

  it('calculates and displays progress percentage', async () => {
    const budget = mockBudget({
      expense_budget: 2000000,
    });

    // Mock transactions
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  type: 'expense',
                  amount: 1000000, // 50% of budget
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    render(<BudgetProgress budget={budget} />);

    // Should show 50% progress
    await screen.findByText(/50%/);
  });

  it('shows green color when under budget', async () => {
    const budget = mockBudget({
      expense_budget: 2000000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  type: 'expense',
                  amount: 1000000, // 50% of budget
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { container } = render(<BudgetProgress budget={budget} />);

    // Progress bar should have green color for under budget
    const progressBar = container.querySelector('.bg-green-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('shows red color when over budget', async () => {
    const budget = mockBudget({
      expense_budget: 2000000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  type: 'expense',
                  amount: 2500000, // 125% of budget - over budget
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    const { container } = render(<BudgetProgress budget={budget} />);

    // Progress bar should have red color for over budget
    const progressBar = container.querySelector('.bg-red-500');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays remaining budget amount', async () => {
    const budget = mockBudget({
      expense_budget: 2000000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [
                {
                  type: 'expense',
                  amount: 500000,
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    render(<BudgetProgress budget={budget} />);

    // Should show remaining: 2,000,000 - 500,000 = 1,500,000
    await screen.findByText(/1,500,000/);
  });

  it('handles zero budget gracefully', () => {
    const budget = mockBudget({
      income_budget: 0,
      expense_budget: 0,
      saving_budget: 0,
    });

    render(<BudgetProgress budget={budget} />);

    expect(screen.getByText(/2024년 1월 예산/i)).toBeInTheDocument();
  });

  it('formats large numbers with thousand separators', async () => {
    const budget = mockBudget({
      income_budget: 3000000,
      expense_budget: 2000000,
      saving_budget: 500000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      }),
    } as any);

    render(<BudgetProgress budget={budget} />);

    expect(screen.getByText(/3,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/2,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/500,000/)).toBeInTheDocument();
  });
});
