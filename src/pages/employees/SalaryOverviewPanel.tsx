import React, { useState } from 'react';
import { Card, Button, Progress, Modal, Form, DatePicker, InputNumber, Select, Input, notification } from 'antd';
import { WalletOutlined, CalendarOutlined, ThunderboltOutlined, BarChartOutlined } from '@ant-design/icons';
import { useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';
import SettlePaymentModal from './SettlePaymentModal';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const card: React.CSSProperties = {
  borderRadius: 12, border: '1px solid #E2E8F0', backgroundColor: '#fff',
  boxShadow: '0px 1px 3px rgba(15,23,42,0.05), 0px 10px 15px -3px rgba(15,23,42,0.05)',
};

const Line: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0' }}>
    <span style={{ color: '#64748B', fontSize: '0.88rem' }}>{label}</span>
    <span style={{ fontWeight: strong ? 800 : 700, color: strong ? '#DC2626' : '#0F172A' }}>{value}</span>
  </div>
);

interface Props {
  employeeId: string;
  payroll: any;
  isMonthly: boolean;
  onRecordLeave: () => void;
}

const SalaryOverviewPanel: React.FC<Props> = ({ employeeId, payroll, isMonthly, onRecordLeave }) => {
  const t = useT();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const salary = payroll?.monthlySalary ?? 0;
  const accrued = payroll?.currentMonthAccrued ?? 0;
  const remaining = Math.max(0, salary - accrued);
  const pct = salary > 0 ? Math.min(100, Math.round((accrued / salary) * 100)) : 0;
  const advBal = payroll?.advanceBalance ?? 0;
  // Total unsettled: completed-month dues (monthly) or outstanding piece earnings (piece), from the server.
  const pendingSettlement = payroll?.pendingSettlement ?? 0;

  // Settle flow: one form; backend spreads a lump sum across completed months (monthly).
  const [payOpen, setPayOpen] = useState(false);

  const openAdvance = () => { form.resetFields(); form.setFieldsValue({ entryDate: dayjs(), mode: 'CASH' }); setAdvanceOpen(true); };
  const submitAdvance = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await employeeService.recordLedger(employeeId, { entryDate: v.entryDate.format('YYYY-MM-DD'), type: 'ADVANCE', amount: v.amount, mode: v.mode, note: v.note });
      setAdvanceOpen(false);
      qc.invalidateQueries({ queryKey: ['payroll', employeeId] });
      notification.success({ message: t('employees.payroll.advanceSaved', 'Advance recorded'), placement: 'topRight' });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      {/* Quick Actions */}
      <Card style={card} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>
          <ThunderboltOutlined style={{ color: 'var(--theme-primary)' }} /> {t('employees.overview.quickActions', 'Quick Actions')}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="primary" icon={<WalletOutlined />} block onClick={openAdvance}>{t('employees.payroll.recordAdvance', 'Record Advance')}</Button>
          <Button icon={<CalendarOutlined />} block onClick={onRecordLeave}>{t('employees.overview.recordLeave', 'Record Leave')}</Button>
        </div>
      </Card>

      {/* Salary Overview — grows to match the left card's height (both monthly & piece-rate) */}
      <Card style={{ ...card, flex: 1 }} styles={{ body: { padding: 16 } }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
          <BarChartOutlined style={{ color: 'var(--theme-primary)' }} /> {t('employees.overview.salaryOverview', 'Salary Overview')}
        </div>
        <Line label={t('employees.overview.totalEarned', 'Total Salary Earned')} value={inr(payroll?.totalEarned ?? 0)} />
        <Line label={t('employees.overview.advanceAdjusted', 'Advance Adjusted')} value={inr(payroll?.advanceAdjusted ?? 0)} />
        <Line label={t('employees.overview.directPaid', 'Direct Salary Paid')} value={inr(payroll?.totalPaid ?? 0)} />
        <div style={{ borderTop: '1px solid #F1F5F9', margin: '8px 0' }} />
        {isMonthly ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#64748B', marginBottom: 4 }}>
              <span>{t('employees.overview.currentMonth', 'Current Month')} ({dayjs().format('MMM YYYY')})</span>
              <span><b style={{ color: 'var(--theme-primary)' }}>{inr(accrued)}</b> / {inr(salary)}</span>
            </div>
            <Progress percent={pct} showInfo={false} strokeColor="var(--theme-primary)" />
            <Line label={t('employees.overview.remainingDue', 'Remaining Due')} value={inr(remaining)} strong />
          </>
        ) : (
          <>
            <Line label={`${t('employees.overview.currentMonth', 'Current Month')} (${dayjs().format('MMM YYYY')})`} value={inr(accrued)} />
            <Line label={t('employees.overview.remainingDue', 'Remaining Due')} value={inr(pendingSettlement)} strong />
            {/* Piece-rate has no monthly slips, so it settles the outstanding total here */}
            <Button type="primary" block style={{ marginTop: 12 }} disabled={pendingSettlement <= 0} onClick={() => setPayOpen(true)}>
              {t('employees.payroll.markPaid', 'Pay')}
            </Button>
          </>
        )}
      </Card>

      {/* Record Advance */}
      <Modal open={advanceOpen} onCancel={() => setAdvanceOpen(false)} onOk={submitAdvance} confirmLoading={saving} zIndex={1300}
        title={t('employees.payroll.recordAdvance', 'Record Advance')} okText={t('common.save', 'Save')} cancelText={t('common.cancel', 'Cancel')}>
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="entryDate" label={t('common.date', 'Date')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" /></Form.Item>
          <Form.Item name="amount" label={t('common.amount', 'Amount')} rules={[{ required: true, type: 'number', min: 0.01 }]}><InputNumber style={{ width: '100%' }} min={0} prefix="₹" /></Form.Item>
          <Form.Item name="mode" label={t('employees.payroll.mode', 'Mode')}><Select options={[{ value: 'CASH', label: 'Cash' }, { value: 'UPI', label: 'UPI' }]} /></Form.Item>
          <Form.Item name="note" label={t('employees.payroll.note', 'Note')}><Input.TextArea rows={2} maxLength={200} /></Form.Item>
        </Form>
      </Modal>

      {/* Piece-rate settle (direct or from advance) — recorded as one settlement */}
      <SettlePaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        employeeId={employeeId}
        title={t('employees.payroll.markPaid', 'Pay')}
        dueAmount={pendingSettlement}
        advanceBalance={advBal}
        onSuccess={() => qc.invalidateQueries({ queryKey: ['payroll', employeeId] })}
      />
    </div>
  );
};

export default SalaryOverviewPanel;
