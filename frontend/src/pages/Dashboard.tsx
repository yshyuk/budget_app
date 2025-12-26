import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Transaction } from '../types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        // 이번 달 거래 내역
        const { data: monthlyData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
          .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

        setMonthlyTransactions(monthlyData || []);

        // 최근 거래 5개
        const { data: recentData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentTransactions(recentData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // 월별 합계 계산
  const summary = monthlyTransactions.reduce(
    (acc, transaction) => {
      switch (transaction.type) {
        case 'income':
          acc.income += transaction.amount;
          break;
        case 'expense':
          acc.expense += transaction.amount;
          break;
        case 'saving':
          acc.saving += transaction.amount;
          break;
      }
      return acc;
    },
    { income: 0, expense: 0, saving: 0 }
  );

  const balance = summary.income - summary.expense - summary.saving;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-50';
      case 'expense':
        return 'text-red-600 bg-red-50';
      case 'saving':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'income':
        return '수입';
      case 'expense':
        return '지출';
      case 'saving':
        return '저축';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">가계부</h1>
              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  대시보드
                </Link>
                <Link
                  to="/transactions"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/transactions')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  거래 내역
                </Link>
                <Link
                  to="/budgets"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/budgets')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  예산 관리
                </Link>
                <Link
                  to="/wishlist"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/wishlist')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  위시리스트
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* 페이지 제목 */}
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">대시보드</h2>
          <p className="text-gray-600 mt-1">
            {format(new Date(), 'yyyy년 MM월', { locale: ko })} 재무 현황
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <>
            {/* 월별 합계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">이번 달 수입</p>
                <p className="text-3xl font-bold text-green-600">
                  +{summary.income.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">원</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">이번 달 지출</p>
                <p className="text-3xl font-bold text-red-600">
                  -{summary.expense.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">원</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">이번 달 저축</p>
                <p className="text-3xl font-bold text-blue-600">
                  -{summary.saving.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">원</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-600 mb-1">잔액</p>
                <p
                  className={`text-3xl font-bold ${
                    balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {balance >= 0 ? '+' : ''}
                  {balance.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">원</p>
              </div>
            </div>

            {/* 최근 거래 내역 */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-900">최근 거래</h3>
                <Link
                  to="/transactions"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  전체 보기 →
                </Link>
              </div>
              <div className="divide-y divide-gray-200">
                {recentTransactions.length === 0 ? (
                  <div className="px-6 py-8 text-center text-gray-500">
                    거래 내역이 없습니다.
                  </div>
                ) : (
                  recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                                transaction.type
                              )}`}
                            >
                              {getTypeText(transaction.type)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {transaction.category}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-sm text-gray-600">
                              {transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {format(
                              new Date(transaction.transaction_date),
                              'PPP',
                              { locale: ko }
                            )}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p
                            className={`text-lg font-bold ${
                              transaction.type === 'income'
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {transaction.type === 'income' ? '+' : '-'}
                            {transaction.amount.toLocaleString()}원
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 빠른 동작 */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/transactions"
                className="block bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  거래 추가
                </h4>
                <p className="text-sm text-gray-600">
                  새로운 수입, 지출, 저축 내역을 기록하세요
                </p>
              </Link>
              <div className="bg-gray-100 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-500 mb-2">
                  예산 관리 (준비 중)
                </h4>
                <p className="text-sm text-gray-500">
                  월별 예산을 설정하고 관리하세요
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
