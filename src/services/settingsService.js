import axiosInstance from './axios';

// System settings API. `getAll` powers the global AppSettingsProvider and the
// Settings screen; `update` saves one key at a time (matches the backend PUT).
const settingsService = {
  async getAll() {
    try {
      const res = await axiosInstance.get('/settings');
      // Backend returns a list of { key, value, description }. Normalise to a map.
      const list = Array.isArray(res.data) ? res.data : [];
      return list.reduce((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {});
    } catch {
      // Backend may not have the settings endpoint yet (older build) — fall back to
      // provider defaults silently instead of surfacing a global error toast.
      return {};
    }
  },

  async get(key) {
    const res = await axiosInstance.get(`/settings/${key}`);
    return res.data?.value;
  },

  async update(key, value) {
    const res = await axiosInstance.put(`/settings/${key}`, { threshold: String(value ?? '') });
    return res.data;
  },
};

export default settingsService;
