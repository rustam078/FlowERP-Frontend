import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography } from '@mui/material';
import { useT } from '../../../contexts/LanguageContext';

const RevenuePlaceholder = () => {
  const t = useT();
  return (
    <Card sx={{ borderRadius: 2, minHeight: 300 }}>
      <CardHeader title={t('sales.revenueOverview', 'Revenue Overview')} />
      <CardContent>
        <Box sx={{ height: 220, border: '1px dashed #CBD5E1', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
          <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
            {t('sales.chartComingSoon', 'Chart Coming Soon')}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RevenuePlaceholder;
