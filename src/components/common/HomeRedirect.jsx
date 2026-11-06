import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const MODULE_PATH = {
  dashboard: '/dashboard', production: '/production', inventory: '/inventory',
  products: '/products', investment: '/investment', employees: '/employees',
  sales: '/sales/list', settings: '/settings',
};

// Landing route: send the user to the first module they can view (dashboard for admins).
const HomeRedirect = () => {
  const { visibleModules } = usePermissions();
  const target = visibleModules.includes('dashboard')
    ? '/dashboard'
    : (visibleModules.length ? MODULE_PATH[visibleModules[0]] : '/dashboard');
  return <Navigate to={target} replace />;
};

export default HomeRedirect;
