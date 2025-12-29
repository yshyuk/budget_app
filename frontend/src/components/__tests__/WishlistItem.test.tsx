import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import WishlistItem from '../WishlistItem';
import { mockWishlistItem } from '../../tests/test-utils';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase');

const mockOnUpdate = vi.fn();

describe('WishlistItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays wishlist item information', () => {
    const item = mockWishlistItem({
      item_name: 'MacBook Pro',
      target_amount: 3000000,
      current_amount: 1500000,
      priority: 5,
      notes: 'For work',
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('MacBook Pro')).toBeInTheDocument();
    expect(screen.getByText(/3,000,000/)).toBeInTheDocument();
    expect(screen.getByText(/1,500,000/)).toBeInTheDocument();
    expect(screen.getByText('For work')).toBeInTheDocument();
  });

  it('displays priority stars correctly', () => {
    const item = mockWishlistItem({
      item_name: 'High Priority Item',
      priority: 5,
    });

    const { container } = render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    // Should have 5 filled stars for priority 5
    const stars = container.querySelectorAll('[data-testid="star"]');
    expect(stars).toHaveLength(5);
  });

  it('calculates and displays progress percentage', () => {
    const item = mockWishlistItem({
      item_name: 'Laptop',
      target_amount: 2000000,
      current_amount: 1000000, // 50%
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows progress bar with correct width', () => {
    const item = mockWishlistItem({
      target_amount: 2000000,
      current_amount: 1000000, // 50%
    });

    const { container } = render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('allows adding savings to item', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      id: 'wishlist-1',
      item_name: 'Laptop',
      target_amount: 2000000,
      current_amount: 500000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const addSavingsButton = screen.getByRole('button', { name: /저축 추가/i });
    await user.click(addSavingsButton);

    const amountInput = screen.getByPlaceholderText(/금액 입력/i);
    await user.type(amountInput, '100000');

    const confirmButton = screen.getByRole('button', { name: /확인/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('validates savings amount does not exceed target', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      item_name: 'Laptop',
      target_amount: 2000000,
      current_amount: 1900000,
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const addSavingsButton = screen.getByRole('button', { name: /저축 추가/i });
    await user.click(addSavingsButton);

    const amountInput = screen.getByPlaceholderText(/금액 입력/i);
    await user.type(amountInput, '200000'); // Exceeds target by 100000

    const confirmButton = screen.getByRole('button', { name: /확인/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText(/목표 금액을 초과할 수 없습니다/i)).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('allows marking item as purchased', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      id: 'wishlist-1',
      item_name: 'Laptop',
      is_purchased: false,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const purchaseButton = screen.getByRole('button', { name: /구매 완료/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('displays purchased badge for purchased items', () => {
    const item = mockWishlistItem({
      item_name: 'Laptop',
      is_purchased: true,
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/구매 완료/i)).toBeInTheDocument();
  });

  it('allows editing wishlist item', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      id: 'wishlist-1',
      item_name: 'Laptop',
      target_amount: 2000000,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const editButton = screen.getByRole('button', { name: /수정/i });
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue('Laptop');
    await user.clear(nameInput);
    await user.type(nameInput, 'MacBook Pro');

    const saveButton = screen.getByRole('button', { name: /저장/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });
  });

  it('allows deleting wishlist item', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      id: 'wishlist-1',
      item_name: 'Laptop',
    });

    vi.stubGlobal('confirm', vi.fn(() => true));

    vi.mocked(supabase.from).mockReturnValue({
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as any);

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const deleteButton = screen.getByRole('button', { name: /삭제/i });
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });

  it('displays target date when provided', () => {
    const item = mockWishlistItem({
      item_name: 'Laptop',
      target_date: '2024-12-31',
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/2024/)).toBeInTheDocument();
  });

  it('calculates remaining amount correctly', () => {
    const item = mockWishlistItem({
      item_name: 'Laptop',
      target_amount: 2000000,
      current_amount: 1200000,
    });

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    // Remaining: 2,000,000 - 1,200,000 = 800,000
    expect(screen.getByText(/800,000/)).toBeInTheDocument();
  });

  it('handles errors when updating item', async () => {
    const user = userEvent.setup();

    const item = mockWishlistItem({
      id: 'wishlist-1',
      item_name: 'Laptop',
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      }),
    } as any);

    render(<WishlistItem item={item} onUpdate={mockOnUpdate} />);

    const purchaseButton = screen.getByRole('button', { name: /구매 완료/i });
    await user.click(purchaseButton);

    await waitFor(() => {
      expect(screen.getByText(/Update failed/i)).toBeInTheDocument();
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
  });
});
