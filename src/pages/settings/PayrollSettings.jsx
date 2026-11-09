import React from 'react';
import { Alert, Box, CircularProgress, FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../services/axios';
import { useT } from '../../contexts/LanguageContext';

const KEY = 'PAYROLL_AUTO_SETTLE';

/**
 * Auto-settle salary/piece dues from the advance balance when a new month starts.
 * On  -> completed months are settled automatically from advance (if any), else left due.
 * Off -> the admin settles each month manually.
 */
const PayrollSettings = () => {
  const queryClient = useQueryClient();
  const t = useT();
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState('');

  const { data: enabled, isLoading } = useQuery({
    queryKey: ['payrollAutoSettle'],
    queryFn: async () => {
      const res = await axiosInstance.get(`/settings/${KEY}`);
      return String(res.data?.value ?? 'false') === 'true';
    },
  });

  const handleToggle = async (checked) => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await axiosInstance.put(`/settings/${KEY}`, { threshold: checked ? 'true' : 'false' });
      setSaved(true);
      queryClient.invalidateQueries({ queryKey: ['payrollAutoSettle'] });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('settings.autoSettle.errSave', 'Failed to save setting.'));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} /><Typography color="text.secondary">{t('common.loading', 'Loading…')}</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.autoSettle.help', 'When on, each completed month’s salary or piece-work due is automatically settled from the employee’s advance balance. When off, you settle each month manually.')}
      </Typography>
      <FormControlLabel
        control={<Switch checked={!!enabled} disabled={saving} onChange={(e) => handleToggle(e.target.checked)} />}
        label={t('settings.autoSettle.label', 'Auto-settle dues from advance')}
      />
      {saved ? <Alert severity="success" sx={{ mt: 1, maxWidth: 420 }}>{t('settings.autoSettle.saved', 'Setting updated.')}</Alert> : null}
      {error ? <Alert severity="error" sx={{ mt: 1, maxWidth: 420 }}>{error}</Alert> : null}
    </Box>
  );
};

export default PayrollSettings;
