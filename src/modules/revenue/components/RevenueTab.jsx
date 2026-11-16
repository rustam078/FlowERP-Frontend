import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Badge, Box, Button, Divider, FormControl, InputLabel, MenuItem, Popover, Select, Stack, TextField, Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import FilterListIcon from '@mui/icons-material/FilterList';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import revenueService from '../services/revenueService';
import RevenueTable from './RevenueTable';
import { PAYMENT_MODES } from '../../sales/components/PaymentModeFields';
import { getCurrencySymbol } from '../../../utils/currency';
import { useT } from '../../../contexts/LanguageContext';

dayjs.extend(quarterOfYear);

// Second filter per tab: All filters by module, the others by their own transaction types.
export const TAB_OPTIONS = {
  ALL: { name: 'module', values: ['INVESTMENT', 'SALES', 'EMPLOYEE'], label: (t, v) => t(`revenue.tab.${v}`, v) },
  INVESTMENT: { name: 'type', values: ['PURCHASE', 'OVERHEAD'] },
  SALES: { name: 'type', values: ['SALE_PAYMENT', 'DUE_CLEARED', 'DUE_SETTLEMENT'] },
  EMPLOYEE: { name: 'type', values: ['ADVANCE', 'PAYOUT', 'SPEND'] },
};

const DEFAULT_FILTERS = { search: '', fromDate: '', toDate: '', paymentMode: 'All', module: 'All', type: 'All' };
const QUICK = {
  Today: () => [dayjs(), dayjs()],
  'This Week': () => [dayjs().startOf('week'), dayjs().endOf('week')],
  'This Month': () => [dayjs().startOf('month'), dayjs().endOf('month')],
  Quarter: () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  'This Year': () => [dayjs().startOf('year'), dayjs().endOf('year')],
};
const num = (v) => new Intl.NumberFormat('en-IN').format(Number(v) || 0);
const money = (v) => `${getCurrencySymbol()}${new Intl.NumberFormat('en-IN').format(Math.round(Number(v) || 0))}`;
const Sep = () => <Box component="span" sx={{ color: '#CBD5E1', mx: 0.75 }}>|</Box>;

// Filters → API params; the tab's own module is always sent (except on All).
const toParams = (tab, f) => {
  const p = {};
  if (tab !== 'ALL') p.module = tab;
  ['search', 'fromDate', 'toDate'].forEach((k) => { if (f[k]) p[k] = f[k]; });
  if (f.paymentMode !== 'All') p.paymentMode = f.paymentMode;
  const extra = TAB_OPTIONS[tab].name;
  if (f[extra] !== 'All') p[extra] = f[extra];
  return p;
};

/** Totals line: All shows in / out / net; a module tab shows only its own direction. */
const TotalsLine = ({ tab, data }) => {
  const t = useT();
  if (!data) return null;
  const showIn = tab === 'ALL' || tab === 'SALES';
  const showOut = tab !== 'SALES';
  return (
    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569' }}>
      {num(data.transactions?.totalElements)} {t('revenue.transactions', 'transactions')}
      {showIn ? <><Sep /><Box component="span" sx={{ color: '#047857' }}>{money(data.inflow)} {t('revenue.in', 'received')}</Box></> : null}
      {showOut ? <><Sep /><Box component="span" sx={{ color: '#B91C1C' }}>{money(data.outflow)} {t('revenue.out', 'paid')}</Box></> : null}
      {tab === 'ALL' ? <><Sep />{money(data.net)} {t('revenue.net', 'net')}</> : null}
    </Typography>
  );
};

/** One Revenue tab: its own filters, totals and paged table (state survives tab switches). */
const RevenueTab = ({ tab, active, toolbarEl }) => {
  const t = useT();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchor, setAnchor] = useState(null);
  const option = TAB_OPTIONS[tab];
  const params = useMemo(() => toParams(tab, filters), [tab, filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['revenueTransactions', params, page, rowsPerPage],
    queryFn: () => revenueService.getTransactions({ ...params, page, size: rowsPerPage }),
    placeholderData: keepPreviousData,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const update = (patch) => { setFilters((prev) => ({ ...prev, ...patch })); setPage(0); };
  const onField = (e) => update({ [e.target.name]: e.target.value });
  const applyQuick = (key) => { const [from, to] = QUICK[key](); update({ fromDate: from.format('YYYY-MM-DD'), toDate: to.format('YYYY-MM-DD') }); };
  const activeCount = Object.keys(params).filter((k) => k !== 'module' || tab === 'ALL').length;
  const optionLabel = (v) => (option.label ? option.label(t, v) : t(`revenue.typeLabel.${v}`, v));

  return (
    <Box>
      {/* Totals + Filters sit in the page's tab row (only the visible tab renders them there). */}
      {active && toolbarEl ? createPortal(
        <>
          <TotalsLine tab={tab} data={data} />
          <Badge color="primary" badgeContent={activeCount} overlap="circular">
            <Button variant="outlined" startIcon={<FilterListIcon />} onClick={(e) => setAnchor(e.currentTarget)} sx={{ borderColor: 'divider', color: '#334155' }}>
              {t('common.filters', 'Filters')}
            </Button>
          </Badge>
        </>,
        toolbarEl,
      ) : null}

      <Popover
        open={Boolean(anchor)} anchorEl={anchor} onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 2.5, width: 340, borderRadius: 2, mt: 1 } } }}
      >
        <Stack spacing={2}>
          <Typography sx={{ fontWeight: 800, color: '#0F172A' }}>{t('revenue.filterTitle', 'Filter Transactions')}</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1 }}>
            {Object.keys(QUICK).map((k) => (
              <Button key={k} size="small" variant="outlined" onClick={() => applyQuick(k)} sx={{ textTransform: 'none', fontSize: '0.72rem', py: 0.4 }}>
                {t(`sales.range.${k}`, k)}
              </Button>
            ))}
          </Box>
          <TextField label={t(`revenue.search.${tab}`, 'Search')} name="search" value={filters.search} onChange={onField} fullWidth size="small" />
          <Stack direction="row" spacing={1.5}>
            <TextField label={t('common.from', 'From')} name="fromDate" value={filters.fromDate} onChange={onField} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
            <TextField label={t('common.to', 'To')} name="toDate" value={filters.toDate} onChange={onField} type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
          <FormControl fullWidth size="small">
            <InputLabel>{option.name === 'module' ? t('revenue.module', 'Module') : t('revenue.type', 'Type')}</InputLabel>
            <Select name={option.name} value={filters[option.name]} label={option.name === 'module' ? t('revenue.module', 'Module') : t('revenue.type', 'Type')} onChange={onField}>
              <MenuItem value="All">{t('common.all', 'All')}</MenuItem>
              {option.values.map((v) => <MenuItem key={v} value={v}>{optionLabel(v)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>{t('revenue.paymentMode', 'Payment Mode')}</InputLabel>
            <Select name="paymentMode" value={filters.paymentMode} label={t('revenue.paymentMode', 'Payment Mode')} onChange={onField}>
              <MenuItem value="All">{t('common.all', 'All')}</MenuItem>
              {PAYMENT_MODES.map((m) => <MenuItem key={m.value} value={m.value}>{t(m.key, m.fallback)}</MenuItem>)}
            </Select>
          </FormControl>
          <Divider />
          <Stack direction="row" justifyContent="space-between">
            <Button startIcon={<ReplayIcon />} onClick={() => update(DEFAULT_FILTERS)} disabled={activeCount === 0}>{t('common.reset', 'Reset')}</Button>
            <Button variant="contained" onClick={() => setAnchor(null)}>{t('common.done', 'Done')}</Button>
          </Stack>
        </Stack>
      </Popover>

      <RevenueTable
        rows={data?.transactions?.content || []}
        loading={isLoading}
        error={error?.message}
        showModule={tab === 'ALL'}
        page={page}
        rowsPerPage={rowsPerPage}
        count={data?.transactions?.totalElements || 0}
        onPageChange={(e, p) => setPage(p)}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
      />
    </Box>
  );
};

export default RevenueTab;
