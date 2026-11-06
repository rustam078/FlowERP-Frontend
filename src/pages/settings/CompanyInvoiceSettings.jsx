import React, { useEffect, useState } from 'react';
import {
  Alert, Box, Button, CircularProgress, Divider, FormControlLabel, Grid, InputAdornment, Stack, Switch, TextField, Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import settingsService from '../../services/settingsService';
import { useT } from '../../contexts/LanguageContext';

// Field metadata drives both rendering and the save loop. i18n via labelKey/phKey.
const COMPANY_FIELDS = [
  { key: 'COMPANY_NAME', labelKey: 'settings.company.name', label: 'Company Name', phKey: 'settings.company.namePlaceholder', placeholder: 'e.g. SKR Garment' },
  { key: 'COMPANY_GSTIN', labelKey: 'settings.company.gstin', label: 'Company GSTIN', phKey: 'settings.company.gstinPlaceholder', placeholder: 'e.g. 10ABCDE1234F1Z5' },
  { key: 'COMPANY_CONTACT', labelKey: 'settings.company.contact', label: 'Contact (phone / email)', phKey: 'settings.company.contactPlaceholder', placeholder: 'e.g. +91 90000 12345' },
  { key: 'COMPANY_ADDRESS', labelKey: 'settings.company.address', label: 'Address', phKey: 'settings.company.addressPlaceholder', placeholder: 'Street, City, State, PIN', multiline: true, rows: 2, full: true },
];

/**
 * Company profile + invoice defaults. Company info is used live across the app
 * (invoices, headers). GST % and currency symbol are defaults for NEW invoices —
 * changing them does not alter already-created invoices.
 */
const CompanyInvoiceSettings = () => {
  const queryClient = useQueryClient();
  const t = useT();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['appSettings'],
    queryFn: settingsService.getAll,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Prefill once loaded.
  useEffect(() => {
    if (settings) {
      setForm({
        COMPANY_NAME: settings.COMPANY_NAME ?? '',
        COMPANY_GSTIN: settings.COMPANY_GSTIN ?? '',
        COMPANY_CONTACT: settings.COMPANY_CONTACT ?? '',
        COMPANY_ADDRESS: settings.COMPANY_ADDRESS ?? '',
        DEFAULT_GST_PERCENT: settings.DEFAULT_GST_PERCENT ?? '0',
        SALES_GST_ENABLED: String(settings.SALES_GST_ENABLED).toLowerCase() === 'true' ? 'true' : 'false',
        CURRENCY_SYMBOL: settings.CURRENCY_SYMBOL ?? '₹',
      });
    }
  }, [settings]);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setSaved(false); };

  const handleSave = async () => {
    const gst = Number(form.DEFAULT_GST_PERCENT);
    if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
      setError(t('settings.company.errGst', 'GST % must be between 0 and 100.'));
      return;
    }
    if (!String(form.CURRENCY_SYMBOL || '').trim()) {
      setError(t('settings.company.errCurrency', 'Currency symbol cannot be empty.'));
      return;
    }
    if (!String(form.COMPANY_NAME || '').trim()) {
      setError(t('settings.company.errName', 'Company name cannot be empty.'));
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      // Save only changed keys.
      const changed = Object.keys(form).filter((k) => String(form[k] ?? '') !== String(settings?.[k] ?? ''));
      await Promise.all(changed.map((k) => settingsService.update(k, form[k])));
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('settings.company.errSave', 'Failed to save settings.'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} /><Typography color="text.secondary">{t('settings.company.loading', 'Loading settings…')}</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>{t('settings.company.profile', 'Company Profile')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.company.profileHelp', 'Shown on every invoice and document. Update once — it reflects everywhere.')}
      </Typography>
      <Grid container spacing={2}>
        {COMPANY_FIELDS.map((f) => (
          <Grid item xs={12} sm={f.full ? 12 : 6} key={f.key}>
            <TextField
              fullWidth size="small"
              label={t(f.labelKey, f.label)}
              placeholder={t(f.phKey, f.placeholder)}
              value={form[f.key] ?? ''}
              onChange={set(f.key)}
              multiline={f.multiline}
              rows={f.rows}
            />
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 3 }} />

      <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>{t('settings.company.invoiceDefaults', 'Invoice Defaults')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.company.invoiceDefaultsHelp1', 'Applied to')} <strong>{t('settings.company.newWord', 'new')}</strong> {t('settings.company.invoiceDefaultsHelp2', 'invoices only. Existing invoices keep the values they were created with.')}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={String(form.SALES_GST_ENABLED).toLowerCase() === 'true'}
              onChange={(e) => { setForm((f) => ({ ...f, SALES_GST_ENABLED: e.target.checked ? 'true' : 'false' })); setSaved(false); }}
            />
          }
          label={<Typography sx={{ fontWeight: 600 }}>{t('settings.company.applyGst', 'Apply GST on sales')}</Typography>}
        />
        <Typography variant="body2" color="text.secondary">
          {t('settings.company.applyGstHelp', 'When ON, every new sale adds GST (at the % below) on top of the net amount. When OFF, sales are recorded without GST.')}
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" type="number"
            label={t('settings.company.defaultGst', 'Default GST %')}
            value={form.DEFAULT_GST_PERCENT ?? ''}
            onChange={set('DEFAULT_GST_PERCENT')}
            inputProps={{ min: 0, max: 100, step: 0.5 }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small"
            label={t('settings.company.currencySymbol', 'Currency Symbol')}
            value={form.CURRENCY_SYMBOL ?? ''}
            onChange={set('CURRENCY_SYMBOL')}
            inputProps={{ maxLength: 4 }}
            helperText={t('settings.company.currencyHelper', 'e.g. ₹, $, €, £')}
          />
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 3 }}>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving', 'Saving…') : t('settings.company.saveChanges', 'Save Changes')}
        </Button>
        {saved ? <Alert severity="success" sx={{ py: 0 }}>{t('settings.company.saved', 'Settings saved. Refresh other tabs to see currency changes.')}</Alert> : null}
        {error ? <Alert severity="error" sx={{ py: 0 }}>{error}</Alert> : null}
      </Stack>
    </Box>
  );
};

export default CompanyInvoiceSettings;
