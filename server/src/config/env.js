import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5001;
export const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brewandbean';
export const JWT_SECRET = process.env.JWT_SECRET || 'brew_and_bean_super_secret_jwt_key_2026';
export const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
export const QR_BASE_URL = process.env.QR_BASE_URL || 'http://localhost:5173';
export const ADMIN_RECOVERY_KEY = process.env.ADMIN_RECOVERY_KEY || 'brew2026admin';

// UPI & Online Payment Gateway Configuration
export const CAFE_UPI_ID = process.env.CAFE_UPI_ID || 'karandudhbhate2@oksbi';
export const CAFE_PAYEE_NAME = process.env.CAFE_PAYEE_NAME || 'BREW AND BEAN CAFE';
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

