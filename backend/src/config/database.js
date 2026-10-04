import sqlite3 from 'sqlite3';
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../purchases.db');

// Support both Cloud Database (Turso / libSQL) and Local SQLite
const isCloudDb = Boolean(process.env.TURSO_DATABASE_URL);
let tursoClient = null;
let sqliteDb = null;

if (isCloudDb) {
  tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN || ''
  });
  console.log('⚡ Connected to Permanent Cloud Database (Turso):', process.env.TURSO_DATABASE_URL);
} else {
  const verboseSqlite = sqlite3.verbose();
  sqliteDb = new verboseSqlite.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to connect to local SQLite database:', err.message);
    } else {
      console.log('Connected to local SQLite database at:', dbPath);
    }
  });
}

// Universal database helpers working with both Cloud and Local SQLite
export const dbRun = async (sql, params = []) => {
  if (tursoClient) {
    const res = await tursoClient.execute({ sql, args: params });
    return { id: Number(res.lastInsertRowid), changes: res.rowsAffected };
  }
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbGet = async (sql, params = []) => {
  if (tursoClient) {
    const res = await tursoClient.execute({ sql, args: params });
    return res.rows[0] || null;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

export const dbAll = async (sql, params = []) => {
  if (tursoClient) {
    const res = await tursoClient.execute({ sql, args: params });
    return res.rows;
  }
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
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

    // 5. Users Table for Multi-User Accounts
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        photo_url TEXT,
        auth_provider TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Non-destructive multi-tenant column migration for purchases
    try {
      const tableCols = await dbAll(`PRAGMA table_info(purchases)`);
      const colNames = (tableCols || []).map(c => c.name);
      if (!colNames.includes('user_id')) {
        await dbRun(`ALTER TABLE purchases ADD COLUMN user_id TEXT`);
      }
      if (!colNames.includes('user_email')) {
        await dbRun(`ALTER TABLE purchases ADD COLUMN user_email TEXT`);
      }
      if (!colNames.includes('user_phone')) {
        await dbRun(`ALTER TABLE purchases ADD COLUMN user_phone TEXT`);
      }
    } catch (migErr) {
      console.log('Migration check note:', migErr.message);
    }

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
