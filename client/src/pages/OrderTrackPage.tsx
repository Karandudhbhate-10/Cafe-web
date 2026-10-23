import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ChefHat,
  Coffee,
  CheckCheck,
  XCircle,
  ArrowLeft,
  Sparkles,
  MapPin,
  RefreshCw,
  QrCode,
  Receipt,
  Printer,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/customer/CartDrawer';
import { BillPaymentModal } from '../components/admin/BillPaymentModal';
import { api } from '../services/api';
import { joinOrderRoom, onOrderStatusUpdate } from '../services/socket';
import { useCart } from '../context/CartContext';
import { Order } from '../types';

export const OrderTrackPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setActiveOrder, clearActiveOrder, setTable } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const isInitialMountRef = useRef<boolean>(true);

  // Fetch order data
  const fetchOrder = async (isManual = false) => {
    if (!token) return;
    try {
      const data = await api.trackOrder(token);
      setOrder(data);
      setLastRefreshed(new Date());

      // If the order is completed, remove this tracking page on refresh!
      if (data && data.status === 'completed') {
        clearActiveOrder(data.tableNumber);
        localStorage.removeItem('bb_active_order_token');
        localStorage.removeItem('bb_active_order_number');
        localStorage.removeItem('bb_active_order_table');
        localStorage.removeItem(`bb_table_${data.tableNumber?.toUpperCase()}_order_token`);

        if (isInitialMountRef.current || isManual) {
          // Redirect to clean menu on refresh
          navigate('/menu', { replace: true });
          return;
        }
      }

      // If the order is rejected, clear active order tokens so subsequent re-scans don't loop back to it,
      // but retain order in state so the customer clearly sees the rejection notice and reason.
      if (data && data.status === 'rejected') {
        clearActiveOrder(data.tableNumber);
        localStorage.removeItem('bb_active_order_token');
        localStorage.removeItem('bb_active_order_number');
        localStorage.removeItem('bb_active_order_table');
        localStorage.removeItem(`bb_table_${data.tableNumber?.toUpperCase()}_order_token`);
      }

      if (data && ['received', 'accepted', 'preparing', 'ready'].includes(data.status)) {
        setActiveOrder(token, data.orderNumber, data.tableNumber);
      }
    } catch (err: any) {
      setError(err.message || 'Order not found.');
    } finally {
      setIsLoading(false);
      isInitialMountRef.current = false;
    }
  };

  useEffect(() => {
    fetchOrder();

    if (token) {
      // Join real-time room for this order
      joinOrderRoom(token);

      // Listen for instant status changes
      const unsubscribe = onOrderStatusUpdate((updatedOrder) => {
        if (updatedOrder.trackingToken === token) {
          // When staff confirms payment, notify customer immediately
          if (updatedOrder.paymentStatus === 'paid') {
            setShowPaymentSuccessModal(true);
          }

          // When staff rejects order, notify customer immediately with modal
          if (updatedOrder.status === 'rejected') {
            setShowRejectModal(true);
            clearActiveOrder(updatedOrder.tableNumber);
            localStorage.removeItem('bb_active_order_token');
            localStorage.removeItem('bb_active_order_number');
            localStorage.removeItem('bb_active_order_table');
            localStorage.removeItem(`bb_table_${updatedOrder.tableNumber?.toUpperCase()}_order_token`);
          } else if (updatedOrder.status !== 'completed') {
            setActiveOrder(token, updatedOrder.orderNumber, updatedOrder.tableNumber);
          }

          setOrder(updatedOrder);
          setLastRefreshed(new Date());
        }
      });

      // Polling fallback every 10 seconds in case of WebSocket disconnect
      const interval = setInterval(() => {
        fetchOrder(false);
      }, 10000);

      return () => {
        unsubscribe();
        clearInterval(interval);
      };
    }
  }, [token]);

  // Streamlined 3-step live preparation timeline matching the simplified staff workflow
  const steps = [
    {
      key: 'preparing',
      label: 'In Preparation',
      desc: 'Baristas crafting your items',
      icon: Coffee,
    },
    {
      key: 'ready',
      label: 'Ready to Serve',
      desc: 'Heading to table / ready at counter',
      icon: Sparkles,
    },
    {
      key: 'completed',
      label: 'Served & Enjoy',
      desc: 'Delivered to your table ✨',
      icon: CheckCheck,
    },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'ready') return 1;
    if (status === 'completed') return 2;
    return 0;
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;
  const isRejected = order?.status === 'rejected';
  const isReady = order?.status === 'ready';
  const isCompleted = order?.status === 'completed';
  const rejectEntry = order?.statusHistory?.slice().reverse().find((h) => h.status === 'rejected');
  const rejectionReason = rejectEntry?.note || 'The kitchen was unable to accept this order at this time.';

  return (
    <div className="relative isolate min-h-screen bg-gradient-to-br from-[#D9EBD3] via-[#F8F4EC] to-[#F5DDBD] text-espresso flex flex-col selection:bg-caramel selection:text-white">
      {/* Visible 2-Color Combo Atmosphere: Soft Botanical Sage (Color 1) + Warm Honey Latte Caramel (Color 2) */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Color 1: Soft Botanical Sage Ambient Waves (Top-Left & Mid-Left) */}
        <div className="absolute -top-28 -left-24 w-[720px] h-[720px] rounded-full bg-[#879078]/32 blur-[100px]" />
        <div className="absolute top-1/3 -left-36 w-[580px] h-[580px] rounded-full bg-[#9CB08F]/28 blur-[110px]" />

        {/* Color 2: Warm Honey Latte Caramel Ambient Waves (Top-Right & Bottom-Right) */}
        <div className="absolute top-12 -right-24 w-[680px] h-[680px] rounded-full bg-[#C58B54]/30 blur-[110px]" />
        <div className="absolute -bottom-24 right-4 w-[750px] h-[750px] rounded-full bg-[#D99F69]/26 blur-[120px]" />

        {/* Tactile Organic Grain Overlay in independent layer so it does not overwrite the gradient */}
        <div className="absolute inset-0 bg-grain opacity-40 mix-blend-multiply" />
      </div>

      <Navbar />

      <main className="relative z-10 flex-1 pt-24 sm:pt-32 pb-6 sm:pb-12 max-w-3xl mx-auto px-4 sm:px-6 w-full">
        {isLoading && (
          <div className="py-24 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-caramel mx-auto" />
            <p className="font-serif text-espresso/70 text-base">
              Fetching your order status...
            </p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4 my-12">
            <XCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h2 className="font-serif text-2xl font-bold text-red-800">
              Order Not Found
            </h2>
            <p className="text-sm text-red-600 max-w-sm mx-auto">
              We couldn't locate this order. Please check the tracking link or ask café staff for help.
            </p>
            <Link
              to="/menu"
              className="inline-block bg-espresso text-cream text-xs font-bold px-6 py-3 rounded-2xl hover:bg-caramel"
            >
              Back to Menu
            </Link>
          </div>
        )}

        {!isLoading && order && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Back & Refresh */}
            <div className="flex items-center justify-between text-xs">
              <Link
                to="/menu?addMore=true"
                className="flex items-center space-x-1.5 text-espresso/70 hover:text-caramel font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Add More Items</span>
              </Link>
              <button
                onClick={() => fetchOrder(true)}
                className="flex items-center space-x-1 text-espresso/50 hover:text-espresso transition-colors"
                title="Refresh order state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </button>
            </div>

            {/* Live Payment Confirmed Message Banner */}
            {order.paymentStatus === 'paid' && (
              <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-600 text-white rounded-3xl p-5 sm:p-6 shadow-warm-md flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/50 animate-fade-in text-center sm:text-left">
                <div className="flex items-center space-x-3.5">

                  <div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/20">
                        Payment Confirmed
                      </span>

                      <span className="text-xs font-mono font-bold text-emerald-200">
                        ₹{order.total} Settled
                      </span>
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold mt-1 text-white">
                      Your payment is done, visit again! ✨
                    </h2>
                    <div className="flex items-center justify-center sm:justify-start spa ce-x-2">
                      <p className="text-xs text-emerald-100/90 mt-0.5">
                        Thank you for dining with BREW & BEAN Café. We loved serving you at Table {order.tableNumber}!
                      </p>

                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => navigate('/menu', { replace: true })}
                    className="inline-flex items-center space-x-1.5 bg-white hover:bg-cream text-emerald-900 font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-xs active:scale-95"
                  >
                    <Coffee className="w-3.5 h-3.5 text-caramel-dark" />
                    <span>Back to Menu</span>
                  </button>
                  <button
                    onClick={() => setIsBillOpen(true)}
                    className="inline-flex items-center space-x-1 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs px-3 py-2.5 rounded-xl border border-white/20 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>
            )}

            {/* Confirmation Hero Card */}
            {isRejected ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-200 shadow-warm-md text-center space-y-4 relative overflow-hidden animate-fade-in">
                <div className="inline-flex items-center space-x-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full text-xs font-semibold">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                  <span>Order Rejected by Café Kitchen</span>
                </div>

                <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-inner">
                  <XCircle className="w-9 h-9" />
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-espresso">
                  Order Not Accepted
                </h1>

                <div className="flex items-center justify-center space-x-3 text-sm pt-0.5">
                  <span className="font-serif text-lg font-bold text-red-700">
                    #{order.orderNumber}
                  </span>
                  <span className="text-espresso/20">•</span>
                  <span className="font-semibold text-espresso flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-caramel" />
                    <span>Table {order.tableNumber}</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200 text-left max-w-md mx-auto space-y-1.5">
                  <div className="text-xs font-bold text-red-900 flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Reason from Café Staff:</span>
                  </div>
                  <p className="text-xs text-red-800 font-medium leading-relaxed pl-5">
                    "{rejectionReason}"
                  </p>
                  <p className="text-[11px] text-espresso/70 leading-relaxed pl-5 border-t border-red-200/60 pt-1.5">
                    This order will <strong>not</strong> be prepared or delivered to your table. You have not been charged.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => navigate('/menu', { replace: true })}
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-espresso hover:bg-roast text-cream font-bold px-6 py-3 rounded-2xl text-xs tracking-wide shadow-warm-md transition-all active:scale-98"
                  >
                    <Coffee className="w-4 h-4 text-caramel" />
                    <span>Select Different Items from Menu</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-dark/60 shadow-warm-md text-center space-y-3 relative overflow-hidden">
                <div
                  className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isCompleted
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : isReady
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 animate-pulse'
                      : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                >
                  {isCompleted ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Served</span>
                    </>
                  ) : isReady ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Ready for Serving</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="w-3.5 h-3.5 text-amber-700" />
                      <span>Order in Preparation</span>
                    </>
                  )}
                </div>

                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-espresso">
                  {isCompleted
                    ? 'Enjoy your order! ✨'
                    : isReady
                      ? 'Your order is ready!'
                      : 'Your order is brewing!'}
                </h1>

                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm pt-1">
                  <span className="font-serif text-xl font-bold text-caramel-dark">
                    #{order.orderNumber}
                  </span>
                  <span className="text-espresso/20 hidden sm:inline">•</span>
                  <span className="font-semibold text-espresso flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-caramel" />
                    <span>Table {order.tableNumber}</span>
                  </span>
                  <span className="text-espresso/20 hidden sm:inline">•</span>
                  <span className="text-xs text-espresso/60 font-medium">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(order.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-espresso/70 max-w-md mx-auto leading-relaxed">
                  {isCompleted
                    ? `Delivered to Table ${order.tableNumber}. Thank you for dining with BREW & BEAN!`
                    : isReady
                      ? `Freshly prepared for Table ${order.tableNumber}. Heading to your table or ready at the counter!`
                      : `Baristas are crafting your handcrafted items for Table ${order.tableNumber}. Track progress in real time below.`}
                </p>
              </div>
            )}

            {/* Status Timeline - Streamlined 3-Stage Progress */}
            {!isRejected && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-dark/60 shadow-warm-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Live Preparation Timeline
                  </h3>
                  <span className="text-xs text-caramel-dark font-semibold">
                    Step {currentStepIdx + 1} of 3
                  </span>
                </div>

                <div className="relative">
                  {/* Progress Track Line */}
                  <div className="absolute top-5 left-8 right-8 h-1 bg-cream-dark/50 -z-0 hidden sm:block rounded-full" />
                  <div
                    className="absolute top-5 left-8 h-1 bg-caramel transition-all duration-700 -z-0 hidden sm:block rounded-full shadow-xs"
                    style={{
                      width: `calc(${(currentStepIdx / (steps.length - 1)) * 100}% - 3rem)`,
                    }}
                  />

                  {/* 3 Step Nodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
                    {steps.map((s, idx) => {
                      const Icon = s.icon;
                      const isDone = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      return (
                        <div
                          key={s.key}
                          className="flex sm:flex-col items-center sm:text-center space-x-3.5 sm:space-x-0 relative z-10"
                        >
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-sm ${isDone
                              ? 'bg-emerald-600 text-white'
                              : isCurrent
                                ? 'bg-caramel text-white ring-4 ring-caramel/25 scale-110 font-bold shadow-warm-sm'
                                : 'bg-cream-soft text-espresso/40 border border-cream-dark/60'
                              }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="sm:mt-3">
                            <div
                              className={`text-xs sm:text-sm font-bold ${isCurrent
                                ? 'text-caramel-dark'
                                : isDone
                                  ? 'text-espresso'
                                  : 'text-espresso/50'
                                }`}
                            >
                              {s.label}
                            </div>
                            <div className="text-[11px] text-espresso/60 mt-0.5">
                              {s.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Items Summary Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-dark/60 shadow-warm-sm space-y-4">
              <div className="flex items-center justify-between border-b border-cream-dark/60 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-serif text-lg font-bold text-espresso">
                    Ordered Items & Table Bill
                  </h3>
                  <p className="text-xs text-espresso/60">
                    Consolidated bill for Table {order.tableNumber} • {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-espresso/60 block">Total Bill</span>
                  <span className="font-serif text-xl sm:text-2xl font-bold text-caramel-dark">
                    ₹{order.total}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-cream-dark/40 space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pt-3 flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-md bg-caramel/20 text-espresso font-bold text-xs flex items-center justify-center">
                          {item.quantity}×
                        </span>
                        <h4 className="text-sm font-bold text-espresso">
                          {item.name}
                        </h4>
                      </div>

                      {item.selectedCustomizations.length > 0 && (
                        <div className="mt-1 ml-7 flex flex-wrap gap-1">
                          {item.selectedCustomizations.map((c, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-cream-soft text-espresso/80 border border-cream-dark/60 px-1.5 py-0.5 rounded"
                            >
                              {c.optionName} {c.price > 0 && `(+₹${c.price})`}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.specialInstructions && (
                        <p className="text-[11px] text-espresso/60 italic ml-7 mt-1 font-normal">
                          "{item.specialInstructions}"
                        </p>
                      )}
                    </div>

                    <span className="font-serif text-sm font-bold text-caramel-dark shrink-0">
                      ₹{item.itemTotal}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation breakdown */}
              <div className="pt-4 border-t border-cream-dark/60 space-y-1.5 text-xs">
                <div className="flex justify-between text-espresso/70 font-normal">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-espresso/70 font-normal">
                  <span>5% Café GST</span>
                  <span>₹{order.tax}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-espresso pt-2 border-t border-cream-dark/60">
                  <span>Total Amount</span>
                  <span className="font-serif text-lg text-caramel-dark font-bold">₹{order.total}</span>
                </div>
              </div>

              {/* Payment Summary & Status */}
              {!isRejected ? (
                <div className="p-4 rounded-2xl bg-cream-soft border border-cream-dark/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-espresso block text-sm">
                      Bill Status: {order.paymentStatus === 'paid' ? 'Paid at Counter & Verified' : 'Pay at Counter'}
                    </span>
                    <span className="text-espresso/70 font-normal">
                      {order.paymentStatus === 'paid' ? (
                        <>
                          Settled at billing counter via {order.paymentMethod?.toUpperCase() || 'COUNTER'} •{' '}
                          {order.paymentDetails?.transactionRef && (
                            <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-cream-dark/60">
                              Ref: {order.paymentDetails.transactionRef}
                            </span>
                          )}
                        </>
                      ) : (
                        `Please proceed to the billing counter to pay for Table ${order.tableNumber}`
                      )}
                    </span>
                  </div>

                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shrink-0 ${order.paymentStatus === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                  >
                    {order.paymentStatus === 'paid' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Paid & Verified</span>
                      </>
                    ) : (
                      <>
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>Pay at Counter</span>
                      </>
                    )}
                  </span>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-2.5 text-xs text-red-900">
                  <div>
                    <span className="font-bold block text-red-800">Order Status: Cancelled</span>
                    <span className="text-[11px] text-red-600">No payment required for this rejected order.</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1">
                    <XCircle className="w-3.5 h-3.5 text-red-600" />
                    <span>Rejected</span>
                  </span>
                </div>
              )}
            </div>

            {/* Pay at Counter Notice Card */}
            {!isRejected && order.paymentStatus !== 'paid' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-cream-dark/60 shadow-warm-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-dark/60 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-2xl bg-caramel/15 text-caramel-dark flex items-center justify-center shrink-0 shadow-inner">
                      <Store className="w-5 h-5 text-caramel-dark" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-espresso">
                        Pay at Billing Counter
                      </h3>
                      <p className="text-xs text-espresso/60 mt-0.5">
                        Order #{order.orderNumber} • Table {order.tableNumber}
                      </p>
                    </div>
                  </div>

                  <div className="inline-flex items-baseline space-x-1.5 bg-espresso text-cream px-4 py-2 rounded-2xl shadow-xs self-start sm:self-auto">
                    <span className="text-xs text-caramel-light font-medium">Total Bill:</span>
                    <span className="font-serif text-xl font-bold text-white">₹{order.total}</span>
                  </div>
                </div>

                {/* Counter payment explanation */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cream-soft to-white border border-caramel/30 space-y-2.5">
                  <div className="flex items-center space-x-2 text-xs font-bold text-espresso">
                    <Store className="w-4 h-4 text-caramel" />
                    <span>Payment Processed at Counter Only</span>
                  </div>
                  <p className="text-xs text-espresso/80 leading-relaxed">
                    Please visit the café billing counter to settle your payment. Mention <strong>Table {order.tableNumber}</strong> or <strong>Order #{order.orderNumber}</strong> to our cashier.
                  </p>
                  <p className="text-xs text-espresso/70 leading-relaxed">
                    Accepted payment modes at counter: <strong>Cash • UPI (GPay/PhonePe/Paytm) • Cards</strong>.
                  </p>
                  <div className="flex items-center space-x-2 pt-1 text-[11px] text-caramel-dark font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-caramel" />
                    <span>Once payment is received at the counter, this screen will celebrate and update automatically!</span>
                  </div>
                </div>

                {/* Customer View of Itemized Invoice */}
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-espresso/60">Want to inspect your itemized breakdown?</span>
                  <button
                    type="button"
                    onClick={() => setIsBillOpen(true)}
                    className="inline-flex items-center space-x-1.5 bg-cream-soft hover:bg-cream-dark/50 text-espresso font-bold px-3.5 py-2 rounded-xl border border-cream-dark/80 transition-colors active:scale-95"
                  >
                    <Receipt className="w-3.5 h-3.5 text-caramel" />
                    <span>View Table Invoice</span>
                  </button>
                </div>
              </div>
            )}



            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              {!isRejected ? (
                <Link
                  to="/menu?addMore=true"
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-espresso hover:bg-roast text-cream font-bold px-6 py-3 rounded-2xl text-xs tracking-wide shadow-warm-md transition-all"
                >
                  <Coffee className="w-4 h-4 text-caramel" />
                  <span>Add More Items</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/menu', { replace: true })}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-espresso hover:bg-roast text-cream font-bold px-6 py-3 rounded-2xl text-xs tracking-wide shadow-warm-md transition-all active:scale-98"
                >
                  <Coffee className="w-4 h-4 text-caramel" />
                  <span>Select Different Items from Menu</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
      <CartDrawer />

      {/* Customer View of Bill & UPI Payment QR */}
      <BillPaymentModal
        order={order}
        isOpen={isBillOpen}
        onClose={() => setIsBillOpen(false)}
        onConfirmPayment={async () => { }}
        isCustomerView={true}
      />

      {/* Real-time Payment Success Notification Modal */}
      {showPaymentSuccessModal && order && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in text-espresso">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-emerald-500/30 overflow-hidden flex flex-col p-6 sm:p-8 text-center space-y-4 animate-scale">
            {/* Close button */}
            <button
              onClick={() => setShowPaymentSuccessModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-espresso/40 hover:text-espresso hover:bg-cream-soft transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Glowing checkmark badge */}
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-warm-md animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payment Confirmed</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso leading-tight pt-1">
                Your payment is done!
              </h2>

              <p className="font-serif text-lg font-semibold text-caramel-dark">
                Thank you for visiting, please visit again! ✨
              </p>

              <p className="text-xs text-espresso/70 max-w-xs mx-auto leading-relaxed pt-1">
                Staff has confirmed your payment of <span className="font-bold text-espresso font-serif">₹{order.total}</span> for Table {order.tableNumber}. We loved serving you at BREW & BEAN Café!
              </p>
            </div>

            {/* Receipt Summary Snippet */}
            <div className="bg-cream-soft rounded-2xl p-3.5 border border-cream-dark/60 text-xs flex items-center justify-between text-left">
              <div>
                <span className="font-bold text-espresso block">Order #{order.orderNumber}</span>
                <span className="text-espresso/60 text-[11px]">{order.items.length} item(s) • Table {order.tableNumber}</span>
              </div>
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Paid</span>
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={() => navigate('/menu', { replace: true })}
                className="flex-1 bg-espresso hover:bg-roast text-cream font-bold py-3 px-4 rounded-xl text-xs shadow-warm-sm transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Coffee className="w-4 h-4 text-caramel" />
                <span>Back to Menu</span>
              </button>
              <button
                onClick={() => {
                  setShowPaymentSuccessModal(false);
                  setIsBillOpen(true);
                }}
                className="flex-1 bg-cream-soft hover:bg-cream-dark/50 text-espresso font-bold py-3 px-4 rounded-xl text-xs border border-cream-dark/80 transition-all flex items-center justify-center space-x-1.5 active:scale-95"
              >
                <Receipt className="w-4 h-4 text-caramel" />
                <span>View Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Order Rejection Notification Modal */}
      {showRejectModal && order && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in text-espresso">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-red-300 overflow-hidden flex flex-col p-6 sm:p-8 text-center space-y-4 animate-scale">
            {/* Close button */}
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full text-espresso/40 hover:text-espresso hover:bg-cream-soft transition-colors"
              aria-label="Close"
            >
              <XCircle className="w-5 h-5" />
            </button>

            {/* Red Alert Icon */}
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-600 border-2 border-red-200 flex items-center justify-center mx-auto shadow-warm-md">
              <XCircle className="w-12 h-12" />
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center space-x-1.5 bg-red-50 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span>Order Not Accepted</span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-espresso leading-tight pt-1">
                Order Cancelled
              </h2>

              <p className="font-serif text-base font-bold text-red-700">
                Order #{order.orderNumber} • Table {order.tableNumber}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-left text-xs text-red-900 space-y-1.5">
              <div className="font-bold flex items-center space-x-1 text-red-900">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Notice from Café Staff:</span>
              </div>
              <p className="font-medium text-red-800 pl-4.5">
                "{rejectionReason}"
              </p>
              <p className="text-[11px] text-espresso/70 pl-4.5 border-t border-red-200/60 pt-1.5">
                This order will <strong>not</strong> be delivered to your table. You will not be charged.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  navigate('/menu', { replace: true });
                }}
                className="w-full bg-espresso hover:bg-roast text-cream font-bold py-3.5 px-4 rounded-xl text-xs shadow-warm-sm transition-all flex items-center justify-center space-x-1.5 active:scale-98"
              >
                <Coffee className="w-4 h-4 text-caramel" />
                <span>Choose Different Items from Menu</span>
              </button>
              <button
                onClick={() => setShowRejectModal(false)}
                className="w-full py-2 text-xs font-semibold text-espresso/60 hover:text-espresso"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


