import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { PurchasesPage } from './pages/PurchasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { PurchaseModal } from './components/PurchaseModal';
import { PurchaseDetails } from './components/PurchaseDetails';
import { ConfirmDialog } from './components/ConfirmDialog';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [purchases, setPurchases] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    category: 'All',
    vendor: '',
    startDate: '',
    endDate: '',
    sortBy: 'newest',
    search: '',
  });

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [purchaseToEdit, setPurchaseToEdit] = useState(null);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Dashboard Summary
  const loadDashboard = async () => {
    try {
      const res = await api.getDashboardSummary();
      if (res.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    }
  };

  // Load Purchases list
  const loadPurchases = async () => {
    try {
      setLoading(true);
      const res = await api.getPurchases(filters);
      if (res.success) {
        setPurchases(res.data);
      }
    } catch (err) {
      console.error('Failed to load purchases:', err);
      showToast('Error loading purchases', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [filters]);

  // Handle Save (Add or Update)
  const handleSavePurchase = async (formData, editId) => {
    if (editId) {
      await api.updatePurchase(editId, formData);
      showToast('Purchase updated successfully!');
    } else {
      await api.createPurchase(formData);
      showToast('New purchase recorded successfully!');
    }
    // Refresh data
    loadPurchases();
    loadDashboard();
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!purchaseToDelete) return;
    try {
      await api.deletePurchase(purchaseToDelete.id);
      showToast('Purchase deleted successfully');
      setPurchaseToDelete(null);
      if (selectedPurchase?.id === purchaseToDelete.id) {
        setSelectedPurchase(null);
      }
      loadPurchases();
      loadDashboard();
    } catch (err) {
      showToast('Failed to delete purchase', 'error');
    }
  };

  // Search apply from top search bar
  const handleApplySearch = (query) => {
    setFilters(prev => ({ ...prev, search: query }));
    setActiveTab('purchases');
  };

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setPurchaseToEdit(null);
          setIsAddEditOpen(true);
        }}
      />

      {/* Main App Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            summaryData={dashboardData}
            recentPurchases={dashboardData?.recent_purchases || []}
            onOpenAddModal={() => {
              setPurchaseToEdit(null);
              setIsAddEditOpen(true);
            }}
            onViewDetails={(item) => setSelectedPurchase(item)}
            onEdit={(item) => {
              setPurchaseToEdit(item);
              setIsAddEditOpen(true);
            }}
            onDelete={(item) => setPurchaseToDelete(item)}
            onNavigateToHistory={() => setActiveTab('purchases')}
            onApplySearch={handleApplySearch}
          />
        )}

        {activeTab === 'purchases' && (
          <PurchasesPage
            purchases={purchases}
            loading={loading}
            filters={filters}
            onFilterChange={setFilters}
            onOpenAddModal={() => {
              setPurchaseToEdit(null);
              setIsAddEditOpen(true);
            }}
            onViewDetails={(item) => setSelectedPurchase(item)}
            onEdit={(item) => {
              setPurchaseToEdit(item);
              setIsAddEditOpen(true);
            }}
            onDelete={(item) => setPurchaseToDelete(item)}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage
            onViewDetails={(item) => setSelectedPurchase(item)}
            onExportCsv={handleExportCsv}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 <strong>My Purchase Tracker</strong>. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed for Indian GST compliance & daily personal/business bookkeeping.
          </p>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <PurchaseModal
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setPurchaseToEdit(null);
        }}
        onSave={handleSavePurchase}
        purchaseToEdit={purchaseToEdit}
      />

      <PurchaseDetails
        purchase={selectedPurchase}
        onClose={() => setSelectedPurchase(null)}
        onEdit={(p) => {
          setSelectedPurchase(null);
          setPurchaseToEdit(p);
          setIsAddEditOpen(true);
        }}
        onDelete={(p) => {
          setPurchaseToDelete(p);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(purchaseToDelete)}
        onClose={() => setPurchaseToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Purchase"
        message="Are you sure you want to permanently delete this purchase record?"
        itemName={purchaseToDelete?.product_name}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-800'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
