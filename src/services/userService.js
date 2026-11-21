import axiosInstance from './axios';

// User administration (ADMIN only; backend enforces via the settings module).
const userService = {
  async getAll() {
    const res = await axiosInstance.get('/users');
    return Array.isArray(res.data) ? res.data : [];
  },

  async create({ email, password, fullName, role, active }) {
    const res = await axiosInstance.post('/users', { email, password, fullName, role, active });
    return res.data;
  },

  async update(id, { fullName, role, active }) {
    const res = await axiosInstance.put(`/users/${id}`, { fullName, role, active });
    return res.data;
  },

  async resetPassword(id, newPassword) {
    const res = await axiosInstance.patch(`/users/${id}/password`, { newPassword });
    return res.data;
  },

  async toggleStatus(id) {
    const res = await axiosInstance.patch(`/users/${id}/status`);
    return res.data;
  },
};

export default userService;
