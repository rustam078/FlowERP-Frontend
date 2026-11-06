import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useThemeColor } from '../../contexts/ThemeColorContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { readableText, mutedText } from '../../utils/color';
import {
  Collapse,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ExpandLess,
  ExpandMore,
  Factory as ProductionIcon,
  People as EmployeesIcon,
  Inventory as InventoryIcon,
  Category as ProductsIcon,
  ReceiptLong as SalesIcon,
  PointOfSale as PointOfSaleIcon,
  ListAlt as ListIcon,
  Settings as SettingsIcon,
  AccountBalanceWallet as InvestmentIcon,
} from '@mui/icons-material';

const DRAWER_WIDTH = 228;
const MINI_DRAWER_WIDTH = 68;

// Every top-level menu entry has a stable `key` used to order it from Settings.
// `group: true` marks the collapsible Sales section. Order below is the default.
const MENU_ITEMS = [
  { key: 'dashboard', text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
  { key: 'production', text: 'Production', path: '/production', icon: <ProductionIcon /> },
  { key: 'inventory', text: 'Inventory', path: '/inventory', icon: <InventoryIcon /> },
  { key: 'products', text: 'Products', path: '/products', icon: <ProductsIcon /> },
  { key: 'investment', text: 'Investment', path: '/investment', icon: <InvestmentIcon /> },
  { key: 'employees', text: 'Employees', path: '/employees', icon: <EmployeesIcon /> },
  { key: 'sales', text: 'Sales', path: '/sales/list', icon: <SalesIcon /> },
  { key: 'settings', text: 'Settings', path: '/settings', icon: <SettingsIcon /> },
];

// Shared with the Settings reorder UI so both stay in sync.
export const MENU_LABELS = MENU_ITEMS.map(({ key, text }) => ({ key, text }));

// Sort menu items by a saved order of keys; unknown/new keys keep their built-in order at the end.
export const orderMenu = (items, order) => {
  const rank = new Map((order || []).map((k, i) => [k, i]));
  return [...items].sort((a, b) => {
    const ra = rank.has(a.key) ? rank.get(a.key) : Infinity;
    const rb = rank.has(b.key) ? rank.get(b.key) : Infinity;
    return ra - rb;
  });
};

const SALES_SUBMENU = [
  // Sales analytics now live in the top-level Dashboard (Sales board).
  { text: 'Sales List', path: '/sales/list', icon: <ListIcon /> },
];

const Sidebar = ({ open, onToggleSidebar, variant = 'permanent' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [salesOpen, setSalesOpen] = useState(true);
  const { menuOrder, companyName } = useAppSettings();
  const { can } = usePermissions();
  const { t } = useLanguage(); // static UI text translation (English default, Hindi via Settings)
  // Theme-driven sidebar colors (nav background + readable text/icons + active = primary).
  const { primary, nav } = useThemeColor();
  const txt = readableText(nav);
  const muted = mutedText(nav);
  const hoverBg = txt === txt ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const dividerCol = txt === txt ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  // Only show modules the current role can view (ADMIN sees all).
  const orderedItems = useMemo(
    () => orderMenu(MENU_ITEMS, menuOrder).filter((item) => can(item.key, 'view')),
    [menuOrder, can]
  );

  useEffect(() => {
    if (location.pathname.startsWith('/sales')) {
      setSalesOpen(true);
    }
  }, [location.pathname]);

  const handleNavigation = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onToggleSidebar();
    }
  };

  const renderNavButton = (item) => {
    const isActive = location.pathname === item.path ||
                     (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
    return (
      <ListItem key={item.key} disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          onClick={() => handleNavigation(item.path)}
          sx={{
            borderRadius: '10px',
            py: 1,
            px: open ? 2 : 1.5,
            justifyContent: open ? 'initial' : 'center',
            color: isActive ? txt : muted,
            backgroundColor: isActive ? primary : 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: txt,
              backgroundColor: isActive ? primary : hoverBg,
              '& .MuiListItemIcon-root': { color: txt },
            },
            '& .MuiListItemIcon-root': {
              color: isActive ? txt : muted,
              minWidth: open ? 36 : 'auto',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText
            primary={t('nav.' + item.key, item.text)}
            sx={{
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
            primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: isActive ? 600 : 500 }}
          />
        </ListItemButton>
      </ListItem>
    );
  };

  const renderSalesGroup = () => (
    <React.Fragment key="sales">
      <ListItem disablePadding sx={{ mb: 0.5 }}>
        <ListItemButton
          onClick={() => setSalesOpen((prev) => !prev)}
          sx={{
            borderRadius: '10px',
            py: 1.25,
            px: open ? 2 : 1.5,
            justifyContent: open ? 'initial' : 'center',
            color: location.pathname.startsWith('/sales') ? txt : muted,
            backgroundColor: location.pathname.startsWith('/sales') ? primary : 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: txt,
              backgroundColor: location.pathname.startsWith('/sales') ? primary : hoverBg,
              '& .MuiListItemIcon-root': { color: txt },
            },
            '& .MuiListItemIcon-root': {
              color: location.pathname.startsWith('/sales') ? txt : muted,
              minWidth: open ? 40 : 'auto',
              justifyContent: 'center',
              transition: 'all 0.2s ease-in-out',
            },
          }}
        >
          <ListItemIcon><SalesIcon /></ListItemIcon>
          <ListItemText
            primary="Sales"
            sx={{
              opacity: open ? 1 : 0,
              display: open ? 'block' : 'none',
              transition: 'opacity 0.2s',
              whiteSpace: 'nowrap',
            }}
            primaryTypographyProps={{ fontSize: '0.84rem', fontWeight: 500 }}
          />
          {open && (salesOpen ? <ExpandLess sx={{ color: muted }} /> : <ExpandMore sx={{ color: muted }} />)}
        </ListItemButton>
      </ListItem>

      <Collapse in={salesOpen && open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ pl: 4 }}>
          {SALES_SUBMENU.map((subitem) => {
            const isActive = location.pathname === subitem.path;
            return (
              <ListItem key={subitem.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(subitem.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 0.75,
                    px: 2,
                    justifyContent: 'initial',
                    color: isActive ? txt : muted,
                    backgroundColor: isActive ? primary : 'transparent',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      color: txt,
                      backgroundColor: isActive ? primary : hoverBg,
                      '& .MuiListItemIcon-root': { color: txt },
                    },
                    '& .MuiListItemIcon-root': {
                      color: isActive ? txt : muted,
                      minWidth: 36,
                      justifyContent: 'center',
                      transition: 'all 0.2s ease-in-out',
                    },
                  }}
                >
                  <ListItemIcon>{subitem.icon}</ListItemIcon>
                  <ListItemText
                    primary={subitem.text}
                    sx={{ opacity: open ? 1 : 0, display: open ? 'block' : 'none', transition: 'opacity 0.2s' }}
                    primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Collapse>
    </React.Fragment>
  );

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Space matching top navbar */}
      <Toolbar sx={{ minHeight: 64 }} />

      <List sx={{ px: 1.5, flexGrow: 1, mt: 1 }}>
        {orderedItems.map((item) => (item.group ? renderSalesGroup() : renderNavButton(item)))}
      </List>

      <Divider sx={{ borderColor: dividerCol }} />
      
      <Box sx={{ p: 2.5, textAlign: 'center' }}>
        <Typography variant="caption" display="block" sx={{ color: muted, opacity: open ? 1 : 0, display: open ? 'block' : 'none' }}>
          {companyName || 'SKR Garment'} v1.7
        </Typography>
      </Box>
    </Box>
  );

  // Render exactly one drawer for the active breakpoint. Rendering both and
  // toggling with CSS `display` left the temporary modal permanently mounted
  // and "open" on desktop, so MUI's modal backdrop/scroll-lock machinery ran
  // there — producing a stray dark scrim over the page content.
  const isTemporary = variant === 'temporary';

  if (isTemporary) {
    return (
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={open}
          onClose={onToggleSidebar}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              backgroundColor: nav,
              color: txt,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>
    );
  }

  return (
    <Box
      component="nav"
      sx={{ width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH, flexShrink: 0, transition: 'width 0.2s ease-in-out' }}
    >
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: open ? DRAWER_WIDTH : MINI_DRAWER_WIDTH,
            backgroundColor: nav,
            color: txt,
            borderRight: 'none',
            overflowX: 'hidden',
            transition: 'width 0.2s ease-in-out',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
export { DRAWER_WIDTH, MINI_DRAWER_WIDTH };
