import React, { useState } from 'react';
import { 
  Eye, 
  Edit2, 
  Trash2, 
  LayoutGrid, 
  Table as TableIcon, 
  Calendar, 
  Store, 
  Paperclip,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

const CATEGORIES = [
  'All',
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

export const PurchaseList = ({
  purchases = [],
  loading = false,
  onViewDetails,
  onEdit,
  onDelete,
  filters = {},
  onFilterChange,
  showControls = true
}) => {
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      {showControls && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Category Filter Pills / Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Category:
            </span>
            <select
              value={filters.category || 'All'}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date range & Sorting & View Mode */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="newest">Date: Newest First</option>
                <option value="oldest">Date: Oldest First</option>
                <option value="price_high">Price: High to Low</option>
                <option value="price_low">Price: Low to High</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>

            {/* Layout Toggle Button */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'grid' ? 'bg-white text-emerald-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 mt-2 font-medium">Loading purchase records...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && purchases.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No purchases found</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, clear active filters, or record a new purchase using the "Add Purchase" button.
          </p>
        </div>
      )}

      {/* Grid Cards View */}
      {!loading && purchases.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchases.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(item.purchase_date)}
                  </span>
                </div>

                <h4
                  onClick={() => onViewDetails(item)}
                  className="mt-3 text-base font-bold text-slate-900 line-clamp-1 group-hover:text-emerald-600 cursor-pointer transition-colors"
                >
                  {item.product_name}
                </h4>

                <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{item.vendor_name}</span>
                  {item.invoice_url && (
                    <span className="inline-flex items-center gap-0.5 text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                      <Paperclip className="w-2.5 h-2.5" /> Bill
                    </span>
                  )}
                </div>

                {/* Price breakdown pill */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Base ({formatINR(item.base_price)} × {item.quantity}):</span>
                    <span>{formatINR(item.base_price * item.quantity)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>GST ({item.gst_percentage}%):</span>
                    <span>+{formatINR(item.gst_amount)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-1 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Amount:</span>
                    <span className="text-emerald-700">{formatINR(item.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onViewDetails(item)}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Details
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View */}
      {!loading && purchases.length > 0 && viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-3">Category</th>
                  <th className="py-3.5 px-3">Date</th>
                  <th className="py-3.5 px-3 text-center">Qty</th>
                  <th className="py-3.5 px-3 text-right">Base Price</th>
                  <th className="py-3.5 px-3 text-right">GST</th>
                  <th className="py-3.5 px-3 text-right font-extrabold text-slate-900">Total Price</th>
                  <th className="py-3.5 px-3">Shop / Vendor</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {purchases.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => onViewDetails(item)}
                  >
                    {/* Product */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {item.product_name}
                        </span>
                        {item.invoice_url && (
                          <span
                            title="Invoice Attached"
                            className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          >
                            <Paperclip className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      {item.invoice_number && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          Bill: {item.invoice_number}
                        </span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 whitespace-nowrap">
                        {item.category}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3 text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(item.purchase_date)}
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-3 text-center text-xs text-slate-700">
                      {item.quantity}
                    </td>

                    {/* Base Price */}
                    <td className="py-3.5 px-3 text-right text-xs text-slate-600 whitespace-nowrap">
                      {formatINR(item.base_price * item.quantity)}
                    </td>

                    {/* GST */}
                    <td className="py-3.5 px-3 text-right text-xs whitespace-nowrap">
                      <span className="text-emerald-700 font-semibold">{formatINR(item.gst_amount)}</span>
                      <span className="text-[10px] text-slate-400 block font-normal">({item.gst_percentage}%)</span>
                    </td>

                    {/* Total Price */}
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(item.total_amount)}
                    </td>

                    {/* Vendor */}
                    <td className="py-3.5 px-3 text-xs text-slate-600 truncate max-w-[130px]">
                      {item.vendor_name}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewDetails(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
