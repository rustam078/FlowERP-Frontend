import axiosInstance from './axios';

/** SUPER_ADMIN portfolio management (/api/portfolios). */
const portfolioService = {
  list: async (search) => (await axiosInstance.get('/portfolios', { params: search ? { search } : {} })).data,

  /** true when the 2-letter batch prefix is still free. */
  isPrefixAvailable: async (prefix) =>
    (await axiosInstance.get('/portfolios/prefix-available', { params: { prefix } })).data.available,

  /** { name, batchPrefix, adminFullName, adminEmail, adminPassword } → new portfolio. */
  create: async (payload) => (await axiosInstance.post('/portfolios', payload)).data,

  setActive: async (id, active) => (await axiosInstance.patch(`/portfolios/${id}/status`, null, { params: { active } })).data,

  /** Soft delete; confirmName must be the portfolio's exact name. */
  remove: async (id, confirmName) => {
    await axiosInstance.delete(`/portfolios/${id}`, { params: { confirmName } });
  },
};

export default portfolioService;
