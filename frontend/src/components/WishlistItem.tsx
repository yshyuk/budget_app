import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { WishlistItem as WishlistItemType } from '../types/database';

interface WishlistItemProps {
  item: WishlistItemType;
  onUpdate: () => void;
}

export default function WishlistItem({ item, onUpdate }: WishlistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSaving, setShowAddSaving] = useState(false);
  const [savingAmount, setSavingAmount] = useState('');
  const [editForm, setEditForm] = useState({
    item_name: item.item_name,
    price: item.price,
    priority: item.priority,
    target_date: item.target_date,
    notes: item.notes,
  });

  const progress = item.price > 0 ? (item.saved_amount / item.price) * 100 : 0;

  const getPriorityStars = (priority: number) => {
    return '⭐'.repeat(priority);
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'text-red-600';
    if (priority === 3) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const handleAddSaving = async () => {
    const amount = parseFloat(savingAmount);
    if (isNaN(amount) || amount <= 0) return;

    try {
      const newSavedAmount = item.saved_amount + amount;
      const { error } = await supabase
        .from('wishlist_items')
        // @ts-ignore
        .update({ saved_amount: newSavedAmount })
        .eq('id', item.id);

      if (error) throw error;

      setSavingAmount('');
      setShowAddSaving(false);
      onUpdate();
    } catch (err: any) {
      alert('저축 금액 추가 중 오류: ' + err.message);
    }
  };

  const handleTogglePurchased = async () => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        // @ts-ignore
        .update({ is_purchased: !item.is_purchased })
        .eq('id', item.id);

      if (error) throw error;
      onUpdate();
    } catch (err: any) {
      alert('상태 변경 중 오류: ' + err.message);
    }
  };

  const handleUpdate = async () => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        // @ts-ignore
        .update(editForm)
        .eq('id', item.id);

      if (error) throw error;

      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      alert('수정 중 오류: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 아이템을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase.from('wishlist_items').delete().eq('id', item.id);

      if (error) throw error;
      onUpdate();
    } catch (err: any) {
      alert('삭제 중 오류: ' + err.message);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-6 ${item.is_purchased ? 'opacity-60 bg-gray-50' : ''
        }`}
    >
      {isEditing ? (
        // 수정 모드
        <div className="space-y-3">
          <input
            type="text"
            value={editForm.item_name}
            onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
            className="w-full rounded border-gray-300 text-sm"
            placeholder="아이템 이름"
          />
          <input
            type="number"
            value={editForm.price}
            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
            className="w-full rounded border-gray-300 text-sm"
            placeholder="가격"
          />
          <select
            value={editForm.priority}
            onChange={(e) => setEditForm({ ...editForm, priority: parseInt(e.target.value) })}
            className="w-full rounded border-gray-300 text-sm"
          >
            <option value={5}>⭐⭐⭐⭐⭐ 매우 높음</option>
            <option value={4}>⭐⭐⭐⭐ 높음</option>
            <option value={3}>⭐⭐⭐ 보통</option>
            <option value={2}>⭐⭐ 낮음</option>
            <option value={1}>⭐ 매우 낮음</option>
          </select>
          <input
            type="date"
            value={editForm.target_date || ''}
            onChange={(e) => setEditForm({ ...editForm, target_date: e.target.value || null })}
            className="w-full rounded border-gray-300 text-sm"
          />
          <textarea
            value={editForm.notes || ''}
            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value || null })}
            className="w-full rounded border-gray-300 text-sm"
            placeholder="메모"
            rows={2}
          />
          <div className="flex space-x-2">
            <button
              onClick={handleUpdate}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              저장
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        // 일반 모드
        <>
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3
                  className={`text-lg font-bold ${item.is_purchased ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}
                >
                  {item.item_name}
                </h3>
                {item.is_purchased && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                    구매 완료
                  </span>
                )}
              </div>
              <p className={`text-sm ${getPriorityColor(item.priority)}`}>
                {getPriorityStars(item.priority)}
              </p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{item.price.toLocaleString()}원</p>
          </div>

          {/* 진행 바 */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>저축 진행</span>
              <span>
                {item.saved_amount.toLocaleString()}원 / {item.price.toLocaleString()}원
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-300 ${progress >= 100 ? 'bg-green-600' : 'bg-blue-600'
                  }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">
              {progress.toFixed(1)}% 달성
              {progress >= 100 && ' 🎉'}
            </p>
          </div>

          {/* 정보 */}
          <div className="space-y-2 mb-4">
            {item.target_date && (
              <p className="text-sm text-gray-600">
                📅 목표: {format(new Date(item.target_date), 'PPP', { locale: ko })}
              </p>
            )}
            {item.notes && <p className="text-sm text-gray-600">📝 {item.notes}</p>}
            <p className="text-sm text-gray-600">
              💰 남은 금액: {(item.price - item.saved_amount).toLocaleString()}원
            </p>
          </div>

          {/* 저축 추가 */}
          {showAddSaving ? (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                저축 금액 추가
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={savingAmount}
                  onChange={(e) => setSavingAmount(e.target.value)}
                  className="flex-1 rounded border-gray-300 text-sm"
                  placeholder="금액 입력"
                  min="0"
                  step="1000"
                />
                <button
                  onClick={handleAddSaving}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddSaving(false);
                    setSavingAmount('');
                  }}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            !item.is_purchased && (
              <button
                onClick={() => setShowAddSaving(true)}
                className="w-full mb-4 px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded hover:bg-blue-200"
              >
                💵 저축 금액 추가
              </button>
            )
          )}

          {/* 액션 버튼 */}
          <div className="flex space-x-2">
            <button
              onClick={handleTogglePurchased}
              className={`flex-1 px-3 py-1.5 text-sm rounded ${item.is_purchased
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {item.is_purchased ? '구매 취소' : '✓ 구매 완료'}
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </div>
  );
}
