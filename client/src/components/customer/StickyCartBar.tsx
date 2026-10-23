import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export const StickyCartBar: React.FC = () => {
  const { itemCount, total, tableNumber, openCart, isCartOpen } = useCart();

  if (itemCount === 0 || isCartOpen) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-30 sm:hidden animate-slide-up pb-[max(0rem,env(safe-area-inset-bottom))]">
      <button
        onClick={openCart}
        type="button"
        className="w-full bg-espresso text-cream p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-caramel/40 shadow-glow-caramel active:scale-98 transition-all"
      >
        <div className="flex items-center space-x-3">
          <div className="relative w-8 h-8 rounded-xl bg-caramel text-espresso flex items-center justify-center font-bold text-xs shrink-0 shadow-warm-sm">
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-espresso text-caramel text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-caramel">
              {itemCount}
            </span>
          </div>
          <div className="text-left">
            <div className="text-[11px] text-caramel-light font-bold leading-tight">
              {tableNumber ? `Table ${tableNumber}` : 'Your Order'}
            </div>
            <div className="text-sm font-serif font-bold text-white leading-tight">
              ₹{total} <span className="text-[10px] font-sans font-normal text-cream/70">(incl. tax)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-xs font-bold bg-caramel/20 px-3 py-1.5 rounded-xl text-caramel-light border border-caramel/30">
          <span>View Cart</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
