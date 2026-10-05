import { dbAll, dbGet } from '../config/database.js';

export const getDashboardSummary = async (req, res) => {
  try {
    const userClause = req.userId ? ' WHERE (user_id = ? OR user_id IS NULL)' : '';
    const userParams = req.userId ? [req.userId] : [];

    // 1. Overall Totals
    const totals = await dbGet(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COALESCE(SUM(base_price * quantity), 0) AS total_base,
        COUNT(id) AS total_purchases,
        COALESCE(SUM(quantity), 0) AS total_products
      FROM purchases
      ${userClause}
    `, userParams);

    // 2. Current Month Totals
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    let cmQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS current_month_spent,
        COALESCE(SUM(gst_amount), 0) AS current_month_gst,
        COUNT(id) AS current_month_purchases
      FROM purchases
      WHERE strftime('%Y-%m', purchase_date) = ?
    `;
    const cmParams = [currentYearMonth];
    if (req.userId) {
      cmQuery += ' AND (user_id = ? OR user_id IS NULL)';
      cmParams.push(req.userId);
    }
    const currentMonthData = await dbGet(cmQuery, cmParams);

    let pmQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS prev_month_spent
      FROM purchases
      WHERE strftime('%Y-%m', purchase_date) = ?
    `;
    const pmParams = [prevYearMonth];
    if (req.userId) {
      pmQuery += ' AND (user_id = ? OR user_id IS NULL)';
      pmParams.push(req.userId);
    }
    const prevMonthData = await dbGet(pmQuery, pmParams);

    // 3. Category Breakdown
    let catQuery = `
      SELECT 
        category,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count,
        COALESCE(SUM(quantity), 0) AS products_count
      FROM purchases
    `;
    const catParams = [];
    if (req.userId) {
      catQuery += ' WHERE (user_id = ? OR user_id IS NULL)';
      catParams.push(req.userId);
    }
    catQuery += ' GROUP BY category ORDER BY total_spent DESC';
    const categorySpending = await dbAll(catQuery, catParams);

    // 4. Monthly Trend (last 12 months)
    let monthlyQuery = `
      SELECT 
        strftime('%Y-%m', purchase_date) AS month,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS purchases_count
      FROM purchases
    `;
    const mParams = [];
    if (req.userId) {
      monthlyQuery += ' WHERE (user_id = ? OR user_id IS NULL)';
      mParams.push(req.userId);
    }
    monthlyQuery += " GROUP BY strftime('%Y-%m', purchase_date) ORDER BY month ASC LIMIT 12";
    const monthlySpending = await dbAll(monthlyQuery, mParams);

    // 5. Recent 5 Purchases
    let recentQuery = 'SELECT * FROM purchases';
    const rParams = [];
    if (req.userId) {
      recentQuery += ' WHERE (user_id = ? OR user_id IS NULL)';
      rParams.push(req.userId);
    }
    recentQuery += ' ORDER BY purchase_date DESC, id DESC LIMIT 5';
    const recentPurchases = await dbAll(recentQuery, rParams);

    res.json({
      success: true,
      data: {
        summary: {
          total_spent: totals.total_spent,
          total_gst: totals.total_gst,
          total_base: totals.total_base,
          total_purchases: totals.total_purchases,
          total_products: totals.total_products,
          current_month_spent: currentMonthData.current_month_spent,
          current_month_gst: currentMonthData.current_month_gst,
          current_month_purchases: currentMonthData.current_month_purchases,
          prev_month_spent: prevMonthData.prev_month_spent
        },
        category_spending: categorySpending,
        monthly_spending: monthlySpending,
        recent_purchases: recentPurchases
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ success: false, message: 'Server error generating dashboard summary', error: error.message });
  }
};

export const getFullReports = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const userClause = req.userId ? ' WHERE (user_id = ? OR user_id IS NULL)' : '';
    const userParams = req.userId ? [req.userId] : [];

    // Daily spending (last 30 records)
    let dailyQuery = `
      SELECT 
        purchase_date AS date,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      ${userClause}
      GROUP BY purchase_date
      ORDER BY purchase_date DESC
      LIMIT 30
    `;
    const dailySpending = await dbAll(dailyQuery, userParams);

    // Monthly spending for given year
    let monthlyYearQuery = `
      SELECT 
        strftime('%m', purchase_date) AS month_num,
        strftime('%Y-%m', purchase_date) AS month_key,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      WHERE strftime('%Y', purchase_date) = ?
    `;
    const myParams = [String(year)];
    if (req.userId) {
      monthlyYearQuery += ' AND (user_id = ? OR user_id IS NULL)';
      myParams.push(req.userId);
    }
    monthlyYearQuery += " GROUP BY strftime('%m', purchase_date) ORDER BY month_num ASC";
    const monthlySpendingYear = await dbAll(monthlyYearQuery, myParams);

    // Yearly spending
    let yearlyQuery = `
      SELECT 
        strftime('%Y', purchase_date) AS year,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      ${userClause}
      GROUP BY strftime('%Y', purchase_date)
      ORDER BY year DESC
    `;
    const yearlySpending = await dbAll(yearlyQuery, userParams);

    // GST Breakdown by slab rate
    let gstQuery = `
      SELECT 
        gst_percentage,
        COALESCE(SUM(gst_amount), 0) AS total_gst_collected,
        COALESCE(SUM(total_amount), 0) AS total_sales_volume,
        COUNT(id) AS purchase_count
      FROM purchases
      ${userClause}
      GROUP BY gst_percentage
      ORDER BY gst_percentage ASC
    `;
    const gstByRate = await dbAll(gstQuery, userParams);

    // Highest Value Purchases
    let highestQuery = `
      SELECT * FROM purchases
      ${userClause}
      ORDER BY total_amount DESC
      LIMIT 10
    `;
    const highestPurchases = await dbAll(highestQuery, userParams);

    // Top Vendors
    let vendorQuery = `
      SELECT 
        vendor_name,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COUNT(id) AS count
      FROM purchases
      ${userClause}
      GROUP BY vendor_name
      ORDER BY total_spent DESC
      LIMIT 8
    `;
    const topVendors = await dbAll(vendorQuery, userParams);

    res.json({
      success: true,
      data: {
        daily: dailySpending.reverse(),
        monthly: monthlySpendingYear,
        yearly: yearlySpending,
        gst_slabs: gstByRate,
        highest_purchases: highestPurchases,
        top_vendors: topVendors
      }
    });
  } catch (error) {
    console.error('Error fetching full reports:', error);
    res.status(500).json({ success: false, message: 'Server error generating reports', error: error.message });
  }
};

export const exportPurchasesCSV = async (req, res) => {
  try {
    let query = 'SELECT * FROM purchases';
    const params = [];
    if (req.userId) {
      query += ' WHERE (user_id = ? OR user_id IS NULL)';
      params.push(req.userId);
    }
    query += ' ORDER BY purchase_date DESC';

    const purchases = await dbAll(query, params);

    const headers = [
      'ID', 'Product Name', 'Category', 'Quantity', 'Base Price (INR)',
      'GST %', 'GST Amount (INR)', 'Total Amount (INR)', 'Purchase Date',
      'Vendor Name', 'Invoice Number', 'Notes'
    ];

    const rows = purchases.map(p => [
      p.id,
      `"${(p.product_name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      p.quantity,
      p.base_price,
      p.gst_percentage,
      p.gst_amount,
      p.total_amount,
      p.purchase_date,
      `"${(p.vendor_name || '').replace(/"/g, '""')}"`,
      `"${(p.invoice_number || '').replace(/"/g, '""')}"`,
      `"${(p.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="my_purchase_tracker_export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};
