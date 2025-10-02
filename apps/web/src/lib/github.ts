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
 * GitHub API utility function with backoff strategy
 * @param accessToken GitHub OAuth access token
 * @param path API path (e.g., "/user/repos")
 * @param init Additional fetch options
 * @param retryCount Retry count (default: 0)
 * @returns GitHub API response data
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
    // Accept both OAuth and classic tokens (`Bearer`/`token` both supported)
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

    // Parse rate limit info (handle undefined when headers are missing)
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

    // Only perform warning/blocking logic when headers exist
    if (rateLimit) {
      if (rateLimit.remaining <= 10) {
        console.warn(
          `GitHub API rate limit warning: ${rateLimit.remaining}/${rateLimit.limit} remaining`
        );
      }

      if (rateLimit.remaining === 0) {
        // Even for successful responses, if remaining count is 0, need to wait
        throw new RateLimitError(rateLimit);
      }
    }

    if (!response.ok) {
      // 429 errors are handled separately (provide minimum backoff if no headers)
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
      // Rate limit error and retryable case
      if (error instanceof RateLimitError && retryCount < 2) {
        const backoffTime = getBackoffTime(error.rateLimit!);
        console.warn(
          `Backoff due to rate limit error: ${backoffTime}ms before retry (${
            retryCount + 1
          }/2)`
        );

        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        return gh(accessToken, path, init, retryCount + 1);
      }
      throw error;
    }

    // Network errors etc.
    throw new GitHubAPIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * Calculate backoff time for rate limit errors
 * @param rateLimit Rate limit information
 * @returns Wait time (in milliseconds)
 */
export function getBackoffTime(rateLimit: RateLimitInfo): number {
  const resetTime = rateLimit.reset * 1000; // Convert Unix timestamp to milliseconds
  const now = Date.now();
  const timeUntilReset = resetTime - now;

  // If time until reset is greater than 0, use that time, otherwise minimum 30 seconds
  return Math.max(timeUntilReset + 1000, 30000); // Minimum 30 seconds, reset time + 1 second
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Check if error is a GitHub API error
 */
export function isGitHubAPIError(error: unknown): error is GitHubAPIError {
  return error instanceof GitHubAPIError;
}
