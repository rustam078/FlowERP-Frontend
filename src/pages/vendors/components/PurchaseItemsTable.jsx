import React from 'react';
import { Table, Tag } from 'antd';
import { getCurrencySymbol } from '../../../utils/currency';

const PurchaseItemsTable = ({ items }) => {
  const columns = [
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text) => <span style={{ fontWeight: 500, color: '#334155' }}>{text}</span>,
    },
    {
      title: 'Type',
      dataIndex: 'itemType',
      key: 'itemType',
      render: (type) => {
        let color = 'blue';
        let bg = '#e6f4ff';
        if (type === 'PRODUCT') {
          color = 'green';
          bg = '#f6ffed';
        } else if (type === 'OVERHEAD') {
          color = 'orange';
          bg = '#fff2e8';
        }
        return (
          <Tag color={color} style={{ backgroundColor: bg, border: 'none', fontWeight: 600 }}>
            {type}
          </Tag>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
      render: (qty) => (
        <span style={{ color: '#475569', fontWeight: 500 }}>
          {Number(qty || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Unit',
      dataIndex: 'unit',
      key: 'unit',
      render: (text) => <span style={{ color: '#64748B' }}>{text}</span>,
    },
    {
      title: `Rate (${getCurrencySymbol()})`,
      dataIndex: 'rate',
      key: 'rate',
      align: 'right',
      render: (rate) => (
        <span style={{ color: '#475569', fontWeight: 500 }}>
          {Number(rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: `Amount (${getCurrencySymbol()})`,
      key: 'amount',
      align: 'right',
      render: (_, record) => {
        const amount = (Number(record.quantity) || 0) * (Number(record.rate) || 0);
        return (
          <span style={{ color: '#0F172A', fontWeight: 600 }}>
            {amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );
      },
    },
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={items?.map((item, index) => ({ ...item, key: index }))} 
      pagination={false}
      rowClassName={(_, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
      size="small"
      style={{
        marginTop: 16,
        border: '1px solid #f0f0f0',
        borderRadius: 8,
        overflow: 'hidden'
      }}
    />
  );
};

export default PurchaseItemsTable;
