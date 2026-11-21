import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Alert, Box, Chip, CircularProgress, Divider, Drawer, FormControlLabel, IconButton, Stack, Switch, Table, TableBody,
  TableCell, TableHead, TableRow, Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import dayjs from 'dayjs';
import auditService from '../../services/auditService';
import { useT } from '../../contexts/LanguageContext';

const OP_COLOR = { INSERT: 'success', UPDATE: 'warning', DELETE: 'error' };
const show = (v) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

const Json = ({ value }) => (
  <Box component="pre" sx={{ m: 0, p: 1.5, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1, fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
    {value === null || value === undefined ? '—' : JSON.stringify(value, null, 2)}
  </Box>
);

const Section = ({ title, children }) => (
  <Box sx={{ mb: 2.5 }}>
    <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>{title}</Typography>
    {children}
  </Box>
);

const Info = ({ label, value }) => (
  <Box sx={{ display: 'flex', gap: 1, py: 0.25, fontSize: '0.85rem' }}>
    <Box sx={{ color: '#64748B', minWidth: 110 }}>{label}</Box>
    <Box sx={{ color: '#0F172A', fontWeight: 600, wordBreak: 'break-all' }}>{value || '—'}</Box>
  </Box>
);

/** One changed record: field-by-field before / after (changed fields highlighted; others on demand). */
const ChangeCard = ({ change, showAll }) => {
  const t = useT();
  const before = change.beforeState || {};
  const after = change.afterState || {};
  const changed = new Set(change.changedFields || []);
  const fields = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((f) => showAll || change.operation !== 'UPDATE' || changed.has(f));
  return (
    <Box sx={{ border: '1px solid #E2E8F0', borderRadius: 1.5, mb: 1.5, overflow: 'hidden' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ px: 1.5, py: 1, bgcolor: '#F8FAFC' }}>
        <Chip size="small" color={OP_COLOR[change.operation] || 'default'} label={change.operation} sx={{ fontWeight: 700 }} />
        <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{change.entityName}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace' }}>{change.entityId}</Typography>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            {[t('audit.field', 'Field'), t('audit.before', 'Before'), t('audit.after', 'After')].map((h) => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {fields.map((f) => (
            <TableRow key={f} sx={{ bgcolor: changed.has(f) ? '#FEF9C3' : undefined }}>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.78rem' }}>{f}</TableCell>
              <TableCell sx={{ fontSize: '0.78rem', color: '#B91C1C', wordBreak: 'break-all' }}>{change.operation === 'INSERT' ? '—' : show(before[f])}</TableCell>
              <TableCell sx={{ fontSize: '0.78rem', color: '#15803D', wordBreak: 'break-all' }}>{change.operation === 'DELETE' ? '—' : show(after[f])}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

/** Full audit entry: who / what / when, request and response, and every record it changed. */
const AuditLogDetailDrawer = ({ id, onClose }) => {
  const t = useT();
  const [showAll, setShowAll] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ['auditLog', id], queryFn: () => auditService.detail(id), enabled: Boolean(id) });
  const log = data?.log;
  const failed = log && log.responseStatus >= 400;

  return (
    <Drawer anchor="right" open={Boolean(id)} onClose={onClose} sx={{ zIndex: 1300 }} PaperProps={{ sx: { width: { xs: '100%', md: 760 }, p: 3 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', flexGrow: 1 }}>{log?.action || t('audit.title', 'Audit Logs')}</Typography>
        {log ? <Chip color={failed ? 'error' : 'success'} label={log.responseStatus} sx={{ fontWeight: 800 }} /> : null}
        <IconButton onClick={onClose}><CloseIcon /></IconButton>
      </Stack>
      {isLoading ? <CircularProgress /> : null}
      {error ? <Alert severity="error">{error.message}</Alert> : null}
      {log ? (
        // A plain block wrapper: the drawer paper is a flex column, which would squash the change tables.
        <Box sx={{ flexShrink: 0 }}>
          <Section title={t('audit.who', 'Who & when')}>
            <Info label="Ref" value={data.ref} />
            <Info label={t('audit.time', 'Time')} value={dayjs(log.createdAt).format('DD-MMM-YYYY HH:mm:ss')} />
            <Info label={t('audit.user', 'User')} value={[log.userEmail, log.userRole].filter(Boolean).join(' · ')} />
            <Info label={t('audit.portfolio', 'Portfolio')} value={data.portfolioName} />
            <Info label={t('audit.request', 'Request')} value={`${log.httpMethod} ${log.urlPath}`} />
            <Info label={t('audit.endpoint', 'Endpoint')} value={log.urlPattern} />
            <Info label={t('audit.duration', 'Duration')} value={`${log.durationMs} ms`} />
            <Info label={t('audit.device', 'Device')} value={[log.clientIp, log.userAgent].filter(Boolean).join(' · ')} />
          </Section>
          {failed ? <Alert severity="error" sx={{ mb: 2.5 }}>{log.errorMessage || t('audit.failed', 'Failed')}</Alert> : null}
          <Section title={t('audit.queryParams', 'Query parameters')}><Json value={log.queryParams} /></Section>
          <Section title={t('audit.requestBody', 'Request payload')}><Json value={log.requestBody} /></Section>
          <Section title={failed ? t('audit.responseFull', 'Response (full)') : t('audit.responseShort', 'Response (summary)')}><Json value={log.responseBody} /></Section>
          <Divider sx={{ mb: 2 }} />
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('audit.changes', 'Records changed')} ({data.changes.length})
            </Typography>
            <FormControlLabel control={<Switch size="small" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
              label={<Typography sx={{ fontSize: '0.8rem' }}>{t('audit.showAllFields', 'Show all fields')}</Typography>} />
          </Stack>
          {data.changes.length === 0 ? <Typography sx={{ color: '#64748B', fontSize: '0.85rem', mt: 1 }}>{t('audit.noChanges', 'Nothing was saved by this request.')}</Typography> : null}
          {data.changes.map((c) => <ChangeCard key={c.id} change={c} showAll={showAll} />)}
        </Box>
      ) : null}
    </Drawer>
  );
};

export default AuditLogDetailDrawer;
