import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface MonthlyData {
  month: string;
  수입: number;
  지출: number;
  저축: number;
}

export default function MonthlyTrendChart() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const monthsData: MonthlyData[] = [];

        // 최근 6개월 데이터 가져오기
        for (let i = 5; i >= 0; i--) {
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
            (acc, t: { type: 'income' | 'expense' | 'saving'; amount: number }) => {
              acc[t.type] += t.amount;
              return acc;
            },
            { income: 0, expense: 0, saving: 0 }
          ) || { income: 0, expense: 0, saving: 0 };

          monthsData.push({
            month: format(targetDate, 'M월', { locale: ko }),
            수입: summary.income,
            지출: summary.expense,
            저축: summary.saving,
          });
        }

        setData(monthsData);
      } catch (error) {
        console.error('Error fetching monthly trend:', error);
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
          <CardTitle>월별 추이</CardTitle>
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
        <CardTitle>월별 수입·지출·저축 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value?: number) => `${(value || 0).toLocaleString()}원`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="수입"
              stroke="#10b981"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="지출"
              stroke="#ef4444"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="저축"
              stroke="#3b82f6"
              strokeWidth={2}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
