# GitHub Pulse MVP

GitHub 개인 리포지토리 분석 대시보드

## 🚀 기능

- GitHub OAuth 로그인
- 14일 트래픽/스타 기반 KPI 카드
- 실시간 데이터 시각화
- 공유 가능한 OG 이미지

## 🛠️ 기술 스택

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- NextAuth.js
- TanStack Query
- Recharts

## 📁 프로젝트 구조

```
apps/web/
├── src/
│   ├── app/           # Next.js App Router
│   ├── lib/           # 유틸리티 함수
│   └── components/    # UI 컴포넌트
└── .cursor/rules/     # Cursor AI 개발 규칙 (개발 도구용)
```

## 🔧 개발 환경 설정

1. 환경 변수 설정

```bash
cp .env.local.example .env.local
# GitHub OAuth 앱 생성 후 실제 값 입력
```

2. 의존성 설치

```bash
cd apps/web
npm install
```

3. 개발 서버 실행

```bash
npm run dev
```