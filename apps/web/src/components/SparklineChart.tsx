'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineData {
  date: string;
  views: number;
}

interface SparklineChartProps {
  data: SparklineData[];
  width?: number;
  height?: number;
  color?: string;
}

export function SparklineChart({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
}: SparklineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className='flex items-center justify-center text-gray-400 text-xs'
        style={{ width, height }}
      >
        -
      </div>
    );
  }

  // 데이터 포맷팅 (날짜를 MM/DD 형식으로)
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
    }),
  }));

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width='100%' height='100%'>
        <LineChart data={formattedData}>
          <Line
            type='monotone'
            dataKey='views'
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
