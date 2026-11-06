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
  createEmployee: async (employee: { fullName: string; mobileNumber?: string; address?: string; joiningDate: string }) => {
    const response = await axiosInstance.post('/employees', employee);
    return response.data;
  },

  /**
   * Update an existing employee.
   * PUT /api/employees/{id}
   */
  updateEmployee: async (id: string, employee: { fullName: string; mobileNumber?: string; address?: string; joiningDate: string; active?: boolean }) => {
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
};
