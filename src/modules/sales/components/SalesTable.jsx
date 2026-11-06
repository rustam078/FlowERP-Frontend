import React from 'react';
import { Box, Card, CardContent, Chip, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Tooltip, Typography, Paper, Skeleton, Alert, Stack } from '@mui/material';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import dayjs from 'dayjs';
import { getCurrencySymbol } from '../../../utils/currency';
import { modeLabel } from '../../../utils/payment';
import { useT } from '../../../contexts/LanguageContext';

const STATUS_COLOR = { PAID: 'success', DUE: 'warning', PENDING: 'warning', PARTIALLY_PAID: 'info', FAILED: 'error', REFUNDED: 'default' };

// Consistent sale date display: dd-MMM-yyyy (e.g. 05-Oct-2026).
const fmtDate = (v) => {
  const d = dayjs(v);
  return v && d.isValid() ? d.format('DD-MMM-YYYY') : '-';
};

const SalesTable = ({ rows, loading, error, page, rowsPerPage, count, onPageChange, onRowsPerPageChange, onDownload, onPrint, onRowClick }) => {
  const t = useT();
  // Translate a payment status code to its label, falling back to the humanised code.
  const statusLabel = (code) => (code ? t(`sales.status.${code}`, code.replace(/_/g, ' ')) : '-');
  // Server-side paging: `rows` is only the current page, so fill up to the page size by its length.
  const emptyRows = Math.max(0, rowsPerPage - rows.length);

  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider', minHeight: 520, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        {loading ? (
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[
                    t('sales.colInvoiceNo', 'Invoice No'),
                    t('common.date', 'Date'),
                    t('sales.customer', 'Customer'),
                    t('sales.mobile', 'Mobile'),
                    t('sales.grandTotal', 'Grand Total'),
                    t('sales.received', 'Received'),
                    t('sales.paymentMode', 'Payment Mode'),
                    t('sales.paymentStatus', 'Payment Status'),
                    t('common.actions', 'Actions'),
                  ].map((label) => (
                    <TableCell key={label}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Array.from({ length: 8 }).map((_, index) => (
                  <TableRow key={index}>
                    {Array.from({ length: 9 }).map((__, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 48, mb: 2, color: 'primary.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {t('sales.noSalesFound', 'No Sales Found')}
            </Typography>
            <Typography>{t('sales.noSalesHint', 'Try a different filter or refresh the list.')}</Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('sales.colInvoiceNo', 'Invoice No')}</TableCell>
                    <TableCell>{t('common.date', 'Date')}</TableCell>
                    <TableCell>{t('sales.customer', 'Customer')}</TableCell>
                    <TableCell>{t('sales.mobile', 'Mobile')}</TableCell>
                    <TableCell>{t('sales.grandTotal', 'Grand Total')}</TableCell>
                    <TableCell>{t('sales.received', 'Received')}</TableCell>
                    <TableCell>{t('sales.paymentMode', 'Payment Mode')}</TableCell>
                    <TableCell>{t('sales.paymentStatus', 'Payment Status')}</TableCell>
                    <TableCell align="center">{t('common.actions', 'Actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((sale) => {
                    const saleId = sale.saleId || sale.id;
                    return (
                      <TableRow key={saleId || sale.invoiceNo} hover sx={{ cursor: 'pointer' }} onClick={() => onRowClick(saleId)}>
                        <TableCell>{sale.invoice || sale.invoiceNo || '-'}</TableCell>
                        <TableCell>{fmtDate(sale.saleDate || sale.createdAt || sale.date)}</TableCell>
                        <TableCell>{sale.customerName || sale.customer || '-'}</TableCell>
                        <TableCell>{sale.customerMobile || sale.mobile || '-'}</TableCell>
                        <TableCell>{sale.grandTotal != null ? `${getCurrencySymbol()}${Number(sale.grandTotal).toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell sx={{ color: '#047857', fontWeight: 600 }}>{sale.amountReceived != null ? `${getCurrencySymbol()}${Number(sale.amountReceived).toLocaleString('en-IN')}` : '-'}</TableCell>
                        <TableCell>{modeLabel(sale.paymentMode)}</TableCell>
                        <TableCell>
                          {/* Due shown inline (not on hover) so it's visible at a glance. */}
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip size="small" label={statusLabel(sale.paymentStatus)} color={STATUS_COLOR[sale.paymentStatus] || 'default'} sx={{ fontWeight: 700 }} />
                            {Number(sale.amountDue) > 0 && (
                              <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {t('sales.dueWord', 'Due')} {getCurrencySymbol()}{Number(sale.amountDue).toLocaleString('en-IN')}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="center" onClick={(event) => event.stopPropagation()}>
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <Tooltip title={t('sales.downloadInvoice', 'Download invoice')}>
                              <IconButton size="small" color="primary" onClick={() => onDownload(saleId)}>
                                <FileDownloadOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('sales.printInvoice', 'Print invoice')}>
                              <IconButton size="small" color="primary" onClick={() => onPrint(saleId)}>
                                <PrintOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 64 * emptyRows }}>
                      <TableCell colSpan={9} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
      {!loading && !error && rows.length > 0 ? (
        <TablePagination
          component="div"
          count={count}
          page={page}
          onPageChange={onPageChange}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={onRowsPerPageChange}
          rowsPerPageOptions={[10, 20, 50, 100]}
          labelRowsPerPage={t('sales.rows', 'Rows')}
        />
      ) : null}
    </Card>
  );
};

export default SalesTable;
