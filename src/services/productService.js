import axiosInstance from './axios';

// Absolute API base for building <img src> URLs (image GET is public on the backend).
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Service to handle product and piece code endpoints.
 * 
 * NOTE: Rate-based methods (getCurrentRate, getRates, createRate, getRateByDate)
 * are DEPRECATED — the system has migrated to Piece Code based pricing.
 * They are kept here only for reference during migration.
 */
export const productService = {
  /**
   * Fetch all products.
   * GET /api/products
   */
  getProducts: async () => {
    const response = await axiosInstance.get('/products');
    return response.data;
  },

  /**
   * Fetch a single product by ID.
   * GET /api/products/{productId}
   */
  getProductById: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}`);
    return response.data;
  },

  /**
   * Create a new product.
   * POST /api/products
   */
  createProduct: async (product) => {
    const response = await axiosInstance.post('/products', product);
    return response.data;
  },

  // Turn a purchased-only product into BOTH by adding piece codes + cost/selling price.
  enableManufacturing: async (productId, body) => {
    const response = await axiosInstance.post(`/products/${productId}/enable-manufacturing`, body);
    return response.data;
  },

  /**
   * Toggle product active/inactive status.
   * PATCH /api/products/{productId}/status
   */
  updateProductStatus: async (productId, active) => {
    const response = await axiosInstance.patch(`/products/${productId}/status`, { active });
    return response.data;
  },

  /**
   * Delete a product.
   * DELETE /api/products/{productId}
   * Returns { success: boolean, message: string, timestamp: string }
   */
  deleteProduct: async (productId) => {
    const response = await axiosInstance.delete(`/products/${productId}`);
    return response.data;
  },

  // ─────────────────────────────────────────────
  // PIECE CODE METHODS (new pricing system)
  // ─────────────────────────────────────────────

  /**
   * Fetch all piece codes for a product.
   * GET /api/products/{productId}/piece-codes
   */
  getPieceCodes: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/piece-codes`);
    return response.data;
  },

  /**
   * Fetch only active piece codes for a product (for production form dropdown).
   * GET /api/products/{productId}/piece-codes/active
   */
  getActivePieceCodes: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/piece-codes/active`);
    return response.data;
  },

  /**
   * Create a new piece code for a product.
   * POST /api/products/{productId}/piece-codes
   * Body: { code: string, rate: number, description?: string }
   */
  createPieceCode: async (productId, data) => {
    const response = await axiosInstance.post(`/products/${productId}/piece-codes`, data);
    return response.data;
  },

  /**
   * Toggle piece code active/inactive status.
   * PATCH /api/piece-codes/{pieceCodeId}/status
   */
  updatePieceCodeStatus: async (pieceCodeId, active) => {
    const response = await axiosInstance.patch(
      `/piece-codes/${pieceCodeId}/status`,
      { active }
    );
    return response.data;
  },

  /**
   * Delete a piece code (only if it has never been used in production).
   * DELETE /api/piece-codes/{pieceCodeId}
   */
  deletePieceCode: async (pieceCodeId) => {
    const response = await axiosInstance.delete(`/piece-codes/${pieceCodeId}`);
    return response.data;
  },

  // ─────────────────────────────────────────────
  // DEPRECATED — Date-wise Rate Methods
  // Kept for backward compatibility only. Do NOT use in new code.
  // ─────────────────────────────────────────────

  /** @deprecated Use piece codes instead */
  getCurrentRate: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/rate`);
    return response.data;
  },

  /** @deprecated Use piece codes instead */
  getRates: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/rates`);
    return response.data;
  },

  /** @deprecated Use piece codes instead */
  createRate: async (productId, rateData) => {
    const response = await axiosInstance.post(`/products/${productId}/rates`, rateData);
    return response.data;
  },

  /** @deprecated Use piece codes instead */
  getRateByDate: async (productId, date) => {
    const response = await axiosInstance.get(`/products/${productId}/rate`, { params: { date } });
    return response.data;
  },

  createMaterialCost: async (productId, data) => {
    const response = await axiosInstance.post(
      `/product-material-cost/${productId}`,
      data
    );

    return response.data;
  },

  getMaterialCosts: async (productId) => {
    const response = await axiosInstance.get(
      `/product-material-cost/${productId}`
    );
    return response.data;
  },

  createMaterialCost: async (productId, data) => {
    const response = await axiosInstance.post(
      `/product-material-cost/${productId}`,
      data
    );
    return response.data;
  },

  updateMaterialCost: async (id, data) => {
    const response = await axiosInstance.put(
      `/product-material-cost/${id}`,
      data
    );
    return response.data;
  },

  deleteMaterialCost: async (id) => {
    const response = await axiosInstance.delete(
      `/product-material-cost/${id}`
    );
    return response.data;
  },

  // ─────────────────────────────────────────────
  // PRODUCT IMAGE (optional, one per product)
  // ─────────────────────────────────────────────

  /** Upload/replace the product's image. POST /api/products/{id}/image (multipart). */
  uploadImage: async (productId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    // Content-Type undefined → the browser sets multipart/form-data with the boundary.
    const response = await axiosInstance.post(`/products/${productId}/image`, fd, {
      headers: { 'Content-Type': undefined },
    });
    return response.data;
  },

  /** Remove the product's image. DELETE /api/products/{id}/image */
  deleteImage: async (productId) => {
    const response = await axiosInstance.delete(`/products/${productId}/image`);
    return response.data;
  },

  /** Public URL for the product image (usable directly in <img src>). */
  imageUrl: (productId, cacheBust) =>
    `${API_BASE}/products/${productId}/image${cacheBust ? `?t=${cacheBust}` : ''}`,

  /** Per-source stock totals (purchase + production) for the detail cards. */
  getStockSummary: async (productId) => {
    const response = await axiosInstance.get(`/inventory/product/${productId}/stock-summary`);
    return response.data;
  },

  /** Paged stock receipts (batches) for a product, with optional date/status filters. */
  getProductBatches: async (productId, params) => {
    const response = await axiosInstance.get(`/inventory/product/${productId}/batches`, { params });
    return response.data;
  },
};

export default productService;