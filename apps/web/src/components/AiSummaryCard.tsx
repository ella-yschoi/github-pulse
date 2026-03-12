'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { ActivitySummary } from '@/types/api';

interface AiSummaryCardProps {
  repos: string[];
  period?: string;
}

export function AiSummaryCard({ repos, period = '14d' }: AiSummaryCardProps) {
  const [retryCount, setRetryCount] = useState(0);

  const reposParam = repos.join(',');

  // Fetch AI summary data
  const {
    data: summaryData,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ai-summary', reposParam, period],
    queryFn: async () => {
      const response = await fetch(
        `/api/summary?repos=${encodeURIComponent(reposParam)}&period=${period}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch AI summary');
      }
      return response.json() as Promise<ActivitySummary>;
    },
    retry: (failureCount, error) => {
      // Do not retry on rate limit or authentication errors
      if (
        error instanceof Error &&
        (error.message.includes('rate limit') ||
          error.message.includes('Authentication required') ||
          error.message.includes('Invalid repository'))
      ) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
    refetch();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
        <div className='flex items-center mb-4'>
          <div className='w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mr-3'>
            <span className='text-purple-600 text-lg'>🤖</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Activity Summary by AI
          </h3>
        </div>

        <div className='animate-pulse space-y-3'>
          <div className='h-4 bg-gray-200 rounded w-3/4'></div>
          <div className='h-4 bg-gray-200 rounded w-1/2'></div>
          <div className='h-4 bg-gray-200 rounded w-2/3'></div>
        </div>

        <div className='mt-4 flex space-x-4'>
          <div className='h-3 bg-gray-200 rounded w-16'></div>
          <div className='h-3 bg-gray-200 rounded w-16'></div>
          <div className='h-3 bg-gray-200 rounded w-16'></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow border-l-4 border-red-400'>
        <div className='flex items-center mb-4'>
          <div className='w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3'>
            <span className='text-red-600 text-lg'>⚠️</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>
            AI Summary Unavailable
          </h3>
        </div>

        <div className='text-sm text-gray-600 mb-4'>
          {error instanceof Error
            ? error.message
            : 'Failed to generate AI summary'}
        </div>

        <div className='flex space-x-3'>
          <button
            onClick={handleRetry}
            disabled={retryCount >= 3}
            className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Retry
          </button>

          {retryCount >= 3 && (
            <span className='text-xs text-gray-500 self-center'>
              Maximum retry attempts reached
            </span>
          )}
        </div>
      </div>
    );
  }

  // Success state
  if (summaryData) {
    return (
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow'>
        <div className='flex items-center mb-4'>
          <div className='w-8 h-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mr-3'>
            <span className='text-purple-600 text-lg'>🤖</span>
          </div>
          <h3 className='text-lg font-semibold text-gray-900'>
            Activity Summary by AI
          </h3>
          <span className='ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
            {summaryData.timeframe}
          </span>
        </div>

        <div className='text-sm text-gray-700 leading-relaxed mb-4'>
          {summaryData.summary}
        </div>

        <div className='flex flex-wrap gap-3 text-xs'>
          <div className='flex items-center space-x-1'>
            <span className='w-2 h-2 bg-orange-400 rounded-full'></span>
            <span className='text-gray-600'>
              <span className='font-medium'>{summaryData.stats.issues}</span>{' '}
              issues
            </span>
          </div>
          <div className='flex items-center space-x-1'>
            <span className='w-2 h-2 bg-blue-400 rounded-full'></span>
            <span className='text-gray-600'>
              <span className='font-medium'>{summaryData.stats.pulls}</span>{' '}
              pull requests
            </span>
          </div>
          <div className='flex items-center space-x-1'>
            <span className='w-2 h-2 bg-green-400 rounded-full'></span>
            <span className='text-gray-600'>
              <span className='font-medium'>{summaryData.stats.commits}</span>{' '}
              commits
            </span>
          </div>
        </div>

        <div className='mt-3 pt-3 border-t border-gray-100'>
          <div className='flex items-center justify-between text-xs text-gray-500'>
            <span>Powered by OpenAI GPT-4o-mini</span>
            <button
              onClick={handleRetry}
              className='text-blue-500 hover:text-blue-600 transition-colors cursor-pointer'
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
