import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { TransactionType } from '../types/database';

interface TransactionFormProps {
  onSuccess?: () => void;
}

export default function TransactionForm({ onSuccess }: TransactionFormProps) {
  const { user } = useAuth();
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setLoading(true);

    try {
      // @ts-ignore
      const { error: insertError } = await supabase.from('transactions').insert({
        user_id: user.id,
        type,
        category,
        amount: parseFloat(amount),
        transaction_date: transactionDate,
        description: description || null,
      });

      if (insertError) throw insertError;

      // Reset form
      setCategory('');
      setAmount('');
      setDescription('');
      setTransactionDate(new Date().toISOString().split('T')[0]);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || '거래 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">새 거래 추가</h2>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 거래 유형 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            거래 유형
          </label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="income"
                checked={type === 'income'}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-green-600">수입</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="expense"
                checked={type === 'expense'}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-red-600">지출</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                value="saving"
                checked={type === 'saving'}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2 text-blue-600">저축</span>
            </label>
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            카테고리
          </label>
          <input
            type="text"
            id="category"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="예: 식비, 월급, 저축 등"
          />
        </div>

        {/* 금액 */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700"
          >
            금액
          </label>
          <input
            type="number"
            id="amount"
            required
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* 날짜 */}
        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700"
          >
            날짜
          </label>
          <input
            type="date"
            id="date"
            required
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        {/* 설명 */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            설명 (선택)
          </label>
          <textarea
            id="description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="거래에 대한 메모를 입력하세요"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '추가 중...' : '거래 추가'}
        </button>
      </form>
    </div>
  );
}
