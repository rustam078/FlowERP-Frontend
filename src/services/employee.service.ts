import axiosInstance from './axios';

/**
 * Service to manage employee API operations.
 */
export const employeeService = {
  /**
   * Fetch all employees.
   * GET /api/employees
   */
  getEmployees: async () => {
    const response = await axiosInstance.get('/employees');
    return response.data;
  },

  /**
   * Create a new employee.
   * POST /api/employees
   */
  createEmployee: async (employee: { fullName: string; mobileNumber?: string; address?: string; joiningDate: string; paymentType?: string; monthlySalary?: number; openingAdvance?: number }) => {
    const response = await axiosInstance.post('/employees', employee);
    return response.data;
  },

  /**
   * Update an existing employee.
   * PUT /api/employees/{id}
   */
  updateEmployee: async (id: string, employee: { fullName: string; mobileNumber?: string; address?: string; joiningDate: string; active?: boolean; paymentType?: string; monthlySalary?: number; openingAdvance?: number }) => {
    const response = await axiosInstance.put(`/employees/${id}`, employee);
    return response.data;
  },

  /**
   * Deactivate an existing employee.
   * PATCH /api/employees/{id}/status
   */
  deactivateEmployee: async (id: string) => {
    const response = await axiosInstance.patch(`/employees/${id}/status`, { active: false });
    return response.data;
  },

  /**
   * Fetch employee statistics.
   * GET /api/employees/stats
   */
  getEmployeeStats: async () => {
    const response = await axiosInstance.get('/employees/stats');
    return response.data;
  },

  // ── Attendance (exception-based leave/absent) ──
  getAttendance: async (id: string, fromDate: string, toDate: string) => {
    const response = await axiosInstance.get(`/employees/${id}/attendance`, { params: { fromDate, toDate } });
    return response.data;
  },
  markAttendance: async (id: string, date: string, status: 'ABSENT' | 'HALF_DAY') => {
    const response = await axiosInstance.post(`/employees/${id}/attendance`, { date, status });
    return response.data;
  },
  markAttendanceRange: async (id: string, fromDate: string, toDate: string, status: 'ABSENT' | 'HALF_DAY') => {
    const response = await axiosInstance.post(`/employees/${id}/attendance/range`, { fromDate, toDate, status });
    return response.data;
  },
  clearAttendance: async (id: string, date: string) => {
    const response = await axiosInstance.delete(`/employees/${id}/attendance`, { params: { date } });
    return response.data;
  },
};
