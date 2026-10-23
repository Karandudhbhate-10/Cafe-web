import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';
import { emitNewOrder, emitOrderStatusUpdate } from '../socket/socketHandler.js';

// Helper to generate sequential order number like BB101, BB102
const generateOrderNumber = async () => {
  const count = await Order.countDocuments();
  const nextNum = 100 + count + 1;
  return `BB${nextNum}`;
};

// Customer creates an order (Public, verified on server)
export const createOrder = async (req, res) => {
  try {
    const { tableNumber, items, customerName, customerNotes } = req.body;

    if (!tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Table number and at least one item are required.',
      });
    }

    // 1. Resolve Table (Flexible match: exact, digits-padded 'T0X', or auto-register)
    const cleanInput = tableNumber.trim();
    const normalized = cleanInput.toUpperCase();
    const digitsOnly = cleanInput.replace(/\D/g, '');

    let table = await Table.findOne({
      $or: [
        { tableNumber: normalized },
        ...(digitsOnly
          ? [
              { tableNumber: `T${digitsOnly.padStart(2, '0')}` },
              { tableNumber: `T${digitsOnly}` },
              { tableNumber: digitsOnly },
            ]
          : []),
        { name: new RegExp(`^${cleanInput}$`, 'i') },
      ],
    });

    if (!table) {
      // Auto-create table if not found so customer is never blocked
      table = await Table.create({
        tableNumber: normalized,
        name: `Table ${normalized}`,
        capacity: 4,
        isActive: true,
      });
    }

    if (!table.isActive) {
      return res.status(400).json({
        success: false,
        message: `Table "${table.tableNumber}" is currently marked inactive. Please ask staff.`,
      });
    }

    const finalTableNumber = table.tableNumber;

    // 2. Fetch all menu items from database to verify prices and availability
    const menuItemIds = items.map((i) => i.menuItemId);
    const dbItems = await MenuItem.find({ _id: { $in: menuItemIds } });
    const dbItemMap = new Map(dbItems.map((item) => [item._id.toString(), item]));

    let calculatedSubtotal = 0;
    const validatedItems = [];

    for (const clientItem of items) {
      const dbItem = dbItemMap.get(clientItem.menuItemId);
      if (!dbItem) {
        return res.status(400).json({
          success: false,
          message: `Item not found on menu: ${clientItem.name || clientItem.menuItemId}`,
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `"${dbItem.name}" is currently sold out. Please remove it to proceed.`,
        });
      }

      const qty = Math.max(1, parseInt(clientItem.quantity, 10) || 1);
      let unitPrice = dbItem.price;

      // Validate customizations and sum prices
      const validatedCustomizations = [];
      if (clientItem.selectedCustomizations && Array.isArray(clientItem.selectedCustomizations)) {
        for (const cust of clientItem.selectedCustomizations) {
          // Look up matching group and option in dbItem
          const group = dbItem.customizations.find(
            (g) => g.name.toLowerCase() === (cust.groupName || '').toLowerCase()
          );
          if (group) {
            const opt = group.options.find(
              (o) => o.name.toLowerCase() === (cust.optionName || '').toLowerCase()
            );
            if (opt) {
              const extraPrice = opt.price || 0;
              unitPrice += extraPrice;
              validatedCustomizations.push({
                groupName: group.name,
                optionName: opt.name,
                price: extraPrice,
              });
            }
          }
        }
      }

      const itemTotal = unitPrice * qty;
      calculatedSubtotal += itemTotal;

      validatedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        selectedCustomizations: validatedCustomizations,
        specialInstructions: (clientItem.specialInstructions || '').slice(0, 200),
        itemTotal,
      });
    }

    // 5% GST tax for cafe dining
    const tax = Math.round(calculatedSubtotal * 0.05);
    const total = calculatedSubtotal + tax;

    // Check if there is an active, unpaid order for this table to append items to previous bill
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    let existingOrder = null;

    if (req.body.existingToken) {
      existingOrder = await Order.findOne({
        trackingToken: req.body.existingToken,
        tableNumber: finalTableNumber,
        paymentStatus: { $ne: 'paid' },
        status: { $in: ['received', 'accepted', 'preparing', 'ready'] },
      });
    }

    if (!existingOrder) {
      existingOrder = await Order.findOne({
        tableNumber: finalTableNumber,
        paymentStatus: { $ne: 'paid' },
        status: { $in: ['received', 'accepted', 'preparing', 'ready'] },
        createdAt: { $gte: fourHoursAgo },
      }).sort({ createdAt: -1 });
    }

    if (existingOrder) {
      // Append the newly validated items to the previous bill
      for (const vItem of validatedItems) {
        existingOrder.items.push(vItem);
      }

      // Recalculate combined subtotal, tax, and total bill
      existingOrder.subtotal = existingOrder.items.reduce((acc, it) => acc + (it.itemTotal || 0), 0);
      existingOrder.tax = Math.round(existingOrder.subtotal * 0.05);
      existingOrder.total = existingOrder.subtotal + existingOrder.tax;

      if (customerNotes && customerNotes.trim()) {
        existingOrder.customerNotes = existingOrder.customerNotes
          ? `${existingOrder.customerNotes} | ${customerNotes.trim()}`
          : customerNotes.trim();
      }

      if (customerName && customerName.trim() && existingOrder.customerName === 'Guest') {
        existingOrder.customerName = customerName.trim();
      }

      const addedSummary = validatedItems.map((i) => `${i.quantity}x ${i.name}`).join(', ');

      // If previous order was already ready, reset status to preparing so barista sees new items to cook
      if (existingOrder.status === 'ready') {
        existingOrder.status = 'preparing';
      }

      existingOrder.statusHistory.push({
        status: existingOrder.status,
        timestamp: new Date(),
        note: `Added items to bill: ${addedSummary}`,
      });

      await existingOrder.save();

      // Real-time broadcast to kitchen and customer
      emitNewOrder(existingOrder);
      emitOrderStatusUpdate(existingOrder);

      return res.status(200).json({
        success: true,
        message: 'Items added to your table bill successfully',
        orderNumber: existingOrder.orderNumber,
        trackingToken: existingOrder.trackingToken,
        order: existingOrder,
        isAppended: true,
      });
    }

    const orderNumber = await generateOrderNumber();
    const trackingToken = crypto.randomBytes(16).toString('hex');

    const newOrder = await Order.create({
      orderNumber,
      tableNumber: finalTableNumber,
      trackingToken,
      customerName: (customerName || 'Guest').slice(0, 50),
      customerNotes: (customerNotes || '').slice(0, 300),
      items: validatedItems,
      subtotal: calculatedSubtotal,
      tax,
      total,
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          timestamp: new Date(),
          note: 'Order placed by customer via table QR code',
        },
      ],
      paymentStatus: 'pending',
      paymentMethod: 'pay_at_counter',
    });

    // Notify staff dashboard in real time via Socket.IO
    emitNewOrder(newOrder);

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      orderNumber: newOrder.orderNumber,
      trackingToken: newOrder.trackingToken,
      order: newOrder,
    });
  } catch (error) {
    console.error('[Create Order Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to place order. ' + error.message,
    });
  }
};

// Customer tracks an order by trackingToken (Unguessable and secure)
export const trackOrder = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Tracking token required' });
    }

    const order = await Order.findOne({ trackingToken: token });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Please check your tracking link or table receipt.',
      });
    }

    return res.json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin gets list of orders with filters
export const getAdminOrders = async (req, res) => {
  try {
    const { status, table, search, limit = 150, page = 1 } = req.query;

    const query = {};

    if (status && status !== 'all') {
      if (status === 'history') {
        query.status = { $in: ['completed', 'rejected'] };
      } else if (status === 'active') {
        query.status = { $nin: ['completed', 'rejected'] };
      } else if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    }

    if (table && table !== 'all') {
      query.tableNumber = table.trim().toUpperCase();
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { customerName: searchRegex },
        { 'items.name': searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    return res.json({
      success: true,
      totalCount,
      page: parseInt(page, 10),
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Staff updates order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const allowedStatuses = ['received', 'accepted', 'preparing', 'ready', 'completed', 'rejected'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status} by staff`,
    });

    if (status === 'completed' && order.paymentStatus === 'pending') {
      // mark as paid at counter when completed
      order.paymentStatus = 'paid';
    }

    await order.save();

    // Broadcast status change in real time
    emitOrderStatusUpdate(order);

    return res.json({
      success: true,
      message: `Order #${order.orderNumber} updated to ${status}`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Staff marks payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, markCompleted } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid') {
        order.paymentDetails = {
          ...order.paymentDetails,
          paidAt: new Date(),
          verifiedBy: 'staff_manual',
          transactionRef: req.body.transactionRef || order.paymentDetails?.transactionRef || `MANUAL-${Date.now()}`,
        };
      }
    }
    if (paymentMethod) {
      order.paymentMethod = paymentMethod === 'upi_qr' ? 'upi' : paymentMethod;
    }

    if (markCompleted && order.status !== 'completed' && order.status !== 'rejected') {
      order.status = 'completed';
      order.statusHistory.push({
        status: 'completed',
        timestamp: new Date(),
        note: `Payment settled via ${paymentMethod || 'counter'} and marked completed`,
      });
    }

    await order.save();
    emitOrderStatusUpdate(order);

    return res.json({
      success: true,
      message: 'Payment status updated',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Customer checks if a table has an active in-progress order (e.g. on QR re-scan)
export const getActiveTableOrder = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Table number is required' });
    }

    const normalized = tableNumber.trim().toUpperCase();
    // Look for active orders created in the last 3 hours that are not completed and not rejected
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const activeOrder = await Order.findOne({
      tableNumber: normalized,
      status: { $in: ['received', 'accepted', 'preparing', 'ready'] },
      createdAt: { $gte: threeHoursAgo },
    }).sort({ createdAt: -1 });

    if (!activeOrder) {
      // Check if there was an order rejected in the last 30 minutes for this table
      const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
      const recentRejected = await Order.findOne({
        tableNumber: normalized,
        status: 'rejected',
        createdAt: { $gte: thirtyMinsAgo },
      }).sort({ updatedAt: -1, createdAt: -1 });

      return res.json({
        success: true,
        hasActiveOrder: false,
        order: null,
        recentRejectedOrder: recentRejected
          ? {
              orderNumber: recentRejected.orderNumber,
              status: recentRejected.status,
              reason:
                recentRejected.statusHistory?.slice(-1)[0]?.note ||
                'Kitchen was unable to accept this order',
              tableNumber: recentRejected.tableNumber,
            }
          : null,
      });
    }

    return res.json({
      success: true,
      hasActiveOrder: true,
      order: {
        _id: activeOrder._id,
        orderNumber: activeOrder.orderNumber,
        tableNumber: activeOrder.tableNumber,
        trackingToken: activeOrder.trackingToken,
        status: activeOrder.status,
        total: activeOrder.total,
        createdAt: activeOrder.createdAt,
      },
      recentRejectedOrder: null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Fetch active or unpaid orders for a specific table (useful for Counter Bill Lookup)
export const getTableOrders = async (req, res) => {
  try {
    const { tableNumber } = req.params;
    if (!tableNumber) {
      return res.status(400).json({ success: false, message: 'Table number is required' });
    }

    const normalized = tableNumber.trim().toUpperCase();
    const orders = await Order.find({
      tableNumber: normalized,
      status: { $ne: 'rejected' },
    }).sort({ createdAt: -1 }).limit(10);

    return res.json({
      success: true,
      tableNumber: normalized,
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


