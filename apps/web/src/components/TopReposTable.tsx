'use client';

import { SparklineChart } from './SparklineChart';

interface RepoData {
  full_name: string;
  stars: number;
  views_14d: number;
  sparkline_data?: { date: string; views: number }[];
}

interface TopReposTableProps {
  repos: RepoData[];
  loading?: boolean;
}

export function TopReposTable({ repos, loading = false }: TopReposTableProps) {
  if (loading) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border'>
        <div className='animate-pulse'>
          <div className='h-6 bg-gray-200 rounded w-1/3 mb-4'></div>
          <div className='space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className='flex items-center justify-between p-4 border rounded-lg'
              >
                <div className='flex items-center'>
                  <div className='w-8 h-8 bg-gray-200 rounded mr-4'></div>
                  <div>
                    <div className='h-4 bg-gray-200 rounded w-32 mb-2'></div>
                    <div className='h-3 bg-gray-200 rounded w-24'></div>
                  </div>
                </div>
                <div className='flex items-center space-x-4'>
                  <div className='h-6 bg-gray-200 rounded w-16'></div>
                  <div className='h-6 bg-gray-200 rounded w-20'></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!repos || repos.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border'>
        <h2 className='text-xl font-semibold text-gray-900 mb-4'>
          상위 리포지토리
        </h2>
        <div className='text-center py-8 text-gray-500'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400 mb-4'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
            />
          </svg>
          <p>리포지토리 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className='bg-white p-6 rounded-lg shadow-sm border'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold text-gray-900'>상위 리포지토리</h2>
        <div className='text-sm text-gray-500'>최근 14일 기준</div>
      </div>

      <div className='overflow-hidden'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                #
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                리포지토리
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                스타
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                14일 Views
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                트렌드
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {repos.map((repo, index) => (
              <tr key={repo.full_name} className='hover:bg-gray-50'>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <span className='text-2xl font-bold text-gray-400'>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <div className='flex-shrink-0 h-8 w-8'>
                      <div className='h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center'>
                        <svg
                          className='h-4 w-4 text-gray-600'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </div>
                    </div>
                    <div className='ml-4'>
                      <a
                        href={`https://github.com/${repo.full_name}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-sm font-medium text-gray-900 hover:text-emerald-600'
                        title={repo.full_name}
                      >
                        {repo.full_name}
                      </a>
                    </div>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='flex items-center'>
                    <span className='text-yellow-500 mr-1'>⭐</span>
                    <span className='text-sm font-medium text-gray-900'>
                      {repo.stars.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <div className='text-sm font-medium text-gray-900'>
                    {repo.views_14d.toLocaleString()}
                  </div>
                </td>
                <td className='px-6 py-4 whitespace-nowrap'>
                  <SparklineChart
                    data={repo.sparkline_data || []}
                    width={100}
                    height={30}
                    color='#3b82f6'
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
