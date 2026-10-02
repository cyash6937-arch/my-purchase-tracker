import express from 'express';
import { getDashboardSummary, getFullReports, exportPurchasesCSV } from '../controllers/reportController.js';

const router = express.Router();

router.get('/summary', getDashboardSummary);
router.get('/analytics', getFullReports);
router.get('/export-csv', exportPurchasesCSV);

export default router;
