# M·Shop — Online Fashion Store MVP

A full-stack online clothing shopping platform built with React, Node.js/Express, and SQLite.

## Tech Stack
- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend:** Node.js, Express
- **Database:** SQLite via better-sqlite3
- **Auth:** JWT (7-day tokens)
- **Payments:** Stripe (test mode)
- **Images:** Unsplash placeholder images (local upload support via Multer)

## Project Structure
```
/
├── client/               React frontend (Vite)
│   └── src/
│       ├── components/   Navbar, Footer, ProductCard, etc.
│       ├── context/      AuthContext, CartContext
│       ├── lib/          Axios API client
│       └── pages/        All page components
│           └── admin/    Admin dashboard pages
├── server/               Express backend
│   ├── db/               SQLite setup + seed script
│   ├── middleware/        JWT auth middleware
│   └── routes/           auth, products, cart, orders, admin, payments
└── uploads/              Product image uploads
```

## Setup & Running

### Prerequisites
- Node.js 18+
- npm

### 1. Install dependencies
```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### 2. Configure environment
The server `.env` file is pre-configured for development:
```
PORT=5000
JWT_SECRET=eshopping_jwt_secret_mvp_2024
STRIPE_SECRET_KEY=sk_test_placeholder_replace_with_real_key
CLIENT_URL=http://localhost:5174
```

For real Stripe payments, replace `STRIPE_SECRET_KEY` with your test key from [stripe.com/dashboard](https://dashboard.stripe.com).

### 3. Seed the database
```bash
cd server && npm run seed
```

This creates:
- **18 sample products** across Women, Men, and Kids categories
- **Admin account:** `admin@eshop.com` / `admin123`
- **Customer account:** `jane@example.com` / `customer123`

### 4. Start the servers

From the project root, run both backend and frontend with a single command:
```bash
npm install        # installs concurrently at the root (one-time)
npm run dev        # starts backend (:5000) and frontend (:5174) together
```

Or run them in separate terminals if you prefer:
```bash
# Terminal 1 — Backend (port 5000)
npm run server

# Terminal 2 — Frontend (port 5174)
npm run client
```

Open [http://localhost:5174](http://localhost:5174)

## Features

### Customer
- Browse products with category, size, and price filters
- Full-text product search
- Product detail page with image gallery and size/color selection
- Shopping cart (guest via localStorage, logged-in via DB)
- User registration and login
- Checkout with shipping address + simulated card payment
- Order history and profile management

### Admin (login as admin@eshop.com)
- Dashboard with key stats (revenue, orders, products, customers)
- Add / edit / delete products
- View all orders, filter by status
- Update order status (pending → processing → shipped → delivered)

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/register | — | Register new user |
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Get current user |
| PUT | /api/auth/profile | JWT | Update profile |
| GET | /api/products | — | List products (filters/search) |
| GET | /api/products/:id | — | Product detail |
| GET | /api/cart | JWT | Get cart |
| POST | /api/cart | JWT | Add to cart |
| PUT | /api/cart/:id | JWT | Update quantity |
| DELETE | /api/cart/:id | JWT | Remove item |
| POST | /api/orders | JWT | Create order |
| GET | /api/orders | JWT | User's orders |
| GET | /api/admin/stats | Admin | Dashboard stats |
| GET | /api/admin/products | Admin | All products |
| POST | /api/admin/products | Admin | Create product |
| PUT | /api/admin/products/:id | Admin | Update product |
| DELETE | /api/admin/products/:id | Admin | Delete product |
| GET | /api/admin/orders | Admin | All orders |
| PUT | /api/admin/orders/:id | Admin | Update order status |
| POST | /api/payments/create-intent | JWT | Create Stripe payment intent |

## Notes
- Payments run in Stripe test mode. Use card `4242 4242 4242 4242`, any future expiry, any CVC.
- Product images use Unsplash URLs. The `/uploads` folder supports local image uploads via the admin panel.
- SQLite database is stored at `server/db/shop.db`. Re-run `npm run seed` to reset.
