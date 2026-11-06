import React from 'react';
import { Box, Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';

const InvoiceSummary = ({ invoice }) => {
  const t = useT();
  const formatAmount = (value) => (value != null ? `${getCurrencySymbol()}${Number(value).toLocaleString('en-IN')}` : '-');

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title={t('sales.invoiceSummary', 'Invoice Summary')} sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }} />
      <Divider />
      <CardContent>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{t('sales.subtotal', 'Subtotal')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatAmount(invoice.subtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{t('sales.discount', 'Discount')}</Typography>
            <Typography>{formatAmount(invoice.discount)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography color="text.secondary">{t('sales.tax', 'Tax')}</Typography>
            <Typography>{formatAmount(invoice.tax)}</Typography>
          </Box>
          <Divider />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700 }}>{t('sales.grandTotal', 'Grand Total')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatAmount(invoice.grandTotal)}</Typography>
          </Box>
          <Divider />
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('sales.paymentMode', 'Payment Mode')}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.paymentMode || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('sales.paymentProvider', 'Payment Provider')}
            </Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.paymentProvider || '-'}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default InvoiceSummary;
