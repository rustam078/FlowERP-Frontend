import axiosInstance from '../../../services/axios';

const revenueService = {
  // Paged transactions + totals: { transactions: PageResponse, inflow, outflow, net }.
  getTransactions: async (params) => {
    const response = await axiosInstance.get('/revenue/transactions', { params });
    return response.data;
  },
};

export default revenueService;
