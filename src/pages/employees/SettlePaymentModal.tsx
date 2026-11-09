import React, { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, InputNumber, Input, Switch, notification } from 'antd';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employee.service';
import { useT } from '../../contexts/LanguageContext';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  title: string;            // e.g. the month label, or "Pay"
  dueAmount: number;        // auto-filled amount (editable)
  advanceBalance: number;
  period?: string;          // monthly slip period (YYYY-MM-DD); omit for piece-rate
  onSuccess: () => void;    // refresh callers after a successful save
}

/**
 * One settle form: date + a "Settle from Advance" toggle (shown with the advance balance),
 * amount and note. Toggle on => adjust from advance; off => direct payment.
 */
const SettlePaymentModal: React.FC<Props> = ({ open, onClose, employeeId, title, dueAmount, advanceBalance, period, onSuccess }) => {
  const t = useT();
  const [form] = Form.useForm();
  const [fromAdvance, setFromAdvance] = useState(false);
  const [saving, setSaving] = useState(false);
  const amount = Form.useWatch('amount', form) ?? 0;
  // Advance can cover this settlement only when the amount fits within the balance.
  const canUseAdvance = advanceBalance > 0 && amount > 0 && amount <= advanceBalance;
  const useAdvance = fromAdvance && canUseAdvance;

  // Reset on open; default the toggle on when the advance covers the due amount.
  useEffect(() => {
    if (open) {
      const amt = Math.round(dueAmount);
      form.setFieldsValue({ entryDate: dayjs(), amount: amt, note: undefined });
      setFromAdvance(advanceBalance > 0 && amt > 0 && amt <= advanceBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async () => {
    const v = await form.validateFields();
    setSaving(true);
    try {
      await employeeService.recordLedger(employeeId, {
        entryDate: v.entryDate.format('YYYY-MM-DD'),
        type: useAdvance ? 'ADVANCE_ADJUSTMENT' : 'PAYOUT',
        amount: v.amount,
        mode: useAdvance ? undefined : 'CASH',
        note: v.note,
        period,
      });
      onClose();
      onSuccess();
      notification.success({ message: t('employees.payroll.paymentSaved', 'Payment recorded'), placement: 'topRight' });
    } catch (err: any) {
      notification.error({ message: err?.response?.data?.message || t('employees.payroll.payFailed', 'Could not record payment'), placement: 'topRight' });
    } finally { setSaving(false); }
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={submit} confirmLoading={saving} zIndex={1300}
      title={`${t('employees.payroll.settlement', 'Salary settlement')} · ${title}`}
      okText={t('common.save', 'Save')} cancelText={t('common.cancel', 'Cancel')}>
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        {/* Date on the left, settle-from-advance toggle on the right */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <Form.Item name="entryDate" label={t('common.date', 'Date')} rules={[{ required: true }]} style={{ flex: 1 }}>
            <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
          </Form.Item>
          <Form.Item label={`${t('employees.payroll.settleFromAdvance', 'Settle from Advance')} (${inr(advanceBalance > 0 ? advanceBalance : 0)})`}>
            <Switch checked={useAdvance} disabled={!canUseAdvance} onChange={setFromAdvance} />
          </Form.Item>
        </div>
        <Form.Item name="amount" label={t('common.amount', 'Amount')} rules={[{ required: true, type: 'number', min: 0.01 }]}>
          <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
        </Form.Item>
        <Form.Item name="note" label={t('employees.payroll.note', 'Note')}>
          <Input.TextArea rows={2} maxLength={200} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SettlePaymentModal;
