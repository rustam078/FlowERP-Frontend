import React from 'react';
import { MenuItem, TextField } from '@mui/material';
import { useT } from '../../../contexts/LanguageContext';

// Payment modes taken at the counter — one list for the sale checkout and due settlement.
export const PAYMENT_MODES = [
  { value: 'CASH', key: 'sales.cash', fallback: 'Cash' },
  { value: 'UPI', key: 'sales.upi', fallback: 'UPI' },
  { value: 'CREDIT_CARD', key: 'sales.creditCard', fallback: 'Credit Card' },
  { value: 'DEBIT_CARD', key: 'sales.debitCard', fallback: 'Debit Card' },
  { value: 'NET_BANKING', key: 'sales.netBanking', fallback: 'Net Banking' },
];

// Translated label of a payment mode (for confirmations and summaries).
export const paymentModeLabel = (t, mode) => {
  const found = PAYMENT_MODES.find((m) => m.value === mode);
  return found ? t(found.key, found.fallback) : (mode || '-');
};

/** Payment mode select + optional provider (non-cash only), bottom-border style. */
const PaymentModeFields = ({ mode, provider, onModeChange, onProviderChange, disabled = false, showProvider = true }) => {
  const t = useT();
  return (
    <>
      <TextField
        label={t('sales.paymentMode', 'Payment Mode')} select value={mode}
        onChange={(e) => onModeChange(e.target.value)}
        fullWidth size="small" variant="standard" disabled={disabled}
      >
        {PAYMENT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{t(m.key, m.fallback)}</MenuItem>)}
      </TextField>
      {showProvider && mode !== 'CASH' ? (
        <TextField
          label={t('sales.paymentProvider', 'Payment Provider')} value={provider}
          onChange={(e) => onProviderChange(e.target.value)}
          fullWidth size="small" variant="standard" disabled={disabled}
          inputProps={{ maxLength: 100 }}
        />
      ) : null}
    </>
  );
};

export default PaymentModeFields;
