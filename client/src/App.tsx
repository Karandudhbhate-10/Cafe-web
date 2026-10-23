import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/HomePage';
import { MenuPage } from './pages/MenuPage';
import { OrderTrackPage } from './pages/OrderTrackPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminMenuPage } from './pages/admin/AdminMenuPage';
import { AdminTablesPage } from './pages/admin/AdminTablesPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminOrdersListPage } from './pages/admin/AdminOrdersListPage';
import { AdminBillingPage } from './pages/admin/AdminBillingPage';

// Protected Route Component for Staff/Admin
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-roast flex flex-col items-center justify-center text-cream space-y-3 font-serif">
        <div className="w-8 h-8 border-2 border-caramel border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Authenticating staff credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Customer Routes - Direct Menu First (No hero section when scanning QR) */}
            <Route path="/" element={<MenuPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/story" element={<Navigate to="/" replace />} />
            <Route path="/track/:token" element={<OrderTrackPage />} />
            <Route path="/order/:token" element={<OrderTrackPage />} />

            {/* Admin Login */}
            <Route path="/admin/login" element={<AdminLoginPage />} />

            {/* Protected Admin Routes */}
            <Route path="/admin" element={<Navigate to="/admin/orders" replace />} />
            <Route
              path="/admin/orders"
              element={
                <ProtectedAdminRoute>
                  <AdminOrdersListPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/tables"
              element={
                <ProtectedAdminRoute>
                  <AdminTablesPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedAdminRoute>
                  <AdminBillingPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/menu"
              element={
                <ProtectedAdminRoute>
                  <AdminMenuPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <ProtectedAdminRoute>
                  <AdminTablesPage />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedAdminRoute>
                  <AdminReportsPage />
                </ProtectedAdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
