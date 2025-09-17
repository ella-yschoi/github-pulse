'use client';

import { useState } from 'react';
import { X, Download, Mail, Calendar, FileText } from 'lucide-react';

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
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [email, setEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
            email: email || undefined,
            ...(reportType === 'monthly' && {
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
            }),
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGeneratedReport(data);
        alert('리포트가 성공적으로 생성되었습니다!');
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

    try {
      const params = new URLSearchParams({
        type: reportType,
        username,
        ...(reportType === 'monthly' && {
          year: new Date().getFullYear().toString(),
          month: (new Date().getMonth() + 1).toString(),
        }),
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
    }
  };

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>리포트 생성</h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600'
          >
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='space-y-4'>
          {/* Report Type Selection */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              리포트 유형
            </label>
            <div className='flex space-x-4'>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='weekly'
                  checked={reportType === 'weekly'}
                  onChange={(e) =>
                    setReportType(e.target.value as 'weekly' | 'monthly')
                  }
                  className='mr-2'
                />
                <span className='flex items-center'>
                  <Calendar className='h-4 w-4 mr-1' />
                  주간 리포트
                </span>
              </label>
              <label className='flex items-center'>
                <input
                  type='radio'
                  value='monthly'
                  checked={reportType === 'monthly'}
                  onChange={(e) =>
                    setReportType(e.target.value as 'weekly' | 'monthly')
                  }
                  className='mr-2'
                />
                <span className='flex items-center'>
                  <FileText className='h-4 w-4 mr-1' />
                  월간 리포트
                </span>
              </label>
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              이메일 (선택사항)
            </label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
              <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='리포트를 이메일로 받으려면 입력하세요'
                className='w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent'
              />
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              이메일을 입력하면 PDF 리포트가 첨부되어 발송됩니다.
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className='w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center'
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
              className='w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 flex items-center justify-center'
            >
              <Download className='h-4 w-4 mr-2' />
              PDF 다운로드
            </button>
          )}

          {/* Report Info */}
          {generatedReport && (
            <div className='bg-green-50 border border-green-200 rounded-md p-3'>
              <p className='text-sm text-green-800'>
                ✅ 리포트가 성공적으로 생성되었습니다!
                {generatedReport.emailSent && (
                  <span className='block mt-1'>
                    📧 이메일로도 발송되었습니다.
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
