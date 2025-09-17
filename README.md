# GitHub Pulse MVP

GitHub 개인 리포지토리 분석 대시보드 및 주간 리포트 생성 시스템

<br/>

## 🚀 주요 기능

### Frontend (Next.js)

- **GitHub OAuth 로그인**: NextAuth.js를 통한 안전한 인증
- **실시간 대시보드**: 14일 트래픽/스타 기반 KPI 카드
- **데이터 시각화**: Recharts를 활용한 차트 및 테이블
- **공유 기능**: OG 이미지가 포함된 공유 링크 생성
- **반응형 UI**: Tailwind CSS로 구현된 모던한 디자인

### Backend (Express.js)

- **GitHub API 통합**: REST API를 통한 리포지토리 데이터 수집
- **주간 리포트 생성**: PDF 형태의 상세 분석 리포트
- **데이터 필터링**: 사용자 소유 리포지토리만 분석
- **에러 처리**: Graceful degradation 및 레이트리밋 대응

<br/>

## 🛠️ 기술 스택

### Frontend

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **NextAuth.js** (GitHub OAuth)
- **TanStack Query** (데이터 페칭)
- **Recharts** (데이터 시각화)
- **React Icons** (아이콘)

### Backend

- **Express.js** (Node.js)
- **TypeScript**
- **Puppeteer** (PDF 생성)
- **GitHub REST API** (데이터 수집)

<br/>

## 📁 프로젝트 구조

```
github-pulse/
├── apps/
│   ├── web/                    # Next.js 프론트엔드
│   │   ├── src/
│   │   │   ├── app/            # App Router 페이지
│   │   │   ├── lib/            # 유틸리티 함수
│   │   │   └── components/     # UI 컴포넌트
│   │   └── public/             # 정적 파일
│   └── backend/                # Express.js 백엔드
│       ├── src/
│       │   ├── controllers/    # API 컨트롤러
│       │   ├── services/       # 비즈니스 로직
│       │   ├── routes/         # Express 라우트
│       │   └── types/          # TypeScript 타입
│       └── reports/            # 생성된 PDF 리포트
└── .cursor/rules/              # Cursor AI 개발 규칙
```

<br/>

## 🔧 개발 환경 설정

### 1. 환경 변수 설정

**Frontend (.env.local)**

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

**Backend (.env)**

```bash
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 2. 의존성 설치

```bash
# Frontend
cd apps/web
npm install

# Backend
cd apps/backend
npm install
```

### 3. 개발 서버 실행

```bash
# Frontend (포트 3000)
cd apps/web
npm run dev

# Backend (포트 3001)
cd apps/backend
npm run start
```

<br/>

## 📊 API 엔드포인트

### Backend API

- `GET /health` - 서버 상태 확인
- `POST /api/reports/weekly` - 주간 리포트 생성
- `GET /api/reports/download/:filename` - PDF 다운로드

### Frontend API

- `GET /api/metrics/overview` - 대시보드 메트릭 데이터

<br/>

## 🎯 주요 특징

- **모노레포 구조**: 프론트엔드와 백엔드를 하나의 저장소에서 관리
- **타입 안전성**: 전체 프로젝트에 TypeScript 적용
- **에러 처리**: 각 레이어별 적절한 에러 처리 및 사용자 피드백
- **성능 최적화**: 메모리 캐싱, 병렬 API 호출, 스켈레톤 UI
- **보안**: GitHub OAuth, 서버 사이드 API 호출, 환경변수 관리

<br/>

## 🚀 배포

- **Frontend**: Vercel 또는 AWS (정적 호스팅)
- **Backend**: AWS EC2 또는 Lambda (Node.js 런타임)
- **Database**: 불필요 (GitHub API 직접 사용)

<br/>

## 📝 개발 가이드

### 커밋 컨벤션

- `feat:` 새로운 기능
- `fix:` 버그 수정
- `chore:` 빌드, 설정 파일 수정
- `docs:` 문서 수정

### 브랜치 전략

- `main`: 프로덕션 브랜치
- `mvp`: MVP 개발 브랜치
- `feature/*`: 기능 개발 브랜치
