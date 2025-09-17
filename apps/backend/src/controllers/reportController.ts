import { Request, Response } from 'express';
import { ReportService } from '../services/reportService';
import { PDFService } from '../services/pdfService';
import { ReportRequest } from '../types';

export class ReportController {
  private reportService: ReportService;
  private pdfService: PDFService;

  constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is required');
    }
    this.reportService = new ReportService(githubToken);
    this.pdfService = new PDFService();
  }

  generateWeeklyReport = async (req: Request, res: Response) => {
    try {
      const { username, start_date } = req.body as ReportRequest;

      if (!username) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Username is required',
        });
      }

      console.log(`Generating weekly report for ${username}...`);
      const report = await this.reportService.generateWeeklyReport(
        username,
        start_date
      );

      let pdfPath = null;

      try {
        // Generate PDF (optional)
        pdfPath = await this.pdfService.generateWeeklyReportPDF(report);
        console.log(`PDF generated: ${pdfPath}`);
      } catch (pdfError: any) {
        console.warn(
          'PDF generation failed, continuing with JSON response:',
          pdfError.message
        );
      }

      res.json({
        success: true,
        report,
        pdfPath,
        message: 'Weekly report generated successfully',
      });
    } catch (error) {
      console.error('Error generating weekly report:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to generate weekly report',
      });
    }
  };

  getReportStatus = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;

      // TODO: Implement report status tracking
      res.json({
        reportId,
        status: 'completed',
        message: 'Report status retrieved',
      });
    } catch (error) {
      console.error('Error getting report status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get report status',
      });
    }
  };

  downloadReport = async (req: Request, res: Response) => {
    try {
      const { reportId } = req.params;
      const { type, username, start_date } = req.query;

      if (type !== 'weekly') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Only weekly reports are supported',
        });
      }

      let report;
      let pdfPath = null;

      report = await this.reportService.generateWeeklyReport(
        username as string,
        start_date as string
      );
      try {
        pdfPath = await this.pdfService.generateWeeklyReportPDF(report);
      } catch (pdfError: any) {
        console.warn('PDF generation failed for download:', pdfError.message);
      }

      if (pdfPath) {
        res.download(pdfPath, (err) => {
          if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({
              error: 'Internal Server Error',
              message: 'Failed to download file',
            });
          }
        });
      } else {
        // PDF 생성 실패 시 JSON 응답으로 대체
        res.json({
          success: false,
          message: 'PDF generation failed, but report data is available',
          report,
          pdf_available: false,
        });
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to download report',
      });
    }
  };
}
