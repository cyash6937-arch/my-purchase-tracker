const BASE_URL = '/api';

export const api = {
  // Purchases
  async getPurchases(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${BASE_URL}/purchases?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load purchases');
    return res.json();
  },

  async getPurchaseById(id) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`);
    if (!res.ok) throw new Error('Failed to fetch purchase');
    return res.json();
  },

  async createPurchase(formData) {
    const res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      body: formData, // FormData handles multipart/form-data for file uploads
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create purchase');
    return data;
  },

  async updatePurchase(id, formData) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'PUT',
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update purchase');
    return data;
  },

  async deletePurchase(id) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete purchase');
    return data;
  },

  async getCategories() {
    const res = await fetch(`${BASE_URL}/purchases/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Reports & Dashboard
  async getDashboardSummary() {
    const res = await fetch(`${BASE_URL}/reports/summary`);
    if (!res.ok) throw new Error('Failed to load dashboard summary');
    return res.json();
  },

  async getAnalytics(year) {
    const param = year ? `?year=${year}` : '';
    const res = await fetch(`${BASE_URL}/reports/analytics${param}`);
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  getExportCsvUrl() {
    return `${BASE_URL}/reports/export-csv`;
  },

  // Smart Search
  async search(query) {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  }
};
