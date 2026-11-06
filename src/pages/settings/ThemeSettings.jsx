import React from 'react';
import { ColorPicker, Button } from 'antd';
import { Box, Typography, Divider } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import { useThemeColor, DEFAULT_PRIMARY, DEFAULT_NAV } from '../../contexts/ThemeColorContext';
import { useT } from '../../contexts/LanguageContext';

// Common, widely-used theme colours (blue, teal, green, purple, orange, red).
const COMMON = ['#2563EB', '#0F766E', '#16A34A', '#7C3AED', '#EA580C', '#DC2626'];
const PRIMARY_PRESETS = [DEFAULT_PRIMARY, ...COMMON];
const NAV_PRESETS = [DEFAULT_NAV, ...COMMON];

// One-click themes: each sets both the primary (buttons/icons/accents) and the sidebar colour.
const THEMES = [
  { name: 'Midnight', primary: DEFAULT_PRIMARY, nav: DEFAULT_NAV },
  { name: 'Ocean', primary: '#0369A1', nav: '#0C4A6E' },
  { name: 'Forest', primary: '#15803D', nav: '#14532D' },
  { name: 'Royal', primary: '#6D28D9', nav: '#2E1065' },
  { name: 'Sunset', primary: '#C2410C', nav: '#7C2D12' },
  { name: 'Charcoal', primary: '#334155', nav: '#111827' },
  { name: 'Teal', primary: '#0F766E', nav: '#134E4A' },
  { name: 'Wine', primary: '#9F1239', nav: '#4C0519' },
  { name: 'Slate Blue', primary: '#3730A3', nav: '#1E1B4B' },
  { name: 'Diwali', primary: '#B45309', nav: '#78350F' },
  { name: 'Holi', primary: '#BE185D', nav: '#581C87' },
  { name: 'New Year', primary: '#CA8A04', nav: '#111827' },
];

const eq = (a, b) => (a || '').toLowerCase() === (b || '').toLowerCase();

// One colour row: picker + quick swatches + reset.
const ColorRow = ({ label, help, value, onChange, presets, defaultValue }) => {
  const t = useT();
  return (
  <Box>
    <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{label}</Typography>
    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.25 }}>{help}</Typography>
    <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
      <ColorPicker value={value} onChangeComplete={(c) => onChange(c.toHexString())} showText size="large" />
      {presets.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          title={c}
          style={{
            width: 24, height: 24, borderRadius: 6, cursor: 'pointer', background: c,
            border: eq(value, c) ? '2px solid #0F172A' : '2px solid #E2E8F0',
          }}
        />
      ))}
      <Button size="small" onClick={() => onChange(defaultValue)} disabled={eq(value, defaultValue)}>{t('common.reset', 'Reset')}</Button>
    </Box>
  </Box>
  );
};

// A clickable preset card showing a mini sidebar+primary preview.
const ThemeCard = ({ theme, active, onClick }) => {
  const t = useT();
  return (
  <Box
    onClick={onClick}
    sx={{
      cursor: 'pointer', borderRadius: 2, p: 1.25, display: 'flex', alignItems: 'center', gap: 1.25,
      bgcolor: '#fff', position: 'relative',
      border: active ? '2px solid' : '1px solid', borderColor: active ? 'primary.main' : 'divider',
      transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' },
    }}
  >
    <Box sx={{ display: 'flex', width: 48, height: 32, borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid #E2E8F0' }}>
      <Box sx={{ width: 16, bgcolor: theme.nav }} />
      <Box sx={{ flex: 1, bgcolor: theme.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.9)' }} />
      </Box>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{theme.name}</Typography>
      <Typography variant="caption" sx={{ color: active ? 'primary.main' : 'text.disabled', fontWeight: 700 }}>
        {active ? t('settings.theme.active', 'Active') : t('settings.theme.apply', 'Apply')}
      </Typography>
    </Box>
    {active && <CheckCircleRoundedIcon sx={{ position: 'absolute', top: 6, right: 6, fontSize: 16, color: 'primary.main' }} />}
  </Box>
  );
};

// Lets the user pick a ready-made theme, or fine-tune the primary + navigation colours.
const ThemeSettings = () => {
  const { primary, setPrimary, nav, setNav } = useThemeColor();
  const t = useT();
  const applyTheme = (th) => { setPrimary(th.primary); setNav(th.nav); };

  return (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {/* Left: custom colours + preview */}
      <Box sx={{ flex: '1 1 320px', minWidth: 280, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <ColorRow
          label={t('settings.theme.primary', 'Primary colour')}
          help={t('settings.theme.primaryHelp', 'Buttons, icons, highlights and the Total Amount panels.')}
          value={primary} onChange={setPrimary} presets={PRIMARY_PRESETS} defaultValue={DEFAULT_PRIMARY}
        />
        <Divider />
        <ColorRow
          label={t('settings.theme.nav', 'Navigation colour')}
          help={t('settings.theme.navHelp', 'Left sidebar background. Text and icons adjust for contrast.')}
          value={nav} onChange={setNav} presets={NAV_PRESETS} defaultValue={DEFAULT_NAV}
        />
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 700 }}>{t('settings.theme.preview', 'Preview')}</Typography>
          <Box sx={{ mt: 1.25, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button type="primary">{t('settings.theme.primaryBtn', 'Primary Button')}</Button>
            <Box sx={{ px: 2, py: 1, color: '#fff', fontWeight: 800, borderRadius: 1, bgcolor: 'primary.main' }}>{t('settings.theme.totalAmount', 'Total Amount ₹0')}</Box>
          </Box>
        </Box>
      </Box>

      {/* Right: one-click suggested themes (fills the space) */}
      <Box sx={{ flex: '1 1 320px', minWidth: 280 }}>
        <Typography sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{t('settings.theme.suggested', 'Suggested themes')}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.25 }}>
          {t('settings.theme.suggestedHelp', 'One click sets both the primary and sidebar colours.')}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1.25 }}>
          {THEMES.map((th) => (
            <ThemeCard key={th.name} theme={th} active={eq(primary, th.primary) && eq(nav, th.nav)} onClick={() => applyTheme(th)} />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default ThemeSettings;
