import React from 'react';
import { Card } from 'antd';
import {
  ShoppingCartOutlined,
  FileTextOutlined,
  CalendarOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCurrencySymbol } from '../../../utils/currency';

const Stat = ({ title, value, icon, iconBg, iconColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 180px', minWidth: 160 }}>
    <div
      style={{
        width: 38, height: 38, borderRadius: 10, backgroundColor: iconBg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}
    >
      {React.cloneElement(icon, { style: { color: iconColor, fontSize: '1.15rem' } })}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>{title}</div>
      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>{value}</div>
    </div>
  </div>
);

const VendorSummaryCards = ({ summary }) => {
  const { totalInvoices = 0, totalPurchaseAmount = 0, lastPurchaseDate } = summary || {};
  const avgInvoice = totalInvoices > 0 ? totalPurchaseAmount / totalInvoices : 0;
  const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN')}`;
  const formattedLastPurchase = lastPurchaseDate ? dayjs(lastPurchaseDate).format('DD MMM YYYY') : 'No Purchases';

  return (
    <Card style={{ borderRadius: 12, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '14px 20px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <Stat title="Total Purchase" value={inr(totalPurchaseAmount)} icon={<ShoppingCartOutlined />} iconBg="color-mix(in srgb, var(--theme-primary) 12%, white)" iconColor="var(--theme-primary)" />
        <Stat title="Total Invoices" value={totalInvoices} icon={<FileTextOutlined />} iconBg="color-mix(in srgb, var(--theme-primary) 12%, white)" iconColor="var(--theme-primary)" />
        <Stat title="Last Purchase" value={formattedLastPurchase} icon={<CalendarOutlined />} iconBg="color-mix(in srgb, var(--theme-primary) 12%, white)" iconColor="var(--theme-primary)" />
        <Stat title="Average Invoice" value={inr(avgInvoice)} icon={<LineChartOutlined />} iconBg="color-mix(in srgb, var(--theme-primary) 12%, white)" iconColor="var(--theme-primary)" />
      </div>
    </Card>
  );
};

export default VendorSummaryCards;
