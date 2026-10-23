import { Order } from '../models/Order.js';

export const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Today's orders
    const todayOrders = await Order.find({
      createdAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const totalOrdersToday = todayOrders.length;
    const newOrders = todayOrders.filter((o) => o.status === 'received').length;
    const acceptedOrders = todayOrders.filter((o) => o.status === 'accepted').length;
    const preparingOrders = todayOrders.filter((o) => o.status === 'preparing').length;
    const readyOrders = todayOrders.filter((o) => o.status === 'ready').length;
    const completedOrders = todayOrders.filter((o) => o.status === 'completed').length;
    const rejectedOrders = todayOrders.filter((o) => o.status === 'rejected').length;

    // Realized Revenue: only count orders that are explicitly marked 'paid' or 'completed'
    const realizedOrders = todayOrders.filter((o) => o.paymentStatus === 'paid' || o.status === 'completed');
    const todaySales = realizedOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Unpaid / pending revenue (strictly separated)
    const pendingRevenue = todayOrders
      .filter((o) => o.paymentStatus === 'pending' && o.status !== 'rejected')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate Average Preparation Time (in minutes) for orders completed today
    const ordersWithPrepTime = todayOrders.filter(
      (o) => typeof o.preparationTimeMinutes === 'number' && o.preparationTimeMinutes > 0
    );
    const avgPrepTime =
      ordersWithPrepTime.length > 0
        ? Math.round(
            ordersWithPrepTime.reduce((sum, o) => sum + o.preparationTimeMinutes, 0) /
              ordersWithPrepTime.length
          )
        : 8; // fallback realistic 8 mins default if not enough data yet

    // Popular items aggregation
    const itemMap = {};
    for (const order of todayOrders) {
      if (order.status !== 'rejected') {
        for (const item of order.items) {
          if (!itemMap[item.name]) {
            itemMap[item.name] = { name: item.name, count: 0, revenue: 0 };
          }
          itemMap[item.name].count += item.quantity;
          itemMap[item.name].revenue += item.itemTotal;
        }
      }
    }

    const popularItems = Object.values(itemMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Active live orders (received, accepted, preparing, ready)
    const activeOrders = await Order.find({
      status: { $in: ['received', 'accepted', 'preparing', 'ready'] },
    }).sort({ createdAt: 1 });

    return res.json({
      success: true,
      stats: {
        totalOrdersToday,
        newOrders,
        acceptedOrders,
        preparingOrders,
        readyOrders,
        completedOrders,
        rejectedOrders,
        todaySales,
        pendingRevenue,
        avgPrepTime,
        popularItems,
      },
      activeOrders,
    });
  } catch (error) {
    console.error('[Stats Error]', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Export orders as CSV
export const exportOrdersCsv = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(500);

    const headers = [
      'Order Number',
      'Table',
      'Customer',
      'Items Count',
      'Items Summary',
      'Subtotal (INR)',
      'Tax (INR)',
      'Total (INR)',
      'Status',
      'Payment Status',
      'Created At',
    ];

    const rows = orders.map((o) => {
      const itemsSummary = o.items.map((i) => `${i.quantity}x ${i.name}`).join('; ');
      return [
        o.orderNumber,
        o.tableNumber,
        `"${(o.customerName || 'Guest').replace(/"/g, '""')}"`,
        o.items.length,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        o.subtotal,
        o.tax,
        o.total,
        o.status,
        o.paymentStatus,
        `"${new Date(o.createdAt).toLocaleString('en-IN')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=brew_and_bean_orders.csv');
    return res.status(200).send(csvContent);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
