import React, { useState } from 'react';
import { 
  Download, 
  PlusCircle, 
  Calendar, 
  RotateCcw,
  Sparkles,
  Search
} from 'lucide-react';
import { PurchaseList } from '../components/PurchaseList';
import { formatINR } from '../utils/formatters';

export const PurchasesPage = ({
  purchases,
  loading,
  filters,
  onFilterChange,
  onOpenAddModal,
  onViewDetails,
  onEdit,
  onDelete,
  onExportCsv
}) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const totalFilteredValue = purchases.reduce((sum, item) => sum + (item.total_amount || 0), 0);
  const totalFilteredGst = purchases.reduce((sum, item) => sum + (item.gst_amount || 0), 0);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    onFilterChange({
      category: 'All',
      search: '',
      startDate: '',
      endDate: '',
      sortBy: 'newest'
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Purchase History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage, filter, and inspect all your daily recorded purchases
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-all shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Purchase
          </button>
        </div>
      </div>

      {/* Filter and Date Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by product, shop, invoice, notes..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Date Range Start & End */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
                className="bg-transparent text-slate-700 focus:outline-none"
                title="Start Date"
              />
            </div>
            <span className="text-slate-400 font-medium">to</span>
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
                className="bg-transparent text-slate-700 focus:outline-none"
                title="End Date"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Filter
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Dynamic Summary Stats for current filtered list */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            Showing <strong className="text-slate-800">{purchases.length}</strong> purchase{purchases.length === 1 ? '' : 's'}
            {filters.category && filters.category !== 'All' && <span> in <strong className="text-slate-800">{filters.category}</strong></span>}
            {filters.search && <span> matching "<strong className="text-slate-800">{filters.search}</strong>"</span>}
          </div>
          <div className="flex items-center gap-4">
            <span>GST: <strong className="text-emerald-700 font-bold">{formatINR(totalFilteredGst)}</strong></span>
            <span className="border-l border-slate-200 pl-4">Total: <strong className="text-slate-900 font-extrabold">{formatINR(totalFilteredValue)}</strong></span>
          </div>
        </div>
      </div>

      {/* Purchases List Table / Grid */}
      <PurchaseList
        purchases={purchases}
        loading={loading}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        filters={filters}
        onFilterChange={onFilterChange}
        showControls={true}
      />
    </div>
  );
};
