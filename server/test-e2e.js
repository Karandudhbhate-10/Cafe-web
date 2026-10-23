import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5001/api';
const SOCKET_URL = 'http://localhost:5001';

const runTests = async () => {
  console.log('🚀 [E2E TEST SUITE] Starting BREW & BEAN validation...');
  let failed = 0;
  let passed = 0;

  const assert = (condition, name) => {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthData.status === 'online', '1. Backend health check online');

    // 2. Admin logs in
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'adminpassword123' }),
    });
    // In seed it was admin / admin123, let's try admin123
    let adminToken = '';
    if (loginRes.ok) {
      const loginData = await loginRes.json();
      adminToken = loginData.token;
    } else {
      const loginRes2 = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' }),
      });
      const loginData2 = await loginRes2.json();
      adminToken = loginData2.token;
    }
    assert(Boolean(adminToken), '2. Admin authentication succeeds with JWT');

    // 3. Admin retrieves tables and verifies Table 04 has QR data
    const tablesRes = await fetch(`${API_BASE}/tables`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const tablesData = await tablesRes.json();
    const table04 = tablesData.tables.find((t) => t.tableNumber === 'T04');
    assert(Boolean(table04 && table04.qrCodeDataUrl.startsWith('data:image/png')), '3. Table 04 has valid base64 QR code data URL');

    // 4. Customer scans QR code & validates Table 04
    const validateRes = await fetch(`${API_BASE}/tables/validate/T04`);
    const validateData = await validateRes.json();
    assert(validateData.valid === true && validateData.table.tableNumber === 'T04', '4. Customer validates Table 04 from QR scan URL');

    // 5. Customer fetches menu and finds Cappuccino and Croissant
    const menuRes = await fetch(`${API_BASE}/menu`);
    const menuData = await menuRes.json();
    const cappuccino = menuData.items.find((i) => i.name.toLowerCase().includes('cappuccino'));
    const croissant = menuData.items.find((i) => i.name.toLowerCase().includes('croissant'));
    assert(Boolean(cappuccino && croissant), '5. Customer locates Cappuccino and Butter Croissant on menu');

    // 6. Connect WebSocket as Staff and listen for live order emission
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    let socketReceivedOrder = null;

    await new Promise((resolve) => {
      socket.on('connect', () => {
        socket.emit('join_staff');
        resolve();
      });
    });

    socket.on('new_order', (order) => {
      socketReceivedOrder = order;
    });

    // 7. Customer places order for Table 04
    const orderPayload = {
      tableNumber: 'T04',
      customerName: 'Karan Test',
      customerNotes: 'Please serve cappuccino extra hot',
      items: [
        {
          menuItemId: cappuccino._id,
          name: cappuccino.name,
          quantity: 1,
          selectedCustomizations: [
            { groupName: 'Size', optionName: 'Regular (240ml)', price: 0 },
            { groupName: 'Milk Choice', optionName: 'Oat Milk (Oatly Barista)', price: 35 },
          ],
          specialInstructions: 'Extra hot micro-foam',
        },
        {
          menuItemId: croissant._id,
          name: croissant.name,
          quantity: 2,
          selectedCustomizations: [
            { groupName: 'Preparation', optionName: 'Warmed Up / Crisp Toasting', price: 0 },
          ],
          specialInstructions: 'Crispy warm',
        },
      ],
    };

    const orderRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    });
    const orderData = await orderRes.json();
    assert(orderData.success === true && Boolean(orderData.orderNumber), `7. Customer order placed: #${orderData.orderNumber} for Table 04`);

    // Verify subtotal on server: (140 + 35) + (120 * 2) = 175 + 240 = 415. Tax 5%: 21. Total: 436
    assert(orderData.order.subtotal === 415, `   -> Subtotal server calculated correctly: ₹${orderData.order.subtotal}`);
    assert(orderData.order.total === 436, `   -> Total with 5% tax calculated correctly: ₹${orderData.order.total}`);

    // Wait 500ms for WebSocket event
    await new Promise((r) => setTimeout(r, 600));
    assert(socketReceivedOrder && socketReceivedOrder.orderNumber === orderData.orderNumber, '8. Staff dashboard received live Socket.IO notification');

    // 8. Customer tracks order by trackingToken
    const trackRes = await fetch(`${API_BASE}/orders/track/${orderData.trackingToken}`);
    const trackData = await trackRes.json();
    assert(trackData.success === true && trackData.order.status === 'received', '9. Customer tracks unguessable trackingToken with "received" status');

    // 9. Staff accepts order
    const acceptRes = await fetch(`${API_BASE}/orders/admin/${orderData.order._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'accepted', note: 'Barista queued order' }),
    });
    const acceptData = await acceptRes.json();
    assert(acceptData.order.status === 'accepted', '10. Staff accepts order on dashboard');

    // 10. Staff starts preparing
    const prepRes = await fetch(`${API_BASE}/orders/admin/${orderData.order._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'preparing' }),
    });
    const prepData = await prepRes.json();
    assert(prepData.order.status === 'preparing', '11. Staff marks order as preparing in kitchen');

    // 11. Customer tracking sees "preparing" status
    const trackRes2 = await fetch(`${API_BASE}/orders/track/${orderData.trackingToken}`);
    const trackData2 = await trackRes2.json();
    assert(trackData2.order.status === 'preparing', '12. Customer sees real-time status updated to "preparing"');

    // 12. Staff marks ready to serve, then completed
    await fetch(`${API_BASE}/orders/admin/${orderData.order._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ready' }),
    });

    const completeRes = await fetch(`${API_BASE}/orders/admin/${orderData.order._id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    const completeData = await completeRes.json();
    assert(completeData.order.status === 'completed' && completeData.order.paymentStatus === 'paid', '13. Staff marks order completed & automatically paid');

    // 13. Order persists in database history after page reload
    const historyRes = await fetch(`${API_BASE}/orders/admin?search=${orderData.orderNumber}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const historyData = await historyRes.json();
    const persistedOrder = historyData.orders.find((o) => o.orderNumber === orderData.orderNumber);
    assert(Boolean(persistedOrder && persistedOrder.status === 'completed'), '14. Order is persisted in DB history and searchable by order #');

    // 14. Unauthorized user cannot access protected admin routes
    const unauthorizedRes = await fetch(`${API_BASE}/orders/admin`);
    assert(unauthorizedRes.status === 401, '15. Unauthorized request to admin orders is rejected with 401');

    // 15. Invalid table number is rejected
    const invalidTableRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: 'INVALID_TABLE_999',
        items: [{ menuItemId: cappuccino._id, quantity: 1 }],
      }),
    });
    assert(invalidTableRes.status === 400, '16. Invalid table identifier is strictly rejected by server');

    // 16. Tampered product price in payload is ignored (server recalculates authentic DB price)
    const tamperedPriceRes = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tableNumber: 'T04',
        items: [
          {
            menuItemId: cappuccino._id,
            price: 1, // Tampered client price ₹1
            quantity: 1,
          },
        ],
      }),
    });
    const tamperedData = await tamperedPriceRes.json();
    // Server must calculate real base price (140) + tax, NOT 1
    assert(tamperedData.order.subtotal === cappuccino.price, `17. Tampered client price rejected; server enforced real price ₹${cappuccino.price}`);

    socket.disconnect();

    console.log(`\n========================================`);
    console.log(`Results: ${passed} passed, ${failed} failed.`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
};

runTests();
