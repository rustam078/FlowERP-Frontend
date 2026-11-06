/**
 * Reusable TypeScript interfaces for the SKR Garment ERP Employee Management module.
 */

export interface IEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  joiningDate: string;
  active: boolean;
  currentMonthEarning?: number;
  totalEarning?: number;
}

export interface IEmployeeFormInput {
  fullName: string;
  email: string;
  mobileNumber?: string;
  address?: string;
  joiningDate: string;
  active?: boolean;
}

export interface IEmployeeFilter {
  searchQuery?: string;
}
