import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../contexts/AppSettingsContext';

// The 8 permission-controlled modules (must match backend module keys and menu keys).
export const MODULES = [
  'dashboard', 'production', 'inventory', 'products',
  'investment', 'employees', 'sales', 'settings',
];

export const ACTIONS = ['view', 'write', 'delete'];

export const ROLE_ADMIN = 'ADMIN';
export const ROLE_STAFF = 'STAFF';

/**
 * Role-based access for the current user.
 * ADMIN → everything is allowed. STAFF → checks the ROLE_PERMISSIONS matrix from settings.
 * Returns: { role, isAdmin, can(module, action), visibleModules }.
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const { rolePermissions, staffDashboardBoards } = useAppSettings();

  const role = user?.role || ROLE_STAFF;
  const isAdmin = role === ROLE_ADMIN;

  const can = useMemo(() => {
    return (module, action = 'view') => {
      if (isAdmin) return true;
      const rolePerms = rolePermissions?.[role];
      if (!rolePerms) return false;
      const modulePerms = rolePerms[module];
      if (!modulePerms) return false;
      return modulePerms[action] === true;
    };
  }, [isAdmin, role, rolePermissions]);

  const visibleModules = useMemo(
    () => MODULES.filter((m) => can(m, 'view')),
    [can]
  );

  // Dashboard board visibility: ADMIN sees all; STAFF limited by STAFF_DASHBOARD_BOARDS.
  const canSeeBoard = useMemo(() => {
    return (boardKey) => isAdmin || (staffDashboardBoards || []).includes(boardKey);
  }, [isAdmin, staffDashboardBoards]);

  return { role, isAdmin, can, visibleModules, canSeeBoard, staffDashboardBoards: staffDashboardBoards || [] };
};

export default usePermissions;
