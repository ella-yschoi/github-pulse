'use client';

import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ViewsChart } from '@/components/ViewsChart';
import { TopReposTable } from '@/components/TopReposTable';
import ShareModal from '@/components/ShareModal';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold text-gray-900'>
                안녕하세요, {session?.user?.name}님! 👋
              </h1>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <span className='inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-200'>
                  <span className='mr-1'>⭐</span>
                  Total Stars:
                  <span className='ml-1 font-semibold'>
                    {overviewData.totals.stars_total.toLocaleString()}
                  </span>
                </span>

                <span className='inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-200'>
                  <span className='mr-1'>👀</span>
                  14일 Views:
                  <span className='ml-1 font-semibold'>
                    {overviewData.totals.views_14d.toLocaleString()}
                  </span>
                </span>

                {overviewData.top_repos?.[0]?.full_name && (
                  <a
                    href={`https://github.com/${overviewData.top_repos[0].full_name}`}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex max-w-full items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100'
                    title={overviewData.top_repos[0].full_name}
                  >
                    <span className='mr-1'>📦</span>
                    Top repo:
                    <span className='ml-1 font-semibold truncate max-w-[220px]'>
                      {overviewData.top_repos[0].full_name}
                    </span>
                  </a>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                cursor-pointer bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors'
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z'
                />
              </svg>
              공유하기
            </button>
          </div>
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

        {/* 공유 모달 */}
        {overviewData && session?.user?.name && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            shareData={{
              username: session.user.name,
              stars: overviewData.totals.stars_total,
              views: overviewData.totals.views_14d,
              topRepo:
                overviewData.top_repos[0]?.full_name || 'No repositories',
              timeseries: overviewData.timeseries,
              brandCopy: overviewData.brand_copy,
              reposCount: overviewData.totals.repos_count,
              top5: overviewData.top_repos.slice(0, 5),
            }}
          />
        )}
      </div>
    </div>
  );
}
