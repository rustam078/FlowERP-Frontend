import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const SalesPage = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: '#0F172A' }}>
        Sales & Invoices
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage customer orders, shipping invoices, and billing ledgers.
      </Typography>
      
      <Card>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            Customer Orders & Billing Ledger
          </Typography>
          <Typography variant="body2" color="text.disabled">
            This module will manage client POs, custom pricing matrices, commercial invoice generators, and shipment dispatches.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SalesPage;
