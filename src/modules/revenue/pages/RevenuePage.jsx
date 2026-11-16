import React, { useState } from 'react';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import RevenueTab from '../components/RevenueTab';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { useT } from '../../../contexts/LanguageContext';

const TABS = ['ALL', 'INVESTMENT', 'SALES', 'EMPLOYEE'];

/** Revenue: every payment across modules. A tab mounts on first open and then keeps its filters. */
const RevenuePage = () => {
  const t = useT();
  const [active, setActive] = useState('ALL');
  const [opened, setOpened] = useState(['ALL']);

  const openTab = (tab) => {
    setActive(tab);
    setOpened((prev) => (prev.includes(tab) ? prev : [...prev, tab]));
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', mb: 1.5 }}>
        {t('revenue.title', 'Revenue')}
        <HeadingInfo text={t('revenue.info', 'Every payment received and made across Investment, Sales and Employees.')} />
      </Typography>
      <Tabs value={active} onChange={(e, v) => openTab(v)} variant="scrollable" allowScrollButtonsMobile
        sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        {TABS.map((tab) => <Tab key={tab} value={tab} label={t(`revenue.tab.${tab}`, tab)} sx={{ fontWeight: 700, textTransform: 'none' }} />)}
      </Tabs>
      {opened.map((tab) => (
        <Box key={tab} hidden={tab !== active}><RevenueTab tab={tab} /></Box>
      ))}
    </Box>
  );
};

export default RevenuePage;
