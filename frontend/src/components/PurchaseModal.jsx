import React, { useState, useEffect } from 'react';
import { X, Upload, Sparkles, AlertCircle, FileText, Check, Plus, Trash2 } from 'lucide-react';
import { GST_SLABS, calculateGST } from '../utils/gstCalculator';
import { formatINR } from '../utils/formatters';

const CATEGORIES = [
  'Electronics',
  'Groceries',
  'Office & Stationery',
  'Travel & Fuel',
  'Dining & Food',
  'Healthcare & Medicine',
  'Utilities & Bills',
  'Clothing & Apparel',
  'Home & Kitchen',
  'Other'
];

export const PurchaseModal = ({ isOpen, onClose, onSave, purchaseToEdit = null }) => {
  const isEditing = Boolean(purchaseToEdit);

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const emptyItem = () => ({
    product_name: '',
    category: 'Electronics',
    quantity: 1,
    base_price: '',
    gst_percentage: 18,
  });

  const [formData, setFormData] = useState({
    purchase_date: getTodayDate(),
    vendor_name: '',
    invoice_number: '',
    notes: '',
  });
  const [items, setItems] = useState([emptyItem()]);

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (purchaseToEdit) {
      setFormData({
        purchase_date: purchaseToEdit.purchase_date || getTodayDate(),
        vendor_name: purchaseToEdit.vendor_name || '',
        invoice_number: purchaseToEdit.invoice_number || '',
        notes: purchaseToEdit.notes || '',
      });
      setItems([{
        product_name: purchaseToEdit.product_name || '',
        category: purchaseToEdit.category || 'Electronics',
        quantity: purchaseToEdit.quantity || 1,
        base_price: purchaseToEdit.base_price !== undefined ? String(purchaseToEdit.base_price) : '',
        gst_percentage: purchaseToEdit.gst_percentage !== undefined ? purchaseToEdit.gst_percentage : 18,
      }]);
      if (purchaseToEdit.invoice_url) {
        setFilePreview(purchaseToEdit.invoice_url);
      } else {
        setFilePreview(null);
      }
      setFile(null);
    } else {
      // Reset form
      setFormData({
        purchase_date: getTodayDate(),
        vendor_name: '',
        invoice_number: '',
        notes: '',
      });
      setItems([emptyItem()]);
      setFile(null);
      setFilePreview(null);
    }
    setErrors({});
  }, [purchaseToEdit, isOpen]);

  // Bill totals across all items
  const billTotals = items.reduce(
    (acc, it) => {
      const c = calculateGST(it.base_price, it.quantity, it.gst_percentage);
      acc.totalBase += c.totalBase;
      acc.gstAmount += c.gstAmount;
      acc.finalPrice += c.finalPrice;
      return acc;
    },
    { totalBase: 0, gstAmount: 0, finalPrice: 0 }
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
    const key = `item_${index}_${field}`;
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: null }));
    }
  };

  const addItem = () => {
    // New item starts with the same category & GST as the previous one (saves clicks)
    setItems(prev => {
      const last = prev[prev.length - 1];
      return [...prev, { ...emptyItem(), category: last.category, gst_percentage: last.gst_percentage }];
    });
  };

  const removeItem = (index) => {
    setItems(prev => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be under 10MB' }));
        return;
      }
      setFile(selected);
      if (selected.type.startsWith('image/')) {
        setFilePreview(URL.createObjectURL(selected));
      } else {
        setFilePreview('PDF_DOCUMENT');
      }
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.vendor_name.trim()) errs.vendor_name = 'Shop / Vendor name is required';
    if (!formData.purchase_date) errs.purchase_date = 'Purchase date is required';

    items.forEach((it, i) => {
      if (!it.product_name.trim()) errs[`item_${i}_product_name`] = 'Product name is required';
      const base = parseFloat(it.base_price);
      if (isNaN(base) || base <= 0) errs[`item_${i}_base_price`] = 'Base price must be greater than ₹0';
      const qty = parseInt(it.quantity, 10);
      if (isNaN(qty) || qty < 1) errs[`item_${i}_quantity`] = 'Quantity must be at least 1';
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const data = new FormData();
      data.append('purchase_date', formData.purchase_date);
      data.append('vendor_name', formData.vendor_name);
      data.append('invoice_number', formData.invoice_number);
      data.append('notes', formData.notes);

      if (isEditing) {
        const it = items[0];
        data.append('product_name', it.product_name);
        data.append('category', it.category);
        data.append('quantity', it.quantity);
        data.append('base_price', it.base_price);
        data.append('gst_percentage', it.gst_percentage);
      } else {
        data.append('items', JSON.stringify(items));
      }

      if (file) {
        data.append('invoice_file', file);
      }

      await onSave(data, purchaseToEdit?.id);
      onClose();
    } catch (err) {
      console.error('Submit purchase error:', err);
      setErrors(prev => ({ ...prev, server: err.message || 'Operation failed' }));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {isEditing ? 'Edit Purchase Details' : 'Record New Purchase'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? 'Enter purchase and tax information with real-time GST calculation' : 'Enter the vendor once, then add every item from the same bill'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {errors.server && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.server}</span>
            </div>
          )}

          {/* Bill details (entered once) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Shop / Vendor Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="vendor_name"
                value={formData.vendor_name}
                onChange={handleInputChange}
                placeholder="e.g. Amazon, Croma, Local Store"
                className={`w-full px-4 py-2.5 bg-slate-50/60 border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                  errors.vendor_name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                }`}
              />
              {errors.vendor_name && <p className="text-xs text-rose-500 mt-1">{errors.vendor_name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Purchase Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                name="purchase_date"
                value={formData.purchase_date}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Invoice / Bill Number <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              name="invoice_number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              placeholder="e.g. INV-2026-901"
              className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Items on this bill */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {isEditing ? 'Item Details' : `Items on this bill (${items.length})`}
              </div>
            </div>

            {items.map((item, index) => {
              const calc = calculateGST(item.base_price, item.quantity, item.gst_percentage);
              const err = (field) => errors[`item_${index}_${field}`];
              return (
                <div
                  key={index}
                  className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-100/70 space-y-4"
                >
                  {!isEditing && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Item {index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      )}
                    </div>
                  )}

                  {/* Product Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Product / Item Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => updateItem(index, 'product_name', e.target.value)}
                      placeholder="e.g. Dell 27-inch 4K Monitor"
                      className={`w-full px-4 py-2 bg-white border rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                        err('product_name') ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                      }`}
                    />
                    {err('product_name') && <p className="text-xs text-rose-500 mt-1">{err('product_name')}</p>}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(index, 'category', e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price & Quantity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Base Price (₹ per unit) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-semibold text-sm">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="any"
                          value={item.base_price}
                          onChange={(e) => updateItem(index, 'base_price', e.target.value)}
                          placeholder="10000"
                          className={`w-full pl-8 pr-4 py-2 bg-white border rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all ${
                            err('base_price') ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
                          }`}
                        />
                      </div>
                      {err('base_price') && <p className="text-xs text-rose-500 mt-1">{err('base_price')}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Quantity <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all"
                      />
                      {err('quantity') && <p className="text-xs text-rose-500 mt-1">{err('quantity')}</p>}
                    </div>
                  </div>

                  {/* GST Rate Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      GST Rate (%)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {GST_SLABS.map((slab) => (
                        <button
                          key={slab}
                          type="button"
                          onClick={() => updateItem(index, 'gst_percentage', slab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            Number(item.gst_percentage) === slab
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {slab}%
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-xs text-slate-500 font-medium">Custom:</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={item.gst_percentage}
                          onChange={(e) => updateItem(index, 'gst_percentage', e.target.value)}
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-center text-slate-900 focus:outline-none focus:border-emerald-500"
                        />
                        <span className="text-xs font-semibold text-slate-500">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Live calculation for this item */}
                  <div className="grid grid-cols-3 gap-2 p-3 bg-white/80 rounded-xl border border-emerald-100 text-center">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">Total Base</span>
                      <p className="text-sm font-bold text-slate-800">{formatINR(calc.totalBase)}</p>
                    </div>
                    <div className="border-x border-emerald-100">
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase">GST Amount</span>
                      <p className="text-sm font-bold text-emerald-700">+{formatINR(calc.gstAmount)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-900 uppercase">Item Total</span>
                      <p className="text-sm font-extrabold text-emerald-700">{formatINR(calc.finalPrice)}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {!isEditing && (
              <button
                type="button"
                onClick={addItem}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-2xl text-sm font-semibold text-emerald-700 bg-emerald-50/30 hover:bg-emerald-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Add another item from this vendor
              </button>
            )}

            {/* Whole-bill total */}
            {!isEditing && items.length > 1 && (
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-900 rounded-2xl text-center text-white">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Bill Base</span>
                  <p className="text-sm font-bold">{formatINR(billTotals.totalBase)}</p>
                </div>
                <div className="border-x border-slate-700">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase">Total GST</span>
                  <p className="text-sm font-bold text-emerald-400">+{formatINR(billTotals.gstAmount)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-300 uppercase">Bill Total</span>
                  <p className="text-sm font-extrabold">{formatINR(billTotals.finalPrice)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Notes / Warranty Details <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              rows={2}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="e.g. 2-year warranty included, purchased for home renovation..."
              className="w-full px-4 py-2.5 bg-slate-50/60 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Bill / Invoice Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Upload Bill / Invoice Image <span className="text-slate-400 font-normal">(optional, Max 10MB)</span>
            </label>
            
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl bg-slate-50/50 hover:bg-emerald-50/30 transition-all">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">
                  {file ? file.name : 'Choose receipt image or PDF...'}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {filePreview && (
                <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                  {filePreview === 'PDF_DOCUMENT' ? (
                    <FileText className="w-6 h-6 text-slate-600" />
                  ) : (
                    <img src={filePreview} alt="Receipt Preview" className="w-full h-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                    }}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
            {errors.file && <p className="text-xs text-rose-500 mt-1">{errors.file}</p>}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold shadow-sm shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isEditing ? 'Save Changes' : (items.length > 1 ? `Record ${items.length} Items` : 'Record Purchase')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
