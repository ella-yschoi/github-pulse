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
  const [generatedReport, setGeneratedReport] = useState<{
    success: boolean;
    report: {
      username: string;
      week_start: string;
      week_end: string;
      total_stars: number;
      total_views: number;
      total_visitors: number;
      top_repos: Array<{
        name: string;
        stars: number;
        views: number;
        visitors: number;
      }>;
      new_repos: number;
      updated_repos: number;
    };
    pdfPath: string;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      console.log('Generating report for username:', username);

      const response = await fetch('/api/reports/' + reportType, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedReport(data);
        console.log('Report generated successfully for:', username);
      } else {
        console.error('Failed to generate report for:', username);
        alert('Failed to generate report.');
      }
    } catch (error) {
      console.error('Error generating report for username:', username, error);
      alert('An error occurred while generating the report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!generatedReport) return;

    setIsDownloading(true);
    try {
      console.log('Downloading report for username:', username);

      const params = new URLSearchParams({
        type: reportType,
        username,
      });

      const response = await fetch(`/api/reports/download?${params}`);

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
        console.log('Report downloaded successfully for:', username);
      } else {
        console.error('Download failed for username:', username);
        alert('Download failed.');
      }
    } catch (error) {
      console.error('Error downloading report for username:', username, error);
      alert('An error occurred during download.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-lg sm:text-xl font-bold text-gray-900'>
            <span className='hidden sm:inline'>Generate Weekly Report</span>
            <span className='sm:hidden'>Weekly Report</span>
          </h2>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 p-1'
          >
            <X className='h-5 w-5 sm:h-6 sm:w-6' />
          </button>
        </div>

        <div className='space-y-3 sm:space-y-4'>
          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className='w-full bg-emerald-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-emerald-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base'
          >
            {isGenerating ? (
              <>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                <span className='hidden sm:inline'>Generating...</span>
                <span className='sm:hidden'>Generating</span>
              </>
            ) : (
              <>
                <FileText className='h-4 w-4 mr-2' />
                <span className='hidden sm:inline'>Generate Report</span>
                <span className='sm:hidden'>Generate</span>
              </>
            )}
          </button>

          {/* Download Button */}
          {generatedReport && (
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className='w-full bg-gray-600 text-white py-3 sm:py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer text-sm sm:text-base'
            >
              {isDownloading ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                  <span className='hidden sm:inline'>Downloading...</span>
                  <span className='sm:hidden'>Downloading</span>
                </>
              ) : (
                <>
                  <Download className='h-4 w-4 mr-2' />
                  <span className='hidden sm:inline'>Download PDF</span>
                  <span className='sm:hidden'>Download</span>
                </>
              )}
            </button>
          )}

          {/* Report Info */}
          {generatedReport && (
            <div className='bg-green-50 border border-green-200 rounded-md p-3'>
              <p className='text-xs sm:text-sm text-green-800'>
                ✅ Report generated successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
