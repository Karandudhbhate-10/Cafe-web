import mongoose from 'mongoose';
import crypto from 'crypto';

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedCustomizations: [
    {
      groupName: String,
      optionName: String,
      price: { type: Number, default: 0 },
    },
  ],
  specialInstructions: { type: String, default: '' },
  itemTotal: { type: Number, required: true },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['received', 'accepted', 'preparing', 'ready', 'completed', 'rejected'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tableNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    trackingToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },
    customerName: {
      type: String,
      trim: true,
      default: 'Guest',
    },
    customerNotes: {
      type: String,
      default: '',
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['received', 'accepted', 'preparing', 'ready', 'completed', 'rejected'],
      default: 'received',
      index: true,
    },
    statusHistory: [statusHistorySchema],
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['pay_at_counter', 'cash', 'upi', 'upi_qr', 'card', 'razorpay', 'gpay', 'phonepe', 'paytm'],
      default: 'pay_at_counter',
    },
    paymentDetails: {
      razorpayOrderId: { type: String, default: null },
      razorpayPaymentId: { type: String, default: null },
      razorpaySignature: { type: String, default: null },
      transactionRef: { type: String, default: null },
      paidAt: { type: Date, default: null },
      failureReason: { type: String, default: null },
      gatewayStatus: { type: String, default: null },
      verifiedBy: {
        type: String,
        enum: ['gateway_signature', 'webhook', 'staff_manual', 'none'],
        default: 'none',
      },
    },
    preparedAt: { type: Date },
    completedAt: { type: Date },
    preparationTimeMinutes: { type: Number, default: null },
  },
  {
    timestamps: true,
  }
);

// Method to calculate prep time when completed
orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    const now = new Date();
    if (this.status === 'ready' && !this.preparedAt) {
      this.preparedAt = now;
    }
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = now;
      if (this.createdAt) {
        this.preparationTimeMinutes = Math.round((now - this.createdAt) / (1000 * 60));
      }
    }
  }
  next();
});

export const Order = mongoose.model('Order', orderSchema);
