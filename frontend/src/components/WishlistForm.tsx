import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface WishlistFormProps {
  onSuccess?: () => void;
}

export default function WishlistForm({ onSuccess }: WishlistFormProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [itemName, setItemName] = useState('');
  const [price, setPrice] = useState('');
  const [priority, setPriority] = useState(3);
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // @ts-ignore
      const { error: insertError } = await supabase.from('wishlist_items').insert({
        user_id: user.id,
        item_name: itemName,
        price: parseFloat(price),
        priority,
        target_date: targetDate || null,
        notes: notes || null,
      });

      if (insertError) throw insertError;

      // Reset form
      setItemName('');
      setPrice('');
      setPriority(3);
      setTargetDate('');
      setNotes('');

      toast.success('위시리스트 아이템이 추가되었습니다.');

      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || '위시리스트 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">위시리스트 추가</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이템 이름 */}
        <div>
          <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
            아이템 이름
          </label>
          <input
            type="text"
            id="item-name"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="예: 노트북, 여행, 가방 등"
          />
        </div>

        {/* 가격 */}
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            목표 금액
          </label>
          <input
            type="number"
            id="price"
            required
            min="0"
            step="1000"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        {/* 우선순위 */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            우선순위
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(parseInt(e.target.value))}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value={5}>⭐⭐⭐⭐⭐ 매우 높음</option>
            <option value={4}>⭐⭐⭐⭐ 높음</option>
            <option value={3}>⭐⭐⭐ 보통</option>
            <option value={2}>⭐⭐ 낮음</option>
            <option value={1}>⭐ 매우 낮음</option>
          </select>
        </div>

        {/* 목표 날짜 */}
        <div>
          <label htmlFor="target-date" className="block text-sm font-medium text-gray-700">
            목표 날짜 (선택)
          </label>
          <input
            type="date"
            id="target-date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        {/* 메모 */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            메모 (선택)
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="아이템에 대한 메모를 입력하세요"
          />
        </div>

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '추가 중...' : '위시리스트 추가'}
        </button>
      </form>
    </div>
  );
}
