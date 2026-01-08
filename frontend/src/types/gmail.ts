/**
 * Gmail API 연동을 위한 타입 정의
 */

/**
 * 파싱된 카드 거래 정보
 */
export interface ParsedCardTransaction {
  /** 카드사 이름 (예: 신한카드, 삼성카드) */
  cardCompany: string;

  /** 가맹점명 (예: 스타벅스 강남점) */
  merchant: string;

  /** 결제 금액 */
  amount: number;

  /** 거래 날짜 (YYYY-MM-DD) */
  transactionDate: string;

  /** 거래 시간 (HH:MM) - 있으면 */
  transactionTime?: string;

  /** 결제 방법 (일시불, 할부 등) */
  paymentMethod?: string;

  /** 원본 이메일 내용 (확인용) */
  rawEmailContent: string;
}

/**
 * Gmail API에서 반환하는 메시지 구조
 */
export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body: { data?: string };
    parts?: Array<{
      mimeType?: string;
      body: { data?: string };
      parts?: Array<{
        mimeType?: string;
        body: { data?: string };
      }>;
    }>;
  };
}

/**
 * Gmail 메시지 목록 응답
 */
export interface GmailMessageListResponse {
  messages: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate: number;
}

/**
 * Gmail 인증 상태
 */
export interface GmailAuthStatus {
  isAuthenticated: boolean;
  email?: string;
  lastSyncTime?: string;
}
