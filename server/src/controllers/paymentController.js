import crypto from 'crypto';
import Razorpay from 'razorpay';
import { Order } from '../models/Order.js';
import { emitOrderStatusUpdate } from '../socket/socketHandler.js';
import {
  CAFE_UPI_ID,
  CAFE_PAYEE_NAME,
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET,
} from '../config/env.js';

// Lazy-initialize Razorpay instance if keys are configured
const getRazorpayInstance = () => {
  if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
    return new Razorpay({
      key_id: RAZORPAY_KEY_ID,
      key_secret: RAZORPAY_KEY_SECRET,
    });
  }
  return null;
};

// 1. Get Public Payment Gateway & UPI Configuration
export const getPaymentConfig = async (req, res) => {
  try {
    const isGatewayConfigured = Boolean(
      RAZORPAY_KEY_ID &&
      RAZORPAY_KEY_SECRET &&
      !RAZORPAY_KEY_ID.includes('YourKeyId')
    );

    return res.json({
      success: true,
      upi: {
        upiId: CAFE_UPI_ID,
        payeeName: CAFE_PAYEE_NAME,
      },
      gateway: {
        provider: 'razorpay',
        isConfigured: isGatewayConfigured,
        keyId: isGatewayConfigured ? RAZORPAY_KEY_ID : null,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Razorpay Payment Order (Server calculated amount, trusted)
export const createRazorpayOrder = async (req, res) => {
  try {
    const { orderToken } = req.body;
    if (!orderToken) {
      return res.status(400).json({ success: false, message: 'Order token is required' });
    }

    const order = await Order.findOne({ trackingToken: orderToken });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid and settled.',
      });
    }

    const rzp = getRazorpayInstance();
    if (!rzp) {
      return res.status(400).json({
        success: false,
        gatewayConfigured: false,
        message:
          'Razorpay payment gateway is not configured. Please use Google Pay, PhonePe, Paytm, or UPI QR code to complete payment.',
      });
    }

    // Convert amount in INR to paise (e.g. ₹150.00 -> 15000 paise)
    const amountInPaise = Math.round(order.total * 100);

    const rzpOrder = await rzp.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${order.orderNumber}_${Date.now().toString().slice(-4)}`,
      notes: {
        orderNumber: order.orderNumber,
        tableNumber: order.tableNumber,
        trackingToken: order.trackingToken,
      },
    });

    // Save Razorpay order ID to our order record
    if (!order.paymentDetails) order.paymentDetails = {};
    order.paymentDetails.razorpayOrderId = rzpOrder.id;
    order.paymentMethod = 'razorpay';
    await order.save();

    return res.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: RAZORPAY_KEY_ID,
      orderNumber: order.orderNumber,
      tableNumber: order.tableNumber,
      customerName: order.customerName,
    });
  } catch (error) {
    console.error('[Razorpay Order Creation Failed]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment gateway: ' + error.message,
    });
  }
};

// 3. Cryptographic Signature Verification for Razorpay Payment
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { orderToken, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!orderToken || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    const order = await Order.findOne({ trackingToken: orderToken });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Idempotent: if already verified and marked paid, return success
    if (order.paymentStatus === 'paid') {
      return res.json({
        success: true,
        message: 'Payment already verified and settled',
        order,
      });
    }

    // Verify cryptographic HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const generatedSignature = hmac.digest('hex');

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!isSignatureValid) {
      if (!order.paymentDetails) order.paymentDetails = {};
      order.paymentStatus = 'failed';
      order.paymentDetails.failureReason = 'Cryptographic signature mismatch';
      await order.save();
      emitOrderStatusUpdate(order);

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed: Invalid digital signature',
      });
    }

    // Mark as PAID
    order.paymentStatus = 'paid';
    order.paymentMethod = 'razorpay';
    if (!order.paymentDetails) order.paymentDetails = {};
    order.paymentDetails.razorpayOrderId = razorpay_order_id;
    order.paymentDetails.razorpayPaymentId = razorpay_payment_id;
    order.paymentDetails.razorpaySignature = razorpay_signature;
    order.paymentDetails.transactionRef = razorpay_payment_id;
    order.paymentDetails.paidAt = new Date();
    order.paymentDetails.gatewayStatus = 'captured';
    order.paymentDetails.verifiedBy = 'gateway_signature';

    order.statusHistory.push({
      status: order.status,
      timestamp: new Date(),
      note: `Online payment verified via Razorpay (Payment ID: ${razorpay_payment_id})`,
    });

    await order.save();

    // Broadcast real-time update to staff dashboard and customer view
    emitOrderStatusUpdate(order);

    return res.json({
      success: true,
      message: 'Payment verified successfully! Thank you for dining with BREW & BEAN.',
      order,
    });
  } catch (error) {
    console.error('[Razorpay Payment Verification Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Payment verification processing error: ' + error.message,
    });
  }
};

// 4. Razorpay Webhook Handler (Authoritative async server-to-server confirmation)
export const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({ success: false, message: 'Missing signature header' });
    }

    if (!RAZORPAY_WEBHOOK_SECRET) {
      console.warn('[Webhook Warning] RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(200).json({ status: 'ignored_no_secret' });
    }

    // Verify webhook signature with raw payload
    const bodyStr = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_WEBHOOK_SECRET)
      .update(bodyStr)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.error('[Webhook Error] Invalid webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payload = req.body.payload;

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id || payload.order?.entity?.id;

      if (rzpOrderId) {
        const order = await Order.findOne({
          'paymentDetails.razorpayOrderId': rzpOrderId,
        });

        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'paid';
          order.paymentMethod = 'razorpay';
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.razorpayPaymentId = paymentEntity?.id || 'webhook_captured';
          order.paymentDetails.transactionRef = paymentEntity?.id || 'webhook_captured';
          order.paymentDetails.paidAt = new Date();
          order.paymentDetails.gatewayStatus = 'captured';
          order.paymentDetails.verifiedBy = 'webhook';

          order.statusHistory.push({
            status: order.status,
            timestamp: new Date(),
            note: `Payment captured via Razorpay Webhook (Event: ${event})`,
          });

          await order.save();
          emitOrderStatusUpdate(order);
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      if (rzpOrderId) {
        const order = await Order.findOne({
          'paymentDetails.razorpayOrderId': rzpOrderId,
        });
        if (order && order.paymentStatus !== 'paid') {
          order.paymentStatus = 'failed';
          if (!order.paymentDetails) order.paymentDetails = {};
          order.paymentDetails.failureReason = paymentEntity.error_description || 'Payment failed';
          await order.save();
          emitOrderStatusUpdate(order);
        }
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('[Razorpay Webhook Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Record UPI App Click / Deep Link Intent (Status stays PENDING until verified)
export const recordUpiIntent = async (req, res) => {
  try {
    const { orderToken, method } = req.body;
    if (!orderToken) {
      return res.status(400).json({ success: false, message: 'Order token is required' });
    }

    const order = await Order.findOne({ trackingToken: orderToken });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const validMethods = ['gpay', 'phonepe', 'paytm', 'upi', 'upi_qr'];
    const chosenMethod = validMethods.includes(method) ? method : 'upi';

    // Update payment method for display, but KEEP status as PENDING!
    // Rule: Opening a UPI app does NOT prove payment succeeded.
    order.paymentMethod = chosenMethod;
    if (!order.paymentDetails) order.paymentDetails = {};
    order.paymentDetails.gatewayStatus = 'intent_opened';

    await order.save();
    emitOrderStatusUpdate(order);

    return res.json({
      success: true,
      message: 'UPI payment intent initiated. Status remains pending until verified.',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
