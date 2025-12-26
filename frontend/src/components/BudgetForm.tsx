import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BudgetFormProps {
  onSuccess?: () => void;
}

export default function BudgetForm({ onSuccess }: BudgetFormProps) {
  const { user } = useAuth();
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [incomeBudget, setIncomeBudget] = useState('');
  const [expenseBudget, setExpenseBudget] = useState('');
  const [savingBudget, setSavingBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // 기존 예산이 있는지 확인
      const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user.id)
        .eq('year', year)
        .eq('month', month)
        .single();

      if (existing) {
        // 업데이트
        const { error: updateError } = await supabase
          .from('budgets')
          // @ts-ignore
          .update({
            income_budget: parseFloat(incomeBudget),
            expense_budget: parseFloat(expenseBudget),
            saving_budget: parseFloat(savingBudget),
          })
          .eq('id', (existing as any).id);

        if (updateError) throw updateError;
      } else {
        // 삽입
        // @ts-ignore
        const { error: insertError } = await supabase.from('budgets').insert({
          user_id: user.id,
          year,
          month,
          income_budget: parseFloat(incomeBudget),
          expense_budget: parseFloat(expenseBudget),
          saving_budget: parseFloat(savingBudget),
        });

        if (insertError) throw insertError;
      }

      // Reset form
      setIncomeBudget('');
      setExpenseBudget('');
      setSavingBudget('');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || '예산 설정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">월별 예산 설정</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 연월 선택 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="year" className="block text-sm font-medium text-gray-700">
              연도
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {[...Array(5)].map((_, i) => {
                const y = currentDate.getFullYear() - 2 + i;
                return (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <label htmlFor="month" className="block text-sm font-medium text-gray-700">
              월
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}월
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 수입 예산 */}
        <div>
          <label htmlFor="income-budget" className="block text-sm font-medium text-gray-700">
            수입 예산
          </label>
          <input
            type="number"
            id="income-budget"
            required
            min="0"
            step="1000"
            value={incomeBudget}
            onChange={(e) => setIncomeBudget(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* 지출 예산 */}
        <div>
          <label htmlFor="expense-budget" className="block text-sm font-medium text-gray-700">
            지출 예산
          </label>
          <input
            type="number"
            id="expense-budget"
            required
            min="0"
            step="1000"
            value={expenseBudget}
            onChange={(e) => setExpenseBudget(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* 저축 예산 */}
        <div>
          <label htmlFor="saving-budget" className="block text-sm font-medium text-gray-700">
            저축 예산
          </label>
          <input
            type="number"
            id="saving-budget"
            required
            min="0"
            step="1000"
            value={savingBudget}
            onChange={(e) => setSavingBudget(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '저장 중...' : '예산 저장'}
        </button>
      </form>
    </div>
  );
}
