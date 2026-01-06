import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Mail, CheckCircle, Calendar, Loader2 } from 'lucide-react';
import {
  initGoogleApi,
  authenticateGmail,
  signOutGmail,
  getAuthStatus,
  searchCardEmails,
  parseEmailsToTransactions,
  addCategoriesToTransactions,
} from '../lib/gmailService';
import type { ParsedCardTransaction } from '../types/gmail';

export default function GmailIntegration() {
  const { user } = useAuth();
  const toast = useToast();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<
    Array<ParsedCardTransaction & { suggestedCategory: string; selected: boolean }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<Record<number, string>>({});

  // Google API 초기화
  useEffect(() => {
    const init = async () => {
      try {
        await initGoogleApi();
        setIsInitialized(true);

        // 인증 상태 확인
        const authStatus = getAuthStatus();
        setIsAuthenticated(authStatus.isAuthenticated);
        setUserEmail(authStatus.email || '');
        setLastSyncTime(authStatus.lastSyncTime || '');
      } catch (error: any) {
        console.error('초기화 실패:', error);
        toast.error(error.message || 'Google API 초기화에 실패했습니다.');
      }
    };

    init();
  }, [toast]);

  // Gmail 계정 연동
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Gmail 계정에 연결 중...');

      const success = await authenticateGmail();

      if (success) {
        const authStatus = getAuthStatus();
        setIsAuthenticated(true);
        setUserEmail(authStatus.email || '');
        toast.success('Gmail 계정 연동 완료!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Gmail 연동에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Gmail 연동 해제
  const handleDisconnect = async () => {
    if (!confirm('Gmail 연동을 해제하시겠습니까?')) return;

    try {
      await signOutGmail();
      setIsAuthenticated(false);
      setUserEmail('');
      setLastSyncTime('');
      setParsedTransactions([]);
      toast.success('Gmail 연동이 해제되었습니다.');
    } catch (error: any) {
      toast.error('연동 해제에 실패했습니다.');
    }
  };

  // 이메일에서 거래 내역 가져오기
  const handleFetchEmails = async () => {
    try {
      setIsLoading(true);
      setParsedTransactions([]);

      // 1. 이메일 검색
      setLoadingMessage('카드 승인 이메일 검색 중...');
      const messageIds = await searchCardEmails(startDate, endDate);

      if (messageIds.length === 0) {
        toast.info('선택한 기간에 카드 승인 이메일이 없습니다.');
        setIsLoading(false);
        setLoadingMessage('');
        return;
      }

      // 2. 이메일 파싱
      setLoadingMessage(`${messageIds.length}개 이메일 처리 중...`);
      const transactions = await parseEmailsToTransactions(
        messageIds,
        (current, total) => {
          setLoadingMessage(`이메일 처리 중: ${current}/${total}`);
        }
      );

      // 3. 카테고리 자동 분류
      const transactionsWithCategories = addCategoriesToTransactions(transactions).map(t => ({
        ...t,
        selected: true, // 기본적으로 모두 선택
      }));

      setParsedTransactions(transactionsWithCategories);

      // 초기 카테고리 설정
      const initialCategories: Record<number, string> = {};
      transactionsWithCategories.forEach((t, index) => {
        initialCategories[index] = t.suggestedCategory;
      });
      setSelectedCategories(initialCategories);

      toast.success(`${transactionsWithCategories.length}개의 거래를 찾았습니다!`);
    } catch (error: any) {
      toast.error(error.message || '이메일 가져오기에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // 선택한 거래 저장
  const handleSaveTransactions = async () => {
    const selectedTransactions = parsedTransactions.filter(t => t.selected);

    if (selectedTransactions.length === 0) {
      toast.error('저장할 거래를 선택해주세요.');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingMessage(`${selectedTransactions.length}개 거래 저장 중...`);

      // Supabase에 거래 추가
      const transactionsToInsert = selectedTransactions.map((t) => {
        const index = parsedTransactions.indexOf(t);
        return {
          user_id: user.id,
          type: 'expense' as const,
          category: selectedCategories[index] || t.suggestedCategory,
          amount: t.amount,
          transaction_date: t.transactionDate,
          description: `${t.cardCompany} - ${t.merchant}${t.transactionTime ? ` (${t.transactionTime})` : ''}${
            t.paymentMethod ? ` - ${t.paymentMethod}` : ''
          }`,
        };
      });

      // @ts-ignore
      const { error } = await supabase.from('transactions').insert(transactionsToInsert);

      if (error) throw error;

      toast.success(`${selectedTransactions.length}개의 거래가 저장되었습니다!`);
      setParsedTransactions([]);
      setSelectedCategories({});
    } catch (error: any) {
      toast.error(error.message || '거래 저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // 체크박스 토글
  const toggleTransaction = (index: number) => {
    setParsedTransactions(prev =>
      prev.map((t, i) => (i === index ? { ...t, selected: !t.selected } : t))
    );
  };

  // 카테고리 변경
  const updateCategory = (index: number, category: string) => {
    setSelectedCategories(prev => ({ ...prev, [index]: category }));
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gmail 연동</h2>
        <p className="text-muted-foreground">
          카드 결제 승인 이메일을 자동으로 파싱하여 거래 내역에 추가하세요
        </p>
      </div>

      {/* 보안 안내 */}
      <Alert variant="info" title="안전한 연동">
        <ul className="text-sm list-disc list-inside space-y-1">
          <li>Gmail 읽기 권한만 사용하며, 이메일을 수정하거나 전송하지 않습니다</li>
          <li>이메일 내용은 브라우저에서만 처리되며 외부로 전송되지 않습니다</li>
          <li>언제든지 연동을 해제할 수 있습니다</li>
        </ul>
      </Alert>

      {/* Gmail 계정 연동 */}
      <Card>
        <CardHeader>
          <CardTitle>Gmail 계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">Gmail 계정을 연동해주세요</p>
              <Button onClick={handleConnect} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    연결 중...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Gmail 계정 연동
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">{userEmail}</p>
                    {lastSyncTime && (
                      <p className="text-sm text-muted-foreground">
                        마지막 동기화: {new Date(lastSyncTime).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  연동 해제
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 이메일 불러오기 */}
      {isAuthenticated && (
        <Card>
          <CardHeader>
            <CardTitle>이메일에서 거래 내역 가져오기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="start-date" className="block text-sm font-medium mb-2">
                  시작 날짜
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    id="start-date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="end-date" className="block text-sm font-medium mb-2">
                  종료 날짜
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    id="end-date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full pl-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleFetchEmails} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  이메일에서 거래 내역 가져오기
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 파싱 결과 미리보기 */}
      {parsedTransactions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>파싱된 거래 내역 ({parsedTransactions.filter(t => t.selected).length}개 선택)</CardTitle>
              <Button onClick={handleSaveTransactions} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '선택한 거래 저장'
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {parsedTransactions.map((transaction, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={transaction.selected}
                    onChange={() => toggleTransaction(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{transaction.merchant}</p>
                        <p className="text-sm text-muted-foreground">
                          {transaction.cardCompany} · {transaction.transactionDate}
                          {transaction.transactionTime && ` ${transaction.transactionTime}`}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-red-600">
                        {transaction.amount.toLocaleString()}원
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm">카테고리:</label>
                      <input
                        type="text"
                        value={selectedCategories[index] || transaction.suggestedCategory}
                        onChange={e => updateCategory(index, e.target.value)}
                        className="text-sm border rounded px-2 py-1"
                        placeholder="카테고리"
                      />
                      {transaction.paymentMethod && (
                        <span className="text-sm text-muted-foreground">· {transaction.paymentMethod}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
