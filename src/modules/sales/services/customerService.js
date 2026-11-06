import axiosInstance from '../../../services/axios';

const customerService = {
  getCustomers: async (mobile) => {
    const response = await axiosInstance.get('/customers', {
      params: mobile ? { mobile } : {},
    });
    return response.data;
  },
};

export default customerService;