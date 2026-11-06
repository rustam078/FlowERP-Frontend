import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import NoAccessPage from '../../pages/common/NoAccessPage';

// Map a route path to its permission module (mirrors the backend path→module mapping).
const pathToModule = (pathname) => {
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  switch (seg) {
    case 'dashboard': return 'dashboard';
    case 'production':
    case 'production-history': return 'production';
    case 'inventory': return 'inventory';
    case 'products': return 'products';
    case 'investment':
    case 'vendors': return 'investment';
    case 'employees': return 'employees';
    case 'sales':
    case 'print': return 'sales';
    case 'settings': return 'settings';
    default: return null;
  }
};

const ModuleGuard = () => {
  const location = useLocation();
  const { can } = usePermissions();

  const module = pathToModule(location.pathname);

  // Unknown/unmapped routes fall through (auth already enforced upstream).
  if (!module) return <Outlet />;

  if (can(module, 'view')) return <Outlet />;

  // No view access → show a friendly No Access page (with a link to a module they can see).
  return <NoAccessPage module={module} />;
};

export default ModuleGuard;
