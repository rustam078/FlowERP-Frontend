import React from 'react';
import { Card, Table } from 'antd';
import dayjs from 'dayjs';
import { IProductionHistoryItem } from '../../types/employee-details.types';
import ProductLabel from '../../components/common/ProductLabel';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeProductionHistoryTableProps {
  data: IProductionHistoryItem[];
  loading?: boolean;
}

export const EmployeeProductionHistoryTable: React.FC<EmployeeProductionHistoryTableProps> = ({
  data,
  loading,
}) => {
  const t = useT();
  // Format currency in Indian Rupees
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Dynamically build Date filters
  const dateFilters = React.useMemo(() => {
    if (!data) return [];
    const uniqueDates = Array.from(new Set(data.map((item) => item.date)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return uniqueDates.map((date) => ({
      text: dayjs(date).format('DD-MMM-YYYY'),
      value: date,
    }));
  }, [data]);

  const columns = [
    {
      title: t('common.date', 'Date'),
      dataIndex: 'date',
      key: 'date',
      width: '20%',
      render: (date: string) => (
        <span style={{ fontWeight: 500, color: '#475569' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}
        </span>
      ),
      sorter: (a: IProductionHistoryItem, b: IProductionHistoryItem) =>
        a.date.localeCompare(b.date),
      filters: dateFilters,
      onFilter: (value: any, record: IProductionHistoryItem) => record.date === value,
      filterSearch: true,
    },
    {
      title: t('employees.product', 'Product'),
      dataIndex: 'productName',
      key: 'productName',
      width: '25%',
      render: (name: string, record: IProductionHistoryItem) => (
        <ProductLabel productId={(record as any).productId} iconName={(record as any).iconName} name={name} size={22} nameStyle={{ fontWeight: 600, color: '#0F172A' }} />
      ),
    },
    {
      title: t('employees.quantity', 'Quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      render: (qty: number) => (
        <span style={{ fontWeight: 500, color: '#0F172A' }}>
          {qty.toLocaleString('en-IN')} {t('employees.pcs', 'Pcs')}
        </span>
      ),
    },
    {
      title: t('employees.rate', 'Rate'),
      dataIndex: 'rate',
      key: 'rate',
      width: '20%',
      render: (rate: number) => (
        <span style={{ fontWeight: 500, color: '#64748B' }}>
          {formatCurrency(rate)} {t('employees.perPc', '/ Pc')}
        </span>
      ),
    },
    {
      title: t('employees.earnings', 'Earnings'),
      dataIndex: 'earnings',
      key: 'earnings',
      width: '20%',
      render: (earnings: number) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
          {formatCurrency(earnings)}
        </span>
      ),
    },
  ];

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>{t('employees.productionHistory.title', 'Production History')}</span>}
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
      }}
      bodyStyle={{ padding: 0 }}
    >
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: false,
          showTotal: (total, range) => `${range[0]}-${range[1]} ${t('employees.pagination.of', 'of')} ${total} ${t('employees.pagination.records', 'records')}`,
          style: { marginRight: 24, marginBottom: 16 },
        }}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <div style={{ padding: '48px 16px', color: '#94A3B8', textAlign: 'center' }}>
              {t('employees.productionHistory.empty', 'No production records found for the selected filter range.')}
            </div>
          ),
        }}
        style={{ borderRadius: '0 0 12px 12px', overflow: 'hidden' }}
      />
    </Card>
  );
};
