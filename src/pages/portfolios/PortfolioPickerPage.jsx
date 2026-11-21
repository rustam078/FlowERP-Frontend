import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Card, Chip, IconButton, InputAdornment, Paper, Skeleton, Stack, Switch, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import dayjs from 'dayjs';
import portfolioService from '../../services/portfolioService';
import { authService } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { useT } from '../../contexts/LanguageContext';
import CreatePortfolioDialog from './CreatePortfolioDialog';
import DeletePortfolioDialog from './DeletePortfolioDialog';
import SuperAdminHeader from './SuperAdminHeader';

/** SUPER_ADMIN home: pick a portfolio to work in, and create / (de)activate / delete portfolios. */
const PortfolioPickerPage = () => {
  const t = useT();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateSession } = useAuth();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [error, setError] = useState('');

  const { data: portfolios = [], isLoading } = useQuery({
    queryKey: ['portfolios', search],
    queryFn: () => portfolioService.list(search.trim()),
    placeholderData: (prev) => prev,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['portfolios'] });

  // Work inside a portfolio: the server switches the session, then all cached data is dropped.
  const enter = async (p) => {
    setError('');
    try {
      updateSession(await authService.switchPortfolio(p.id));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  // If the portfolio being worked in is switched off, leave it locally too (back to "no portfolio").
  const leaveIfCurrent = (p) => {
    if (user?.portfolioId === p.id) updateSession({ ...user, portfolioId: null, portfolioName: null });
  };

  const toggleActive = async (p) => {
    setError('');
    try {
      await portfolioService.setActive(p.id, !p.active);
      if (p.active) leaveIfCurrent(p);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC' }}>
      <SuperAdminHeader />

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, sm: 4 }, py: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A' }}>{t('portfolio.title', 'Portfolios')}</Typography>
            <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('portfolio.subtitle', 'Choose a portfolio to work in, or manage portfolios.')}</Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            {user?.portfolioId ? (
              <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')}>
                {t('portfolio.backTo', 'Back to {name}').replace('{name}', user.portfolioName || '')}
              </Button>
            ) : null}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>{t('portfolio.new', 'New Portfolio')}</Button>
          </Stack>
        </Stack>

        <TextField
          placeholder={t('portfolio.search', 'Search by name or prefix')} value={search} onChange={(e) => setSearch(e.target.value)}
          size="small" sx={{ mb: 2, width: { xs: '100%', sm: 320 }, bgcolor: '#fff' }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        {error ? <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert> : null}

        <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
          <TableContainer component={Paper} sx={{ boxShadow: 'none', overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  {[t('portfolio.colName', 'Portfolio'), t('portfolio.colPrefix', 'Batch prefix'), t('portfolio.colUsers', 'Users'),
                    t('portfolio.colStatus', 'Active'), t('portfolio.colCreated', 'Created'), ''].map((h) => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                )) : portfolios.map((p) => (
                  <TableRow key={p.id} hover selected={user?.portfolioId === p.id}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{p.name}</Typography>
                      {p.defaultPortfolio ? <Chip size="small" label={t('portfolio.default', 'Default')} sx={{ mt: 0.5 }} /> : null}
                    </TableCell>
                    <TableCell><Chip size="small" variant="outlined" label={`${p.batchPrefix}001…`} sx={{ fontWeight: 700, letterSpacing: '0.05em' }} /></TableCell>
                    <TableCell>{p.userCount}</TableCell>
                    <TableCell><Switch size="small" checked={Boolean(p.active)} onChange={() => toggleActive(p)} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{p.createdAt ? dayjs(p.createdAt).format('DD-MMM-YYYY') : '—'}</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      <Button size="small" variant="contained" startIcon={<LoginIcon />} disabled={!p.active} onClick={() => enter(p)}>
                        {user?.portfolioId === p.id ? t('portfolio.current', 'Open') : t('portfolio.enter', 'Enter')}
                      </Button>
                      {!p.defaultPortfolio ? (
                        <Tooltip title={t('common.delete', 'Delete')}>
                          <IconButton size="small" color="error" onClick={() => setToDelete(p)} sx={{ ml: 1 }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && portfolios.length === 0 ? (
                  <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 6, color: '#64748B' }}>{t('portfolio.empty', 'No portfolios found')}</TableCell></TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <CreatePortfolioDialog open={createOpen} onClose={() => setCreateOpen(false)} onCreated={() => { setCreateOpen(false); refresh(); }} />
      <DeletePortfolioDialog
        portfolio={toDelete}
        onClose={() => setToDelete(null)}
        onDeleted={(p) => { leaveIfCurrent(p); setToDelete(null); refresh(); }}
      />
    </Box>
  );
};

export default PortfolioPickerPage;
