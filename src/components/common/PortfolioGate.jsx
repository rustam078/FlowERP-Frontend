import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_SUPER_ADMIN } from '../../hooks/usePermissions';

// The app needs a portfolio: a super admin who hasn't picked one is sent to the portfolio picker.
export const PortfolioGate = () => {
  const { user } = useAuth();
  if (user?.role === ROLE_SUPER_ADMIN && !user.portfolioId) return <Navigate to="/portfolios" replace />;
  return <Outlet />;
};

// The portfolio picker / management page is for super admins only.
export const SuperAdminRoute = () => {
  const { user } = useAuth();
  return user?.role === ROLE_SUPER_ADMIN ? <Outlet /> : <Navigate to="/" replace />;
};
