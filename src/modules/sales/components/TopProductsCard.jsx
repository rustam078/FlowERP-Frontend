import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Typography,
  Stack,
} from '@mui/material';
import { useT } from '../../../contexts/LanguageContext';

const chartColors = ['var(--theme-primary)', '#22C55E', 'var(--theme-primary)', '#F97316', 'var(--theme-primary)'];

const TopProductsCard = ({ products, loading, error }) => {
  const t = useT();
  const topProducts = Array.isArray(products) ? products.slice(0, 5) : [];
  const totalQuantity = topProducts.reduce((sum, item) => sum + (Number(item.totalQuantitySold ?? 0)), 0) || 1;

  const segments = topProducts.map((product, index) => ({
    value: Number(product.totalQuantitySold ?? 0),
    color: chartColors[index % chartColors.length],
  }));

  const donutSegments = segments.reduce((acc, segment) => {
    const last = acc[acc.length - 1] || { from: 0, to: 0 };
    const from = last.to;
    const to = from + (segment.value / totalQuantity) * 360;
    return [...acc, { from, to, color: segment.color }];
  }, []);

  const donutBackground = donutSegments
    .map((segment) => `${segment.color} ${segment.from}deg ${segment.to}deg`)
    .join(', ');

  return (
    <Card sx={{ borderRadius: 2, minHeight: 360 }}>
      <CardHeader title={t('sales.topSellingProducts', 'Top Selling Products')} />
      <CardContent>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('sales.loadingTopProducts', 'Loading top products...')}</Typography>
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : topProducts.length === 0 ? (
          <Typography color="text.secondary">{t('sales.noTopProducts', 'No top products found.')}</Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box
              sx={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: `conic-gradient(${donutBackground})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  width: 108,
                  height: 108,
                  borderRadius: '50%',
                  backgroundColor: '#F8FAFC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 1px 2px rgba(15,23,42,0.05)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {totalQuantity}
                </Typography>
              </Box>
            </Box>

            <Stack spacing={1.5} sx={{ flex: 1, minWidth: 240 }}>
              {topProducts.map((product, index) => {
                const quantity = Number(product.totalQuantitySold ?? 0);
                const percentage = Math.round((quantity / totalQuantity) * 100);
                const color = chartColors[index % chartColors.length];
                return (
                  <Box key={product.productId || product.productName} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color }} />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {product.productName}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {quantity.toLocaleString('en-IN', { maximumFractionDigits: 0 })} ({percentage}%)
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TopProductsCard;
