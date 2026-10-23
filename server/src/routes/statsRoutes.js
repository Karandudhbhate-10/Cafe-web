import express from 'express';
import { getDashboardStats, exportOrdersCsv } from '../controllers/statsController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', requireAuth, getDashboardStats);
router.get('/export-csv', requireAuth, exportOrdersCsv);

export default router;
