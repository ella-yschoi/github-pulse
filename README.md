# GitHub Pulse

A GitHub repository analytics dashboard and reporting system for personal repositories

<br/>

## 🚀 Key Features

### Frontend

- **GitHub OAuth Authentication**: Secure login with NextAuth.js
- **Analytics Dashboard**: KPI cards showing total stars, 14-day views, unique visitors, and repository count
- **Data Visualization**: Interactive line charts and top repositories table with sparkline charts
- **Sharing Capabilities**: Generate shareable links with custom OG images
- **Responsive Design**: Modern UI built with Tailwind CSS
- **Weekly Reports**: Generate and download PDF reports directly from the dashboard
- **Public Share Pages**: External pages for sharing GitHub activity stats
- **Brand Copy Generation**: Dynamic branding messages based on user metrics

### Backend

- **GitHub API Integration**: Data collection from GitHub REST API for user-owned repositories
- **PDF Report Generation**: Create detailed weekly reports using Puppeteer
- **Data Filtering**: Analyze only user-owned repositories (excludes forks and organizations)
- **Error Handling**: Graceful degradation with rate limit handling and retry logic
- **Memory Caching**: 5-minute TTL caching for improved performance
- **Health Monitoring**: Server health check endpoints

<br/>

## 🛠️ Tech Stack

### Frontend

- **Next.js 15.5.3** (App Router)
- **React 19.1.0** + **React DOM**
- **TypeScript ^5**
- **Tailwind CSS ^4**
- **NextAuth.js ^4.24.11** (GitHub OAuth)
- **TanStack Query ^5.87.4** (Data fetching)
- **Recharts ^3.2.0** (Data visualization)
- **@vercel/og ^0.8.5** (OG image generation)

### Backend

- **Express.js ^4.18.2** (Node.js)
- **TypeScript ^5.3.3**
- **Puppeteer ^21.6.1** (PDF generation)
- **Axios ^1.6.2** (HTTP client)

<br/>

## 🔧 Development Setup

### 1. Environment Variables

#### Frontend (.env.local)

```bash
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://github-pulse.vercel.app
```

#### Backend (.env)

```bash
GITHUB_TOKEN=your_github_personal_access_token
PORT=3001
FRONTEND_URL=https://github-pulse.vercel.app
```

### 2. Install Dependencies

```bash
# Root directory
npm install

# Frontend
cd apps/web
npm install

# Backend
cd apps/backend
npm install
```

### 3. Start Development Servers

```bash
# Frontend (Port 3000)
cd apps/web
npm run dev

# Backend (Port 3001)
cd apps/backend
npm run start
```
