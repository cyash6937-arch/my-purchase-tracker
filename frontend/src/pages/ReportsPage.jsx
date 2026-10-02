import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  Store, 
  Receipt, 
  Download,
  Calendar,
  Layers
} from 'lucide-react';
import { formatINR, formatDate } from '../utils/formatters';
import { api } from '../services/api';

export const ReportsPage = ({ onViewDetails, onExportCsv }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics(selectedYear);
        if (res.success) {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear]);

  if (loading || !analytics) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500 mt-2 font-medium">Generating financial analytics...</p>
      </div>
    );
  }

  const { daily, yearly, gst_slabs, highest_purchases, top_vendors } = analytics;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detailed insights into your expenses, tax claims, and spending distribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export Tax Records (CSV)
          </button>
        </div>
      </div>

      {/* GST Slabs Breakdown */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">GST Paid by Tax Slab</h3>
            <p className="text-xs text-slate-500">Tax paid according to statutory Indian GST brackets (0%, 5%, 12%, 18%, 28%)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {gst_slabs.map((slab) => (
            <div key={slab.gst_percentage} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-blue-100/80 text-blue-800">
                  {slab.gst_percentage}% GST
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {slab.purchase_count} item{slab.purchase_count > 1 ? 's' : ''}
                </span>
              </div>
              <div className="mt-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">GST Amount</span>
                <p className="text-base font-extrabold text-blue-700">{formatINR(slab.total_gst_collected)}</p>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Volume: {formatINR(slab.total_sales_volume)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Highest Value Purchases & Top Vendors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Highest-value purchases */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Highest-Value Purchases</h3>
                <p className="text-xs text-slate-500">Top individual transactions</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {highest_purchases.slice(0, 5).map((p, idx) => (
                <div
                  key={p.id}
                  onClick={() => onViewDetails(p)}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/80 px-2 rounded-xl cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-emerald-600">
                        {p.product_name}
                      </p>
                      <span className="text-[11px] text-slate-400">
                        {p.vendor_name} • {formatDate(p.purchase_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 block">{formatINR(p.total_amount)}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">GST: {formatINR(p.gst_amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Vendors */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Top Shops & Vendors</h3>
                <p className="text-xs text-slate-500">Vendors where you spend the most</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {top_vendors.slice(0, 5).map((v, idx) => (
                <div key={v.vendor_name} className="py-3 flex items-center justify-between px-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{v.vendor_name}</p>
                      <span className="text-[11px] text-slate-400">{v.count} transaction{v.count > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900">{formatINR(v.total_spent)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Spending Overview */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Yearly Spending Breakdown</h3>
            <p className="text-xs text-slate-500">Historical annual expenditures and GST totals</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-3">Year</th>
                <th className="py-2.5 px-3">Transactions</th>
                <th className="py-2.5 px-3 text-right">GST Paid</th>
                <th className="py-2.5 px-3 text-right">Total Expenditure</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {yearly.map((y) => (
                <tr key={y.year} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">{y.year}</td>
                  <td className="py-3 px-3 text-slate-600">{y.count}</td>
                  <td className="py-3 px-3 text-right text-emerald-700 font-bold">{formatINR(y.total_gst)}</td>
                  <td className="py-3 px-3 text-right text-slate-900 font-extrabold">{formatINR(y.total_spent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
