import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertCircle,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { TableItem } from '../../types';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    tableNumber,
    tableName,
    isCartOpen,
    customerName,
    customerNotes,
    subtotal,
    tax,
    total,
    isPlacingOrder,
    orderError,
    setTable,
    setCustomerName,
    setCustomerNotes,
    updateQuantity,
    removeItem,
    clearCart,
    closeCart,
    placeOrder,
  } = useCart();

  const [availableTables, setAvailableTables] = useState<TableItem[]>([]);
  const [tableHighlighted, setTableHighlighted] = useState(false);
  const tableSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getPublicTables().then(setAvailableTables).catch(() => { });
  }, []);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!tableNumber || !tableNumber.trim()) {
      setTableHighlighted(true);
      setTimeout(() => setTableHighlighted(false), 3000);
      tableSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = document.getElementById('cart-table-input');
      input?.focus();
      return;
    }

    const res = await placeOrder();
    if (res && res.trackingToken) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#C58B54', '#2B1D17', '#879078', '#FAF5EE'],
        });
      } catch (e) {
        // ignore
      }

      // Navigate to unguessable guest tracking page
      navigate(`/track/${res.trackingToken}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={closeCart} />

      {/* Drawer content */}
      <div className="relative w-full max-w-md bg-cream h-full shadow-2xl flex flex-col z-10 animate-slide-left border-l border-cream-dark/60 text-espresso">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-cream-dark/60 bg-cream-soft flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-caramel text-espresso flex items-center justify-center font-bold shadow-warm-sm">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-espresso">
                {tableNumber ? 'Your Table Order' : 'Your Order'}
              </h2>
              <span className="text-xs font-semibold text-caramel-dark">
                {tableNumber
                  ? `Table ${tableNumber} ${tableName ? `• ${tableName}` : ''}`
                  : 'Select table below before checkout'}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                type="button"
                className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              onClick={closeCart}
              type="button"
              className="p-2 rounded-full hover:bg-cream-dark/40 text-espresso transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-espresso/60 space-y-3">
              <div className="w-16 h-16 rounded-full bg-cream-soft flex items-center justify-center text-espresso/40 border border-cream-dark/60">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                Your cart is empty
              </h3>
              <p className="text-xs max-w-xs leading-relaxed font-normal">
                Add freshly roasted coffees, cold brews, or buttery croissants to start your order!
              </p>
              <button
                onClick={closeCart}
                className="mt-2 bg-espresso text-cream text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-caramel transition-colors shadow-warm-sm"
              >
                Explore Menu
              </button>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white rounded-2xl p-3.5 border border-cream-dark/60 shadow-xs flex items-start space-x-3"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-cream-dark/40"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-sm font-bold text-espresso truncate">
                        {item.name}
                      </h4>
                      <span className="font-serif text-sm font-bold text-caramel-dark">
                        ₹{item.unitPrice * item.quantity}
                      </span>
                    </div>

                    {/* Customizations summary */}
                    {item.selectedCustomizations.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedCustomizations.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-cream-soft text-espresso/80 border border-cream-dark/60 px-1.5 py-0.5 rounded-md"
                          >
                            {c.optionName} {c.price > 0 && `(+₹${c.price})`}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Special instruction text */}
                    {item.specialInstructions && (
                      <p className="text-[11px] text-espresso/60 italic mt-1 line-clamp-1 font-normal">
                        "{item.specialInstructions}"
                      </p>
                    )}

                    {/* Stepper + Delete */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-2 bg-cream-soft rounded-xl p-1 border border-cream-dark/80">
                        <button
                          onClick={() => updateQuantity(item.cartItemId, -1)}
                          className="w-6 h-6 rounded-lg bg-white text-espresso flex items-center justify-center hover:bg-caramel hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-espresso">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartItemId, 1)}
                          className="w-6 h-6 rounded-lg bg-white text-espresso flex items-center justify-center hover:bg-caramel hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.cartItemId)}
                        className="text-espresso/40 hover:text-red-600 transition-colors p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Guest details inputs */}
              <div className="pt-4 border-t border-cream-dark/60 space-y-3.5">
                {/* Required Table Selector */}
                <div>
                  <label className="text-xs font-bold text-espresso block mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                    className="w-full bg-white border border-cream-dark/80 rounded-xl px-3 py-2 text-xs text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>

                <div ref={tableSectionRef}>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="cart-table-input" className="text-xs font-bold text-espresso block">
                      Table Number <span className="text-red-600 font-bold">*</span>
                    </label>
                    {tableHighlighted && !tableNumber && (
                      <span className="text-[10px] text-red-600 font-bold animate-pulse">Required</span>
                    )}
                  </div>
                  <input
                    id="cart-table-input"
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTable(e.target.value)}
                    placeholder="e.g. 1, 2, 5 or T01"
                    autoComplete="off"
                    spellCheck={false}
                    className={`w-full bg-white border rounded-xl px-3 py-2 text-xs font-bold text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel transition-colors ${
                      tableHighlighted && !tableNumber
                        ? 'border-red-500 ring-2 ring-red-300'
                        : 'border-cream-dark/80'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-espresso block mb-1">
                    Order Notes for Kitchen (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    placeholder="e.g. Serve coffee first, extra napkins"
                    className="w-full bg-white border border-cream-dark/80 rounded-xl px-3 py-2 text-xs text-espresso placeholder-espresso/40 focus:outline-none focus:ring-2 focus:ring-caramel"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-cream-soft border-t border-cream-dark/60 space-y-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Calculation rows */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-espresso/70 font-normal">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-espresso/70 font-normal">
                <span>5% Café GST</span>
                <span>₹{tax}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-espresso pt-1.5 border-t border-cream-dark/60">
                <span>Total Amount</span>
                <span className="font-serif text-base text-caramel-dark font-bold">₹{total}</span>
              </div>
            </div>

            {/* Error banner */}
            {orderError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Payment note */}
            <p className="text-[11px] text-espresso/60 text-center font-normal">
              Pay at counter only (Cash, Card, or UPI).
            </p>

            {/* Submit button */}
            <button
              onClick={handleCheckout}
              disabled={isPlacingOrder}
              type="button"
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm tracking-wide shadow-warm-md flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50 ${!tableNumber
                ? 'bg-amber-700 hover:bg-amber-800 text-white shadow-amber-900/20'
                : 'bg-espresso hover:bg-roast text-cream'
                }`}
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-caramel" />
                  <span>Sending Order to Kitchen...</span>
                </>
              ) : !tableNumber ? (
                <>
                  <MapPin className="w-4 h-4 text-amber-200 animate-bounce" />
                  <span>Select Table to Place Order • ₹{total}</span>
                </>
              ) : (
                <>
                  <span>Place Order for Table {tableNumber} • ₹{total}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
