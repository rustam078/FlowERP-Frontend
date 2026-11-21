import React, { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  Alert, Box, Button, Card, Chip, FormControl, InputLabel, MenuItem, Paper, Select, Skeleton, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography,
} from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import dayjs from 'dayjs';
import auditService from '../../services/auditService';
import portfolioService from '../../services/portfolioService';
import { useT } from '../../contexts/LanguageContext';
import SuperAdminHeader from '../portfolios/SuperAdminHeader';
import AuditLogDetailDrawer from './AuditLogDetailDrawer';

const MODULES = ['sales', 'investment', 'employees', 'inventory', 'production', 'products', 'settings', 'auth', 'portfolios'];
const EMPTY = { filterPortfolioId: '', module: '', outcome: '', fromDate: '', toDate: '', search: '', entityId: '' };

// Only the filters that are set go to the API.
const toParams = (f) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));

/** SUPER_ADMIN: every audited action across portfolios (last 60 days), newest first. */
const AuditLogsPage = () => {
  const t = useT();
  const [filters, setFilters] = useState(EMPTY);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [openId, setOpenId] = useState(null);
  const params = useMemo(() => toParams(filters), [filters]);

  const { data: portfolios = [] } = useQuery({ queryKey: ['portfolios', ''], queryFn: () => portfolioService.list('') });
  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', params, page, size],
    queryFn: () => auditService.search({ ...params, page, size }),
    placeholderData: keepPreviousData,
  });
  const rows = data?.content || [];
  const set = (key) => (e) => { setFilters((f) => ({ ...f, [key]: e.target.value })); setPage(0); };

  const selectField = (key, label, options) => (
    <FormControl size="small" sx={{ minWidth: 150 }}>
      <InputLabel>{label}</InputLabel>
      <Select value={filters[key]} label={label} onChange={set(key)}>
        <MenuItem value="">{t('common.all', 'All')}</MenuItem>
        {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
      </Select>
    </FormControl>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <SuperAdminHeader />
      <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>{t('audit.title', 'Audit Logs')}</Typography>
        <Typography sx={{ color: '#64748B', fontSize: '0.9rem', mb: 3 }}>
          {t('audit.subtitle', 'Important actions (money, stock, payroll, security) of the last 60 days. Click a row for the full details.')}
        </Typography>

        <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
          <TextField size="small" label={t('audit.search', 'Ref / action / email / URL')} value={filters.search} onChange={set('search')} sx={{ minWidth: 240, bgcolor: '#fff' }} />
          {selectField('filterPortfolioId', t('audit.portfolio', 'Portfolio'), portfolios.map((p) => ({ value: p.id, label: p.name })))}
          {selectField('module', t('audit.module', 'Module'), MODULES.map((m) => ({ value: m, label: m })))}
          {selectField('outcome', t('audit.outcome', 'Result'), [
            { value: 'SUCCESS', label: t('audit.success', 'Success') }, { value: 'FAILED', label: t('audit.failed', 'Failed') }])}
          <TextField size="small" type="date" label={t('common.from', 'From')} value={filters.fromDate} onChange={set('fromDate')} InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }} />
          <TextField size="small" type="date" label={t('common.to', 'To')} value={filters.toDate} onChange={set('toDate')} InputLabelProps={{ shrink: true }} sx={{ bgcolor: '#fff' }} />
          <TextField size="small" label={t('audit.recordId', 'Record ID')} value={filters.entityId} onChange={set('entityId')} sx={{ minWidth: 200, bgcolor: '#fff' }} />
          <Button startIcon={<ReplayIcon />} onClick={() => { setFilters(EMPTY); setPage(0); }}>{t('common.reset', 'Reset')}</Button>
        </Stack>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error.message}</Alert> : null}

        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[t('audit.time', 'Time'), 'Ref', t('audit.portfolio', 'Portfolio'), t('audit.user', 'User'), t('audit.action', 'Action'),
                    t('audit.request', 'Request'), t('audit.status', 'Status'), t('audit.changesShort', 'Changes'), t('audit.duration', 'Duration')]
                    .map((h) => <TableCell key={h} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                )) : rows.map((r) => (
                  <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{dayjs(r.createdAt).format('DD-MMM HH:mm:ss')}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace' }}>{r.ref}</TableCell>
                    <TableCell>{r.portfolioName || '—'}</TableCell>
                    <TableCell>{r.userEmail || '—'}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{r.action}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: '#475569', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.httpMethod} {r.urlPath}</TableCell>
                    <TableCell>
                      <Chip size="small" color={r.responseStatus >= 400 ? 'error' : 'success'} label={r.responseStatus} sx={{ fontWeight: 700 }} title={r.errorMessage || ''} />
                    </TableCell>
                    <TableCell>{r.changeCount}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.durationMs} ms</TableCell>
                  </TableRow>
                ))}
                {!isLoading && rows.length === 0 ? (
                  <TableRow><TableCell colSpan={9} sx={{ textAlign: 'center', py: 6, color: '#64748B' }}>{t('audit.empty', 'No audit logs for these filters')}</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={data?.totalElements || 0} page={page} rowsPerPage={size}
            onPageChange={(e, p) => setPage(p)} onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[20, 50, 100]} />
        </Card>
      </Box>
      <AuditLogDetailDrawer id={openId} onClose={() => setOpenId(null)} />
    </Box>
  );
};

export default AuditLogsPage;
