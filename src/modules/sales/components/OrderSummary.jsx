import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Stack,
  Button,
} from '@mui/material';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';

const OrderSummary = ({ values, onChange, paymentProviderVisible, onSave, onCancel, loading }) => {
  const t = useT();
  const subtotal = values.subtotal ?? 0;
  const discount = values.discount ?? 0;
  const tax = values.tax ?? 0;
  const grandTotal = subtotal - discount + tax;

  return (
    <Card sx={{ borderRadius: 2, position: 'sticky', top: 24 }}>
      <CardHeader title={t('sales.orderSummary', 'Order Summary')} />
      <CardContent sx={{ display: 'grid', gap: 2 }}>
        <Box>
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{t('sales.subtotal', 'Subtotal')}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{getCurrencySymbol()}{subtotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{t('sales.discount', 'Discount')}</Typography>
              <Typography>{getCurrencySymbol()}{discount.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">{t('sales.tax', 'Tax')}</Typography>
              <Typography>{getCurrencySymbol()}{tax.toFixed(2)}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700 }}>{t('sales.grandTotal', 'Grand Total')}</Typography>
              <Typography sx={{ fontWeight: 700 }}>{getCurrencySymbol()}{grandTotal.toFixed(2)}</Typography>
            </Box>
          </Stack>
        </Box>

        <FormControl fullWidth>
          <InputLabel>{t('sales.paymentMode', 'Payment Mode')}</InputLabel>
          <Select name="paymentMode" value={values.paymentMode} label={t('sales.paymentMode', 'Payment Mode')} onChange={onChange}>
            <MenuItem value="CASH">{t('sales.cash', 'Cash')}</MenuItem>
            <MenuItem value="UPI">{t('sales.upi', 'UPI')}</MenuItem>
            <MenuItem value="CREDIT_CARD">{t('sales.creditCard', 'Credit Card')}</MenuItem>
            <MenuItem value="DEBIT_CARD">{t('sales.debitCard', 'Debit Card')}</MenuItem>
            <MenuItem value="NET_BANKING">{t('sales.netBanking', 'Net Banking')}</MenuItem>
            <MenuItem value="WALLET">{t('sales.wallet', 'Wallet')}</MenuItem>
          </Select>
        </FormControl>

        {paymentProviderVisible && (
          <TextField
            label={t('sales.paymentProvider', 'Payment Provider')}
            name="paymentProvider"
            value={values.paymentProvider}
            onChange={onChange}
            fullWidth
          />
        )}

        <Stack spacing={2}>
          <Button variant="contained" color="primary" fullWidth onClick={onSave} disabled={loading}>
            {loading ? t('sales.savingDots', 'Saving...') : t('sales.saveSale', 'Save Sale')}
          </Button>
          <Button variant="outlined" color="inherit" fullWidth onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default OrderSummary;
