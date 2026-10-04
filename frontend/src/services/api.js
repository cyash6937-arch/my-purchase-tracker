const BASE_URL = '/api';

/**
 * Get authentication headers from current user in localStorage
 */
export function getAuthHeaders() {
  const headers = {};
  try {
    const raw = localStorage.getItem('mpt_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user.id) headers['x-user-id'] = user.id;
      if (user.email) headers['x-user-email'] = user.email;
      if (user.phone) headers['x-user-phone'] = user.phone;
      if (user.name) headers['x-user-name'] = user.name;
    }
  } catch (e) {
    console.error('Error reading auth headers:', e);
  }
  return headers;
}

export const api = {
  // Sync user profile on login
  async syncUser(user) {
    const res = await fetch(`${BASE_URL}/auth/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to sync user');
    return data;
  },

  // Purchases
  async getPurchases(filters = {}) {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.vendor) params.append('vendor', filters.vendor);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.search) params.append('search', filters.search);

    const res = await fetch(`${BASE_URL}/purchases?${params.toString()}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to load purchases');
    return res.json();
  },

  async getPurchaseById(id) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to fetch purchase');
    return res.json();
  },

  async createPurchase(formData) {
    const res = await fetch(`${BASE_URL}/purchases`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders()
      },
      body: formData, // FormData handles multipart/form-data boundary
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create purchase');
    return data;
  },

  async updatePurchase(id, formData) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders()
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update purchase');
    return data;
  },

  async deletePurchase(id) {
    const res = await fetch(`${BASE_URL}/purchases/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders()
      }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete purchase');
    return data;
  },

  async getCategories() {
    const res = await fetch(`${BASE_URL}/purchases/categories`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Reports & Dashboard
  async getDashboardSummary() {
    const res = await fetch(`${BASE_URL}/reports/summary`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to load dashboard summary');
    return res.json();
  },

  async getAnalytics(year) {
    const param = year ? `?year=${year}` : '';
    const res = await fetch(`${BASE_URL}/reports/analytics${param}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to load analytics');
    return res.json();
  },

  async downloadCsv() {
    const res = await fetch(`${BASE_URL}/reports/export-csv`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Failed to download CSV export');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Smart Search
  async search(query) {
    const res = await fetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`, {
      headers: {
        ...getAuthHeaders()
      }
    });
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  }
};
