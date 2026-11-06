import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Html5Qrcode } from 'html5-qrcode';

const REGION_ID = 'qr-camera-region';

/**
 * Camera-based QR scanner modal. Calls onDecode(text) for each successful scan
 * (kept open so you can scan several items in a row). Parent closes it.
 *
 * The scanner region is kept mounted (Dialog keepMounted) so html5-qrcode's async
 * render loop never finds its element missing — which is what crashes it otherwise.
 */
const CameraScanner = ({ open, onClose, onDecode }) => {
  const scannerRef = useRef(null);
  const startedRef = useRef(false);
  const lastRef = useRef({ text: '', at: 0 });
  const onDecodeRef = useRef(onDecode);
  onDecodeRef.current = onDecode;
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      // Wait a frame so the (keep-mounted) region is laid out before we attach.
      await new Promise((r) => requestAnimationFrame(() => r()));
      if (cancelled || startedRef.current) return;
      if (!document.getElementById(REGION_ID)) return;

      setError('');
      const scanner = new Html5Qrcode(REGION_ID, { verbose: false });
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          (text) => {
            const now = Date.now();
            if (text === lastRef.current.text && now - lastRef.current.at < 1500) return;
            lastRef.current = { text, at: now };
            onDecodeRef.current(text);
          },
          () => {}
        );
        startedRef.current = true;
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to start camera. Grant camera permission and try again.');
        }
      }
    };

    const stop = async () => {
      const s = scannerRef.current;
      scannerRef.current = null;
      startedRef.current = false;
      if (!s) return;
      try {
        // Only stop if it actually reached a scanning state.
        if (s.getState && s.getState() === 2 /* SCANNING */) {
          await s.stop();
        }
        s.clear();
      } catch (e) {
        /* ignore teardown races */
      }
    };

    if (open) {
      start();
    } else {
      stop();
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth keepMounted>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 800 }}>
        Scan QR with camera
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        <Box id={REGION_ID} sx={{ width: '100%', minHeight: 260, borderRadius: 1, overflow: 'hidden' }} />
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          Point the camera at a garment's QR tag. Each valid scan is added to the sale.
        </Typography>
      </DialogContent>
    </Dialog>
  );
};

export default CameraScanner;
