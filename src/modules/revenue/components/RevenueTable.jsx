import React from 'react';
import {
  Alert, Box, Card, CardContent, Chip, Paper, Skeleton, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, Typography,
} from '@mui/material';
import PaidOutlinedIcon from '@mui/icons-material/PaidOutlined';
import dayjs from 'dayjs';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';
import { paymentModeLabel } from '../../sales/components/PaymentModeFields';

const MODULE_COLOR = { SALES: 'success', INVESTMENT: 'warning', EMPLOYEE: 'info' };
const money = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// Reference line under the invoice / code: which invoice cleared it, or the payment note.
const noteText = (t, row) => {
  if (!row.note) return '';
  return row.type === 'DUE_CLEARED' ? t('revenue.clearedVia', 'Cleared via {no}').replace('{no}', row.note) : row.note;
};

const TwoLine = ({ main, sub }) => (
  <>
    <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>{main || '—'}</Typography>
    {sub ? <Typography variant="caption" sx={{ color: '#64748B' }}>{sub}</Typography> : null}
  </>
);

/** Server-paged Revenue transaction table; the Module column shows only on the All tab. */
const RevenueTable = ({ rows, loading, error, showModule, page, rowsPerPage, count, onPageChange, onRowsPerPageChange }) => {
  const t = useT();
  const headers = [
    t('common.date', 'Date'),
    ...(showModule ? [t('revenue.module', 'Module')] : []),
    t('revenue.type', 'Type'), t('revenue.reference', 'Reference'), t('revenue.party', 'Party'),
    t('revenue.paymentMode', 'Payment Mode'), t('revenue.amount', 'Amount'),
  ];

  const body = () => {
    if (loading) {
      return Array.from({ length: 8 }).map((_, r) => (
        <TableRow key={r}>{headers.map((h) => <TableCell key={h}><Skeleton variant="text" /></TableCell>)}</TableRow>
      ));
    }
    return rows.map((row) => (
      <TableRow key={`${row.module}-${row.id}`} hover>
        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.date ? dayjs(row.date).format('DD-MMM-YYYY') : '—'}</TableCell>
        {showModule ? (
          <TableCell>
            <Chip size="small" variant="outlined" color={MODULE_COLOR[row.module] || 'default'} label={t(`revenue.tab.${row.module}`, row.module)} sx={{ fontWeight: 700 }} />
          </TableCell>
        ) : null}
        <TableCell>{t(`revenue.typeLabel.${row.type}`, row.type)}</TableCell>
        <TableCell><TwoLine main={row.reference} sub={noteText(t, row)} /></TableCell>
        <TableCell><TwoLine main={row.party} sub={row.contact} /></TableCell>
        <TableCell>{row.paymentMode ? paymentModeLabel(t, row.paymentMode) : '—'}</TableCell>
        <TableCell sx={{ fontWeight: 700, whiteSpace: 'nowrap', color: row.direction === 'IN' ? '#047857' : '#B91C1C' }}>
          {row.direction === 'IN' ? '+' : '−'}{money(row.amount)}
        </TableCell>
      </TableRow>
    ));
  };

  const empty = !loading && !error && rows.length === 0;
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {empty ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <PaidOutlinedIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{t('revenue.empty', 'No transactions found')}</Typography>
            <Typography>{t('revenue.emptyHint', 'Payments appear here automatically. Try a different filter.')}</Typography>
          </Box>
        ) : null}
        {!error && !empty ? (
          <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>{headers.map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>{body()}</TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </CardContent>
      {!loading && !error && rows.length > 0 ? (
        <TablePagination
          component="div" count={count} page={page} onPageChange={onPageChange}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]} labelRowsPerPage={t('revenue.rows', 'Rows')}
        />
      ) : null}
    </Card>
  );
};

export default RevenueTable;
