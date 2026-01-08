/**
 * 가맹점명을 기반으로 거래 카테고리를 자동으로 분류하는 유틸리티
 */

/**
 * 카테고리별 키워드 매핑
 */
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  '식비': [
    '스타벅스', '이디야', '투썸', '커피', '카페', '베이커리', '빵',
    '맥도날드', '버거킹', '롯데리아', 'KFC', '맘스터치',
    '쿠우쿠우', '아웃백', '빕스', '애슐리', '마르쉐',
    '식당', '레스토랑', '음식점', '분식', '한식', '중식', '일식', '양식',
    '치킨', '피자', '햄버거', '족발', '보쌈', '삼겹살',
    '베스킨라빈스', '배스킨', '나뚜루', '설빙',
  ],
  '교통': [
    'GS칼텍스', 'SK에너지', 'S-OIL', '현대오일뱅크', '주유소',
    '주차', '파킹', '주차장',
    '택시', '카카오T', '우버', 'Uber',
    '버스', '지하철', '전철',
    '톨게이트', '하이패스',
    '쏘카', '그린카', '렌터카',
  ],
  '쇼핑': [
    '쿠팡', '마켓컬리', 'SSG',
    '이마트', '롯데마트', '홈플러스', '코스트코',
    '다이소', '아트박스', '핫트랙스',
    '올리브영', '왓슨스', '롭스',
    '무신사', 'W컨셉', '지그재그', '에이블리',
    '네이버쇼핑', 'G마켓', '옥션', '11번가',
    '알라딘', '교보문고', '영풍문고', '예스24',
  ],
  '문화생활': [
    'CGV', '롯데시네마', '메가박스', '영화',
    '서점', '도서', '북스',
    '넷플릭스', 'Netflix', '티빙', '웨이브', '왓챠',
    '멜론', '지니', '플로', '스포티파이', 'Spotify', 'Apple Music',
    '유튜브', 'YouTube Premium',
    '교보문고', '인터파크도서',
    '스포츠센터', '헬스장', '피트니스', 'PT',
    '찜질방', '사우나', '스파',
  ],
  '의료/건강': [
    '병원', '의원', '클리닉',
    '약국', '팜',
    '치과', '한의원', '보건소',
    '피부과', '내과', '외과', '정형외과', '안과',
    '헬스', '요가', '필라테스',
    'GNC', '비타민', '영양제',
  ],
  '편의점': [
    'CU', 'GS25', '세븐일레븐', '이마트24', '미니스톱',
    '편의점',
  ],
  '통신': [
    'SKT', 'SK텔레콤', 'KT', 'LG유플러스', 'LGU+',
    '통신비', '요금',
  ],
  '생활': [
    '다이소', '이케아', 'IKEA',
    '세탁소', '크리닝',
    '미용실', '헤어샵', '네일샵',
    '반려동물', '펫샵', '동물병원',
    '꽃집', '플라워',
  ],
  '교육': [
    '학원', '영어', '수학', '학습', '교육',
    '서점', '교재', '문구',
    '온라인강의', '인강', '유튜브프리미엄',
  ],
  '여행/숙박': [
    '호텔', '모텔', '펜션', '리조트',
    '에어비앤비', 'Airbnb',
    '하나투어', '모두투어', '인터파크투어',
    '항공', '에어', '대한항공', '아시아나', '제주항공', '진에어', '티웨이',
  ],
  '공과금': [
    '전기', '수도', '가스', '관리비',
    '한국전력', '수자원공사',
  ],
  '패션': [
    '유니클로', 'UNIQLO', '자라', 'ZARA', 'H&M',
    '나이키', 'NIKE', '아디다스', 'adidas',
    '신발', '의류', '옷', '구두',
  ],
};

/**
 * 가맹점명을 분석하여 적절한 카테고리를 반환
 * @param merchantName 가맹점명
 * @returns 분류된 카테고리명
 */
export function classifyCategory(merchantName: string): string {
  // 입력값 정규화 (공백 제거, 소문자 변환)
  const normalized = merchantName.toLowerCase().trim();

  // 각 카테고리별 키워드 매칭
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // 키워드를 소문자로 변환하여 비교
      if (normalized.includes(keyword.toLowerCase())) {
        return category;
      }
    }
  }

  // 매칭되는 카테고리가 없으면 '기타' 반환
  return '기타';
}

/**
 * 여러 가맹점명에 대해 카테고리를 일괄 분류
 * @param merchants 가맹점명 배열
 * @returns 가맹점명과 카테고리 매핑 객체
 */
export function classifyMultiple(merchants: string[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const merchant of merchants) {
    result[merchant] = classifyCategory(merchant);
  }

  return result;
}

/**
 * 특정 카테고리에 속하는 키워드 목록 반환
 * @param category 카테고리명
 * @returns 키워드 배열
 */
export function getCategoryKeywords(category: string): string[] {
  return CATEGORY_KEYWORDS[category] || [];
}

/**
 * 사용 가능한 모든 카테고리 목록 반환
 * @returns 카테고리명 배열
 */
export function getAllCategories(): string[] {
  return Object.keys(CATEGORY_KEYWORDS);
}
