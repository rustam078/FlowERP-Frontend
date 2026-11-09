// import React, { useState } from 'react';
// import { Card, Button, Tag, Modal, Form, DatePicker, InputNumber, Select, Input, Empty, notification } from 'antd';
// import { WalletOutlined } from '@ant-design/icons';
// import { useQuery, useQueryClient } from '@tanstack/react-query';
// import dayjs from 'dayjs';
// import { employeeService } from '../../services/employee.service';
// import { useT } from '../../contexts/LanguageContext';

// const inr = (v: number) =>
//   new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

// // Only two payout modes, as requested: cash or UPI (PhonePe/GPay).
// const PAYMENT_MODES = [
//   { value: 'CASH', label: 'Cash' },
//   { value: 'UPI', label: 'UPI' },
// ];

// const cardStyle: React.CSSProperties = {
//   borderRadius: 12,
//   boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
//   border: '1px solid #E2E8F0',
//   backgroundColor: '#ffffff',
// };

// const Stat: React.FC<{ label: string; value: React.ReactNode; strong?: boolean }> = ({ label, value, strong }) => (
//   <div style={{ flex: 1, minWidth: 130, padding: '10px 14px', borderRadius: 10, background: strong ? 'color-mix(in srgb, var(--theme-primary) 12%, white)' : '#F8FAFC' }}>
//     <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
//     <div style={{ fontSize: strong ? '1.3rem' : '1.05rem', fontWeight: 800, color: strong ? 'var(--theme-primary)' : '#0F172A', marginTop: 2 }}>{value}</div>
//   </div>
// );

// // One ledger line: salary earned (+, green), opening advance (orange), or a payment made (−, red).
// const typeMeta = (type: string, t: (k: string, f: string) => string) => {
//   if (type === 'EARNING_SALARY') return { color: 'green', label: t('employees.ledger.salary', 'Salary'), sign: '+' };
//   if (type === 'ADVANCE') return { color: 'orange', label: t('employees.ledger.advance', 'Advance'), sign: '−' };
//   return { color: 'red', label: t('employees.ledger.payout', 'Payment'), sign: '−' };
// };

// const EmployeeLedgerCard: React.FC<{ employeeId: string }> = ({ employeeId }) => {
//   const t = useT();
//   const qc = useQueryClient();
//   const [form] = Form.useForm();
//   const [open, setOpen] = useState(false);
//   const [saving, setSaving] = useState(false);

//   const { data } = useQuery({
//     queryKey: ['ledger', employeeId],
//     queryFn: () => employeeService.getLedger(employeeId),
//     enabled: !!employeeId,
//   });
//   const ledger = data?.data;
//   const entries = ledger?.entries ?? [];
//   const net = ledger?.netPayable ?? 0;
//   const refetch = () => qc.invalidateQueries({ queryKey: ['ledger', employeeId] });

//   // Record Payment: amount pre-fills with the outstanding due, so the user just picks the mode.
//   const openModal = () => {
//     form.resetFields();
//     form.setFieldsValue({ entryDate: dayjs(), mode: 'CASH', amount: net > 0 ? Math.round(net) : undefined });
//     setOpen(true);
//   };

//   const submit = async () => {
//     const v = await form.validateFields();
//     setSaving(true);
//     try {
//       await employeeService.recordLedger(employeeId, {
//         entryDate: v.entryDate.format('YYYY-MM-DD'), type: 'PAYOUT',
//         amount: v.amount, mode: v.mode, note: v.note,
//       });
//       setOpen(false);
//       refetch();
//       notification.success({ message: t('employees.ledger.saved', 'Payment recorded'), placement: 'topRight' });
//     } finally {
//       setSaving(false);
//     }
//   };

//   // Negative net payable means the employee has been paid ahead (an outstanding advance).
//   const netLabel = net < 0 ? t('employees.ledger.paidAhead', 'Advance (paid ahead)') : t('employees.ledger.netPayable', 'Net Payable');

//   return (
//     <Card
//       style={cardStyle}
//       styles={{ body: { padding: 20 } }}
//       title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t('employees.ledger.title', 'Payroll Account')}</span>}
//       extra={<Button type="primary" icon={<WalletOutlined />} onClick={openModal}>{t('employees.ledger.recordPayment', 'Record Payment')}</Button>}
//     >
//       {/* Summary tiles */}
//       <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
//         <Stat label={t('employees.ledger.earned', 'Earned')} value={inr(ledger?.totalEarned ?? 0)} />
//         <Stat label={t('employees.ledger.advance', 'Advance')} value={inr(ledger?.totalAdvance ?? 0)} />
//         <Stat label={t('employees.ledger.paidOut', 'Paid Out')} value={inr(ledger?.totalPayout ?? 0)} />
//         <Stat label={netLabel} value={inr(Math.abs(net))} strong />
//       </div>

//       {/* Transactions, latest on top — immutable (no delete) */}
//       {entries.length === 0 ? (
//         <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: '#94A3B8' }}>{t('employees.ledger.noEntries', 'No transactions yet')}</span>} />
//       ) : (
//         <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 320, overflowY: 'auto' }}>
//           {entries.map((e: any) => {
//             const meta = typeMeta(e.type, t);
//             return (
//               <div key={e.id || `${e.type}-${e.entryDate}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px', borderBottom: '1px solid #F1F5F9' }}>
//                 <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                   <Tag color={meta.color} style={{ margin: 0 }}>{meta.label}</Tag>
//                   <span style={{ color: '#334155', fontWeight: 600 }}>{dayjs(e.entryDate).format('DD MMM YYYY')}</span>
//                   {e.mode && <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>· {e.mode}</span>}
//                   {e.note && <span style={{ color: '#64748B', fontSize: '0.82rem' }}>· {e.note}</span>}
//                 </span>
//                 <span style={{ fontWeight: 800, color: meta.sign === '+' ? '#16A34A' : '#DC2626' }}>{meta.sign} {inr(e.amount)}</span>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <Modal open={open} onCancel={() => setOpen(false)} onOk={submit} confirmLoading={saving} zIndex={1300}
//         title={t('employees.ledger.recordPayment', 'Record Payment')}
//         okText={t('common.save', 'Save')} cancelText={t('common.cancel', 'Cancel')}
//       >
//         <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
//           <Form.Item name="entryDate" label={t('common.date', 'Date')} rules={[{ required: true }]}>
//             <DatePicker style={{ width: '100%' }} format="DD-MMM-YYYY" />
//           </Form.Item>
//           <Form.Item name="amount" label={t('common.amount', 'Amount')} rules={[{ required: true, type: 'number', min: 0.01 }]}>
//             <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
//           </Form.Item>
//           <Form.Item name="mode" label={t('employees.ledger.mode', 'Mode')}>
//             <Select options={PAYMENT_MODES} />
//           </Form.Item>
//           <Form.Item name="note" label={t('employees.ledger.note', 'Note')}>
//             <Input.TextArea rows={2} maxLength={200} placeholder={t('employees.ledger.notePlaceholder', 'Optional note')} />
//           </Form.Item>
//         </Form>
//       </Modal>
//     </Card>
//   );
// };

// export default EmployeeLedgerCard;
