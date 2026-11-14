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
   * Make an employee inactive from the inactive date (first non-working day; salary stops from it).
   * PATCH /api/employees/{id}/status
   */
  deactivateEmployee: async (id: string, inactiveDate: string) => {
    const response = await axiosInstance.patch(`/employees/${id}/status`, { active: false, effectiveDate: inactiveDate });
    return response.data;
  },

  /**
   * Reactivate an employee from the reactivation date (a working day; salary resumes from it).
   * PATCH /api/employees/{id}/status
   */
  activateEmployee: async (id: string, reactivationDate: string) => {
    const response = await axiosInstance.patch(`/employees/${id}/status`, { active: true, effectiveDate: reactivationDate });
    return response.data;
  },

  /**
   * Allowed date range for the next status change: { action, minDate, maxDate } (forward-only).
   * GET /api/employees/{id}/status-window
   */
  getStatusWindow: async (id: string) => {
    const response = await axiosInstance.get(`/employees/${id}/status-window`);
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

  // ── Payroll (pay-slips + advances/settlements), server-side paged/filtered ──
  getPayroll: async (id: string, params?: Record<string, any>) => {
    const response = await axiosInstance.get(`/employees/${id}/payroll`, { params });
    return response.data;
  },
  recordLedger: async (id: string, entry: { entryDate: string; type: 'ADVANCE' | 'PAYOUT' | 'ADVANCE_ADJUSTMENT'; amount: number; mode?: string; note?: string; period?: string }) => {
    const response = await axiosInstance.post(`/employees/${id}/ledger`, entry);
    return response.data;
  },
  // Pay-slip PDF (blob): by month for monthly staff, or by settlement entry for piece-rate staff.
  payslipByMonth: async (id: string, period: string) => {
    const res = await axiosInstance.get(`/employees/${id}/payslip`, { params: { period }, responseType: 'blob' });
    return new Blob([res.data], { type: 'application/pdf' });
  },
  payslipBySettlement: async (id: string, ledgerId: string) => {
    const res = await axiosInstance.get(`/employees/${id}/payslip`, { params: { ledgerId }, responseType: 'blob' });
    return new Blob([res.data], { type: 'application/pdf' });
  },
  deleteLedger: async (id: string, entryId: string) => {
    const response = await axiosInstance.delete(`/employees/${id}/ledger/${entryId}`);
    return response.data;
  },
  // Give an advance to several employees at once.
  bulkAdvance: async (payload: { entryDate: string; mode?: string; note?: string; items: { employeeId: string; amount: number }[] }) => {
    const response = await axiosInstance.post(`/employees/advances/bulk`, payload);
    return response.data;
  },
};
