import { Request, Response } from 'express';
import dotenv from 'dotenv';
import { ReportService } from '../services/reportService';
import { PDFService } from '../services/pdfService';
import { ReportRequest } from '../types';

// Load environment variables
dotenv.config();

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

      // Log the request for debugging
      console.log(
        `Generating weekly report for username: ${username}, start_date: ${start_date}`
      );

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
      } catch (pdfError: unknown) {
        console.warn(
          'PDF generation failed, continuing with JSON response:',
          pdfError instanceof Error ? pdfError.message : 'Unknown error'
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

      // Log the request for debugging
      console.log(
        `Download request - reportId: ${reportId}, type: ${type}, username: ${username}, start_date: ${start_date}`
      );

      if (type !== 'weekly') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Only weekly reports are supported',
        });
      }

      if (!username) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Username is required for download',
        });
      }

      let pdfPath = null as string | null;
      let pdfBuffer = null as Buffer | null;

      console.log(
        `Generating report for download - username: ${username}, start_date: ${start_date}`
      );
      const report = await this.reportService.generateWeeklyReport(
        username as string,
        start_date as string
      );
      // Try memory buffer-based streaming first (for serverless/limited filesystem environments)
      try {
        pdfBuffer = await this.pdfService.generateWeeklyReportPDFBuffer(report);
      } catch (bufferErr: unknown) {
        console.warn(
          'PDF buffer generation failed, fallback to file path:',
          bufferErr instanceof Error ? bufferErr.message : 'Unknown error'
        );
        try {
          pdfPath = await this.pdfService.generateWeeklyReportPDF(report);
        } catch (pdfError: unknown) {
          console.warn(
            'PDF file generation failed for download:',
            pdfError instanceof Error ? pdfError.message : 'Unknown error'
          );
        }
      }

      if (pdfBuffer) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="weekly-report-${username}-${report.week_start}.pdf"`
        );
        res.setHeader(
          'Content-Length',
          Buffer.byteLength(pdfBuffer).toString()
        );
        return res.status(200).send(pdfBuffer);
      }

      if (pdfPath) {
        return res.download(pdfPath, (err) => {
          if (err) {
            console.error('Error downloading file:', err);
            res.status(500).json({
              error: 'Internal Server Error',
              message: 'Failed to download file',
            });
          }
        });
      }

      // JSON response when all methods fail
      return res.status(502).json({
        success: false,
        message: 'PDF generation failed, but report data is available',
        report,
        pdf_available: false,
      });
    } catch (error) {
      console.error('Error downloading report:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to download report',
      });
    }
  };
}
