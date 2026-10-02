# My Purchase Tracker

A modern, fast, and responsive web application designed to help individuals and businesses record daily purchases, track expenses, calculate Goods & Services Tax (GST) automatically, inspect bill receipts, and gain actionable spending insights with interactive charts and a smart natural language search bar.

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Required Software & Installations](#2-required-software--installations)
3. [Commands to Create the Project](#3-commands-to-create-the-project)
4. [Database Setup & Schema](#4-database-setup--schema)
5. [Backend & REST APIs](#5-backend--rest-apis)
6. [Frontend Architecture](#6-frontend-architecture)
7. [GST Calculation Engine](#7-gst-calculation-engine)
8. [Smart Search & NLP Query Engine](#8-smart-search--nlp-query-engine)
9. [Dashboard & Reports](#9-dashboard--reports)
10. [Testing the Application](#10-testing-the-application)
11. [How to Run the Project Locally](#11-how-to-run-the-project-locally)

---

## 1. Project Structure

```
my-purchase-tracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js            # SQLite database connection, table schemas & seed data
│   │   ├── controllers/
│   │   │   ├── purchaseController.js  # CRUD operations, GST validation, category endpoints
│   │   │   ├── reportController.js    # Aggregations, monthly/yearly stats, CSV export
│   │   │   └── searchController.js    # Multi-field keyword and Natural Language query engine
│   │   ├── middleware/
│   │   │   └── upload.js              # Multer configuration for invoice/bill uploads
│   │   ├── routes/
│   │   │   ├── purchaseRoutes.js      # Express routes for /api/purchases
│   │   │   ├── reportRoutes.js        # Express routes for /api/reports
│   │   │   └── searchRoutes.js        # Express routes for /api/search
│   │   └── server.js                  # Main server entry point
│   ├── uploads/                       # Storage directory for uploaded bills & invoices
│   └── package.json                   # Backend dependencies
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx             # Top branding and navigation tabs
│   │   │   ├── SmartSearchBar.jsx     # Prominent top search bar with NLP and live suggestions
│   │   │   ├── StatCard.jsx           # Reusable metric summary card
│   │   │   ├── SpendingChart.jsx      # Chart.js monthly trend & category donut charts
│   │   │   ├── PurchaseModal.jsx      # Add & Edit purchase modal with live GST calculations
│   │   │   ├── PurchaseDetails.jsx    # Full purchase & invoice preview modal
│   │   │   ├── PurchaseList.jsx       # Table and Grid card layout with filters & sorting
│   │   │   └── ConfirmDialog.jsx      # Delete confirmation dialog
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Overview KPI cards, charts, and recent purchases
│   │   │   ├── PurchasesPage.jsx      # Complete purchase history, search & date range filters
│   │   │   └── ReportsPage.jsx        # GST slabs breakdown, yearly spending, top vendors
│   │   ├── services/
│   │   │   └── api.js                 # API service connecting to backend endpoints
│   │   ├── utils/
│   │   │   ├── formatters.js          # Indian Rupee (₹) & date formatters
│   │   │   └── gstCalculator.js       # Real-time GST calculation logic
│   │   ├── App.jsx                    # Root application component
│   │   ├── main.jsx                   # React DOM entry point
│   │   └── index.css                  # Tailwind CSS styling
│   ├── index.html                     # HTML page template
│   ├── tailwind.config.js             # Tailwind CSS theme configuration
│   ├── postcss.config.js              # PostCSS plugins
│   ├── vite.config.js                 # Vite bundler & reverse proxy configuration
│   └── package.json                   # Frontend dependencies
└── README.md
```

---

## 2. Required Software & Installations

Before running the application, make sure you have:
1. **Node.js**: Version 18.x or newer (Node.js v20+ / v25+ recommended).
2. **npm**: Version 9.x or newer (included with Node.js).
3. **Web Browser**: Chrome, Edge, Firefox, or Safari.

No separate database installation (like PostgreSQL or MySQL) is required because the project uses zero-config **SQLite**, which stores everything in a local file (`backend/purchases.db`).

---

## 3. Commands to Create the Project

To install dependencies for both the backend and frontend:

### Backend:
```bash
cd backend
npm install
```

### Frontend:
```bash
cd ../frontend
npm install
```

---

## 4. Database Setup & Schema

The database automatically initializes upon launching the backend. It creates four tables:

1. **`purchases`**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `product_name`: TEXT NOT NULL
   - `category`: TEXT NOT NULL
   - `quantity`: INTEGER NOT NULL DEFAULT 1
   - `base_price`: REAL NOT NULL (Price in INR)
   - `gst_percentage`: REAL NOT NULL (e.g., 0, 5, 12, 18, 28)
   - `gst_amount`: REAL NOT NULL
   - `total_amount`: REAL NOT NULL
   - `purchase_date`: TEXT NOT NULL (YYYY-MM-DD)
   - `vendor_name`: TEXT NOT NULL
   - `invoice_number`: TEXT
   - `notes`: TEXT
   - `invoice_url`: TEXT (Path to uploaded receipt)
   - `created_at`: DATETIME DEFAULT CURRENT_TIMESTAMP

2. **`categories`**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `name`: TEXT UNIQUE NOT NULL
   - `color`: TEXT
   - `icon`: TEXT

3. **`vendors`**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `name`: TEXT UNIQUE NOT NULL
   - `category`: TEXT
   - `contact`: TEXT

4. **`invoices`**:
   - `id`: INTEGER PRIMARY KEY AUTOINCREMENT
   - `purchase_id`: INTEGER (FOREIGN KEY)
   - `file_name`: TEXT
   - `file_path`: TEXT
   - `file_size`: INTEGER
   - `mime_type`: TEXT

*Note: Initial realistic sample data (MacBook, 4K monitor, pantry groceries, ergonomics chair, fuel, etc.) is seeded automatically on first run.*

---

## 5. Backend & REST APIs

The backend runs on port `5000` with the following endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/purchases` | List purchases with sorting (`newest`, `oldest`, `price_high`, `price_low`), category and date filtering |
| `GET` | `/api/purchases/:id` | Get details for a single purchase |
| `POST` | `/api/purchases` | Create purchase with auto-computed GST and optional bill upload |
| `PUT` | `/api/purchases/:id` | Update an existing purchase |
| `DELETE` | `/api/purchases/:id` | Delete a purchase and remove attached file |
| `GET` | `/api/purchases/categories` | Retrieve all purchase categories |
| `GET` | `/api/reports/summary` | Dashboard KPI metrics and monthly trends |
| `GET` | `/api/reports/analytics` | Yearly reports, GST slabs breakdown, top vendors |
| `GET` | `/api/reports/export-csv` | Download complete purchase data as a CSV file |
| `GET` | `/api/search?q={query}` | Smart search with keyword and NLP parser |
| `GET` | `/api/health` | Health check endpoint |

---

## 6. Frontend Architecture

Built with modern **React 18 + Vite + Tailwind CSS + Lucide Icons + Chart.js**:
- **Indian Rupee Formatting**: Implements `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` to display amounts in standard Lakhs format (e.g., `₹1,25,450`).
- **Interactive Views**: Switch between Table View and Grid Card View with one click.
- **Responsive Layout**: Designed for seamless viewing across smartphones, tablets, and wide monitors.

---

## 7. GST Calculation Engine

The application automatically calculates taxes in real-time as the user types:

$$\text{Total Base Price} = \text{Base Price} \times \text{Quantity}$$
$$\text{GST Amount} = \frac{\text{Total Base Price} \times \text{GST \%}}{100}$$
$$\text{Final Price} = \text{Total Base Price} + \text{GST Amount}$$

Pre-configured Indian GST slab buttons (**0%**, **5%**, **12%**, **18%**, **28%**) plus a custom percentage field allow rapid selection without manual calculations.

---

## 8. Smart Search & NLP Query Engine

The top search bar provides instant debounced search across:
- Product names (e.g. `Laptop`)
- Vendors/Shops (e.g. `Amazon`, `Croma`)
- Categories (e.g. `Electronics`, `Groceries`)
- Dates & Months (e.g. `September`, `2026-09`)
- Invoice numbers and notes

### Natural Language Queries:
The engine parses conversational queries and displays smart insights:
- `"how much did I spend on electronics"` $\rightarrow$ Computes total spent, item count, and GST paid on Electronics.
- `"how much GST did I pay"` $\rightarrow$ Aggregates total GST across all purchases.
- `"purchases from Amazon"` $\rightarrow$ Lists all purchases made from Amazon with total spend summary.
- `"purchases in September"` $\rightarrow$ Automatically isolates September purchases.

---

## 9. Dashboard & Reports

1. **Dashboard**:
   - Total Lifetime Spent (`₹`)
   - Total GST Paid (`₹`)
   - Current Month Spending & Purchase Count
   - Total Number of Purchases & Products
   - Spending & GST Monthly Trend Bar Chart
   - Category Breakdown Donut Chart
   - Recent Purchases Table with one-click inspection
2. **Reports & Analytics**:
   - GST Paid by Tax Slab (0%, 5%, 12%, 18%, 28%)
   - Highest-Value Purchases leaderboard
   - Top Shops & Vendors ranking
   - Historical Annual/Yearly breakdown
   - One-click CSV Export for accounting & tax returns

---

## 10. Testing the Application

### Automated API Health & Query Test:
In PowerShell / Terminal:
```powershell
# 1. Check API Health
Invoke-RestMethod -Uri "http://localhost:5000/api/health"

# 2. Check Dashboard Summary
Invoke-RestMethod -Uri "http://localhost:5000/api/reports/summary"

# 3. Test Smart Search
Invoke-RestMethod -Uri "http://localhost:5000/api/search?q=how%20much%20did%20I%20spend%20on%20electronics"
```

---

## 11. How to Run the Project Locally

### Step 1: Start the Backend Server
```bash
cd backend
node src/server.js
```
The backend API server will start at: `http://localhost:5000`.

### Step 2: Start the Frontend Application (in a separate terminal)
```bash
cd frontend
npm run dev
```
The frontend application will start at: `http://localhost:3000`.

Open your browser and navigate to:
**`http://localhost:3000`**
