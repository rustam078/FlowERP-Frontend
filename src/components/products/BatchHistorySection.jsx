import React, { useMemo, useState } from 'react';
import {
  Card, CardContent, Box, Typography, Tabs, Tab, TableContainer, Table, TableHead,
  TableBody, TableRow, TableCell, Chip, Stack, Button, Tooltip, TablePagination,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import { sourceLabel } from '../../utils/sourceLabel';
import { getCurrencySymbol } from '../../utils/currency';
import { useT } from '../../contexts/LanguageContext';

const formatCurrency = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN')}`;
const formatNumber = (v) => Number(v || 0).toLocaleString('en-IN');
const formatDate = (v) => (v ? new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : '—');

/**
 * Batch History — the same table layout/icons used on the Inventory details page.
 * Shared so the Product module can own inventory operations going forward.
 */
const BatchHistorySection = ({ batches = [], productName, canWrite, onAdjust, onQr }) => {
  const t = useT();
  const [status, setStatus] = useState('ACTIVE');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const rows = useMemo(() => batches.filter((b) => b.status === status), [batches, status]);
  const paged = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Inventory2OutlinedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{t('inventory.batchHistory', 'Batch History')}</Typography>
        </Box>

        <Tabs value={status} onChange={(e, v) => { setStatus(v); setPage(0); }} sx={{ minHeight: 38, mb: 1, borderBottom: '1px solid #E2E8F0' }}>
          <Tab value="ACTIVE" label={t('inventory.tabActive', 'Active')} sx={{ minHeight: 38, textTransform: 'none', fontWeight: 700 }} />
          <Tab value="SOLD" label={t('inventory.tabSold', 'Sold')} sx={{ minHeight: 38, textTransform: 'none', fontWeight: 700 }} />
        </Tabs>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colBatchNo', 'Batch No.')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colSource', 'Source')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colReceived', 'Received')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common.total', 'Total')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colSold', 'Sold')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colAvailable', 'Available')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colUnitCost', 'Unit Cost')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colSellingPrice', 'Selling Price')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('inventory.colBatchValue', 'Batch Value')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('common.status', 'Status')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('common.actions', 'Actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.length > 0 ? paged.map((batch) => {
                const totalQ = Number(batch.totalQuantity ?? 0);
                const availableQ = Number(batch.quantityAvailable ?? 0);
                const soldQ = totalQ - availableQ;
                return (
                  <TableRow key={batch.batchId || batch.id} hover>
                    <TableCell>{batch.batchNumber}</TableCell>
                    <TableCell>{sourceLabel(t, batch.source)}</TableCell>
                    <TableCell>{formatDate(batch.receivedDate)}</TableCell>
                    <TableCell>{formatNumber(totalQ)}</TableCell>
                    <TableCell><Typography sx={{ color: soldQ > 0 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>{formatNumber(soldQ)}</Typography></TableCell>
                    <TableCell><Typography sx={{ color: availableQ > 0 ? 'success.main' : 'text.secondary', fontWeight: 700 }}>{formatNumber(availableQ)}</Typography></TableCell>
                    <TableCell>{formatCurrency(batch.unitCost)}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{batch.sellingPrice != null ? formatCurrency(batch.sellingPrice) : '—'}</TableCell>
                    <TableCell>{formatCurrency(batch.batchValue != null ? batch.batchValue : availableQ * Number(batch.unitCost || 0))}</TableCell>
                    <TableCell><Chip label={batch.status} size="small" color={batch.status === 'ACTIVE' ? 'success' : 'default'} variant="outlined" /></TableCell>
                    <TableCell align="center">
                      {availableQ > 0 ? (
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {canWrite && (
                            <Tooltip title={t('inventory.adjustTooltip', 'Adjust stock (increase / decrease)')}>
                              <Button size="small" variant="outlined" startIcon={<TuneOutlinedIcon fontSize="small" />} onClick={() => onAdjust?.(batch)} sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                                {t('inventory.adjust', 'Adjust')}
                              </Button>
                            </Tooltip>
                          )}
                          {canWrite && (
                            <Tooltip title={t('inventory.qrTooltip', 'Generate & print QR labels for this batch')}>
                              <Button size="small" variant="outlined" color="secondary" startIcon={<QrCode2Icon fontSize="small" />} onClick={() => onQr?.({ batchNumber: batch.batchNumber, productName, quantityAvailable: availableQ, quantityReceived: totalQ })} sx={{ textTransform: 'none', whiteSpace: 'nowrap' }}>
                                QR
                              </Button>
                            </Tooltip>
                          )}
                        </Stack>
                      ) : <Typography variant="body2" color="text.secondary">—</Typography>}
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">{t('inventory.noBatches', 'No batches found for the selected filters.')}</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={rows.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </CardContent>
    </Card>
  );
};

export default BatchHistorySection;
