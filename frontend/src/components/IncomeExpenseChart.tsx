import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MonthlyComparison {
  month: string;
  수입: number;
  지출: number;
  잔액: number;
}

export default function IncomeExpenseChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const monthsData: MonthlyComparison[] = [];

        // 최근 3개월 데이터 가져오기
        for (let i = 2; i >= 0; i--) {
          const targetDate = subMonths(new Date(), i);
          const startDate = startOfMonth(targetDate);
          const endDate = endOfMonth(targetDate);

          const { data: transactions } = await supabase
            .from('transactions')
            .select('type, amount')
            .eq('user_id', user.id)
            .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
            .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

          const summary = transactions?.reduce(
            (acc, t) => {
              if (t.type === 'income') acc.income += t.amount;
              else if (t.type === 'expense') acc.expense += t.amount;
              else if (t.type === 'saving') acc.saving += t.amount;
              return acc;
            },
            { income: 0, expense: 0, saving: 0 }
          ) || { income: 0, expense: 0, saving: 0 };

          monthsData.push({
            month: format(targetDate, 'yyyy년 M월', { locale: ko }),
            수입: summary.income,
            지출: summary.expense,
            잔액: summary.income - summary.expense - summary.saving,
          });
        }

        setData(monthsData);
      } catch (error) {
        console.error('Error fetching income/expense comparison:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>수입 vs 지출</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>월별 수입·지출 비교</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => `${value.toLocaleString()}원`}
            />
            <Legend />
            <Bar dataKey="수입" fill="#10b981" />
            <Bar dataKey="지출" fill="#ef4444" />
            <Bar dataKey="잔액" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
