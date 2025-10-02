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
  if (loading) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border'>
        <div className='animate-pulse'>
          <div className='h-4 bg-gray-200 rounded w-1/4 mb-4'></div>
          <div className='h-64 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='bg-white p-6 rounded-lg shadow-sm border'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          14-day Views Trend
        </h3>
        <div className='h-64 flex items-center justify-center text-gray-500'>
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
    <div className='bg-white p-6 rounded-lg shadow-sm border'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          14-day Views Trend
        </h3>
        <div className='flex items-center space-x-4 text-sm text-gray-600'>
          <div className='flex items-center'>
            <div className='w-3 h-3 bg-blue-500 rounded-full mr-2'></div>
            <span>Views</span>
          </div>
          <div className='flex items-center'>
            <div className='w-3 h-3 bg-green-500 rounded-full mr-2'></div>
            <span>Unique Visitors</span>
          </div>
        </div>
      </div>

      <div className='h-64'>
        <ResponsiveContainer width='100%' height='100%'>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
            <XAxis
              dataKey='date'
              stroke='#666'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='#666'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: '500' }}
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
              strokeWidth={2}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line
              type='monotone'
              dataKey='unique'
              stroke='#10b981'
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
