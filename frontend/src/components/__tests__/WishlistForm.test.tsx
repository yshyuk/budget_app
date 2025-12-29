import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import WishlistForm from '../WishlistForm';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

const mockOnSuccess = vi.fn();

describe('WishlistForm', () => {
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

  it('renders wishlist form with all fields', () => {
    render(<WishlistForm onSuccess={mockOnSuccess} />);

    expect(screen.getByLabelText(/아이템 이름/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/목표 금액/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/우선순위/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/목표 날짜/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/메모/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /추가/i })).toBeInTheDocument();
  });

  it('has default priority set to 3', () => {
    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const priorityInput = screen.getByLabelText(/우선순위/i) as HTMLInputElement;
    expect(priorityInput.value).toBe('3');
  });

  it('submits form with valid wishlist data', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-wishlist-id',
              item_name: 'MacBook Pro',
              target_amount: 3000000,
              priority: 5,
              target_date: '2024-12-31',
              notes: 'For work',
            },
            error: null,
          }),
        }),
      }),
    } as any);

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/아이템 이름/i);
    const amountInput = screen.getByLabelText(/목표 금액/i);
    const priorityInput = screen.getByLabelText(/우선순위/i);
    const dateInput = screen.getByLabelText(/목표 날짜/i);
    const notesInput = screen.getByLabelText(/메모/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(nameInput, 'MacBook Pro');
    await user.type(amountInput, '3000000');
    await user.clear(priorityInput);
    await user.type(priorityInput, '5');
    await user.type(dateInput, '2024-12-31');
    await user.type(notesInput, 'For work');
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

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/아이템 이름/i) as HTMLInputElement;
    const amountInput = screen.getByLabelText(/목표 금액/i) as HTMLInputElement;
    const notesInput = screen.getByLabelText(/메모/i) as HTMLTextAreaElement;
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(nameInput, 'MacBook Pro');
    await user.type(amountInput, '3000000');
    await user.type(notesInput, 'For work');
    await user.click(submitButton);

    await waitFor(() => {
      expect(nameInput.value).toBe('');
      expect(amountInput.value).toBe('');
      expect(notesInput.value).toBe('');
    });
  });

  it('validates priority is between 1 and 5', async () => {
    const user = userEvent.setup();

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const priorityInput = screen.getByLabelText(/우선순위/i);

    await user.clear(priorityInput);
    await user.type(priorityInput, '0');
    expect(priorityInput).toBeInvalid();

    await user.clear(priorityInput);
    await user.type(priorityInput, '6');
    expect(priorityInput).toBeInvalid();

    await user.clear(priorityInput);
    await user.type(priorityInput, '3');
    expect(priorityInput).toBeValid();
  });

  it('validates target amount is positive', async () => {
    const user = userEvent.setup();

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const amountInput = screen.getByLabelText(/목표 금액/i);

    await user.type(amountInput, '-1000');
    expect(amountInput).toBeInvalid();

    await user.clear(amountInput);
    await user.type(amountInput, '0');
    expect(amountInput).toBeInvalid();

    await user.clear(amountInput);
    await user.type(amountInput, '1000');
    expect(amountInput).toBeValid();
  });

  it('requires item name and target amount', async () => {
    const user = userEvent.setup();

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /추가/i });
    await user.click(submitButton);

    const nameInput = screen.getByLabelText(/아이템 이름/i);
    const amountInput = screen.getByLabelText(/목표 금액/i);

    expect(nameInput).toBeInvalid();
    expect(amountInput).toBeInvalid();
  });

  it('displays error message on submission failure', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to create wishlist item' },
          }),
        }),
      }),
    } as any);

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/아이템 이름/i);
    const amountInput = screen.getByLabelText(/목표 금액/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(nameInput, 'MacBook Pro');
    await user.type(amountInput, '3000000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Failed to create wishlist item/i)
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) =>
                setTimeout(
                  () =>
                    resolve({
                      data: { id: 'new-id' },
                      error: null,
                    }),
                  100
                )
              )
          ),
        }),
      }),
    } as any);

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/아이템 이름/i);
    const amountInput = screen.getByLabelText(/목표 금액/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    await user.type(nameInput, 'MacBook Pro');
    await user.type(amountInput, '3000000');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('allows optional fields to be empty', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.from).mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-id',
              item_name: 'MacBook Pro',
              target_amount: 3000000,
              priority: 3,
            },
            error: null,
          }),
        }),
      }),
    } as any);

    render(<WishlistForm onSuccess={mockOnSuccess} />);

    const nameInput = screen.getByLabelText(/아이템 이름/i);
    const amountInput = screen.getByLabelText(/목표 금액/i);
    const submitButton = screen.getByRole('button', { name: /추가/i });

    // Only fill required fields
    await user.type(nameInput, 'MacBook Pro');
    await user.type(amountInput, '3000000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
