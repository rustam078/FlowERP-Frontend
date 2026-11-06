import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

// Gate a route/element to ADMIN only. Non-admins are sent to `fallback` (default: home).
const AdminOnly = ({ children, fallback = '/' }) => {
  const { isAdmin } = usePermissions();
  if (!isAdmin) return <Navigate to={fallback} replace />;
  return children;
};

export default AdminOnly;
