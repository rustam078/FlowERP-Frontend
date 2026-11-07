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
  paymentType?: 'PIECE_RATE' | 'MONTHLY';
  monthlySalary?: number;
  openingAdvance?: number;
  currentMonthEarning?: number;
  totalEarning?: number;
  advanceBalance?: number;
  pending?: number;
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
