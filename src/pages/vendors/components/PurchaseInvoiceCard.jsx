import React, { useState } from 'react';
import { Card, Tag, Space, Typography, Collapse } from 'antd';
import { 
  FileTextOutlined, 
  CalendarOutlined,
  DownOutlined,
  UpOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import PurchaseItemsTable from './PurchaseItemsTable';
import { getCurrencySymbol } from '../../../utils/currency';

const { Panel } = Collapse;
const { Text } = Typography;

const PAY_META = {
  PAID: { color: 'green', bg: '#f6ffed', label: 'Paid' },
  PARTIALLY_PAID: { color: 'orange', bg: '#fff7e6', label: 'Partial' },
  PENDING: { color: 'red', bg: '#fff1f0', label: 'Pending' },
};

const PurchaseInvoiceCard = ({ invoice }) => {
  const { invoiceNumber, investmentType, purchaseDate, grandTotal, items, paymentStatus, amountPaid, amountDue } = invoice;
  const [expanded, setExpanded] = useState(false);
  const pm = PAY_META[paymentStatus] || PAY_META.PENDING;
  const inr = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN')}`;

  let typeColor = 'default';
  let typeBg = '#f5f5f5';
  
  if (investmentType === 'PURCHASE') {
    typeColor = 'blue';
    typeBg = '#e6f4ff';
  } else if (investmentType === 'OVERHEAD') {
    typeColor = 'orange';
    typeBg = '#fff2e8';
  }

  const formattedDate = purchaseDate ? dayjs(purchaseDate).format('DD MMM YYYY') : 'N/A';

  const header = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileTextOutlined style={{ color: 'var(--theme-primary)', fontSize: '1.2rem' }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>
            {invoiceNumber || 'N/A'}
          </div>
          <Space size={6}>
            <Tag color={typeColor} style={{ backgroundColor: typeBg, border: 'none', fontWeight: 600 }}>
              {investmentType}
            </Tag>
            <Tag color={pm.color} style={{ backgroundColor: pm.bg, border: 'none', fontWeight: 700 }}>
              {pm.label}
            </Tag>
          </Space>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 48, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#94A3B8' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
              {formattedDate}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
              Purchase Date
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', paddingRight: 16 }}>
          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: 2 }}>
            Grand Total
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
            {getCurrencySymbol()}{Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 2 }}>
            Paid <span style={{ color: 'var(--theme-primary)', fontWeight: 700 }}>{inr(amountPaid)}</span>
            {' · '}Due <span style={{ color: (Number(amountDue) || 0) > 0 ? '#DC2626' : '#94A3B8', fontWeight: 700 }}>{inr(amountDue)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card 
      style={{ 
        borderRadius: 12, 
        border: '1px solid #F1F5F9', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
        marginBottom: 16 
      }} 
      bodyStyle={{ padding: 0 }}
    >
      <Collapse 
        ghost 
        expandIconPosition="end"
        onChange={(keys) => setExpanded(keys.length > 0)}
        expandIcon={({ isActive }) => isActive ? <UpOutlined /> : <DownOutlined />}
      >
        <Panel 
          header={header} 
          key="1" 
          style={{ padding: '16px 20px', borderBottom: 'none' }}
        >
          <PurchaseItemsTable items={items} />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingRight: 16 }}>
            <Space size="large" align="center">
              <Text style={{ color: 'var(--theme-primary)', fontWeight: 700 }}>Total</Text>
              <Text style={{ color: 'var(--theme-primary)', fontWeight: 800, fontSize: '1.1rem' }}>
                {getCurrencySymbol()}{Number(grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Space>
          </div>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default PurchaseInvoiceCard;
