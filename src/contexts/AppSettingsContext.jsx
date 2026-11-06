import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import settingsService from '../services/settingsService';
import { setCurrencySymbol, formatMoney } from '../utils/currency';

const AppSettingsContext = createContext(null);

// Fallbacks used before settings load (or if the API is unavailable).
const DEFAULTS = {
  COMPANY_NAME: 'SKR Garment',
  COMPANY_ADDRESS: '',
  COMPANY_CONTACT: '',
  COMPANY_GSTIN: '',
  DEFAULT_GST_PERCENT: '0',
  SALES_GST_ENABLED: 'false',
  CURRENCY_SYMBOL: '₹',
  MENU_ORDER: '["dashboard","production","inventory","products","investment","employees","sales","settings"]',
  ROLE_PERMISSIONS: '{}',
  STAFF_DASHBOARD_BOARDS: '["overview","sales","inventory","expenses","employees"]',
};

/**
 * Loads company profile + invoice defaults (currency symbol, GST %) once and exposes
 * them app-wide. Company info is read live everywhere; changing it in Settings and
 * refetching updates every consumer. Currency symbol is also pushed into the module-level
 * cache in utils/currency so non-React code can format money identically.
 */
export const AppSettingsProvider = ({ children }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getAll,
    // Short stale window + refetch on focus so permission/menu changes made by an admin
    // propagate to an already-open session soon after (login forces an immediate refetch).
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  const map = useMemo(() => ({ ...DEFAULTS, ...(data || {}) }), [data]);

  // Keep the module-level currency cache in sync for plain (non-React) formatters.
  useEffect(() => {
    setCurrencySymbol(map.CURRENCY_SYMBOL);
  }, [map.CURRENCY_SYMBOL]);

  const value = useMemo(() => {
    const gstPercent = Number(map.DEFAULT_GST_PERCENT) || 0;
    const gstEnabled = String(map.SALES_GST_ENABLED).toLowerCase() === 'true';
    const currencySymbol = map.CURRENCY_SYMBOL || '₹';
    let menuOrder = [];
    try {
      const parsed = JSON.parse(map.MENU_ORDER);
      if (Array.isArray(parsed)) menuOrder = parsed.filter((k) => typeof k === 'string');
    } catch { /* keep empty → sidebar uses its built-in order */ }

    let rolePermissions = {};
    try {
      const parsed = JSON.parse(map.ROLE_PERMISSIONS);
      if (parsed && typeof parsed === 'object') rolePermissions = parsed;
    } catch { /* keep empty → staff sees nothing until configured */ }

    let staffDashboardBoards = [];
    try {
      const parsed = JSON.parse(map.STAFF_DASHBOARD_BOARDS);
      if (Array.isArray(parsed)) staffDashboardBoards = parsed.filter((k) => typeof k === 'string');
    } catch { /* keep empty → staff sees no boards until configured */ }
    return {
      isLoading,
      raw: map,
      menuOrder,
      rolePermissions,
      staffDashboardBoards,
      company: {
        name: map.COMPANY_NAME,
        address: map.COMPANY_ADDRESS,
        contact: map.COMPANY_CONTACT,
        gstin: map.COMPANY_GSTIN,
      },
      companyName: map.COMPANY_NAME,
      gstPercent,
      gstEnabled,
      currencySymbol,
      // Convenience formatter bound to the current symbol.
      money: (v, opts) => formatMoney(v, opts),
    };
  }, [map, isLoading]);

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within an AppSettingsProvider');
  return ctx;
};

// Always refetches settings on mount so a sale form reflects the current GST without
// visiting Settings first; falls back to 0/off when not configured.
export const useGstConfig = () => {
  const { data } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const map = { ...DEFAULTS, ...(data || {}) };
  return {
    gstEnabled: String(map.SALES_GST_ENABLED).toLowerCase() === 'true',
    gstPercent: Number(map.DEFAULT_GST_PERCENT) || 0,
  };
};
