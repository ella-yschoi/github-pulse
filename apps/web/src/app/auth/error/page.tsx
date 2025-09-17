'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return '서버 설정에 문제가 있습니다.';
      case 'AccessDenied':
        return '접근이 거부되었습니다.';
      case 'Verification':
        return '인증 토큰이 만료되었거나 잘못되었습니다.';
      default:
        return '로그인 중 오류가 발생했습니다.';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-900 mb-2'>
            GitHub Pulse
          </h1>
          <p className='text-lg text-gray-600 mb-8'>
            개인 리포지토리 분석 대시보드
          </p>
        </div>

        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <div className='text-center'>
            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4'>
              <svg
                className='h-6 w-6 text-red-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
            </div>

            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>
              로그인 오류
            </h2>

            <p className='text-gray-600 mb-6'>{getErrorMessage(error)}</p>

            <div className='space-y-3'>
              <Link
                href='/api/auth/signin'
                className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
              >
                다시 로그인하기
              </Link>

              <Link
                href='/'
                className='w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </div>

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500'>
            문제가 지속되면 관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
