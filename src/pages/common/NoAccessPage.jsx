import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { usePermissions } from '../../hooks/usePermissions';

const MODULE_LABEL = {
  dashboard: 'Dashboard', production: 'Production', inventory: 'Inventory',
  products: 'Products', investment: 'Investment', employees: 'Employees',
  sales: 'Sales', settings: 'Settings',
};

const MODULE_PATH = {
  dashboard: '/dashboard', production: '/production', inventory: '/inventory',
  products: '/products', investment: '/investment', employees: '/employees',
  sales: '/sales/list', settings: '/settings',
};

// Shown when the current user's role can't view the module they navigated to.
const NoAccessPage = ({ module }) => {
  const navigate = useNavigate();
  const { visibleModules } = usePermissions();
  const first = visibleModules[0];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 12, px: 3 }}>
      <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2.5 }}>
        <LockOutlinedIcon sx={{ fontSize: 36, color: '#DC2626' }} />
      </Box>
      <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
        No access
      </Typography>
      <Typography sx={{ color: '#64748B', maxWidth: 440, mb: 3 }}>
        You don't have permission to view{module && MODULE_LABEL[module] ? ` the ${MODULE_LABEL[module]} section` : ' this section'}.
        Ask an administrator to grant access from Settings → Users &amp; Roles.
      </Typography>
      {first ? (
        <Button variant="contained" onClick={() => navigate(MODULE_PATH[first])}>
          Go to {MODULE_LABEL[first]}
        </Button>
      ) : null}
    </Box>
  );
};

export default NoAccessPage;
