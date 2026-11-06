import React from 'react';
import { Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material';
import { useT } from '../../../contexts/LanguageContext';

const CustomerCard = ({ customer }) => {
  const t = useT();
  return (
    <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
      <CardHeader title={t('sales.customerDetails', 'Customer Details')} sx={{ '& .MuiCardHeader-title': { fontWeight: 700 } }} />
      <Divider />
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="body2" color="text.secondary">
            {t('sales.name', 'Name')}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.name || '-'}</Typography>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            {t('sales.mobile', 'Mobile')}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.mobile || '-'}</Typography>
          <Divider />
          <Typography variant="body2" color="text.secondary">
            {t('sales.email', 'Email')}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>{customer?.email || '-'}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;
