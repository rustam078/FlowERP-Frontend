import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Badge, Box, Button, Divider, FormControl, InputLabel, MenuItem,
  Popover, Select, Stack, TextField, Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import salesService from '../services/salesService';
import ReportDownloadDialog from '../../../components/common/ReportDownloadDialog';
import SalesTable from '../components/SalesTable';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../../utils/currency';
import { usePermissions } from '../../../hooks/usePermissions';
import { useT } from '../../../contexts/LanguageContext';

dayjs.extend(quarterOfYear);

const paymentModes = ['All', 'CASH', 'UPI', 'CREDIT_CARD', 'DEBIT_CARD', 'NET_BANKING', 'CREDIT'];
const paymentStatuses = ['All', 'PAID', 'DUE'];
const DEFAULT_FILTERS = { search: '', fromDate: '', toDate: '', paymentMode: 'All', paymentStatus: 'All' };

// Quick date ranges (mirrors the dashboard) — each returns a full-period [from, to].
const QUICK = {
  Today: () => [dayjs().startOf('day'), dayjs().endOf('day')],
  'This Week': () => [dayjs().startOf('week'), dayjs().endOf('week')],
  'This Month': () => [dayjs().startOf('month'), dayjs().endOf('month')],
  'Quarter': () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  'This Year': () => [dayjs().startOf('year'), dayjs().endOf('year')],
  'All Time': () => [dayjs('2000-01-01'), dayjs().endOf('day')],
};

const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);
const money = (v) => `${getCurrencySymbol()}${new Intl.NumberFormat('en-IN').format(Math.round(Number(v) || 0))}`;

const SalesList = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const t = useT();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [reportOpen, setReportOpen] = useState(false); // report has its own range picker (dialog)

  // Shared filter → query params (used by both the list and the summary).
  const filterParams = useMemo(() => {
    const p = {};
    if (filters.search) p.search = filters.search;
    if (filters.fromDate) p.fromDate = filters.fromDate;
    if (filters.toDate) p.toDate = filters.toDate;
    if (filters.paymentMode && filters.paymentMode !== 'All') p.paymentMode = filters.paymentMode.toUpperCase();
    if (filters.paymentStatus && filters.paymentStatus !== 'All') p.paymentStatus = filters.paymentStatus.toUpperCase();
    return p;
  }, [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['salesList', filters, page, rowsPerPage],
    queryFn: () => salesService.getSales({ ...filterParams, page, size: rowsPerPage }),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Header summary — filter-aware totals (respects search / date / mode / status), same spec as the list.
  const { data: summary } = useQuery({
    queryKey: ['salesListSummary', filters],
    queryFn: () => salesService.getSummary(filterParams),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  useEffect(() => { setPage(0); }, [filters]);

  const rows = useMemo(() => (Array.isArray(data?.content) ? data.content : data?.content || []), [data]);
  const totalCount = data?.totalElements ?? data?.totalCount ?? rows.length;

  const activeCount = [
    filters.search,
    filters.fromDate,
    filters.toDate,
    filters.paymentMode !== 'All' ? filters.paymentMode : '',
    filters.paymentStatus !== 'All' ? filters.paymentStatus : '',
  ].filter(Boolean).length;

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyQuick = (key) => {
    const [from, to] = QUICK[key]();
    setFilters((prev) => ({ ...prev, fromDate: from.format('YYYY-MM-DD'), toDate: to.format('YYYY-MM-DD') }));
  };

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  // Click the Due total to show only due invoices; click again to clear (toggle).
  const dueActive = filters.paymentStatus === 'DUE';
  const toggleDue = () => setFilters((prev) => ({ ...prev, paymentStatus: prev.paymentStatus === 'DUE' ? 'All' : 'DUE' }));

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} sx={{ mb: 3 }} spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 0.5 }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
            {t('sales.sales', 'Sales')}
            <HeadingInfo text={t('sales.salesInfo', 'Manage all invoices and sales transactions.')} />
          </Typography>
          {summary ? (
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
              {num(summary.count)} {t('sales.salesWord', 'sales')}
              <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>
              {money(summary.revenue)} {t('sales.revenue', 'revenue')}
              <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>
              <Box component="span" sx={{ color: '#047857' }}>{money(summary.received)} {t('sales.received', 'received')}</Box>
              <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>
              <Box
                component="span"
                onClick={toggleDue}
                title={dueActive ? t('sales.dueTooltipActive', 'Showing only due invoices — click to clear') : t('sales.dueTooltipInactive', 'Click to show only due invoices')}
                sx={{
                  color: Number(summary.due) > 0 ? '#B91C1C' : '#475569',
                  cursor: 'pointer',
                  fontWeight: dueActive ? 800 : 700,
                  px: dueActive ? 0.75 : 0,
                  py: dueActive ? 0.25 : 0,
                  borderRadius: 1,
                  bgcolor: dueActive ? 'rgba(185,28,28,0.1)' : 'transparent',
                  border: dueActive ? '1px solid #B91C1C' : '1px solid transparent',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {money(summary.due)} {t('sales.dueWord', 'due')}{dueActive ? '  ✕' : ''}
              </Box>
            </Typography>
          ) : null}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Badge color="primary" badgeContent={activeCount} overlap="circular">
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={(e) => setFilterAnchor(e.currentTarget)}
              sx={{ borderColor: 'divider', color: '#334155' }}
            >
              {t('common.filters', 'Filters')}
            </Button>
          </Badge>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => setReportOpen(true)}
            sx={{ borderColor: 'divider', color: '#334155' }}
          >
            {t('common.download', 'Download')}
          </Button>
          {can('sales', 'write') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/sales/new')}>
              {t('sales.newSale', 'New Sale')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Popover
        open={Boolean(filterAnchor)}
        anchorEl={filterAnchor}
        onClose={() => setFilterAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 340, borderRadius: 2, mt: 1 } } }}
      >
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('sales.filterSales', 'Filter Sales')}</Typography>

          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>{t('sales.quickRange', 'Quick range')}</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mt: 0.75 }}>
              {Object.keys(QUICK).map((k) => (
                <Button key={k} size="small" variant="outlined" onClick={() => applyQuick(k)} sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.4 }}>
                  {t(`sales.range.${k}`, k)}
                </Button>
              ))}
            </Box>
          </Box>

          <TextField label={t('sales.searchInvoiceCustomerMobile', 'Search invoice / customer / mobile')} name="search" value={filters.search} onChange={handleFilterChange} fullWidth size="small" />
          <Stack direction="row" spacing={1.5}>
            <TextField label={t('common.from', 'From')} name="fromDate" value={filters.fromDate} onChange={handleFilterChange} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label={t('common.to', 'To')} name="toDate" value={filters.toDate} onChange={handleFilterChange} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
          <FormControl fullWidth size="small">
            <InputLabel>{t('sales.paymentMode', 'Payment Mode')}</InputLabel>
            <Select name="paymentMode" value={filters.paymentMode} label={t('sales.paymentMode', 'Payment Mode')} onChange={handleFilterChange}>
              {paymentModes.map((mode) => (
                <MenuItem key={mode} value={mode}>{mode === 'All' ? t('common.all', 'All') : (mode === 'CREDIT' ? t('sales.creditUdhaar', 'Credit (Udhaar)') : mode.replace(/_/g, ' '))}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>{t('sales.paymentStatus', 'Payment Status')}</InputLabel>
            <Select name="paymentStatus" value={filters.paymentStatus} label={t('sales.paymentStatus', 'Payment Status')} onChange={handleFilterChange}>
              {paymentStatuses.map((status) => (
                <MenuItem key={status} value={status}>{status === 'All' ? t('common.all', 'All') : t(`sales.status.${status}`, status.replace(/_/g, ' '))}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Divider />
          <Stack direction="row" justifyContent="space-between">
            <Button startIcon={<ReplayIcon />} onClick={handleReset} disabled={activeCount === 0}>{t('common.reset', 'Reset')}</Button>
            <Button variant="contained" onClick={() => setFilterAnchor(null)}>{t('common.done', 'Done')}</Button>
          </Stack>
        </Stack>
      </Popover>

      <ReportDownloadDialog
        open={reportOpen}
        title={t('sales.downloadSalesReport', 'Download sales report')}
        onClose={() => setReportOpen(false)}
        onDownload={(format, from, to) => salesService.downloadSalesReport(format, from, to)}
        onPrint={(from, to) => salesService.printSalesReport(from, to)}
      />

      <SalesTable
        rows={rows}
        loading={isLoading}
        error={error?.message}
        page={page}
        rowsPerPage={rowsPerPage}
        count={totalCount}
        onPageChange={(event, newPage) => setPage(newPage)}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        onDownload={(saleId) => salesService.downloadInvoicePdf(saleId)}
        onPrint={(saleId) => salesService.printInvoicePdf(saleId)}
        onRowClick={(saleId) => navigate(`/sales/${saleId}`)}
      />
    </Box>
  );
};

export default SalesList;
