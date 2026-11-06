import React, { useState, useEffect } from 'react';
import { Box, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import Sidebar, { DRAWER_WIDTH } from '../components/layout/Sidebar';
import LowStockAlertsDrawer from '../components/layout/LowStockAlertsDrawer';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [alertsOpen, setAlertsOpen] = useState(false);

  // The navbar bell opens the global low-stock alerts drawer on the current page.
  useEffect(() => {
    const open = () => setAlertsOpen(true);
    window.addEventListener('open-inventory-alerts', open);
    return () => window.removeEventListener('open-inventory-alerts', open);
  }, []);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Header AppBar */}
      <Navbar onToggleSidebar={handleToggleSidebar} sidebarOpen={sidebarOpen} />

      {/* Side Navigation Menu */}
      <Sidebar
        open={sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        variant={isMdUp ? 'permanent' : 'temporary'}
      />

      {/* Primary Page Canvas */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2.5, md: 4 },
          height: '100vh',
          overflow: 'auto',
          width: {
            xs: '100%',
            md: sidebarOpen ? `calc(100% - ${DRAWER_WIDTH}px)` : '100%',
          },
          marginLeft: 0,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Spacer for Toolbar alignment */}
        <Toolbar sx={{ minHeight: 64, mb: 1 }} />
        
        {/* Render child routes */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Outlet />
        </Box>
      </Box>

      {/* Global low-stock alerts drawer (opened by the navbar bell) */}
      <LowStockAlertsDrawer open={alertsOpen} onClose={() => setAlertsOpen(false)} />
    </Box>
  );
};

export default MainLayout;
