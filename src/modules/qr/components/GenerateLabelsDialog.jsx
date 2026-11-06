import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import PrintIcon from '@mui/icons-material/Print';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import qrService, { DEFAULT_LABEL_CONFIG } from '../qrService';
import { printLabels, LABEL_CSS, labelClass, labelInnerHtml, toQrDataUrl } from '../labelPrinting';
import { useT } from '../../../contexts/LanguageContext';

// Labels are generated & printed in bounded runs; must match the backend cap.
const MAX_PER_RUN = 2000;
const PAGE_SIZE = 20;
const STATUS_COLOR = { AVAILABLE: 'primary', SOLD: 'success', VOID: 'default' };

/**
 * Side drawer to generate & print QR labels for one batch, in runs of up to 200.
 * Props: open, onClose, batch { batchNumber, productName, quantityAvailable, quantityReceived }, onGenerated
 */
const GenerateLabelsDialog = ({ open, onClose, batch, onGenerated }) => {
  const t = useT();
  const [count, setCount] = useState('');
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [units, setUnits] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loadingUnits, setLoadingUnits] = useState(false);
  const [labelConfig, setLabelConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const previewUnitsRef = React.useRef([]); // last generated run, for "Print again"

  const batchNumber = batch?.batchNumber;
  const cfg = labelConfig || DEFAULT_LABEL_CONFIG;
  const received = Number(summary?.received ?? batch?.quantityReceived ?? 0);
  const stock = Number(summary?.stock ?? batch?.quantityAvailable ?? 0);
  const availableLabels = Number(summary?.availableLabels ?? 0);
  const remaining = Number(summary?.remaining ?? Math.max(0, stock - availableLabels));
  const runLimit = Math.min(remaining, MAX_PER_RUN);
  const totalLabelled = Number(summary?.totalLabelled ?? 0);
  const fullyLabelled = !loadingSummary && remaining === 0 && stock > 0;

  const refreshSummary = () =>
    qrService.getSummary(batchNumber).then((res) => setSummary(res?.data || null));

  // One page of labels (all statuses), optional serial filter.
  const loadUnits = (p = 0, serial) => {
    setLoadingUnits(true);
    return qrService
      .getUnitsPage(batchNumber, p, PAGE_SIZE, serial)
      .then((res) => {
        const d = res?.data || {};
        setUnits(d.content || []);
        setPage(d.page || 0);
        setTotalPages(d.totalPages || 0);
        setTotalElements(d.totalElements || 0);
      })
      .catch(() => {
        setUnits([]);
        setTotalPages(0);
        setTotalElements(0);
      })
      .finally(() => setLoadingUnits(false));
  };

  useEffect(() => {
    if (!open || !batchNumber) return;
    setCount('');
    setRangeFrom('1');
    setRangeTo('');
    setError('');
    setNotice('');
    setSearch('');
    setPreviewHtml('');
    setLoadingSummary(true);
    refreshSummary().catch(() => setSummary(null)).finally(() => setLoadingSummary(false));
    loadUnits(0);
    qrService.getLabelConfig().then(setLabelConfig).catch(() => setLabelConfig(undefined));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, batchNumber]);

  // Server-side serial search (debounced) so we never load every label.
  useEffect(() => {
    if (!open || !batchNumber) return;
    const timer = setTimeout(() => loadUnits(0, search.trim() || undefined), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const buildPreview = async (newUnits) => {
    previewUnitsRef.current = newUnits;
    const withQr = await Promise.all(newUnits.map(async (u) => ({ ...u, qrDataUrl: await toQrDataUrl(u) })));
    setPreviewHtml(withQr.map((u) => `<div class="${labelClass(cfg)}">${labelInnerHtml(u, cfg)}</div>`).join(''));
  };

  const handleGenerate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const n = count ? Number(count) : undefined; // blank = backend's min(remaining, 200)
      const res = await qrService.generateUnits(batchNumber, n);
      const newUnits = res?.data?.units || [];
      await buildPreview(newUnits);
      setNotice(t('qr.generatedNotice', 'Generated {n} label(s). Opening print…').replace('{n}', String(newUnits.length)));
      await printLabels(newUnits, { batchNumber, config: cfg });
      await refreshSummary();
      await loadUnits(page, search.trim() || undefined);
      setCount('');
      if (onGenerated) onGenerated();
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('qr.errGenerate', 'Failed to generate labels.'));
    } finally {
      setBusy(false);
    }
  };

  const reprintPreview = async () => {
    setError('');
    try {
      await printLabels(previewUnitsRef.current, { batchNumber, config: cfg });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('qr.errPrint', 'Failed to print.'));
    }
  };

  // Print/reprint an exact serial-range chunk, then auto-advance to the next same-size chunk.
  const handlePrintRange = async () => {
    const f = Math.max(1, Number(rangeFrom || 1));
    const to = Number(rangeTo || Math.min(f + 999, totalLabelled));
    if (totalLabelled === 0) {
      setError(t('qr.noLabelsYet', 'No labels generated yet.'));
      return;
    }
    if (!to || to < f) {
      setError(t('qr.errToFrom', "'To' must be greater than or equal to 'From'."));
      return;
    }
    if (to - f + 1 > MAX_PER_RUN) {
      setError(t('qr.errMaxPrint', 'You can print at most {n} labels at a time.').replace('{n}', String(MAX_PER_RUN)));
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await qrService.getUnitsRange(batchNumber, f, to);
      const list = res?.data || [];
      if (list.length === 0) {
        setError(t('qr.errNoRange', 'No labels in that range.'));
        return;
      }
      await printLabels(list, { batchNumber, config: cfg });
      setNotice(t('qr.printingRange', 'Printing labels {f}–{t}…').replace('{f}', String(f)).replace('{t}', String(to)));
      const nextFrom = to + 1; // queue the next chunk of the same size
      if (nextFrom <= totalLabelled) {
        setRangeFrom(String(nextFrom));
        setRangeTo(String(Math.min(nextFrom + (to - f), totalLabelled)));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('qr.errPrintLabels', 'Failed to print labels.'));
    } finally {
      setBusy(false);
    }
  };

  const printOne = async (unit) => {
    setError('');
    try {
      await printLabels([unit], { batchNumber, config: cfg });
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('qr.errPrintLabel', 'Failed to print label.'));
    }
  };

  const soldCount = Number(summary?.sold ?? 0);
  const voidCount = Number(summary?.voidCount ?? 0);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={busy ? undefined : onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 460 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <QrCode2Icon color="primary" />
            <Typography sx={{ fontWeight: 800 }}>{t('qr.title', 'QR Labels —')} {batchNumber}</Typography>
          </Stack>
          <IconButton onClick={onClose} disabled={busy} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Body */}
        <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
          <Stack spacing={2}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{batch?.productName}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t('qr.batchPieces', 'Batch pieces: {r} · Available stock: {s}').replace('{r}', String(received)).replace('{s}', String(stock))}
              </Typography>
            </Box>

            {loadingSummary ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">{t('qr.checking', 'Checking existing labels…')}</Typography>
              </Stack>
            ) : (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={t('qr.labelled', '{n} labelled').replace('{n}', String(availableLabels))} color={availableLabels ? 'primary' : 'default'} variant="outlined" />
                {soldCount > 0 && <Chip size="small" label={t('qr.sold', '{n} sold').replace('{n}', String(soldCount))} color="success" variant="outlined" />}
                {voidCount > 0 && <Chip size="small" label={t('qr.void', '{n} void').replace('{n}', String(voidCount))} variant="outlined" />}
                <Chip size="small" label={t('qr.notLabelled', '{n} not labelled').replace('{n}', String(remaining))} variant="outlined" />
              </Stack>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}
            {notice ? <Alert severity="success">{notice}</Alert> : null}

            {fullyLabelled ? (
              <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />}>
                {t('qr.allLabelled', 'All {n} available piece(s) are labelled. Nothing more to generate.').replace('{n}', String(stock))}
              </Alert>
            ) : (
              <>
                <Divider />
                {/* Generate a run: count + generate icon right after it */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    label={t('qr.generateNew', 'Generate new labels')}
                    type="number"
                    size="small"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                    placeholder={t('qr.maxAtATime', 'Max {n} at a time').replace('{n}', String(MAX_PER_RUN))}
                    inputProps={{ min: 1, max: runLimit || undefined }}
                    fullWidth
                    disabled={busy}
                  />
                  <Tooltip title={t('qr.generatePrintRun', 'Generate & print this run')}>
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handleGenerate}
                        disabled={busy || remaining === 0}
                        sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5 }}
                      >
                        {busy ? <CircularProgress size={20} /> : <AddIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </>
            )}

            {/* Print/reprint an exact chunk by serial range (max 2000 per print, auto-advances). */}
            {totalLabelled > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary">
                  {t('qr.printChunk', 'Print a chunk — labels 1 to {n} exist (max {m} per print)').replace('{n}', String(totalLabelled)).replace('{m}', String(MAX_PER_RUN))}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                  <TextField
                    label={t('qr.fromHash', 'From #')}
                    type="number"
                    size="small"
                    value={rangeFrom}
                    onChange={(e) => setRangeFrom(e.target.value)}
                    inputProps={{ min: 1, max: totalLabelled }}
                    disabled={busy}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    label={t('qr.toHash', 'To #')}
                    type="number"
                    size="small"
                    value={rangeTo}
                    onChange={(e) => setRangeTo(e.target.value)}
                    placeholder={`${Math.min(Number(rangeFrom || 1) + 999, totalLabelled)}`}
                    inputProps={{ min: 1, max: totalLabelled }}
                    disabled={busy}
                    sx={{ width: 110 }}
                  />
                  <Tooltip title={t('qr.printThisChunk', 'Print this chunk')}>
                    <span>
                      <IconButton
                        color="primary"
                        onClick={handlePrintRange}
                        disabled={busy}
                        sx={{ border: '1px solid', borderColor: 'primary.main', borderRadius: 1.5 }}
                      >
                        {busy ? <CircularProgress size={20} /> : <PrintIcon />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Box>
            )}

            {/* Inline print preview of the run just generated (the browser print also opens). */}
            {previewHtml && (
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{t('qr.printPreview', 'Print preview (last run)')}</Typography>
                  <Button size="small" startIcon={<PrintIcon />} onClick={reprintPreview}>{t('qr.printAgain', 'Print again')}</Button>
                </Stack>
                <style>{LABEL_CSS}</style>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 1,
                    maxHeight: 280,
                    overflowY: 'auto',
                    p: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: '#FAFAFA',
                  }}
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </Box>
            )}

            <Divider>
              <Typography variant="caption" color="text.secondary">{t('qr.allLabels', 'All labels')}{totalElements ? ` (${totalElements})` : ''}</Typography>
            </Divider>

            <TextField
              size="small"
              fullWidth
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('qr.searchSerial', 'Search serial (e.g. 007)…')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>
                ),
              }}
            />

            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, minHeight: 120 }}>
              {loadingUnits ? (
                <Stack alignItems="center" sx={{ py: 3 }}><CircularProgress size={20} /></Stack>
              ) : units.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                  {search ? t('qr.noMatchingSerial', 'No matching serial.') : t('qr.noLabelsYet', 'No labels generated yet.')}
                </Typography>
              ) : (
                units.map((u) => (
                  <Stack
                    key={u.serial}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ px: 1.5, py: 0.75, borderBottom: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{u.serial}</Typography>
                      <Chip size="small" label={t('qr.status.' + u.status, u.status)} color={STATUS_COLOR[u.status] || 'default'} variant="outlined" />
                    </Stack>
                    <Tooltip title={t('qr.reprintLabel', 'Reprint this label')}>
                      <IconButton size="small" onClick={() => printOne(u)} disabled={busy}>
                        <PrintIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))
              )}
            </Box>

            {totalPages > 1 && (
              <Stack alignItems="center">
                <Pagination
                  size="small"
                  count={totalPages}
                  page={page + 1}
                  onChange={(_, value) => loadUnits(value - 1, search.trim() || undefined)}
                  disabled={loadingUnits}
                />
              </Stack>
            )}
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
};

export default GenerateLabelsDialog;
