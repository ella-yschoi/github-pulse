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
        return 'There is a problem with server configuration.';
      case 'AccessDenied':
        return 'Access denied.';
      case 'Verification':
        return 'Authentication token has expired or is invalid.';
      default:
        return 'An error occurred during login.';
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
            Personal Repository Analytics Dashboard
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
              Login Error
            </h2>

            <p className='text-gray-600 mb-6'>{getErrorMessage(error)}</p>

            <div className='space-y-3'>
              <Link
                href='/api/auth/signin'
                className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
              >
                Re-login
              </Link>

              <Link
                href='/'
                className='w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors'
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>

        <div className='mt-8 text-center'>
          <p className='text-sm text-gray-500'>
            Please contact the administrator if the problem persists.
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
