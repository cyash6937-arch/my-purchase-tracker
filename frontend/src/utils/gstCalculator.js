export const GST_SLABS = [0, 5, 12, 18, 28];

export const calculateGST = (basePrice, quantity = 1, gstPercentage = 18) => {
  const base = Math.max(0, parseFloat(basePrice) || 0);
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const gstRate = Math.max(0, parseFloat(gstPercentage) || 0);

  const totalBase = base * qty;
  const gstAmount = (totalBase * gstRate) / 100;
  const finalPrice = totalBase + gstAmount;

  return {
    totalBase: parseFloat(totalBase.toFixed(2)),
    gstAmount: parseFloat(gstAmount.toFixed(2)),
    finalPrice: parseFloat(finalPrice.toFixed(2))
  };
};
