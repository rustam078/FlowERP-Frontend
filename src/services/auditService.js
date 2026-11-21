import axiosInstance from './axios';

/** SUPER_ADMIN audit log viewer (/api/audit-logs). */
const auditService = {
  /** filters: filterPortfolioId, module, outcome, fromDate, toDate, search, entityId, page, size. */
  search: async (params) => (await axiosInstance.get('/audit-logs', { params })).data,

  /** { log, ref, portfolioName, changes[] } */
  detail: async (id) => (await axiosInstance.get(`/audit-logs/${id}`)).data,
};

export default auditService;
