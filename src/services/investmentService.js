import axiosInstance from './axios';
import { printPdfFromUrl } from '../utils/printPdf';

// ─────────────────────────────────────────
// VENDOR METHODS
// ─────────────────────────────────────────

export const vendorService = {
  /**
   * Fetch all vendors.
   * GET /api/vendors
   */
  getVendors: async () => {
    const response = await axiosInstance.get('/vendors');
    return response.data;
  },

  /**
   * Fetch a single vendor by ID.
   * GET /api/vendors/{id}
   */
  getVendorById: async (id) => {
    const response = await axiosInstance.get(`/vendors/${id}`);
    return response.data;
  },

  /**
   * Create a new vendor.
   * POST /api/vendors
   * Body: { name, gstNumber?, mobile?, email?, address?, status }
   */
  createVendor: async (data) => {
    const response = await axiosInstance.post('/vendors', data);
    return response.data;
  },

  /**
   * Update an existing vendor.
   * PUT /api/vendors/{id}
   */
  updateVendor: async (id, data) => {
    const response = await axiosInstance.put(`/vendors/${id}`, data);
    return response.data;
  },

  /**
   * Toggle vendor active/inactive status.
   * PATCH /api/vendors/{id}/status
   */
  toggleVendorStatus: async (id, active) => {
    const response = await axiosInstance.patch(`/vendors/${id}/status`, { active });
    return response.data;
  },
};

// ─────────────────────────────────────────
// INVESTMENT METHODS
// ─────────────────────────────────────────

export const investmentService = {
  /**
   * Fetch all investments (with optional filters).
   * GET /api/investments
   * Params: { fromDate?, toDate?, vendorId?, type?, search? }
   */
  getInvestments: async (params = {}) => {
    const response = await axiosInstance.get('/investments', { params });
    return response.data;
  },

  /**
   * Fetch a single investment by ID.
   * GET /api/investments/{id}
   */
  getInvestmentById: async (id) => {
    const response = await axiosInstance.get(`/investments/${id}`);
    return response.data;
  },

  /**
   * Create a new investment.
   * POST /api/investments
   * Body: { vendorId, type, purchaseDate, invoiceNumber?, referenceNumber?, remarks?, items[], subtotal, gst, discount, otherCharges, grandTotal }
   */
  createInvestment: async (data) => {
    const response = await axiosInstance.post('/investments', data);
    return response.data;
  },

  // ── Payments ──────────────────────────────
  // Add a payment against an invoice. Body: { paymentDate, mode, amount }
  addPayment: async (investmentId, data) => {
    const response = await axiosInstance.post(`/investments/${investmentId}/payments`, data);
    return response.data;
  },

  getPayments: async (investmentId) => {
    const response = await axiosInstance.get(`/investments/${investmentId}/payments`);
    return response.data;
  },

  // Vendor payment history: each payment grouped with its per-invoice allocation.
  getVendorPaymentHistory: async (vendorId) => {
    const response = await axiosInstance.get(`/investments/vendor/${vendorId}/payments`);
    return response.data;
  },

  deletePayment: async (investmentId, paymentId) => {
    const response = await axiosInstance.delete(`/investments/${investmentId}/payments/${paymentId}`);
    return response.data;
  },

  /**
   * Download the backend-generated purchase invoice PDF (HTML template based).
   * GET /api/investments/{id}/invoice/pdf
   */
  downloadInvoicePdf: async (investmentId, invoiceNumber) => {
    const response = await axiosInstance.get(`/investments/${investmentId}/invoice/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoiceNumber || `purchase-invoice-${investmentId}`}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Fetch the same invoice PDF and send it straight to the printer (hidden iframe).
   * GET /api/investments/{id}/invoice/pdf
   */
  printInvoicePdf: async (investmentId) => {
    const response = await axiosInstance.get(`/investments/${investmentId}/invoice/pdf`, {
      responseType: 'blob',
    });
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    printPdfFromUrl(url);
  },
};
