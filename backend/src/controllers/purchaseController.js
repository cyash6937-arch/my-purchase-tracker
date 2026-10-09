import { dbAll, dbGet, dbRun } from '../config/database.js';
import fs from 'fs';
import path from 'path';

export const getAllPurchases = async (req, res) => {
  try {
    const { category, vendor, startDate, endDate, sortBy = 'newest', search } = req.query;

    let query = 'SELECT * FROM purchases WHERE 1=1';
    const params = [];

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (vendor) {
      query += ' AND vendor_name LIKE ?';
      params.push(`%${vendor}%`);
    }

    if (startDate) {
      query += ' AND purchase_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND purchase_date <= ?';
      params.push(endDate);
    }

    if (search) {
      query += ' AND (product_name LIKE ? OR vendor_name LIKE ? OR category LIKE ? OR invoice_number LIKE ? OR notes LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    if (req.userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(req.userId);
    }

    // Sorting
    switch (sortBy) {
      case 'oldest':
        query += ' ORDER BY purchase_date ASC, id ASC';
        break;
      case 'price_high':
        query += ' ORDER BY total_amount DESC';
        break;
      case 'price_low':
        query += ' ORDER BY total_amount ASC';
        break;
      case 'name_asc':
        query += ' ORDER BY product_name ASC';
        break;
      case 'newest':
      default:
        query += ' ORDER BY purchase_date DESC, id DESC';
        break;
    }

    const purchases = await dbAll(query, params);
    res.json({ success: true, count: purchases.length, data: purchases });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ success: false, message: 'Server error fetching purchases', error: error.message });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    let query = 'SELECT * FROM purchases WHERE id = ?';
    const params = [id];

    if (req.userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(req.userId);
    }

    const purchase = await dbGet(query, params);

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(500).json({ success: false, message: 'Server error fetching purchase', error: error.message });
  }
};

export const createPurchase = async (req, res) => {
  try {
    const {
      product_name,
      category,
      quantity = 1,
      base_price,
      gst_percentage = 0,
      purchase_date,
      vendor_name,
      invoice_number = '',
      notes = ''
    } = req.body;

    if (!product_name || !category || base_price === undefined || !purchase_date || !vendor_name) {
      return res.status(400).json({
        success: false,
        message: 'Product name, category, base price, purchase date, and vendor name are required.'
      });
    }

    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const parsedBase = Math.max(0, parseFloat(base_price) || 0);
    const parsedGstPercent = Math.max(0, parseFloat(gst_percentage) || 0);

    const totalBase = parsedBase * parsedQty;
    const calculatedGstAmount = parseFloat(((totalBase * parsedGstPercent) / 100).toFixed(2));
    const calculatedTotal = parseFloat((totalBase + calculatedGstAmount).toFixed(2));

    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.invoice_url || null);

    const result = await dbRun(
      `INSERT INTO purchases (
        product_name, category, quantity, base_price, gst_percentage,
        gst_amount, total_amount, purchase_date, vendor_name,
        invoice_number, notes, invoice_url, user_id, user_email, user_phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product_name.trim(),
        category.trim(),
        parsedQty,
        parsedBase,
        parsedGstPercent,
        calculatedGstAmount,
        calculatedTotal,
        purchase_date,
        vendor_name.trim(),
        invoice_number.trim(),
        notes.trim(),
        invoiceUrl,
        req.userId || null,
        req.userEmail || null,
        req.userPhone || null
      ]
    );

    const newPurchase = await dbGet('SELECT * FROM purchases WHERE id = ?', [result.id]);

    res.status(201).json({
      success: true,
      message: 'Purchase recorded successfully',
      data: newPurchase
    });
  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(500).json({ success: false, message: 'Server error creating purchase', error: error.message });
  }
};

export const createBulkPurchases = async (req, res) => {
  try {
    const {
      purchase_date,
      vendor_name,
      invoice_number = '',
      notes = ''
    } = req.body;

    let items = [];
    try {
      items = JSON.parse(req.body.items || '[]');
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid items list.' });
    }

    if (!purchase_date || !vendor_name || !String(vendor_name).trim()) {
      return res.status(400).json({ success: false, message: 'Vendor name and purchase date are required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Add at least one item.' });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_name || !String(it.product_name).trim() || !it.category || !(parseFloat(it.base_price) > 0)) {
        return res.status(400).json({
          success: false,
          message: `Item ${i + 1}: product name, category and base price are required.`
        });
      }
    }

    const invoiceUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const created = [];

    for (const it of items) {
      const qty = Math.max(1, parseInt(it.quantity, 10) || 1);
      const base = Math.max(0, parseFloat(it.base_price) || 0);
      const gstPercent = Math.max(0, parseFloat(it.gst_percentage) || 0);
      const totalBase = base * qty;
      const gstAmount = parseFloat(((totalBase * gstPercent) / 100).toFixed(2));
      const total = parseFloat((totalBase + gstAmount).toFixed(2));

      const result = await dbRun(
        `INSERT INTO purchases (
          product_name, category, quantity, base_price, gst_percentage,
          gst_amount, total_amount, purchase_date, vendor_name,
          invoice_number, notes, invoice_url, user_id, user_email, user_phone
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          String(it.product_name).trim(),
          String(it.category).trim(),
          qty,
          base,
          gstPercent,
          gstAmount,
          total,
          purchase_date,
          String(vendor_name).trim(),
          String(invoice_number).trim(),
          String(notes).trim(),
          invoiceUrl,
          req.userId || null,
          req.userEmail || null,
          req.userPhone || null
        ]
      );
      created.push(await dbGet('SELECT * FROM purchases WHERE id = ?', [result.id]));
    }

    res.status(201).json({
      success: true,
      message: `${created.length} item(s) recorded successfully`,
      count: created.length,
      data: created
    });
  } catch (error) {
    console.error('Error creating bulk purchases:', error);
    res.status(500).json({ success: false, message: 'Server error creating purchases', error: error.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    let existingQuery = 'SELECT * FROM purchases WHERE id = ?';
    const existingParams = [id];
    if (req.userId) {
      existingQuery += ' AND (user_id = ? OR user_id IS NULL)';
      existingParams.push(req.userId);
    }
    const existing = await dbGet(existingQuery, existingParams);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    const {
      product_name = existing.product_name,
      category = existing.category,
      quantity = existing.quantity,
      base_price = existing.base_price,
      gst_percentage = existing.gst_percentage,
      purchase_date = existing.purchase_date,
      vendor_name = existing.vendor_name,
      invoice_number = existing.invoice_number,
      notes = existing.notes
    } = req.body;

    const parsedQty = Math.max(1, parseInt(quantity, 10) || 1);
    const parsedBase = Math.max(0, parseFloat(base_price) || 0);
    const parsedGstPercent = Math.max(0, parseFloat(gst_percentage) || 0);

    const totalBase = parsedBase * parsedQty;
    const calculatedGstAmount = parseFloat(((totalBase * parsedGstPercent) / 100).toFixed(2));
    const calculatedTotal = parseFloat((totalBase + calculatedGstAmount).toFixed(2));

    let invoiceUrl = existing.invoice_url;
    if (req.file) {
      invoiceUrl = `/uploads/${req.file.filename}`;
    }

    await dbRun(
      `UPDATE purchases SET
        product_name = ?, category = ?, quantity = ?, base_price = ?,
        gst_percentage = ?, gst_amount = ?, total_amount = ?,
        purchase_date = ?, vendor_name = ?, invoice_number = ?,
        notes = ?, invoice_url = ?
      WHERE id = ?`,
      [
        product_name.trim(),
        category.trim(),
        parsedQty,
        parsedBase,
        parsedGstPercent,
        calculatedGstAmount,
        calculatedTotal,
        purchase_date,
        vendor_name.trim(),
        invoice_number ? invoice_number.trim() : '',
        notes ? notes.trim() : '',
        invoiceUrl,
        id
      ]
    );

    const updated = await dbGet('SELECT * FROM purchases WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Purchase updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating purchase:', error);
    res.status(500).json({ success: false, message: 'Server error updating purchase', error: error.message });
  }
};

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    let existingQuery = 'SELECT * FROM purchases WHERE id = ?';
    const existingParams = [id];
    if (req.userId) {
      existingQuery += ' AND (user_id = ? OR user_id IS NULL)';
      existingParams.push(req.userId);
    }
    const existing = await dbGet(existingQuery, existingParams);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    // Remove invoice file if exists
    if (existing.invoice_url && existing.invoice_url.startsWith('/uploads/')) {
      const filePath = path.resolve('uploads', path.basename(existing.invoice_url));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.error('Failed to delete invoice file:', e);
        }
      }
    }

    await dbRun('DELETE FROM purchases WHERE id = ?', [id]);

    res.json({ success: true, message: 'Purchase deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(500).json({ success: false, message: 'Server error deleting purchase', error: error.message });
  }
};

export const getCategories = async (req, res) => {
  try {
    const categories = await dbAll('SELECT * FROM categories ORDER BY name ASC');
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching categories' });
  }
};
