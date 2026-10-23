import React, { useState } from 'react';
import { Clock, ChefHat, Coffee, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { Order } from '../../types';
import { OrderCard } from './OrderCard';

interface KitchenBoardViewProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: string, note?: string) => Promise<void>;
  onOpenBill?: (order: Order) => void;
}

export const KitchenBoardView: React.FC<KitchenBoardViewProps> = ({
  orders,
  onUpdateStatus,
  onOpenBill,
}) => {
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Item out of stock or kitchen busy');

  const newOrders = orders.filter((o) => o.status === 'received');
  const acceptedOrders = orders.filter((o) => o.status === 'accepted');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    await onUpdateStatus(rejectingOrder._id, 'rejected', rejectReason);
    setRejectingOrder(null);
  };

  const columns = [
    {
      title: 'New Orders',
      status: 'received',
      count: newOrders.length,
      orders: newOrders,
      badgeColor: 'bg-red-500 text-white',
      accentColor: 'border-t-4 border-t-red-500',
    },
    {
      title: 'Accepted',
      status: 'accepted',
      count: acceptedOrders.length,
      orders: acceptedOrders,
      badgeColor: 'bg-caramel text-white',
      accentColor: 'border-t-4 border-t-caramel',
    },
    {
      title: 'In Preparation',
      status: 'preparing',
      count: preparingOrders.length,
      orders: preparingOrders,
      badgeColor: 'bg-blue-600 text-white',
      accentColor: 'border-t-4 border-t-blue-600',
    },
    {
      title: 'Ready to Serve',
      status: 'ready',
      count: readyOrders.length,
      orders: readyOrders,
      badgeColor: 'bg-emerald-600 text-white',
      accentColor: 'border-t-4 border-t-emerald-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 4-column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {columns.map((col) => (
          <div
            key={col.status}
            className={`bg-cream/40 rounded-3xl p-4 border border-espresso/10 flex flex-col min-h-[500px] ${col.accentColor}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-espresso/10">
              <h3 className="font-serif font-bold text-espresso text-base flex items-center space-x-2">
                <span>{col.title}</span>
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs ${col.badgeColor}`}>
                {col.count}
              </span>
            </div>

            {/* Column Cards */}
            <div className="space-y-3.5 flex-1 overflow-y-auto">
              {col.orders.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center text-center text-espresso/40 space-y-1">
                  <Coffee className="w-6 h-6 stroke-[1.5]" />
                  <span className="text-xs">No orders</span>
                </div>
              ) : (
                col.orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onUpdateStatus={(id, status) => onUpdateStatus(id, status)}
                    onRequestReject={(ord) => setRejectingOrder(ord)}
                    onOpenBill={onOpenBill}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal for Order Rejection */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
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
                  Table {rejectingOrder.tableNumber} will be notified immediately that their order was not accepted.
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
                className="w-full bg-cream/50 border border-espresso/15 rounded-xl px-3 py-2 text-xs text-espresso font-medium focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                <option value="Item out of stock or ingredient unavailable">Item out of stock / ingredient unavailable</option>
                <option value="Kitchen at maximum capacity">Kitchen at maximum capacity</option>
                <option value="Invalid table selection or duplicate order">Invalid table selection / duplicate order</option>
                <option value="Closing time reached">Kitchen closing time reached</option>
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
