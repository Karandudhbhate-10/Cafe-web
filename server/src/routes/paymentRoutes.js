import express from 'express';
import {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleRazorpayWebhook,
  recordUpiIntent,
} from '../controllers/paymentController.js';

const router = express.Router();

// Public payment endpoints
router.get('/config', getPaymentConfig);
router.post('/create-razorpay-order', createRazorpayOrder);
router.post('/verify-razorpay-payment', verifyRazorpayPayment);
router.post('/webhook', handleRazorpayWebhook);
router.post('/record-upi-intent', recordUpiIntent);

export default router;
