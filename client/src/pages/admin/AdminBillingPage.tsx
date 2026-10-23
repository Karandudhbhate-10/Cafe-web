import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Receipt,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  Printer,
  QrCode,
  CreditCard,
  Banknote,
  Coffee,
  IndianRupee,
  ShoppingBag,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { BillPaymentModal } from '../../components/admin/BillPaymentModal';
import { api } from '../../services/api';
import { joinStaffChannel, onNewOrder, onOrderStatusUpdate } from '../../services/socket';
import { Order, TableItem } from '../../types';

export const AdminBillingPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        api.getAdminOrders({ limit: 100 }),
        api.getAdminTables(),
      ]);
      setOrders(ordersRes.orders || []);
      setTables(tablesRes.tables || []);
    } catch (err) {
      console.error('[Billing Data Error]', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to real-time events for live billing updates
    joinStaffChannel();

    const unsubNew = onNewOrder((newOrder) => {
      setOrders((prev) => [newOrder, ...prev.filter((o) => o._id !== newOrder._id)]);
    });

    const unsubStatus = onOrderStatusUpdate((updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
    });

    const timer = setInterval(loadData, 20000);

    return () => {
      unsubNew();
      unsubStatus();
      clearInterval(timer);
    };
  }, [loadData]);

  const handleConfirmPayment = async (orderId: string, paymentMethod: string) => {
    try {
      const updated = await api.updatePaymentStatus(orderId, 'paid', paymentMethod, true);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
    } catch (err: any) {
      alert(err.message || 'Payment settlement failed');
    }
  };

  // Orders that are pending payment (Active tables needing settlement)
  const pendingBills = useMemo(() => {
    return orders.filter((o) => o.paymentStatus !== 'paid' && o.status !== 'rejected');
  }, [orders]);

  // Today's settled bills
  const settledBills = useMemo(() => {
    return orders.filter((o) => o.paymentStatus === 'paid');
  }, [orders]);

  // Search filtered pending bills
  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingBills;
    const q = search.toLowerCase();
    return pendingBills.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.tableNumber.toLowerCase().includes(q) ||
        (o.customerName && o.customerName.toLowerCase().includes(q))
    );
  }, [pendingBills, search]);

  // Total uncollected and collected amounts today
  const totalPendingAmount = useMemo(
    () => pendingBills.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [pendingBills]
  );
  const totalCollectedAmount = useMemo(
    () => settledBills.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [settledBills]
  );

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col lg:flex-row text-espresso">
      {/* 3-Tab Sidebar */}
      <AdminSidebar />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Billing"
          subtitle="Counter billing, table checkouts & authorized payment settlement"
        />

        <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto pb-28 lg:pb-8">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60 block">
                  Unsettled Tables
                </span>
                <span className="font-serif text-2xl font-bold text-amber-900 mt-1 block">
                  {pendingBills.length} Tables
                </span>
                <span className="text-[11px] text-espresso/60">
                  Total Due: ₹{totalPendingAmount.toFixed(2)}
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60 block">
                  Settled Today
                </span>
                <span className="font-serif text-2xl font-bold text-emerald-800 mt-1 block">
                  ₹{totalCollectedAmount.toFixed(2)}
                </span>
                <span className="text-[11px] text-espresso/60">
                  {settledBills.length} bills closed
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-espresso/60 block">
                  Accepted Payments
                </span>
                <span className="font-serif text-base font-bold text-espresso mt-1 block">
                  UPI • Cash • Cards
                </span>
                <span className="text-[11px] text-caramel font-medium">
                  Instant Shop QR Print
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-cream-soft text-caramel flex items-center justify-center border border-espresso/10 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Section 1: Tables Ready for Settlement */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-lg font-bold text-espresso flex items-center space-x-2">
                  <span>Active Table Bills (Pending Settlement)</span>
                  <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                    {pendingBills.length}
                  </span>
                </h2>
                <p className="text-xs text-espresso/60">
                  Select a table when guests arrive at the counter to view items, accept payment, and print receipt.
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search table or order #..."
                  className="w-full bg-white border border-espresso/10 rounded-xl pl-9 pr-3.5 py-2 text-xs font-medium text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel shadow-xs"
                />
              </div>
            </div>

            {filteredPending.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-espresso/10 text-center space-y-2 shadow-warm-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-base font-bold text-espresso">
                  All Table Bills Settled
                </h3>
                <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                  There are no pending table bills. When customers order via table QR codes, their bills will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPending.map((order) => (
                  <div
                    key={order._id}
                    className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm hover:border-caramel/50 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Table Header */}
                      <div className="flex items-start justify-between border-b border-espresso/10 pb-3">
                        <div className="flex items-center space-x-2.5">
                          <div className="bg-espresso text-cream px-3 py-1.5 rounded-2xl font-bold flex items-center space-x-1.5 shadow-sm">
                            <MapPin className="w-4 h-4 text-caramel shrink-0" />
                            <span className="text-sm font-serif tracking-wide text-white">
                              TABLE {order.tableNumber}
                            </span>
                          </div>
                          <div>
                            <span className="font-serif font-bold text-sm text-espresso block">
                              #{order.orderNumber}
                            </span>
                            <span className="text-[11px] text-espresso/60">
                              {order.customerName || 'Dine-In Guest'}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 shrink-0">
                          Pay at Counter
                        </span>
                      </div>

                      {/* Items Summary */}
                      <div className="py-2.5 space-y-1 text-xs">
                        <div className="text-[11px] text-espresso/60 font-semibold uppercase tracking-wider mb-1">
                          {order.items.length} {order.items.length === 1 ? 'Item' : 'Items'} Ordered:
                        </div>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-espresso/80">
                            <span>
                              {item.quantity}× {item.name}
                            </span>
                            <span className="font-serif">₹{item.itemTotal}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="text-[10px] text-caramel-dark font-medium pt-0.5">
                            +{order.items.length - 3} more items...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Total & Action Button */}
                    <div className="pt-3 border-t border-espresso/10 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] text-espresso/50 uppercase font-bold block">
                          Total Payable
                        </span>
                        <span className="font-serif text-xl font-bold text-espresso">
                          ₹{order.total}
                        </span>
                      </div>

                      <button
                        onClick={() => setBillingOrder(order)}
                        type="button"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-warm-sm transition-all active:scale-98"
                      >
                        <Receipt className="w-4 h-4" />
                        <span>Settle Bill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Recent Settled Transactions */}
          <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-warm-sm space-y-3">
            <div className="flex items-center justify-between border-b border-espresso/10 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-espresso">
                  Recent Settled Bills
                </h3>
                <p className="text-xs text-espresso/60">
                  Transactions closed and receipts printed today
                </p>
              </div>
              <span className="text-xs font-bold text-espresso/60">
                {settledBills.length} Transactions
              </span>
            </div>

            {settledBills.length === 0 ? (
              <div className="py-6 text-center text-xs text-espresso/40">
                No settled transactions recorded yet today.
              </div>
            ) : (
              <div className="divide-y divide-espresso/5 text-xs">
                {settledBills.slice(0, 8).map((order) => (
                  <div
                    key={order._id}
                    className="py-3 flex flex-wrap items-center justify-between gap-3 hover:bg-cream-soft/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-espresso text-cream flex items-center justify-center font-bold text-xs">
                        {order.tableNumber}
                      </div>
                      <div>
                        <div className="font-bold text-espresso flex items-center space-x-2">
                          <span>Order #{order.orderNumber}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            ✓ {order.paymentMethod ? order.paymentMethod.toUpperCase() : 'PAID'}
                          </span>
                        </div>
                        <div className="text-[11px] text-espresso/60 font-medium">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          • {order.customerName || 'Guest'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <span className="font-serif font-bold text-sm text-espresso">
                        ₹{order.total}
                      </span>
                      <button
                        onClick={() => setBillingOrder(order)}
                        type="button"
                        className="p-2 rounded-xl bg-cream-soft hover:bg-espresso/10 text-espresso text-xs font-bold flex items-center space-x-1 border border-espresso/10 transition-colors shadow-2xs"
                        title="View & Re-print Thermal Receipt"
                      >
                        <Printer className="w-3.5 h-3.5 text-caramel" />
                        <span>Print</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bill & Settlement Modal with Authentic Centered Receipt */}
      <BillPaymentModal
        order={billingOrder}
        isOpen={Boolean(billingOrder)}
        onClose={() => setBillingOrder(null)}
        onConfirmPayment={handleConfirmPayment}
      />
    </div>
  );
};
