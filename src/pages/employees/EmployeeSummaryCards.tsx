import React from 'react';
import { Card, Divider, Row, Col } from 'antd';
import {
  InboxOutlined,
  DollarCircleOutlined,
  WalletOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { IEmployeeSummary } from '../../types/employee-details.types';
import { useT } from '../../contexts/LanguageContext';

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const cardStyle = {
  borderRadius: 12,
  boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
};

interface SummaryCardProps {
  summary: IEmployeeSummary;
}

export const PremiumSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const t = useT();
  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        width: '100%',
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <Row align="middle" style={{ textAlign: 'center' }} gutter={[16, 24]}>
        {/* Total Production Qty */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.totalProductionQty', 'Total Production Qty')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1E293B', marginTop: 4 }}>
            {summary.totalProductionQty.toLocaleString('en-IN')} {t('employees.pcs', 'Pcs')}
          </div>
        </Col>

        {/* Divider 1 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Total Earnings */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.totalEarnings', 'Total Earnings')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 4 }}>
            {formatCurrency(summary.totalEarnings)}
          </div>
        </Col>

        {/* Divider 2 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Current Month Earnings */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.currentMonthEarnings', 'Current Month Earnings')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 4 }}>
            {formatCurrency(summary.currentMonthEarnings)}
          </div>
        </Col>

        {/* Divider 3 */}
        <Col xs={0} sm={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '40px', backgroundColor: '#E2E8F0', margin: 0 }} />
        </Col>

        {/* Products Worked On */}
        <Col xs={24} sm={5}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.productsWorkedOn', 'Products Worked On')}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 4 }}>
            {summary.productsWorkedOn}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

export const OverallSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const t = useT();
  const qty = summary.totalProductionQty || 0;
  const earnings = summary.totalEarnings || 0;
  const avgPerPiece = qty > 0 ? earnings / qty : 0;

  const tiles = [
    { icon: <InboxOutlined />, color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', label: t('employees.summary.totalProduction', 'Total Production'), value: `${qty.toLocaleString('en-IN')} ${t('employees.pcs', 'Pcs')}` },
    { icon: <DollarCircleOutlined />, color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', label: t('employees.summary.totalEarnings', 'Total Earnings'), value: formatCurrency(earnings) },
    { icon: <AppstoreOutlined />, color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', label: t('employees.summary.productsWorkedOn', 'Products Worked On'), value: `${summary.productsWorkedOn}` },
    { icon: <WalletOutlined />, color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', label: t('employees.summary.avgPerPiece', 'Avg / Piece'), value: formatCurrency(avgPerPiece) },
  ];

  return (
    <Card
      style={cardStyle}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.95rem' }}>{t('employees.summary.overallTitle', 'Overall Summary')}</span>}
      styles={{ header: { minHeight: 40 }, body: { padding: 12, display: 'flex', flexGrow: 1, minHeight: 0, overflow: 'hidden' } }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, width: '100%', flexGrow: 1, minHeight: 0 }}>
        {tiles.map((t) => (
          <div
            key={t.label}
            style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 12px', borderRadius: 10, background: t.bg, minWidth: 0, minHeight: 0, overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {React.cloneElement(t.icon, { style: { fontSize: 13, color: t.color } })}
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.label}
              </span>
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: t.color, marginTop: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export const CurrentMonthSummaryCard: React.FC<SummaryCardProps> = ({ summary }) => {
  const t = useT();
  return (
    <Card
      style={cardStyle}
      title={<span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{t('employees.summary.currentMonthTitle', 'Current Month Summary')}</span>}
      bodyStyle={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        flexGrow: 1,
        gap: 16,
      }}
    >
      {/* Current Month Earnings */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <WalletOutlined style={{ fontSize: '22px', color: 'var(--theme-primary)' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.currentMonthEarnings', 'Current Month Earnings')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 2 }}>
            {formatCurrency(summary.currentMonthEarnings)}
          </div>
        </div>
      </div>

      {/* Products Worked On */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AppstoreOutlined style={{ fontSize: '22px', color: 'var(--theme-primary)' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {t('employees.summary.productsWorkedOn', 'Products Worked On')}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 2 }}>
            {summary.productsWorkedOn} {summary.productsWorkedOn === 1 ? t('employees.product', 'Product') : t('employees.products', 'Products')}
          </div>
        </div>
      </div>
    </Card>
  );
};

