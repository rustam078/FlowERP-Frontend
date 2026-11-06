import axiosInstance from './axios';
import { IProductionEntry, IProductionFilter, IProductionPage } from '../types/production';
import { downloadReport, periodToken } from '../utils/reportDownload';

/**
 * Service to handle Production API endpoints.
 */
export const productionService = {
  /**
   * Fetch ALL production entries (untruncated) as an array.
   * GET /api/production?employeeId=xxx&fromDate=xxx&toDate=xxx&productId=xxx&pieceCodeId=xxx
   *
   * The backend list endpoint is now paginated (data.content). Callers of this
   * method (ProductDetailsPage / ProductionPage) compute per-product / all-time
   * aggregates and must not be truncated, so we request a large page and return
   * the flat array of entries.
   */
  getProduction: async (filters: IProductionFilter = {}): Promise<IProductionEntry[]> => {
    const params: any = { page: 0, size: 1000 };
    if (filters.employeeId) params.employeeId = filters.employeeId;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.productId) params.productId = filters.productId;
    if (filters.pieceCodeId) params.pieceCodeId = filters.pieceCodeId;

    const response = await axiosInstance.get('/production', { params });
    return response.data?.data?.content ?? [];
  },

  /**
   * Aggregate KPIs for the summary cards (so the list can paginate server-side).
   * GET /api/production/stats
   */
  getProductionStats: async (filters: IProductionFilter = {}) => {
    const params: any = {};
    if (filters.employeeId) params.employeeId = filters.employeeId;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.productId) params.productId = filters.productId;
    const response = await axiosInstance.get('/production/stats', { params });
    return response.data?.data ?? {};
  },

  /**
   * Fetch a single page of production entries for server-side pagination.
   * GET /api/production?...&page&size
   * Returns the full page object: { content, page, size, totalElements, totalPages, last }.
   */
  getProductionPage: async (
    filters: IProductionFilter & { page?: number; size?: number } = {}
  ): Promise<IProductionPage> => {
    const params: any = {};
    if (filters.employeeId) params.employeeId = filters.employeeId;
    if (filters.fromDate) params.fromDate = filters.fromDate;
    if (filters.toDate) params.toDate = filters.toDate;
    if (filters.productId) params.productId = filters.productId;
    if (filters.pieceCodeId) params.pieceCodeId = filters.pieceCodeId;
    params.page = filters.page ?? 0;
    params.size = filters.size ?? 20;

    const response = await axiosInstance.get('/production', { params });
    return (
      response.data?.data ?? {
        content: [],
        page: params.page,
        size: params.size,
        totalElements: 0,
        totalPages: 0,
        last: true,
      }
    );
  },

  /**
   * Create a new production entry (Piece Code based pricing).
   * POST /api/production
   */
  createProduction: async (entry: {
    employeeId: string;
    productionDate: string;
    remarks?: string;
    items: {
      productId: string;
      pieceCodeId: string;
      quantity: number;
      rate: number;
      amount: number;
    }[];
  }) => {
    const response = await axiosInstance.post('/production', entry);
    return response.data;
  },

  /**
   * Delete a production entry.
   * DELETE /api/production/{id}
   */
  deleteProduction: async (id: string) => {
    const response = await axiosInstance.delete(`/production/${id}`);
    return response.data;
  },

  /**
   * Download production report as a backend-generated PDF (HTML template based).
   * GET /api/production/{id}/pdf
   */
  downloadProductionPdf: async (id: string) => {
    const response = await axiosInstance.get(`/production/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production-report-${id}.pdf`;
    link.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Download production report as a backend-generated Excel file.
   * GET /api/production/{id}/excel
   */
  /** Date-range production report (PDF or Excel). GET /api/production/report/{format} */
  downloadProductionReport: async (format: 'pdf' | 'excel', fromDate: string, toDate: string) => {
    await downloadReport(`/production/report/${format}`, { fromDate, toDate },
      `production_${periodToken(fromDate, toDate)}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
  },

  downloadProductionExcel: async (id: string) => {
    const response = await axiosInstance.get(`/production/${id}/excel`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `production-report-${id}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
