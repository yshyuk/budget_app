import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WishlistForm from '../components/WishlistForm';
import WishlistItem from '../components/WishlistItem';
import type { WishlistItem as WishlistItemType } from '../types/database';

export default function Wishlist() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<WishlistItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'purchased'>('active');

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/login');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const fetchItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  // 필터링
  const filteredItems = items.filter((item) => {
    if (filter === 'active') return !item.is_purchased;
    if (filter === 'purchased') return item.is_purchased;
    return true;
  });

  // 통계 계산
  const stats = items.reduce(
    (acc, item) => {
      if (!item.is_purchased) {
        acc.totalPrice += item.price;
        acc.totalSaved += item.saved_amount;
        acc.activeCount += 1;
      } else {
        acc.purchasedCount += 1;
      }
      return acc;
    },
    { totalPrice: 0, totalSaved: 0, activeCount: 0, purchasedCount: 0 }
  );

  const totalRemaining = stats.totalPrice - stats.totalSaved;
  const overallProgress = stats.totalPrice > 0 ? (stats.totalSaved / stats.totalPrice) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900">가계부</h1>
              <div className="flex space-x-4">
                <Link
                  to="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  대시보드
                </Link>
                <Link
                  to="/transactions"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/transactions')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  거래 내역
                </Link>
                <Link
                  to="/budgets"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/budgets')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  예산 관리
                </Link>
                <Link
                  to="/wishlist"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/wishlist')
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  위시리스트
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900">위시리스트</h2>
          <p className="text-gray-600 mt-1">사고 싶은 물건의 목표를 설정하고 저축하세요</p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">활성 아이템</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeCount}개</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">총 목표 금액</p>
            <p className="text-2xl font-bold text-gray-900">
              {stats.totalPrice.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">현재 저축액</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.totalSaved.toLocaleString()}원
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">남은 금액</p>
            <p className="text-2xl font-bold text-orange-600">
              {totalRemaining.toLocaleString()}원
            </p>
          </div>
        </div>

        {/* 전체 진행률 */}
        {stats.activeCount > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-900">전체 진행률</h3>
              <span className="text-sm text-gray-600">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-blue-600 h-6 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* 필터 버튼 */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            활성 ({stats.activeCount})
          </button>
          <button
            onClick={() => setFilter('purchased')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'purchased'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            구매 완료 ({stats.purchasedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            전체 ({items.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">로딩 중...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 위시리스트 추가 폼 */}
            <div className="lg:col-span-1">
              <WishlistForm onSuccess={fetchItems} />
            </div>

            {/* 위시리스트 아이템 */}
            <div className="lg:col-span-2">
              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-6 text-center">
                  <p className="text-gray-500">위시리스트가 비어있습니다.</p>
                  <p className="text-sm text-gray-400 mt-2">
                    왼쪽 폼에서 새 아이템을 추가해보세요!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <WishlistItem key={item.id} item={item} onUpdate={fetchItems} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
