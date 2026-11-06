import React from 'react';
import { Box, Button, Card, CardContent, Grid, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import { useT } from '../../../contexts/LanguageContext';

const paymentModes = ['All', 'CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'WALLET', 'CREDIT'];
const paymentStatuses = ['All', 'PAID', 'DUE'];

const SalesFilter = ({ filters, onChange, onReset, onRefresh }) => {
  const t = useT();
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t('sales.filterSales', 'Filter Sales')}
            </Typography>
            <Typography color="text.secondary" variant="body2">
              {t('sales.filterSalesDesc', 'Search invoices, customers or filter by dates and payment status.')}
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label={t('sales.searchInvoiceCustomerMobileCap', 'Search Invoice / Customer / Mobile')}
                name="search"
                value={filters.search}
                onChange={onChange}
                fullWidth
                size="small"
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                label={t('common.from', 'From')}
                name="fromDate"
                value={filters.fromDate}
                onChange={onChange}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2.5}>
              <TextField
                label={t('common.to', 'To')}
                name="toDate"
                value={filters.toDate}
                onChange={onChange}
                type="date"
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('sales.paymentMode', 'Payment Mode')}</InputLabel>
                <Select
                  name="paymentMode"
                  value={filters.paymentMode}
                  label={t('sales.paymentMode', 'Payment Mode')}
                  onChange={onChange}
                >
                  {paymentModes.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode === 'All' ? t('common.all', 'All') : (mode === 'CREDIT' ? t('sales.creditUdhaar', 'Credit (Udhaar)') : mode.replace(/_/g, ' '))}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={1.5}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('sales.paymentStatus', 'Payment Status')}</InputLabel>
                <Select
                  name="paymentStatus"
                  value={filters.paymentStatus}
                  label={t('sales.paymentStatus', 'Payment Status')}
                  onChange={onChange}
                >
                  {paymentStatuses.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status === 'All' ? t('common.all', 'All') : t(`sales.status.${status}`, status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="flex-end">
            <Button variant="outlined" startIcon={<ReplayIcon />} onClick={onReset}>
              {t('sales.resetFilter', 'Reset Filter')}
            </Button>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={onRefresh}>
              {t('common.refresh', 'Refresh')}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default SalesFilter;
