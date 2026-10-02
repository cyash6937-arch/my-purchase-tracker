/**
 * Format numbers as Indian Rupee (INR) currency
 * Example: 125450 -> ₹1,25,450
 */
export const formatINR = (amount, includeDecimals = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const num = Number(amount);
  
  // Format using Indian Numbering System
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals && num % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
};

/**
 * Format date string (YYYY-MM-DD) into readable format (e.g. 15 Sep 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Format Year-Month (e.g. 2026-09 -> September 2026)
 */
export const formatMonthYear = (ymString) => {
  if (!ymString) return '';
  const [year, month] = ymString.split('-');
  const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
