import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tabs,
  Tab,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import QrCode2Icon from '@mui/icons-material/QrCode2';

import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import HeadingInfo from '../../components/common/HeadingInfo';
import BatchHistorySection from '../../components/products/BatchHistorySection';
import GenerateLabelsDialog from '../../modules/qr/components/GenerateLabelsDialog';

import axiosInstance from '../../services/axios';
import { getCurrencySymbol } from '../../utils/currency';
import { sourceLabel } from '../../utils/sourceLabel';
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';

const formatCurrency = (value) =>
  value == null
    ? '—'
    : `${getCurrencySymbol()}${Number(value).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      })}`;

const formatNumber = (value) =>
  value == null
    ? '—'
    : Number(value).toLocaleString('en-IN', {
        maximumFractionDigits: 2,
      });

const formatDate = (value) => {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const quickRanges = [
  { value: 'All', label: 'All' },
  { value: 'Today', label: 'Today' },
  { value: 'Yesterday', label: 'Yesterday' },
  { value: 'ThisMonth', label: 'This Month' },
  { value: 'Custom', label: 'Custom Range' },
];

const InventoryDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const t = useT();
  const queryClient = useQueryClient();

  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [batchStatus, setBatchStatus] = useState('ACTIVE');

  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [quickRange, setQuickRange] = useState('All');

  const [appliedQuickRange, setAppliedQuickRange] = useState('All');
  const [appliedFromDate, setAppliedFromDate] = useState('');
  const [appliedToDate, setAppliedToDate] = useState('');

  const [refreshKey, setRefreshKey] = useState(0);

  // Adjust Stock Modal
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjDir, setAdjDir] = useState('INCREASE');
  const [adjRemarks, setAdjRemarks] = useState('');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState('');

  // QR Labels Dialog
  const [qrBatch, setQrBatch] = useState(null);

  // Snackbar
  const [toast, setToast] = useState({
    open: false,
    message: '',
  });

  const openAdjust = (batch) => {
    setAdjustTarget(batch);
    setAdjQty('');
    setAdjDir('INCREASE');
    setAdjRemarks('');
    setAdjError('');
  };

  const closeAdjust = () => {
    if (adjSaving) return;
    setAdjustTarget(null);
  };

  const submitAdjust = async () => {
    const qty = Number(adjQty);

    if (!qty || qty <= 0) {
      setAdjError(
        t('inventory.enterQtyPositive', 'Enter a quantity greater than zero')
      );
      return;
    }

    const available = Number(adjustTarget?.quantityAvailable ?? 0);

    if (adjDir === 'DECREASE' && qty > available) {
      setAdjError(
        `${t('inventory.only', 'Only')} ${available} ${t(
          'inventory.unitsInBatch',
          'unit(s) available in this batch'
        )}`
      );
      return;
    }

    setAdjSaving(true);
    setAdjError('');

    try {
      await axiosInstance.patch(
        `/inventory/batches/${adjustTarget.batchId}/adjust`,
        {
          quantity: qty,
          direction: adjDir,
          remarks: adjRemarks.trim() || undefined,
        }
      );

      setToast({
        open: true,
        message: `${
          adjDir === 'INCREASE'
            ? t('inventory.stockIncreasedBy', 'Stock increased by')
            : t('inventory.stockDecreasedBy', 'Stock decreased by')
        } ${qty}`,
      });

      setAdjustTarget(null);

      // Refresh inventory data
      setRefreshKey((key) => key + 1);

      // Refresh dashboard and alerts
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });

      window.dispatchEvent(new Event('inventory-alerts-updated'));
    } catch (err) {
      setAdjError(
        err.response?.data?.message ||
          err.message ||
          t('inventory.adjustFailed', 'Failed to adjust stock')
      );
    } finally {
      setAdjSaving(false);
    }
  };

  const applyQuickRange = (range) => {
    const today = dayjs();

    switch (range) {
      case 'All':
        return { fromDate: '', toDate: '' };

      case 'Today':
        return {
          fromDate: today.format('YYYY-MM-DD'),
          toDate: today.format('YYYY-MM-DD'),
        };

      case 'Yesterday': {
        const yesterday = today.subtract(1, 'day').format('YYYY-MM-DD');
        return {
          fromDate: yesterday,
          toDate: yesterday,
        };
      }

      case 'ThisMonth':
        return {
          fromDate: today.startOf('month').format('YYYY-MM-DD'),
          toDate: today.endOf('month').format('YYYY-MM-DD'),
        };

      case 'Custom':
      default:
        return null;
    }
  };

  useEffect(() => {
    if (quickRange === 'Custom') return;

    const range = applyQuickRange(quickRange);

    if (range) {
      setFromDate(range.fromDate);
      setToDate(range.toDate);

      setAppliedQuickRange(quickRange);
      setAppliedFromDate(range.fromDate);
      setAppliedToDate(range.toDate);
    }
  }, [quickRange]);

  const handleApplyFilter = () => {
    setAppliedQuickRange(quickRange);
    setAppliedFromDate(fromDate);
    setAppliedToDate(toDate);
    setPage(0);
  };

  useEffect(() => {
    const fetchInventoryDetails = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {
          page,
          size: rowsPerPage,
          status: batchStatus,
        };

        if (appliedQuickRange !== 'All') {
          if (appliedFromDate) params.fromDate = appliedFromDate;
          if (appliedToDate) params.toDate = appliedToDate;
        }

        const response = await axiosInstance.get(
          `/inventory/product/${productId}/batches`,
          { params }
        );

        setDetails(response.data || null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            t('inventory.loadDetailsError', 'Unable to load inventory details.')
        );
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchInventoryDetails();
    }
  }, [
    productId,
    appliedQuickRange,
    appliedFromDate,
    appliedToDate,
    refreshKey,
    page,
    rowsPerPage,
    batchStatus,
  ]);

  useEffect(() => {
    setPage(0);
  }, [
    productId,
    appliedQuickRange,
    appliedFromDate,
    appliedToDate,
    batchStatus,
  ]);

  const batches = details?.batches || [];
  const totalBatches = Number(details?.totalBatches ?? batches.length);

  if (loading && !details) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !details) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!details) return null;

  return (
    <Box>
      {/* Header and Filters */}
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/inventory')}
          sx={{ textTransform: 'none' }}
        >
          {t('inventory.backToInventory', 'Back to Inventory')}
        </Button>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel id="quick-range-label">
              {t('inventory.dateRange', 'Date Range')}
            </InputLabel>
            <Select
              labelId="quick-range-label"
              value={quickRange}
              label={t('inventory.dateRange', 'Date Range')}
              onChange={(event) => setQuickRange(event.target.value)}
            >
              {quickRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {t('inventory.range' + range.value, range.label)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label={t('common.from', 'From')}
            type="date"
            size="small"
            value={fromDate}
            onChange={(event) => {
              setFromDate(event.target.value);
              setQuickRange('Custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          <TextField
            label={t('common.to', 'To')}
            type="date"
            size="small"
            value={toDate}
            onChange={(event) => {
              setToDate(event.target.value);
              setQuickRange('Custom');
            }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 150 }}
          />

          {quickRange === 'Custom' && (
            <Button
              variant="contained"
              size="small"
              onClick={handleApplyFilter}
              disabled={!fromDate || !toDate || fromDate > toDate}
              sx={{ minWidth: 120 }}
            >
              {t('inventory.apply', 'Apply')}
            </Button>
          )}
        </Stack>
      </Box>

      {/* Inventory Summary */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.25, md: 3 },
          border: '1px solid #E2E8F0',
          borderRadius: 3,
          bgcolor: '#FAFBFF',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: { xs: 2, lg: 3 },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {details.productName}
            <HeadingInfo
              text={t(
                'inventory.detailsInfo',
                'Batch-level stock, movements and inventory value for this product.'
              )}
            />
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ mt: 0.75, flexWrap: 'wrap' }}
          >
            <Chip
              label={sourceLabel(t, details.source)}
              color={
                details.source === 'PURCHASED'
                  ? 'info'
                  : details.source === 'BOTH'
                    ? 'secondary'
                    : 'success'
              }
              variant="outlined"
            />

            <Typography variant="body2" color="text.secondary">
              {t('inventory.snapshot', 'Inventory snapshot for this product.')}
            </Typography>
          </Stack>
        </Box>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 2 }}
          divider={
            <Divider
              orientation="vertical"
              flexItem
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
          }
          sx={{ width: { xs: '100%', lg: 'auto' } }}
        >
          {[
            {
              label: t('inventory.totalQuantity', 'Total Quantity'),
              value: formatNumber(details.totalQuantity),
            },
            {
              label: t('inventory.totalSold', 'Total Sold'),
              value: formatNumber(details.totalSold),
              valueColor: 'error.main',
            },
            {
              label: t('inventory.quantityAvailable', 'Quantity Available'),
              value: formatNumber(details.quantityAvailable),
              valueColor: 'success.main',
            },
            {
              label: t('inventory.totalValue', 'Total Value'),
              value: formatCurrency(details.totalValue),
            },
            {
              label: t('inventory.averageCost', 'Average Cost'),
              value: formatCurrency(details.averageCost),
            },
            {
              label: t('inventory.batchCount', 'Batch Count'),
              value: totalBatches,
            },
          ].map((item) => (
            <Box key={item.label} sx={{ minWidth: { sm: 120 } }}>
              <Typography variant="caption" color="text.secondary">
                {item.label}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mt: 0.25,
                  color: item.valueColor || 'inherit',
                }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Batch History - Reusable Component */}
          <BatchHistorySection
            batches={batches}
            productName={details?.productName}
            canWrite={can('inventory', 'write')}
            onAdjust={openAdjust}
            onQr={setQrBatch}
          />
      {/* Adjust stock modal (batch increase / decrease) */}
      <Dialog
        open={Boolean(adjustTarget)}
        onClose={adjSaving ? undefined : closeAdjust}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <TuneOutlinedIcon color="primary" fontSize="small" />
          {t('inventory.adjustStock', 'Adjust Stock')}
        </DialogTitle>

        <DialogContent dividers>
          {adjustTarget && (
            <Stack spacing={2}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t('inventory.batch', 'Batch')}
                  </Typography>
                  <Typography sx={{ fontWeight: 700 }}>
                    {adjustTarget.batchNumber}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">
                    {t('inventory.available', 'Available')}
                  </Typography>
                  <Typography sx={{ fontWeight: 800, color: 'success.main' }}>
                    {formatNumber(adjustTarget.quantityAvailable)}
                  </Typography>
                </Box>
              </Box>

              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={adjDir}
                onChange={(e, value) => value && setAdjDir(value)}
                color="primary"
              >
                <ToggleButton value="INCREASE">
                  <AddIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {t('inventory.increase', 'Increase')}
                </ToggleButton>
                <ToggleButton value="DECREASE">
                  <RemoveIcon fontSize="small" sx={{ mr: 0.5 }} />
                  {t('inventory.decrease', 'Decrease')}
                </ToggleButton>
              </ToggleButtonGroup>

              <TextField
                label={t('inventory.quantity', 'Quantity')}
                type="number"
                size="small"
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                inputProps={{ min: 0, step: 'any' }}
                autoFocus
                fullWidth
              />

              {(() =>{
                const available = Number(adjustTarget.quantityAvailable ?? 0);
                const quantity = Number(adjQty) || 0;
                const nextAvailable =
                  adjDir === 'INCREASE'
                    ? available + quantity
                    : available - quantity;

                return (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      px: 0.5,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {t('inventory.newAvailable', 'New available')}
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color:
                          nextAvailable < 0
                            ? 'error.main'
                            : 'var(--theme-primary)',
                      }}
                    >
                      {formatNumber(nextAvailable)}
                    </Typography>
                  </Box>
                );
              })()}

              {adjError && <Alert severity="error" sx={{ py: 0 }}>{adjError}</Alert>}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={closeAdjust}
            disabled={adjSaving}
            sx={{ textTransform: 'none' }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            variant="contained"
            onClick={submitAdjust}
            disabled={adjSaving}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {adjSaving
              ? t('inventory.savingDots', 'Saving…')
              : t('common.confirm', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Generate Labels Dialog - Reusable Component */}
      <GenerateLabelsDialog
        open={Boolean(qrBatch)}
        onClose={() => setQrBatch(null)}
        batch={qrBatch}
        onGenerated={() => setRefreshKey((key) => key + 1)}
      />

      {/* Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={2500}
        onClose={() => setToast({ open: false, message: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setToast({ open: false, message: '' })}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryDetailsPage;