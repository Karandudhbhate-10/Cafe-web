import React from 'react';
import { Coffee, CheckCircle2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { TableItem } from '../../types';

interface TableBannerProps {
  availableTables?: TableItem[];
}

export const TableBanner: React.FC<TableBannerProps> = () => {
  const { tableNumber, tableName, tableValidated } = useCart();

  if (!tableNumber) {
    return (
      <div className="bg-gradient-to-r from-[#DDECD8]/75 via-white/85 to-[#F6E4CC]/75 backdrop-blur-md border border-[#879078]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 mb-4 sm:mb-6 shadow-warm-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-espresso text-caramel flex items-center justify-center font-serif font-bold shrink-0 shadow-xs border border-caramel/30">
            <Coffee className="w-5 h-5 text-caramel" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#879078]">
              Café QR Dining
            </span>
            <h3 className="font-serif font-bold text-espresso text-sm sm:text-base">
              Digital Table Menu
            </h3>
            <p className="text-xs text-espresso/70">
              Browse our freshly roasted coffees and food. Simply enter your table number when placing your order!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-[#DDECD8]/75 via-white/85 to-[#F6E4CC]/75 backdrop-blur-md border border-[#879078]/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 mb-4 sm:mb-6 shadow-warm-sm flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-espresso text-caramel flex items-center justify-center font-bold font-serif text-base sm:text-lg shadow-warm-sm shrink-0 border border-caramel/40">
          {tableNumber}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] sm:text-xs font-bold tracking-wider uppercase text-[#879078]">
              Active Dining Table
            </span>
            {tableValidated && (
              <span className="inline-flex items-center space-x-1 text-[10px] sm:text-[11px] font-semibold text-[#284221] bg-[#E2EEE0] px-2.5 py-0.5 rounded-full border border-[#879078]/35">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Verified Table</span>
              </span>
            )}
          </div>
          <h2 className="text-sm sm:text-base font-serif font-bold text-espresso leading-snug">
            Table {tableNumber} {tableName ? `• ${tableName}` : ''}
          </h2>
        </div>
      </div>

      <div className="hidden sm:flex items-center space-x-2 text-xs font-semibold text-espresso/80 bg-white/90 px-3 py-1.5 rounded-xl border border-[#879078]/25 shadow-2xs">
        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block animate-pulse" />
        <span>Direct Table Delivery</span>
      </div>
    </div>
  );
};
