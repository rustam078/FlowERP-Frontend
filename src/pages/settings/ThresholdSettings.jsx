import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../services/axios';
import { useT } from '../../contexts/LanguageContext';

/**
 * Global low-stock threshold setting (moved here from the Inventory page).
 * Loads and shows the current value, and lets the user update it.
 */
const ThresholdSettings = () => {
  const queryClient = useQueryClient();
  const t = useT();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: current, isLoading } = useQuery({
    queryKey: ['lowStockThresholdSetting'],
    queryFn: async () => {
      const res = await axiosInstance.get('/settings/LOW_STOCK_THRESHOLD');
      return res.data?.value ?? res.data?.threshold ?? '0';
    },
  });

  // Pre-fill with the current threshold once loaded.
  useEffect(() => {
    if (current != null) setValue(String(current));
  }, [current]);

  const handleSave = async () => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100000) {
      setError(t('settings.threshold.err', 'Threshold must be between 0 and 100000.'));
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await axiosInstance.put('/settings/LOW_STOCK_THRESHOLD', { threshold: String(parsed) });
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['lowStockThresholdSetting'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      window.dispatchEvent(new Event('inventory-alerts-updated'));
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('settings.threshold.errSave', 'Failed to save threshold.'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} /><Typography color="text.secondary">{t('settings.threshold.loading', 'Loading threshold…')}</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.threshold.help', 'Products at or below this stock level are flagged as low stock (shown on the bell alerts).')}
        {' '}{t('settings.threshold.current', 'Current threshold:')} <strong>{current ?? 0}</strong>.
      </Typography>
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ maxWidth: 420 }}>
        <TextField
          label={t('settings.threshold.label', 'Global Low Stock Threshold')}
          type="number"
          size="small"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
          inputProps={{ min: 0, max: 100000 }}
          error={Boolean(error)}
          helperText={error || ' '}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ mt: 0.25 }}>
          {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
        </Button>
      </Stack>
      {saved ? <Alert severity="success" sx={{ mt: 1, maxWidth: 420 }}>{t('settings.threshold.saved', 'Threshold updated.')}</Alert> : null}
    </Box>
  );
};

export default ThresholdSettings;
