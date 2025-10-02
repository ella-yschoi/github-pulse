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
    timeseries: TimeseriesPoint[]; // 14일 데이터
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

  // OG 이미지 URL 생성
  const generateOGImageURL = () => {
    const params = new URLSearchParams({
      username: shareData.username,
      stars: shareData.stars.toString(),
      views: shareData.views.toString(),
      topRepo: shareData.topRepo,
    });
    return `/opengraph-image?${params.toString()}`;
  };

  // 공유 링크 생성 (최소 파라미터만 유지)
  const generateShareURL = () => {
    // 공유는 상위 3개만: full_name|stars|views;...
    const top3Str = (shareData.top5 || [])
      .slice(0, 3)
      .map((r) => `${r.full_name}|${r.stars}|${r.views_14d}`)
      .join(';');
    const params = new URLSearchParams({
      u: shareData.username, // username
      s: String(shareData.stars), // stars
      v: String(shareData.views), // 14d views
      t: shareData.topRepo, // top repo
      r: String(shareData.reposCount), // repos count (짧은 키)
      top3: top3Str, // top3 compressed
    });
    return `${window.location.origin}/shared?${params.toString()}`;
  };

  // 링크 복사
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(generateShareURL());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 이미지 복사
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
      <div className='flex min-h-screen items-center justify-center p-4'>
        {/* 배경 오버레이 */}
        <div
          className='fixed inset-0 bg-black/40 bg-opacity-50 transition-opacity'
          onClick={onClose}
        />

        {/* 모달 컨텐츠 */}
        <div className='relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
          {/* 헤더 */}
          <div className='flex items-center justify-between p-6 border-b'>
            <h2 className='text-xl font-semibold text-gray-900'>Share</h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <X className='w-6 h-6 cursor-pointer' />
            </button>
          </div>

          {/* 컨텐츠 */}
          <div className='p-6 space-y-6'>
            {/* OG 이미지 미리보기 */}
            <div>
              <div className='flex items-center justify-between mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>Preview</h3>
                <button
                  onClick={copyImage}
                  className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    imageCopied
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {imageCopied ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                  {imageCopied ? 'Copied!' : 'Copy Image'}
                </button>
              </div>
              <div className='flex flex-col items-center'>
                <div className='relative'>
                  <Image
                    src={ogImageURL}
                    alt='GitHub Pulse OG Image'
                    width={600}
                    height={315}
                    className='rounded-lg shadow-lg'
                  />
                  <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
                    OG Image
                  </div>
                </div>
                <p className='text-sm text-gray-500 mt-2 text-center'>
                  This is how the image will appear
                </p>
              </div>
            </div>

            {/* 공유 링크 */}
            <div>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                Share Link
              </h3>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={shareURL}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500'
                />
                <button
                  onClick={copyShareLink}
                  className={`cursor-pointer px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    linkCopied
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {linkCopied ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                  {linkCopied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <p className='text-sm text-gray-500 mt-2'>
                Copy this link to share your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
