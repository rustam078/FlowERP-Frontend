import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import settingsService from '../../services/settingsService';
import { MENU_LABELS, orderMenu } from '../../components/layout/Sidebar';
import { useT } from '../../contexts/LanguageContext';

/**
 * Reorder the left sidebar. Saves MENU_ORDER (JSON array of keys). The sidebar reads
 * the same setting and renders items ascending by this order.
 */
const MenuOrderSettings = () => {
  const queryClient = useQueryClient();
  const t = useT();
  const [items, setItems] = useState([]); // [{ key, text }]
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => {
    let order = [];
    try {
      const parsed = JSON.parse(settings?.MENU_ORDER ?? '[]');
      if (Array.isArray(parsed)) order = parsed;
    } catch { /* ignore */ }
    // Resolve saved order against the known menu (adds any new items at the end).
    setItems(orderMenu(MENU_LABELS, order));
  }, [settings]);

  const move = (index, dir) => {
    setSaved(false);
    setItems((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const order = JSON.stringify(items.map((i) => i.key));
      await settingsService.update('MENU_ORDER', order);
      setSaved(true);
      // Update the shared cache right away so the sidebar reorders instantly,
      // then invalidate to stay in sync with the server.
      queryClient.setQueryData(['appSettings'], (old) => ({ ...(old || {}), MENU_ORDER: order }));
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('settings.menu.errSave', 'Failed to save menu order.'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} /><Typography color="text.secondary">{t('settings.menu.loading', 'Loading menu order…')}</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.menu.help', 'Use the arrows to set the order of items in the left menu (top = first). Save to apply.')}
      </Typography>
      <Stack spacing={1} sx={{ maxWidth: 380 }}>
        {items.map((item, i) => (
          <Stack
            key={item.key}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, px: 1.5, py: 0.75 }}
          >
            <Typography sx={{ fontWeight: 600 }}>
              <span style={{ color: '#94A3B8', marginRight: 8 }}>{i + 1}.</span>{t('nav.' + item.key, item.text)}
            </Typography>
            <Box>
              <IconButton size="small" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
            </Box>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving', 'Saving…') : t('settings.menu.saveOrder', 'Save Order')}
        </Button>
        {saved ? <Alert severity="success" sx={{ py: 0 }}>{t('settings.menu.saved', 'Menu order updated.')}</Alert> : null}
        {error ? <Alert severity="error" sx={{ py: 0 }}>{error}</Alert> : null}
      </Stack>
    </Box>
  );
};

export default MenuOrderSettings;
