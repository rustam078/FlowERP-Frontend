import axiosInstance from '../../services/axios';

/**
 * QR unit-labelling & scan-to-sell API.
 * All backend responses are CommonResponse<T>; we return the whole envelope so
 * callers can read `.data` and `.message`.
 */
const qrService = {
  // Create (label) units for a batch. count is optional (defaults server-side).
  generateUnits: async (batchNumber, count) => {
    const res = await axiosInstance.post(
      `/qr/batches/${batchNumber}/units/generate`,
      count ? { count } : {}
    );
    return res.data;
  },

  // Cheap label counts for a batch (so the dialog never loads every unit).
  getSummary: async (batchNumber) => {
    const res = await axiosInstance.get(`/qr/batches/${batchNumber}/units/summary`);
    return res.data;
  },

  // Existing labels in the serial range [from, to] (to print/reprint a specific chunk).
  getUnitsRange: async (batchNumber, from, to) => {
    const res = await axiosInstance.get(`/qr/batches/${batchNumber}/units/range`, {
      params: { from, to },
    });
    return res.data;
  },

  // All units for a batch (for the print sheet / reprint) — full, unpaged list.
  getUnits: async (batchNumber) => {
    const res = await axiosInstance.get(`/qr/batches/${batchNumber}/units`);
    return res.data;
  },

  // A single page of units for a batch (server-side pagination), optional serial filter.
  // Returns the CommonResponse envelope; caller reads
  // `.data` = { content, page, size, totalElements, totalPages, last }.
  getUnitsPage: async (batchNumber, page = 0, size = 20, serial) => {
    const res = await axiosInstance.get(`/qr/batches/${batchNumber}/units/page`, {
      params: serial ? { page, size, serial } : { page, size },
    });
    return res.data;
  },

  // Scan lookup — accepts the full QR payload or a bare serial.
  scan: async (code) => {
    const res = await axiosInstance.post(`/qr/scan`, { code });
    return res.data;
  },

  // Void a damaged/lost unit.
  voidUnit: async (serial) => {
    const res = await axiosInstance.patch(`/qr/units/${serial}/void`);
    return res.data;
  },

  // QR label print config (which fields print + product-name orientation).
  getLabelConfig: async () => {
    try {
      const res = await axiosInstance.get('/settings/QR_LABEL_CONFIG');
      return { ...DEFAULT_LABEL_CONFIG, ...JSON.parse(res.data?.value || '{}') };
    } catch {
      return { ...DEFAULT_LABEL_CONFIG };
    }
  },

  saveLabelConfig: async (config) => {
    // The settings endpoint stores a string value under `threshold`.
    const res = await axiosInstance.put('/settings/QR_LABEL_CONFIG', {
      threshold: JSON.stringify(config),
    });
    return res.data;
  },
};

export const DEFAULT_LABEL_CONFIG = {
  showName: true,
  showPrice: true,
  showSerial: true,
  nameVertical: false,
};

export default qrService;
