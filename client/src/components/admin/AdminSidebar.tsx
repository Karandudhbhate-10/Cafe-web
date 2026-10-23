import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  QrCode,
  Receipt,
  LogOut,
  Coffee,
  KeyRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChangePasswordModal } from './ChangePasswordModal';

export const AdminSidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/menu', label: 'Menu Items', icon: UtensilsCrossed },
    { to: '/admin/tables', label: 'Master QR', icon: QrCode },
    { to: '/admin/billing', label: 'Billing', icon: Receipt },
  ];

  return (
    <>
      {/* ======================================================== */}
      {/* 1. DESKTOP SIDEBAR (Visible on screens >= 1024px) */}
      {/* ======================================================== */}
      <aside className="hidden lg:flex w-64 bg-roast text-cream flex-col border-r border-roast-border shrink-0 select-none sticky top-0 h-screen z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-roast-border flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-caramel flex items-center justify-center text-espresso shadow-md">
            <Coffee className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-bold text-white tracking-tight">
              BREW & BEAN
            </h2>
            <span className="text-[10px] uppercase tracking-widest text-caramel font-semibold">
              Staff Portal
            </span>
          </div>
        </div>

        {/* Navigation Items (3 Tabs: Orders, Tables, Billing) */}
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-xs font-bold tracking-wide transition-all ${
                    isActive
                      ? 'bg-caramel text-white shadow-warm-sm translate-x-1'
                      : 'text-cream/70 hover:bg-espresso hover:text-cream'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User profile & Logout */}
        <div className="p-4 border-t border-roast-border space-y-3">
          <div className="bg-espresso/60 p-3 rounded-2xl flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-xs font-bold text-cream truncate">
                {user?.name || 'Staff Member'}
              </div>
              <div className="text-[10px] text-caramel capitalize">
                Role: {user?.role || 'Barista'}
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              type="button"
              className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-cream/75 hover:text-caramel py-2 bg-espresso/50 hover:bg-espresso/80 rounded-xl transition-colors border border-roast-border/60"
              title="Change your staff login password"
            >
              <KeyRound className="w-3.5 h-3.5 text-caramel" />
              <span>Change Password</span>
            </button>

            <button
              onClick={handleLogout}
              type="button"
              className="w-full flex items-center justify-center space-x-2 text-xs font-semibold text-cream/60 hover:text-red-400 py-2 hover:bg-espresso/40 rounded-xl transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* ======================================================== */}
      {/* 2. MOBILE & TABLET BOTTOM NAVIGATION BAR (Fixed at bottom) */}
      {/* ======================================================== */}
      <nav
        aria-label="Staff mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-roast/95 backdrop-blur-md border-t border-roast-border px-4 py-2 flex items-center justify-around shadow-2xl pb-[max(0.6rem,env(safe-area-inset-bottom))] no-print"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-4 rounded-xl text-[11px] font-bold transition-all ${
                  isActive
                    ? 'text-caramel font-extrabold scale-105'
                    : 'text-cream/60 hover:text-cream'
                }`
              }
            >
              <div className="relative p-1">
                <Icon className="w-5 h-5 mb-0.5" />
              </div>
              <span className="tracking-wide">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
