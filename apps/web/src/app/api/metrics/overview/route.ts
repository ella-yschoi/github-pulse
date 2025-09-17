import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { gh, isRateLimitError, isGitHubAPIError } from '@/lib/github';
import { cache, createGitHubCacheKey, CACHE_TTL } from '@/lib/cache';
import { makeBrandCopy } from '@/lib/brandCopy';

// 타입 정의
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
    // 세션 확인
    const session = await getServerSession(authOptions);
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const accessToken = session.accessToken as string;
    const userId = session.user?.email || 'unknown';

    // 캐시 확인
    const cacheKey = createGitHubCacheKey(userId, 'overview');
    const cachedData = cache.get<OverviewResponse>(cacheKey);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    // 1. 사용자 리포지토리 목록 조회
    const repos = await gh(
      accessToken,
      '/user/repos?per_page=100&type=owner&sort=updated'
    );

    if (!Array.isArray(repos)) {
      throw new Error('리포지토리 데이터를 가져올 수 없습니다.');
    }

    // 2. 상위 리포지토리 선별 (stars 기준 TOP 10)
    const topRepos = repos
      .filter((repo: GitHubRepo) => repo.permissions.push) // push 권한이 있는 리포만
      .sort(
        (a: GitHubRepo, b: GitHubRepo) =>
          b.stargazers_count - a.stargazers_count
      )
      .slice(0, 10);

    // 3. Traffic 데이터 병렬 조회
    const trafficPromises = topRepos.map(async (repo: GitHubRepo) => {
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
        // Traffic API 접근 불가 시 빈 데이터 반환
        if (isGitHubAPIError(error) && error.status === 403) {
          return {
            repo,
            traffic: {
              count: 0,
              uniques: 0,
              views: [],
            } as TrafficViews,
          };
        }
        throw error;
      }
    });

    const trafficResults = await Promise.allSettled(trafficPromises);

    // 4. 데이터 집계
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

    // 모든 리포지토리의 stars 합계
    repos.forEach((repo: GitHubRepo) => {
      totalStars += repo.stargazers_count;
    });

    // Traffic 데이터가 있는 리포지토리들 처리
    trafficResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { repo, traffic } = result.value;

        // 14일간 views 합계
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

        // 스파크라인 데이터 생성 (14일간 views 데이터)
        const sparklineData = traffic.views.map((view) => ({
          date: new Date(view.timestamp).toISOString().split('T')[0],
          views: view.count,
        }));

        // 14일 데이터 보장 (부족한 날짜는 0으로 채움)
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

        // 상위 리포지토리 목록에 추가
        topReposWithTraffic.push({
          full_name: repo.full_name,
          stars: repo.stargazers_count,
          views_14d: views14d,
          sparkline_data: last14DaysSparkline,
        });

        // Timeseries 데이터 병합
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

    // 5. Timeseries 데이터 정렬 및 포맷팅
    const timeseries = Array.from(timeseriesMap.entries())
      .map(([date, data]) => ({
        date,
        views: data.views,
        unique: data.unique,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 6. 14일 데이터 보장 (부족한 날짜는 0으로 채움)
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

    // 7. 상위 리포지토리 정렬 (views 기준)
    topReposWithTraffic.sort((a, b) => b.views_14d - a.views_14d);

    // 8. 브랜딩 문구 생성
    const topRepoName = topReposWithTraffic[0]?.full_name || '리포지토리 없음';
    const brandCopy = makeBrandCopy({
      starsTotal: totalStars,
      views14d: totalViews14d,
      topRepoName,
    });

    // 8. 응답 데이터 구성
    const responseData: OverviewResponse = {
      range: '14d',
      totals: {
        stars_total: totalStars,
        views_14d: totalViews14d,
        unique_14d: totalUnique14d,
        repos_count: repos.length,
      },
      timeseries: last14Days,
      top_repos: topReposWithTraffic.slice(0, 5), // 상위 5개만
      brand_copy: brandCopy,
    };

    // 9. 캐시 저장
    cache.set(cacheKey, responseData, CACHE_TTL.MEDIUM);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Overview API Error:', error);

    if (isRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            'GitHub API 레이트리밋에 도달했습니다. 잠시 후 다시 시도해주세요.',
          retryAfter: Math.ceil(
            (error.rateLimit?.reset || 0) - Date.now() / 1000
          ),
        },
        { status: 429 }
      );
    }

    if (isGitHubAPIError(error)) {
      return NextResponse.json(
        { error: 'GitHub API 오류가 발생했습니다.' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
