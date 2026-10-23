import { MenuItem, Category, TableItem, Order, User, DashboardStats } from '../types';

const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('bb_admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const api = {
  // Public Menu & Categories
  async getMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
    const res = await fetch(`${API_BASE}/menu`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch menu');
    return data;
  },

  // Table validation (from QR code scan)
  async validateTable(tableNumber: string): Promise<{ valid: boolean; table: Partial<TableItem>; message?: string }> {
    const res = await fetch(`${API_BASE}/tables/validate/${encodeURIComponent(tableNumber)}`);
    const data = await res.json();
    return data;
  },

  // Public Table List
  async getPublicTables(): Promise<TableItem[]> {
    const res = await fetch(`${API_BASE}/tables/public`);
    const data = await res.json();
    return data.tables || [];
  },

  // Customer Order Placement
  async createOrder(orderPayload: {
    tableNumber: string;
    customerName?: string;
    customerNotes?: string;
    items: {
      menuItemId: string;
      name: string;
      quantity: number;
      selectedCustomizations: { groupName: string; optionName: string; price: number }[];
      specialInstructions?: string;
    }[];
  }): Promise<{ success: boolean; orderNumber: string; trackingToken: string; order: Order }> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to place order');
    return data;
  },

  // Customer Order Tracking
  async trackOrder(token: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/track/${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Order not found');
    return data.order;
  },

  // Check if a table has an ongoing active order
  async getActiveTableOrder(tableNumber: string): Promise<{
    success: boolean;
    hasActiveOrder: boolean;
    order?: {
      _id: string;
      orderNumber: string;
      tableNumber: string;
      trackingToken: string;
      status: string;
      total: number;
      createdAt: string;
    } | null;
    recentRejectedOrder?: {
      orderNumber: string;
      status: string;
      reason?: string;
      tableNumber: string;
    } | null;
  }> {
    const res = await fetch(`${API_BASE}/orders/table/${encodeURIComponent(tableNumber)}/active`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to check active table order');
    return data;
  },

  // Staff Authentication
  async login(credentials: { username: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Authentication failed');
    return data;
  },

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Session expired');
    return data.user;
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to change password');
    return data;
  },

  async changePasswordPublic(payload: {
    username: string;
    currentPassword?: string;
    recoveryKey?: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/change-password-public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update password');
    return data;
  },

  // Staff Dashboard Stats
  async getDashboardStats(): Promise<{ stats: DashboardStats; activeOrders: Order[] }> {
    const res = await fetch(`${API_BASE}/stats/dashboard`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch dashboard stats');
    return data;
  },

  // Staff Orders List & Filtering
  async getAdminOrders(params: {
    status?: string;
    table?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ orders: Order[]; totalCount: number }> {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.table && params.table !== 'all') query.set('table', params.table);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/orders/admin?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch orders');
    return data;
  },

  // Staff Order Status Update
  async updateOrderStatus(orderId: string, status: string, note?: string): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/admin/${orderId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update order status');
    return data.order;
  },

  // Staff Order Payment Update
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string,
    paymentMethod?: string,
    markCompleted?: boolean
  ): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders/admin/${orderId}/payment`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ paymentStatus, paymentMethod, markCompleted }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update payment status');
    return data.order;
  },

  // Fetch orders for a specific table (useful for Table Counter Bill lookup)
  async getTableOrders(tableNumber: string): Promise<{ success: boolean; tableNumber: string; orders: Order[] }> {
    const res = await fetch(`${API_BASE}/orders/table/${encodeURIComponent(tableNumber)}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch table orders');
    return data;
  },


  // Admin Menu Management
  async getAdminMenu(): Promise<{ categories: Category[]; items: MenuItem[] }> {
    const res = await fetch(`${API_BASE}/menu/admin`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch admin menu');
    return data;
  },

  async createMenuItem(payload: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/menu`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create menu item');
    return data.item;
  },

  async updateMenuItem(id: string, payload: Partial<MenuItem>): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update menu item');
    return data.item;
  },

  async toggleItemAvailability(id: string): Promise<MenuItem> {
    const res = await fetch(`${API_BASE}/menu/${id}/toggle-availability`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to toggle availability');
    return data.item;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/menu/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete menu item');
  },

  // Admin Table & QR Management
  async getAdminTables(): Promise<{
    tables: TableItem[];
    baseUrl: string;
    localIp?: string;
    localNetworkBaseUrl?: string;
    masterQr?: { dataUrl: string; targetUrl: string };
  }> {
    const res = await fetch(`${API_BASE}/tables`, {
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch tables');
    return data;
  },

  async createTable(payload: Partial<TableItem>): Promise<TableItem> {
    const res = await fetch(`${API_BASE}/tables`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create table');
    return data.table;
  },

  async updateTable(id: string, payload: Partial<TableItem>): Promise<TableItem> {
    const res = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update table');
    return data.table;
  },

  async deleteTable(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tables/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete table');
  },

  async updateQrBaseUrlAndRegenerate(baseUrl: string): Promise<{ message: string; baseUrl: string }> {
    const res = await fetch(`${API_BASE}/tables/regenerate-qr`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ baseUrl }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to regenerate QR codes');
    return data;
  },

  // CSV Export URL
  getCsvExportUrl(): string {
    const token = localStorage.getItem('bb_admin_token') || '';
    return `${API_BASE}/stats/export-csv?token=${encodeURIComponent(token)}`;
  },

  // Payment API Methods
  async getPaymentConfig(): Promise<{
    success: boolean;
    upi: { upiId: string; payeeName: string };
    gateway: { provider: string; isConfigured: boolean; keyId: string | null };
  }> {
    const res = await fetch(`${API_BASE}/payments/config`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch payment config');
    return data;
  },

  async createRazorpayOrder(orderToken: string): Promise<{
    success: boolean;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    orderNumber: string;
    tableNumber: string;
    customerName?: string;
  }> {
    const res = await fetch(`${API_BASE}/payments/create-razorpay-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderToken }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to initiate gateway payment');
    return data;
  },

  async verifyRazorpayPayment(payload: {
    orderToken: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<{ success: boolean; message: string; order: Order }> {
    const res = await fetch(`${API_BASE}/payments/verify-razorpay-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Payment verification failed');
    return data;
  },

  async recordUpiIntent(orderToken: string, method: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/payments/record-upi-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderToken, method }),
      });
    } catch (err) {
      console.warn('[Record UPI Intent Failed]', err);
    }
  },
};

