import React, { useState } from 'react';
import { Card, Button, Tag, Tabs, Table, Modal, Form, DatePicker, InputNumber, Select, Input, Tooltip, Popconfirm, Popover, Badge, notification } from 'antd';
import { PlusOutlined, DownloadOutlined, PrinterOutlined, MailOutlined, DeleteOutlined, CheckOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';

const { RangePicker } = DatePicker;

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
];

const cardStyle: React.CSSProperties = {
  borderRadius: 12,
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
  height: '100%',
};

const STATUS: Record<string, { color: string; key: string; fallback: string }> = {
  PAID: { color: 'success', key: 'employees.payroll.paid', fallback: 'Paid' },
  PARTIAL: { color: 'warning', key: 'employees.payroll.partial', fallback: 'Partial' },
  UNPAID: { color: 'error', key: 'employees.payroll.unpaid', fallback: 'Unpaid' },
};

const SCROLL_Y = 300;

const PayrollAccountCard: React.FC<{ employeeId: string; fromDate?: string; toDate?: string }> = ({ employeeId, fromDate, toDate }) => {
  const t = useT();
  const qc = useQueryClient();
  const [advanceForm] = Form.useForm();
  const [payForm] = Form.useForm();
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [paySlip, setPaySlip] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  // Server-side paging/filtering state (1-based current for AntD).
  const [slipPage, setSlipPage] = useState(1);
  const [slipSize, setSlipSize] = useState(10);
  const [txnPage, setTxnPage] = useState(1);
  const [txnSize, setTxnSize] = useState(10);
  const [txnFilter, setTxnFilter] = useState<'ALL' | 'ADVANCE' | 'SPEND' | 'SETTLEMENT'>('ALL');
  const [txnRange, setTxnRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  // Temp values inside the filter popover (applied on "Apply").
  const [filterOpen, setFilterOpen] = useState(false);
  const [tmpFilter, setTmpFilter] = useState<'ALL' | 'ADVANCE' | 'SPEND' | 'SETTLEMENT'>('ALL');
  const [tmpRange, setTmpRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const filterActive = txnFilter !== 'ALL' || !!txnRange;

  // The card's own popover range takes precedence; otherwise the page's global filter applies.
  const params = {
    slipPage: slipPage - 1, slipSize,
    txnPage: txnPage - 1, txnSize,
    txnType: txnFilter === 'ALL' ? undefined : txnFilter,
    txnFrom: txnRange?.[0] ? txnRange[0].format('YYYY-MM-DD') : fromDate,
    txnTo: txnRange?.[1] ? txnRange[1].format('YYYY-MM-DD') : toDate,
  };

  const { data } = useQuery({
    queryKey: ['payroll', employeeId, params],
    queryFn: () => employeeService.getPayroll(employeeId, params),
    enabled: !!employeeId,
    placeholderData: (prev) => prev,
  });
  const payroll = data?.data;
  const isMonthly = payroll?.paymentType === 'MONTHLY';
  const slips = payroll?.slips ?? [];
  const txns = payroll?.transactions ?? [];
  const pending = payroll?.pending ?? 0;
  const refetch = () => qc.invalidateQueries({ queryKey: ['payroll', employeeId] });

  const openAdvance = () => {
    advanceForm.resetFields();
    advanceForm.setFieldsValue({ entryDate: dayjs(), mode: 'CASH' });
    setAdvanceOpen(true);
  };
  const openPay = (slip: any) => {
    payForm.resetFields();
    payForm.setFieldsValue({ entryDate: dayjs(), mode: 'CASH', amount: Math.round(slip.due) });
    setPaySlip(slip);
  };

  const submitAdvance = async () => {
    const v = await advanceForm.validateFields();
    setSaving(true);
    try {
      await employeeService.recordLedger(employeeId, { entryDate: v.entryDate.format('YYYY-MM-DD'), type: 'ADVANCE', amount: v.amount, mode: v.mode, note: v.note });
      setAdvanceOpen(false); refetch();
      notification.success({ message: t('employees.payroll.advanceSaved', 'Advance recorded'), placement: 'topRight' });
    } finally { setSaving(false); }
  };
  const submitPay = async () => {
    const v = await payForm.validateFields();
    setSaving(true);
    try {
      await employeeService.recordLedger(employeeId, { entryDate: v.entryDate.format('YYYY-MM-DD'), type: 'PAYOUT', amount: v.amount, mode: v.mode, note: v.note, period: paySlip.period });
      setPaySlip(null); refetch();
      notification.success({ message: t('employees.payroll.paymentSaved', 'Payment recorded'), placement: 'topRight' });
    } finally { setSaving(false); }
  };
  const removeTxn = async (id: string) => { await employeeService.deleteLedger(employeeId, id); refetch(); };
  const soon = () => notification.info({ message: t('employees.payroll.comingSoon', 'Coming soon'), placement: 'topRight' });

  const openFilter = (open: boolean) => {
    if (open) { setTmpFilter(txnFilter); setTmpRange(txnRange); }
    setFilterOpen(open);
  };
  const applyFilter = () => { setTxnFilter(tmpFilter); setTxnRange(tmpRange); setTxnPage(1); setFilterOpen(false); };
  const clearFilter = () => { setTmpFilter('ALL'); setTmpRange(null); setTxnFilter('ALL'); setTxnRange(null); setTxnPage(1); setFilterOpen(false); };

  // Transaction filter inside a popover (type + date range), applied on Apply.
  const filterContent = (
    <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Select value={tmpFilter} onChange={setTmpFilter} style={{ width: '100%' }}
        options={[
          { value: 'ALL', label: t('common.all', 'All') },
          { value: 'ADVANCE', label: t('employees.payroll.advance', 'Advance') },
          { value: 'SPEND', label: t('employees.payroll.expense', 'Expense') },
          { value: 'SETTLEMENT', label: t('employees.payroll.settlement', 'Salary settlement') },
        ]}
      />
      <RangePicker value={tmpRange as any} onChange={(v) => setTmpRange(v as any)} format="DD-MMM-YYYY" allowClear style={{ width: '100%' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button size="small" onClick={clearFilter}>{t('common.reset', 'Reset')}</Button>
        <Button size="small" type="primary" onClick={applyFilter}>{t('common.apply', 'Apply')}</Button>
      </div>
    </div>
  );

  // Advance balance + pending + filter icon on the right of the tab bar.
  const tabExtra = (
    <span style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: '0.8rem' }}>
      <span><span style={{ color: '#64748B' }}>{t('employees.payroll.advance', 'Advance')}: </span><b style={{ color: '#0F172A' }}>{inr(payroll?.advanceBalance ?? 0)}</b></span>
      <span><span style={{ color: '#64748B' }}>{t('employees.payroll.pending', 'Pending')}: </span><b style={{ color: pending > 0 ? '#DC2626' : '#16A34A' }}>{inr(pending > 0 ? pending : 0)}</b></span>
      <Popover content={filterContent} trigger="click" open={filterOpen} onOpenChange={openFilter} placement="bottomRight" title={t('employees.payroll.filter', 'Filter transactions')}>
        <Badge dot={filterActive}>
          <Button size="small" type="text" icon={<FilterOutlined style={{ color: filterActive ? 'var(--theme-primary)' : '#64748B' }} />} />
        </Badge>
      </Popover>
    </span>
  );

  // ── Pay-slips tab ──
  const slipColumns = [
    {
      title: t('employees.payroll.month', 'Month'), dataIndex: 'monthLabel', key: 'month',
      render: (m: string, r: any) => (
        <span style={{ fontWeight: 700, color: '#0F172A' }}>{m}{r.current && <Tag style={{ marginLeft: 6, color: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: 'none' }}>{t('employees.payroll.current', 'Current')}</Tag>}</span>
      ),
    },
    { title: t('employees.payroll.salary', 'Salary'), key: 'salary', render: () => <span style={{ color: '#475569', fontWeight: 600 }}>{inr(payroll?.monthlySalary ?? 0)}</span> },
    { title: t('employees.payroll.earned', 'Earned'), dataIndex: 'earned', key: 'earned', render: (v: number) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{inr(v)}</span> },
    {
      title: t('employees.payroll.leave', 'Leave'), key: 'leave',
      render: (_: any, r: any) => r.leaveDeduction > 0
        ? <span style={{ color: '#DC2626', fontWeight: 600 }}>− {inr(r.leaveDeduction)} <span style={{ fontWeight: 400, fontSize: '0.78rem' }}>({r.leaveDays} {t('employees.payroll.days', 'days')})</span></span>
        : <span style={{ color: '#94A3B8' }}>–</span>,
    },
    { title: t('employees.payroll.due', 'Due'), dataIndex: 'due', key: 'due', render: (v: number) => <span style={{ fontWeight: 700, color: v > 0 ? '#DC2626' : '#16A34A' }}>{inr(v)}</span> },
    { title: t('common.status', 'Status'), dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={STATUS[s]?.color}>{t(STATUS[s]?.key, STATUS[s]?.fallback)}</Tag> },
    {
      title: t('common.actions', 'Actions'), key: 'action',
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {r.due > 0 && <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openPay(r)}>{t('employees.payroll.markPaid', 'Pay')}</Button>}
          <Tooltip title={t('employees.payroll.download', 'Download')}><Button size="small" type="text" icon={<DownloadOutlined />} onClick={soon} /></Tooltip>
          <Tooltip title={t('employees.payroll.print', 'Print')}><Button size="small" type="text" icon={<PrinterOutlined />} onClick={soon} /></Tooltip>
          <Tooltip title={t('employees.payroll.email', 'Email')}><Button size="small" type="text" icon={<MailOutlined />} onClick={soon} /></Tooltip>
        </div>
      ),
    },
  ];

  // ── Transactions tab ──
  const txnMeta = (type: string) => {
    if (type === 'ADVANCE') return { label: t('employees.payroll.advance', 'Advance'), inflow: true };
    if (type === 'SPEND') return { label: t('employees.payroll.expense', 'Expense'), inflow: true };
    if (type === 'ADVANCE_ADJUSTMENT') return { label: t('employees.payroll.settlement', 'Salary settlement'), inflow: false };
    return { label: t('employees.payroll.payment', 'Payment'), inflow: false };
  };
  const tagStyle: React.CSSProperties = {
    margin: 0, color: 'var(--theme-primary)',
    background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: 'none', fontWeight: 600,
  };
  const txnColumns = [
    {
      title: t('employees.payroll.transactions', 'Transaction'), key: 'info',
      render: (_: any, e: any) => {
        const m = txnMeta(e.type);
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Tag style={tagStyle}>{m.label}</Tag>
            <span style={{ color: '#334155', fontWeight: 600 }}>{dayjs(e.entryDate).format('DD MMM YYYY')}</span>
            {e.mode && <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>· {e.mode}</span>}
            {e.note && <span style={{ color: '#64748B', fontSize: '0.78rem' }}>· {e.note}</span>}
          </span>
        );
      },
    },
    {
      title: t('common.amount', 'Amount'), key: 'amount', align: 'right' as const,
      render: (_: any, e: any) => {
        const m = txnMeta(e.type);
        return <span style={{ fontWeight: 800, color: m.inflow ? '#16A34A' : '#334155' }}>{m.inflow ? '+' : '−'} {inr(e.amount)}</span>;
      },
    },
    {
      title: '', key: 'act', width: 40,
      render: (_: any, e: any) => (e.deletable && e.id ? (
        <Popconfirm title={t('common.confirm', 'Confirm')} onConfirm={() => removeTxn(e.id)} okText={t('common.yes', 'Yes')} cancelText={t('common.no', 'No')}>
          <Button size="small" type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ) : null),
    },
  ];

  const transactions = (
    <div>
      <Table
        size="small" dataSource={txns} columns={txnColumns}
        rowKey={(e: any, i?: number) => e.id || `${e.type}-${e.entryDate}-${i}`}
        scroll={{ y: SCROLL_Y, x: 'max-content' }}
        pagination={{
          current: txnPage, pageSize: txnSize, total: payroll?.txnTotal ?? 0,
          size: 'small', showSizeChanger: true, pageSizeOptions: ['5', '10', '20'],
        }}
        onChange={(pg) => { setTxnPage(pg.current || 1); setTxnSize(pg.pageSize || 5); }}
      />
    </div>
  );

  const items = [
    ...(isMonthly ? [{
      key: 'slips', label: t('employees.payroll.slips', 'Pay-slips'),
      children: (
        <Table
          size="small" dataSource={slips} columns={slipColumns} rowKey="period"
          scroll={{ y: SCROLL_Y, x: 'max-content' }}
          pagination={{
            current: slipPage, pageSize: slipSize, total: payroll?.slipTotal ?? 0,
            size: 'small', showSizeChanger: true, pageSizeOptions: ['10', '20', '50'],
          }}
          onChange={(pg) => { setSlipPage(pg.current || 1); setSlipSize(pg.pageSize || 10); }}
        />
      ),
    }] : []),
    { key: 'txns', label: t('employees.payroll.transactions', 'Transactions'), children: transactions },
  ];

  return (
    <Card
      style={cardStyle}
      styles={{ body: { padding: 16 } }}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t('employees.payroll.title', 'Payroll Account')}</span>}
      extra={<Button icon={<PlusOutlined />} onClick={openAdvance}>{t('employees.payroll.recordAdvance', 'Record Advance')}</Button>}
    >
      <Tabs size="small" items={items} tabBarExtraContent={{ right: tabExtra }} />

      {/* Record Advance */}
      <Modal open={advanceOpen} onCancel={() => setAdvanceOpen(false)} onOk={submitAdvance} confirmLoading={saving} zIndex={1300}
        title={t('employees.payroll.recordAdvance', 'Record Advance')} okText={t('common.save', 'Save')} cancelText={t('common.cancel', 'Cancel')}>
        <Form form={advanceForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="entryDate" label={t('common.date', 'Date')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" /></Form.Item>
          <Form.Item name="amount" label={t('common.amount', 'Amount')} rules={[{ required: true, type: 'number', min: 0.01 }]}><InputNumber style={{ width: '100%' }} min={0} prefix="₹" /></Form.Item>
          <Form.Item name="mode" label={t('employees.payroll.mode', 'Mode')}><Select options={PAYMENT_MODES} /></Form.Item>
          <Form.Item name="note" label={t('employees.payroll.note', 'Note')}><Input.TextArea rows={2} maxLength={200} /></Form.Item>
        </Form>
      </Modal>

      {/* Mark Paid (per slip) */}
      <Modal open={!!paySlip} onCancel={() => setPaySlip(null)} onOk={submitPay} confirmLoading={saving} zIndex={1300}
        title={`${t('employees.payroll.markPaidFor', 'Pay')} · ${paySlip?.monthLabel ?? ''}`} okText={t('common.save', 'Save')} cancelText={t('common.cancel', 'Cancel')}>
        <Form form={payForm} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="entryDate" label={t('common.date', 'Date')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" /></Form.Item>
          <Form.Item name="amount" label={t('common.amount', 'Amount')} rules={[{ required: true, type: 'number', min: 0.01 }]}><InputNumber style={{ width: '100%' }} min={0} prefix="₹" /></Form.Item>
          <Form.Item name="mode" label={t('employees.payroll.mode', 'Mode')}><Select options={PAYMENT_MODES} /></Form.Item>
          <Form.Item name="note" label={t('employees.payroll.note', 'Note')}><Input.TextArea rows={2} maxLength={200} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PayrollAccountCard;
