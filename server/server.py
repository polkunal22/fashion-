#!/usr/bin/env python3
"""
FORMA — Atelier of Everyday
Full-Stack SQL Server (SQLite3 Relational Engine + REST API + Static File Server)
Architected & Designed by Kunal Pol (https://github.com/polkunal22)
"""

import html
import http.server
import json
import os
import pathlib
import random
import re
import sqlite3
import urllib.parse
from datetime import datetime

_THIS_DIR = pathlib.Path(__file__).resolve().parent
ROOT_DIR = _THIS_DIR.parent if (_THIS_DIR.parent / "html").exists() else _THIS_DIR
DB_DIR = ROOT_DIR / "database"
DB_PATH = DB_DIR / "forma_atelier.db"
SCHEMA_PATH = DB_DIR / "schema.sql"
SEED_SQL_PATH = DB_DIR / "seed.sql"
INDEX_HTML_PATH = ROOT_DIR / "html" / "index.html"

FREE_DELIVERY_FROM = 4000
DELIVERY_FEE = 99
PROMO_CODES = {
    "ATELIER10": 0.10,
    "FORMA10": 0.10,
    "KUNAL15": 0.15,
}


def get_db_connection():
    DB_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def extract_products_from_html():
    """Parses all 40 product cards from html/index.html to seed the SQL database."""
    if not INDEX_HTML_PATH.exists():
        return []
    content = INDEX_HTML_PATH.read_text(encoding="utf-8")
    products = []

    grid_blocks = re.findall(
        r'<div class="product-grid" data-grid-group="(women|men)">([\s\S]*?)</div>\s*</section>',
        content,
    )
    sku_counter = 1
    for gender, block in grid_blocks:
        cards = re.findall(
            r'<article class="product-card[^"]*"[^>]*data-product="([^"]+)"[^>]*data-price="(\d+)"[^>]*data-tags="([^"]*)"[^>]*>([\s\S]*?)</article>',
            block,
        )
        for name, price, tags, inner in cards:
            img_match = re.search(r'<img[^>]+src="([^"]+)"', inner)
            badge_match = re.search(r'<span class="badge[^"]*">([^<]+)</span>', inner)
            cat_match = re.search(r'<div class="product-meta">\s*<div><p>([^<]+)</p>', inner)
            size_match = re.search(r'<span class="size-range">([^<]+)</span>', inner)

            sku = f"FRM-{gender[:1].upper()}-{sku_counter:03d}"
            sku_counter += 1
            products.append(
                {
                    "sku": sku,
                    "name": html.unescape(name.strip()),
                    "gender": gender,
                    "category": html.unescape(cat_match.group(1).strip()) if cat_match else "ATELIER EDIT",
                    "price_inr": int(price),
                    "badge": html.unescape(badge_match.group(1).strip()) if badge_match else "FORMA EDIT",
                    "tags": tags.strip(),
                    "image_url": img_match.group(1).strip() if img_match else "",
                    "size_range": html.unescape(size_match.group(1).strip()) if size_match else "XS — XL",
                    "stock_count": 18 + (sku_counter % 15),
                }
            )
    return products


def init_database():
    conn = get_db_connection()
    with conn:
        if SCHEMA_PATH.exists():
            conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))

        products = extract_products_from_html()
        seed_lines = [
            "-- FORMA Atelier Automated SQL Seed Dump",
            "-- Contains all 40 signature garments across Women's and Men's collections\n",
        ]

        for p in products:
            conn.execute(
                """
                INSERT INTO products (sku, name, gender, category, price_inr, badge, tags, image_url, size_range, stock_count)
                VALUES (:sku, :name, :gender, :category, :price_inr, :badge, :tags, :image_url, :size_range, :stock_count)
                ON CONFLICT(name) DO UPDATE SET
                    category = excluded.category,
                    price_inr = excluded.price_inr,
                    badge = excluded.badge,
                    tags = excluded.tags,
                    image_url = excluded.image_url,
                    size_range = excluded.size_range
                """,
                p,
            )
            esc_name = p["name"].replace("'", "''")
            esc_cat = p["category"].replace("'", "''")
            esc_badge = p["badge"].replace("'", "''")
            seed_lines.append(
                f"INSERT OR IGNORE INTO products (sku, name, gender, category, price_inr, badge, tags, image_url, size_range, stock_count) "
                f"VALUES ('{p['sku']}', '{esc_name}', '{p['gender']}', '{esc_cat}', {p['price_inr']}, '{esc_badge}', '{p['tags']}', '{p['image_url']}', '{p['size_range']}', {p['stock_count']});"
            )

        # Seed a sample showcase order if no orders exist yet
        order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
        if order_count == 0:
            cur = conn.execute(
                """
                INSERT INTO orders (
                    order_ref, customer_email, customer_phone, first_name, last_name,
                    address_line1, address_line2, city, state, postal_code, country,
                    payment_method, promo_code, subtotal_inr, discount_inr, shipping_inr, total_inr, order_status
                ) VALUES (
                    'FRM-2026-1042', 'aanya.deshmukh@forma.example', '+91 98201 44120', 'Aanya', 'Deshmukh',
                    '14 Carmichael Road, Altamount', 'Suite 4B', 'Mumbai', 'Maharashtra', '400026', 'India',
                    'upi', 'ATELIER10', 9180, 918, 0, 8262, 'DISPATCHED · EXPRESS COURIER'
                )
                """
            )
            sample_order_id = cur.lastrowid
            conn.execute(
                """
                INSERT INTO order_items (order_id, product_name, selected_size, selected_shade, unit_price_inr, quantity, line_total_inr, image_url)
                VALUES
                (?, 'The Linen Blazer', 'M', 'Warm Alabaster', 6290, 1, 6290, 'https://images.unsplash.com/photo-1591369822096-ffd140ec948f?auto=format&fit=crop&w=900&q=85'),
                (?, 'Linen Ease Shirt', 'S', 'Obsidian Charcoal', 2890, 1, 2890, 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85')
                """,
                (sample_order_id, sample_order_id),
            )

        SEED_SQL_PATH.write_text("\n".join(seed_lines) + "\n", encoding="utf-8")
    conn.close()


class FormaSQLHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT_DIR), **kwargs)

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_json({"ok": True})

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path in ("/", "/index.html"):
            self.send_response(302)
            self.send_header("Location", "/html/index.html")
            self.end_headers()
            return

        if path == "/checkout.html":
            self.send_response(302)
            self.send_header("Location", "/html/checkout.html")
            self.end_headers()
            return

        if path == "/favicon.ico":
            svg = (
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'>"
                "<rect width='64' height='64' rx='12' fill='#1b1b17'/>"
                "<text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' "
                "font-family='Georgia,serif' font-size='34' fill='#d7c5a5'>F</text></svg>"
            ).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "image/svg+xml")
            self.send_header("Content-Length", str(len(svg)))
            self.end_headers()
            self.wfile.write(svg)
            return

        if path == "/api/health":
            conn = get_db_connection()
            prod_count = conn.execute("SELECT COUNT(*) FROM products").fetchone()[0]
            order_count = conn.execute("SELECT COUNT(*) FROM orders").fetchone()[0]
            sub_count = conn.execute("SELECT COUNT(*) FROM newsletter_subscribers").fetchone()[0]
            sqlite_ver = sqlite3.sqlite_version
            conn.close()
            return self.send_json(
                {
                    "ok": True,
                    "engine": f"SQLite {sqlite_ver} (SQL Relational Engine)",
                    "database_file": "database/forma_atelier.db",
                    "stats": {
                        "products": prod_count,
                        "orders": order_count,
                        "subscribers": sub_count,
                    },
                }
            )

        if path == "/api/products":
            conn = get_db_connection()
            sql = "SELECT * FROM products WHERE 1=1"
            params = []
            gender = query.get("gender", [None])[0]
            tag = query.get("tag", [None])[0]
            search = query.get("search", [None])[0]
            sort = query.get("sort", ["default"])[0]

            if gender in ("women", "men"):
                sql += " AND gender = ?"
                params.append(gender)
            if tag and tag != "all":
                sql += " AND (' ' || tags || ' ') LIKE ?"
                params.append(f"% {tag} %")
            if search:
                sql += " AND (LOWER(name) LIKE ? OR LOWER(category) LIKE ?)"
                term = f"%{search.lower()}%"
                params.extend([term, term])

            if sort == "asc":
                sql += " ORDER BY price_inr ASC"
            elif sort == "desc":
                sql += " ORDER BY price_inr DESC"
            else:
                sql += " ORDER BY id ASC"

            rows = [dict(r) for r in conn.execute(sql, params).fetchall()]
            conn.close()
            return self.send_json({"ok": True, "count": len(rows), "products": rows})

        if path == "/api/orders":
            conn = get_db_connection()
            ref = query.get("ref", [None])[0]
            email = query.get("email", [None])[0]

            sql = "SELECT * FROM orders WHERE 1=1"
            params = []
            if ref:
                sql += " AND UPPER(order_ref) = ?"
                params.append(ref.strip().upper())
            if email:
                sql += " AND LOWER(customer_email) = ?"
                params.append(email.strip().lower())
            sql += " ORDER BY id DESC LIMIT 15"

            orders = []
            for row in conn.execute(sql, params).fetchall():
                od = dict(row)
                items = conn.execute(
                    "SELECT * FROM order_items WHERE order_id = ?", (od["id"],)
                ).fetchall()
                od["items"] = [dict(i) for i in items]
                orders.append(od)
            conn.close()
            return self.send_json({"ok": True, "count": len(orders), "orders": orders})

        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", "0") or "0")
        raw_body = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            data = json.loads(raw_body)
        except Exception:
            return self.send_json({"ok": False, "error": "Invalid JSON payload"}, 400)

        if path == "/api/newsletter":
            email = (data.get("email") or "").strip().lower()
            edition = (data.get("edition") or "All Dispatches").strip()
            if not email or "@" not in email:
                return self.send_json({"ok": False, "error": "Valid email address required."}, 400)

            conn = get_db_connection()
            with conn:
                conn.execute(
                    """
                    INSERT INTO newsletter_subscribers (email, edition_preference, privilege_code)
                    VALUES (?, ?, 'ATELIER10')
                    ON CONFLICT(email) DO UPDATE SET edition_preference = excluded.edition_preference
                    """,
                    (email, edition),
                )
                total_subs = conn.execute("SELECT COUNT(*) FROM newsletter_subscribers").fetchone()[0]
            conn.close()
            return self.send_json(
                {
                    "ok": True,
                    "email": email,
                    "edition": edition,
                    "privilege_code": "ATELIER10",
                    "total_subscribers": 14200 + total_subs,
                    "message": f"Subscribed to {edition}. Use privilege code ATELIER10 for 10% off at checkout.",
                }
            )

        if path == "/api/promo":
            code = (data.get("code") or "").strip().upper()
            if code in PROMO_CODES:
                pct = int(PROMO_CODES[code] * 100)
                return self.send_json(
                    {
                        "ok": True,
                        "code": code,
                        "discount_rate": PROMO_CODES[code],
                        "message": f"Privilege code {code} applied ({pct}% off).",
                    }
                )
            return self.send_json(
                {"ok": False, "error": "Invalid privilege code. Try ATELIER10 or FORMA10."}, 400
            )

        if path == "/api/orders":
            items = data.get("items") or []
            if not items:
                return self.send_json({"ok": False, "error": "Cannot place an empty order."}, 400)

            email = (data.get("email") or "").strip()
            phone = (data.get("phone") or "").strip()
            first_name = (data.get("firstName") or "").strip()
            last_name = (data.get("lastName") or "").strip()
            address1 = (data.get("address") or "").strip()
            address2 = (data.get("address2") or "").strip()
            city = (data.get("city") or "").strip()
            state = (data.get("state") or "").strip()
            postal = (data.get("postalCode") or "").strip()
            country = (data.get("country") or "India").strip()
            payment = (data.get("payment") or "upi").strip()
            promo_code = (data.get("promoCode") or "").strip().upper()

            if not all([email, phone, first_name, last_name, address1, city, state, postal]):
                return self.send_json(
                    {"ok": False, "error": "Please complete all required delivery fields."}, 400
                )

            subtotal = sum(int(i.get("price", 0)) * max(1, int(i.get("quantity", 1))) for i in items)
            discount_rate = PROMO_CODES.get(promo_code, 0.0)
            discount_inr = round(subtotal * discount_rate)
            after_discount = max(0, subtotal - discount_inr)
            shipping_inr = 0 if after_discount >= FREE_DELIVERY_FROM or after_discount == 0 else DELIVERY_FEE
            total_inr = after_discount + shipping_inr

            order_ref = f"FRM-2026-{random.randint(1100, 9999)}"
            conn = get_db_connection()
            with conn:
                cur = conn.execute(
                    """
                    INSERT INTO orders (
                        order_ref, customer_email, customer_phone, first_name, last_name,
                        address_line1, address_line2, city, state, postal_code, country,
                        payment_method, promo_code, subtotal_inr, discount_inr, shipping_inr, total_inr, order_status
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        order_ref,
                        email,
                        phone,
                        first_name,
                        last_name,
                        address1,
                        address2,
                        city,
                        state,
                        postal,
                        country,
                        payment,
                        promo_code if discount_rate > 0 else "",
                        subtotal,
                        discount_inr,
                        shipping_inr,
                        total_inr,
                        "CONFIRMED · SAVED IN SQL DATABASE",
                    ),
                )
                order_id = cur.lastrowid

                for item in items:
                    name = item.get("name", "FORMA Garment")
                    price = int(item.get("price", 0))
                    qty = max(1, int(item.get("quantity", 1)))
                    size = item.get("size", "M")
                    shade = item.get("shade", "Obsidian Charcoal")
                    img = item.get("image", "")
                    conn.execute(
                        """
                        INSERT INTO order_items (
                            order_id, product_name, selected_size, selected_shade,
                            unit_price_inr, quantity, line_total_inr, image_url
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (order_id, name, size, shade, price, qty, price * qty, img),
                    )
                    conn.execute(
                        "UPDATE products SET stock_count = MAX(0, stock_count - ?) WHERE name = ?",
                        (qty, name),
                    )

            conn.close()
            return self.send_json(
                {
                    "ok": True,
                    "order": {
                        "id": order_id,
                        "order_ref": order_ref,
                        "customer_name": f"{first_name} {last_name}",
                        "customer_email": email,
                        "city": city,
                        "payment_method": payment.upper(),
                        "promo_code": promo_code if discount_rate > 0 else None,
                        "subtotal_inr": subtotal,
                        "discount_inr": discount_inr,
                        "shipping_inr": shipping_inr,
                        "total_inr": total_inr,
                        "status": "CONFIRMED · SAVED IN SQL DATABASE",
                        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
                    },
                },
                201,
            )

        return self.send_json({"ok": False, "error": "Endpoint not found"}, 404)


if __name__ == "__main__":
    init_database()
    port = int(os.environ.get("PORT", "8080"))
    server = http.server.ThreadingHTTPServer(("0.0.0.0", port), FormaSQLHandler)
    print(f"FORMA SQL Server running at http://localhost:{port}/html/index.html")
    server.serve_forever()
