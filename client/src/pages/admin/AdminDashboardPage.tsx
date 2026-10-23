import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  Coffee,
  IndianRupee,
  RefreshCw,
  QrCode,
  Search,
  MapPin,
  CheckCircle2,
  Receipt,
  Printer,
  Sparkles,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { StatCard } from '../../components/admin/StatCard';
import { KitchenBoardView } from '../../components/admin/KitchenBoardView';
import { BillPaymentModal } from '../../components/admin/BillPaymentModal';
import { api } from '../../services/api';
import { joinStaffChannel, onNewOrder, onOrderStatusUpdate } from '../../services/socket';
import { playNewOrderChime } from '../../utils/audioAlert';
import { Order, DashboardStats } from '../../types';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newOrderToast, setNewOrderToast] = useState<string | null>(null);
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);
  const [tableSearchInput, setTableSearchInput] = useState('');
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Load stats and active orders from database
  const loadDashboardData = useCallback(async () => {
    try {
      const res = await api.getDashboardStats();
      setStats(res.stats);
      setActiveOrders(res.activeOrders || []);
    } catch (err) {
      console.error('[Dashboard fetch error]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Connect to live staff channel
    joinStaffChannel();

    // Listen for new orders
    const unsubscribeNew = onNewOrder((order) => {
      // Play audio chime
      playNewOrderChime();

      // Show visual notification banner
      setNewOrderToast(`🔔 New Order #${order.orderNumber} placed from Table ${order.tableNumber}!`);
      setTimeout(() => setNewOrderToast(null), 6000);

      // Add to active orders or update existing order if more items were added
      setActiveOrders((prev) => {
        const exists = prev.some((o) => o._id === order._id);
        if (exists) {
          return prev.map((o) => (o._id === order._id ? order : o));
        }
        return [order, ...prev];
      });

      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalOrdersToday: prev.totalOrdersToday + 1,
          newOrders: prev.newOrders + 1,
        };
      });
    });

    // Listen for status updates
    const unsubscribeStatus = onOrderStatusUpdate((updatedOrder) => {
      setActiveOrders((prev) => {
        if (updatedOrder.status === 'completed' || updatedOrder.status === 'rejected') {
          return prev.filter((o) => o._id !== updatedOrder._id);
        }
        return prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o));
      });
      loadDashboardData();
    });

    // Periodic sync every 20s
    const interval = setInterval(loadDashboardData, 20000);

    return () => {
      unsubscribeNew();
      unsubscribeStatus();
      clearInterval(interval);
    };
  }, [loadDashboardData]);

  // Handle status updates from kitchen board
  const handleUpdateStatus = async (orderId: string, status: string, note?: string) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, note);
      setActiveOrders((prev) => {
        if (status === 'completed' || status === 'rejected') {
          return prev.filter((o) => o._id !== orderId);
        }
        return prev.map((o) => (o._id === orderId ? updated : o));
      });
      loadDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Handle staff confirming payment settlement
  const handleConfirmPayment = async (orderId: string, paymentMethod: string) => {
    try {
      await api.updatePaymentStatus(orderId, 'paid', paymentMethod, true);
      setActiveOrders((prev) => prev.filter((o) => o._id !== orderId));
      loadDashboardData();
    } catch (err: any) {
      throw err;
    }
  };

  // Group active orders by table for fast counter lookup
  const tableOrderMap = useMemo(() => {
    const map = new Map<string, Order>();
    for (const ord of activeOrders) {
      // Prioritize ready or active unpaid orders
      if (!map.has(ord.tableNumber) || ord.status === 'ready') {
        map.set(ord.tableNumber, ord);
      }
    }
    return map;
  }, [activeOrders]);

  // Handle looking up a table bill when customer approaches the counter
  const handleLookupTable = async (tableNum: string) => {
    const normalized = tableNum.trim().toUpperCase();
    if (!normalized) return;

    // First check in-memory active orders
    const matched = activeOrders.find((o) => o.tableNumber === normalized && o.status !== 'completed' && o.status !== 'rejected');
    if (matched) {
      setBillingOrder(matched);
      setLookupMessage(null);
      return;
    }

    // Otherwise query server for recent orders for that table
    try {
      const res = await api.getTableOrders(normalized);
      if (res.orders && res.orders.length > 0) {
        // Pick the most recent active or unpaid order
        const target = res.orders.find((o) => o.paymentStatus !== 'paid') || res.orders[0];
        setBillingOrder(target);
        setLookupMessage(null);
      } else {
        setLookupMessage(`No recent orders found for Table ${normalized}.`);
        setTimeout(() => setLookupMessage(null), 4000);
      }
    } catch (err) {
      setLookupMessage(`Unable to find orders for Table ${normalized}.`);
      setTimeout(() => setLookupMessage(null), 4000);
    }
  };

  const defaultTables = ['T01', 'T02', 'T03', 'T04', 'T05', 'T06'];

  return (
    <div className="min-h-screen bg-cream/30 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Kitchen & Live Orders"
          subtitle="Real-time order board and counter billing with dynamic UPI payment QR"
          rightAction={
            <div className="flex items-center space-x-2">
              <button
                onClick={loadDashboardData}
                type="button"
                className="p-2 rounded-xl bg-white border border-espresso/10 hover:border-caramel/40 text-espresso transition-colors"
                title="Refresh board"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          }
        />

        {/* Live Order Toast Alert */}
        {newOrderToast && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-caramel text-white font-bold text-sm shadow-warm-lg flex items-center justify-between animate-bounce">
            <span>{newOrderToast}</span>
            <button
              onClick={() => setNewOrderToast(null)}
              className="text-white/80 hover:text-white text-xs underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <StatCard
              label="Today's Orders"
              value={stats?.totalOrdersToday ?? 0}
              icon={ShoppingBag}
              colorScheme="espresso"
            />
            <StatCard
              label="New / Received"
              value={stats?.newOrders ?? 0}
              icon={Clock}
              colorScheme="amber"
            />
            <StatCard
              label="In Kitchen"
              value={stats?.preparingOrders ?? 0}
              icon={ChefHat}
              colorScheme="blue"
            />
            <StatCard
              label="Ready to Serve"
              value={stats?.readyOrders ?? 0}
              icon={Coffee}
              colorScheme="emerald"
            />
            <StatCard
              label="Realized Sales"
              value={`₹${stats?.todaySales ?? 0}`}
              subValue="Completed / Paid"
              icon={IndianRupee}
              colorScheme="caramel"
            />
            <StatCard
              label="Avg Prep Time"
              value={`${stats?.avgPrepTime ?? 8} min`}
              subValue="Based on today"
              icon={Clock}
              colorScheme="espresso"
            />
          </div>

          {/* Counter Bill & Payment QR Quick-Checkout Bar */}
          <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-2xl bg-espresso text-caramel flex items-center justify-center shadow-warm-sm">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-espresso text-base flex items-center space-x-2">
                    <span>Counter Billing & Table Payment POS</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-caramel-dark bg-caramel/15 px-2 py-0.5 rounded-full border border-caramel/30">
                      Live Table QR
                    </span>
                  </h3>
                  <p className="text-xs text-espresso/60">
                    When guests arrive at the counter, select their table to generate total bill & instant UPI Payment QR code.
                  </p>
                </div>
              </div>

              {/* Table search input */}
              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <MapPin className="w-3.5 h-3.5 text-espresso/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tableSearchInput}
                    onChange={(e) => setTableSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupTable(tableSearchInput)}
                    placeholder="Enter Table # (e.g. T04)..."
                    className="w-full bg-cream/40 border border-espresso/15 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleLookupTable(tableSearchInput)}
                  className="bg-espresso hover:bg-caramel text-cream text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shrink-0 shadow-xs flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-caramel" />
                  <span>Print Bill / QR</span>
                </button>
              </div>
            </div>

            {/* Quick Table Buttons with Live Bill Badges */}
            <div className="pt-2 border-t border-espresso/5 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-espresso/60 mr-1">Quick Tables:</span>
              {defaultTables.map((tNum) => {
                const activeOrder = tableOrderMap.get(tNum);
                const hasUnpaid = activeOrder && activeOrder.paymentStatus !== 'paid';

                return (
                  <button
                    key={tNum}
                    type="button"
                    onClick={() => handleLookupTable(tNum)}
                    className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
                      hasUnpaid
                        ? activeOrder.status === 'ready'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-caramel text-white border-caramel shadow-xs'
                        : 'bg-cream-soft hover:bg-cream-dark/40 text-espresso/80 border-espresso/10'
                    }`}
                  >
                    <span>Table {tNum}</span>
                    {hasUnpaid && (
                      <span className="bg-black/20 text-white text-[10px] px-1.5 py-0.2 rounded-md">
                        ₹{activeOrder.total}
                      </span>
                    )}
                  </button>
                );
              })}

              {lookupMessage && (
                <span className="text-xs text-red-600 font-semibold ml-2 animate-fade-in">
                  {lookupMessage}
                </span>
              )}
            </div>
          </div>

          {/* Kanban Board of Live Orders */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-espresso flex items-center space-x-2">
                <span>Live Kitchen Kanban</span>
                <span className="text-xs font-normal text-espresso/60">
                  ({activeOrders.length} active orders)
                </span>
              </h2>
            </div>

            <KitchenBoardView
              orders={activeOrders}
              onUpdateStatus={handleUpdateStatus}
              onOpenBill={(order) => setBillingOrder(order)}
            />
          </div>
        </main>
      </div>

      {/* Bill & Payment QR Modal */}
      <BillPaymentModal
        order={billingOrder}
        isOpen={Boolean(billingOrder)}
        onClose={() => setBillingOrder(null)}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};
