const API_BASE = '/api';

export const erpApi = {
  // Companies
  getCompanies: () => fetch(`${API_BASE}/companies`).then(res => res.json()),
  createCompany: (data: any) => fetch(`${API_BASE}/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Customers
  getCustomers: (companyId: number) => fetch(`${API_BASE}/customers/${companyId}`).then(res => res.json()),
  createCustomer: (data: any) => fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Vendors
  getVendors: (companyId: number) => fetch(`${API_BASE}/vendors/${companyId}`).then(res => res.json()),
  createVendor: (data: any) => fetch(`${API_BASE}/vendors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Products
  getProducts: (companyId: number) => fetch(`${API_BASE}/products/${companyId}`).then(res => res.json()),
  createProduct: (data: any) => fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateProduct: (id: number, data: any) => fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Invoices
  getInvoices: (companyId: number) => fetch(`${API_BASE}/invoices/${companyId}`).then(res => res.json()),
  getInvoiceDetails: (id: number) => fetch(`${API_BASE}/invoices/details/${id}`).then(res => res.json()),
  createInvoice: (data: any) => fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Purchases
  getPurchases: (companyId: number) => fetch(`${API_BASE}/purchases/${companyId}`).then(res => res.json()),
  getPurchaseItems: (purchaseId: number) => fetch(`${API_BASE}/purchase-items/${purchaseId}`).then(res => res.json()),
  createPurchase: (data: any) => fetch(`${API_BASE}/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),

  // Stats
  getStats: (companyId: number) => fetch(`${API_BASE}/stats/${companyId}`).then(res => res.json()),

  // Transactions
  getTransactions: (companyId: number) => fetch(`${API_BASE}/transactions/${companyId}`).then(res => res.json()),

  // Imports
  getImports: (companyId: number) => fetch(`${API_BASE}/imports/${companyId}`).then(res => res.json()),
  importFile: (formData: FormData) => fetch(`${API_BASE}/import`, {
    method: 'POST',
    body: formData
  }).then(res => res.json()),

  // Bookings
  getBookings: (companyId: number) => fetch(`${API_BASE}/bookings/${companyId}`).then(res => res.json()),
  createBooking: (data: any) => fetch(`${API_BASE}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  deleteBooking: (id: number) => fetch(`${API_BASE}/bookings/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // Repairs
  getRepairs: (companyId: number) => fetch(`${API_BASE}/repairs/${companyId}`).then(res => res.json()),
  createRepair: (data: any) => fetch(`${API_BASE}/repairs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(res => res.json()),
  updateRepairStatus: (id: number, status: string) => fetch(`${API_BASE}/repairs/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }).then(res => res.json()),
  deleteRepair: (id: number) => fetch(`${API_BASE}/repairs/${id}`, {
    method: 'DELETE'
  }).then(res => res.json()),

  // AI assistant
  askAI: (companyId: number, message: string) => fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id: companyId, message })
  }).then(res => res.json()),
};
