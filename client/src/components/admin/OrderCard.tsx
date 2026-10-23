import React from 'react';
import {
  Clock,
  MapPin,
  Coffee,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  Printer,
  User,
} from 'lucide-react';
import { Order } from '../../types';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, newStatus: string, note?: string) => Promise<void>;
  onRequestReject?: (order: Order) => void;
  onOpenBill?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onRequestReject,
  onOpenBill,
}) => {
  const getElapsedMinutes = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  const elapsedMins = getElapsedMinutes(order.createdAt);
  const isUrgent = elapsedMins >= 15 && order.status !== 'completed' && order.status !== 'rejected';
  const isReady = order.status === 'ready';
  const isCompleted = order.status === 'completed';
  const isRejected = order.status === 'rejected';

  return (
    <div
      className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-warm-sm transition-all space-y-3.5 flex flex-col justify-between ${
        isReady
          ? 'border-emerald-300 ring-2 ring-emerald-100/80 bg-gradient-to-b from-white to-emerald-50/20'
          : isUrgent
          ? 'border-amber-300 ring-2 ring-amber-100 bg-white'
          : 'border-espresso/10 hover:border-caramel/40'
      }`}
    >
      <div>
        {/* Top Header: Table Badge, Order # and Elapsed Time */}
        <div className="flex items-start justify-between gap-2 border-b border-espresso/10 pb-3">
          <div className="flex items-center space-x-2.5">
            {/* Prominent Table Badge */}
            <div className="bg-espresso text-cream px-3 py-1.5 rounded-2xl font-bold flex items-center space-x-1.5 shadow-sm shrink-0">
              <MapPin className="w-4 h-4 text-caramel shrink-0" />
              <span className="text-sm font-serif tracking-wide text-white">
                TABLE {order.tableNumber}
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-serif font-bold text-base text-espresso">
                  #{order.orderNumber}
                </span>
                {isReady && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    Ready
                  </span>
                )}
              </div>
              {order.customerName && order.customerName !== 'Guest' && (
                <div className="text-[11px] text-espresso/70 flex items-center space-x-1">
                  <User className="w-3 h-3 text-caramel" />
                  <span className="truncate max-w-[120px]">{order.customerName}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end shrink-0 text-right">
            <span
              className={`text-xs font-bold flex items-center space-x-1 ${
                isUrgent ? 'text-amber-800' : 'text-espresso/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-caramel" />
              <span>{elapsedMins}m ago</span>
            </span>
            <span className="text-[10px] text-espresso/50 font-medium">
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
        </div>

        {/* Itemized Order List */}
        <div className="py-2.5 divide-y divide-espresso/5 space-y-2 text-xs">
          {order.items.map((item, idx) => (
            <div key={idx} className="pt-2 first:pt-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2">
                  <span className="w-5 h-5 rounded-md bg-espresso/10 text-espresso font-bold text-xs flex items-center justify-center shrink-0">
                    {item.quantity}×
                  </span>
                  <div>
                    <span className="font-bold text-espresso text-sm leading-tight block">
                      {item.name}
                    </span>
                    {/* Customizations */}
                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
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
                    {/* Special Item Instructions */}
                    {item.specialInstructions && (
                      <p className="mt-0.5 text-[10px] text-amber-900 font-medium italic">
                        Note: "{item.specialInstructions}"
                      </p>
                    )}
                  </div>
                </div>

                <span className="font-serif font-semibold text-espresso shrink-0 text-sm">
                  ₹{item.itemTotal}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Customer Table Note if present */}
        {order.customerNotes && (
          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 my-1">
            <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-800">
              Table Note:
            </span>
            <span>{order.customerNotes}</span>
          </div>
        )}
      </div>

      {/* Footer: Total & Streamlined Single-Click Action */}
      <div className="pt-2.5 border-t border-espresso/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div>
            <span className="text-espresso/60 text-[11px]">Total: </span>
            <span className="font-serif font-bold text-lg text-espresso">
              ₹{order.total}
            </span>
          </div>

          {order.paymentStatus === 'paid' ? (
            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Paid ({order.paymentMethod || 'Counter'})</span>
            </span>
          ) : (
            <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <span>Pay at Counter</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Minimal clicks, fast execution */}
        <div className="flex items-center gap-2">
          {/* Active Order (Preparing/Incoming) */}
          {!isReady && !isCompleted && !isRejected && (
            <>
              {/* Primary Next Action: Mark Ready */}
              <button
                onClick={() => onUpdateStatus(order._id, 'ready')}
                type="button"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-warm-sm transition-all active:scale-98"
                title="Mark order ready for customer serving"
              >
                <Coffee className="w-4 h-4" />
                <span>Mark Ready</span>
              </button>

              {/* Fast Settle / Skip Kitchen option */}
              {onOpenBill && (
                <button
                  onClick={() => onOpenBill(order)}
                  type="button"
                  className="bg-espresso hover:bg-roast text-cream font-bold py-2.5 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-warm-sm transition-all active:scale-98"
                  title="Open bill and settle payment"
                >
                  <Receipt className="w-4 h-4 text-caramel" />
                  <span>Bill & Settle</span>
                </button>
              )}

              {/* Reject button for sold-out items */}
              {onRequestReject && (
                <button
                  onClick={() => onRequestReject(order)}
                  type="button"
                  className="px-2.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
                  title="Reject order if out of stock"
                >
                  Reject
                </button>
              )}
            </>
          )}

          {/* Ready Order */}
          {isReady && (
            <>
              {order.paymentStatus === 'paid' ? (
                <button
                  onClick={() => onUpdateStatus(order._id, 'completed')}
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-warm-sm transition-all active:scale-98"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark Served & Complete</span>
                </button>
              ) : (
                <>
                  {onOpenBill && (
                    <button
                      onClick={() => onOpenBill(order)}
                      type="button"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-warm-sm transition-all active:scale-98"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Settle & Serve (₹{order.total})</span>
                    </button>
                  )}
                  <button
                    onClick={() => onUpdateStatus(order._id, 'completed')}
                    type="button"
                    className="px-3.5 py-2.5 bg-espresso/5 hover:bg-espresso/10 text-espresso font-bold rounded-2xl text-xs transition-colors"
                    title="Mark served now (settle bill later)"
                  >
                    Served
                  </button>
                </>
              )}
            </>
          )}

          {/* Completed Order */}
          {isCompleted && (
            <div className="w-full flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50/80 px-3 py-2 rounded-2xl border border-emerald-200">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Served & Settled</span>
              </span>
              {onOpenBill && (
                <button
                  onClick={() => onOpenBill(order)}
                  type="button"
                  className="text-[11px] font-bold text-caramel-dark hover:underline flex items-center space-x-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
              )}
            </div>
          )}

          {/* Rejected Order */}
          {isRejected && (
            <div className="w-full text-center py-2 text-xs font-semibold text-red-600 bg-red-50 rounded-2xl border border-red-200 flex items-center justify-center space-x-1">
              <XCircle className="w-4 h-4" />
              <span>Order Cancelled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
