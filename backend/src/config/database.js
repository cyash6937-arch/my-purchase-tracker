import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../purchases.db');

const verboseSqlite = sqlite3.verbose();
export const db = new verboseSqlite.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Promisified helpers for clean async/await usage
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Initialize schema and sample seed data
export const initDatabase = async () => {
  try {
    // 1. Categories Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        icon TEXT DEFAULT 'ShoppingBag'
      )
    `);

    // 2. Vendors Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        contact TEXT
      )
    `);

    // 3. Purchases Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT NOT NULL,
        category TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        base_price REAL NOT NULL,
        gst_percentage REAL NOT NULL DEFAULT 0,
        gst_amount REAL NOT NULL DEFAULT 0,
        total_amount REAL NOT NULL,
        purchase_date TEXT NOT NULL,
        vendor_name TEXT NOT NULL,
        invoice_number TEXT,
        notes TEXT,
        invoice_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Invoices / Attachments Table (for modularity & future expansion)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
      )
    `);

    // Populate default categories if empty
    const catCount = await dbGet(`SELECT COUNT(*) as count FROM categories`);
    if (catCount.count === 0) {
      const defaultCategories = [
        ['Electronics', '#3b82f6', 'Laptop'],
        ['Groceries', '#10b981', 'Apple'],
        ['Office & Stationery', '#f59e0b', 'Briefcase'],
        ['Travel & Fuel', '#8b5cf6', 'Fuel'],
        ['Dining & Food', '#ef4444', 'UtensilsCrossed'],
        ['Healthcare & Medicine', '#06b6d4', 'HeartPulse'],
        ['Utilities & Bills', '#64748b', 'Zap'],
        ['Clothing & Apparel', '#ec4899', 'Shirt'],
        ['Home & Kitchen', '#14b8a6', 'Home'],
        ['Other', '#94a3b8', 'Package']
      ];
      for (const [name, color, icon] of defaultCategories) {
        await dbRun(`INSERT INTO categories (name, color, icon) VALUES (?, ?, ?)`, [name, color, icon]);
      }
    }

    // Categories are ready. No dummy purchases will be seeded.
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};
