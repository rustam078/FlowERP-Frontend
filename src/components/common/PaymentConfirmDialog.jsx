import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
} from '@mui/material';
import { useT } from '../../contexts/LanguageContext';

/**
 * Shared "confirm before submit" dialog for Sale + Investment.
 * Shows payment mode, amounts and — most importantly — the leftover due,
 * so the user doesn't accidentally submit an unpaid (udhaar) bill.
 */
const PaymentConfirmDialog = ({
  open, onCancel, onConfirm, loading = false,
  title, confirmText,
  rows = [], dueAmount = 0, dueText = '', dueNote = '',
}) => {
  const t = useT();
  return (
  <Dialog open={open} onClose={loading ? undefined : onCancel} maxWidth="xs" fullWidth>
    <DialogTitle sx={{ fontWeight: 800, color: '#0F172A' }}>{title ?? t('common.confirm', 'Confirm')}</DialogTitle>
    <DialogContent>
      <Stack spacing={1.1} sx={{ mt: 0.5 }}>
        {rows.map((r, i) => (
          <Stack key={i} direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: '#64748B', fontSize: '0.88rem' }}>{r.label}</Typography>
            <Typography sx={{ color: '#0F172A', fontWeight: r.strong ? 800 : 600, fontSize: r.strong ? '1rem' : '0.9rem' }}>
              {r.value}
            </Typography>
          </Stack>
        ))}
      </Stack>

      {dueAmount > 0 ? (
        <Typography sx={{ mt: 1.5, color: '#B91C1C', fontSize: '0.85rem', fontWeight: 600 }}>
          {dueText} {t('ui.payment.remainDueSuffix', 'will remain on due.')}
        </Typography>
      ) : (
        <Typography sx={{ mt: 1.5, color: '#15803D', fontSize: '0.85rem', fontWeight: 600 }}>
          {t('ui.payment.fullyPaid', 'Fully paid.')}
        </Typography>
      )}
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ textTransform: 'none', color: '#64748B' }}>{t('common.cancel', 'Cancel')}</Button>
      <Button variant="contained" onClick={onConfirm} disabled={loading} sx={{ textTransform: 'none', fontWeight: 700 }}>
        {loading ? t('ui.nav.saving', 'Saving…') : (confirmText ?? t('common.confirm', 'Confirm'))}
      </Button>
    </DialogActions>
  </Dialog>
  );
};

export default PaymentConfirmDialog;
