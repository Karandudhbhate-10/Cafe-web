import express from 'express';
import {
  getAllTables,
  validateTable,
  createTable,
  updateTable,
  deleteTable,
  updateBaseUrlAndRegenerateAll,
} from '../controllers/tableController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public table validation route (used when customer scans QR code)
router.get('/validate/:tableNumber', validateTable);

// Public table list for customer status or table selector fallback
router.get('/public', async (req, res, next) => {
  req.isPublic = true;
  return getAllTables(req, res, next);
});

// Admin routes (Protected)
router.get('/', requireAuth, getAllTables);
router.post('/', requireAuth, createTable);
router.put('/:id', requireAuth, updateTable);
router.delete('/:id', requireAuth, deleteTable);
router.post('/regenerate-qr', requireAuth, updateBaseUrlAndRegenerateAll);

export default router;
