import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CategoryData {
  name: string;
  value: number;
  [key: string]: string | number;
}

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
];

export default function CategoryPieChart() {
  const { user } = useAuth();
  const [data, setData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);

        const { data: transactions } = await supabase
          .from('transactions')
          .select('category, amount')
          .eq('user_id', user.id)
          .eq('type', 'expense')
          .gte('transaction_date', format(startDate, 'yyyy-MM-dd'))
          .lte('transaction_date', format(endDate, 'yyyy-MM-dd'));

        // 카테고리별로 그룹화
        const categoryMap = new Map<string, number>();
        transactions?.forEach((t: { category: string; amount: number }) => {
          const current = categoryMap.get(t.category) || 0;
          categoryMap.set(t.category, current + t.amount);
        });

        // 상위 8개 카테고리만 표시, 나머지는 기타로
        const sortedCategories = Array.from(categoryMap.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }));

        const topCategories = sortedCategories.slice(0, 7);
        const others = sortedCategories.slice(7);

        if (others.length > 0) {
          const othersSum = others.reduce((sum, item) => sum + item.value, 0);
          topCategories.push({ name: '기타', value: othersSum });
        }

        setData(topCategories);
      } catch (error) {
        console.error('Error fetching category data:', error);
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
          <CardTitle>카테고리별 지출</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>카테고리별 지출 분포</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-center justify-center">
            <p className="text-muted-foreground">이번 달 지출 내역이 없습니다.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          카테고리별 지출 분포 ({format(new Date(), 'M월', { locale: ko })})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) =>
                `${props.name || ''} ${props.percent ? (props.percent * 100).toFixed(0) : 0}%`
              }
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value?: number) => `${(value || 0).toLocaleString()}원`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
