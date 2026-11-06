import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Button, Chip, Divider, Grid, Paper, Stack, Typography, CircularProgress, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import CalculateOutlinedIcon from '@mui/icons-material/CalculateOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { notification, Tabs, Collapse, Pagination, Tag } from 'antd';
import dayjs from 'dayjs';
import ProductLabel from '../../../components/common/ProductLabel';
import salesService from '../services/salesService';
import { getCurrencySymbol } from '../../../utils/currency';
import { modeLabel } from '../../../utils/payment';
import { useAppSettings } from '../../../contexts/AppSettingsContext';
import { useT } from '../../../contexts/LanguageContext';

const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const STATUS_COLOR = {
  PAID: 'success',
  DUE: 'warning',
  PENDING: 'warning',
  PARTIALLY_PAID: 'info',
  FAILED: 'error',
  REFUNDED: 'default',
};

const MetaBlock = ({ label, children }) => (
  <Box>
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.5 }}>
      {label}
    </Typography>
    {children}
  </Box>
);

// One of the three info cards (Billed To / Payment / Order).
const InfoCard = ({ icon, label, children }) => (
  <Paper sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', p: 2, display: 'flex', gap: 1.5, alignItems: 'flex-start', height: '100%' }}>
    <Box sx={{ width: 40, height: 40, borderRadius: 0, flexShrink: 0, bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ fontSize: '0.66rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.25 }}>{label}</Typography>
      {children}
    </Box>
  </Paper>
);

const SaleDetails = () => {
  const navigate = useNavigate();
  const { saleId } = useParams();
  const { companyName } = useAppSettings();
  const t = useT();
  const [downloading, setDownloading] = useState(false);

  const [activeTab, setActiveTab] = useState('details');
  const [productSearch, setProductSearch] = useState(''); // search within this invoice's products

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['saleDetails', saleId],
    queryFn: () => salesService.getSaleById(saleId),
    enabled: Boolean(saleId),
  });

  // Customer's recent transactions + running balance — loaded only when the History tab is opened.
  const [historyPage, setHistoryPage] = useState(1);
  const [historySearch, setHistorySearch] = useState('');
  const customerMobile = sale?.customerMobile;
  const historyEnabled = activeTab === 'history' && Boolean(customerMobile);
  const { data: payments = [], isLoading: historyLoading } = useQuery({
    queryKey: ['customerPaymentHistory', customerMobile],
    queryFn: () => salesService.getCustomerPaymentHistory(customerMobile),
    enabled: historyEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const { data: outstanding } = useQuery({
    queryKey: ['customerOutstanding', customerMobile],
    queryFn: () => salesService.getCustomerOutstanding(customerMobile),
    enabled: historyEnabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const balance = -(Number(outstanding?.totalOutstanding) || 0); // negative = customer owes
  const HISTORY_PAGE_SIZE = 8; // historyPage is 1-based (antd Pagination)
  // Filter payment groups by invoice number (matches any allocation's invoice).
  const historyQuery = historySearch.trim().toLowerCase();
  const filteredPayments = historyQuery
    ? payments.filter((grp) => (grp.allocations || []).some((a) => (a.invoiceNumber || '').toLowerCase().includes(historyQuery)))
    : payments;
  const paymentItems = filteredPayments
    .slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)
    .map((grp, idx) => ({
      key: String(idx),
      label: (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: '0.85rem', borderBottom: '1px solid #F1F5F9', pb: 0.75 }}>
          <Box sx={{ flex: '1.4', fontWeight: 700, color: '#0F172A' }}>{grp.paymentDate ? dayjs(grp.paymentDate).format('DD-MMM-YYYY') : '—'}</Box>
          <Box sx={{ flex: '1' }}><Tag style={{ borderRadius: 6, margin: 0 }}>{modeLabel(grp.mode)}</Tag></Box>
          <Box sx={{ flex: '0.8', color: '#64748B' }}>{(grp.allocations || []).length}</Box>
          <Box sx={{ flex: '1', textAlign: 'right', fontWeight: 800, color: 'var(--theme-primary)' }}>{inr(grp.totalAmount)}</Box>
        </Box>
      ),
      children: (
        <Box sx={{ bgcolor: '#F1F5F9', borderRadius: 1.5, px: 1.5, py: 0.5, boxShadow: 'inset 0 1px 4px rgba(15,23,42,0.12)' }}>
          {(grp.allocations || []).map((a, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', py: 0.6, borderTop: i === 0 ? 'none' : '1px dashed #CBD5E1' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{a.invoiceNumber || '—'}</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>{inr(a.amount)}</span>
            </Box>
          ))}
        </Box>
      ),
    }));

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await salesService.downloadInvoicePdf(saleId);
    } catch (e) {
      notification.error({ message: t('sales.invoiceDownloadFailed', 'Invoice download failed'), description: e.message, placement: 'topRight' });
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (error) return <Alert severity="error">{error.message}</Alert>;

  const inv = sale || {};
  const invoiceNo = inv.invoiceNo || inv.invoice || '-';
  const rawSaleDate = inv.saleDate || inv.createdAt;
  const saleDate = rawSaleDate ? dayjs(rawSaleDate).format('DD-MMM-YYYY') : '-';
  const status = inv.paymentStatus ? t(`sales.status.${inv.paymentStatus}`, inv.paymentStatus.replace(/_/g, ' ')) : t('sales.unknown', 'Unknown');
  const paymentMode = modeLabel(inv.paymentMode);
  const items = inv.items || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Button startIcon={<ArrowBackIcon />} variant="text" onClick={() => navigate('/sales/list')} sx={{ color: '#475569' }}>
            {t('common.back', 'Back')}
          </Button>
          <Divider orientation="vertical" flexItem />
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.saleDetails', 'Sale Details')}</Typography>
        </Stack>
        <Button
          variant="contained"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading ? t('sales.preparing', 'Preparing…') : t('sales.downloadInvoicePdf', 'Download Invoice PDF')}
        </Button>
      </Stack>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[{ key: 'details', label: t('sales.details', 'Details') }, { key: 'history', label: t('sales.customerPaymentHistory', 'Customer Payment History') }]}
      />

      {/* Invoice details */}
      {activeTab === 'details' && (() => {
        const q = productSearch.trim().toLowerCase();
        const shownItems = q ? items.filter((it) => (it.productName || '').toLowerCase().includes(q)) : items;
        const CARD_H = 470;
        return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Hero */}
          <Paper sx={{ borderRadius: 0, border: '1px solid color-mix(in srgb, var(--theme-primary) 20%, white)', boxShadow: 'none', p: 2.5, background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 16%, white) 0%, color-mix(in srgb, var(--theme-primary) 5%, white) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{ width: 56, height: 56, borderRadius: 0, bgcolor: 'var(--theme-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ReceiptLongOutlinedIcon sx={{ color: '#fff', fontSize: 30 }} />
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: '#0F172A', lineHeight: 1.2 }}>{companyName || 'SKR Garment'}</Typography>
                <Typography sx={{ fontWeight: 700, color: '#334155' }}>{t('sales.invoice', 'Invoice')} {invoiceNo}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem', mt: 0.25 }}>{saleDate} • {paymentMode}</Typography>
              </Box>
            </Stack>
            <Stack alignItems="flex-end" spacing={0.75}>
              <Chip
                icon={inv.paymentStatus === 'PAID' ? <CheckCircleIcon sx={{ fontSize: 16 }} /> : undefined}
                label={status}
                color={STATUS_COLOR[inv.paymentStatus] || 'default'}
                sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}
              />
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{t('sales.grandTotal', 'Grand Total')}</Typography>
              <Typography sx={{ fontWeight: 900, fontSize: '1.8rem', color: 'var(--theme-primary)', lineHeight: 1 }}>{inr(inv.grandTotal)}</Typography>
            </Stack>
          </Paper>

          {/* Info cards */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <InfoCard icon={<PersonOutlineIcon />} label={t('sales.billedTo', 'Billed To')}>
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{inv.customerName || '-'}</Typography>
                <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.customerMobile || '-'}</Typography>
                {inv.customerEmail && <Typography sx={{ color: '#64748B', fontSize: '0.85rem', wordBreak: 'break-all' }}>{inv.customerEmail}</Typography>}
              </InfoCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <InfoCard icon={<CreditCardOutlinedIcon />} label={t('sales.payment', 'Payment')}>
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{paymentMode}</Typography>
                {inv.paymentProvider && <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.paymentProvider}</Typography>}
              </InfoCard>
            </Grid>
            <Grid item xs={12} md={4}>
              <InfoCard icon={<Inventory2OutlinedIcon />} label={t('sales.order', 'Order')}>
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{items.length} {items.length === 1 ? t('sales.item', 'item') : t('sales.items', 'items')}</Typography>
              </InfoCard>
            </Grid>
          </Grid>

          {/* Products (left) + Amount Summary (right) — equal fixed height */}
          <Grid container spacing={2} alignItems="stretch">
            <Grid item xs={12} md={8}>
              <Paper sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: { md: CARD_H }, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory2OutlinedIcon sx={{ color: 'var(--theme-primary)' }} />
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.products', 'Products')} ({items.length})</Typography>
                </Box>
                <TableContainer sx={{ flex: 1, overflow: 'auto' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow sx={{ '& th': { backgroundColor: '#F1F5F9', color: '#334155', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.03em' } }}>
                        <TableCell>#</TableCell>
                        <TableCell>{t('sales.product', 'Product')}</TableCell>
                        <TableCell align="right">{t('sales.colQty', 'Qty')}</TableCell>
                        <TableCell align="right">{t('sales.colPrice', 'Price')}</TableCell>
                        <TableCell align="right">{t('sales.discount', 'Discount')}</TableCell>
                        <TableCell align="right">{t('common.amount', 'Amount')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {shownItems.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ color: '#94A3B8', py: 4 }}>{t('sales.noItems', 'No items')}</TableCell></TableRow>
                      ) : shownItems.map((it, i) => (
                        <TableRow key={it.productId || i} hover>
                          <TableCell sx={{ color: '#94A3B8', fontWeight: 600 }}>{i + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}><ProductLabel productId={it.productId} iconName={it.iconName} name={it.productName} hasImage={it.hasImage} size={30} /></TableCell>
                          <TableCell align="right">{Number(it.quantity || 0)}</TableCell>
                          <TableCell align="right">{inr(it.sellingPrice)}</TableCell>
                          <TableCell align="right" sx={{ color: '#DC2626' }}>{inr(it.discount)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{inr(it.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', height: { md: CARD_H }, display: 'flex', flexDirection: 'column', overflow: 'auto', p: 2 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                  <CalculateOutlinedIcon sx={{ color: 'var(--theme-primary)' }} />
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.amountSummary', 'Amount Summary')}</Typography>
                </Stack>
                <Stack spacing={0.25}>
                  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                    <Typography sx={{ color: '#64748B' }}>{t('sales.subtotal', 'Subtotal')}</Typography>
                    <Typography sx={{ fontWeight: 600 }}>{inr(inv.subtotal)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                    <Typography sx={{ color: '#64748B' }}>{t('sales.discount', 'Discount')}</Typography>
                    <Typography sx={{ fontWeight: 600, color: '#DC2626' }}>− {inr(inv.discount)}</Typography>
                  </Stack>
                  {Number(inv.tax) > 0 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.75 }}>
                      <Typography sx={{ color: '#64748B' }}>{t('sales.gst', 'GST')}</Typography>
                      <Typography sx={{ fontWeight: 600 }}>{inr(inv.tax)}</Typography>
                    </Stack>
                  )}
                </Stack>
                {/* Grand Total highlight */}
                <Box sx={{ my: 1, p: 1.5, borderRadius: 0, bgcolor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 22%, white)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.grandTotal', 'Grand Total')}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', color: 'var(--theme-primary)' }}>{inr(inv.grandTotal)}</Typography>
                </Box>
                <Stack spacing={0.25}>
                  <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                    <Typography sx={{ color: '#64748B' }}>{t('sales.amountReceived', 'Amount Received')}</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{inr(inv.amountReceived)}</Typography>
                  </Stack>
                  {Number(inv.paidToPreviousDues) > 0.0001 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.25 }}>
                      <Typography sx={{ color: '#64748B', pl: 1.5, fontSize: '0.88rem' }}>• {t('sales.towardsPreviousDues', 'Towards previous dues')}</Typography>
                      <Typography sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{inr(inv.paidToPreviousDues)}</Typography>
                    </Stack>
                  )}
                  {/* Which older invoices this payment cleared (sum = towards previous dues). */}
                  {Array.isArray(inv.previousDuesAllocation) && inv.previousDuesAllocation.map((d, i) => (
                    <Stack key={i} direction="row" justifyContent="space-between" sx={{ py: 0.1 }}>
                      <Typography sx={{ color: '#94A3B8', pl: 3, fontSize: '0.8rem' }}>◦ {d.invoiceNumber}</Typography>
                      <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>{inr(d.amount)}</Typography>
                    </Stack>
                  ))}
                  {Number(inv.amountDue) > 0.0001 && (
                    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.5 }}>
                      <Typography sx={{ color: '#64748B' }}>{t('sales.thisInvoiceDue', 'This invoice due')}</Typography>
                      <Typography sx={{ fontWeight: 700, color: '#B91C1C' }}>{inr(inv.amountDue)}</Typography>
                    </Stack>
                  )}
                  {Array.isArray(inv.clearances) && inv.clearances.length > 0 && (
                    <>
                      <Divider sx={{ my: 0.75 }} />
                      <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem', mb: 0.25 }}>{t('sales.dueClearedLater', 'Due cleared later')}</Typography>
                      {inv.clearances.map((c, i) => (
                        <Stack key={i} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.25 }}>
                          <Typography sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                            {dayjs(c.date).format('DD-MMM-YYYY')} · {modeLabel(c.mode)}
                          </Typography>
                          <Typography sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{inr(c.amount)}</Typography>
                        </Stack>
                      ))}
                    </>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>
        );
      })()}

      {activeTab === 'history' && (
        <Paper sx={{ borderRadius: 0, border: '1px solid', borderColor: 'divider', boxShadow: 'none', overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.customerPaymentHistory', 'Customer Payment History')}</Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>{inv.customerName || '-'} · {inv.customerMobile || '-'}</Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                size="small"
                placeholder={t('sales.searchInvoicePlaceholder', 'Search invoice…')}
                value={historySearch}
                onChange={(e) => { setHistorySearch(e.target.value); setHistoryPage(1); }}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>) }}
                sx={{ width: { xs: 160, sm: 200 }, bgcolor: '#fff' }}
              />
              <Box sx={{ textAlign: 'right' }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('sales.balance', 'Balance')}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: balance < 0 ? '#B91C1C' : 'var(--theme-primary)' }}>
                  {balance < 0 ? '− ' : ''}{inr(Math.abs(balance))}
                </Typography>
              </Box>
            </Stack>
          </Box>
          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : payments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94A3B8', borderTop: '1px solid', borderColor: 'divider' }}>{t('sales.noPaymentsYet', 'No payments yet')}</Box>
          ) : filteredPayments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94A3B8', borderTop: '1px solid', borderColor: 'divider' }}>{t('sales.noPaymentMatches', 'No payment matches')} “{historySearch}”.</Box>
          ) : (
            <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              {/* Table-style header row; the Collapse rows below align to these columns. */}
              <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, pr: 5, bgcolor: '#E2E8F0', color: '#334155', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Box sx={{ flex: '1.4' }}>{t('common.date', 'Date')}</Box>
                <Box sx={{ flex: '1' }}>{t('sales.mode', 'Mode')}</Box>
                <Box sx={{ flex: '0.8' }}>{t('sales.invoices', 'Invoices')}</Box>
                <Box sx={{ flex: '1', textAlign: 'right' }}>{t('sales.received', 'Received')}</Box>
              </Box>
              <Collapse
                accordion
                ghost
                items={paymentItems}
                expandIconPosition="end"
                style={{ background: 'transparent' }}
              />
              {filteredPayments.length > HISTORY_PAGE_SIZE && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <Pagination
                    current={historyPage}
                    pageSize={HISTORY_PAGE_SIZE}
                    total={filteredPayments.length}
                    onChange={setHistoryPage}
                    showSizeChanger={false}
                    showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} ${t('sales.payments', 'payments')}`}
                  />
                </Box>
              )}
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SaleDetails;
