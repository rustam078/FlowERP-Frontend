import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, CircularProgress, Drawer, IconButton, Stack, TextField, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import salesService from '../services/salesService';
import PaymentModeFields, { paymentModeLabel } from './PaymentModeFields';
import PaymentConfirmDialog from '../../../components/common/PaymentConfirmDialog';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';

// Every view that shows a customer's due or an invoice balance refreshes after a settlement.
const DUE_QUERY_KEYS = [
  'salesList', 'salesListSummary', 'salesDashboard', 'recentSales', 'saleDetails', 'invoicePreview',
  'customerOutstanding', 'customerPaymentHistory', 'dashboardOverview', 'dashboardDaily', 'dashRecentSales',
];

// Idempotency key for one settlement attempt (reused on retry, renewed after success).
const newRequestId = () => (window.crypto?.randomUUID
  ? window.crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  }));

const money = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/**
 * Right-side drawer to settle a customer's previous dues without a new sale.
 * The amount is allocated by the backend to unpaid invoices, oldest first.
 */
const SettleDueDrawer = ({ open, onClose, customerName, customerMobile, outstanding, onSettled }) => {
  const t = useT();
  const queryClient = useQueryClient();
  const [amountText, setAmountText] = useState('');
  const [mode, setMode] = useState('CASH');
  const [provider, setProvider] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const requestIdRef = useRef(null);

  // A fresh form (full due pre-filled) and a new idempotency key each time the drawer opens.
  useEffect(() => {
    if (!open) return;
    setAmountText(String(round2(outstanding)));
    setMode('CASH');
    setProvider('');
    setError('');
    setConfirmOpen(false);
    requestIdRef.current = newRequestId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const amount = round2(amountText);
  const remaining = Math.max(0, round2(outstanding - amount));
  const validationError = (() => {
    if (amount <= 0) return t('sales.settle.errAmount', 'Enter an amount greater than zero');
    if (amount > round2(outstanding)) return t('sales.settle.errExceeds', 'Amount cannot exceed the outstanding due');
    return '';
  })();

  const settleMutation = useMutation({
    mutationFn: salesService.settleCustomerDue,
    onSuccess: (result) => {
      DUE_QUERY_KEYS.forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
      requestIdRef.current = null;
      setConfirmOpen(false);
      onSettled?.(result);
    },
    onError: (err) => {
      setConfirmOpen(false);
      setError(err.message || t('sales.settle.failed', 'Unable to settle the due'));
    },
  });
  const busy = settleMutation.isPending;

  // Digits and one decimal point, at most two decimals; never more than the outstanding due.
  const handleAmountChange = (raw) => {
    let clean = raw.replace(/[^0-9.]/g, '');
    const [whole, ...rest] = clean.split('.');
    if (rest.length) clean = `${whole}.${rest.join('').slice(0, 2)}`;
    setAmountText(Number(clean) > outstanding ? String(round2(outstanding)) : clean);
    setError('');
  };

  const handleSettleClick = () => {
    if (validationError) { setError(validationError); return; }
    setError('');
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (busy) return; // a click while the request is in flight is ignored
    settleMutation.mutate({
      customerMobile,
      amount,
      paymentMode: mode,
      requestId: requestIdRef.current || (requestIdRef.current = newRequestId()),
    });
  };

  return (
    <Drawer
      anchor="right" open={open} onClose={busy ? undefined : onClose}
      sx={{ zIndex: 1250 }}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 }, p: 2.5, display: 'flex', flexDirection: 'column' } }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
        <AccountBalanceWalletOutlinedIcon sx={{ color: 'var(--theme-primary)' }} />
        <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', flexGrow: 1 }}>
          {t('sales.settle.title', 'Settle Previous Due')}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={busy}><CloseIcon fontSize="small" /></IconButton>
      </Stack>
      <Typography variant="caption" sx={{ color: '#94A3B8' }}>
        {t('sales.settle.hint', 'Paid against the oldest unpaid invoices first. No new sale is created.')}
      </Typography>

      {/* Customer + outstanding due (same tinted panel as the Total Payable card). */}
      <Box sx={{ mt: 2, p: 2, bgcolor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)' }}>
        <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{customerName || '—'}</Typography>
        <Typography variant="caption" sx={{ color: '#64748B' }}>{customerMobile}</Typography>
        <Typography sx={{ mt: 1.25, fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {t('sales.settle.outstanding', 'Outstanding due')}
        </Typography>
        <Typography sx={{ fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.2, color: 'var(--theme-primary)' }}>{money(outstanding)}</Typography>
      </Box>

      <Stack spacing={2.25} sx={{ mt: 2.5, flexGrow: 1 }}>
        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{t('sales.settle.amount', 'Settlement amount')}</Typography>
            <Button size="small" onClick={() => { setAmountText(String(round2(outstanding))); setError(''); }} disabled={busy}
              sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: 'var(--theme-primary)' }}>
              {t('sales.settle.fullDue', 'Full due')}
            </Button>
          </Stack>
          <TextField
            type="text" inputMode="decimal" variant="standard" fullWidth size="small"
            value={amountText} disabled={busy}
            onChange={(e) => handleAmountChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            error={Boolean(error) && Boolean(validationError)}
            InputProps={{ startAdornment: <Typography sx={{ color: 'var(--theme-primary)', mr: 0.5 }}>{getCurrencySymbol()}</Typography> }}
            inputProps={{ style: { fontWeight: 700, fontSize: '1.1rem', color: 'var(--theme-primary)' } }}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
            <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{t('sales.settle.remaining', 'Remaining due')}</Typography>
            <Typography sx={{ fontWeight: 700, color: remaining > 0 ? '#B91C1C' : '#15803D' }}>{money(remaining)}</Typography>
          </Stack>
        </Box>

        <PaymentModeFields mode={mode} provider={provider} onModeChange={setMode} onProviderChange={setProvider} disabled={busy} />

        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>

      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        <Button variant="text" fullWidth onClick={onClose} disabled={busy} sx={{ color: '#64748B' }}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" fullWidth onClick={handleSettleClick} disabled={busy || Boolean(validationError)}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : null} sx={{ fontWeight: 700 }}>
          {busy ? t('sales.processing', 'Processing…') : t('sales.settle.submit', 'Settle Due')}
        </Button>
      </Stack>

      <PaymentConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={busy}
        title={t('sales.settle.confirmTitle', 'Confirm Due Settlement')}
        confirmText={t('sales.settle.confirmButton', 'Confirm & Settle')}
        rows={[
          { label: t('sales.settle.customer', 'Customer'), value: customerName || customerMobile },
          { label: t('sales.paymentMode', 'Payment Mode'), value: paymentModeLabel(t, mode) + (mode !== 'CASH' && provider.trim() ? ` · ${provider.trim()}` : '') },
          { label: t('sales.settle.dueAmount', 'Due amount'), value: money(outstanding) },
          { label: t('sales.settle.amount', 'Settlement amount'), value: money(amount), strong: true },
        ]}
        dueAmount={remaining}
        dueText={money(remaining)}
      />
    </Drawer>
  );
};

export default SettleDueDrawer;
