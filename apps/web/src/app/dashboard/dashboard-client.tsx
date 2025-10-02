'use client';

import { useSession, signOut } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ViewsChart } from '@/components/ViewsChart';
import { TopReposTable } from '@/components/TopReposTable';
import ShareModal from '@/components/ShareModal';
import ReportModal from '@/components/ReportModal';

// API response type definition
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Actual API call
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
      // Do not retry on rate limit error
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
            Unable to load data
          </h2>
          <p className='text-gray-600'>Please try again later.</p>
        </div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Skeleton loading */}
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
        {/* Header */}
        <div className='mb-6 sm:mb-8'>
          <div className='flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0'>
            <div className='flex-1'>
              <h1 className='text-2xl sm:text-3xl font-bold text-gray-900'>
                Hello, {session?.user?.name}! 👋
              </h1>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <span className='inline-flex items-center rounded-full bg-yellow-50 px-2 sm:px-3 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-200'>
                  <span className='mr-1'>⭐</span>
                  <span className='hidden sm:inline'>Total Stars: </span>
                  <span className='sm:hidden'>Stars: </span>
                  <span className='ml-1 font-semibold'>
                    {overviewData.totals.stars_total.toLocaleString()}
                  </span>
                </span>

                <span className='inline-flex items-center rounded-full bg-blue-50 px-2 sm:px-3 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-blue-200'>
                  <span className='mr-1'>👀</span>
                  <span className='hidden sm:inline'>14-day Views: </span>
                  <span className='sm:hidden'>Views: </span>
                  <span className='ml-1 font-semibold'>
                    {overviewData.totals.views_14d.toLocaleString()}
                  </span>
                </span>

                {overviewData.top_repos?.[0]?.full_name && (
                  <a
                    href={`https://github.com/${overviewData.top_repos[0].full_name}`}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex max-w-full items-center rounded-full bg-gray-100 px-2 sm:px-3 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-100'
                    title={overviewData.top_repos[0].full_name}
                  >
                    <span className='mr-1'>📦</span>
                    <span className='hidden sm:inline'>Top repo: </span>
                    <span className='sm:hidden'>Top: </span>
                    <span className='ml-1 font-semibold truncate max-w-[120px] sm:max-w-[220px]'>
                      {overviewData.top_repos[0].full_name}
                    </span>
                  </a>
                )}
              </div>
            </div>

            {/* Mobile button layout */}
            <div className='flex flex-col space-y-2 sm:hidden'>
              <div className='flex space-x-2'>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className='flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white
                    cursor-pointer bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors'
                >
                  <svg
                    className='w-4 h-4 mr-1'
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
                  Share
                </button>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className='flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white
                    cursor-pointer bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
                >
                  <svg
                    className='w-4 h-4 mr-1'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                    />
                  </svg>
                  Report
                </button>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className='w-full inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700
                  cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
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
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                Logout
              </button>
            </div>

            {/* Desktop button layout */}
            <div className='hidden sm:flex space-x-3'>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className='inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700
                  cursor-pointer bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
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
                    d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                  />
                </svg>
                Logout
              </button>
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
                Share
              </button>
              <button
                onClick={() => setIsReportModalOpen(true)}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white
                  cursor-pointer bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors'
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
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Generate Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8'>
          <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
            <div className='flex flex-col sm:flex-row sm:items-center'>
              <div className='flex-shrink-0 mb-2 sm:mb-0'>
                <div className='w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
                  <span className='text-yellow-600 text-lg'>⭐</span>
                </div>
              </div>
              <div className='sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-500'>
                  <span className='hidden sm:inline'>Total Stars</span>
                  <span className='sm:hidden'>Stars</span>
                </p>
                <p className='text-lg sm:text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.stars_total.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
            <div className='flex flex-col sm:flex-row sm:items-center'>
              <div className='flex-shrink-0 mb-2 sm:mb-0'>
                <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                  <span className='text-blue-600 text-lg'>👀</span>
                </div>
              </div>
              <div className='sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-500'>
                  <span className='hidden sm:inline'>14-day Views</span>
                  <span className='sm:hidden'>Views</span>
                </p>
                <p className='text-lg sm:text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.views_14d.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
            <div className='flex flex-col sm:flex-row sm:items-center'>
              <div className='flex-shrink-0 mb-2 sm:mb-0'>
                <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                  <span className='text-green-600 text-lg'>👥</span>
                </div>
              </div>
              <div className='sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-500'>
                  <span className='hidden sm:inline'>Unique Visitors</span>
                  <span className='sm:hidden'>Visitors</span>
                </p>
                <p className='text-lg sm:text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.unique_14d.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
            <div className='flex flex-col sm:flex-row sm:items-center'>
              <div className='flex-shrink-0 mb-2 sm:mb-0'>
                <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                  <span className='text-purple-600 text-lg'>📁</span>
                </div>
              </div>
              <div className='sm:ml-4'>
                <p className='text-xs sm:text-sm font-medium text-gray-500'>
                  <span className='hidden sm:inline'>Repositories</span>
                  <span className='sm:hidden'>Repos</span>
                </p>
                <p className='text-lg sm:text-2xl font-semibold text-gray-900'>
                  {overviewData.totals.repos_count}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart area */}
        <ViewsChart data={overviewData.timeseries} loading={!overviewData} />

        {/* Top repositories table */}
        <div className='mt-8'>
          <TopReposTable
            repos={overviewData.top_repos}
            loading={!overviewData}
          />
        </div>

        {/* Share modal */}
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

        {/* Report modal */}
        {session?.user && (
          <ReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            username={session.user.username || ''}
          />
        )}
      </div>
    </div>
  );
}
