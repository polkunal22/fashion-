-- ============================================================================
-- FORMA — ATELIER OF EVERYDAY
-- Relational SQL Schema (Compatible with SQLite3, PostgreSQL, and MySQL)
-- Architected & Designed by Kunal Pol (https://github.com/polkunal22)
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Products Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sku             VARCHAR(32) NOT NULL UNIQUE,
    name            VARCHAR(140) NOT NULL UNIQUE,
    gender          VARCHAR(16) NOT NULL CHECK (gender IN ('women', 'men')),
    category        VARCHAR(120) NOT NULL,
    price_inr       INTEGER NOT NULL CHECK (price_inr >= 0),
    badge           VARCHAR(64) DEFAULT 'FORMA EDIT',
    tags            VARCHAR(120) DEFAULT 'all',
    image_url       TEXT NOT NULL,
    size_range      VARCHAR(32) DEFAULT 'XS — XL',
    stock_count     INTEGER NOT NULL DEFAULT 25,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_price  ON products(price_inr);

-- 2. Customer Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_ref       VARCHAR(32) NOT NULL UNIQUE,
    customer_email  VARCHAR(160) NOT NULL,
    customer_phone  VARCHAR(40) NOT NULL,
    first_name      VARCHAR(80) NOT NULL,
    last_name       VARCHAR(80) NOT NULL,
    address_line1   TEXT NOT NULL,
    address_line2   TEXT DEFAULT '',
    city            VARCHAR(80) NOT NULL,
    state           VARCHAR(80) NOT NULL,
    postal_code     VARCHAR(16) NOT NULL,
    country         VARCHAR(64) NOT NULL DEFAULT 'India',
    payment_method  VARCHAR(24) NOT NULL DEFAULT 'upi',
    promo_code      VARCHAR(32) DEFAULT '',
    subtotal_inr    INTEGER NOT NULL CHECK (subtotal_inr >= 0),
    discount_inr    INTEGER NOT NULL DEFAULT 0,
    shipping_inr    INTEGER NOT NULL DEFAULT 0,
    total_inr       INTEGER NOT NULL CHECK (total_inr >= 0),
    order_status    VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED · ATELIER PREPARING',
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_ref   ON orders(order_ref);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);

-- 3. Order Line Items Table
CREATE TABLE IF NOT EXISTS order_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id        INTEGER NOT NULL,
    product_name    VARCHAR(140) NOT NULL,
    selected_size   VARCHAR(16) DEFAULT 'M',
    selected_shade  VARCHAR(64) DEFAULT 'Obsidian Charcoal',
    unit_price_inr  INTEGER NOT NULL CHECK (unit_price_inr >= 0),
    quantity        INTEGER NOT NULL CHECK (quantity > 0),
    line_total_inr  INTEGER NOT NULL CHECK (line_total_inr >= 0),
    image_url       TEXT DEFAULT '',
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- 4. Newsletter Studio Subscribers Table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    email               VARCHAR(160) NOT NULL UNIQUE,
    edition_preference  VARCHAR(64) NOT NULL DEFAULT 'All Dispatches',
    privilege_code      VARCHAR(32) NOT NULL DEFAULT 'ATELIER10',
    subscribed_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Saved Wishlist Items Table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    client_token    VARCHAR(64) NOT NULL,
    product_name    VARCHAR(140) NOT NULL,
    price_inr       INTEGER NOT NULL,
    image_url       TEXT NOT NULL,
    category        VARCHAR(120) DEFAULT 'ATELIER EDIT',
    saved_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(client_token, product_name)
);
