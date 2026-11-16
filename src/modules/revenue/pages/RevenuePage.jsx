import React, { useState } from 'react';
import { Box, Stack, Tab, Tabs, Typography } from '@mui/material';
import RevenueTab from '../components/RevenueTab';
import HeadingInfo from '../../../components/common/HeadingInfo';
import { useT } from '../../../contexts/LanguageContext';

const TABS = ['ALL', 'INVESTMENT', 'SALES', 'EMPLOYEE'];

/** Revenue: every payment across modules. A tab mounts on first open and then keeps its filters. */
const RevenuePage = () => {
  const t = useT();
  const [active, setActive] = useState('ALL');
  const [opened, setOpened] = useState(['ALL']);
  const [toolbarEl, setToolbarEl] = useState(null); // right side of the tab row, filled by the active tab

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
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between"
        columnGap={2} sx={{ mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={active} onChange={(e, v) => openTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ flexShrink: 0 }}>
          {TABS.map((tab) => <Tab key={tab} value={tab} label={t(`revenue.tab.${tab}`, tab)} sx={{ fontWeight: 700, textTransform: 'none' }} />)}
        </Tabs>
        <Box ref={setToolbarEl} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 1.5, py: 0.75 }} />
      </Stack>
      {opened.map((tab) => (
        <Box key={tab} hidden={tab !== active}><RevenueTab tab={tab} active={tab === active} toolbarEl={toolbarEl} /></Box>
      ))}
    </Box>
  );
};

export default RevenuePage;
