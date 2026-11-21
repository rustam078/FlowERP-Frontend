import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from '../components/common/ProtectedRoute';
import ModuleGuard from '../components/common/ModuleGuard';
import HomeRedirect from '../components/common/HomeRedirect';
import AdminOnly from '../components/common/AdminOnly';
import MainLayout from '../layouts/MainLayout';

// Import Pages
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductionPage from '../pages/production/ProductionPage';
import BulkProductionEntry from '../pages/production/BulkProductionEntry';
import ProductionHistoryPage from '../pages/production/ProductionHistoryPage';
import InventoryPage from '../pages/inventory/InventoryPage';
import InventoryDetailsPage from '../pages/inventory/InventoryDetailsPage';
import ProductsPage from '../pages/products/ProductsPage';
import ProductDetailsPage from '../pages/products/ProductDetailsPage';
import InvestmentPage from '../pages/investment/InvestmentPage';
import EmployeePage from '../pages/employees/EmployeePage';
import EmployeeDetailsPage from '../pages/employees/EmployeeDetailsPage';
import SettingsPage from '../pages/settings/SettingsPage';
import RevenuePage from '../modules/revenue/pages/RevenuePage';
import VendorDetailsPage from '../pages/vendors/VendorDetailsPage';
import SalesDashboard from '../modules/sales/pages/SalesDashboard';
import CreateSale from '../modules/sales/pages/CreateSale';
import SalesList from '../modules/sales/pages/SalesList';
import SaleDetails from '../modules/sales/pages/SaleDetails';
import InvoicePreview from '../modules/sales/pages/InvoicePreview';
import PortfolioPickerPage from '../pages/portfolios/PortfolioPickerPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import { PortfolioGate, SuperAdminRoute } from '../components/common/PortfolioGate';

// User Guide is loaded only when opened (static content + screenshots).
const GuidePage = lazy(() => import('../modules/guide/GuidePage'));
const GuideLoading = () => <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

const AppRoutes = () => {
  return (
    <Routes>
      {/* Publicly Accessible Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Enterprise Pages */}
      <Route element={<ProtectedRoute />}>
        {/* Super admin: pick / manage portfolios (full page, outside the app layout) */}
        <Route element={<SuperAdminRoute />}>
          <Route path="/portfolios" element={<PortfolioPickerPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>
        <Route element={<PortfolioGate />}>
        <Route element={<MainLayout />}>
         <Route element={<ModuleGuard />}>
          {/* Index Route → first module the user can view */}
          <Route path="/" element={<HomeRedirect />} />
          
          {/* Main Modules */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/production" element={<ProductionPage />} />
          <Route path="/production/new" element={<BulkProductionEntry />} />
          <Route path="/production-history" element={<ProductionHistoryPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/:productId" element={<InventoryDetailsPage />} />
          <Route path="/products" element={<ProductsPage />} />
          {/* Product details is an admin-only drill-down (staff sent back to the list). */}
          <Route path="/products/:productId" element={<AdminOnly fallback="/products"><ProductDetailsPage /></AdminOnly>} />
          <Route path="/investment" element={<InvestmentPage />} />
          <Route path="/investment/new" element={<InvestmentPage />} />
          <Route path="/vendors/:id" element={<VendorDetailsPage />} />
          <Route path="/sales" element={<SalesDashboard />} />
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/sales/new" element={<CreateSale />} />
          <Route path="/sales/list" element={<SalesList />} />
          <Route path="/sales/:saleId" element={<SaleDetails />} />
          <Route path="/print/invoice/:saleId" element={<InvoicePreview />} />
          <Route path="/employees" element={<EmployeePage />} />
          <Route path="/employees/:employeeId" element={<EmployeeDetailsPage />} />
          {/* Reports module removed — its important reports now live on the Dashboard */}
          <Route path="/reports" element={<Navigate to="/dashboard" replace />} />
          <Route path="/revenue" element={<RevenuePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/guide" element={<Suspense fallback={<GuideLoading />}><GuidePage /></Suspense>} />
         </Route>
        </Route>
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
