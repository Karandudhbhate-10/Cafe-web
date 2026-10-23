import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  CheckCircle2,
  Coffee,
  MapPin,
  QrCode,
  CreditCard,
  Banknote,
  Sparkles,
  Loader2,
  Clock,
  ShieldCheck,
  Receipt,
  Smartphone,
  Store,
} from 'lucide-react';
import { Order } from '../../types';

interface BillPaymentModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (orderId: string, paymentMethod: string) => Promise<void>;
  isCustomerView?: boolean;
}

export const BillPaymentModal: React.FC<BillPaymentModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirmPayment,
  isCustomerView = false,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [thermalQrUrl, setThermalQrUrl] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);

  // Café details
  const cafePayeeName = 'BREW AND BEAN CAFE';
  const cafeVPA = 'karandudhbhate2@oksbi';

  useEffect(() => {
    if (!order) return;
    setPaidSuccess(order.paymentStatus === 'paid');

    const amount = Number(order.total).toFixed(2);
    const note = `Table ${order.tableNumber} Order ${order.orderNumber}`;
    const encNote = encodeURIComponent(note);
    const encName = encodeURIComponent(cafePayeeName);
    const trRef = `ORDER_${order.orderNumber}_${order._id.slice(-6)}`;

    // Standard NPCI UPI URI Scheme
    const upiPayUrl = `upi://pay?pa=${encodeURIComponent(cafeVPA)}&pn=${encName}&am=${amount}&tn=${encNote}&cu=INR&tr=${encodeURIComponent(trRef)}`;

    // 1. High-contrast pure black on pure white QR for thermal POS printers (ensures razor-sharp burning on heat heads)
    QRCode.toDataURL(upiPayUrl, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => setThermalQrUrl(url))
      .catch((err) => console.error('[Thermal QR error]', err));

    // 2. Branded on-screen preview QR
    const canvas = document.createElement('canvas');
    QRCode.toCanvas(canvas, upiPayUrl, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: '#2B1D17',
        light: '#FFFFFF',
      },
    })
      .then(() => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const center = canvas.width / 2;
          const badgeRadius = 26;

          ctx.save();
          ctx.beginPath();
          ctx.arc(center, center, badgeRadius + 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(center, center, badgeRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#D99B59';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(center, center, badgeRadius - 3, 0, Math.PI * 2);
          ctx.fillStyle = '#2B1D17';
          ctx.fill();

          ctx.fillStyle = '#F5EDE4';
          ctx.font = 'bold 11px serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('B&B', center, center);
          ctx.restore();
        }
        setQrDataUrl(canvas.toDataURL('image/png'));
      })
      .catch(() => {
        QRCode.toDataURL(upiPayUrl, { width: 280, margin: 2 })
          .then((url) => setQrDataUrl(url))
          .catch((e) => console.error(e));
      });
  }, [order]);

  // Clean print mode listeners to ensure zero blank pages and perfect single page fit
  useEffect(() => {
    const handleBeforePrint = () => {
      document.body.classList.add('printing-receipt');
    };
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-receipt');
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.body.classList.remove('printing-receipt');
    };
  }, []);

  if (!isOpen || !order) return null;

  const handleSettle = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(order._id, selectedMethod);
      setPaidSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Payment update failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add('printing-receipt');
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DEDICATED THERMAL POS RECEIPT (Only visible when printing) */}
      {/* Portaled to document.body to prevent any parent layout bleed */}
      {/* Perfectly centered on A4 paper and fits on 1 single page */}
      {/* ======================================================== */}
      {createPortal(
        <div id="thermal-receipt-print" className="hidden print:block text-black bg-white">
          {/* 1. Centered Café Header */}
          <div className="text-center pb-1">
            <div className="text-sm font-bold tracking-wider uppercase font-serif">
              BREW & BEAN CAFE
            </div>
            <div className="text-[10px] tracking-wide font-medium text-gray-800">
              Single-Origin Roastery & Artisanal Coffee
            </div>
            <div className="text-[9px] text-gray-700 mt-0.5">
              14/B Heritage Lane, Pali Hill, Bandra West, Mumbai
            </div>
            <div className="text-[9px] text-gray-700">
              GSTIN: 27AABCB1234F1Z8 • Tel: +91 98765 43210
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-black my-1.5" />

          {/* 2. Centered Table, Invoice & Date Metadata */}
          <div className="text-center space-y-1 py-0.5">
            <div>
              <span className="text-xs font-bold uppercase bg-black text-white px-2.5 py-0.5 rounded tracking-wider inline-block">
                TABLE {order.tableNumber}
              </span>
            </div>
            <div className="text-[11px] font-bold tracking-wide">
              INVOICE #{order.orderNumber}
            </div>
            <div className="text-[9px] text-gray-700">
              Date: {formattedDate} • Time: {formattedTime}
            </div>
            {order.customerName && order.customerName !== 'Guest' && (
              <div className="text-[9px] text-gray-800">
                Guest: <span className="font-semibold">{order.customerName}</span>
              </div>
            )}
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-black my-1.5" />

          {/* 3. Item Details Header & Rows */}
          <div className="w-full">
            <div className="flex justify-between text-[10px] font-bold border-b border-black pb-1 mb-1">
              <span className="w-8 text-center">QTY</span>
              <span className="flex-1 text-left px-1">ITEM</span>
              <span className="w-16 text-right">AMT (₹)</span>
            </div>

            <div className="space-y-1.5 text-[10px]">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="w-8 text-center font-bold">{item.quantity}×</span>
                    <span className="flex-1 text-left px-1 font-medium leading-tight">
                      {item.name}
                    </span>
                    <span className="w-16 text-right font-bold">
                      {Number(item.itemTotal).toFixed(2)}
                    </span>
                  </div>

                  {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                    <div className="text-[8px] pl-8 text-gray-600 italic">
                      {item.selectedCustomizations.map((c) => c.optionName).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t border-dashed border-black my-1.5" />

          {/* 4. Subtotal & GST Summary */}
          <div className="space-y-0.5 text-[10px] px-1">
            <div className="flex justify-between">
              <span className="text-gray-700">Subtotal:</span>
              <span className="font-semibold">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[9px] text-gray-700">
              <span>Café Dining GST (5%):</span>
              <span className="font-semibold">₹{Number(order.tax).toFixed(2)}</span>
            </div>
          </div>

          {/* 5. Centered Grand Total */}
          <div className="border-t-2 border-b-2 border-black py-1.5 my-1.5 text-center">
            <div className="text-[9px] font-bold tracking-widest uppercase text-gray-700">
              GRAND TOTAL AMOUNT
            </div>
            <div className="text-base font-bold tracking-tight mt-0.5">
              ₹{Number(order.total).toFixed(2)}
            </div>
          </div>

          {/* 6. Centered UPI Payment QR Code */}
          <div className="pt-1.5 pb-1 text-center flex flex-col items-center justify-center">
            <div className="text-[9px] font-bold tracking-wider uppercase border border-black px-2 py-0.5 rounded mb-1 inline-block">
              SCAN TO PAY VIA UPI
            </div>

            {thermalQrUrl ? (
              <img
                src={thermalQrUrl}
                alt="Shop UPI Payment QR"
                className="w-32 h-32 mx-auto my-1 border-2 border-black p-1 bg-white object-contain"
              />
            ) : (
              <div className="w-32 h-32 border-2 border-black flex items-center justify-center text-[9px] mx-auto my-1">
                QR Code
              </div>
            )}

            <div className="text-[10px] font-bold mt-1 text-center">
              UPI ID: <span className="underline">{cafeVPA}</span>
            </div>
            <div className="text-[8px] text-gray-600 text-center mt-0.5">
              Google Pay • PhonePe • Paytm • Any UPI App
            </div>
          </div>

          {/* 7. Centered Footer Note */}
          <div className="border-t border-dashed border-black my-1.5 pt-1 text-center text-[8px] text-gray-700 space-y-0.5">
            <div className="font-bold">Thank you for dining at Brew & Bean!</div>
            <div>Please visit us again ✨</div>
            <div className="text-[7px] text-gray-500 mt-0.5">*** POWERED BY BREW & BEAN POS ***</div>
          </div>
        </div>,
        document.body
      )}

      {/* ======================================================== */}
      {/* 2. ON-SCREEN STAFF MODAL INTERFACE */}
      {/* ======================================================== */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in text-espresso no-print">
        {/* Backdrop */}
        <div className="absolute inset-0" onClick={onClose} />

        <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-espresso/15 overflow-hidden flex flex-col max-h-[92vh] z-10 animate-scale">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 bg-espresso text-cream flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-caramel text-espresso flex items-center justify-center shadow-warm-sm">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-serif text-lg font-bold text-white tracking-tight">
                    {isCustomerView ? 'Table Itemized Invoice' : 'Table Bill & Thermal Receipt'}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-caramel-light bg-caramel/20 px-2 py-0.5 rounded">
                    Table {order.tableNumber}
                  </span>
                </div>
                <p className="text-[11px] text-cream/70">
                  {isCustomerView
                    ? 'Consolidated bill breakdown • Please pay at the billing counter'
                    : 'Ready to print with shop UPI QR code for smaller POS thermal printer'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {!isCustomerView && (
                <button
                  onClick={handlePrint}
                  type="button"
                  className="inline-flex items-center space-x-1.5 bg-caramel hover:bg-caramel-dark text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs transition-all active:scale-95"
                  title="Print small thermal receipt"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Bill</span>
                </button>
              )}
              <button
                onClick={onClose}
                type="button"
                className="p-2 rounded-xl hover:bg-white/10 text-cream/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1">
            {/* Table & Order Metadata Banner */}
            <div className="p-3.5 rounded-2xl bg-cream-soft border border-espresso/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-2xl bg-espresso text-caramel flex flex-col items-center justify-center font-bold font-serif shadow-warm-sm">
                  <span className="text-[10px] text-cream/60 uppercase">Table</span>
                  <span className="text-base text-white">{order.tableNumber}</span>
                </div>
                <div>
                  <div className="font-serif text-base font-bold text-espresso">
                    Order #{order.orderNumber}
                  </div>
                  <div className="text-[11px] text-espresso/60 flex items-center space-x-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-caramel" />
                    <span>
                      {formattedDate} • {formattedTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] text-espresso/60">Guest / Patron:</div>
                <div className="font-bold text-espresso">{order.customerName || 'Dine-In Guest'}</div>
                {order.paymentStatus === 'paid' ? (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Paid & Settled</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 mt-1">
                    <span>Pay at Counter</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Thermal Print Banner (Staff Only) */}
            {!isCustomerView && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 text-emerald-900">
                  <Printer className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Formatted for Thermal POS Printer</span>
                    <span className="text-[11px] text-emerald-700">
                      Includes itemized list, GST invoice, and Shop UPI QR code for the table
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center space-x-1 shadow-xs transition-all active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Now</span>
                </button>
              </div>
            )}

            {/* Itemized Table Breakdown */}
            <div className="border border-espresso/10 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-espresso/5 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider text-espresso/70 flex justify-between border-b border-espresso/10">
                <span>Item & Customization</span>
                <span>Amount</span>
              </div>

              <div className="divide-y divide-espresso/5 p-2 text-xs">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2 px-1.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded bg-espresso/10 text-espresso font-bold text-[11px] flex items-center justify-center shrink-0">
                          {item.quantity}×
                        </span>
                        <span className="font-bold text-espresso">{item.name}</span>
                      </div>

                      {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                        <div className="ml-7 mt-0.5 flex flex-wrap gap-1">
                          {item.selectedCustomizations.map((c, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-cream-soft text-espresso/70 border border-espresso/10 px-1.5 py-0.2 rounded"
                            >
                              {c.optionName} {c.price > 0 && `(+₹${c.price})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <span className="font-serif font-bold text-espresso shrink-0">
                      ₹{item.itemTotal}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="bg-cream-soft/60 p-3.5 border-t border-espresso/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-espresso/70">
                  <span>Subtotal</span>
                  <span>₹{order.subtotal}</span>
                </div>
                <div className="flex justify-between text-espresso/70">
                  <span>5% Café Dining GST</span>
                  <span>₹{order.tax}</span>
                </div>
                <div className="pt-2 border-t border-espresso/10 flex justify-between items-center text-sm font-bold text-espresso">
                  <span>Total Bill Amount</span>
                  <span className="font-serif text-xl font-bold text-caramel-dark">
                    ₹{order.total}
                  </span>
                </div>
              </div>
            </div>

            {/* For Customer View: Pay at Counter Notice */}
            {isCustomerView ? (
              <div className="p-4 bg-cream-soft rounded-2xl border border-espresso/10 flex items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold text-espresso">
                    <Store className="w-4 h-4 text-caramel-dark" />
                    <span>Please Pay at Billing Counter</span>
                  </div>
                  <p className="text-[11px] text-espresso/80">
                    Show your Order <strong>#{order.orderNumber}</strong> or <strong>Table {order.tableNumber}</strong> at the billing counter to pay.
                  </p>
                  <div className="text-[10px] text-espresso/60 font-medium">
                    Accepted: Cash • UPI (GPay/PhonePe/Paytm) • Cards
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-espresso/10 text-center shrink-0">
                  <span className="text-[10px] text-espresso/50 block uppercase font-bold">Total Bill</span>
                  <span className="font-serif font-bold text-sm text-caramel-dark">₹{order.total}</span>
                </div>
              </div>
            ) : (
              /* Shop QR Preview for Staff */
              <div className="p-4 bg-cream-soft rounded-2xl border border-espresso/10 flex items-center justify-between gap-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold text-espresso">
                    <QrCode className="w-4 h-4 text-caramel" />
                    <span>Shop Payment QR (Printed on Thermal Bill)</span>
                  </div>
                  <p className="text-[11px] text-espresso/70">
                    Printed onto the thermal receipt for customers to scan with Google Pay, PhonePe, Paytm, or BHIM.
                  </p>
                  <div className="font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-espresso/10 inline-block">
                    UPI ID: {cafeVPA}
                  </div>
                </div>

                <div className="w-20 h-20 bg-white p-1 rounded-xl border border-espresso/15 shrink-0 flex items-center justify-center shadow-xs">
                  {thermalQrUrl ? (
                    <img src={thermalQrUrl} alt="Shop UPI QR" className="w-full h-full object-contain" />
                  ) : (
                    <QrCode className="w-8 h-8 text-espresso/40" />
                  )}
                </div>
              </div>
            )}

            {/* Payment Mode Selector for Counter Staff */}
            {!isCustomerView && !paidSuccess && (
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold text-espresso block">
                  Select Settlement Method Received at Table or Counter:
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('upi')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      selectedMethod === 'upi'
                        ? 'bg-espresso text-cream border-espresso shadow-xs'
                        : 'bg-white hover:bg-cream-soft border-espresso/15 text-espresso'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-caramel" />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      selectedMethod === 'cash'
                        ? 'bg-espresso text-cream border-espresso shadow-xs'
                        : 'bg-white hover:bg-cream-soft border-espresso/15 text-espresso'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-emerald-500" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      selectedMethod === 'card'
                        ? 'bg-espresso text-cream border-espresso shadow-xs'
                        : 'bg-white hover:bg-cream-soft border-espresso/15 text-espresso'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-blue-500" />
                    <span>POS Card</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-cream-soft border-t border-espresso/10 flex items-center justify-between gap-3">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-espresso/70 hover:bg-espresso/5 transition-colors"
            >
              Close
            </button>

            {!isCustomerView && !paidSuccess && (
              <button
                onClick={handleSettle}
                disabled={isProcessing}
                type="button"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm tracking-wide shadow-warm-sm flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Recording Settlement...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Mark Paid & Settled (₹{order.total})</span>
                  </>
                )}
              </button>
            )}

            {paidSuccess && (
              <div className="flex-1 text-center py-2 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bill Successfully Settled & Closed</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

