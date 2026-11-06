import React from 'react';
import {
  Box,
  Button,
  Chip,
  Drawer,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../services/axios';
import { useT } from '../../contexts/LanguageContext';

/**
 * Global low-stock alerts drawer. Opened from the navbar bell on ANY page
 * (no navigation). Clicking a product opens its inventory detail.
 */
const LowStockAlertsDrawer = ({ open, onClose }) => {
  const navigate = useNavigate();
  const t = useT();

  const { data: alerts = [] } = useQuery({
    queryKey: ['lowStockAlerts'],
    queryFn: async () => {
      const res = await axiosInstance.get('/inventory/alerts');
      return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },
    refetchInterval: 60000,
  });

  const goToProduct = (productId) => {
    onClose?.();
    navigate(`/inventory/${productId}`);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 560 }, p: 3, overflowX: 'hidden' } }}
    >
      <Stack spacing={2.5} sx={{ height: '100%', overflow: 'hidden' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t('ui.lowStock.title', 'Low Stock Products')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('ui.lowStock.subtitle', 'Review products at or below the global threshold.')}
          </Typography>
        </Box>

        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 44, color: 'text.secondary', mb: 1.5 }} />
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {t('ui.lowStock.empty', 'No products are below the configured threshold.')}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflowY: 'auto', pr: 0.5 }}>
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 0 }}>
              <Table size="small" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '32%', fontWeight: 700, py: 0.5, px: 0.75 }}>{t('ui.lowStock.product', 'Product')}</TableCell>
                    <TableCell sx={{ width: '20%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'right' }}>{t('ui.lowStock.stock', 'Stock')}</TableCell>
                    <TableCell sx={{ width: '20%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'right' }}>{t('ui.lowStock.threshold', 'Threshold')}</TableCell>
                    <TableCell sx={{ width: '28%', fontWeight: 700, py: 0.5, px: 0.75, textAlign: 'center' }}>{t('common.status', 'Status')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((item) => (
                    <TableRow key={item.productId} hover onClick={() => goToProduct(item.productId)} sx={{ cursor: 'pointer' }}>
                      <TableCell sx={{ py: 0.5, px: 0.75 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>{item.productName}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{Number(item.currentStock ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'right' }}>
                        <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>{Number(item.threshold ?? 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                      </TableCell>
                      <TableCell sx={{ py: 0.5, px: 0.75, textAlign: 'center' }}>
                        <Chip label={t('ui.lowStock.lowStockTag', 'LOW STOCK')} size="small" sx={{ fontSize: '0.75rem', px: 1, bgcolor: 'primary.main', color: '#fff', fontWeight: 700 }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Stack>
    </Drawer>
  );
};

export default LowStockAlertsDrawer;
