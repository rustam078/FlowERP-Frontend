import axiosInstance from '../../../services/axios';

const productService = {
  searchProducts: async (keyword) => {
    const response = await axiosInstance.get('/products/search', {
      params: { keyword },
    });
    return response.data;
  },

  getProductStock: async (productId) => {
    const response = await axiosInstance.get(`/products/${productId}/stock`);
    return response.data;
  },
  getInventoryProducts: async (page = 0, size = 100) => {
    const response = await axiosInstance.get('/inventory', {
      params: { page, size },
    });
    // return list of products (content) or whole response as fallback
    return response.data?.content || response.data;
  },

  // FIFO-ordered available batches with their effective selling price (for live sale pricing).
  getSaleBatches: async (productId) => {
    const response = await axiosInstance.get(`/inventory/product/${productId}/sale-batches`);
    return response.data || [];
  },
};

export default productService;
