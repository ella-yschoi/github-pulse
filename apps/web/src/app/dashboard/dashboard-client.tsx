'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ViewsChart } from '@/components/ViewsChart';
import { TopReposTable } from '@/components/TopReposTable';

// API 응답 타입 정의
interface OverviewData {
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

export default function DashboardClient() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  // 실제 API 호출
  const { data: overviewData, error } = useQuery({
    queryKey: ['overview'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/overview');
      if (!response.ok) {
        throw new Error('Failed to fetch overview data');
      }
      return response.json() as Promise<OverviewData>;
    },
    retry: (failureCount, error) => {
      // 레이트리밋 에러 시 재시도하지 않음
      if (error instanceof Error && error.message.includes('429')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <h2 className='text-2xl font-bold text-gray-900 mb-4'>
            데이터를 불러올 수 없습니다
          </h2>
          <p className='text-gray-600'>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* 스켈레톤 로딩 */}
          <div className='animate-pulse'>
            <div className='h-8 bg-gray-200 rounded w-1/4 mb-8'></div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='bg-white p-6 rounded-lg shadow'>
                  <div className='h-4 bg-gray-200 rounded w-1/2 mb-2'></div>
                  <div className='h-8 bg-gray-200 rounded w-3/4'></div>
                </div>
              ))}
            </div>
            <ViewsChart data={[]} loading={true} />
            <div className='mt-8'>
              <TopReposTable repos={[]} loading={true} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 헤더 */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>
            안녕하세요, {session?.user?.name}님! 👋
          </h1>
          <p className='mt-2 text-gray-600'>{overviewData.brand_copy}</p>
        </div>

        {/* KPI 카드들 */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <span className='text-yellow-600 text-lg'>⭐</span>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>Total Stars</p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.stars_total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 text-lg'>👀</span>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>14일 Views</p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.views_14d.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <span className='text-green-600 text-lg'>👥</span>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Unique Visitors
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.unique_14d.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-6 rounded-lg shadow'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                  <span className='text-purple-600 text-lg'>📁</span>
                </div>
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-500'>
                  Repositories
                </p>
                <p className='text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.repos_count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 영역 */}
        <ViewsChart data={overviewData.timeseries} loading={!overviewData} />

        {/* 상위 리포지토리 테이블 */}
        <div className='mt-8'>
          <TopReposTable
            repos={overviewData.top_repos}
            loading={!overviewData}
          />
        </div>
      </div>
    </div>
  );
}
