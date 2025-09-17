'use client';

import { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function ReportModal({
  isOpen,
  onClose,
  username,
}: ReportModalProps) {
  const [reportType] = useState<'weekly'>('weekly');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        'http://localhost:3001/api/reports/' + reportType,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedReport(data);
      } else {
        alert('리포트 생성에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('리포트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    setIsDownloading(true);
    try {
      const params = new URLSearchParams({
        type: reportType,
        username,
      });

      const response = await fetch(
        `http://localhost:3001/api/reports/download/${Date.now()}?${params}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${username}-${
          new Date().toISOString().split('T')[0]
        }.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('다운로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>주간 리포트 생성</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='space-y-4'>
          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className='w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center'
          >
            {isGenerating ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                생성 중...
              </>
            ) : (
              <>
                <FileText className='h-4 w-4 mr-2' />
                리포트 생성
              </>
            )}
          </button>

          {/* Download Button */}
          {generatedReport && (
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className='w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer'
            >
              {isDownloading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  다운로드 중...
                </>
              ) : (
                <>
                  <Download className='h-4 w-4 mr-2' />
                  PDF 다운로드
                </>
              )}
            </button>
          )}

          {/* Report Info */}
          {generatedReport && (
            <div className='bg-green-50 border border-green-200 rounded-md p-3'>
              <p className='text-sm text-green-800'>
                ✅ 리포트가 성공적으로 생성되었습니다!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
