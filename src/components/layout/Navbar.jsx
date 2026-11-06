import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Menu,
  MenuItem,
  Tooltip,
  Avatar,
  Badge,
  Divider,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  ExitToApp as LogoutIcon,
  Person as ProfileIcon,
  Settings as SettingsIcon,
  LockReset as LockResetIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { useThemeColor } from '../../contexts/ThemeColorContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePermissions } from '../../hooks/usePermissions';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../services/axios';

const Navbar = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { companyName } = useAppSettings();
  const { primary, nav } = useThemeColor();
  const { t } = useLanguage();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  // Change-password dialog
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwState, setPwState] = useState({ busy: false, error: '', ok: false });

  const openChangePassword = () => { handleCloseMenu(); setPw({ current: '', next: '', confirm: '' }); setPwState({ busy: false, error: '', ok: false }); setPwOpen(true); };

  const submitChangePassword = async () => {
    if (pw.next.length < 4) { setPwState({ busy: false, error: t('ui.nav.pwMin', 'New password must be at least 4 characters.'), ok: false }); return; }
    if (pw.next !== pw.confirm) { setPwState({ busy: false, error: t('ui.nav.pwMismatch', 'New password and confirm do not match.'), ok: false }); return; }
    setPwState({ busy: true, error: '', ok: false });
    try {
      await authService.changePassword(user?.email, pw.current, pw.next);
      setPwState({ busy: false, error: '', ok: true });
      setTimeout(() => setPwOpen(false), 900);
    } catch (e) {
      setPwState({ busy: false, error: e.message || t('ui.nav.pwChangeFail', 'Could not change password.'), ok: false });
    }
  };

  // Low-stock alert count for the bell (shared cache key with the Inventory page).
  const { data: lowStockAlerts } = useQuery({
    queryKey: ['lowStockAlerts'],
    queryFn: async () => {
      const res = await axiosInstance.get('/inventory/alerts');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    refetchInterval: 60000,
  });
  const lowStockCount = lowStockAlerts?.length || 0;

  const handleOpenAlerts = () => {
    // Open the global alerts drawer on the current page — no navigation.
    window.dispatchEvent(new Event('open-inventory-alerts'));
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
    navigate('/login');
  };

  const handleProfileSettings = () => {
    handleCloseMenu();
    navigate('/settings');
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#ffffff',
        color: '#0F172A',
      }}
    >
      <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        <IconButton
          color="inherit"
          aria-label="toggle drawer desktop"
          edge="start"
          onClick={onToggleSidebar}
          sx={{ mr: 2, display: { xs: 'none', md: 'inline-flex' } }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{
            fontWeight: 800,
            background: `linear-gradient(45deg, ${primary} 30%, ${nav} 90%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            userSelect: 'none',
          }}
        >
          {companyName || 'SKR Garment'}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Low-stock alerts */}
          <Tooltip title={`${t('ui.nav.lowStockAlerts', 'Low Stock Alerts')}${lowStockCount > 0 ? ` (${lowStockCount})` : ''}`}>
            <IconButton color="inherit" size="large" onClick={handleOpenAlerts} aria-label="low stock alerts">
              <Badge badgeContent={lowStockCount} color="error" max={99}>
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile */}
          <Tooltip title={t('ui.nav.accountSettings', 'Account settings')}>
            <IconButton
              onClick={handleOpenMenu}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={anchorEl ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={anchorEl ? 'true' : undefined}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              >
                {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'A'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* User Account Menu Dropdown */}
        <Menu
          anchorEl={anchorEl}
          id="account-menu"
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
              mt: 1.5,
              minWidth: 200,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {user?.name || t('ui.nav.administrator', 'Administrator')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user?.email || 'admin@skrgarments.com'}
            </Typography>
          </Box>
          <Divider />
          {isAdmin && (
            <MenuItem onClick={openChangePassword}>
              <ListItemIcon>
                <LockResetIcon fontSize="small" />
              </ListItemIcon>
              {t('ui.nav.changePassword', 'Change Password')}
            </MenuItem>
          )}
          <MenuItem onClick={handleProfileSettings}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            {t('nav.settings', 'Settings')}
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <Typography color="error.main">{t('ui.nav.logout', 'Logout')}</Typography>
          </MenuItem>
        </Menu>

        <Dialog open={pwOpen} onClose={() => !pwState.busy && setPwOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ fontWeight: 800 }}>{t('ui.nav.changePassword', 'Change Password')}</DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ mt: 0.5 }}>
              <TextField label={t('ui.nav.currentPassword', 'Current password')} type="password" size="small" fullWidth autoFocus
                value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
              <TextField label={t('ui.nav.newPassword', 'New password')} type="password" size="small" fullWidth
                value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} />
              <TextField label={t('ui.nav.confirmNewPassword', 'Confirm new password')} type="password" size="small" fullWidth
                value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
              {pwState.error ? <Alert severity="error" sx={{ py: 0 }}>{pwState.error}</Alert> : null}
              {pwState.ok ? <Alert severity="success" sx={{ py: 0 }}>{t('ui.nav.pwChanged', 'Password changed.')}</Alert> : null}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setPwOpen(false)} disabled={pwState.busy}>{t('common.cancel', 'Cancel')}</Button>
            <Button variant="contained" onClick={submitChangePassword} disabled={pwState.busy || !pw.current || !pw.next}>
              {pwState.busy ? t('ui.nav.saving', 'Saving…') : t('ui.nav.updatePassword', 'Update Password')}
            </Button>
          </DialogActions>
        </Dialog>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
