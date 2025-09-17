'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function SharedContent() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  // URL 파라미터에서 데이터 추출
  const username =
    searchParams.get('u') || searchParams.get('username') || 'GitHub User';
  const stars = parseInt(
    searchParams.get('s') || searchParams.get('stars') || '0'
  );
  const views = parseInt(
    searchParams.get('v') || searchParams.get('views') || '0'
  );
  const topRepo =
    searchParams.get('t') || searchParams.get('topRepo') || 'No repositories';
  // const reposCount = parseInt(
  //   searchParams.get('r') || searchParams.get('repos') || '0'
  // );
  const top3Raw = searchParams.get('top3') || '';
  const top3 = top3Raw
    .split(';')
    .map((rec) => rec.trim())
    .filter(Boolean)
    .map((rec) => {
      const [full, s, v] = rec.split('|');
      return {
        full_name: full || '',
        stars: Number(s) || 0,
        views_14d: Number(v) || 0,
      };
    });

  // 클라이언트 사이드에서 URL 설정
  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  // (이전) ts 기반 차트는 제거

  // 링크 복사 함수
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // no og image; showing chart instead

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* 헤더 */}
        <div className='text-center mb-8'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <img
              src='/images/gihub-pulse-logo-no-bg.png'
              alt='GitHub Pulse Logo'
              className='h-13 w-13 object-contain'
            />
            <h1 className='text-4xl font-bold text-emerald-500'>
              GitHub Pulse
            </h1>
          </div>
          <p className='text-xl text-gray-600 mb-2'>
            @{username}의 GitHub Activity Dashboard
          </p>
        </div>

        {/* 통계 요약 */}
        <div className='bg-white p-6 rounded-lg shadow-sm border mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-6 text-center'>
            주요 통계
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-500 mb-2'>
                ⭐ {stars.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500'>Total Stars</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600 mb-2'>
                👀 {views.toLocaleString()}
              </div>
              <div className='text-sm text-gray-500'>14-day Views</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600 mb-2'>
                📁 {topRepo.split('/')[1] || 'Repository'}
              </div>
              <div className='text-sm text-gray-500'>Top Repository</div>
            </div>
          </div>
        </div>

        {/* 상위 3개 리포 간단 리스트 */}
        {top3.length > 0 && (
          <div className='bg-white p-6 rounded-lg shadow-sm border mb-8'>
            <h2 className='text-xl font-semibold text-gray-900 mb-4 text-center'>
              상위 리포지토리 Top 3
            </h2>
            <ul className='divide-y divide-gray-100'>
              {top3.map((r) => (
                <li
                  key={r.full_name}
                  className='py-3 flex items-center justify-between'
                >
                  <a
                    href={`https://github.com/${r.full_name}`}
                    target='_blank'
                    rel='noreferrer'
                    className='text-sm font-medium text-gray-900 hover:text-emerald-600 truncate max-w-[70%]'
                    title={r.full_name}
                  >
                    {r.full_name}
                  </a>
                  <div className='flex items-center gap-4 text-sm'>
                    <span className='inline-flex items-center text-black'>
                      ⭐{' '}
                      <span className='ml-1 font-medium'>
                        {r.stars.toLocaleString()}
                      </span>
                    </span>
                    <span className='inline-flex items-center text-black'>
                      👀{' '}
                      <span className='ml-1 font-medium'>
                        {r.views_14d.toLocaleString()}
                      </span>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 공유 링크 */}
        <div className='bg-white p-6 rounded-lg shadow-sm border mb-8'>
          <h2 className='text-xl font-semibold text-gray-900 mb-4 text-center'>
            이 페이지 공유하기
          </h2>
          <div className='flex gap-4'>
            <input
              type='text'
              value={currentUrl}
              readOnly
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500'
            />
            <button
              onClick={copyShareLink}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                copied
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {copied ? '복사됨!' : '복사'}
            </button>
          </div>
          <p className='text-sm text-gray-500 mt-2 text-center'>
            이 링크를 복사해 대시보드를 공유해보세요
          </p>
        </div>

        {/* CTA */}
        <div className='text-center'>
          <div className='bg-emerald-50 p-6 rounded-lg'>
            <h3 className='text-lg font-semibold text-emerald-900 mb-2'>
              나만의 GitHub Pulse 만들기
            </h3>
            <p className='text-emerald-700 mb-4'>
              GitHub 계정으로 로그인해 나만의 대시보드를 만들어보세요
            </p>
            <Link
              href='/'
              className='inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors'
            >
              <svg
                className='mr-2 h-5 w-5 text-white'
                viewBox='0 0 16 16'
                fill='currentColor'
                aria-hidden='true'
              >
                <path
                  fillRule='evenodd'
                  d='M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.63 5.47 7.71.4.08.55-.18.55-.39 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.5-2.69-.96-.09-.24-.48-.96-.82-1.16-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.22 1.87.88 2.33.67.07-.54.28-.88.51-1.08-1.78-.2-3.64-.91-3.64-4.05 0-.9.31-1.64.82-2.22-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.84.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.07 2.2-.84 2.2-.84.44 1.11.16 1.93.08 2.13.51.58.82 1.32.82 2.22 0 3.15-1.87 3.85-3.65 4.05.29.26.54.77.54 1.55 0 1.12-.01 2.02-.01 2.29 0 .21.15.47.55.39A8.13 8.13 0 0016 8.13C16 3.64 12.42 0 8 0Z'
                  clipRule='evenodd'
                />
              </svg>
              GitHub로 로그인하기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SharedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SharedContent />
    </Suspense>
  );
}
