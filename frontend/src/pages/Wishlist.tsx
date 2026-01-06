import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import WishlistForm from '../components/WishlistForm';
import WishlistItem from '../components/WishlistItem';
import type { WishlistItem as WishlistItemType } from '../types/database';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Inbox } from 'lucide-react';

export default function Wishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'purchased'>('active');

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

  // 위시리스트 목표 달성 알림
  const wishlistAlerts = [];

  // 개별 아이템 목표 달성 확인
  const achievedItems = items.filter((item) => {
    if (item.is_purchased) return false;
    const progress = item.price > 0 ? (item.saved_amount / item.price) * 100 : 0;
    return progress >= 100;
  });

  if (achievedItems.length > 0) {
    wishlistAlerts.push({
      variant: 'success' as const,
      title: '🎉 목표 달성!',
      message: `${achievedItems.length}개의 아이템이 목표 금액에 도달했습니다! 이제 구매할 수 있습니다.`,
    });
  }

  // 전체 진행률 알림
  if (overallProgress >= 75 && overallProgress < 100 && stats.activeCount > 0) {
    wishlistAlerts.push({
      variant: 'success' as const,
      title: '💪 목표에 가까워졌어요!',
      message: `전체 위시리스트의 ${overallProgress.toFixed(0)}%를 달성했습니다. 조금만 더 힘내세요!`,
    });
  } else if (overallProgress >= 50 && overallProgress < 75 && stats.activeCount > 0) {
    wishlistAlerts.push({
      variant: 'info' as const,
      title: '📈 절반 달성!',
      message: `전체 위시리스트의 ${overallProgress.toFixed(0)}%를 달성했습니다. 계속해서 저축하세요!`,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">위시리스트</h2>
        <p className="text-muted-foreground">사고 싶은 물건의 목표를 설정하고 저축하세요</p>
      </div>

      {/* 위시리스트 알림 */}
      {wishlistAlerts.length > 0 && (
        <div className="space-y-3">
          {wishlistAlerts.map((alert, index) => (
            <Alert key={index} variant={alert.variant} title={alert.title}>
              {alert.message}
            </Alert>
          ))}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">활성 아이템</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.activeCount}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 목표 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPrice.toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">현재 저축액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalSaved.toLocaleString()}원</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">남은 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalRemaining.toLocaleString()}원</div>
          </CardContent>
        </Card>
      </div>

      {/* 전체 진행률 */}
      {stats.activeCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold">전체 진행률</h3>
              <span className="text-sm text-muted-foreground">{overallProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-4">
              <div
                className="bg-primary h-4 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(overallProgress, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 필터 버튼 */}
      <div className="flex space-x-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          활성 ({stats.activeCount})
        </Button>
        <Button
          variant={filter === 'purchased' ? 'default' : 'outline'}
          onClick={() => setFilter('purchased')}
        >
          구매 완료 ({stats.purchasedCount})
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          전체 ({items.length})
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 위시리스트 추가 폼 */}
          <div className="lg:col-span-1">
            <WishlistForm onSuccess={fetchItems} />
          </div>

          {/* 위시리스트 아이템 */}
          <div className="lg:col-span-2">
            {filteredItems.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground font-medium mb-1">위시리스트가 비어있습니다</p>
                  <p className="text-sm text-muted-foreground">
                    사고 싶은 물건을 추가하고 저축 목표를 달성하세요
                  </p>
                </CardContent>
              </Card>
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
    </div>
  );
}
