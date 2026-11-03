const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchJson<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // If running in browser and we have a token stored in localStorage (backup for cross-domain)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sahayata_auth_token');
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // Include HTTP-only cookies
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  register: (payload: any) => fetchJson('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload: any) => fetchJson('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => fetchJson('/auth/logout', { method: 'POST' }),
  getMe: () => fetchJson('/auth/me'),
  updateProfile: (payload: any) => fetchJson('/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),

  // Schemes
  getSchemes: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    return fetchJson(`/schemes${query ? `?${query}` : ''}`);
  },
  getSchemeById: (id: string) => fetchJson(`/schemes/${id}`),
  createScheme: (payload: any) => fetchJson('/schemes', { method: 'POST', body: JSON.stringify(payload) }),
  updateScheme: (id: string, payload: any) => fetchJson(`/schemes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteScheme: (id: string) => fetchJson(`/schemes/${id}`, { method: 'DELETE' }),
  generateSchemeSummary: (id: string, noticeText?: string) =>
    fetchJson(`/schemes/${id}/generate-summary`, { method: 'POST', body: JSON.stringify({ noticeText }) }),
  generateAiSummary: (id: string, noticeText?: string) =>
    fetchJson(`/schemes/${id}/generate-summary`, { method: 'POST', body: JSON.stringify({ noticeText }) }),
  approveSchemeSummary: (id: string, payload: any) =>
    fetchJson(`/schemes/${id}/approve`, { method: 'POST', body: JSON.stringify(payload) }),
  publishScheme: (id: string, published: boolean) =>
    fetchJson(`/schemes/${id}/publish`, { method: 'POST', body: JSON.stringify({ published }) }),

  // Eligibility
  checkEligibility: (facts: any) => fetchJson('/eligibility/check', { method: 'POST', body: JSON.stringify(facts) }),
  parseNaturalQuery: (query: string) =>
    fetchJson('/eligibility/parse-query', { method: 'POST', body: JSON.stringify({ query }) }),
  requestHelpCallback: (payload: any) =>
    fetchJson('/eligibility/callback', { method: 'POST', body: JSON.stringify(payload) }),

  // Campaigns
  getCampaigns: (status?: string) => fetchJson(`/campaigns${status ? `?status=${status}` : ''}`),
  getCampaignById: (id: string) => fetchJson(`/campaigns/${id}`),
  createCampaign: (payload: any) => fetchJson('/campaigns', { method: 'POST', body: JSON.stringify(payload) }),
  updateCampaign: (id: string, payload: any) => fetchJson(`/campaigns/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Donations
  createDonation: (payload: any) => fetchJson('/donations', { method: 'POST', body: JSON.stringify(payload) }),
  mockPayment: (id: string, payload: any) =>
    fetchJson(`/donations/${id}/mock-payment`, { method: 'POST', body: JSON.stringify(payload) }),
  getMyDonations: () => fetchJson('/donations/my'),
  getDonationById: (id: string) => fetchJson(`/donations/${id}`),

  // Receipts
  getMyReceipts: () => fetchJson('/receipts/my'),
  getReceiptById: (id: string) => fetchJson(`/receipts/${id}`),
  getReceiptDownloadUrl: (id: string) => `${API_BASE_URL}/receipts/${id}/download`,
  getCertificateDownloadUrl: (id: string) => `${API_BASE_URL}/receipts/${id}/certificate`,
  retryPdfGeneration: (id: string) => fetchJson(`/receipts/${id}/retry`, { method: 'POST' }),

  // Admin
  getAdminDashboard: () => fetchJson('/admin/dashboard'),
  getAdminDonations: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params || {}).toString();
    return fetchJson(`/admin/donations${query ? `?${query}` : ''}`);
  },
  getForm10BDExportUrl: (fy?: string) => `${API_BASE_URL}/admin/reports/form-10bd/export${fy ? `?financialYear=${fy}` : ''}`,
  getAuditLogs: () => fetchJson('/admin/audit-logs'),
};
