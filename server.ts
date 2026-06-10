require('module').Module._initPaths();
import express from "express";
import path from "path";
// vite is only imported dynamically in dev mode (never bundled into production)
import Database from "better-sqlite3";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";

// DB_PATH env var is set by Electron so data goes to user's AppData folder.
// Falls back to cwd for dev / non-Electron usage.
const dbPath = process.env.DB_PATH || path.join(process.cwd(), "erp.db");
const db = new Database(dbPath);

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT,
    mobile TEXT,
    email TEXT,
    gstin TEXT,
    bank_name TEXT,
    account_no TEXT,
    ifsc TEXT,
    upi_id TEXT,
    terms TEXT,
    whatsapp TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    gstin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    gstin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    name TEXT NOT NULL,
    category TEXT,
    hsn_code TEXT,
    purchase_price REAL,
    selling_price REAL,
    gst_rate REAL DEFAULT 18,
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    customer_id INTEGER,
    invoice_no TEXT NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL,
    total_gst REAL,
    status TEXT DEFAULT 'Paid', -- Paid, Pending
    payment_mode TEXT, -- Cash, Bank, UPI
    transport_charge REAL DEFAULT 0,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    gst_amount REAL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    vendor_id INTEGER,
    bill_no TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    total_amount REAL,
    total_gst REAL,
    transport_charge REAL DEFAULT 0,
    status TEXT DEFAULT 'Paid',
    payment_mode TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id),
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    price REAL,
    gst_amount REAL,
    FOREIGN KEY (purchase_id) REFERENCES purchases(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS bank_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    type TEXT, -- Deposit, Withdrawal
    category TEXT, -- Sale, Purchase, Expense, Transfer
    amount REAL,
    mode TEXT, -- Cash, Bank, UPI
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS imported_bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    title TEXT,
    file_path TEXT,
    file_type TEXT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    guest_name TEXT NOT NULL,
    mobile TEXT,
    address TEXT,
    id_proof TEXT,
    check_in TEXT,
    check_out TEXT,
    nights INTEGER DEFAULT 1,
    room_no TEXT,
    room_type TEXT,
    per_night_charge REAL,
    gst_rate REAL DEFAULT 12,
    total_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );

  CREATE TABLE IF NOT EXISTS repairs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER,
    job_card_no TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_mobile TEXT,
    camera_model TEXT,
    problem TEXT,
    estimated_cost REAL,
    delivery_date TEXT,
    status TEXT DEFAULT 'Received',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id)
  );
`);

// Safe Database Migrations
try {
  db.exec("ALTER TABLE companies ADD COLUMN terms TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE companies ADD COLUMN whatsapp TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE products ADD COLUMN min_stock INTEGER DEFAULT 5;");
} catch (e) {}

try {
  db.exec("ALTER TABLE products ADD COLUMN barcode TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE products ADD COLUMN image_url TEXT;");
} catch (e) {}

try {
  db.exec("ALTER TABLE customers ADD COLUMN previous_due REAL DEFAULT 0;");
} catch (e) {}

try {
  db.exec("ALTER TABLE customers ADD COLUMN credit_limit REAL DEFAULT 100000;");
} catch (e) {}

try {
  db.exec("ALTER TABLE vendors ADD COLUMN outstanding_balance REAL DEFAULT 0;");
} catch (e) {}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  
  const upload = multer({ dest: 'uploads/' });
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // --- API Routes ---

  // Companies
  app.get("/api/companies", (req, res) => {
    const companies = db.prepare("SELECT * FROM companies").all();
    res.json(companies);
  });

  app.post("/api/companies", (req, res) => {
    const { name, address, mobile, email, gstin, bank_name, account_no, ifsc, upi_id, terms, whatsapp } = req.body;
    const stmt = db.prepare(`
      INSERT INTO companies (name, address, mobile, email, gstin, bank_name, account_no, ifsc, upi_id, terms, whatsapp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, address, mobile, email, gstin, bank_name, account_no, ifsc, upi_id, terms, whatsapp || '');
    res.json({ id: info.lastInsertRowid });
  });

  // Customers
  app.get("/api/customers/:companyId", (req, res) => {
    const customers = db.prepare("SELECT * FROM customers WHERE company_id = ?").all(req.params.companyId);
    res.json(customers);
  });

  app.post("/api/customers", (req, res) => {
    const { company_id, name, mobile, address, gstin } = req.body;
    const stmt = db.prepare("INSERT INTO customers (company_id, name, mobile, address, gstin) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(company_id, name, mobile, address, gstin);
    res.json({ id: info.lastInsertRowid });
  });

  // Vendors
  app.get("/api/vendors/:companyId", (req, res) => {
    const vendors = db.prepare("SELECT * FROM vendors WHERE company_id = ?").all(req.params.companyId);
    res.json(vendors);
  });

  app.post("/api/vendors", (req, res) => {
    const { company_id, name, mobile, address, gstin } = req.body;
    const stmt = db.prepare("INSERT INTO vendors (company_id, name, mobile, address, gstin) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(company_id, name, mobile, address, gstin);
    res.json({ id: info.lastInsertRowid });
  });

  // Products
  app.get("/api/products/:companyId", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE company_id = ?").all(req.params.companyId);
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { company_id, name, category, hsn_code, purchase_price, selling_price, gst_rate, stock, min_stock } = req.body;
    const stmt = db.prepare(`
      INSERT INTO products (company_id, name, category, hsn_code, purchase_price, selling_price, gst_rate, stock, min_stock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(company_id, name, category, hsn_code, purchase_price, selling_price, gst_rate, stock, min_stock);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, category, hsn_code, purchase_price, selling_price, gst_rate, stock, min_stock } = req.body;
    const stmt = db.prepare(`
      UPDATE products 
      SET name = ?, category = ?, hsn_code = ?, purchase_price = ?, selling_price = ?, gst_rate = ?, stock = ?, min_stock = ?
      WHERE id = ?
    `);
    stmt.run(name, category, hsn_code, purchase_price, selling_price, gst_rate, stock, min_stock, req.params.id);
    res.json({ success: true });
  });

  // Invoices (Billing)
  app.get("/api/invoices/:companyId", (req, res) => {
    const invoices = db.prepare(`
      SELECT i.*, c.name as customer_name 
      FROM invoices i 
      JOIN customers c ON i.customer_id = c.id 
      WHERE i.company_id = ?
      ORDER BY i.date DESC
    `).all(req.params.companyId);
    res.json(invoices);
  });

  app.get("/api/invoices/details/:id", (req, res) => {
    const invoice = db.prepare(`
      SELECT i.*, 
             c.name as customer_name, 
             c.mobile as customer_mobile, 
             c.address as customer_address, 
             c.gstin as customer_gstin
      FROM invoices i
      JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(req.params.id) as any;
    const items = db.prepare(`
      SELECT ii.*, p.name as product_name, p.hsn_code 
      FROM invoice_items ii 
      JOIN products p ON ii.product_id = p.id 
      WHERE ii.invoice_id = ?
    `).all(req.params.id);
    res.json({ ...invoice, items });
  });

  app.post("/api/invoices", (req, res) => {
    const { company_id, customer_id, invoice_no, total_amount, total_gst, payment_mode, transport_charge, items } = req.body;
    
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO invoices (company_id, customer_id, invoice_no, total_amount, total_gst, payment_mode, transport_charge)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(company_id, customer_id, invoice_no, total_amount, total_gst, payment_mode, transport_charge);
      const invoiceId = info.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO invoice_items (invoice_id, product_id, quantity, price, gst_amount)
        VALUES (?, ?, ?, ?, ?)
      `);
      const stockStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

      for (const item of items) {
        itemStmt.run(invoiceId, item.product_id, item.quantity, item.price, item.gst_amount);
        stockStmt.run(item.quantity, item.product_id);
      }

      // Record transaction
      db.prepare(`
        INSERT INTO bank_transactions (company_id, type, category, amount, mode, description)
        VALUES (?, 'Deposit', 'Sale', ?, ?, ?)
      `).run(company_id, total_amount, payment_mode, `Invoice #${invoice_no}`);

      return invoiceId;
    });

    const invoiceId = transaction();
    res.json({ id: invoiceId });
  });

  // Purchases
  app.post("/api/purchases", (req, res) => {
    const { company_id, vendor_id, bill_no, total_amount, total_gst, transport_charge, payment_mode, items } = req.body;
    
    const transaction = db.transaction(() => {
      const stmt = db.prepare(`
        INSERT INTO purchases (company_id, vendor_id, bill_no, total_amount, total_gst, transport_charge, payment_mode)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(company_id, vendor_id, bill_no, total_amount, total_gst, transport_charge, payment_mode);
      const purchaseId = info.lastInsertRowid;

      const itemStmt = db.prepare(`
        INSERT INTO purchase_items (purchase_id, product_id, quantity, price, gst_amount)
        VALUES (?, ?, ?, ?, ?)
      `);
      const stockStmt = db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?");

      for (const item of items) {
        itemStmt.run(purchaseId, item.product_id, item.quantity, item.price, item.gst_amount);
        stockStmt.run(item.quantity, item.product_id);
      }

      // Record transaction
      db.prepare(`
        INSERT INTO bank_transactions (company_id, type, category, amount, mode, description)
        VALUES (?, 'Withdrawal', 'Purchase', ?, ?, ?)
      `).run(company_id, total_amount + transport_charge, payment_mode, `Purchase Bill #${bill_no}`);

      return purchaseId;
    });

    const purchaseId = transaction();
    res.json({ id: purchaseId });
  });

  app.get("/api/purchases/:companyId", (req, res) => {
    const purchases = db.prepare(`
      SELECT 
        p.*, 
        v.name as vendor_name,
        v.address as vendor_address,
        v.gstin as vendor_gstin,
        v.mobile as vendor_mobile
      FROM purchases p 
      JOIN vendors v ON p.vendor_id = v.id 
      WHERE p.company_id = ?
      ORDER BY p.date DESC
    `).all(req.params.companyId);
    res.json(purchases);
  });

  app.get("/api/purchase-items/:purchaseId", (req, res) => {
    const items = db.prepare(`
      SELECT pi.*, p.name as product_name, p.gst_rate 
      FROM purchase_items pi 
      JOIN products p ON pi.product_id = p.id 
      WHERE pi.purchase_id = ?
    `).all(req.params.purchaseId);
    res.json(items);
  });

  // Reports & Stats
  app.get("/api/stats/:companyId", (req, res) => {
    const companyId = req.params.companyId;
    const sales = (db.prepare("SELECT SUM(total_amount) as total FROM invoices WHERE company_id = ?").get(companyId) as any).total || 0;
    const purchases = (db.prepare("SELECT SUM(total_amount) as total FROM purchases WHERE company_id = ?").get(companyId) as any).total || 0;
    const stockValue = (db.prepare("SELECT SUM(stock * purchase_price) as total FROM products WHERE company_id = ?").get(companyId) as any).total || 0;
    const customers = (db.prepare("SELECT COUNT(*) as count FROM customers WHERE company_id = ?").get(companyId) as any).count;

    const monthlySales = db.prepare(`
      SELECT strftime('%Y-%m', date) as month, SUM(total_amount) as total 
      FROM invoices 
      WHERE company_id = ? 
      GROUP BY month 
      ORDER BY month DESC 
      LIMIT 6
    `).all(companyId);

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = (db.prepare(`
      SELECT SUM(total_amount) as total FROM invoices 
      WHERE company_id = ? AND (strftime('%Y-%m-%d', date) = ? OR date(date) = date('now') OR date(date, 'localtime') = date('now', 'localtime'))
    `).get(companyId, todayStr) as any).total || 0;

    const todayPurchases = (db.prepare(`
      SELECT SUM(total_amount) as total FROM purchases 
      WHERE company_id = ? AND (strftime('%Y-%m-%d', date) = ? OR date(date) = date('now') OR date(date, 'localtime') = date('now', 'localtime'))
    `).get(companyId, todayStr) as any).total || 0;

    const todayProfit = todaySales - todayPurchases;

    res.json({ 
      sales, 
      purchases, 
      stockValue, 
      customers, 
      monthlySales,
      todaySales,
      todayPurchases,
      todayProfit
    });
  });

  // Bank/Cash
  app.get("/api/transactions/:companyId", (req, res) => {
    const txs = db.prepare("SELECT * FROM bank_transactions WHERE company_id = ? ORDER BY date DESC").all(req.params.companyId);
    res.json(txs);
  });

  // Bill Imports
  app.post("/api/import", upload.single('file'), (req, res) => {
    const { company_id, title } = req.body;
    const file = req.file;
    if (!file) return res.status(400).send("No file uploaded");

    const stmt = db.prepare("INSERT INTO imported_bills (company_id, title, file_path, file_type) VALUES (?, ?, ?, ?)");
    stmt.run(company_id, title, file.path, file.mimetype);
    res.json({ success: true });
  });

  app.get("/api/imports/:companyId", (req, res) => {
    const imports = db.prepare("SELECT * FROM imported_bills WHERE company_id = ? ORDER BY date DESC").all(req.params.companyId);
    res.json(imports);
  });

  // --- Guest House / Resort Bookings API ---
  app.get("/api/bookings/:companyId", (req, res) => {
    try {
      const bookings = db.prepare("SELECT * FROM bookings WHERE company_id = ? ORDER BY created_at DESC").all(req.params.companyId);
      res.json(bookings);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/bookings", (req, res) => {
    const { company_id, guest_name, mobile, address, id_proof, check_in, check_out, nights, room_no, room_type, per_night_charge, gst_rate, total_amount } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO bookings (company_id, guest_name, mobile, address, id_proof, check_in, check_out, nights, room_no, room_type, per_night_charge, gst_rate, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(company_id, guest_name, mobile, address, id_proof, check_in, check_out, nights || 1, room_no, room_type, per_night_charge, gst_rate || 12, total_amount);
      
      // Sync to cash book / bank transactions automatically
      db.prepare(`
        INSERT INTO bank_transactions (company_id, type, category, amount, mode, description)
        VALUES (?, 'Deposit', 'Sale', ?, 'Cash', ?)
      `).run(company_id, total_amount, `Resort Booking: ${guest_name} (Room ${room_no})`);

      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/bookings/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Camera Repair Module API ---
  app.get("/api/repairs/:companyId", (req, res) => {
    try {
      const repairs = db.prepare("SELECT * FROM repairs WHERE company_id = ? ORDER BY created_at DESC").all(req.params.companyId);
      res.json(repairs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/repairs", (req, res) => {
    const { company_id, job_card_no, customer_name, customer_mobile, camera_model, problem, estimated_cost, delivery_date, status } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO repairs (company_id, job_card_no, customer_name, customer_mobile, camera_model, problem, estimated_cost, delivery_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = stmt.run(company_id, job_card_no, customer_name, customer_mobile, camera_model, problem, estimated_cost, delivery_date, status || 'Received');
      res.json({ id: info.lastInsertRowid });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/repairs/:id/status", (req, res) => {
    const { status } = req.body;
    try {
      db.prepare("UPDATE repairs SET status = ? WHERE id = ?").run(status, req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/repairs/:id", (req, res) => {
    try {
      db.prepare("DELETE FROM repairs WHERE id = ?").run(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- DAMSON AI Business Assistant API (Lazy Initialized) ---
  let aiInstance: any = null;
  function getGeminiClient() {
    if (!aiInstance) {
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error("GEMINI_API_KEY environment variable is is not configured. Please supply it under Settings > Secrets.");
      }
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
    return aiInstance;
  }

  app.post("/api/ai/chat", async (req, res) => {
    const { company_id, message } = req.body;
    if (!company_id) {
      return res.status(400).json({ error: "company_id is required" });
    }

    try {
      const aiClient = getGeminiClient();

      // Gather live database snapshots for smart grounding context
      const company = db.prepare("SELECT * FROM companies WHERE id = ?").get(company_id) as any;
      const products = db.prepare("SELECT * FROM products WHERE company_id = ?").all(company_id);
      const customers = db.prepare("SELECT * FROM customers WHERE company_id = ?").all(company_id);
      const invoices = db.prepare("SELECT * FROM invoices WHERE company_id = ?").all(company_id);
      const bookings = db.prepare("SELECT * FROM bookings WHERE company_id = ?").all(company_id);
      const repairs = db.prepare("SELECT * FROM repairs WHERE company_id = ?").all(company_id);
      const vendors = db.prepare("SELECT * FROM vendors WHERE company_id = ?").all(company_id);
      const purchases = db.prepare("SELECT * FROM purchases WHERE company_id = ?").all(company_id);

      const context = `
You are the DAMSON AI Business Assistant inside the DAMSON ERP dashboard.
You help company owners analyze their business data.

Current Company Profile:
- Name: ${company?.name || 'Damson Business'}
- Address: ${company?.address || 'N/A'}
- GSTIN: ${company?.gstin || 'N/A'}

Snapshots of Database:
1. PRODUCTS (INVENTORY): ${JSON.stringify(products)}
2. CUSTOMERS (with outstanding balances): ${JSON.stringify(customers)}
3. SALES (INVOICES): ${JSON.stringify(invoices)}
4. GUEST HOUSE BOOKINGS (RESORT): ${JSON.stringify(bookings)}
5. CAMERA JOB CARDS (REPAIRS): ${JSON.stringify(repairs)}
6. VENDORS (with outstanding balances): ${JSON.stringify(vendors)}
7. PURCHASES (BILL RECEIPTS): ${JSON.stringify(purchases)}

Roles for Assistant:
- Answer questions extremely accurately. Use professional, clear, business ERP tone. Keep text clean, spaced out, in simple Markdown layout.
- If asked "Which products give highest profit?", subtract product purchase_price from selling_price, multiply by Sales volumes (if any in invoice_items) or highlight the base margins clearly.
- If asked "Show low stock products", look for items where stock <= min_stock. Show them clearly in tabular or list format.
- If asked "Who are top customers?", sum total sales (total_amount) grouped by customer name or highlight high-value statements.
- If asked "Generate monthly sales summary.", group invoices by month and output summaries.
- Keep output brief and professional, focusing purely on solving business queries.

User Question: "${message}"
`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: context,
      });

      res.json({ reply: response.text });
    } catch (err: any) {
      console.error("AI Assistant service error:", err);
      res.status(200).json({ reply: `⚠️ AI Assistant is currently deactivated or configuring. ${err.message || err}` });
    }
  });

  // Serve static assets
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import so vite is NEVER included in the production bundle
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // DIST_PATH is set by Electron main process; fallback for plain node usage
    const distPath = process.env.DIST_PATH || path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ERP Server running on http://localhost:${PORT}`);
  });
}

startServer();
