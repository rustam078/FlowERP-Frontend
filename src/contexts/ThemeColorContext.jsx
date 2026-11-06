import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { makeTheme } from '../theme/theme';
import { darken } from '../utils/color';

const PRIMARY_KEY = 'skr_theme_primary';
const NAV_KEY = 'skr_theme_nav';
export const DEFAULT_PRIMARY = '#2B3D62';
export const DEFAULT_NAV = '#0F172A';

const ThemeColorContext = createContext(null);

// Access the current theme colors and setters from anywhere in the app.
export const useThemeColor = () =>
  useContext(ThemeColorContext) || {
    primary: DEFAULT_PRIMARY, setPrimary: () => {}, defaultPrimary: DEFAULT_PRIMARY,
    nav: DEFAULT_NAV, setNav: () => {}, defaultNav: DEFAULT_NAV,
  };

const read = (key, fallback) => {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
};

const store = (key, value, fallback) => {
  try {
    if (value && value !== fallback) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* storage unavailable — keep in-memory */ }
};

/**
 * Holds the app's primary + navigation colors on this device and feeds the primary to
 * both the MUI theme and Ant Design, so every button/accent re-themes live. The nav
 * color is exposed for the Sidebar. A CSS var (--theme-primary) is also published so
 * plain CSS/inline styles can follow the theme.
 */
export const AppThemeProvider = ({ children }) => {
  const [primary, setPrimaryState] = useState(() => read(PRIMARY_KEY, DEFAULT_PRIMARY));
  const [nav, setNavState] = useState(() => read(NAV_KEY, DEFAULT_NAV));

  const setPrimary = (color) => { const n = color || DEFAULT_PRIMARY; setPrimaryState(n); store(PRIMARY_KEY, n, DEFAULT_PRIMARY); };
  const setNav = (color) => { const n = color || DEFAULT_NAV; setNavState(n); store(NAV_KEY, n, DEFAULT_NAV); };

  // Publish CSS variables so non-React styles can read the theme too.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', primary);
    root.style.setProperty('--theme-primary-hover', darken(primary, 0.12));
    root.style.setProperty('--theme-nav', nav);
  }, [primary, nav]);

  const muiTheme = useMemo(() => makeTheme(primary), [primary]);
  const antdConfig = useMemo(() => ({
    algorithm: antdTheme.compactAlgorithm,
    token: {
      colorPrimary: primary,
      colorPrimaryHover: darken(primary, 0.12),
      colorPrimaryActive: darken(primary, 0.2),
      fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
      fontSize: 13,
      borderRadius: 8,
      controlHeight: 32,
    },
  }), [primary]);

  const value = useMemo(() => ({
    primary, setPrimary, defaultPrimary: DEFAULT_PRIMARY,
    nav, setNav, defaultNav: DEFAULT_NAV,
  }), [primary, nav]);

  return (
    <ThemeColorContext.Provider value={value}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ConfigProvider theme={antdConfig}>
          {children}
        </ConfigProvider>
      </ThemeProvider>
    </ThemeColorContext.Provider>
  );
};
