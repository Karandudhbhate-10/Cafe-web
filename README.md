# ☕ BREW & BEAN — 3D Animated QR Café Ordering Platform

A premium, artisanal full-stack café web application featuring an interactive 3D Three.js coffee cup experience, QR-based contactless table dining, real-time kitchen order streaming via WebSockets, and a comprehensive staff administration dashboard.

---

## 🌟 Key Features

### 1. Customer Experience
- **Interactive 3D Hero Scene**: Custom Three.js experience featuring an espresso ceramic cup, rising procedural steam particles, floating roasted coffee beans, and interactive cursor parallax.
- **QR Code Table Recognition**: Automatically validates tables from QR scans (`/menu?table=T04`). Prevents manual tampering and locks the table to the customer's cart.
- **Artisanal Menu & Live Customizations**:
  - Filter by category: Espresso & Coffee, Cold Coffee, Tea & Refreshers, Bakery, Sandwiches, Desserts.
  - Interactive customizer modal: Cup sizes, oat/almond milk, extra espresso shots, and special barista instructions.
  - Real-time subtotal, 5% Café GST, and total calculation in Indian Rupees (₹).
- **Guest Checkout & Unguessable Tracking**:
  - Guest customers place orders without registration.
  - Generates unique order numbers (`#BB101`, `#BB102`).
  - 5-stage live preparation timeline (*Order Received* ➔ *Accepted* ➔ *Preparing* ➔ *Ready to Serve* ➔ *Completed*).
  - Real-time WebSocket room updates with polling fallback.

### 2. Staff & Barista Operations Dashboard (`/admin`)
- **Protected Staff Authentication**: Secure JWT session management with bcrypt-hashed credentials.
- **Live Kitchen Kanban Board**: Visual columns for *New Orders*, *Accepted*, *In Preparation*, and *Ready to Serve* with elapsed wait timers.
- **Audio Chime Alerts**: Built-in Web Audio API synthesizer chime with instant visual toast alert and mute/unmute control.
- **Destructive Action Confirmations**: Confirmation modal before order rejection with canned kitchen reasons.
- **Menu Management**: Add, edit, price, and delete products; 1-click availability toggle (*In Stock* / *Sold Out*).
- **Table & QR Code Center**:
  - Add and manage dining tables with capacities.
  - High-res QR preview with target URL inspection.
  - Download individual QR codes as PNG.
  - Print whole-café QR stands sheet on standard A4 paper.
  - **Dynamic Public Base URL Setting**: Allows changing from `http://localhost:5173` to your production URL (e.g. `https://brewandbean.cafe`) with instant bulk QR regeneration. Never encode localhost in production!
- **Sales & Reports**: Realized revenue tracking (distinguishing paid vs. unpaid orders), popular item sales ranking, and 1-click CSV export.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Three.js, Lucide Icons, Canvas Confetti |
| **Backend** | Node.js, Express.js, Socket.IO, Mongoose, JWT, Bcrypt.js, QRCode, Zod |
| **Database** | MongoDB (Local MongoDB community or MongoDB Atlas Cloud) |
| **Styling** | Custom artisanal coffee palette: Espresso Brown (`#2B1D17`), Dark Roast (`#17120F`), Warm Cream (`#F7F0E5`), Caramel (`#C58B54`), Muted Sage (`#879078`) |

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher (v22+ recommended)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a free MongoDB Atlas connection string.

### 2. Install Dependencies
From the repository root:
```bash
npm run install:all
```

### 3. Environment Configuration
Create a `.env` file in the `server` directory (or use default configuration):
```bash
cp server/.env.example server/.env
```

Default variables:
```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/brewandbean
JWT_SECRET=brew_and_bean_super_secret_jwt_key_2026
CLIENT_URL=http://localhost:5173
QR_BASE_URL=http://localhost:5173
ADMIN_PASSWORD=admin123
```

### 4. Seed Initial Data
Populate demo tables (T01 through T08), categories, and rich menu items with high-resolution photography:
```bash
npm run seed
```

This creates:
- **Admin account**:
  - Username: `admin`
  - Password: `admin123`
- **8 Dining Tables** with generated QR codes (including Table 04 Patio)
- **6 Categories** and **19 Artisanal Menu Items** with customizations

### 5. Start Development Servers
Run both backend and frontend concurrently:
```bash
npm run dev
```

- **Customer Website**: [http://localhost:5173](http://localhost:5173)
- **Table 04 QR Dining Experience**: [http://localhost:5173/menu?table=T04](http://localhost:5173/menu?table=T04)
- **Staff Admin Dashboard**: [http://localhost:5173/admin](http://localhost:5173/admin)
- **Backend API**: [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🧪 Automated Testing Checklist

An automated test script is provided in `server/test-e2e.js`:
```bash
npm --prefix server run test:e2e
# or
node server/test-e2e.js
```

### Verification Criteria Passed:
1. `GET /api/health` ➔ Service online.
2. Staff login with JWT authentication ➔ Token issued.
3. Table 04 validated with generated high-resolution QR data URL.
4. Customer scans QR code for Table 04 ➔ Session locked.
5. Customer adds Artisan Cappuccino (Oat Milk, Extra Double Shot) and Butter Croissant.
6. Server enforces authentic prices and 5% GST tax calculation (tampered client prices rejected).
7. Order placed ➔ Live WebSocket event streamed to staff room.
8. Customer tracking screen receives live status updates.
9. Staff accepts, prepares, marks ready, and completes order.
10. Order persists in database history across browser reloads.
11. Unauthorized access to admin routes blocked with HTTP 401.

---

## 🖨️ Generating Production QR Codes

1. Log in to the staff dashboard at `/admin`.
2. Go to **Tables & QR Codes** (`/admin/tables`).
3. Under **Configured QR Code Public Destination Domain**, enter your live production domain (e.g. `https://your-cafe-domain.com`).
4. Click **Save & Bulk Regenerate QRs**.
5. Click **Print All QRs** to print ready-to-cut A4 table stand cards, or download individual high-res PNG files for custom vinyl table stickers.

---

## 🚢 Production Deployment

### Option A: Monolithic / Unified Deployment (Render, Railway, VPS, Heroku)
1. Build the frontend:
   ```bash
   npm run build
   ```
2. The Express server automatically serves the static bundle from `client/dist` when the directory exists.
3. Run `npm run start` to start the server.

### Option B: Decoupled Deployment
- **Frontend**: Deploy `client/` to Vercel, Netlify, or Cloudflare Pages.
- **Backend**: Deploy `server/` to Render, Railway, AWS ECS, or Fly.io.
- Set `VITE_API_URL` and `CLIENT_URL` to point to each other.

---

## ☕ Default Staff Credentials
- **Username**: `admin`
- **Password**: `admin123`
