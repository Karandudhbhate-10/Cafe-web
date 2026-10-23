import { io, Socket } from 'socket.io-client';
import { Order } from '../types';

let socketInstance: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socketInstance) {
    // Connect to backend URL (production) or current origin (Vite dev proxy)
    const BACKEND_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    socketInstance = io(BACKEND_URL || undefined, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      // console.log('[Socket] Connected with ID:', socketInstance?.id);
    });

    socketInstance.on('disconnect', () => {
      // console.log('[Socket] Disconnected');
    });
  }
  return socketInstance;
};

// Staff joins live staff channel
export const joinStaffChannel = () => {
  const socket = getSocket();
  socket.emit('join_staff');
};

// Customer joins their order room
export const joinOrderRoom = (trackingToken: string) => {
  const socket = getSocket();
  if (trackingToken) {
    socket.emit('join_order_room', trackingToken);
  }
};

// Subscribe to new incoming orders (Staff)
export const onNewOrder = (callback: (order: Order) => void) => {
  const socket = getSocket();
  socket.on('new_order', callback);
  return () => {
    socket.off('new_order', callback);
  };
};

// Subscribe to order status updates (Staff & Customer)
export const onOrderStatusUpdate = (callback: (order: Order) => void) => {
  const socket = getSocket();
  socket.on('order_status_updated', callback);
  return () => {
    socket.off('order_status_updated', callback);
  };
};
