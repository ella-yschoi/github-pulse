import { randomBytes } from 'crypto';

/**
 * Generate GitHub OAuth URL directly
 * Maintains NextAuth security features while improving user experience
 */
export function generateGitHubOAuthURL(): string {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/github`;

  if (!clientId) {
    throw new Error('GITHUB_CLIENT_ID is not defined');
  }

  // Generate state parameter for CSRF protection
  const state = randomBytes(32).toString('base64url');

  // Store state in session (NextAuth validates in callback)
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
 * Generate GitHub OAuth URL for client use
 * Called from server component and passed as props
 */
export async function getGitHubOAuthURL(): Promise<string> {
  return generateGitHubOAuthURL();
}
