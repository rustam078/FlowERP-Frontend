import React, { useEffect, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import portfolioService from '../../services/portfolioService';
import { useT } from '../../contexts/LanguageContext';

/** Delete (hide + lock, data kept) after typing the portfolio's exact name. */
const DeletePortfolioDialog = ({ portfolio, onClose, onDeleted }) => {
  const t = useT();
  const [typed, setTyped] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setTyped(''); setError(''); }, [portfolio]);

  const handleDelete = async () => {
    setBusy(true);
    setError('');
    try {
      await portfolioService.remove(portfolio.id, typed);
      onDeleted?.(portfolio);
    } catch (err) {
      setError(err.message || t('portfolio.deleteFailed', 'Could not delete the portfolio'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(portfolio)} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, color: '#B91C1C' }}>{t('portfolio.deleteTitle', 'Delete Portfolio')}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2, color: '#475569', fontSize: '0.9rem' }}>
          {t('portfolio.deleteHelp', 'Its users will be signed out and can no longer log in. The portfolio is hidden, but its data is kept.')}
        </Typography>
        <Typography sx={{ mb: 1, fontSize: '0.85rem' }}>
          {t('portfolio.typeToConfirm', 'Type the portfolio name to confirm:')} <strong>{portfolio?.name}</strong>
        </Typography>
        <TextField value={typed} onChange={(e) => setTyped(e.target.value)} size="small" fullWidth autoFocus />
        {error ? <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert> : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>{t('common.cancel', 'Cancel')}</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={busy || typed.trim() !== portfolio?.name}>
          {t('common.delete', 'Delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeletePortfolioDialog;
