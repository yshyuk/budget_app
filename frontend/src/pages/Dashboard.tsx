import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Transaction } from '../types/database';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowUpIcon, ArrowDownIcon, WalletIcon, PlusIcon } from 'lucide-react';
import MonthlyTrendChart from '../components/MonthlyTrendChart';
import CategoryPieChart from '../components/CategoryPieChart';
import IncomeExpenseChart from '../components/IncomeExpenseChart';

export default function Dashboard() {
  const { user } = useAuth();
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">대시보드</h2>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'yyyy년 MM월', { locale: ko })} 재무 현황입니다.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link to="/transactions">
              <PlusIcon className="mr-2 h-4 w-4" />
              거래 추가
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 수입</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+{summary.income.toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 지출</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-{summary.expense.toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 저축</CardTitle>
            <WalletIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">-{summary.saving.toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">잔액</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}원
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>최근 거래</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">거래 내역이 없습니다.</p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-full border ${transaction.type === 'income' ? 'bg-green-100 border-green-200' :
                      transaction.type === 'expense' ? 'bg-red-100 border-red-200' :
                        'bg-blue-100 border-blue-200'
                      }`}>
                      {transaction.type === 'income' ? <ArrowUpIcon className="h-4 w-4 text-green-600" /> :
                        transaction.type === 'expense' ? <ArrowDownIcon className="h-4 w-4 text-red-600" /> :
                          <WalletIcon className="h-4 w-4 text-blue-600" />}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">{transaction.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.description || format(new Date(transaction.transaction_date), 'PPP', { locale: ko })}
                      </p>
                    </div>
                    <div className={`ml-auto font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()}원
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>빠른 동작</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full justify-start" variant="outline">
              <Link to="/transactions">
                <PlusIcon className="mr-2 h-4 w-4" />
                거래 추가하기
              </Link>
            </Button>
            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">예산 관리</p>
                  <p className="text-xs text-muted-foreground">준비 중인 기능입니다.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 차트 섹션 (웹 전용 - 태블릿/데스크탑) */}
      <div className="hidden lg:block space-y-8">
        <div>
          <h3 className="text-2xl font-bold tracking-tight mb-4">통계 및 분석</h3>
          <p className="text-muted-foreground mb-6">
            지출 패턴과 재무 추이를 한눈에 확인하세요.
          </p>
        </div>

        {/* 월별 추이 차트 */}
        <MonthlyTrendChart />

        {/* 카테고리별 분포 & 수입/지출 비교 */}
        <div className="grid gap-4 md:grid-cols-2">
          <CategoryPieChart />
          <IncomeExpenseChart />
        </div>
      </div>
    </div>
  );
}
