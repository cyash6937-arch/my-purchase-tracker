import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Sparkles, ArrowRight, TrendingUp, Calculator, Store, Calendar } from 'lucide-react';
import { formatINR } from '../utils/formatters';

export const SmartSearchBar = ({ onSelectPurchase, onApplySearch, currentQuery = '' }) => {
  const [query, setQuery] = useState(currentQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [smartInsight, setSmartInsight] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const quickPrompts = [
    { label: 'how much did I spend on electronics', icon: TrendingUp },
    { label: 'how much GST did I pay', icon: Calculator },
    { label: 'purchases from Amazon', icon: Store },
    { label: 'purchases in September', icon: Calendar },
  ];

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query if parent updates it
  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  // Debounced search call
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setSmartInsight(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSuggestions(data.results || []);
          setSmartInsight(data.smartInsight || null);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectQuery = (text) => {
    setQuery(text);
    if (onApplySearch) onApplySearch(text);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSmartInsight(null);
    setIsOpen(false);
    if (onApplySearch) onApplySearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplySearch) onApplySearch(query);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Search Input Bar */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder="Search products, shops, dates, categories... (e.g. 'purchases from Amazon', 'how much spent on electronics')"
            className="w-full pl-11 pr-24 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 text-sm md:text-base font-medium shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {loading && (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mr-1"></div>
            )}
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm"
            >
              Search
            </button>
          </div>
        </div>
      </form>

      {/* Quick Search Chips below input */}
      <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-500 scrollbar-none">
        <span className="flex items-center gap-1 text-slate-400 font-medium shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Try searching:
        </span>
        {quickPrompts.map((prompt, idx) => {
          const Icon = prompt.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuery(prompt.label)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-700 whitespace-nowrap transition-all shadow-2xs"
            >
              <Icon className="w-3 h-3 text-slate-400" />
              <span>"{prompt.label}"</span>
            </button>
          );
        })}
      </div>

      {/* Autocomplete / Smart Suggestions Dropdown */}
      {isOpen && (query.trim() || smartInsight) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Smart AI / NLP Insight Box */}
          {smartInsight && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-b border-emerald-100/60">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{smartInsight.headline}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">{smartInsight.detail}</p>
                </div>
              </div>
            </div>
          )}

          {/* Matches List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {suggestions.length > 0 ? (
              suggestions.slice(0, 6).map((purchase) => (
                <div
                  key={purchase.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (onSelectPurchase) onSelectPurchase(purchase);
                  }}
                  className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-emerald-600 transition-colors">
                      {purchase.product_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">{purchase.vendor_name}</span>
                      <span>•</span>
                      <span>{purchase.category}</span>
                      <span>•</span>
                      <span>{purchase.purchase_date}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-slate-900">
                      {formatINR(purchase.total_amount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      incl. {formatINR(purchase.gst_amount)} GST
                    </div>
                  </div>
                </div>
              ))
            ) : (
              !loading && (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No purchases found matching "{query}".
                </div>
              )
            )}
          </div>

          {suggestions.length > 6 && (
            <div className="p-2.5 bg-slate-50 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onApplySearch) onApplySearch(query);
                }}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1"
              >
                View all {suggestions.length} matching purchases <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
