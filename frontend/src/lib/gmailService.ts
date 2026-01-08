/**
 * Gmail API 연동 서비스
 * OAuth 인증, 이메일 검색 및 파싱 기능 제공
 */

import { gapi } from 'gapi-script';
import type { GmailMessage, GmailMessageListResponse, GmailAuthStatus, ParsedCardTransaction } from '../types/gmail';
import { decodeEmailBody, extractCardInfo } from './emailParser';
import { classifyCategory } from './categoryClassifier';

// Gmail API 설정
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest';
const SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';

/**
 * Google API 클라이언트 초기화
 */
export async function initGoogleApi(): Promise<void> {
  return new Promise((resolve, reject) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      reject(new Error('Google Client ID가 설정되지 않았습니다. .env 파일을 확인하세요.'));
      return;
    }

    gapi.load('client:auth2', async () => {
      try {
        await gapi.client.init({
          clientId,
          discoveryDocs: [DISCOVERY_DOC],
          scope: SCOPES,
        });
        console.log('Google API 초기화 완료');
        resolve();
      } catch (error) {
        console.error('Google API 초기화 실패:', error);
        reject(error);
      }
    });
  });
}

/**
 * Gmail 인증 (OAuth 팝업)
 * @returns 인증 성공 여부
 */
export async function authenticateGmail(): Promise<boolean> {
  try {
    const auth = gapi.auth2.getAuthInstance();

    if (!auth) {
      throw new Error('Google Auth가 초기화되지 않았습니다.');
    }

    // 이미 로그인되어 있는지 확인
    if (auth.isSignedIn.get()) {
      console.log('이미 Gmail에 로그인되어 있습니다.');
      return true;
    }

    // OAuth 팝업으로 로그인
    await auth.signIn();

    // 인증 상태 로컬 스토리지에 저장
    const user = auth.currentUser.get();
    const profile = user.getBasicProfile();

    const authStatus: GmailAuthStatus = {
      isAuthenticated: true,
      email: profile.getEmail(),
      lastSyncTime: new Date().toISOString(),
    };

    localStorage.setItem('gmailAuthStatus', JSON.stringify(authStatus));

    console.log('Gmail 인증 성공:', profile.getEmail());
    return true;
  } catch (error: any) {
    console.error('Gmail 인증 실패:', error);

    if (error.error === 'popup_closed_by_user') {
      throw new Error('로그인 팝업이 닫혔습니다. 다시 시도해주세요.');
    }

    throw new Error('Gmail 인증에 실패했습니다.');
  }
}

/**
 * Gmail 연동 해제
 */
export async function signOutGmail(): Promise<void> {
  try {
    const auth = gapi.auth2.getAuthInstance();

    if (auth && auth.isSignedIn.get()) {
      await auth.signOut();
    }

    // 로컬 스토리지에서 인증 정보 제거
    localStorage.removeItem('gmailAuthStatus');

    console.log('Gmail 연동 해제 완료');
  } catch (error) {
    console.error('Gmail 연동 해제 실패:', error);
    throw error;
  }
}

/**
 * Gmail 인증 상태 확인
 * @returns 인증 상태 정보
 */
export function getAuthStatus(): GmailAuthStatus {
  try {
    const auth = gapi.auth2?.getAuthInstance();

    if (auth && auth.isSignedIn.get()) {
      const user = auth.currentUser.get();
      const profile = user.getBasicProfile();

      return {
        isAuthenticated: true,
        email: profile.getEmail(),
        lastSyncTime: localStorage.getItem('gmailLastSync') || undefined,
      };
    }

    // 로컬 스토리지에서 복원 시도
    const saved = localStorage.getItem('gmailAuthStatus');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
  }

  return { isAuthenticated: false };
}

/**
 * 카드 승인 이메일 검색
 * @param startDate 시작 날짜 (YYYY-MM-DD)
 * @param endDate 종료 날짜 (YYYY-MM-DD)
 * @param maxResults 최대 결과 수 (기본: 100)
 * @returns 이메일 ID 목록
 */
export async function searchCardEmails(
  startDate: string,
  endDate: string,
  maxResults: number = 100
): Promise<string[]> {
  try {
    // 날짜 형식 변환 (YYYY-MM-DD -> YYYY/MM/DD)
    const formattedStartDate = startDate.replace(/-/g, '/');
    const formattedEndDate = endDate.replace(/-/g, '/');

    // 검색 쿼리: 카드 승인 관련 키워드 + 날짜 범위
    const query = `subject:(카드승인 OR 카드결제 OR 승인 OR 결제) after:${formattedStartDate} before:${formattedEndDate}`;

    console.log('이메일 검색 쿼리:', query);

    const response = await gapi.client.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    const messages = (response.result as GmailMessageListResponse).messages || [];
    const messageIds = messages.map(msg => msg.id);

    console.log(`${messageIds.length}개의 이메일 발견`);

    return messageIds;
  } catch (error: any) {
    console.error('이메일 검색 실패:', error);

    if (error.status === 401) {
      throw new Error('Gmail 인증이 만료되었습니다. 다시 로그인해주세요.');
    }

    throw new Error('이메일 검색에 실패했습니다.');
  }
}

/**
 * 이메일 내용 가져오기
 * @param messageId 이메일 ID
 * @returns 이메일 본문 텍스트
 */
export async function getEmailContent(messageId: string): Promise<string> {
  try {
    const response = await gapi.client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.result as GmailMessage;
    const payload = message.payload;

    // 이메일 본문 추출 (단순 텍스트 또는 멀티파트)
    let body = '';

    if (payload.body.data) {
      body = decodeEmailBody(payload.body.data);
    } else if (payload.parts) {
      // 멀티파트 이메일인 경우
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += decodeEmailBody(part.body.data);
        } else if (part.parts) {
          // 중첩된 파트
          for (const subPart of part.parts) {
            if (subPart.mimeType === 'text/plain' && subPart.body.data) {
              body += decodeEmailBody(subPart.body.data);
            }
          }
        }
      }
    }

    return body;
  } catch (error) {
    console.error(`이메일 내용 가져오기 실패 (ID: ${messageId}):`, error);
    return '';
  }
}

/**
 * 이메일 파싱 및 거래 정보 추출
 * @param messageIds 이메일 ID 배열
 * @param onProgress 진행 상황 콜백 (현재 인덱스, 전체 개수)
 * @returns 파싱된 거래 정보 배열
 */
export async function parseEmailsToTransactions(
  messageIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<ParsedCardTransaction[]> {
  const transactions: ParsedCardTransaction[] = [];

  for (let i = 0; i < messageIds.length; i++) {
    try {
      // 진행 상황 콜백
      if (onProgress) {
        onProgress(i + 1, messageIds.length);
      }

      // 이메일 내용 가져오기
      const content = await getEmailContent(messageIds[i]);

      if (!content) {
        console.log(`이메일 ID ${messageIds[i]}: 본문이 비어있음`);
        continue;
      }

      // 카드 정보 파싱
      const parsed = extractCardInfo(content);

      if (parsed) {
        transactions.push(parsed);
      } else {
        console.log(`이메일 ID ${messageIds[i]}: 파싱 실패`);
      }

      // Rate limiting 방지 (100ms 딜레이)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`이메일 ID ${messageIds[i]} 처리 실패:`, error);
    }
  }

  console.log(`총 ${transactions.length}개의 거래 파싱 성공`);

  // 마지막 동기화 시간 저장
  localStorage.setItem('gmailLastSync', new Date().toISOString());

  return transactions;
}

/**
 * 파싱된 거래에 카테고리 자동 분류
 * @param transactions 파싱된 거래 배열
 * @returns 카테고리가 추가된 거래 배열
 */
export function addCategoriesToTransactions(
  transactions: ParsedCardTransaction[]
): Array<ParsedCardTransaction & { suggestedCategory: string }> {
  return transactions.map(transaction => ({
    ...transaction,
    suggestedCategory: classifyCategory(transaction.merchant),
  }));
}
