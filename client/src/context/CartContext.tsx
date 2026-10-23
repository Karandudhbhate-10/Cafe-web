import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, SelectedCustomization, MenuItem } from '../types';
import { api } from '../services/api';

interface CartContextType {
  items: CartItem[];
  tableNumber: string;
  tableName: string;
  tableValidated: boolean;
  isCartOpen: boolean;
  customerName: string;
  customerNotes: string;
  subtotal: number;
  tax: number;
  total: number;
  itemCount: number;
  isPlacingOrder: boolean;
  orderError: string | null;
  activeOrderToken: string | null;
  activeOrderNumber: string | null;
  activeOrderTable: string | null;
  setActiveOrder: (token: string | null, number?: string | null, table?: string | null) => void;
  clearActiveOrder: (table?: string) => void;
  setTable: (tableNum: string, name?: string) => boolean | Promise<boolean>;
  setCustomerName: (name: string) => void;
  setCustomerNotes: (notes: string) => void;
  addItem: (
    item: MenuItem,
    customizations: SelectedCustomization[],
    quantity: number,
    specialInstructions?: string
  ) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  removeItem: (cartItemId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  placeOrder: () => Promise<{ orderNumber: string; trackingToken: string } | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bb_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [tableNumber, setTableNumberState] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');

  const [tableValidated, setTableValidated] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const [activeOrderTable, setActiveOrderTable] = useState<string | null>(() => {
    return localStorage.getItem('bb_active_order_table') || null;
  });

  const [activeOrderToken, setActiveOrderToken] = useState<string | null>(() => {
    return localStorage.getItem('bb_active_order_token') || null;
  });

  const [activeOrderNumber, setActiveOrderNumber] = useState<string | null>(() => {
    return localStorage.getItem('bb_active_order_number') || null;
  });

  const setActiveOrder = (token: string | null, orderNum?: string | null, tbl?: string | null) => {
    if (token) {
      const finalTbl = (tbl || tableNumber || '').toUpperCase();
      setActiveOrderToken(token);
      setActiveOrderNumber(orderNum || null);
      setActiveOrderTable(finalTbl || null);

      localStorage.setItem('bb_active_order_token', token);
      if (orderNum) {
        localStorage.setItem('bb_active_order_number', orderNum);
      }
      if (finalTbl) {
        localStorage.setItem('bb_active_order_table', finalTbl);
        localStorage.setItem(`bb_table_${finalTbl}_order_token`, token);
        if (orderNum) localStorage.setItem(`bb_table_${finalTbl}_order_number`, orderNum);
      }
    } else {
      clearActiveOrder(tbl || tableNumber);
    }
  };

  const clearActiveOrder = useCallback((tbl?: string) => {
    setActiveOrderToken(null);
    setActiveOrderNumber(null);
    setActiveOrderTable(null);
    localStorage.removeItem('bb_active_order_token');
    localStorage.removeItem('bb_active_order_number');
    localStorage.removeItem('bb_active_order_table');
    if (tbl) {
      const targetTbl = tbl.toUpperCase();
      localStorage.removeItem(`bb_table_${targetTbl}_order_token`);
      localStorage.removeItem(`bb_table_${targetTbl}_order_number`);
    }
  }, []);

  // Persist items
  useEffect(() => {
    localStorage.setItem('bb_cart_items', JSON.stringify(items));
  }, [items]);

  // Persist table only when set; remove when cleared
  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem('bb_table_number', tableNumber);
      localStorage.setItem('bb_table_name', tableName);
    } else {
      localStorage.removeItem('bb_table_number');
      localStorage.removeItem('bb_table_name');
    }
  }, [tableNumber, tableName]);

  const setTable = useCallback((tableNum: string, name?: string): boolean => {
    // 1. Immediately update state synchronously so user can type freely without lag or block!
    setTableNumberState(tableNum);

    const clean = tableNum.trim();
    if (!clean) {
      setTableName('');
      setTableValidated(false);
      localStorage.removeItem('bb_table_number');
      localStorage.removeItem('bb_table_name');
      return true;
    }

    const assignedName = name || `Table ${clean}`;
    setTableName(assignedName);
    setTableValidated(true);
    localStorage.setItem('bb_table_number', clean);
    localStorage.setItem('bb_table_name', assignedName);
    return true;
  }, []);

  const addItem = (
    item: MenuItem,
    customizations: SelectedCustomization[],
    quantity: number,
    specialInstructions = ''
  ) => {
    const extraPrice = customizations.reduce((acc, c) => acc + (c.price || 0), 0);
    const unitPrice = item.price + extraPrice;

    // Create a fingerprint to combine identical customized items
    const customKey = customizations
      .map((c) => `${c.groupName}:${c.optionName}`)
      .sort()
      .join('|');
    const fingerprint = `${item._id}_${customKey}_${specialInstructions.trim().toLowerCase()}`;

    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartItemId === fingerprint);
      if (existingIndex > -1) {
        const copy = [...prev];
        copy[existingIndex].quantity += quantity;
        return copy;
      } else {
        return [
          ...prev,
          {
            cartItemId: fingerprint,
            menuItemId: item._id,
            name: item.name,
            price: item.price,
            unitPrice,
            quantity,
            selectedCustomizations: customizations,
            specialInstructions,
            image: item.image,
          },
        ];
      }
    });

    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05); // 5% GST
  const total = subtotal + tax;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Place order
  const placeOrder = async () => {
    if (!tableNumber || !tableNumber.trim()) {
      setOrderError('Please enter your Table Number so our baristas know where to serve your order!');
      return null;
    }

    if (items.length === 0) {
      setOrderError('Your cart is empty. Add some delicious coffee or food first!');
      return null;
    }

    setIsPlacingOrder(true);
    setOrderError(null);

    try {
      const orderPayload = {
        tableNumber: tableNumber.trim(),
        customerName: customerName.trim() || 'Guest',
        customerNotes: customerNotes.trim(),
        existingToken: activeOrderTable?.toUpperCase() === tableNumber.toUpperCase() ? activeOrderToken : undefined,
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          selectedCustomizations: i.selectedCustomizations,
          specialInstructions: i.specialInstructions,
        })),
      };

      const result = await api.createOrder(orderPayload);
      clearCart();
      setIsCartOpen(false);
      setActiveOrder(result.trackingToken, result.orderNumber, tableNumber);

      // Reset table selection so cart starts fresh and never pre-fills the previous table
      setTableNumberState('');
      setTableName('');
      setTableValidated(false);
      localStorage.removeItem('bb_table_number');
      localStorage.removeItem('bb_table_name');

      return {
        orderNumber: result.orderNumber,
        trackingToken: result.trackingToken,
      };
    } catch (err: any) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
      return null;
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        tableNumber,
        tableName,
        tableValidated,
        isCartOpen,
        customerName,
        customerNotes,
        subtotal,
        tax,
        total,
        itemCount,
        isPlacingOrder,
        orderError,
        activeOrderToken,
        activeOrderNumber,
        activeOrderTable,
        setActiveOrder,
        clearActiveOrder,
        setTable,
        setCustomerName,
        setCustomerNotes,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        openCart,
        closeCart,
        placeOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
