import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BudgetForm from '../components/BudgetForm';
import BudgetProgress from '../components/BudgetProgress';
import type { Budget, Transaction } from '../types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">예산 관리</h2>
        <p className="text-muted-foreground">월별 예산을 설정하고 진행 상황을 확인하세요</p>
      </div>

      {/* 연월 선택 */}
      <div className="flex space-x-4">
        <div>
          <label htmlFor="year-select" className="sr-only">
            연도 선택
          </label>
          <select
            id="year-select"
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            className="rounded-md border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 예산 설정 폼 */}
          <div className="lg:col-span-1">
            <BudgetForm onSuccess={fetchData} />
          </div>

          {/* 예산 진행 상황 */}
          <div className="lg:col-span-2">
            {currentBudget ? (
              <BudgetProgress budget={currentBudget} actual={actual} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-muted-foreground mb-4">
                    {selectedYear}년 {selectedMonth}월 예산이 설정되지 않았습니다.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    왼쪽 폼에서 예산을 설정해주세요.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 연간 예산 목록 */}
      {budgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{selectedYear}년 예산 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-md border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      월
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      수입 예산
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      지출 예산
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      저축 예산
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  {budgets.map((budget) => (
                    <tr
                      key={budget.id}
                      className={`hover:bg-muted/50 cursor-pointer transition-colors ${budget.month === selectedMonth ? 'bg-muted' : ''
                        }`}
                      onClick={() => setSelectedMonth(budget.month)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
