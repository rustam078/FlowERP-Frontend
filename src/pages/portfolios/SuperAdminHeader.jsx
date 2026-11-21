import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../contexts/LanguageContext';

// Top bar of the super admin pages (Portfolios / Audit Logs).
const SuperAdminHeader = () => {
  const t = useT();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const link = (path, label) => (
    <Button color="inherit" size="small" onClick={() => navigate(path)}
      sx={{ fontWeight: pathname === path ? 800 : 500, borderBottom: pathname === path ? '2px solid #fff' : '2px solid transparent', borderRadius: 0 }}>
      {label}
    </Button>
  );
  return (
    <Box sx={{ bgcolor: 'var(--theme-primary)', color: '#fff', px: { xs: 2, sm: 4 }, py: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mr: 2 }}>FlowERP</Typography>
      {link('/portfolios', t('portfolio.title', 'Portfolios'))}
      {link('/audit-logs', t('audit.title', 'Audit Logs'))}
      <Box sx={{ flexGrow: 1 }} />
      <Typography sx={{ fontSize: '0.85rem', opacity: 0.85, display: { xs: 'none', md: 'block' } }}>{user?.email}</Typography>
      <Button color="inherit" size="small" startIcon={<LogoutIcon />} onClick={logout}>{t('portfolio.logout', 'Logout')}</Button>
    </Box>
  );
};

export default SuperAdminHeader;
