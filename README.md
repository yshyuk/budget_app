# Budget App

개인 예산 관리를 위한 웹 애플리케이션입니다. React, TypeScript, Supabase를 사용하여 구축되었습니다.

## 기능

- 수입/지출 추적
- 카테고리별 분류
- 예산 설정 및 관리
- 통계 및 차트 시각화
- 사용자 인증 (Supabase Auth)

## 기술 스택

### Frontend
- **Vite** - 빌드 도구
- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링
- **Recharts** - 차트 라이브러리
- **date-fns** - 날짜 처리

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL 데이터베이스
  - 인증 시스템
  - Row Level Security (RLS)

## 프로젝트 구조

```
budget_app/
├── database/
│   └── schema.sql          # Supabase 데이터베이스 스키마
├── frontend/
│   ├── src/
│   │   ├── components/     # React 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── lib/            # 유틸리티 및 설정
│   │   └── types/          # TypeScript 타입 정의
│   ├── .env.example        # 환경 변수 템플릿
│   └── package.json
└── README.md
```

## 설치 방법

### 1. 저장소 클론

```bash
git clone https://github.com/yshyuk/budget_app.git
cd budget_app
```

### 2. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. `database/schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행
3. 프로젝트 설정에서 API URL과 anon key 확인

### 3. 환경 변수 설정

```bash
cd frontend
cp .env.example .env
```

`.env` 파일을 열어 Supabase 정보를 입력:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. 의존성 설치

```bash
npm install
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`을 열어 앱을 확인할 수 있습니다.

## 빌드

프로덕션 빌드를 생성하려면:

```bash
npm run build
```

빌드된 파일은 `dist/` 디렉토리에 생성됩니다.

## 데이터베이스 스키마

주요 테이블:

- **users** - 사용자 정보
- **categories** - 수입/지출 카테고리
- **transactions** - 거래 내역
- **budgets** - 예산 설정

자세한 스키마는 `database/schema.sql` 파일을 참조하세요.

## 라이선스

MIT

## 기여

이슈 및 풀 리퀘스트를 환영합니다!
