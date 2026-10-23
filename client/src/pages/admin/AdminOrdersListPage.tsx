import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  Coffee,
  CheckCircle2,
  Clock,
  MapPin,
  AlertTriangle,
  X,
  Bell,
  Sparkles,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { OrderCard } from '../../components/admin/OrderCard';
import { BillPaymentModal } from '../../components/admin/BillPaymentModal';
import { api } from '../../services/api';
import { joinStaffChannel, onNewOrder, onOrderStatusUpdate } from '../../services/socket';
import { playNewOrderChime } from '../../utils/audioAlert';
import { Order } from '../../types';

export const AdminOrdersListPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'ready' | 'history'>('active');
  const [search, setSearch] = useState('');
  const [tableFilter, setTableFilter] = useState('all');
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Item out of stock or ingredient unavailable');
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);

  // Load orders from API (fetches all recent orders, tab filtering and counting is handled smoothly in memory)
  const loadOrders = useCallback(async () => {
    try {
      const data = await api.getAdminOrders({
        status: 'all',
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error('[Load Orders Error]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();

    // Connect to real-time staff channel
    joinStaffChannel();

    // Listen for incoming table orders
    const unsubNew = onNewOrder((newOrder) => {
      playNewOrderChime();
      setNewOrderToast(`🔔 New Order #${newOrder.orderNumber} placed at Table ${newOrder.tableNumber}!`);
      setTimeout(() => setNewOrderToast(null), 6000);

      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) {
          return prev.map((o) => (o._id === newOrder._id ? newOrder : o));
        }
        return [newOrder, ...prev];
      });
    });

    // Listen for order status updates
    const unsubStatus = onOrderStatusUpdate((updatedOrder) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === updatedOrder._id);
        if (exists) {
          return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
        }
        return [updatedOrder, ...prev];
      });
    });

    // Fallback periodic sync every 25s
    const timer = setInterval(loadOrders, 25000);

    return () => {
      unsubNew();
      unsubStatus();
      clearInterval(timer);
    };
  }, [loadOrders]);

  // Handle single-action status update (e.g. Mark Ready, Mark Served)
  const handleUpdateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, note);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Confirm order rejection
  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    try {
      await handleUpdateStatus(rejectingOrder._id, 'rejected', rejectReason);
      setRejectingOrder(null);
    } catch (err: any) {
      alert(err.message || 'Failed to reject order');
    }
  };

  // Settle bill through authorized payment flow
  const handleConfirmPayment = async (orderId: string, paymentMethod: string) => {
    try {
      const updated = await api.updatePaymentStatus(orderId, 'paid', paymentMethod, true);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Payment settlement failed');
    }
  };

  // Filter orders based on active tab
  const displayedOrders = useMemo(() => {
    return orders.filter((o) => {
      // Table filter
      if (tableFilter !== 'all' && o.tableNumber.toUpperCase() !== tableFilter.toUpperCase()) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          o.orderNumber.toLowerCase().includes(q) ||
          o.tableNumber.toLowerCase().includes(q) ||
          (o.customerName && o.customerName.toLowerCase().includes(q)) ||
          o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Tab filter
      if (activeTab === 'active') {
        // Active orders: received, accepted, preparing, ready (completed and rejected stay out of active list!)
        return o.status !== 'completed' && o.status !== 'rejected';
      }
      if (activeTab === 'ready') {
        return o.status === 'ready';
      }
      if (activeTab === 'history') {
        return o.status === 'completed' || o.status === 'rejected';
      }
      return true;
    });
  }, [orders, activeTab, tableFilter, search]);

  // Derived counts for tabs
  const activeCount = useMemo(
    () => orders.filter((o) => o.status !== 'completed' && o.status !== 'rejected').length,
    [orders]
  );
  const readyCount = useMemo(() => orders.filter((o) => o.status === 'ready').length, [orders]);
  const historyCount = useMemo(
    () => orders.filter((o) => o.status === 'completed' || o.status === 'rejected').length,
    [orders]
  );

  // Unique table list for dropdown
  const uniqueTables = useMemo(() => {
    const set = new Set(orders.map((o) => o.tableNumber.toUpperCase()));
    return Array.from(set).sort();
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col lg:flex-row text-espresso">
      {/* 3-Tab Sidebar */}
      <AdminSidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Orders"
          subtitle="Real-time table orders • Streamlined preparation & settlement"
        />

        {/* Real-time Order Arrival Banner */}
        {newOrderToast && (
          <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-caramel text-white rounded-2xl shadow-warm-md flex items-center justify-between text-xs sm:text-sm font-bold animate-bounce">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 animate-spin text-white" />
              <span>{newOrderToast}</span>
            </div>
            <button
              onClick={() => setNewOrderToast(null)}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <main className="p-4 sm:p-6 space-y-5 flex-1 overflow-y-auto pb-28 lg:pb-8">
          {/* Controls Bar: Navigation Tabs + Search + Table Filter */}
          <div className="bg-white rounded-3xl p-4 border border-espresso/10 shadow-warm-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* View Switcher: Active vs Ready vs History */}
            <div className="flex items-center bg-cream-soft p-1 rounded-2xl border border-espresso/10 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('active')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'active'
                    ? 'bg-espresso text-cream shadow-warm-sm'
                    : 'text-espresso/70 hover:text-espresso'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-caramel" />
                <span>Active Orders</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'active'
                      ? 'bg-caramel text-white'
                      : 'bg-espresso/10 text-espresso'
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ready')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ready'
                    ? 'bg-emerald-600 text-white shadow-warm-sm'
                    : 'text-espresso/70 hover:text-espresso'
                }`}
              >
                <span>Ready to Serve</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'ready'
                      ? 'bg-white text-emerald-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {readyCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-espresso text-cream shadow-warm-sm'
                    : 'text-espresso/70 hover:text-espresso'
                }`}
              >
                <span>History</span>
                <span
                  className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'history'
                      ? 'bg-caramel text-white'
                      : 'bg-espresso/10 text-espresso'
                  }`}
                >
                  {historyCount}
                </span>
              </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-xl justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search order #, item, guest..."
                  className="w-full bg-cream-soft border border-espresso/10 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                />
              </div>

              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="w-full sm:w-auto bg-cream-soft border border-espresso/10 rounded-xl px-3.5 py-2 text-xs font-bold text-espresso focus:outline-none focus:ring-2 focus:ring-caramel"
              >
                <option value="all">All Tables</option>
                {uniqueTables.map((t) => (
                  <option key={t} value={t}>
                    Table {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orders Grid */}
          {displayedOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 border border-espresso/10 text-center space-y-3 shadow-warm-sm my-6">
              <div className="w-14 h-14 rounded-full bg-cream-soft text-caramel flex items-center justify-center mx-auto border border-espresso/10 shadow-xs">
                <Coffee className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                {activeTab === 'active'
                  ? 'No Active Orders'
                  : activeTab === 'ready'
                  ? 'No Orders Ready to Serve'
                  : 'No Orders Found'}
              </h3>
              <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                {activeTab === 'active'
                  ? 'Incoming orders placed from table QR codes will appear here automatically in real time.'
                  : 'Orders marked as ready for pickup or table delivery will show here.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedOrders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onRequestReject={(ord) => setRejectingOrder(ord)}
                  onOpenBill={(ord) => setBillingOrder(ord)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Bill & Settlement Modal with Authentic Centered Receipt */}
      <BillPaymentModal
        order={billingOrder}
        isOpen={Boolean(billingOrder)}
        onClose={() => setBillingOrder(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Confirmation Modal for Order Rejection */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="p-2.5 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-lg font-bold text-espresso">
                  Reject Order #{rejectingOrder.orderNumber}?
                </h3>
                <p className="text-xs text-espresso/70 mt-1">
                  Table {rejectingOrder.tableNumber} will be notified immediately that their order could not be fulfilled.
                </p>
              </div>
              <button
                onClick={() => setRejectingOrder(null)}
                className="text-espresso/40 hover:text-espresso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-espresso block mb-1">
                Reason for Rejection:
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-cream-soft border border-espresso/15 rounded-xl px-3 py-2 text-xs text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="Item out of stock or ingredient unavailable">Item out of stock / ingredient unavailable</option>
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Invalid table selection or duplicate order">Invalid table selection / duplicate order</option>
                <option value="Kitchen closing time reached">Kitchen closing time reached</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectingOrder(null)}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-espresso/70 hover:bg-espresso/5"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
