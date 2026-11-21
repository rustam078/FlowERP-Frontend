import React, { useEffect, useState } from 'react';
import {
  Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Stack, TextField, Typography,
} from '@mui/material';
import portfolioService from '../../services/portfolioService';
import { useT } from '../../contexts/LanguageContext';

const EMPTY = { name: '', batchPrefix: '', adminFullName: '', adminEmail: '', adminPassword: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Live "is this prefix free?" check, debounced while the super admin types.
const usePrefixCheck = (prefix) => {
  const [state, setState] = useState('idle'); // idle | checking | free | taken
  useEffect(() => {
    if (prefix.length !== 2) { setState('idle'); return undefined; }
    setState('checking');
    const timer = setTimeout(() => {
      portfolioService.isPrefixAvailable(prefix)
        .then((free) => setState(free ? 'free' : 'taken'))
        .catch(() => setState('idle'));
    }, 300);
    return () => clearTimeout(timer);
  }, [prefix]);
  return state;
};

/** New portfolio: name, locked 2-letter batch prefix, and its first admin user. */
const CreatePortfolioDialog = ({ open, onClose, onCreated }) => {
  const t = useT();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const prefixState = usePrefixCheck(form.batchPrefix);

  useEffect(() => { if (open) { setForm(EMPTY); setError(''); } }, [open]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPrefix = (e) => setForm((f) => ({ ...f, batchPrefix: e.target.value.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() }));

  const valid = form.name.trim() && prefixState === 'free' && form.adminFullName.trim()
    && EMAIL_RE.test(form.adminEmail.trim()) && form.adminPassword.length >= 8;

  const prefixHelp = {
    idle: t('portfolio.prefixHelp', '2 letters, locked after saving. Batches will be numbered {p}001, {p}002 …').replaceAll('{p}', form.batchPrefix || 'XX'),
    checking: t('portfolio.prefixChecking', 'Checking…'),
    free: t('portfolio.prefixFree', '{p} is available — batches will be {p}001, {p}002 …').replaceAll('{p}', form.batchPrefix),
    taken: t('portfolio.prefixTaken', '{p} is already used by another portfolio — try different letters').replaceAll('{p}', form.batchPrefix),
  }[prefixState];

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const created = await portfolioService.create({ ...form, name: form.name.trim(), adminEmail: form.adminEmail.trim() });
      onCreated?.(created);
    } catch (err) {
      setError(err.message || t('portfolio.createFailed', 'Could not create the portfolio'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800 }}>{t('portfolio.newTitle', 'New Portfolio')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label={t('portfolio.name', 'Portfolio name')} value={form.name} onChange={set('name')} size="small" required autoFocus inputProps={{ maxLength: 120 }} />
          <TextField
            label={t('portfolio.batchPrefix', 'Batch prefix')} value={form.batchPrefix} onChange={setPrefix} size="small" required
            error={prefixState === 'taken'} helperText={prefixHelp}
            FormHelperTextProps={{ sx: { color: prefixState === 'free' ? '#15803D' : undefined } }}
            InputProps={{ endAdornment: prefixState === 'checking' ? <CircularProgress size={16} /> : null }}
            inputProps={{ style: { textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700 } }}
          />
          <Divider />
          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>{t('portfolio.firstAdmin', 'First admin of this portfolio')}</Typography>
          <TextField label={t('portfolio.adminName', 'Admin full name')} value={form.adminFullName} onChange={set('adminFullName')} size="small" required />
          <TextField label={t('portfolio.adminEmail', 'Admin email (login)')} type="email" value={form.adminEmail} onChange={set('adminEmail')} size="small" required />
          <TextField
            label={t('portfolio.adminPassword', 'Admin password')} type="password" value={form.adminPassword} onChange={set('adminPassword')} size="small" required
            error={form.adminPassword.length > 0 && form.adminPassword.length < 8} helperText={t('settings.users.min8', 'Minimum 8 characters')}
          />
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" onClick={handleSave} disabled={!valid || saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
          {t('portfolio.create', 'Create Portfolio')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePortfolioDialog;
