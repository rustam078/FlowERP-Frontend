import React, { useMemo, useState } from 'react';
import { Drawer, Button, DatePicker, Select, Input, InputNumber, Checkbox, Empty, notification, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { employeeService } from '../../services/employee.service';
import { IEmployee } from '../../types/employee.types';
import { useT } from '../../contexts/LanguageContext';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const PAYMENT_MODES = [
  { value: 'CASH', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  employees: IEmployee[];
  onSuccess: () => void;
}

/** Give an advance to several employees in one go (shared date/mode, per-employee amount). */
const BulkAdvanceDrawer: React.FC<Props> = ({ open, onClose, employees, onSuccess }) => {
  const t = useT();
  const [date, setDate] = useState(dayjs());
  const [mode, setMode] = useState('CASH');
  const [note, setNote] = useState('');
  const [search, setSearch] = useState('');
  const [amounts, setAmounts] = useState<Record<string, number | null>>({});
  const [saving, setSaving] = useState(false);

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.active).filter((e) => {
      const q = search.toLowerCase().trim();
      return !q || e.fullName.toLowerCase().includes(q) || e.employeeCode.toLowerCase().includes(q);
    }),
    [employees, search],
  );

  const selectedCount = Object.values(amounts).filter((a) => a && a > 0).length;

  const reset = () => { setAmounts({}); setNote(''); setSearch(''); setDate(dayjs()); setMode('CASH'); };

  const doSave = async (items: { employeeId: string; amount: number }[]) => {
    setSaving(true);
    try {
      await employeeService.bulkAdvance({ entryDate: date.format('YYYY-MM-DD'), mode, note, items });
      notification.success({ message: `${items.length} ${t('employees.expense.done', 'expenses recorded')}`, placement: 'topRight' });
      reset(); onSuccess(); onClose();
    } finally { setSaving(false); }
  };

  // Confirm the full list of expenses before saving.
  const submit = () => {
    const items = Object.entries(amounts)
      .filter(([, amt]) => amt && amt > 0)
      .map(([employeeId, amount]) => ({ employeeId, amount: amount as number }));
    if (items.length === 0) {
      notification.warning({ message: t('employees.bulkAdv.pickOne', 'Enter an amount for at least one employee'), placement: 'topRight' });
      return;
    }
    const nameOf = (id: string) => employees.find((e) => e.id === id)?.fullName || id;
    Modal.confirm({
      title: t('employees.expense.confirmTitle', 'Confirm expenses'),
      zIndex: 1400,
      okText: t('employees.expense.give', 'Add Expense'),
      cancelText: t('common.cancel', 'Cancel'),
      content: (
        <div style={{ marginTop: 8 }}>
          {items.map((it) => (
            <div key={it.employeeId} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span style={{ color: '#334155' }}>{nameOf(it.employeeId)}</span><b>{inr(it.amount)}</b>
            </div>
          ))}
        </div>
      ),
      onOk: () => doSave(items),
    });
  };

  return (
    <Drawer
      open={open} onClose={onClose} placement="right" width={460} zIndex={1300}
      title={t('employees.expense.title', 'Add Expense')}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#64748B', fontSize: '0.85rem' }}>{selectedCount} {t('employees.bulkAdv.selected', 'selected')}</span>
          <span style={{ display: 'flex', gap: 8 }}>
            <Button onClick={onClose}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="primary" loading={saving} disabled={selectedCount === 0} onClick={submit}>{t('employees.expense.give', 'Add Expense')}</Button>
          </span>
        </div>
      }
    >
      {/* Shared fields */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
        <DatePicker value={date} onChange={(d) => d && setDate(d)} format="DD-MMM-YYYY" allowClear={false} style={{ flex: 1 }} />
        <Select value={mode} onChange={setMode} options={PAYMENT_MODES} style={{ width: 120 }} />
      </div>
      <Input placeholder={t('employees.searchPlaceholder', 'Search by name or code')} prefix={<SearchOutlined style={{ color: '#94A3B8' }} />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ marginBottom: 12 }} />

      {/* Employee rows */}
      {activeEmployees.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('employees.bulkAdv.none', 'No active employees')} />
      ) : activeEmployees.map((e) => {
        const amt = amounts[e.id];
        return (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 2px', borderBottom: '1px solid #F1F5F9' }}>
            <Checkbox checked={!!amt && amt > 0} onChange={(ev) => setAmounts((p) => ({ ...p, [e.id]: ev.target.checked ? (p[e.id] || null) : null }))} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.fullName}</div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>{e.employeeCode} · {t('employees.bulkAdv.thisMonth', 'This month')}: {inr(e.currentMonthEarning ?? 0)}</div>
            </div>
            <InputNumber
              placeholder="₹" min={0} value={amt ?? undefined}
              onChange={(v) => setAmounts((p) => ({ ...p, [e.id]: v as number }))}
              style={{ width: 110 }}
            />
          </div>
        );
      })}
    </Drawer>
  );
};

export default BulkAdvanceDrawer;
