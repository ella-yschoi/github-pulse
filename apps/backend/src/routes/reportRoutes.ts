import { Router } from 'express';
import { ReportController } from '../controllers/reportController';

const router = Router();
const reportController = new ReportController();

// Generate weekly report
router.post('/weekly', reportController.generateWeeklyReport);

// Get report status
router.get('/status/:reportId', reportController.getReportStatus);

// Download report
router.get('/download/:reportId', reportController.downloadReport);

export { router as reportRoutes };
