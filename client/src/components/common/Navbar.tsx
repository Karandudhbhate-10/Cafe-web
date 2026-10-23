import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Coffee, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';

interface NavbarProps {
  theme?: 'light' | 'dark' | 'auto';
}

export const Navbar: React.FC<NavbarProps> = ({ theme = 'auto' }) => {
  const { itemCount, openCart, tableNumber, tableName, activeOrderToken, activeOrderNumber, activeOrderTable } = useCart();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDark = theme === 'dark';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isDark
            ? isScrolled
              ? 'bg-roast/95 backdrop-blur-md shadow-warm-lg border-b border-caramel/25 py-2.5 sm:py-3'
              : 'bg-roast/80 backdrop-blur-md border-b border-caramel/20 py-2.5 sm:py-3.5'
            : isScrolled
            ? 'bg-gradient-to-r from-[#C9E4C4]/95 via-white/92 to-[#F6E3CC]/90 backdrop-blur-md shadow-warm-sm border-b border-[#7DA175]/30 py-2.5 sm:py-3'
            : 'bg-gradient-to-r from-[#C9E4C4]/85 via-white/88 to-[#F6E3CC]/85 backdrop-blur-md border-b border-[#7DA175]/25 py-2.5 sm:py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center space-x-2 group focus:outline-none shrink-0"
            >
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-warm-sm transition-colors duration-200 shrink-0 ${
                isDark
                  ? 'bg-caramel/20 border border-caramel/40 text-caramel group-hover:bg-caramel group-hover:text-espresso'
                  : 'bg-espresso text-caramel group-hover:bg-roast'
              }`}>
                <Coffee className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:scale-110" />
              </div>
              <div className="flex flex-col">
                <span className={`font-serif text-base sm:text-xl font-bold tracking-tight transition-colors leading-tight ${
                  isDark
                    ? 'text-white group-hover:text-caramel-light'
                    : 'text-espresso group-hover:text-caramel-dark'
                }`}>
                  BREW & BEAN
                </span>
                <span className="text-[9px] sm:text-[10px] tracking-widest uppercase text-caramel font-semibold">
                  Café & Roastery
                </span>
              </div>
            </Link>

            {/* Navigation Links (Desktop) */}
            <nav className="hidden md:flex items-center space-x-7">
              <Link
                to="/"
                className={`text-sm font-semibold tracking-wide transition-colors ${
                  location.pathname === '/' || location.pathname === '/menu'
                    ? 'text-caramel font-bold'
                    : isDark
                    ? 'text-cream/80 hover:text-caramel'
                    : 'text-espresso/80 hover:text-caramel'
                }`}
              >
                Menu
              </Link>
            </nav>

            {/* Table Indicator, Staff Portal & Cart Button */}
            <div className="flex items-center space-x-1.5 sm:space-x-2.5">
              {tableNumber ? (
                <div className={`flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium ${
                  isDark
                    ? 'bg-caramel/20 border border-caramel/40 text-cream'
                    : 'bg-caramel/15 border border-caramel/30 text-espresso'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-caramel inline-block shrink-0" />
                  <span className="font-bold text-espresso text-[11px] sm:text-xs">
                    Table {tableNumber}
                  </span>
                </div>
              ) : null}

              {/* Staff Portal Link (Always visible in mobile & desktop header) */}
              <Link
                to="/admin/login"
                className={`flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all shadow-2xs border active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-espresso/80 hover:bg-espresso text-caramel border-caramel/40'
                    : 'bg-white/95 hover:bg-white text-espresso border-[#7DA175]/35 hover:border-caramel/50'
                }`}
                title="Staff Portal Login"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-caramel shrink-0" />
                <span className="hidden min-[380px]:inline">Staff Portal</span>
                <span className="min-[380px]:hidden">Staff</span>
              </Link>

              {/* Active Order Button - ONLY shown if order belongs to current table! */}
              {activeOrderToken && (!tableNumber || !activeOrderTable || activeOrderTable.toUpperCase() === tableNumber.toUpperCase()) && (
                <Link
                  to={`/track/${activeOrderToken}`}
                  className={`inline-flex items-center space-x-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs font-bold transition-all shadow-xs border ${
                    isDark
                      ? 'bg-caramel/25 hover:bg-caramel/40 text-caramel-light border-caramel/50'
                      : 'bg-espresso hover:bg-roast text-cream border-espresso'
                  }`}
                  title="Track active order"
                >
                  <Coffee className="w-3.5 h-3.5 text-caramel animate-pulse" />
                  <span className="text-[11px] sm:text-xs">
                    {activeOrderNumber ? `#${activeOrderNumber}` : 'Track Order'}
                  </span>
                </Link>
              )}

              {/* Cart Button */}
              <button
                onClick={openCart}
                type="button"
                className={`relative flex items-center justify-center p-2 sm:p-2.5 rounded-full transition-all shadow-warm-sm focus:outline-none focus:ring-2 focus:ring-caramel active:scale-95 shrink-0 ${
                  isDark
                    ? 'bg-caramel text-espresso hover:bg-caramel-light'
                    : 'bg-espresso text-cream hover:bg-roast hover:text-caramel'
                }`}
                aria-label="View Cart"
              >
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                {itemCount > 0 && (
                  <span className={`absolute -top-1 -right-1 text-white text-[10px] sm:text-[11px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-scale ${
                    isDark ? 'bg-espresso border border-caramel' : 'bg-caramel'
                  }`}>
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
