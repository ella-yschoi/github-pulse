import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gh, isRateLimitError, isGitHubAPIError } from '@/lib/github';
import { cache, createGitHubCacheKey, CACHE_TTL } from '@/lib/cache';
import { makeBrandCopy } from '@/lib/brandCopy';
import { logger } from '@/lib/logger';
import type { OverviewResponse } from '@/types/api';

// Type definitions
interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  pushed_at: string;
  permissions: {
    push: boolean;
  };
}

interface TrafficViews {
  count: number;
  uniques: number;
  views: Array<{
    timestamp: string;
    count: number;
    uniques: number;
  }>;
}

interface TrafficResult {
  repo: GitHubRepo;
  traffic: TrafficViews;
}

// --- Helper functions ---

/** Fill missing dates in a 14-day window with default values */
function fillTimeseriesGaps<T extends Record<string, unknown>>(
  data: { date: string }[],
  defaults: Omit<T, 'date'>
): (T & { date: string })[] {
  const today = new Date();
  const result: (T & { date: string })[] = [];

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const existing = data.find((item) => item.date === dateStr);
    result.push({ date: dateStr, ...defaults, ...existing } as T & { date: string });
  }

  return result;
}

/** Fetch user repositories with push permission, sorted by stars */
async function fetchUserRepos(accessToken: string): Promise<GitHubRepo[]> {
  const repos = await gh(
    accessToken,
    '/user/repos?per_page=100&type=owner&sort=updated'
  );

  if (!Array.isArray(repos)) {
    throw new Error('Unable to fetch repository data.');
  }

  return repos;
}

/** Batch-fetch traffic data for top repos (max 5, 2 at a time) */
async function fetchTrafficData(
  accessToken: string,
  repos: GitHubRepo[]
): Promise<TrafficResult[]> {
  const emptyTraffic: TrafficViews = { count: 0, uniques: 0, views: [] };

  const trafficPromises = repos.slice(0, 5).map(async (repo): Promise<TrafficResult> => {
    try {
      const traffic = await gh(
        accessToken,
        `/repos/${repo.full_name}/traffic/views?per=day`
      );
      return { repo, traffic: traffic as TrafficViews };
    } catch (error) {
      if (isGitHubAPIError(error) && (error.status === 403 || error.status === 404)) {
        logger.warn(`Traffic API not accessible: ${repo.full_name} (${error.status})`);
        return { repo, traffic: emptyTraffic };
      }
      if (isRateLimitError(error)) throw error;
      logger.warn(`Traffic API error: ${repo.full_name}`, error);
      return { repo, traffic: emptyTraffic };
    }
  });

  // Process in batches of 2
  const results: TrafficResult[] = [];
  const batchSize = 2;

  for (let i = 0; i < trafficPromises.length; i += batchSize) {
    const batch = trafficPromises.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch);

    for (const r of batchResults) {
      if (r.status === 'fulfilled') results.push(r.value);
    }

    if (i + batchSize < trafficPromises.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/** Aggregate traffic results into totals, timeseries, and per-repo stats */
function aggregateMetrics(
  allRepos: GitHubRepo[],
  trafficResults: TrafficResult[]
) {
  let totalStars = 0;
  let totalViews14d = 0;
  let totalUnique14d = 0;
  const timeseriesMap = new Map<string, { views: number; unique: number }>();

  // Sum stars from all repos
  for (const repo of allRepos) {
    totalStars += repo.stargazers_count;
  }

  const topReposWithTraffic: OverviewResponse['top_repos'] = [];

  for (const { repo, traffic } of trafficResults) {
    const views14d = traffic.views.reduce((s, v) => s + v.count, 0);
    const unique14d = traffic.views.reduce((s, v) => s + v.uniques, 0);
    totalViews14d += views14d;
    totalUnique14d += unique14d;

    // Build sparkline with gap-filling
    const sparklineRaw = traffic.views.map((v) => ({
      date: new Date(v.timestamp).toISOString().split('T')[0],
      views: v.count,
    }));
    const sparkline_data = fillTimeseriesGaps<{ date: string; views: number }>(
      sparklineRaw,
      { views: 0 }
    );

    topReposWithTraffic.push({
      full_name: repo.full_name,
      stars: repo.stargazers_count,
      views_14d: views14d,
      sparkline_data,
    });

    // Merge into global timeseries
    for (const view of traffic.views) {
      const date = new Date(view.timestamp).toISOString().split('T')[0];
      const existing = timeseriesMap.get(date) || { views: 0, unique: 0 };
      timeseriesMap.set(date, {
        views: existing.views + view.count,
        unique: existing.unique + view.uniques,
      });
    }
  }

  // Sort timeseries and fill gaps
  const rawTimeseries = Array.from(timeseriesMap.entries())
    .map(([date, data]) => ({ date, views: data.views, unique: data.unique }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const timeseries = fillTimeseriesGaps<{ date: string; views: number; unique: number }>(
    rawTimeseries,
    { views: 0, unique: 0 }
  );

  // Sort top repos by views
  topReposWithTraffic.sort((a, b) => b.views_14d - a.views_14d);

  return {
    totalStars,
    totalViews14d,
    totalUnique14d,
    timeseries,
    topReposWithTraffic: topReposWithTraffic.slice(0, 5),
  };
}

// --- Route handler ---

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const accessToken = session.accessToken as string;
    const username = session.user?.username || 'unknown';

    // Check cache
    const cacheKey = createGitHubCacheKey(username, 'overview');
    const cachedData = cache.get<OverviewResponse>(cacheKey);
    if (cachedData) {
      logger.debug('Cache HIT:', cacheKey);
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Cache': 'HIT',
          'X-User': username,
        },
      });
    }

    // 1. Fetch repos
    const repos = await fetchUserRepos(accessToken);
    logger.debug(`Found ${repos.length} repos`);

    // 2. Select top repos by stars (push permission only)
    const topRepos = repos
      .filter((repo) => repo.permissions.push)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10);

    // 3. Fetch traffic data
    const trafficResults = await fetchTrafficData(accessToken, topRepos);

    // 4. Aggregate metrics
    const metrics = aggregateMetrics(repos, trafficResults);

    // 5. Generate branding copy
    const topRepoName = metrics.topReposWithTraffic[0]?.full_name || 'No repositories';
    const brandCopy = makeBrandCopy({
      starsTotal: metrics.totalStars,
      views14d: metrics.totalViews14d,
      topRepoName,
    });

    // 6. Compose response
    const responseData: OverviewResponse = {
      range: '14d',
      totals: {
        stars_total: metrics.totalStars,
        views_14d: metrics.totalViews14d,
        unique_14d: metrics.totalUnique14d,
        repos_count: repos.length,
      },
      timeseries: metrics.timeseries,
      top_repos: metrics.topReposWithTraffic,
      brand_copy: brandCopy,
    };

    // 7. Cache and return
    cache.set(cacheKey, responseData, CACHE_TTL.VERY_LONG);
    logger.debug(`Cached: ${cacheKey}`);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS',
        'X-User': username,
      },
    });
  } catch (error) {
    logger.error('Overview API Error:', error);

    if (isRateLimitError(error)) {
      const retryAfter = Math.ceil(
        (error.rateLimit?.reset || 0) - Date.now() / 1000
      );
      return NextResponse.json(
        {
          error: 'GitHub API rate limit reached. Please try again later.',
          retryAfter,
          rateLimit: {
            remaining: error.rateLimit?.remaining || 0,
            limit: error.rateLimit?.limit || 0,
            reset: error.rateLimit?.reset || 0,
          },
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Remaining': (error.rateLimit?.remaining || 0).toString(),
            'X-RateLimit-Limit': (error.rateLimit?.limit || 0).toString(),
            'X-RateLimit-Reset': (error.rateLimit?.reset || 0).toString(),
          },
        }
      );
    }

    if (isGitHubAPIError(error)) {
      return NextResponse.json(
        { error: 'GitHub API error occurred.' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Server error occurred.' },
      { status: 500 }
    );
  }
}
