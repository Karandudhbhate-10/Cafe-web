import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  ExternalLink,
  Globe,
  RefreshCw,
  CheckCircle2,
  Coffee,
  Receipt,
  Copy,
  Check,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { BillPaymentModal } from '../../components/admin/BillPaymentModal';
import { api } from '../../services/api';
import { joinStaffChannel, onNewOrder, onOrderStatusUpdate } from '../../services/socket';
import { Order } from '../../types';

export const AdminTablesPage: React.FC = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:5173');
  const [newBaseUrlInput, setNewBaseUrlInput] = useState<string>('');
  const [isUpdatingUrl, setIsUpdatingUrl] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [masterQr, setMasterQr] = useState<{ dataUrl: string; targetUrl: string } | null>(null);
  const [copiedMasterUrl, setCopiedMasterUrl] = useState(false);
  const [billingOrder, setBillingOrder] = useState<Order | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [tableRes, ordersRes] = await Promise.all([
        api.getAdminTables(),
        api.getAdminOrders({ limit: 100 }),
      ]);

      const effectiveBase = tableRes.baseUrl || 'http://localhost:5173';
      setBaseUrl(effectiveBase);
      setNewBaseUrlInput(effectiveBase);

      if (tableRes.masterQr) {
        setMasterQr(tableRes.masterQr);
      } else {
        const dest = `${effectiveBase}/menu`;
        QRCode.toDataURL(dest, {
          width: 500,
          margin: 2,
          color: { dark: '#2B1D17', light: '#FFFFFF' },
        })
          .then((dataUrl) => setMasterQr({ dataUrl, targetUrl: dest }))
          .catch(() => {});
      }

      setActiveOrders(
        (ordersRes.orders || []).filter(
          (o) => o.status !== 'completed' && o.status !== 'rejected' && o.paymentStatus !== 'paid'
        )
      );
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadData();
    joinStaffChannel();

    const unsubNew = onNewOrder(() => {
      loadData();
    });

    const unsubStatus = onOrderStatusUpdate(() => {
      loadData();
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
      await api.updatePaymentStatus(orderId, 'paid', paymentMethod, true);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update payment');
    }
  };

  const handleUpdateBaseUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBaseUrlInput) return;
    setIsUpdatingUrl(true);
    setStatusMessage(null);
    try {
      const res = await api.updateQrBaseUrlAndRegenerate(newBaseUrlInput);
      setBaseUrl(res.baseUrl);
      setStatusMessage(res.message);
      await loadData();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to update QR base URL');
    } finally {
      setIsUpdatingUrl(false);
    }
  };

  const handlePrintMaster = () => {
    if (!masterQr) {
      alert('Master QR code is still generating...');
      return;
    }
    document.body.classList.add('printing-master-qr');

    const cleanup = () => {
      document.body.classList.remove('printing-master-qr');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    setTimeout(cleanup, 5000);

    window.print();
  };

  const handleDownloadMaster = () => {
    if (!masterQr) return;
    const link = document.createElement('a');
    link.download = 'brew-and-bean-master-qr.png';
    link.href = masterQr.dataUrl;
    link.click();
  };

  const handleCopyMasterUrl = async () => {
    if (!masterQr?.targetUrl) return;
    try {
      await navigator.clipboard.writeText(masterQr.targetUrl);
      setCopiedMasterUrl(true);
      setTimeout(() => setCopiedMasterUrl(false), 2000);
    } catch {}
  };

  // Group active orders by tableNumber
  const activeDiningTables = useMemo(() => {
    const tableMap = new Map<string, Order[]>();
    for (const order of activeOrders) {
      const tableKey = (order.tableNumber || 'Unknown').trim().toUpperCase();
      const existing = tableMap.get(tableKey) || [];
      existing.push(order);
      tableMap.set(tableKey, existing);
    }
    return Array.from(tableMap.entries()).map(([tableNumber, orders]) => ({
      tableNumber,
      orders,
      latestOrder: orders[0],
      totalBill: orders.reduce((sum, o) => sum + (o.total || 0), 0),
    }));
  }, [activeOrders]);

  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col lg:flex-row text-espresso">
      <div className="no-print flex flex-col lg:flex-row w-full">
        {/* Sidebar */}
        <AdminSidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader
            title="Single Master QR Code"
            subtitle="One Café QR Stand • Customers simply enter table number at checkout"
            rightAction={
              <button
                onClick={handlePrintMaster}
                type="button"
                className="bg-caramel hover:bg-caramel-dark text-espresso px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                title="Print Single Master QR for entire café"
              >
                <Printer className="w-4 h-4 text-espresso" />
                <span>Print Master QR</span>
              </button>
            }
          />

          <main className="p-4 sm:p-6 space-y-6 flex-1 overflow-y-auto pb-28 lg:pb-8">
            {/* Single Master Cafe QR Showcase Card */}
            {masterQr && (
              <div className="bg-gradient-to-br from-espresso via-[#3A2820] to-espresso text-cream rounded-3xl p-5 sm:p-6 border border-caramel/40 shadow-warm-lg flex flex-col md:flex-row items-center gap-6">
                {/* QR Code preview container */}
                <div className="bg-white p-3 rounded-2xl shadow-xl shrink-0 border-2 border-caramel/50 relative group">
                  <img
                    src={masterQr.dataUrl}
                    alt="Master Cafe QR Code"
                    className="w-40 h-40 sm:w-48 sm:h-48 object-contain block"
                  />
                  <div className="text-[10px] text-center font-bold text-espresso uppercase tracking-wider mt-1.5 pt-1 border-t border-cream-dark/40">
                    Master Café QR
                  </div>
                </div>

                {/* Details & Actions */}
                <div className="flex-1 space-y-3 text-center md:text-left">
                  <div className="inline-flex items-center space-x-1.5 bg-caramel/20 text-caramel-light px-3 py-1 rounded-full text-[11px] font-bold border border-caramel/40">
                    <Sparkles className="w-3.5 h-3.5 text-caramel" />
                    <span>ONE QR CODE FOR ENTIRE CAFÉ</span>
                  </div>

                  <div>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-wide">
                      Single Café Master QR Stand
                    </h3>
                    <p className="text-xs sm:text-sm text-cream/80 max-w-xl leading-relaxed mt-1 font-normal">
                      Staff do not need to add tables or print separate QR codes for each table! Place this single QR code at the counter or table stands. Customers scan it with their phone camera to open the menu, and type their table number at checkout.
                    </p>
                  </div>

                  {/* Target URL */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs font-mono text-cream/70">
                    <span className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 select-all truncate max-w-xs sm:max-w-md">
                      {masterQr.targetUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMasterUrl}
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      {copiedMasterUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedMasterUrl ? 'Copied' : 'Copy'}</span>
                    </button>
                    <a
                      href={masterQr.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Menu</span>
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handlePrintMaster}
                      className="bg-caramel hover:bg-caramel-dark text-espresso font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-warm-sm flex items-center space-x-2 active:scale-95"
                    >
                      <Printer className="w-4 h-4 text-espresso" />
                      <span>Print Master QR Stand</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadMaster}
                      className="bg-white/15 hover:bg-white/25 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all border border-white/20 flex items-center space-x-2 active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download QR PNG</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Base URL Configuration Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-espresso/10 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-espresso">
                <Globe className="w-4 h-4 text-caramel" />
                <span>Configured QR Code Destination Domain</span>
              </div>
              <p className="text-xs text-espresso/60">
                Change this if hosting on your local Wi-Fi network (e.g. <code className="bg-cream-soft px-1.5 py-0.5 rounded text-espresso font-mono">http://192.168.1.15:5173</code>) or a live public domain.
              </p>

              <form onSubmit={handleUpdateBaseUrl} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newBaseUrlInput}
                  onChange={(e) => setNewBaseUrlInput(e.target.value)}
                  placeholder="https://brewandbean.cafe"
                  className="w-full sm:flex-1 bg-cream-soft border border-espresso/15 rounded-xl px-3.5 py-2 text-xs font-mono text-espresso focus:ring-2 focus:ring-caramel outline-none"
                />
                <button
                  type="submit"
                  disabled={isUpdatingUrl}
                  className="w-full sm:w-auto bg-caramel hover:bg-caramel-dark text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-50 whitespace-nowrap"
                >
                  {isUpdatingUrl ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Update Base URL</span>
                    </>
                  )}
                </button>
              </form>

              {statusMessage && (
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center space-x-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{statusMessage}</span>
                </div>
              )}
            </div>

            {/* Live Active Dining Tables Section (Derived from real active orders) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-espresso flex items-center space-x-2">
                    <Coffee className="w-5 h-5 text-caramel" />
                    <span>Live Occupied Dining Tables</span>
                  </h3>
                  <p className="text-xs text-espresso/60 mt-0.5">
                    Tables with active, unpaid customer orders in the café right now
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-cream-soft text-espresso border border-espresso/10">
                  {activeDiningTables.length} Active {activeDiningTables.length === 1 ? 'Table' : 'Tables'}
                </span>
              </div>

              {activeDiningTables.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 border border-espresso/10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-cream-soft text-espresso/40 flex items-center justify-center mx-auto border border-espresso/10">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <h4 className="font-serif text-base font-bold text-espresso">
                    No Active Dining Tables Right Now
                  </h4>
                  <p className="text-xs text-espresso/60 max-w-sm mx-auto">
                    When customers scan the Master QR and place orders from their table, their table numbers will automatically appear here with live bills.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeDiningTables.map(({ tableNumber, orders, latestOrder, totalBill }) => (
                    <div
                      key={tableNumber}
                      className="bg-white rounded-3xl p-5 border border-amber-300 ring-2 ring-amber-100/70 bg-gradient-to-b from-white to-amber-50/20 shadow-warm-sm flex flex-col justify-between"
                    >
                      <div>
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                              Dining Table
                            </span>
                            <h4 className="font-serif text-2xl font-bold text-espresso">
                              Table {tableNumber}
                            </h4>
                            {latestOrder.customerName && (
                              <p className="text-xs font-semibold text-espresso/70 mt-0.5">
                                Guest: {latestOrder.customerName}
                              </p>
                            )}
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            Occupied
                          </span>
                        </div>

                        {/* Order breakdown */}
                        <div className="my-3 p-3 bg-cream-soft rounded-2xl border border-espresso/5 space-y-1.5 text-xs">
                          <div className="flex justify-between items-center font-bold text-espresso">
                            <span>Order #{latestOrder.orderNumber}</span>
                            <span className="font-serif text-sm text-caramel-dark">₹{totalBill}</span>
                          </div>
                          <div className="text-[10px] text-espresso/50 font-medium">
                            {new Date(latestOrder.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            •{' '}
                            {new Date(latestOrder.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-espresso/70 flex justify-between">
                            <span>{latestOrder.items.length} items</span>
                            <span className="capitalize font-semibold text-amber-900">{latestOrder.status}</span>
                          </div>
                          {latestOrder.customerNotes && (
                            <p className="text-[11px] text-espresso/60 italic pt-1 border-t border-espresso/5 font-normal">
                              "{latestOrder.customerNotes}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => setBillingOrder(latestOrder)}
                        type="button"
                        className="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Settle Bill (₹{totalBill})</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Settle Bill Modal */}
      <BillPaymentModal
        order={billingOrder}
        isOpen={Boolean(billingOrder)}
        onClose={() => setBillingOrder(null)}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Portaled Single Master QR Stand for Printing */}
      {masterQr &&
        createPortal(
          <div id="printable-master-qr">
            <div
              className="qr-stand-card text-center flex flex-col items-center justify-between space-y-4 p-8 border-4 border-[#2B1D17] rounded-3xl max-w-sm w-full bg-white shadow-none"
              style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
            >
              <div>
                <div className="font-serif text-2xl font-bold text-[#2B1D17] tracking-wider uppercase">
                  BREW & BEAN
                </div>
                <div className="text-xs uppercase tracking-widest text-[#C58B54] font-bold mt-0.5">
                  Artisanal Coffee & Roastery
                </div>
              </div>

              <div className="bg-[#2B1D17] text-white px-6 py-2 rounded-2xl text-base font-bold tracking-wider font-serif shadow-xs uppercase">
                Scan to Order from Your Phone
              </div>

              <div className="p-3 border border-gray-200 rounded-2xl bg-white shadow-xs">
                <img
                  src={masterQr.dataUrl}
                  alt="Brew & Bean Master QR"
                  className="w-52 h-52 object-contain mx-auto block"
                />
              </div>

              <div className="text-xs text-gray-700 font-semibold space-y-1.5 w-full bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="text-gray-900 font-bold">1. Scan QR with your phone camera</div>
                <div>2. Browse handcrafted coffees & bites</div>
                <div className="text-[#C58B54] font-bold">3. Enter your Table Number at checkout!</div>
              </div>

              <div className="text-[10px] text-gray-400 font-mono">
                {masterQr.targetUrl}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
