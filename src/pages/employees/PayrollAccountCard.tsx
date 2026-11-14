import React, { useState } from 'react';
import { Card, Button, Tag, Tabs, Table, DatePicker, Select, Tooltip, Popconfirm, Popover, Badge, notification } from 'antd';
import { DownloadOutlined, PrinterOutlined, MailOutlined, DeleteOutlined, CheckOutlined, FilterOutlined } from '@ant-design/icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';
import AttendanceCalendar from './AttendanceCalendar';
import { EmployeeProductionHistoryTable } from './EmployeeProductionHistoryTable';
import SettlePaymentModal from './SettlePaymentModal';
import { printPdfFromUrl } from '../../utils/printPdf';

const { RangePicker } = DatePicker;

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

// Pay-slip PDF actions: save to disk, send to printer, or share (device share sheet → WhatsApp/email).
const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};
const printBlob = (blob: Blob) => printPdfFromUrl(URL.createObjectURL(blob));
const shareBlob = async (blob: Blob, name: string) => {
  const file = new File([blob], name, { type: 'application/pdf' });
  const nav: any = navigator;
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try { await nav.share({ files: [file], title: name }); return; } catch { /* user cancelled */ }
  }
  saveBlob(blob, name); // fallback: download so it can be attached to WhatsApp/email
};

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

interface PayrollCardProps {
  employeeId: string;
  fromDate?: string;
  toDate?: string;
  productionHistory?: any[];
  activeTab?: string;
  onTabChange?: (k: string) => void;
  leaveSignal?: number; // bumped by "Record Leave" to open the apply-leave modal in the attendance tab
}

const PayrollAccountCard: React.FC<PayrollCardProps> = ({ employeeId, fromDate, toDate, productionHistory = [], activeTab, onTabChange, leaveSignal }) => {
  const t = useT();
  const [internalTab, setInternalTab] = useState<string | undefined>(undefined);
  const setTab = onTabChange ?? setInternalTab;
  const qc = useQueryClient();
  const [payTarget, setPayTarget] = useState<any | null>(null); // slip being settled

  // Salary slips are shown one calendar year at a time (current year by default).
  const [year, setYear] = useState<number>(dayjs().year());
  // Server-side paging/filtering state for transactions (1-based current for AntD).
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
    year,
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
  const refetch = () => qc.invalidateQueries({ queryKey: ['payroll', employeeId] });

  // Piece-rate pay-slips = each settlement (direct payment / advance adjustment).
  const { data: setlData } = useQuery({
    queryKey: ['payroll', employeeId, 'settlements'],
    queryFn: () => employeeService.getPayroll(employeeId, { txnType: 'SETTLEMENT', txnSize: 200 }),
    enabled: !!employeeId && !isMonthly,
    placeholderData: (prev) => prev,
  });
  const settlements = setlData?.data?.transactions ?? [];

  const removeTxn = async (id: string) => { await employeeService.deleteLedger(employeeId, id); refetch(); };

  // Fetch a pay-slip PDF then download / print / share it.
  const runSlip = async (fetch: () => Promise<Blob>, name: string, kind: 'download' | 'print' | 'send') => {
    try {
      const blob = await fetch();
      if (kind === 'download') saveBlob(blob, name);
      else if (kind === 'print') printBlob(blob);
      else await shareBlob(blob, name);
    } catch {
      notification.error({ message: t('employees.payroll.payslipFailed', 'Could not generate pay-slip'), placement: 'topRight' });
    }
  };

  const openFilter = (open: boolean) => {
    if (open) { setTmpFilter(txnFilter); setTmpRange(txnRange); }
    setFilterOpen(open);
  };
  const applyFilter = () => { setTxnFilter(tmpFilter); setTxnRange(tmpRange); setTxnPage(1); setFilterOpen(false); };
  const clearFilter = () => { setTmpFilter('ALL'); setTmpRange(null); setTxnFilter('ALL'); setTxnRange(null); setTxnPage(1); setFilterOpen(false); };

  // Transaction filter inside a popover (type + date range), applied on Apply.
  const filterContent = (
    <div style={{ width: 250, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Select value={tmpFilter} onChange={setTmpFilter} style={{ width: '100%' }} getPopupContainer={(tr) => tr.parentElement as HTMLElement}
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

  // Filter icon on the right of the tab bar — only on the Transaction History tab.
  const filterExtra = (
    <Popover content={filterContent} trigger="click" open={filterOpen} onOpenChange={openFilter} placement="bottomRight" title={t('employees.payroll.filter', 'Filter transactions')}>
      <Badge dot={filterActive}>
        <Button size="small" type="text" icon={<FilterOutlined style={{ color: filterActive ? 'var(--theme-primary)' : '#64748B' }} />} />
      </Badge>
    </Popover>
  );

  // ── Pay-slips tab ──
  // A month is ACTIVE (worked at least one day) or INACTIVE (no payslip, nothing payable).
  const isInactive = (r: any) => r.monthStatus === 'INACTIVE';
  const dash = <span style={{ color: '#94A3B8' }}>—</span>;
  const currentTagStyle: React.CSSProperties = { margin: 0, color: 'var(--theme-primary)', background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: 'none' };
  const monthStatusTag = (r: any) => isInactive(r)
    ? <Tag style={{ margin: 0, color: '#64748B', background: '#F1F5F9', border: 'none' }}>{t('employees.payroll.inactive', 'Inactive')}</Tag>
    :null;

  // Pay button for a month with a balance; paid months keep a green, disabled button in place.
  const payButton = (r: any) => r.due > 0 ? (
    <Tooltip title={r.payable ? '' : t('employees.payroll.notPayableYet', 'Payable from next month')}>
      <Button size="small" type="primary" icon={<CheckOutlined />} disabled={!r.payable} onClick={() => setPayTarget(r)}>{t('employees.payroll.markPaid', 'Pay')}</Button>
    </Tooltip>
  ) : (
    <Tooltip title={r.finalized ? t('employees.payroll.lockedTip', 'Fully paid — this month is locked') : ''}>
      <Button size="small" icon={<CheckOutlined />} disabled style={{ color: '#16A34A', borderColor: '#16A34A', background: 'color-mix(in srgb, #16A34A 10%, white)', fontWeight: 600 }}>{t('employees.payroll.paid', 'Paid')}</Button>
    </Tooltip>
  );

  const slipColumns = [
    {
      title: t('employees.payroll.month', 'Month'), dataIndex: 'monthLabel', key: 'month',
      render: (m: string, r: any) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
          {m}{monthStatusTag(r)}{r.current && <Tag style={currentTagStyle}>{t('employees.payroll.current', 'Current')}</Tag>}
        </span>
      ),
    },
    { title: t('employees.payroll.daysWorked', 'Days worked'), key: 'days', render: (_: any, r: any) => isInactive(r) ? dash : <span style={{ color: '#475569' }}>{Math.max(0, r.activeDays - (r.leaveDays || 0))}/{r.monthDays}</span> },
    // { title: t('employees.payroll.salary', 'Salary'), key: 'salary', render: (_: any, r: any) => isInactive(r) ? dash : <span style={{ color: '#475569', fontWeight: 600 }}>{inr(r.monthlySalary)}</span> },
    { title: t('employees.payroll.earned', 'Earned'), dataIndex: 'earned', key: 'earned', render: (v: number, r: any) => isInactive(r) ? dash : <span style={{ fontWeight: 700, color: '#0F172A' }}>{inr(v)}</span> },
    {
      title: t('employees.payroll.leave', 'Leave'), key: 'leave',
      render: (_: any, r: any) => r.leaveDeduction > 0
        ? <span style={{ color: '#DC2626', fontWeight: 600 }}>− {inr(r.leaveDeduction)} <span style={{ fontWeight: 400, fontSize: '0.78rem' }}>({r.leaveDays} {t('employees.payroll.days', 'days')})</span></span>
        : dash,
    },
    { title: t('employees.payroll.due', 'Due'), dataIndex: 'due', key: 'due', render: (v: number, r: any) => isInactive(r) ? dash : <span style={{ fontWeight: 700, color: v > 0 ? '#DC2626' : '#16A34A' }}>{inr(v)}</span> },
    { title: t('common.status', 'Status'), dataIndex: 'status', key: 'status', render: (s: string) => s ? <Tag color={STATUS[s]?.color}>{t(STATUS[s]?.key, STATUS[s]?.fallback)}</Tag> : dash },
    {
      title: t('common.actions', 'Actions'), key: 'action',
      render: (_: any, r: any) => isInactive(r) ? dash : (
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {(r.status || r.status === null) && payButton(r)}
          <Tooltip title={t('employees.payroll.download', 'Download')}><Button size="small" type="text" icon={<DownloadOutlined />} onClick={() => runSlip(() => employeeService.payslipByMonth(employeeId, r.period), `payslip-${r.monthLabel}.pdf`, 'download')} /></Tooltip>
          <Tooltip title={t('employees.payroll.print', 'Print')}><Button size="small" type="text" icon={<PrinterOutlined />} onClick={() => runSlip(() => employeeService.payslipByMonth(employeeId, r.period), `payslip-${r.monthLabel}.pdf`, 'print')} /></Tooltip>
          <Tooltip title={t('employees.payroll.send', 'Send')}><Button size="small" type="text" icon={<MailOutlined />} onClick={() => runSlip(() => employeeService.payslipByMonth(employeeId, r.period), `payslip-${r.monthLabel}.pdf`, 'send')} /></Tooltip>
        </div>
      ),
    },
  ];

  // Year picker on the tab bar (Salary Payslip tab): joining year → current year.
  const years: number[] = payroll?.availableYears?.length ? payroll.availableYears : [year];
  const yearExtra = (
    <Select size="small" value={year} onChange={setYear} style={{ width: 96 }}
      getPopupContainer={(tr) => tr.parentElement as HTMLElement}
      options={years.map((y: number) => ({ value: y, label: String(y) }))} />
  );

  // ── Transactions tab ──
  // Advance/Expense/Direct-Payment/Opening = money to the employee (+); settled-from-advance = (−).
  const txnMeta = (type: string) => {
    if (type === 'ADVANCE') return { label: t('employees.payroll.advance', 'Advance'), inflow: true };
    if (type === 'SPEND') return { label: t('employees.payroll.expense', 'Expense'), inflow: true };
    if (type === 'ADVANCE_ADJUSTMENT') return { label: t('employees.payroll.settlement', 'Salary settlement'), inflow: false };
    return { label: t('employees.payroll.directPay', 'Direct Salary Payment'), inflow: true };
  };
  const tagStyle: React.CSSProperties = {
    margin: 0, color: 'var(--theme-primary)',
    background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: 'none', fontWeight: 600,
  };
  const txnColumns = [
    { title: t('common.date', 'Date'), dataIndex: 'entryDate', key: 'date', render: (d: string) => <span style={{ color: '#334155', fontWeight: 600 }}>{dayjs(d).format('DD MMM YYYY')}</span> },
    { title: t('employees.payroll.type', 'Type'), key: 'type', render: (_: any, e: any) => <Tag style={tagStyle}>{txnMeta(e.type).label}</Tag> },
    {
      title: t('employees.payroll.paymentMode', 'Payment Mode'), key: 'mode',
      render: (_: any, e: any) => <span style={{ color: '#64748B' }}>{e.mode || (e.type === 'ADVANCE_ADJUSTMENT' ? t('employees.payroll.advanceAdjustedMode', 'Advance Adjusted') : '—')}</span>,
    },
    {
      title: t('common.amount', 'Amount'), key: 'amount', align: 'right' as const,
      render: (_: any, e: any) => {
        const m = txnMeta(e.type);
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: 800, color: m.inflow ? '#16A34A' : '#DC2626' }}>{m.inflow ? '+' : '−'} {inr(e.amount)}</span>
            {e.deletable && e.id && (
              <Popconfirm title={t('common.confirm', 'Confirm')} onConfirm={() => removeTxn(e.id)} okText={t('common.yes', 'Yes')} cancelText={t('common.no', 'No')}>
                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </span>
        );
      },
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
          size: 'small', showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'],
        }}
        onChange={(pg) => { setTxnPage(pg.current || 1); setTxnSize(pg.pageSize || 10); }}
      />
    </div>
  );

  // Tab order: work/slips first (per employee type), attendance second, transactions last.
  const workTab = isMonthly
    ? {
        key: 'slips', label: t('employees.payroll.salaryPayslip', 'Salary Payslip'),
        children: (
          <Table
            size="small" dataSource={slips} columns={slipColumns} rowKey="period"
            scroll={{ y: SCROLL_Y, x: 'max-content' }}
            pagination={false}
            onRow={(r: any) => ({ style: isInactive(r) ? { background: '#F8FAFC' } : undefined })}
          />
        ),
      }
    : {
        key: 'piece', label: t('employees.payroll.pieceWorkHistory', 'Piece Work History'),
        children: <EmployeeProductionHistoryTable data={productionHistory} />,
      };

  // Piece-rate Pay Slips: one slip per settlement, each downloadable / printable / shareable.
  const pieceSlipColumns = [
    { title: t('common.date', 'Date'), dataIndex: 'entryDate', key: 'date', render: (d: string) => <span style={{ color: '#334155', fontWeight: 600 }}>{dayjs(d).format('DD MMM YYYY')}</span> },
    { title: t('employees.payroll.type', 'Type'), key: 'type', render: (_: any, e: any) => <Tag style={tagStyle}>{e.type === 'ADVANCE_ADJUSTMENT' ? t('employees.payroll.settlement', 'Salary settlement') : t('employees.payroll.directPay', 'Direct Salary Payment')}</Tag> },
    { title: t('common.amount', 'Amount'), key: 'amount', align: 'right' as const, render: (_: any, e: any) => <span style={{ fontWeight: 800, color: '#0F172A' }}>{inr(e.amount)}</span> },
    {
      title: t('common.actions', 'Actions'), key: 'action', align: 'right' as const,
      render: (_: any, e: any) => {
        const name = `payslip-${dayjs(e.entryDate).format('DD-MMM-YYYY')}.pdf`;
        const fetch = () => employeeService.payslipBySettlement(employeeId, e.id);
        return (
          <div style={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Tooltip title={t('employees.payroll.download', 'Download')}><Button size="small" type="text" icon={<DownloadOutlined />} onClick={() => runSlip(fetch, name, 'download')} /></Tooltip>
            <Tooltip title={t('employees.payroll.print', 'Print')}><Button size="small" type="text" icon={<PrinterOutlined />} onClick={() => runSlip(fetch, name, 'print')} /></Tooltip>
            <Tooltip title={t('employees.payroll.send', 'Send')}><Button size="small" type="text" icon={<MailOutlined />} onClick={() => runSlip(fetch, name, 'send')} /></Tooltip>
          </div>
        );
      },
    },
  ];
  const pieceSlipsTab = {
    key: 'payslips', label: t('employees.payroll.paySlips', 'Pay Slips'),
    children: (
      <Table size="small" rowKey="id" dataSource={settlements} columns={pieceSlipColumns}
        scroll={{ y: SCROLL_Y, x: 'max-content' }}
        pagination={{ pageSize: 10, size: 'small', showSizeChanger: true, pageSizeOptions: ['10', '25', '50', '100'] }} />
    ),
  };

  const attendanceTab = { key: 'attendance', label: t('employees.attendance.title', 'Attendance'), children: <AttendanceCalendar employeeId={employeeId} focusDate={fromDate} openLeaveSignal={leaveSignal} /> };
  const txnsTab = { key: 'txns', label: t('employees.payroll.transactionHistory', 'Transaction History'), children: transactions };
  // Pay Slips sits just before Transaction History; piece-rate also gets its own pay-slips tab.
  const items = isMonthly
    ? [workTab, attendanceTab, txnsTab]
    : [workTab, attendanceTab, pieceSlipsTab, txnsTab];

  // Default to the first tab; fall back if a requested tab isn't valid for this employee type.
  const keys = items.map((i) => i.key);
  const requested = activeTab ?? internalTab;
  const tab = requested && keys.includes(requested) ? requested : keys[0];

  return (
    <Card
      className="payroll-card"
      style={cardStyle}
      styles={{ body: { padding: 16 } }}
    >
      <Tabs className="payroll-tabs" size="small" activeKey={tab} onChange={setTab} items={items}
        tabBarExtraContent={{ right: tab === 'txns' ? filterExtra : tab === 'slips' ? yearExtra : undefined }} />

      {/* One settle form (date + advance toggle + amount + note) for a payable slip */}
      <SettlePaymentModal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        employeeId={employeeId}
        title={payTarget?.monthLabel ?? ''}
        dueAmount={payTarget?.due ?? 0}
        advanceBalance={payroll?.advanceBalance ?? 0}
        period={payTarget?.period}
        onSuccess={refetch}
      />
    </Card>
  );
};

export default PayrollAccountCard;
