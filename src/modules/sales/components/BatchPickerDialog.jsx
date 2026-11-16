import React from 'react';
import dayjs from 'dayjs';
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography,
} from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';

const money = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

// True when a product's available batches are sold at more than one price.
export const hasMixedPrices = (batches) =>
  new Set((batches || []).map((b) => Number(b.sellingPrice) || 0)).size > 1;

/**
 * Pick the batch to sell from when a product's batches have different selling prices.
 * Batches already used by another cart line are shown but can't be picked again.
 */
const BatchPickerDialog = ({ open, productName, batches = [], takenBatchIds = [], currentBatchId, onSelect, onCancel }) => {
  const t = useT();
  const taken = new Set(takenBatchIds);
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Inventory2OutlinedIcon sx={{ color: 'var(--theme-primary)' }} />
        {t('sales.batch.selectTitle', 'Select Batch')}
        <Typography component="span" sx={{ color: '#64748B', fontWeight: 600 }}>· {productName}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 1.5 }}>
          {t('sales.batch.selectHint', 'This product has batches at different selling prices. Choose the batch to sell from.')}
        </Alert>
        <TableContainer>
          <Table size="small" sx={{
            '& th': { bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
            '& td': { fontSize: '0.85rem' },
          }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('sales.batch.colBatch', 'Batch No.')}</TableCell>
                <TableCell>{t('sales.batch.colReceived', 'Received')}</TableCell>
                <TableCell align="right">{t('sales.colMrp', 'MRP')}</TableCell>
                <TableCell align="right">{t('sales.batch.colSelling', 'Selling Price')}</TableCell>
                <TableCell align="right">{t('sales.batch.colAvailable', 'Available')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {batches.map((b) => {
                const isCurrent = b.batchId === currentBatchId;
                const disabled = taken.has(b.batchId) && !isCurrent;
                return (
                  <TableRow
                    key={b.batchId} hover={!disabled}
                    onClick={() => { if (!disabled) onSelect(b); }}
                    sx={{
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      bgcolor: isCurrent ? 'color-mix(in srgb, var(--theme-primary) 8%, white)' : undefined,
                    }}
                  >
                    <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {b.batchNumber}
                      {disabled ? <Chip size="small" label={t('sales.batch.inCart', 'In cart')} sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} /> : null}
                    </TableCell>
                    <TableCell sx={{ color: '#64748B' }}>{b.receivedDate ? dayjs(b.receivedDate).format('DD-MMM-YYYY') : '—'}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748B' }}>{b.mrp != null ? money(b.mrp) : '—'}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{money(b.sellingPrice)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(b.quantityAvailable).toLocaleString('en-IN')}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onCancel} sx={{ color: '#64748B' }}>{t('common.cancel', 'Cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BatchPickerDialog;
