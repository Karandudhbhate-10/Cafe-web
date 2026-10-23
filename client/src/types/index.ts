export interface CustomizationOption {
  _id?: string;
  name: string;
  price: number;
}

export interface CustomizationGroup {
  _id?: string;
  name: string;
  type: 'single' | 'multiple';
  required?: boolean;
  options: CustomizationOption[];
}

export interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  isAvailable: boolean;
  isBestseller?: boolean;
  isFeatured?: boolean;
  dietary?: string[];
  prepTimeMinutes?: number;
  customizations?: CustomizationGroup[];
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  order: number;
  icon?: string;
  description?: string;
}

export interface TableItem {
  _id: string;
  tableNumber: string;
  name: string;
  capacity: number;
  isActive: boolean;
  qrCodeDataUrl?: string;
  targetUrl?: string;
  notes?: string;
}

export interface SelectedCustomization {
  groupName: string;
  optionName: string;
  price: number;
}

export interface CartItem {
  cartItemId: string; // unique client id
  menuItemId: string;
  name: string;
  price: number; // base price
  unitPrice: number; // base + customizations
  quantity: number;
  selectedCustomizations: SelectedCustomization[];
  specialInstructions?: string;
  image: string;
}

export interface OrderItem {
  _id?: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  selectedCustomizations: SelectedCustomization[];
  specialInstructions?: string;
  itemTotal: number;
}

export interface StatusHistory {
  status: 'received' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected';
  timestamp: string;
  note?: string;
}

export interface PaymentDetails {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  transactionRef?: string;
  paidAt?: string;
  failureReason?: string;
  gatewayStatus?: string;
  verifiedBy?: 'gateway_signature' | 'webhook' | 'staff_manual' | 'none';
}

export interface PaymentConfig {
  upi: {
    upiId: string;
    payeeName: string;
  };
  gateway: {
    provider: string;
    isConfigured: boolean;
    keyId: string | null;
  };
}

export interface Order {
  _id: string;
  orderNumber: string;
  tableNumber: string;
  trackingToken: string;
  customerName?: string;
  customerNotes?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'received' | 'accepted' | 'preparing' | 'ready' | 'completed' | 'rejected';
  statusHistory: StatusHistory[];
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: string;
  paymentDetails?: PaymentDetails;
  createdAt: string;
  updatedAt: string;
  preparationTimeMinutes?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'manager';
}

export interface DashboardStats {
  totalOrdersToday: number;
  newOrders: number;
  acceptedOrders: number;
  preparingOrders: number;
  readyOrders: number;
  completedOrders: number;
  rejectedOrders: number;
  todaySales: number;
  pendingRevenue: number;
  avgPrepTime: number;
  popularItems: { name: string; count: number; revenue: number }[];
}
