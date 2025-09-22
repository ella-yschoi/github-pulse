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
 * GitHub API 호출을 위한 유틸리티 함수 (백오프 전략 포함)
 * @param accessToken GitHub OAuth 액세스 토큰
 * @param path API 경로 (예: "/user/repos")
 * @param init 추가 fetch 옵션
 * @param retryCount 재시도 횟수 (기본값: 0)
 * @returns GitHub API 응답 데이터
 */
export async function gh(
  accessToken: string,
  path: string,
  init?: RequestInit,
  retryCount: number = 0
): Promise<unknown> {
  const baseURL = 'https://api.github.com';
  const url = `${baseURL}${path}`;

  const headers = {
    // OAuth 토큰 및 classic 토큰 모두 허용 (`Bearer`/`token` 모두 수용됨)
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

    // Rate limit 정보 파싱 (헤더 부재 시 undefined 처리)
    const limitHeader = response.headers.get('X-RateLimit-Limit');
    const remainingHeader = response.headers.get('X-RateLimit-Remaining');
    const resetHeader = response.headers.get('X-RateLimit-Reset');

    const hasRateLimitHeaders = Boolean(
      limitHeader && remainingHeader && resetHeader
    );

    const rateLimit: RateLimitInfo | undefined = hasRateLimitHeaders
      ? {
          limit: parseInt(limitHeader as string, 10),
          remaining: parseInt(remainingHeader as string, 10),
          reset: parseInt(resetHeader as string, 10),
        }
      : undefined;

    // 헤더가 있을 때만 경고/차단 로직 수행
    if (rateLimit) {
      if (rateLimit.remaining <= 10) {
        console.warn(
          `GitHub API 레이트리밋 경고: ${rateLimit.remaining}/${rateLimit.limit} 남음`
        );
      }

      if (rateLimit.remaining === 0) {
        // 성공 응답이더라도 남은 횟수가 0이고, 잠시 후 요청해야 함
        throw new RateLimitError(rateLimit);
      }
    }

    if (!response.ok) {
      // 429 에러는 별도 처리 (헤더 없으면 최소 백오프 제공)
      if (response.status === 429) {
        const fallbackRateLimit: RateLimitInfo = rateLimit || {
          limit: 0,
          remaining: 0,
          reset: Math.ceil(Date.now() / 1000) + 30,
        };
        throw new RateLimitError(fallbackRateLimit);
      }

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
      // 레이트리밋 에러이고 재시도 가능한 경우
      if (error instanceof RateLimitError && retryCount < 2) {
        const backoffTime = getBackoffTime(error.rateLimit!);
        console.warn(
          `레이트리밋 에러로 인한 백오프: ${backoffTime}ms 후 재시도 (${
            retryCount + 1
          }/2)`
        );

        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return gh(accessToken, path, init, retryCount + 1);
      }
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
  const timeUntilReset = resetTime - now;

  // 리셋 시간까지의 시간이 0보다 크면 그 시간만큼, 아니면 최소 30초
  return Math.max(timeUntilReset + 1000, 30000); // 최소 30초, 리셋 시간 + 1초
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
