import express from 'express';
import {
  createOrder,
  trackOrder,
  getAdminOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getTableOrders,
  getActiveTableOrder,
} from '../controllers/orderController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public customer routes
router.post('/', createOrder);
router.get('/track/:token', trackOrder);
router.get('/table/:tableNumber/active', getActiveTableOrder);
router.get('/table/:tableNumber', getTableOrders);

// Staff / Admin routes (Protected)
router.get('/admin', requireAuth, getAdminOrders);
router.patch('/admin/:id/status', requireAuth, updateOrderStatus);
router.patch('/admin/:id/payment', requireAuth, updatePaymentStatus);

export default router;

