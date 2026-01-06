/**
 * 카드 결제 승인 이메일을 파싱하여 거래 정보를 추출하는 유틸리티
 */

import type { ParsedCardTransaction } from '../types/gmail';

/**
 * Base64로 인코딩된 이메일 본문을 디코딩
 * @param encodedData Base64 인코딩된 데이터
 * @returns 디코딩된 텍스트
 */
export function decodeEmailBody(encodedData: string): string {
  try {
    // URL-safe Base64를 일반 Base64로 변환
    const base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
    // Base64 디코딩
    const decoded = atob(base64);
    // UTF-8 디코딩
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error('이메일 디코딩 실패:', error);
    return encodedData;
  }
}

/**
 * 금액 문자열에서 숫자만 추출
 * @param amountStr 금액 문자열 (예: "5,500원", "5500원")
 * @returns 숫자 금액
 */
function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

/**
 * 날짜 문자열을 YYYY-MM-DD 형식으로 변환
 * @param dateStr 날짜 문자열 (예: "01/05", "2024-01-05", "2024.01.05")
 * @returns YYYY-MM-DD 형식 날짜
 */
function normalizeDate(dateStr: string): string {
  const currentYear = new Date().getFullYear();

  // MM/DD 형식
  if (/^\d{2}\/\d{2}$/.test(dateStr)) {
    const [month, day] = dateStr.split('/');
    return `${currentYear}-${month}-${day}`;
  }

  // YYYY-MM-DD 형식 (이미 정규화됨)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // YYYY.MM.DD 형식
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(dateStr)) {
    return dateStr.replace(/\./g, '-');
  }

  // 기본값: 오늘 날짜
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * 신한카드 이메일 파싱
 */
function parseShinhanCard(content: string): ParsedCardTransaction | null {
  try {
    // 패턴: [Web발신]\n[신한카드] 승인\nMM/DD HH:MM\n가맹점명\n결제방법 금액
    const patterns = {
      date: /(\d{2}\/\d{2})\s+(\d{2}:\d{2})/,
      merchant: /\d{2}:\d{2}\s*\n([^\n]+)\n/,
      amount: /([\d,]+)원/,
      paymentMethod: /(일시불|할부\s*\d+개월)/,
    };

    const dateMatch = content.match(patterns.date);
    const merchantMatch = content.match(patterns.merchant);
    const amountMatch = content.match(patterns.amount);
    const paymentMethodMatch = content.match(patterns.paymentMethod);

    if (!dateMatch || !merchantMatch || !amountMatch) {
      return null;
    }

    return {
      cardCompany: '신한카드',
      merchant: merchantMatch[1].trim(),
      amount: parseAmount(amountMatch[1]),
      transactionDate: normalizeDate(dateMatch[1]),
      transactionTime: dateMatch[2],
      paymentMethod: paymentMethodMatch ? paymentMethodMatch[1] : '일시불',
      rawEmailContent: content,
    };
  } catch (error) {
    console.error('신한카드 파싱 실패:', error);
    return null;
  }
}

/**
 * 삼성카드 이메일 파싱
 */
function parseSamsungCard(content: string): ParsedCardTransaction | null {
  try {
    // 패턴: [삼성카드]\n카드승인 YYYY-MM-DD HH:MM\n가맹점명\n결제방법\n금액
    const patterns = {
      datetime: /(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})/,
      merchant: /\d{2}:\d{2}\s*\n([^\n]+)\n/,
      amount: /([\d,]+)원/,
      paymentMethod: /(일시불|할부)/,
    };

    const datetimeMatch = content.match(patterns.datetime);
    const merchantMatch = content.match(patterns.merchant);
    const amountMatch = content.match(patterns.amount);
    const paymentMethodMatch = content.match(patterns.paymentMethod);

    if (!datetimeMatch || !merchantMatch || !amountMatch) {
      return null;
    }

    return {
      cardCompany: '삼성카드',
      merchant: merchantMatch[1].trim(),
      amount: parseAmount(amountMatch[1]),
      transactionDate: datetimeMatch[1],
      transactionTime: datetimeMatch[2],
      paymentMethod: paymentMethodMatch ? paymentMethodMatch[1] : '일시불',
      rawEmailContent: content,
    };
  } catch (error) {
    console.error('삼성카드 파싱 실패:', error);
    return null;
  }
}

/**
 * 현대카드 이메일 파싱
 */
function parseHyundaiCard(content: string): ParsedCardTransaction | null {
  try {
    // 패턴: 현대카드 승인\nYYYY.MM.DD HH:MM\n가맹점명\n금액 결제방법
    const patterns = {
      datetime: /(\d{4}\.\d{2}\.\d{2})\s+(\d{2}:\d{2})/,
      merchant: /\d{2}:\d{2}\s*\n([^\n]+)\n/,
      amount: /([\d,]+)원/,
      paymentMethod: /(일시불|할부)/,
    };

    const datetimeMatch = content.match(patterns.datetime);
    const merchantMatch = content.match(patterns.merchant);
    const amountMatch = content.match(patterns.amount);
    const paymentMethodMatch = content.match(patterns.paymentMethod);

    if (!datetimeMatch || !merchantMatch || !amountMatch) {
      return null;
    }

    return {
      cardCompany: '현대카드',
      merchant: merchantMatch[1].trim(),
      amount: parseAmount(amountMatch[1]),
      transactionDate: normalizeDate(datetimeMatch[1]),
      transactionTime: datetimeMatch[2],
      paymentMethod: paymentMethodMatch ? paymentMethodMatch[1] : '일시불',
      rawEmailContent: content,
    };
  } catch (error) {
    console.error('현대카드 파싱 실패:', error);
    return null;
  }
}

/**
 * 국민카드 이메일 파싱
 */
function parseKBCard(content: string): ParsedCardTransaction | null {
  try {
    // 패턴: [국민카드]\n승인 MM/DD HH:MM\n가맹점명\n금액(결제방법)
    const patterns = {
      date: /(\d{2}\/\d{2})\s+(\d{2}:\d{2})/,
      merchant: /\d{2}:\d{2}\s*\n([^\n]+)\n/,
      amount: /([\d,]+)원/,
      paymentMethod: /\((일시불|할부[^\)]*)\)/,
    };

    const dateMatch = content.match(patterns.date);
    const merchantMatch = content.match(patterns.merchant);
    const amountMatch = content.match(patterns.amount);
    const paymentMethodMatch = content.match(patterns.paymentMethod);

    if (!dateMatch || !merchantMatch || !amountMatch) {
      return null;
    }

    return {
      cardCompany: '국민카드',
      merchant: merchantMatch[1].trim(),
      amount: parseAmount(amountMatch[1]),
      transactionDate: normalizeDate(dateMatch[1]),
      transactionTime: dateMatch[2],
      paymentMethod: paymentMethodMatch ? paymentMethodMatch[1] : '일시불',
      rawEmailContent: content,
    };
  } catch (error) {
    console.error('국민카드 파싱 실패:', error);
    return null;
  }
}

/**
 * 하나카드 이메일 파싱
 */
function parseHanaCard(content: string): ParsedCardTransaction | null {
  try {
    // 패턴: [하나카드] 승인\nMM/DD HH:MM\n가맹점명\n금액 결제방법
    const patterns = {
      date: /(\d{2}\/\d{2})\s+(\d{2}:\d{2})/,
      merchant: /\d{2}:\d{2}\s*\n([^\n]+)\n/,
      amount: /([\d,]+)원/,
      paymentMethod: /(일시불|할부)/,
    };

    const dateMatch = content.match(patterns.date);
    const merchantMatch = content.match(patterns.merchant);
    const amountMatch = content.match(patterns.amount);
    const paymentMethodMatch = content.match(patterns.paymentMethod);

    if (!dateMatch || !merchantMatch || !amountMatch) {
      return null;
    }

    return {
      cardCompany: '하나카드',
      merchant: merchantMatch[1].trim(),
      amount: parseAmount(amountMatch[1]),
      transactionDate: normalizeDate(dateMatch[1]),
      transactionTime: dateMatch[2],
      paymentMethod: paymentMethodMatch ? paymentMethodMatch[1] : '일시불',
      rawEmailContent: content,
    };
  } catch (error) {
    console.error('하나카드 파싱 실패:', error);
    return null;
  }
}

/**
 * 이메일 본문에서 카드 결제 정보 추출
 * @param emailBody 이메일 본문
 * @returns 파싱된 카드 거래 정보 또는 null
 */
export function extractCardInfo(emailBody: string): ParsedCardTransaction | null {
  // 이메일 본문 정규화 (공백, 줄바꿈 정리)
  const normalized = emailBody.trim();

  // 각 카드사별 파서 시도
  const parsers = [
    { name: '신한카드', fn: parseShinhanCard, keywords: ['신한카드', 'shinhan'] },
    { name: '삼성카드', fn: parseSamsungCard, keywords: ['삼성카드', 'samsung'] },
    { name: '현대카드', fn: parseHyundaiCard, keywords: ['현대카드', 'hyundai'] },
    { name: '국민카드', fn: parseKBCard, keywords: ['국민카드', 'KB', 'kbcard'] },
    { name: '하나카드', fn: parseHanaCard, keywords: ['하나카드', 'hana'] },
  ];

  // 이메일 본문에서 카드사 키워드 찾기
  for (const parser of parsers) {
    const hasKeyword = parser.keywords.some(keyword =>
      normalized.toLowerCase().includes(keyword.toLowerCase())
    );

    if (hasKeyword) {
      const result = parser.fn(normalized);
      if (result) {
        console.log(`${parser.name} 파싱 성공:`, result);
        return result;
      }
    }
  }

  // 모든 파서 실패 시 null 반환
  console.log('카드 정보 파싱 실패');
  return null;
}

/**
 * 여러 이메일을 일괄 파싱
 * @param emails 이메일 본문 배열
 * @returns 파싱된 거래 정보 배열
 */
export function extractMultipleCardInfo(emails: string[]): ParsedCardTransaction[] {
  const results: ParsedCardTransaction[] = [];

  for (const email of emails) {
    const parsed = extractCardInfo(email);
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}
