import { IEmployee } from './employee.types';

/**
 * KPI summary values for an employee.
 */
export interface IEmployeeSummary {
  totalProductionQty: number;
  totalEarnings: number;
  currentMonthEarnings: number;
  productsWorkedOn: number;
}

/**
 * Breakdown of earnings and production quantity per product.
 */
export interface IProductSummary {
  productName: string;
  quantityProduced: number;
  totalEarnings: number;
  contributionPercentage: number;
  iconName?: string;
}

/**
 * Raw production history item for an employee.
 */
export interface IProductionHistoryItem {
  id: string;
  date: string;
  productName: string;
  quantity: number;
  rate: number;
  earnings: number;
  iconName?: string;
}

/**
 * Monthly trend metrics for earnings.
 */
export interface IMonthlyEarningsTrend {
  month: string;
  earnings: number;
}

export interface ICurrentMonthProductSummary {
  productName: string;
  quantity: number;
  earnings: number;
  iconName?: string;
}

/**
 * Aggregated employee details data structure.
 */
export interface IEmployeeDetailsData {
  employee: IEmployee;
  summary: IEmployeeSummary;
  productSummary: IProductSummary[];
  productionHistory: IProductionHistoryItem[];
  monthlyEarnings?: IMonthlyEarningsTrend[];
  currentMonthProductSummary?: ICurrentMonthProductSummary[];
}

/**
 * The standard response container for employee details query.
 */
export interface IEmployeeDetailsResponse {
  success: boolean;
  data: IEmployeeDetailsData;
}

export interface ICalendarDay {
  date: string;
  totalQuantity: number;
  totalEarning: number;
}

