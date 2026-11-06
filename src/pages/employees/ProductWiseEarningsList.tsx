import React from 'react';
import { Card } from 'antd';
import { IProductSummary } from '../../types/employee-details.types';
import ProductLabel from '../../components/common/ProductLabel';
import { useT } from '../../contexts/LanguageContext';

interface ProductWiseEarningsListProps {
  data: IProductSummary[];
}

export const ProductWiseEarningsList: React.FC<ProductWiseEarningsListProps> = ({ data = [] }) => {
  const t = useT();
  // Format currency helper
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem' }}>{t('employees.productWise.title', 'Product Wise Earnings')}</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        backgroundColor: '#ffffff',
        height: '480px', // Locked height to prevent row shifting
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyStyle={{ padding: '14px', flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div className="hide-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flexGrow: 1 }}>
        {data.length === 0 ? (
          <div style={{ padding: '32px 16px', color: '#94A3B8', textAlign: 'center', fontWeight: 500 }}>
            {t('employees.productWise.empty', 'No product contributions found for the selected period.')}
          </div>
        ) : (
          data.map((item, idx) => (
            <div
              key={item.productName || idx}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #F1F5F9',
                backgroundColor: '#FAFAFA',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                boxShadow: '0px 1px 2px rgba(15, 23, 42, 0.02)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#CBD5E1';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0px 4px 6px -1px rgba(15, 23, 42, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#F1F5F9';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0px 1px 2px rgba(15, 23, 42, 0.02)';
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                  <ProductLabel productId={(item as any).productId} iconName={(item as any).iconName} name={item.productName} size={20} />
                </div>
                <div style={{ fontSize: '0.76rem', color: '#64748B', marginTop: 2, fontWeight: 500 }}>
                  {item.quantityProduced.toLocaleString('en-IN')} {t('employees.pcs', 'Pcs')}
                </div>
              </div>
              <div style={{ fontWeight: 800, color: 'var(--theme-primary)', fontSize: '1rem' }}>
                {formatCurrency(item.totalEarnings)}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
