import React from 'react';
import { Card } from 'antd';
import { WalletOutlined, DollarCircleOutlined, SwapOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useT } from '../../contexts/LanguageContext';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const SummaryCard: React.FC<{ icon: React.ReactNode; bg: string; label: string; value: number; sub?: string; accent?: boolean }> = ({ icon, bg, label, value, sub, accent }) => (
  <Card
    style={{ borderRadius: 10, border: '1px solid #E2E8F0', background: accent ? 'color-mix(in srgb, var(--theme-primary) 8%, white)' : '#fff', boxShadow: '0px 1px 2px rgba(15,23,42,0.04)', height: '100%' }}
    styles={{ body: { padding: '10px 12px' } }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: accent ? 'var(--theme-primary)' : '#0F172A', marginTop: 6 }}>{inr(value)}</div>
    {sub && <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
  </Card>
);

const PayrollSummaryCards: React.FC<{ payroll: any }> = ({ payroll }) => {
  const t = useT();
  const tint = 'color-mix(in srgb, var(--theme-primary) 14%, white)';
  const primary = { color: 'var(--theme-primary)', fontSize: 15 };
  // Five cards sharing a row (wrap on narrow screens); Pending Settlement sits after Total Salary Earned.
  const cell: React.CSSProperties = { flex: '1 1 150px', minWidth: 150 };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      <div style={cell}>
        <SummaryCard accent icon={<WalletOutlined style={primary} />} bg="#fff" label={t('employees.overview.advanceBalance', 'Advance Balance')} value={payroll?.advanceBalance ?? 0} />
      </div>
      <div style={cell}>
        <SummaryCard icon={<DollarCircleOutlined style={{ color: '#16A34A', fontSize: 15 }} />} bg="color-mix(in srgb, #16A34A 12%, white)" label={t('employees.overview.totalEarned', 'Total Salary Earned')} value={payroll?.totalEarned ?? 0} />
      </div>
      <div style={cell}>
        <SummaryCard icon={<ClockCircleOutlined style={{ color: '#DC2626', fontSize: 15 }} />} bg="color-mix(in srgb, #DC2626 12%, white)" label={t('employees.overview.pendingSettlement', 'Pending Settlement')} value={payroll?.pendingSettlement ?? 0} />
      </div>
      <div style={cell}>
        <SummaryCard icon={<SwapOutlined style={primary} />} bg={tint} label={t('employees.overview.settledFromAdvance', 'Settled from Advance')} value={payroll?.advanceAdjusted ?? 0} />
      </div>
      <div style={cell}>
        <SummaryCard icon={<CheckCircleOutlined style={{ color: '#D97706', fontSize: 15 }} />} bg="color-mix(in srgb, #D97706 12%, white)" label={t('employees.overview.directPaid', 'Direct Salary Paid')} value={payroll?.totalPaid ?? 0} />
      </div>
    </div>
  );
};

export default PayrollSummaryCards;
