import React, { useEffect, useRef, useState } from 'react';
import { Box, Button, InputAdornment, TextField } from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import qrService from '../qrService';
import CameraScanner from './CameraScanner';

/**
 * Scan-to-add bar for a sale form. A focused text field captures keyboard-wedge
 * scanners (they "type" the code + Enter); a camera button opens the in-app scanner.
 * On a valid scan it resolves the unit via the API and calls onUnit(unit).
 *
 * Props: onUnit(unit), onError(message)
 */
const ScanBar = ({ onUnit, onError }) => {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const autoTimer = useRef(null);
  const inputRef = useRef(null);

  // Keep the scan field focused so back-to-back scans work without re-clicking.
  // (A re-render after adding a line can otherwise move focus to the new row.)
  const refocus = () => {
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // Clear any pending auto-submit on unmount.
  useEffect(() => () => { if (autoTimer.current) clearTimeout(autoTimer.current); }, []);

  const clearAutoTimer = () => {
    if (autoTimer.current) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const lookup = async (code) => {
    const trimmed = (code || '').trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await qrService.scan(trimmed);
      const unit = res?.data;
      // Surface the tag's status at scan time — don't wait until sale submit.
      if (unit?.status && unit.status !== 'AVAILABLE') {
        const label = unit.status === 'SOLD' ? 'already sold' : unit.status.toLowerCase();
        onError?.(`Tag ${unit.serial} is ${label} — cannot add to sale.`);
        return;
      }
      onUnit(unit);
    } catch (err) {
      onError?.(err.response?.data?.message || err.message || 'Scan failed.');
    } finally {
      setBusy(false);
      refocus();
    }
  };

  // A scanned QR payload (SKR1|serial|name|price) arrives as a fast keystroke burst.
  // If the scanner is not configured to append Enter, auto-submit once the burst
  // has clearly ended (short idle) and the value looks like our payload. Manual
  // typing of a bare serial still needs Enter, so we don't submit those early.
  // Our QR payload shape: SKR1|serial|name|price. Pull the real payload(s) out of a scan
  // even if a flaky HID scanner prepended junk (e.g. repeated 0s) or ran two scans together.
  const PAYLOAD_RE = 'SKR1\\|[^|]+\\|[^|]*\\|\\d+(?:\\.\\d+)?';

  const flush = (raw, allowBare) => {
    // Unique complete payloads found anywhere in the buffer (dedupes an accidental double scan).
    const codes = [...new Set((raw.match(new RegExp(PAYLOAD_RE, 'g')) || []))];
    if (codes.length) {
      setValue('');
      codes.forEach((c) => lookup(c));
    } else if (allowBare && raw.trim()) {
      // Manually typed bare serial (no payload wrapper) — only on explicit Enter.
      setValue('');
      lookup(raw.trim());
    }
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setValue(v);
    clearAutoTimer();
    // Auto-submit once a full payload is present AND the keystroke burst has paused.
    if (v.includes('SKR1|')) {
      autoTimer.current = setTimeout(() => {
        autoTimer.current = null;
        flush(v, false);
      }, 250);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      clearAutoTimer();
      flush(e.target.value || value, true);
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch' }}>
      <TextField
        autoFocus
        inputRef={inputRef}
        size="small"
        fullWidth
        value={value}
        disabled={busy}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Scan a QR tag (or type a serial) and press Enter"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <QrCodeScannerIcon fontSize="small" color="primary" />
            </InputAdornment>
          ),
        }}
        sx={{ '& .MuiInputBase-root': { bgcolor: '#F0F9FF' } }}
      />
      <Button
        variant="outlined"
        onClick={() => setCameraOpen(true)}
        aria-label="Open camera scanner"
        title="Open camera scanner"
        sx={{ minWidth: 44, px: 1 }}
      >
        <PhotoCameraIcon />
      </Button>

      <CameraScanner
        open={cameraOpen}
        onClose={() => { setCameraOpen(false); refocus(); }}
        onDecode={(text) => lookup(text)}
      />
    </Box>
  );
};

export default ScanBar;
