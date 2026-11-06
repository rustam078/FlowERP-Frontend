import React, { useState } from 'react';
import { Modal, Radio, DatePicker, Button, Space, Typography } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, PrinterOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useT } from '../../contexts/LanguageContext';

const { RangePicker } = DatePicker;
const MAX_DAYS = 90;

type Format = 'pdf' | 'excel';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  onDownload: (format: Format, fromDate: string, toDate: string) => Promise<void> | void;
  onPrint?: (fromDate: string, toDate: string) => Promise<void> | void; // adds a Print button when provided
}

/** Report range picker (current month / particular month / custom ≤90 days) + PDF/Excel buttons. */
const ReportDownloadDialog: React.FC<Props> = ({ open, title, onClose, onDownload, onPrint }) => {
  const t = useT();
  const heading = title ?? t('ui.report.title', 'Download report');
  const [mode, setMode] = useState<'current' | 'month' | 'range'>('current');
  const [month, setMonth] = useState<Dayjs>(dayjs());
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [busy, setBusy] = useState<Format | 'print' | null>(null);
  const [error, setError] = useState('');

  const resolveRange = (): { from: string; to: string } | null => {
    if (mode === 'current') {
      const now = dayjs();
      return { from: now.startOf('month').format('YYYY-MM-DD'), to: now.endOf('month').format('YYYY-MM-DD') };
    }
    if (mode === 'month') {
      if (!month) { setError(t('ui.report.selectMonth', 'Select a month.')); return null; }
      return { from: month.startOf('month').format('YYYY-MM-DD'), to: month.endOf('month').format('YYYY-MM-DD') };
    }
    if (!range || !range[0] || !range[1]) { setError(t('ui.report.selectRange', 'Select a date range.')); return null; }
    if (range[1].diff(range[0], 'day') > MAX_DAYS) { setError(t('ui.report.exceedDays', 'Range cannot exceed {n} days.').replace('{n}', String(MAX_DAYS))); return null; }
    return { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') };
  };

  const handle = async (format: Format) => {
    setError('');
    const r = resolveRange();
    if (!r) return;
    setBusy(format);
    try {
      await onDownload(format, r.from, r.to);
      onClose();
    } catch (e: any) {
      setError(e.message || t('ui.report.downloadFailed', 'Download failed'));
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    setError('');
    const r = resolveRange();
    if (!r || !onPrint) return;
    setBusy('print');
    try {
      await onPrint(r.from, r.to);
      onClose();
    } catch (e: any) {
      setError(e.message || t('ui.report.printFailed', 'Print failed'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal open={open} onCancel={onClose} title={heading} footer={null} destroyOnClose>
      <Radio.Group
        value={mode}
        onChange={(e) => { setMode(e.target.value); setError(''); }}
        style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}
      >
        <Radio value="current">{t('ui.report.currentMonth', 'Current month')}</Radio>
        <Radio value="month">{t('ui.report.particularMonth', 'Particular month')}</Radio>
        <Radio value="range">{t('ui.report.customRange', 'Custom date range (max {n} days)').replace('{n}', String(MAX_DAYS))}</Radio>
      </Radio.Group>

      {mode === 'month' && (
        <DatePicker
          picker="month"
          value={month}
          onChange={(d) => setMonth(d as Dayjs)}
          format="MMMM YYYY"
          allowClear={false}
          style={{ width: '100%' }}
          disabledDate={(c) => c && c.isAfter(dayjs(), 'month')}
        />
      )}
      {mode === 'range' && (
        <RangePicker
          value={range as any}
          onChange={(d) => setRange(d as any)}
          format="DD-MMM-YYYY"
          style={{ width: '100%' }}
          disabledDate={(c) => c && c.isAfter(dayjs(), 'day')}
        />
      )}

      {error && <Typography.Text type="danger" style={{ display: 'block', marginTop: 10 }}>{error}</Typography.Text>}

      <Space style={{ marginTop: 18, width: '100%', justifyContent: 'flex-end' }}>
        {onPrint && (
          <Button icon={<PrinterOutlined />} loading={busy === 'print'} onClick={handlePrint}>
            Print
          </Button>
        )}
        <Button icon={<FilePdfOutlined style={{ color: '#DC2626' }} />} loading={busy === 'pdf'} onClick={() => handle('pdf')}>
          Download PDF
        </Button>
        <Button type="primary" icon={<FileExcelOutlined />} loading={busy === 'excel'} onClick={() => handle('excel')}>
          Download Excel
        </Button>
      </Space>
    </Modal>
  );
};

export default ReportDownloadDialog;
