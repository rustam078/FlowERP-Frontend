import React from 'react';
import { Card, Divider, Empty, Steps } from 'antd';
import { WalletOutlined, AppstoreOutlined } from '@ant-design/icons';
import HeadingInfo from '../../components/common/HeadingInfo';
import { IEmployeeSummary, ICurrentMonthProductSummary } from '../../types/employee-details.types';
import ProductLabel from '../../components/common/ProductLabel';
import { useT } from '../../contexts/LanguageContext';

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const cardStyle = {
  borderRadius: 12,
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
  height: '440px', // Locked height — the product list scrolls instead of stretching the card
  display: 'flex',
  flexDirection: 'column' as const,
};

const Stat: React.FC<{ icon: React.ReactNode; bg: string; color: string; label: string; value: React.ReactNode }> = ({
  icon, bg, color, label, value,
}) => (
  <div style={{ flex: 1, padding: '8px 10px', borderRadius: 10, background: bg, minWidth: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 24, height: 24, borderRadius: 8, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </div>
      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.05rem', fontWeight: 800, color, marginTop: 4 }}>{value}</div>
  </div>
);

interface Props {
  summary?: IEmployeeSummary;
  products?: ICurrentMonthProductSummary[];
}

export const CurrentMonthCard: React.FC<Props> = ({ summary, products = [] }) => {
  const t = useT();
  const worked = summary?.productsWorkedOn ?? 0;
  return (
    <Card
      style={cardStyle}
      title={
        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center' }}>
          {t('employees.currentMonth.title', 'Current Month')}
          <HeadingInfo text={t('employees.currentMonth.info', 'Always shows the current month — the page filter does not apply to this card.')} />
        </span>
      }
      styles={{ header: { minHeight: 40 }, body: { padding: 12, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
    >
      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Stat
          icon={<WalletOutlined style={{ color: 'var(--theme-primary)', fontSize: 15 }} />}
          bg="color-mix(in srgb, var(--theme-primary) 12%, white)"
          color="var(--theme-primary)"
          label={t('employees.earnings', 'Earnings')}
          value={inr(summary?.currentMonthEarnings ?? 0)}
        />
        <Stat
          icon={<AppstoreOutlined style={{ color: 'var(--theme-primary)', fontSize: 15 }} />}
          bg="color-mix(in srgb, var(--theme-primary) 12%, white)"
          color="var(--theme-primary)"
          label={t('employees.products', 'Products')}
          value={worked}
        />
      </div>

      <Divider style={{ margin: '10px 0 8px' }} />

      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
        {t('employees.currentMonth.productPerformance', 'Product Performance')}
      </div>

      {/* Fixed-height scroll region (hidden scrollbar) — old step-wise design */}
      <div className="hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
        {products.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={<span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>{t('employees.currentMonth.noProduction', 'No production this month')}</span>}
            />
          </div>
        ) : (
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            status="process"
            items={products.map((item) => ({
              title: <span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#0F172A' }}><ProductLabel productId={(item as any).productId} iconName={(item as any).iconName} name={item.productName} size={18} /></span>,
              description: (
                <div style={{ marginTop: 3, display: 'flex', flexDirection: 'column', gap: 3, paddingBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>{t('employees.quantityProduced', 'Quantity Produced')}:</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--theme-primary)', fontWeight: 600 }}>{item.quantity.toLocaleString('en-IN')} {t('employees.pcs', 'Pcs')}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 500 }}>{t('employees.earnings', 'Earnings')}:</span>
                    <span style={{ fontSize: '0.92rem', color: 'var(--theme-primary)', fontWeight: 800 }}>{inr(item.earnings)}</span>
                  </div>
                </div>
              ),
            }))}
          />
        )}
      </div>
    </Card>
  );
};
