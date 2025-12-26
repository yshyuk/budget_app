import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BudgetForm from '../components/BudgetForm';
import BudgetProgress from '../components/BudgetProgress';
import type { Budget, Transaction } from '../types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function Budgets() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // 예산 가져오기
      const { data: budgetData } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', selectedYear)
        .order('month', { ascending: false });

      setBudgets(budgetData || []);

      // 선택한 월의 거래 내역 가져오기
      const startDate = startOfMonth(new Date(selectedYear, selectedMonth - 1));
      const endDate = endOfMonth(new Date(selectedYear, selectedMonth - 1));

      const { data: transactionData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
        .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

      setTransactions(transactionData || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedYear, selectedMonth]);

  // 실제 사용 금액 계산
  const actual = transactions.reduce(
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

  // 선택한 월의 예산 찾기
  const currentBudget = budgets.find(
    (b) => b.year === selectedYear && b.month === selectedMonth
  );

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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">예산 관리</h2>
          <p className="text-gray-600 mt-1">월별 예산을 설정하고 진행 상황을 확인하세요</p>
        </div>

        {/* 연월 선택 */}
        <div className="mb-6 flex space-x-4">
          <div>
            <label htmlFor="year-select" className="sr-only">
              연도 선택
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const y = new Date().getFullYear() - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="month-select" className="sr-only">
              월 선택
            </label>
            <select
              id="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 예산 설정 폼 */}
            <div className="lg:col-span-1">
              <BudgetForm onSuccess={fetchData} />
            </div>

            {/* 예산 진행 상황 */}
            <div className="lg:col-span-2">
              {currentBudget ? (
                <BudgetProgress budget={currentBudget} actual={actual} />
              ) : (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">
                      {selectedYear}년 {selectedMonth}월 예산이 설정되지 않았습니다.
                    </p>
                    <p className="text-sm text-gray-400">
                      왼쪽 폼에서 예산을 설정해주세요.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 연간 예산 목록 */}
        {budgets.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedYear}년 예산 목록
            </h3>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      월
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      수입 예산
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      지출 예산
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      저축 예산
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {budgets.map((budget) => (
                    <tr
                      key={budget.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        budget.month === selectedMonth ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedMonth(budget.month)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {budget.month}월
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {budget.income_budget.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {budget.expense_budget.toLocaleString()}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {budget.saving_budget.toLocaleString()}원
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
