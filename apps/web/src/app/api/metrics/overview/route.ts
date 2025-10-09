import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gh, isRateLimitError, isGitHubAPIError } from '@/lib/github';
import { cache, createGitHubCacheKey, CACHE_TTL } from '@/lib/cache';
import { makeBrandCopy } from '@/lib/brandCopy';

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

interface OverviewResponse {
  range: '14d';
  totals: {
    stars_total: number;
    views_14d: number;
    unique_14d: number;
    repos_count: number;
  };
  timeseries: { date: string; views: number; unique: number }[];
  top_repos: {
    full_name: string;
    stars: number;
    views_14d: number;
    sparkline_data: { date: string; views: number }[];
  }[];
  brand_copy: string;
}

export async function GET() {
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Authentication required.' },
        { status: 401 }
      );
    }

    const accessToken = session.accessToken as string;
    const username = session.user?.username || 'unknown';

    // Log session info for debugging
    console.log('Session info:', {
      username: session.user?.username,
      email: session.user?.email,
      name: session.user?.name,
    });

    // Check cache (use longer TTL)
    const cacheKey = createGitHubCacheKey(username, 'overview');
    const cachedData = cache.get<OverviewResponse>(cacheKey);
    if (cachedData) {
      console.log('Returning data from cache:', cacheKey);
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Cache': 'HIT',
          'X-User': username,
        },
      });
    }

    // 1. Get user repository list
    console.log(
      `Starting user repository list query for username: ${username}...`
    );

    // Temporary: Use mock data when GitHub Personal Access Token is not available
    if (!accessToken || accessToken === 'undefined') {
      console.warn('GitHub Personal Access Token is not set. Using mock data');
      const mockData: OverviewResponse = {
        range: '14d',
        totals: {
          stars_total: 0,
          views_14d: 0,
          unique_14d: 0,
          repos_count: 0,
        },
        timeseries: [],
        top_repos: [],
        brand_copy: 'Please set up GitHub Personal Access Token',
      };

      return NextResponse.json(mockData, {
        headers: {
          'Cache-Control': 'private, no-cache, no-store, must-revalidate',
          'X-Cache': 'MOCK',
          'X-User': username,
        },
      });
    }

    const repos = await gh(
      accessToken,
      '/user/repos?per_page=100&type=owner&sort=updated'
    );
    console.log(
      `Found ${
        Array.isArray(repos) ? repos.length : 0
      } repositories for user: ${username}`
    );

    if (!Array.isArray(repos)) {
      throw new Error('Unable to fetch repository data.');
    }

    // 2. Select top repositories (TOP 10 by stars)
    const topRepos = repos
      .filter((repo: GitHubRepo) => repo.permissions.push) // Only repos with push permission
      .sort(
        (a: GitHubRepo, b: GitHubRepo) =>
          b.stargazers_count - a.stargazers_count
      )
      .slice(0, 10);

    // 3. Parallel traffic data query (limit to max 5 for API call optimization)
    const limitedTopRepos = topRepos.slice(0, 5);
    console.log(
      `Starting traffic data query: ${limitedTopRepos.length} repositories`
    );

    const trafficPromises = limitedTopRepos.map(async (repo: GitHubRepo) => {
      try {
        const traffic = await gh(
          accessToken,
          `/repos/${repo.full_name}/traffic/views?per=day`
        );
        return {
          repo,
          traffic: traffic as TrafficViews,
        };
      } catch (error) {
        // Return empty data when Traffic API is not accessible
        if (
          isGitHubAPIError(error) &&
          (error.status === 403 || error.status === 404)
        ) {
          console.warn(
            `Traffic API not accessible: ${repo.full_name} (${error.status})`
          );
          return {
            repo,
            traffic: {
              count: 0,
              uniques: 0,
              views: [],
            } as TrafficViews,
          };
        }
        // Propagate rate limit errors to upper level
        if (isRateLimitError(error)) {
          throw error;
        }
        // Handle other errors with empty data
        console.warn(`Traffic API error: ${repo.full_name}`, error);
        return {
          repo,
          traffic: {
            count: 0,
            uniques: 0,
            views: [],
          } as TrafficViews,
        };
      }
    });

    // Process API calls in batches (2 at a time)
    const trafficResults = [];
    const batchSize = 2;

    console.log(
      `Starting batch processing: ${trafficPromises.length} requests in batches of ${batchSize}`
    );

    for (let i = 0; i < trafficPromises.length; i += batchSize) {
      const batch = trafficPromises.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}... (${
          i + 1
        }-${Math.min(i + batchSize, trafficPromises.length)})`
      );

      const batchResults = await Promise.allSettled(batch);
      trafficResults.push(...batchResults);

      // Delay between batches (reduce API call load)
      if (i + batchSize < trafficPromises.length) {
        console.log('100ms delay between batches...');
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log('Traffic data query completed');

    // 4. Data aggregation
    let totalStars = 0;
    let totalViews14d = 0;
    let totalUnique14d = 0;
    const timeseriesMap = new Map<string, { views: number; unique: number }>();
    const topReposWithTraffic: {
      full_name: string;
      stars: number;
      views_14d: number;
      sparkline_data: { date: string; views: number }[];
    }[] = [];

    // Sum of stars from all repositories
    repos.forEach((repo: GitHubRepo) => {
      totalStars += repo.stargazers_count;
    });

    // Process repositories with traffic data
    trafficResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { repo, traffic } = result.value;

        // Sum of views over 14 days
        const views14d = traffic.views.reduce(
          (sum, view) => sum + view.count,
          0
        );
        const unique14d = traffic.views.reduce(
          (sum, view) => sum + view.uniques,
          0
        );

        totalViews14d += views14d;
        totalUnique14d += unique14d;

        // Generate sparkline data (14-day views data)
        const sparklineData = traffic.views.map((view) => ({
          date: new Date(view.timestamp).toISOString().split('T')[0],
          views: view.count,
        }));

        // Ensure 14-day data (fill missing dates with 0)
        const last14DaysSparkline = [];
        const today = new Date();

        for (let i = 13; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const existingData = sparklineData.find(
            (item) => item.date === dateStr
          );
          last14DaysSparkline.push({
            date: dateStr,
            views: existingData?.views || 0,
          });
        }

        // Add to top repositories list
        topReposWithTraffic.push({
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          views_14d: views14d,
          sparkline_data: last14DaysSparkline,
        });

        // Merge timeseries data
        traffic.views.forEach((view) => {
          const date = new Date(view.timestamp).toISOString().split('T')[0];
          const existing = timeseriesMap.get(date) || { views: 0, unique: 0 };
          timeseriesMap.set(date, {
            views: existing.views + view.count,
            unique: existing.unique + view.uniques,
          });
        });
      }
    });

    // 5. Sort and format timeseries data
    const timeseries = Array.from(timeseriesMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        unique: data.unique,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. Ensure 14-day data (fill missing dates with 0)
    const last14Days = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const existingData = timeseries.find((item) => item.date === dateStr);
      last14Days.push({
        date: dateStr,
        views: existingData?.views || 0,
        unique: existingData?.unique || 0,
      });
    }

    // 7. Sort top repositories (by views)
    topReposWithTraffic.sort((a, b) => b.views_14d - a.views_14d);

    // 8. Generate branding copy
    const topRepoName = topReposWithTraffic[0]?.full_name || 'No repositories';
    const brandCopy = makeBrandCopy({
      starsTotal: totalStars,
      views14d: totalViews14d,
      topRepoName,
    });

    // 8. Compose response data
    const responseData: OverviewResponse = {
      range: '14d',
      totals: {
        stars_total: totalStars,
        views_14d: totalViews14d,
        unique_14d: totalUnique14d,
        repos_count: repos.length,
      },
      timeseries: last14Days,
      top_repos: topReposWithTraffic.slice(0, 5), // Top 5 only
      brand_copy: brandCopy,
    };

    // 9. Save to cache (use longer TTL)
    cache.set(cacheKey, responseData, CACHE_TTL.VERY_LONG);
    console.log(
      `Data cached for user: ${username}, key: ${cacheKey}, TTL: ${CACHE_TTL.VERY_LONG}`
    );

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Cache': 'MISS',
        'X-User': username,
      },
    });
  } catch (error) {
    console.error('Overview API Error:', error);

    if (isRateLimitError(error)) {
      const retryAfter = Math.ceil(
        (error.rateLimit?.reset || 0) - Date.now() / 1000
      );
      console.error('GitHub API rate limit error:', {
        remaining: error.rateLimit?.remaining,
        limit: error.rateLimit?.limit,
        reset: error.rateLimit?.reset,
        retryAfter,
      });

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
            'X-RateLimit-Remaining': (
              error.rateLimit?.remaining || 0
            ).toString(),
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
