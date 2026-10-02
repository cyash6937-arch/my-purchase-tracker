import React from 'react';
import { 
  IndianRupee, 
  ReceiptText, 
  ShoppingBag, 
  CalendarDays, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { SmartSearchBar } from '../components/SmartSearchBar';
import { MonthlySpendingChart, CategorySpendingChart } from '../components/SpendingChart';
import { PurchaseList } from '../components/PurchaseList';
import { formatINR } from '../utils/formatters';

export const Dashboard = ({
  summaryData,
  recentPurchases,
  onOpenAddModal,
  onViewDetails,
  onEdit,
  onDelete,
  onNavigateToHistory,
  onApplySearch
}) => {
  const summary = summaryData?.summary || {};
  const categorySpending = summaryData?.category_spending || [];
  const monthlySpending = summaryData?.monthly_spending || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero & Top Search Bar */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background decorative circles */}
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" /> Track Purchases • Manage GST • Instant Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Track Every Rupee, Simplify Your GST
          </h1>
          <p className="mt-1.5 text-sm sm:text-base text-emerald-100/80">
            Quickly search any previous purchase, inspect bills, or record your daily expenses in seconds.
          </p>

          {/* Prominent Smart Search Bar */}
          <div className="mt-6">
            <SmartSearchBar
              onSelectPurchase={onViewDetails}
              onApplySearch={onApplySearch}
            />
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Spent"
          value={formatINR(summary.total_spent)}
          subtitle="Net lifetime purchases"
          icon={IndianRupee}
          color="emerald"
        />
        <StatCard
          title="Total GST Paid"
          value={formatINR(summary.total_gst)}
          subtitle="Input tax claimable"
          icon={ReceiptText}
          color="blue"
        />
        <StatCard
          title="This Month"
          value={formatINR(summary.current_month_spent)}
          subtitle={`${summary.current_month_purchases || 0} purchase(s) this month`}
          icon={CalendarDays}
          color="purple"
        />
        <StatCard
          title="Purchases"
          value={summary.total_purchases || 0}
          subtitle="Recorded transactions"
          icon={ShoppingBag}
          color="amber"
        />
        <StatCard
          title="Total Products"
          value={summary.total_products || 0}
          subtitle="Total quantity units"
          icon={ShieldCheck}
          color="rose"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Spending & GST Trend</h3>
              <p className="text-xs text-slate-500">Monthly total expenditure and GST breakdown</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> By Month
            </span>
          </div>
          <MonthlySpendingChart monthlyData={monthlySpending} />
        </div>

        {/* Category Breakdown Donut */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900">Category Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution of your expenses</p>
          </div>
          <CategorySpendingChart categoryData={categorySpending} />
        </div>
      </div>

      {/* Recent Purchases Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Purchases</h3>
            <p className="text-xs text-slate-500">Your latest recorded products and bills</p>
          </div>
          <button
            onClick={onNavigateToHistory}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 hover:underline"
          >
            View all history <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <PurchaseList
          purchases={recentPurchases}
          onViewDetails={onViewDetails}
          onEdit={onEdit}
          onDelete={onDelete}
          showControls={false}
        />
      </div>
    </div>
  );
};
