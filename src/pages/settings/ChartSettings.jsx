import React, { useState } from 'react';
import { Box, FormControlLabel, Switch, Typography } from '@mui/material';
import { useT } from '../../contexts/LanguageContext';

const KEY = 'skr_chart_labels';

/**
 * Dashboard chart preferences (per browser). Currently: show/hide the name labels
 * (with leader lines) on pie charts across all dashboard reports.
 */
const ChartSettings = () => {
  const t = useT();
  const [on, setOn] = useState(() => {
    try { return localStorage.getItem(KEY) !== 'false'; } catch { return true; }
  });

  const toggle = (checked) => {
    setOn(checked);
    try { localStorage.setItem(KEY, checked ? 'true' : 'false'); } catch { /* ignore */ }
    // Let any open dashboard update live.
    window.dispatchEvent(new Event('chart-labels-changed'));
  };

  return (
    <Box>
      <FormControlLabel
        control={<Switch checked={on} onChange={(e) => toggle(e.target.checked)} />}
        label={<Typography sx={{ fontWeight: 600 }}>{t('settings.chart.showNames', 'Show names on pie charts')}</Typography>}
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {t('settings.chart.help', 'When on, each pie slice shows its name and percentage with a leader line, across all dashboard reports. Turn it off for a cleaner look (the legend still names each slice).')}
      </Typography>
    </Box>
  );
};

export default ChartSettings;
