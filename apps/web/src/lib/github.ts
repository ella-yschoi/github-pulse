interface GitHubError {
  message: string;
  documentation_url?: string;
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public rateLimit?: RateLimitInfo
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class RateLimitError extends GitHubAPIError {
  constructor(rateLimit: RateLimitInfo) {
    super('Rate limit exceeded', 429, rateLimit);
    this.name = 'RateLimitError';
  }
}

/**
 * GitHub API 호출을 위한 유틸리티 함수
 * @param accessToken GitHub OAuth 액세스 토큰
 * @param path API 경로 (예: "/user/repos")
 * @param init 추가 fetch 옵션
 * @returns GitHub API 응답 데이터
 */
export async function gh(
  accessToken: string,
  path: string,
  init?: RequestInit
): Promise<unknown> {
  const baseURL = 'https://api.github.com';
  const url = `${baseURL}${path}`;

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'GitHub-Pulse/1.0',
    ...init?.headers,
  };

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    });

    // Rate limit 정보 파싱
    const rateLimit: RateLimitInfo = {
      limit: parseInt(response.headers.get('X-RateLimit-Limit') || '0'),
      remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
      reset: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
    };

    // Rate limit 체크
    if (rateLimit.remaining === 0) {
      throw new RateLimitError(rateLimit);
    }

    if (!response.ok) {
      const errorData: GitHubError = await response.json().catch(() => ({
        message: 'Unknown error occurred',
      }));

      throw new GitHubAPIError(
        errorData.message || `HTTP ${response.status}`,
        response.status,
        rateLimit
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      throw error;
    }

    // 네트워크 에러 등
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * 레이트리밋 에러 시 백오프 시간 계산
 * @param rateLimit 레이트리밋 정보
 * @returns 대기 시간 (밀리초)
 */
export function getBackoffTime(rateLimit: RateLimitInfo): number {
  const resetTime = rateLimit.reset * 1000; // Unix timestamp를 밀리초로 변환
  const now = Date.now();
  return Math.max(resetTime - now + 1000, 60000); // 최소 60초
}

/**
 * 에러가 레이트리밋 에러인지 확인
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * 에러가 GitHub API 에러인지 확인
 */
export function isGitHubAPIError(error: unknown): error is GitHubAPIError {
  return error instanceof GitHubAPIError;
}
