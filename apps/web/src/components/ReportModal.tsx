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
      } else {
        alert('Failed to generate report.');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('An error occurred while generating the report.');
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
      } else {
        alert('Download failed.');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('An error occurred during download.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg p-6 w-full max-w-md mx-4'>
        <div className='flex justify-between items-center mb-4'>
          <h2 className='text-xl font-bold text-gray-900'>
            Generate Weekly Report
          </h2>
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
                Generating...
              </>
            ) : (
              <>
                <FileText className='h-4 w-4 mr-2' />
                Generate Report
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
                  Downloading...
                </>
              ) : (
                <>
                  <Download className='h-4 w-4 mr-2' />
                  Download PDF
                </>
              )}
            </button>
          )}

          {/* Report Info */}
          {generatedReport && (
            <div className='bg-green-50 border border-green-200 rounded-md p-3'>
              <p className='text-sm text-green-800'>
                ✅ Report generated successfully!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
