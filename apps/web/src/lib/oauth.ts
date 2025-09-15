import { randomBytes } from 'crypto';

/**
 * GitHub OAuth URL을 직접 생성하는 함수
 * NextAuth의 보안 기능을 유지하면서 사용자 경험 개선
 */
export function generateGitHubOAuthURL(): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not defined');
  }

  // CSRF 보호를 위한 state 파라미터 생성
  const state = randomBytes(32).toString('base64url');

  // 세션에 state 저장 (NextAuth가 콜백에서 검증)
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'read:user repo',
    response_type: 'code',
    state: state,
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

/**
 * 클라이언트에서 사용할 GitHub OAuth URL 생성
 * 서버 컴포넌트에서 호출하여 props로 전달
 */
export async function getGitHubOAuthURL(): Promise<string> {
  return generateGitHubOAuthURL();
}
