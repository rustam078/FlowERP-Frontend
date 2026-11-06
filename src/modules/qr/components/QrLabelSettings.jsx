import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import qrService, { DEFAULT_LABEL_CONFIG } from '../qrService';
import { LABEL_CSS, labelClass, labelInnerHtml, toQrDataUrl } from '../labelPrinting';
import { useT } from '../../../contexts/LanguageContext';

const SAMPLE = {
  serial: 'BT000087-001',
  productName: 'Formal Shirt',
  printedPrice: 350,
  qrPayload: 'SKR1|BT000087-001|Formal Shirt|350.00',
};

const QrLabelSettings = () => {
  const t = useT();
  const [config, setConfig] = useState(DEFAULT_LABEL_CONFIG);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    qrService
      .getLabelConfig()
      .then((c) => { if (active) setConfig(c); })
      .finally(() => { if (active) setLoading(false); });
    toQrDataUrl(SAMPLE).then((url) => { if (active) setQrDataUrl(url); });
    return () => { active = false; };
  }, []);

  const set = (patch) => { setConfig((c) => ({ ...c, ...patch })); setSaved(false); };

  const handleSave = async () => {
    setSaving(true);
    try {
      await qrService.saveLabelConfig(config);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const previewHtml = useMemo(
    () => (qrDataUrl ? labelInnerHtml({ ...SAMPLE, qrDataUrl }, config) : ''),
    [qrDataUrl, config]
  );

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={18} /><Typography color="text.secondary">{t('settings.qr.loading', 'Loading QR settings…')}</Typography>
      </Stack>
    );
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('settings.qr.help', "Choose what prints on each garment's QR label. The QR itself always encodes the serial so scanning keeps working.")}
      </Typography>

      <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* Controls */}
          <Stack spacing={1.5} sx={{ minWidth: 260, flex: 1 }}>
            <FormControlLabel
              control={<Switch checked={config.showName} onChange={(e) => set({ showName: e.target.checked })} />}
              label={t('settings.qr.showName', 'Show product name')}
            />
            <Box sx={{ pl: 4 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                {t('settings.qr.orientation', 'Product name orientation')}
              </Typography>
              <ToggleButtonGroup
                size="small"
                exclusive
                disabled={!config.showName}
                value={config.nameVertical ? 'vertical' : 'horizontal'}
                onChange={(e, v) => { if (v) set({ nameVertical: v === 'vertical' }); }}
              >
                <ToggleButton value="horizontal">{t('settings.qr.horizontal', 'Horizontal')}</ToggleButton>
                <ToggleButton value="vertical">{t('settings.qr.vertical', 'Vertical (left)')}</ToggleButton>
              </ToggleButtonGroup>
            </Box>
            <FormControlLabel
              control={<Switch checked={config.showPrice} onChange={(e) => set({ showPrice: e.target.checked })} />}
              label={t('settings.qr.showPrice', 'Show price')}
            />
            <FormControlLabel
              control={<Switch checked={config.showSerial} onChange={(e) => set({ showSerial: e.target.checked })} />}
              label={t('settings.qr.showSerial', 'Show serial number')}
            />

            <Divider sx={{ my: 1 }} />
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button variant="contained" onClick={handleSave} disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}>
                {t('settings.qr.save', 'Save settings')}
              </Button>
              {saved ? <Alert severity="success" sx={{ py: 0 }}>{t('settings.qr.saved', 'Saved')}</Alert> : null}
            </Stack>
          </Stack>

          {/* Live preview */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              {t('settings.qr.preview', 'Live preview')}
            </Typography>
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, display: 'inline-block' }}>
              <style>{LABEL_CSS}</style>
              <div
                className={labelClass(config)}
                style={{ width: config.nameVertical ? 190 : 150, minHeight: 150, background: '#fff' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </Box>
          </Box>
      </Box>
    </Box>
  );
};

export default QrLabelSettings;
