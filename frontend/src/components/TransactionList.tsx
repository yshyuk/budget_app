import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import type { Transaction } from '../types/database';

interface TransactionListProps {
  transactions: Transaction[];
  onUpdate: () => void;
}

export default function TransactionList({
  transactions,
  onUpdate,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Transaction>>({});

  const handleDelete = async (id: string) => {
    if (!confirm('이 거래를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onUpdate();
    } catch (err: any) {
      alert('삭제 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditForm({
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount,
      transaction_date: transaction.transaction_date,
      description: transaction.description,
    });
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update(editForm)
        .eq('id', id);

      if (error) throw error;

      setEditingId(null);
      setEditForm({});
      onUpdate();
    } catch (err: any) {
      alert('수정 중 오류가 발생했습니다: ' + err.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-50';
      case 'expense':
        return 'text-red-600 bg-red-50';
      case 'saving':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'income':
        return '수입';
      case 'expense':
        return '지출';
      case 'saving':
        return '저축';
      default:
        return type;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        거래 내역이 없습니다. 새 거래를 추가해보세요!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">거래 내역</h2>
      </div>

      <div className="divide-y divide-gray-200">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="p-4 hover:bg-gray-50">
            {editingId === transaction.id ? (
              // 수정 모드
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editForm.type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, type: e.target.value as any })
                    }
                    className="rounded border-gray-300 text-sm"
                  >
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                    <option value="saving">저축</option>
                  </select>
                  <input
                    type="text"
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="rounded border-gray-300 text-sm"
                    placeholder="카테고리"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="rounded border-gray-300 text-sm"
                    placeholder="금액"
                  />
                  <input
                    type="date"
                    value={editForm.transaction_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        transaction_date: e.target.value,
                      })
                    }
                    className="rounded border-gray-300 text-sm"
                  />
                </div>
                <input
                  type="text"
                  value={editForm.description || ''}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full rounded border-gray-300 text-sm"
                  placeholder="설명"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleUpdate(transaction.id)}
                    className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              // 일반 모드
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(
                        transaction.type
                      )}`}
                    >
                      {getTypeText(transaction.type)}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {transaction.category}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {transaction.amount.toLocaleString()}원
                  </p>
                  {transaction.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {transaction.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {format(new Date(transaction.transaction_date), 'PPP', {
                      locale: ko,
                    })}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
