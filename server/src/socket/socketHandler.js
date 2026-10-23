let ioInstance = null;

export const initSocketIO = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join staff channel
    socket.on('join_staff', () => {
      socket.join('staff_channel');
      // console.log(`[Socket.IO] Client ${socket.id} joined staff_channel`);
    });

    // Customer joins their order tracking room
    socket.on('join_order_room', (trackingToken) => {
      if (trackingToken) {
        socket.join(`order:${trackingToken}`);
        // console.log(`[Socket.IO] Client ${socket.id} joined order room: ${trackingToken}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });
};

export const getIO = () => {
  return ioInstance;
};

// Dispatch new order notification to staff dashboard
export const emitNewOrder = (order) => {
  if (ioInstance) {
    ioInstance.to('staff_channel').emit('new_order', order);
  }
};

// Dispatch status change notification to staff and the customer
export const emitOrderStatusUpdate = (order) => {
  if (ioInstance) {
    // Notify staff dashboard
    ioInstance.to('staff_channel').emit('order_status_updated', order);
    // Notify customer tracking page
    ioInstance.to(`order:${order.trackingToken}`).emit('order_status_updated', order);
  }
};
