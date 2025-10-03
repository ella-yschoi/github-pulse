'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useState, useEffect } from 'react';

interface ViewsData {
  date: string;
  views: number;
  unique: number;
}

interface ViewsChartProps {
  data: ViewsData[];
  loading?: boolean;
}

export function ViewsChart({ data, loading = false }: ViewsChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (loading) {
    return (
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='h-48 sm:h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border'>
        <div className='flex items-center mb-4'>
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
            <span className='text-blue-600 text-lg'>📈</span>
          </div>
          <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
            <span className='hidden sm:inline'>14-day Views Trend</span>
            <span className='sm:hidden'>Views Trend</span>
          </h3>
          <span className='ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full'>
            14 days
          </span>
        </div>
        <div className='h-48 sm:h-64 flex items-center justify-center text-gray-500'>
          <div className='text-center'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
              />
            </svg>
            <p className='mt-2 text-sm'>No data available</p>
          </div>
        </div>
      </div>
    );
  }

  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
    }),
  }));

  return (
    <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border'>
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0'>
        <div className='flex items-center'>
          <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3'>
            <span className='text-blue-600 text-lg'>📈</span>
          </div>
          <h3 className='text-base sm:text-lg font-semibold text-gray-900'>
            <span className='hidden sm:inline'>14-day Views Trend</span>
            <span className='sm:hidden'>Views Trend</span>
          </h3>
        </div>
        <div className='flex items-center justify-center sm:justify-end space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600'>
          <div className='flex items-center'>
            <div className='w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-1 sm:mr-2'></div>
            <span>Views</span>
          </div>
          <div className='flex items-center'>
            <div className='w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1 sm:mr-2'></div>
            <span className='hidden sm:inline'>Unique Visitors</span>
            <span className='sm:hidden'>Visitors</span>
          </div>
        </div>
      </div>

      <div className='h-48 sm:h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={formattedData}
            margin={{
              top: 5,
              right: isMobile ? 10 : 30,
              left: isMobile ? 10 : 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='date'
              stroke='#666'
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              interval={isMobile ? 'preserveStartEnd' : 0}
            />
            <YAxis
              stroke='#666'
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
              width={isMobile ? 30 : 40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: isMobile ? '12px' : '14px',
              }}
              labelStyle={{
                color: '#374151',
                fontWeight: '500',
                fontSize: isMobile ? '12px' : '14px',
              }}
              formatter={(value: number, name: string) => [
                value.toLocaleString(),
                name === 'views' ? 'Views' : 'Unique Visitors',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type='monotone'
              dataKey='views'
              stroke='#3b82f6'
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{
                fill: '#3b82f6',
                strokeWidth: isMobile ? 1 : 2,
                r: isMobile ? 3 : 4,
              }}
              activeDot={{
                r: isMobile ? 4 : 6,
                stroke: '#3b82f6',
                strokeWidth: isMobile ? 1 : 2,
              }}
            />
            <Line
              type='monotone'
              dataKey='unique'
              stroke='#10b981'
              strokeWidth={isMobile ? 1.5 : 2}
              dot={{
                fill: '#10b981',
                strokeWidth: isMobile ? 1 : 2,
                r: isMobile ? 3 : 4,
              }}
              activeDot={{
                r: isMobile ? 4 : 6,
                stroke: '#10b981',
                strokeWidth: isMobile ? 1 : 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
