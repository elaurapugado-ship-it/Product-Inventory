# 📦 Product Inventory Management System

A full-stack web application for managing product inventory, built with **PHP REST API**, **MySQL**, **Bootstrap 5**, and **Vanilla JavaScript**.

---

## ✅ Features Applied

| Feature | Status | Where |
|---|---|---|
| REST API (1 API per table) | ✅ Applied | `backend/api/*.php` |
| JSON Response (all endpoints) | ✅ Applied | All API files |
| Server-side Validation | ✅ Applied | All API files |
| Client-side Validation | ✅ Applied | `frontend/js/app.js` |
| Image Upload & Display | ✅ Applied | `create_product.php`, `app.js` |
| Price as text input (no spinner) | ✅ Applied | `frontend/index.html` |
| Stock as text input (no spinner) | ✅ Applied | `frontend/index.html` |
| Category dropdown (all categories) | ✅ Applied | `frontend/index.html` |
| Table View & Card View | ✅ Applied | `frontend/index.html`, `app.js` |
| Search by name or category | ✅ Applied | `get_products.php`, `app.js` |
| Dashboard stats | ✅ Applied | `app.js` |
| Stock badges (Low/Out/In stock) | ✅ Applied | `app.js` |
| Delete confirmation modal | ✅ Applied | `frontend/index.html` |

---

## 🗄️ Database & REST API Design

This system has **1 table → 1 REST API** (one resource = one set of endpoints).

### Table: `products`

```sql
CREATE TABLE products (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100)   NOT NULL,
    category     VARCHAR(50)    NOT NULL,
    price        DECIMAL(10,2)  NOT NULL,
    stock        INT            NOT NULL DEFAULT 0,
    description  TEXT,
    image        VARCHAR(255),
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### REST API Endpoints for `products` table

| Method | Endpoint | Action | Success Code |
|--------|----------|--------|-------------|
| `GET` | `/api/get_products.php` | Get all products | 200 |
| `GET` | `/api/get_products.php?search=keyword` | Search products | 200 |
| `GET` | `/api/get_products.php?category=Electronics` | Filter by category | 200 |
| `GET` | `/api/get_single_product.php?id=1` | Get one product | 200 |
| `POST` | `/api/create_product.php` | Add new product | 201 |
| `POST` | `/api/update_product.php` | Update product | 200 |
| `DELETE` | `/api/delete_product.php` | Delete product | 200 |

> **Why 1 API set per table?** REST design principle — each table (resource) maps to its own set of CRUD endpoints. Since this system only has the `products` table, all 5 endpoints belong to it. If a `categories` or `users` table is added, they each get their own separate set of endpoints.

---

## 📋 JSON Response Format

**Every single API endpoint returns JSON** — success or error, always the same structure.

### ✅ GET All Products — `200 OK`
```json
{
  "success": true,
  "count": 2,
  "products": [
    {
      "id": 1,
      "product_name": "Wireless Headphones",
      "category": "Electronics",
      "price": 1299.00,
      "stock": 25,
      "description": "High-quality wireless headphones...",
      "image": "product_abc123.jpg",
      "image_url": "http://localhost/product-inventory-system/backend/uploads/product_abc123.jpg",
      "created_at": "2026-05-24 10:00:00"
    }
  ]
}
```

### ✅ GET Single Product — `200 OK`
```json
{
  "success": true,
  "product": {
    "id": 1,
    "product_name": "Wireless Headphones",
    "category": "Electronics",
    "price": 1299.00,
    "stock": 25,
    "description": "High-quality wireless headphones...",
    "image": "product_abc123.jpg",
    "image_url": "http://localhost/product-inventory-system/backend/uploads/product_abc123.jpg",
    "created_at": "2026-05-24 10:00:00"
  }
}
```

### ✅ POST Create Product — `201 Created`
```json
{
  "success": true,
  "message": "Product added successfully!",
  "data": {
    "id": 6,
    "product_name": "USB Hub",
    "category": "Electronics",
    "price": 799.00,
    "stock": 30,
    "description": "7-port USB 3.0 hub",
    "image": "product_xyz789.jpg"
  }
}
```

### ✅ POST Update Product — `200 OK`
```json
{
  "success": true,
  "message": "Product updated successfully!",
  "data": {
    "id": 6,
    "product_name": "USB Hub Pro",
    "category": "Electronics",
    "price": 899.00,
    "stock": 25,
    "description": "Updated description"
  }
}
```

### ✅ DELETE Product — `200 OK`
```json
{
  "success": true,
  "message": "Product deleted successfully!",
  "data": {
    "deleted_id": 6
  }
}
```

### ❌ Validation Error — `422 Unprocessable Entity`
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    "Product name is required.",
    "Price must be a valid positive number."
  ]
}
```

### ❌ Not Found — `404 Not Found`
```json
{
  "success": false,
  "message": "Product with ID 99 not found."
}
```

### ❌ Wrong HTTP Method — `405 Method Not Allowed`
```json
{
  "success": false,
  "message": "Method Not Allowed. Use GET.",
  "allowed_methods": ["GET"]
}
```

### ❌ Server Error — `500 Internal Server Error`
```json
{
  "success": false,
  "message": "Database error: ..."
}
```

---

## 🛡️ Validation — Two Layers

### Layer 1: Client-side (JavaScript — `app.js`)
Runs instantly when the user clicks Save/Add, before anything is sent to the server.

| Field | Rules |
|-------|-------|
| Product Name | Required, max 100 characters |
| Category | Must select one from dropdown |
| Price | Required, must be a valid positive number (e.g. `1299` or `1299.50`) |
| Stock | Required, must be a whole number with no decimals (e.g. `50`) |

If validation fails → a **red alert box appears inside the modal** listing all errors. No browser popups, no page reload.

### Layer 2: Server-side (PHP — all API files)
Runs on the backend even if someone calls the API directly (bypassing the frontend).

| Field | Rules |
|-------|-------|
| Product Name | Required, max 100 chars |
| Category | Required, max 50 chars |
| Price | Required, must be numeric and ≥ 0 |
| Stock | Required, must be whole number ≥ 0 |
| Image | Optional — if uploaded: must be JPG/PNG/WEBP, max 5MB |
| ID (update/delete) | Required, must be a valid numeric ID |

Returns `HTTP 422` with a JSON `errors` array on failure.

---

## 📁 Project Structure

```
product-inventory-system/
│
├── backend/
│   ├── config/
│   │   └── database.php              ← DB connection (PDO)
│   │
│   ├── api/                          ← REST API for products table
│   │   ├── get_products.php          ← GET    - fetch all / search
│   │   ├── get_single_product.php    ← GET    - fetch one by ID
│   │   ├── create_product.php        ← POST   - add new product
│   │   ├── update_product.php        ← POST   - update product
│   │   └── delete_product.php        ← DELETE - remove product
│   │
│   ├── uploads/                      ← product images saved here
│   └── database.sql                  ← DB setup + sample data
│
├── frontend/
│   ├── index.html                    ← main dashboard (table + card view)
│   ├── css/
│   │   └── style.css                 ← custom styles
│   └── js/
│       └── app.js                    ← all JS: CRUD, search, validation, UI
│
└── README.md
```

---

## ⚙️ Setup Instructions

### Requirements
- XAMPP (Apache + MySQL)
- Browser (Chrome, Firefox, Edge)

### Step 1 — Copy project to XAMPP
```
C:/xampp/htdocs/product-inventory-system/
```

### Step 2 — Start XAMPP
Open XAMPP Control Panel → Start **Apache** and **MySQL**

### Step 3 — Import database
1. Go to `http://localhost/phpmyadmin`
2. Click **New** → create database named `product_inventory_db`
3. Click **Import** → choose `backend/database.sql` → click **Go**

### Step 4 — Open the app
```
http://localhost/product-inventory-system/frontend/index.html
```

---

## 🔒 Security

- **PDO Prepared Statements** — all queries use `:param` binding, no SQL injection possible
- **MIME type validation** — image uploads checked by actual file content, not just extension
- **HTML escaping** — all output escaped with `escapeHtml()` to prevent XSS
- **HTTP method enforcement** — each endpoint only accepts its correct method, returns `405` otherwise

---

## 🛠️ Technologies

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Styling | Bootstrap 5.3, Bootstrap Icons |
| Backend | PHP 8 with PDO |
| Database | MySQL |
| Server | XAMPP (Apache + MySQL) |

---

*Product Inventory Management System — Web Development Final Project*