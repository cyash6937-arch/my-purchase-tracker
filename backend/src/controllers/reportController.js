import { dbAll, dbGet } from '../config/database.js';

export const getDashboardSummary = async (req, res) => {
  try {
    // 1. Overall Totals
    const totals = await dbGet(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COALESCE(SUM(base_price * quantity), 0) AS total_base,
        COUNT(id) AS total_purchases,
        COALESCE(SUM(quantity), 0) AS total_products
      FROM purchases
    `);

    // 2. Current Month Totals
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const currentMonthData = await dbGet(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS current_month_spent,
        COALESCE(SUM(gst_amount), 0) AS current_month_gst,
        COUNT(id) AS current_month_purchases
      FROM purchases
      WHERE strftime('%Y-%m', purchase_date) = ?
    `, [currentYearMonth]);

    const prevMonthData = await dbGet(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS prev_month_spent
      FROM purchases
      WHERE strftime('%Y-%m', purchase_date) = ?
    `, [prevYearMonth]);

    // 3. Category Breakdown
    const categorySpending = await dbAll(`
      SELECT 
        category,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count,
        COALESCE(SUM(quantity), 0) AS products_count
      FROM purchases
      GROUP BY category
      ORDER BY total_spent DESC
    `);

    // 4. Monthly Trend (last 12 months)
    const monthlySpending = await dbAll(`
      SELECT 
        strftime('%Y-%m', purchase_date) AS month,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS purchases_count
      FROM purchases
      GROUP BY strftime('%Y-%m', purchase_date)
      ORDER BY month ASC
      LIMIT 12
    `);

    // 5. Recent 5 Purchases
    const recentPurchases = await dbAll(`
      SELECT * FROM purchases
      ORDER BY purchase_date DESC, id DESC
      LIMIT 5
    `);

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

    // Daily spending (last 30 records)
    const dailySpending = await dbAll(`
      SELECT 
        purchase_date AS date,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      GROUP BY purchase_date
      ORDER BY purchase_date DESC
      LIMIT 30
    `);

    // Monthly spending for given year
    const monthlySpendingYear = await dbAll(`
      SELECT 
        strftime('%m', purchase_date) AS month_num,
        strftime('%Y-%m', purchase_date) AS month_key,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      WHERE strftime('%Y', purchase_date) = ?
      GROUP BY strftime('%m', purchase_date)
      ORDER BY month_num ASC
    `, [String(year)]);

    // Yearly spending
    const yearlySpending = await dbAll(`
      SELECT 
        strftime('%Y', purchase_date) AS year,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COALESCE(SUM(gst_amount), 0) AS total_gst,
        COUNT(id) AS count
      FROM purchases
      GROUP BY strftime('%Y', purchase_date)
      ORDER BY year DESC
    `);

    // GST Breakdown by slab rate
    const gstByRate = await dbAll(`
      SELECT 
        gst_percentage,
        COALESCE(SUM(gst_amount), 0) AS total_gst_collected,
        COALESCE(SUM(total_amount), 0) AS total_sales_volume,
        COUNT(id) AS purchase_count
      FROM purchases
      GROUP BY gst_percentage
      ORDER BY gst_percentage ASC
    `);

    // Highest Value Purchases
    const highestPurchases = await dbAll(`
      SELECT * FROM purchases
      ORDER BY total_amount DESC
      LIMIT 10
    `);

    // Top Vendors
    const topVendors = await dbAll(`
      SELECT 
        vendor_name,
        COALESCE(SUM(total_amount), 0) AS total_spent,
        COUNT(id) AS count
      FROM purchases
      GROUP BY vendor_name
      ORDER BY total_spent DESC
      LIMIT 8
    `);

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
    const purchases = await dbAll('SELECT * FROM purchases ORDER BY purchase_date DESC');

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
