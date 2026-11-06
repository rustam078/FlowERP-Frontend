import React from 'react';
import { Card, Table } from 'antd';
import { IProductSummary } from '../../types/employee-details.types';
import ProductLabel from '../../components/common/ProductLabel';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeProductTableProps {
  data: IProductSummary[];
  loading?: boolean;
}

export const EmployeeProductTable: React.FC<EmployeeProductTableProps> = ({ data, loading }) => {
  const t = useT();
  // Format currency in Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      title: t('employees.product', 'Product'),
      dataIndex: 'productName',
      key: 'productName',
      width: '40%',
      render: (name: string, record: IProductSummary) => (
        <ProductLabel productId={(record as any).productId} iconName={(record as any).iconName} name={name} size={22} nameStyle={{ fontWeight: 600, color: '#0F172A' }} />
      ),
    },
    {
      title: t('employees.quantityProduced', 'Quantity Produced'),
      dataIndex: 'quantityProduced',
      key: 'quantityProduced',
      width: '30%',
      render: (qty: number) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {qty.toLocaleString('en-IN')} {t('employees.pcs', 'Pcs')}
        </span>
      ),
    },
    {
      title: t('employees.summary.totalEarnings', 'Total Earnings'),
      dataIndex: 'totalEarnings',
      key: 'totalEarnings',
      width: '30%',
      render: (earnings: number) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
          {formatCurrency(earnings)}
        </span>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>{t('employees.productWise.title', 'Product Wise Earnings')}</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
        marginBottom: 24,
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Table
        dataSource={data}
        columns={columns}
        rowKey="productName"
        pagination={false}
        loading={loading}
        locale={{
          emptyText: (
            <div style={{ padding: '32px 16px', color: '#94A3B8', textAlign: 'center' }}>
              {t('employees.productWise.emptyShort', 'No product contributions found.')}
            </div>
          ),
        }}
        style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
      />
    </Card>
  );
};
