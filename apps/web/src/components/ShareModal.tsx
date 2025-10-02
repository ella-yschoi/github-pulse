'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X, Copy, Check } from 'lucide-react';

interface TimeseriesPoint {
  date: string;
  views: number;
  unique?: number;
}
interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareData: {
    username: string;
    stars: number;
    views: number;
    topRepo: string;
    timeseries: TimeseriesPoint[]; // 14-day data
    brandCopy: string;
    reposCount: number;
    top5: { full_name: string; stars: number; views_14d: number }[];
  };
}

export default function ShareModal({
  isOpen,
  onClose,
  shareData,
}: ShareModalProps) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [imageCopied, setImageCopied] = useState(false);

  if (!isOpen) return null;

  // Generate OG image URL
  const generateOGImageURL = () => {
    const params = new URLSearchParams({
      username: shareData.username,
      stars: shareData.stars.toString(),
      views: shareData.views.toString(),
      topRepo: shareData.topRepo,
    });
    return `/opengraph-image?${params.toString()}`;
  };

  // Generate share link (keep minimal parameters only)
  const generateShareURL = () => {
    // Share only top 3: full_name|stars|views;...
    const top3Str = (shareData.top5 || [])
      .slice(0, 3)
      .map((r) => `${r.full_name}|${r.stars}|${r.views_14d}`)
      .join(';');
    const params = new URLSearchParams({
      u: shareData.username, // username
      s: String(shareData.stars), // stars
      v: String(shareData.views), // 14d views
      t: shareData.topRepo, // top repo
      r: String(shareData.reposCount), // repos count (short key)
      top3: top3Str, // top3 compressed
    });
    return `${window.location.origin}/shared?${params.toString()}`;
  };

  // Copy link
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(generateShareURL());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Copy image
  const copyImage = async () => {
    try {
      const response = await fetch(generateOGImageURL());
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob,
        }),
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image:', err);
    }
  };

  const ogImageURL = generateOGImageURL();
  const shareURL = generateShareURL();

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-center justify-center p-2 sm:p-4'>
        {/* Background overlay */}
        <div
          className='fixed inset-0 bg-black/40 bg-opacity-50 transition-opacity'
          onClick={onClose}
        />

        {/* Modal content */}
        <div className='relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 sm:p-6 border-b'>
            <h2 className='text-lg sm:text-xl font-semibold text-gray-900'>
              Share
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors p-1'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6 cursor-pointer' />
            </button>
          </div>

          {/* Content */}
          <div className='p-4 sm:p-6 space-y-4 sm:space-y-6'>
            {/* OG image preview */}
            <div>
              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0'>
                <h3 className='text-base sm:text-lg font-medium text-gray-900'>
                  Preview
                </h3>
                <button
                  onClick={copyImage}
                  className={`cursor-pointer px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    imageCopied
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {imageCopied ? (
                    <Check className='w-3 h-3 sm:w-4 sm:h-4' />
                  ) : (
                    <Copy className='w-3 h-3 sm:w-4 sm:h-4' />
                  )}
                  {imageCopied ? 'Copied!' : 'Copy Image'}
                </button>
              </div>
              <div className='flex flex-col items-center'>
                <div className='relative w-full max-w-md'>
                  <Image
                    src={ogImageURL}
                    alt='GitHub Pulse OG Image'
                    width={600}
                    height={315}
                    className='rounded-lg shadow-lg w-full h-auto'
                  />
                  <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
                    OG Image
                  </div>
                </div>
                <p className='text-xs sm:text-sm text-gray-500 mt-2 text-center'>
                  This is how the image will appear
                </p>
              </div>
            </div>

            {/* Share link */}
            <div>
              <h3 className='text-base sm:text-lg font-medium text-gray-900 mb-4'>
                Share Link
              </h3>
              <div className='flex flex-col sm:flex-row gap-2'>
                <input
                  type='text'
                  value={shareURL}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-gray-50 text-gray-500 break-all'
                />
                <button
                  onClick={copyShareLink}
                  className={`cursor-pointer px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    linkCopied
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {linkCopied ? (
                    <Check className='w-3 h-3 sm:w-4 sm:h-4' />
                  ) : (
                    <Copy className='w-3 h-3 sm:w-4 sm:h-4' />
                  )}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className='text-xs sm:text-sm text-gray-500 mt-2'>
                Copy this link to share your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
