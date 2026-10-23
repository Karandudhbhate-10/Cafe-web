import React, { useEffect, useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  IndianRupee,
  TrendingUp,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  X,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { StatCard } from '../../components/admin/StatCard';
import { api } from '../../services/api';
import { Order, DashboardStats } from '../../types';

export const AdminReportsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tableFilter, setTableFilter] = useState('all');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.getAdminOrders({ status: statusFilter, table: tableFilter, search }),
        api.getDashboardStats(),
      ]);
      setOrders(ordersRes.orders || []);
      setStats(statsRes.stats);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, tableFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Export CSV
  const handleExportCsv = () => {
    window.location.href = api.getCsvExportUrl();
  };

  return (
    <div className="min-h-screen bg-cream/30 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title="Reports & Order History"
          subtitle="Audit transactions, inspect receipts, and export historical CSV records"
          rightAction={
            <button
              onClick={handleExportCsv}
              type="button"
              className="bg-espresso hover:bg-caramel text-cream px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-caramel" />
              <span>Export CSV</span>
            </button>
          }
        />

        <main className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Revenue Breakdown Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Realized Revenue"
              value={`₹${stats?.todaySales ?? 0}`}
              subValue="From completed / paid orders"
              icon={IndianRupee}
              colorScheme="caramel"
            />
            <StatCard
              label="Pending Table Balance"
              value={`₹${stats?.pendingRevenue ?? 0}`}
              subValue="Unpaid table tabs active"
              icon={Clock}
              colorScheme="amber"
            />
            <StatCard
              label="Total Completed"
              value={stats?.completedOrders ?? 0}
              subValue="Orders served today"
              icon={CheckCircle2}
              colorScheme="emerald"
            />
            <StatCard
              label="Avg Preparation"
              value={`${stats?.avgPrepTime ?? 8} min`}
              subValue="Order to serving time"
              icon={TrendingUp}
              colorScheme="espresso"
            />
          </div>

          {/* Popular Menu Items Section */}
          {stats?.popularItems && stats.popularItems.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-espresso/10 shadow-xs">
              <h3 className="font-serif text-lg font-bold text-espresso mb-3">
                Top Selling House Items Today
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {stats.popularItems.map((item, idx) => (
                  <div key={idx} className="bg-cream/40 rounded-2xl p-3 border border-espresso/5">
                    <span className="text-[10px] font-bold text-caramel uppercase block">
                      #{idx + 1} Best Seller
                    </span>
                    <h4 className="font-bold text-espresso text-xs truncate mt-0.5">
                      {item.name}
                    </h4>
                    <div className="flex justify-between items-center text-xs mt-2 text-espresso/70">
                      <span>{item.count} orders</span>
                      <span className="font-serif font-bold text-espresso">₹{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-espresso/10 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-espresso/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order #, table, customer..."
                className="w-full bg-cream/30 border border-espresso/10 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-caramel"
              />
            </form>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-cream/30 border border-espresso/10 rounded-xl px-3 py-2 text-xs font-semibold text-espresso"
              >
                <option value="all">All Statuses</option>
                <option value="received">Received</option>
                <option value="accepted">Accepted</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready to Serve</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={tableFilter}
                onChange={(e) => setTableFilter(e.target.value)}
                className="bg-cream/30 border border-espresso/10 rounded-xl px-3 py-2 text-xs font-semibold text-espresso"
              >
                <option value="all">All Tables</option>
                <option value="T01">Table 01</option>
                <option value="T02">Table 02</option>
                <option value="T03">Table 03</option>
                <option value="T04">Table 04</option>
                <option value="T05">Table 05</option>
                <option value="T06">Table 06</option>
                <option value="T07">Table 07</option>
                <option value="T08">Table 08</option>
              </select>

              <button
                onClick={loadData}
                type="button"
                className="bg-espresso text-cream text-xs font-bold px-3 py-2 rounded-xl hover:bg-caramel"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Orders History Table */}
          <div className="bg-white rounded-3xl border border-espresso/10 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream/50 text-espresso/70 uppercase text-[10px] tracking-wider border-b border-espresso/10">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">Order #</th>
                    <th className="py-3.5 px-4 font-bold">Table</th>
                    <th className="py-3.5 px-4 font-bold">Customer</th>
                    <th className="py-3.5 px-4 font-bold">Items Summary</th>
                    <th className="py-3.5 px-4 font-bold">Subtotal</th>
                    <th className="py-3.5 px-4 font-bold">Total (INR)</th>
                    <th className="py-3.5 px-4 font-bold">Payment</th>
                    <th className="py-3.5 px-4 font-bold">Status</th>
                    <th className="py-3.5 px-4 font-bold">Time</th>
                    <th className="py-3.5 px-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-espresso/5 font-medium text-espresso">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-espresso/50">
                        No orders matching criteria.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o._id} className="hover:bg-cream/20 transition-colors">
                        <td className="py-3 px-4 font-serif font-bold text-sm text-espresso">
                          #{o.orderNumber}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="bg-espresso/5 text-espresso font-bold px-2 py-0.5 rounded-md text-[11px]">
                            {o.tableNumber}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {o.customerName || 'Guest'}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          {o.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          ₹{o.subtotal}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap font-serif font-bold text-sm">
                          ₹{o.total}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              o.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              o.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : o.status === 'rejected'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-espresso/60 text-[11px] font-medium">
                          {new Date(o.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          •{' '}
                          {new Date(o.createdAt).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => setSelectedOrder(o)}
                            className="p-1.5 text-espresso/60 hover:text-espresso hover:bg-espresso/5 rounded-lg"
                            title="View receipt"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Order Details Receipt Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-espresso/10 space-y-4">
            <div className="flex items-start justify-between border-b border-espresso/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-caramel">
                  Dining Receipt
                </span>
                <h3 className="font-serif text-2xl font-bold text-espresso">
                  Order #{selectedOrder.orderNumber}
                </h3>
                <p className="text-xs text-espresso/60">
                  Table {selectedOrder.tableNumber} • {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-espresso/5 text-espresso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-espresso/5 max-h-60 overflow-y-auto">
              {selectedOrder.items.map((item, idx) => (
                <div key={idx} className="pt-2 flex justify-between">
                  <div>
                    <span className="font-bold">{item.quantity}× {item.name}</span>
                    {item.selectedCustomizations.length > 0 && (
                      <div className="text-[10px] text-espresso/60">
                        {item.selectedCustomizations.map((c) => c.optionName).join(', ')}
                      </div>
                    )}
                  </div>
                  <span className="font-serif font-bold">₹{item.itemTotal}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-espresso/10 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-espresso/70">
                <span>Subtotal</span>
                <span>₹{selectedOrder.subtotal}</span>
              </div>
              <div className="flex justify-between text-espresso/70">
                <span>5% GST</span>
                <span>₹{selectedOrder.tax}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-espresso pt-1.5 border-t border-espresso/10">
                <span>Total</span>
                <span className="font-serif text-base">₹{selectedOrder.total}</span>
              </div>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full bg-espresso text-cream text-xs font-bold py-2.5 rounded-xl hover:bg-caramel"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
