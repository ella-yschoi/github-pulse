import { NextAuthOptions } from 'next-auth';
import GitHubProvider from 'next-auth/providers/github';

// 세션 타입 확장
declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      username?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    username?: string;
  }
}

// GitHub 프로필 타입 확장
interface GitHubProfile {
  login: string;
  id: number;
  node_id: string;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  site_admin: boolean;
  name: string;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  hireable: boolean | null;
  bio: string | null;
  twitter_username: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export const authOptions: NextAuthOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'read:user repo',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // GitHub 액세스 토큰을 JWT에 저장
      if (account?.access_token) {
        token.accessToken = account.access_token;

        // GitHub API를 통해 사용자 정보 가져오기
        try {
          const response = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `token ${account.access_token}`,
              'User-Agent': 'GitHub-Pulse-App',
            },
          });

          if (response.ok) {
            const userData = await response.json();
            token.username = userData.login;
          }
        } catch (error) {
          console.error('JWT - Error fetching GitHub user data:', error);
        }
      }

      // 프로필에서도 시도
      if (profile && 'login' in profile) {
        token.username = (profile as GitHubProfile).login;
      }

      return token;
    },
    async session({ session, token }) {
      // 세션에 GitHub 토큰과 사용자 정보 저장
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      // GitHub username을 세션에 추가
      if (token.username) {
        session.user.username = token.username;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // 로그인 성공 후 대시보드로 리다이렉트
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30일 (초 단위)
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30일 (초 단위)
  },
};
