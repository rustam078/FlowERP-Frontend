/**
 * Reusable TypeScript interfaces for the SKR Garment ERP Production Entry module.
 */

export interface IEmployee {
  id: string;
  employeeCode: string;
  fullName: string;
  active: boolean;
}

export interface IPieceCode {
  id: string;
  code: string;
  rate: number;
  description?: string;
  active: boolean;
  usageCount?: number;
  createdAt: string;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  iconName?: string;
  totalPieceCodes?: number;
  activePieceCodes?: number;
  inactivePieceCodes?: number;
}

export interface IProductionItem {
  productId: string;
  productName?: string;
  pieceCodeId?: string;
  pieceCode?: string;   // e.g. "SHIRT-001"
  quantity: number;
  rate: number;
  amount: number;
  iconName?: string;
}

export interface IProductionEntry {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  productionDate: string;
  remarks?: string;
  items: IProductionItem[];
  productCount: number;
  totalQuantity: number;
  totalAmount: number;
  createdAt: string;
}

export interface IProductionFilter {
  employeeId?: string;
  fromDate?: string;
  toDate?: string;
  productId?: string;
  pieceCodeId?: string;
}

/** A single page of production entries returned by the paginated list endpoint. */
export interface IProductionPage {
  content: IProductionEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}
