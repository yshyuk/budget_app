import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../tests/test-utils';
import userEvent from '@testing-library/user-event';
import SignUp from '../SignUp';
import { supabase } from '../../lib/supabase';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

vi.mock('../../lib/supabase');

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  it('renders signup form', () => {
    render(<SignUp />);

    expect(screen.getByRole('heading', { name: /회원가입/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^비밀번호$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/비밀번호 확인/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /가입하기/i })).toBeInTheDocument();
  });

  it('displays login link', () => {
    render(<SignUp />);

    const loginLink = screen.getByText(/로그인/i);
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('submits signup form with valid data', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: { id: 'new-user-id', email: 'new@example.com' },
        session: null,
      },
      error: null,
    });

    render(<SignUp />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/^비밀번호$/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/^비밀번호$/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'different123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/비밀번호가 일치하지 않습니다/i)).toBeInTheDocument();
    });

    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('displays error message on signup failure', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    });

    render(<SignUp />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/^비밀번호$/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    await user.type(emailInput, 'existing@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/User already registered/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('requires all fields to be filled', async () => {
    const user = userEvent.setup();

    render(<SignUp />);

    const submitButton = screen.getByRole('button', { name: /가입하기/i });
    await user.click(submitButton);

    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('disables submit button while loading', async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signUp).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { user: null, session: null },
                error: null,
              }),
            100
          )
        )
    );

    render(<SignUp />);

    const emailInput = screen.getByLabelText(/이메일/i);
    const passwordInput = screen.getByLabelText(/^비밀번호$/i);
    const confirmPasswordInput = screen.getByLabelText(/비밀번호 확인/i);
    const submitButton = screen.getByRole('button', { name: /가입하기/i });

    await user.type(emailInput, 'new@example.com');
    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });
});
