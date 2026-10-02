import { dbAll, dbGet } from '../config/database.js';

const MONTH_NAMES = {
  january: '01', feb: '02', february: '02', mar: '03', march: '03',
  apr: '04', april: '04', may: '05', jun: '06', june: '06',
  jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12'
};

export const smartSearch = async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();

    if (!rawQuery) {
      const allPurchases = await dbAll('SELECT * FROM purchases ORDER BY purchase_date DESC LIMIT 20');
      return res.json({
        success: true,
        query: '',
        smartInsight: null,
        results: allPurchases
      });
    }

    const lowerQuery = rawQuery.toLowerCase();
    let smartInsight = null;
    let results = [];

    // 1. Natural Language Pattern: "how much did i spend on <category>" or "total spent on <category>"
    const spendCategoryMatch = lowerQuery.match(/(?:how much (?:did i spend|spent) on|total (?:spent|spending) on|spent on)\s+([a-zA-Z\s&]+)/i);
    
    // 2. Natural Language Pattern: "how much gst did i pay" or "how much gst on <category>"
    const gstMatch = lowerQuery.match(/how much gst (?:did i pay|paid|on\s+([a-zA-Z\s&]+))/i);

    // 3. Natural Language Pattern: "purchases from <vendor>" or "from <vendor>"
    const vendorMatch = lowerQuery.match(/(?:purchases from|bought from|vendor|shop)\s+([a-zA-Z0-9\s]+)/i);

    // 4. Natural Language Pattern: "purchases in <month>" or "in <month>"
    let detectedMonth = null;
    for (const [mName, mNum] of Object.entries(MONTH_NAMES)) {
      if (new RegExp(`\\b${mName}\\b`, 'i').test(lowerQuery)) {
        detectedMonth = { name: mName, number: mNum };
        break;
      }
    }

    // Process Natural Language queries:
    if (gstMatch) {
      const categoryArg = gstMatch[1] ? gstMatch[1].trim() : null;
      let sql = 'SELECT COALESCE(SUM(gst_amount), 0) as total_gst, COUNT(id) as count FROM purchases';
      const params = [];
      if (categoryArg) {
        sql += ' WHERE category LIKE ? OR product_name LIKE ?';
        params.push(`%${categoryArg}%`, `%${categoryArg}%`);
      }
      const data = await dbGet(sql, params);
      const items = await dbAll(
        categoryArg ? 'SELECT * FROM purchases WHERE category LIKE ? OR product_name LIKE ? ORDER BY purchase_date DESC' : 'SELECT * FROM purchases ORDER BY purchase_date DESC',
        params
      );

      smartInsight = {
        type: 'gst_calculation',
        headline: `Total GST Paid: ₹${Number(data.total_gst).toLocaleString('en-IN')}`,
        detail: categoryArg 
          ? `Calculated across ${data.count} purchases matching "${categoryArg}".`
          : `Calculated across all ${data.count} purchases recorded in the system.`
      };
      results = items;

    } else if (spendCategoryMatch) {
      const categoryTarget = spendCategoryMatch[1].trim();
      const stats = await dbGet(
        `SELECT 
          COALESCE(SUM(total_amount), 0) AS total_spent,
          COALESCE(SUM(gst_amount), 0) AS total_gst,
          COUNT(id) AS count,
          COALESCE(SUM(quantity), 0) AS total_qty
        FROM purchases 
        WHERE category LIKE ? OR product_name LIKE ?`,
        [`%${categoryTarget}%`, `%${categoryTarget}%`]
      );

      const items = await dbAll(
        `SELECT * FROM purchases 
         WHERE category LIKE ? OR product_name LIKE ?
         ORDER BY purchase_date DESC`,
        [`%${categoryTarget}%`, `%${categoryTarget}%`]
      );

      smartInsight = {
        type: 'category_spending',
        headline: `Total Spent on "${categoryTarget}": ₹${Number(stats.total_spent).toLocaleString('en-IN')}`,
        detail: `Found ${stats.count} purchases (${stats.total_qty} items) with ₹${Number(stats.total_gst).toLocaleString('en-IN')} paid in GST.`
      };
      results = items;

    } else if (vendorMatch) {
      const vendorTarget = vendorMatch[1].trim();
      const items = await dbAll(
        `SELECT * FROM purchases WHERE vendor_name LIKE ? ORDER BY purchase_date DESC`,
        [`%${vendorTarget}%`]
      );
      const stats = await dbGet(
        `SELECT COALESCE(SUM(total_amount), 0) as total_spent, COUNT(id) as count FROM purchases WHERE vendor_name LIKE ?`,
        [`%${vendorTarget}%`]
      );

      smartInsight = {
        type: 'vendor_filter',
        headline: `Purchases from "${vendorTarget}"`,
        detail: `Found ${stats.count} purchases totaling ₹${Number(stats.total_spent).toLocaleString('en-IN')}.`
      };
      results = items;

    } else if (detectedMonth) {
      const monthNum = detectedMonth.number;
      // Also look for optional 4 digit year in query, e.g. 2026
      const yearMatch = lowerQuery.match(/\b(20\d\d)\b/);
      const yearFilter = yearMatch ? yearMatch[1] : null;

      let sql = "SELECT * FROM purchases WHERE strftime('%m', purchase_date) = ?";
      const params = [monthNum];

      if (yearFilter) {
        sql += " AND strftime('%Y', purchase_date) = ?";
        params.push(yearFilter);
      }
      sql += ' ORDER BY purchase_date DESC';

      const items = await dbAll(sql, params);
      const total = items.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);

      smartInsight = {
        type: 'date_filter',
        headline: `Purchases in ${detectedMonth.name.toUpperCase()} ${yearFilter || ''}`,
        detail: `Showing ${items.length} purchases totaling ₹${Number(total).toLocaleString('en-IN')}.`
      };
      results = items;

    } else {
      // General multi-field keyword search
      // Clean query and search across product, vendor, category, invoice_number, notes, and date
      const terms = lowerQuery.split(/\s+/).filter(t => t.length > 0);
      let sql = 'SELECT * FROM purchases WHERE 1=1';
      const params = [];

      for (const term of terms) {
        sql += ` AND (
          product_name LIKE ? OR
          vendor_name LIKE ? OR
          category LIKE ? OR
          invoice_number LIKE ? OR
          notes LIKE ? OR
          purchase_date LIKE ?
        )`;
        const likeTerm = `%${term}%`;
        params.push(likeTerm, likeTerm, likeTerm, likeTerm, likeTerm, likeTerm);
      }

      sql += ' ORDER BY purchase_date DESC';
      results = await dbAll(sql, params);

      if (results.length > 0) {
        const total = results.reduce((acc, curr) => acc + (curr.total_amount || 0), 0);
        smartInsight = {
          type: 'search_results',
          headline: `Found ${results.length} result${results.length > 1 ? 's' : ''}`,
          detail: `Combined value: ₹${Number(total).toLocaleString('en-IN')}`
        };
      }
    }

    res.json({
      success: true,
      query: rawQuery,
      smartInsight,
      count: results.length,
      results
    });
  } catch (error) {
    console.error('Error in smartSearch:', error);
    res.status(500).json({ success: false, message: 'Search query failed', error: error.message });
  }
};
