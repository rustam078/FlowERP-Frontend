import React from 'react';
import { Box, Button, Divider, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { getCurrencySymbol } from '../../../utils/currency';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { useT } from '../../../contexts/LanguageContext';

const InvoiceLayout = React.forwardRef(({ invoice }, ref) => {
  const { companyName } = useAppSettings();
  const t = useT();
  const formatAmount = (value) => (value != null ? `${getCurrencySymbol()}${Number(value).toLocaleString('en-IN')}` : '-');
  const invoiceDate = invoice?.createdAt?.split('T')[0] || invoice?.date || '-';

  return (
    <Paper
      ref={ref}
      data-invoice-layout="true"
      sx={{
        width: '210mm',
        maxWidth: '210mm',
        minWidth: '210mm',
        minHeight: '297mm',
        p: 4,
        mx: 'auto',
        backgroundColor: '#FFFFFF',
        boxSizing: 'border-box',
      }}
    >
      <Stack spacing={4}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>{companyName || 'SKR Garment'}</Typography>
          <Typography color="text.secondary">{t('sales.invoicePreview', 'Invoice Preview')}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('sales.invoiceNumber', 'Invoice Number')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoice.invoiceNumber || invoice.invoice || invoice.invoiceNo || '-'}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">{t('sales.invoiceDate', 'Invoice Date')}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{invoiceDate}</Typography>
          </Box>
        </Box>

        <Divider />

        <Box>
          <Typography variant="subtitle2" color="text.secondary">{t('sales.customerDetails', 'Customer Details')}</Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography sx={{ fontWeight: 700 }}>{invoice.customerName || invoice.customer || '-'}</Typography>
            <Typography>{invoice.customerMobile || invoice.mobile || '-'}</Typography>
            <Typography>{invoice.customerEmail || invoice.email || '-'}</Typography>
          </Stack>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('sales.product', 'Product')}</TableCell>
                <TableCell>{t('sales.colQuantity', 'Quantity')}</TableCell>
                <TableCell>{t('sales.colSellingPrice', 'Selling Price')}</TableCell>
                <TableCell>{t('sales.discount', 'Discount')}</TableCell>
                <TableCell>{t('sales.colLineTotal', 'Line Total')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items?.length ? invoice.items.map((item, index) => (
                <TableRow key={item.productId || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{item.productName || item.product || '-'}</TableCell>
                  <TableCell>{item.quantity ?? 0}</TableCell>
                  <TableCell>{formatAmount(item.sellingPrice)}</TableCell>
                  <TableCell>{formatAmount(item.discount)}</TableCell>
                  <TableCell>{formatAmount(item.lineTotal)}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                    <Typography color="text.secondary">{t('sales.noProductsInvoice', 'No products found for this invoice.')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Paper sx={{ width: 320, p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={1.5}>
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
                <Typography variant="body2" color="text.secondary">{t('sales.paymentMode', 'Payment Mode')}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{invoice.paymentMode || '-'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">{t('sales.paymentProvider', 'Payment Provider')}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{invoice.paymentProvider || '-'}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Box sx={{ pt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {t('sales.thankYou', 'Thank you for your business.')}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
});

export default InvoiceLayout;