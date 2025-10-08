'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Base64 decoding for parameter restoration
function decodeCompressedUrl(encoded: string): Record<string, string> | null {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    const parts = decoded.split(',');

    if (parts.length !== 6) return null; // Expecting 6 parts: u, s, v, t, r, top3

    return {
      u: parts[0],
      s: parts[1],
      v: parts[2],
      t: parts[3],
      r: parts[4],
      top3: parts[5],
    };
  } catch (error) {
    console.error('Error decoding compressed URL:', error);
    return null;
  }
}

function ShortUrlContent() {
  const params = useParams();
  const code = params.code as string;
  const [data, setData] = useState<Record<string, string> | null>(null);
  const [copied, setCopied] = useState(false);
  const [shortUrl, setShortUrl] = useState<string>('');
  const [isGeneratingShortUrl, setIsGeneratingShortUrl] = useState(false);
  const [shortUrlError, setShortUrlError] = useState<string>('');

  useEffect(() => {
    if (!code) return;

    // Decode compressed code to parameters
    const decodedParams = decodeCompressedUrl(code);

    if (!decodedParams) {
      // If decoding fails, redirect to home page
      window.location.href = '/';
      return;
    }

    setData(decodedParams);
  }, [code]);

  // Generate short URL automatically when data is loaded
  useEffect(() => {
    if (data && !shortUrl && !isGeneratingShortUrl) {
      generateShortUrl();
    }
  }, [data, shortUrl, isGeneratingShortUrl]);

  // Generate short URL function
  const generateShortUrl = async () => {
    if (shortUrl) return; // Short URL already generated

    setIsGeneratingShortUrl(true);
    setShortUrlError('');

    try {
      // For short URL pages, use the current URL directly
      const currentUrl = window.location.href;
      setShortUrl(currentUrl);
    } catch (err) {
      console.error('Failed to generate short URL:', err);
      setShortUrlError('Failed to generate short URL');
    } finally {
      setIsGeneratingShortUrl(false);
    }
  };

  // Copy link function
  const copyShareLink = async () => {
    try {
      const urlToCopy = shortUrl || window.location.href;
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  // Parse data
  const username = data.u || 'GitHub User';
  const stars = parseInt(data.s || '0');
  const views = parseInt(data.v || '0');
  const topRepo = data.t || 'No repositories';
  const top3Raw = data.top3 || '';
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

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='max-w-4xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8'>
        {/* Header */}
        <div className='text-center mb-6 sm:mb-8'>
          <div className='flex items-center justify-center gap-2 mb-3 sm:mb-4'>
            <Image
              src='/images/gihub-pulse-logo-no-bg.png'
              alt='GitHub Pulse Logo'
              width={52}
              height={52}
              className='h-10 w-10 sm:h-13 sm:w-13 object-contain'
            />
            <h1 className='text-2xl sm:text-4xl font-bold text-emerald-500'>
              GitHub Pulse
            </h1>
          </div>
          <p className='text-base sm:text-xl text-gray-600 mb-2'>
            @{username}&apos;s GitHub Activity Dashboard
          </p>
        </div>

        {/* Statistics Summary */}
        <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6 sm:mb-8'>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 text-center'>
            Key Statistics
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6'>
            <div className='text-center'>
              <div className='text-xl sm:text-2xl font-bold text-yellow-500 mb-1 sm:mb-2'>
                ⭐ {stars.toLocaleString()}
              </div>
              <div className='text-xs sm:text-sm text-gray-500'>
                <span className='hidden sm:inline'>Total Stars</span>
                <span className='sm:hidden'>Stars</span>
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xl sm:text-2xl font-bold text-blue-600 mb-1 sm:mb-2'>
                👀 {views.toLocaleString()}
              </div>
              <div className='text-xs sm:text-sm text-gray-500'>
                <span className='hidden sm:inline'>14-day Views</span>
                <span className='sm:hidden'>Views</span>
              </div>
            </div>
            <div className='text-center'>
              <div className='text-xl sm:text-2xl font-bold text-green-600 mb-1 sm:mb-2'>
                📁 {topRepo.split('/')[1] || 'Repository'}
              </div>
              <div className='text-xs sm:text-sm text-gray-500'>
                <span className='hidden sm:inline'>Top Repository</span>
                <span className='sm:hidden'>Top Repo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 3 Repositories List */}
        {top3.length > 0 && (
          <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6 sm:mb-8'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center'>
              Top 3 Repositories
            </h2>
            <ul className='divide-y divide-gray-100'>
              {top3.map((r) => (
                <li
                  key={r.full_name}
                  className='py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0'
                >
                  <a
                    href={`https://github.com/${r.full_name}`}
                    target='_blank'
                    rel='noreferrer'
                    className='text-xs sm:text-sm font-medium text-gray-900 hover:text-emerald-600 truncate max-w-full sm:max-w-[70%]'
                    title={r.full_name}
                  >
                    {r.full_name}
                  </a>
                  <div className='flex items-center justify-center sm:justify-end gap-3 sm:gap-4 text-xs sm:text-sm'>
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

        {/* Share Link */}
        <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border mb-6 sm:mb-8'>
          <h2 className='text-lg sm:text-xl font-semibold text-gray-900 mb-4 text-center'>
            Share This Page
          </h2>
          <div className='flex flex-col sm:flex-row gap-2 sm:gap-4'>
            <input
              type='text'
              value={shortUrl || window.location.href}
              readOnly
              className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-gray-50 text-gray-500 break-all'
            />
            <button
              onClick={copyShareLink}
              disabled={isGeneratingShortUrl}
              className={`px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                copied
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : isGeneratingShortUrl
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              {copied
                ? 'Copied!'
                : isGeneratingShortUrl
                ? 'Preparing...'
                : 'Copy'}
            </button>
          </div>
          {shortUrlError && (
            <p className='text-xs sm:text-sm text-red-500 mt-2 text-center'>
              {shortUrlError}
            </p>
          )}
          <p className='text-xs sm:text-sm text-gray-500 mt-2 text-center'>
            Copy this link to share your dashboard
          </p>
        </div>

        {/* CTA */}
        <div className='text-center'>
          <div className='bg-emerald-50 p-4 sm:p-6 rounded-lg'>
            <h3 className='text-base sm:text-lg font-semibold text-emerald-900 mb-2'>
              Create Your Own GitHub Pulse
            </h3>
            <p className='text-sm sm:text-base text-emerald-700 mb-4'>
              Sign in with your GitHub account to create your own dashboard
            </p>
            <Link
              href='/'
              className='inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors'
            >
              <svg
                className='mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white'
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
              Sign in with GitHub
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShortUrlPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShortUrlContent />
    </Suspense>
  );
}
