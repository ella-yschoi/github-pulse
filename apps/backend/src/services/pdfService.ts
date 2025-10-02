import puppeteer from 'puppeteer';
import { WeeklyReport } from '../types';
import path from 'path';
import fs from 'fs';

export class PDFService {
  private outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'reports');
    this.ensureOutputDir();
  }

  private ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  async generateWeeklyReportPDF(report: WeeklyReport): Promise<string> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-images',
          '--no-first-run',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
      });

      const page = await browser.newPage();

      // 페이지 설정
      await page.setViewport({ width: 1200, height: 800 });
      await page.setDefaultNavigationTimeout(30000);

      const html = this.generateWeeklyReportHTML(report);
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const filename = `weekly-report-${report.username}-${report.week_start}.pdf`;
      const filepath = path.join(this.outputDir, filename);

      await page.pdf({
        path: filepath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm',
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });

      // 파일이 제대로 생성되었는지 확인
      if (!fs.existsSync(filepath)) {
        throw new Error('PDF file was not created');
      }

      const stats = fs.statSync(filepath);
      if (stats.size === 0) {
        throw new Error('PDF file is empty');
      }

      return filepath;
    } catch (error) {
      console.error('Error generating weekly report PDF:', error);
      throw new Error(
        `Failed to generate PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
    }
  }

  // Generate PDF as Buffer (no filesystem I/O) for environments where disk write may fail
  async generateWeeklyReportPDFBuffer(report: WeeklyReport): Promise<Buffer> {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-extensions',
          '--disable-plugins',
          '--no-first-run',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
        ],
        timeout: 60000,
        protocolTimeout: 60000,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 800 });
      await page.setDefaultNavigationTimeout(30000);

      const html = this.generateWeeklyReportHTML(report);
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
      });

      const buffer = Buffer.from(pdf);
      if (buffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }
      return buffer;
    } catch (error) {
      console.error('Error generating weekly report PDF buffer:', error);
      throw new Error(
        `Failed to generate PDF buffer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch (closeError) {
          console.warn('Error closing browser:', closeError);
        }
      }
    }
  }

  private generateWeeklyReportHTML(report: WeeklyReport): string {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>GitHub Pulse - Weekly Report</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 15px;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #10b981;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #10b981;
                margin: 0;
                font-size: 2.2em;
            }
            .header h2 {
                color: #6b7280;
                margin: 10px 0 0 0;
                font-weight: normal;
            }
            .period {
                background: #f3f4f6;
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                margin-bottom: 20px;
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            .stat-card {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
            }
            .stat-number {
                font-size: 1.8em;
                font-weight: bold;
                color: #10b981;
                margin-bottom: 3px;
            }
            .stat-label {
                color: #6b7280;
                font-size: 0.9em;
            }
            .section {
                margin-bottom: 20px;
            }
            .section h3 {
                color: #374151;
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 8px;
            }
            .repo-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .repo-table th,
            .repo-table td {
                padding: 8px 12px;
                text-align: left;
                border-bottom: 1px solid #e5e7eb;
            }
            .repo-table th {
                background: #f9fafb;
                font-weight: 600;
                color: #374151;
            }
            .repo-name {
                font-weight: 500;
                color: #1f2937;
            }
            .footer {
                margin-top: 25px;
                padding-top: 15px;
                border-top: 1px solid #e5e7eb;
                text-align: center;
                color: #6b7280;
                font-size: 0.9em;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>GitHub Pulse</h1>
            <h2>Weekly Report</h2>
        </div>

        <div class="period">
            <strong>${report.username}</strong> | ${report.week_start} ~ ${
      report.week_end
    }
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">${report.total_stars.toLocaleString()}</div>
                <div class="stat-label">Total Stars</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.total_views.toLocaleString()}</div>
                <div class="stat-label">Views</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.total_visitors.toLocaleString()}</div>
                <div class="stat-label">Unique Visitors</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${report.new_repos}</div>
                <div class="stat-label">New Repos</div>
            </div>
        </div>

        <div class="section">
            <h3>Top Repositories</h3>
            <table class="repo-table">
                <thead>
                    <tr>
                        <th>Repository</th>
                        <th>Stars</th>
                        <th>Views</th>
                        <th>Visitors</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.top_repos
                      .map(
                        (repo) => `
                        <tr>
                            <td class="repo-name">${repo.name}</td>
                            <td>${repo.stars.toLocaleString()}</td>
                            <td>${repo.views.toLocaleString()}</td>
                            <td>${repo.visitors.toLocaleString()}</td>
                        </tr>
                    `
                      )
                      .join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated by GitHub Pulse | ${new Date().toLocaleDateString(
              'en-US'
            )}</p>
        </div>
    </body>
    </html>
    `;
  }
}
