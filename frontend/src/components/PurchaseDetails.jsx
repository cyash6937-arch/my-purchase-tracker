import React from 'react';
import { X, Calendar, Store, FileText, Tag, Receipt, Download, Edit3, Trash2, ExternalLink } from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';

export const PurchaseDetails = ({ purchase, onClose, onEdit, onDelete }) => {
  if (!purchase) return null;

  const isPdf = purchase.invoice_url && purchase.invoice_url.toLowerCase().endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                {purchase.category}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 leading-snug">
                {purchase.product_name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Main Price Breakdown Card */}
          <div className="p-5 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 rounded-2xl border border-emerald-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Final Amount
                </span>
                <div className="text-3xl font-extrabold text-slate-900 mt-0.5">
                  {formatINR(purchase.total_amount)}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Quantity: <strong className="text-slate-700">{purchase.quantity}</strong> unit{purchase.quantity > 1 ? 's' : ''}
                </p>
              </div>

              <div className="sm:text-right space-y-1 text-sm bg-white/70 p-3 rounded-xl border border-emerald-100">
                <div className="flex sm:justify-end gap-3 text-xs text-slate-600">
                  <span>Base Price (₹{Number(purchase.base_price).toLocaleString('en-IN')} × {purchase.quantity}):</span>
                  <span className="font-semibold text-slate-900">{formatINR(purchase.base_price * purchase.quantity)}</span>
                </div>
                <div className="flex sm:justify-end gap-3 text-xs text-emerald-700">
                  <span>GST ({purchase.gst_percentage}%):</span>
                  <span className="font-bold">+{formatINR(purchase.gst_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Store className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Shop / Vendor</span>
                <p className="text-sm font-bold text-slate-800">{purchase.vendor_name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Calendar className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Purchase Date</span>
                <p className="text-sm font-bold text-slate-800">{formatDate(purchase.purchase_date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <FileText className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bill / Invoice No.</span>
                <p className="text-sm font-bold text-slate-800">{purchase.invoice_number || 'Not Specified'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <Tag className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</span>
                <p className="text-sm font-bold text-slate-800">{purchase.category}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Notes & Additional Details
              </span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{purchase.notes}</p>
            </div>
          )}

          {/* Invoice / Bill Attachment Preview */}
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Attached Invoice / Receipt
            </span>
            {purchase.invoice_url ? (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col gap-3">
                {isPdf ? (
                  <div className="p-6 flex flex-col items-center justify-center bg-white rounded-xl border border-slate-200">
                    <FileText className="w-12 h-12 text-rose-500 mb-2" />
                    <span className="text-sm font-semibold text-slate-800">PDF Invoice Document</span>
                  </div>
                ) : (
                  <div className="relative max-h-72 rounded-xl overflow-hidden bg-slate-900/5 flex items-center justify-center border border-slate-200">
                    <img
                      src={purchase.invoice_url}
                      alt="Invoice Receipt"
                      className="w-full h-auto max-h-72 object-contain"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2">
                  <a
                    href={purchase.invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                  </a>
                  <a
                    href={purchase.invoice_url}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-all shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs">
                No bill or invoice image attached to this purchase.
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <button
            onClick={() => onDelete(purchase)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Purchase
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(purchase)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Edit3 className="w-4 h-4" /> Edit Purchase
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
