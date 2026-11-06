import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';

const SummaryCards = ({ items }) => {
  return (
    <Grid container spacing={3}>
      {items.map((item) => (
        <Grid key={item.title} item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, minHeight: 150, p: 2, backgroundColor: '#fff' }}>
            <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: '#0F172A' }}>
                    {item.value}
                  </Typography>
                </Box>
                <Box sx={{ color: item.color || 'var(--theme-primary)', fontSize: '1.5rem' }}>{item.icon}</Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {item.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default SummaryCards;
