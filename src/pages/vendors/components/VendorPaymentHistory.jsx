import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Collapse, Pagination, Skeleton, Tag, Typography } from 'antd';
import { WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { investmentService } from '../../../services/investmentService';
import { getCurrencySymbol } from '../../../utils/currency';

const { Text } = Typography;
const PAGE_SIZE = 8;

const money = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN')}`;

// Collapsed row header: date, mode, invoice count and the paid total.
const PaymentHeader = ({ group }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 700, color: '#0F172A' }}>
        {group.paymentDate ? dayjs(group.paymentDate).format('DD MMM YYYY') : '—'}
      </span>
      <Tag style={{ borderRadius: 6 }}>{group.mode}</Tag>
      {group.allocations?.length > 1 && (
        <Tag color="blue" style={{ borderRadius: 6 }}>{group.allocations.length} invoices</Tag>
      )}
    </span>
    <span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{money(group.totalAmount)}</span>
  </div>
);

// Expanded body: how this payment was split across invoices.
const Allocations = ({ group }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    {(group.allocations || []).map((a, i) => (
      <div
        key={i}
        style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '5px 10px', background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: 8 }}
      >
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#334155' }}>{a.invoiceNumber || '—'}</span>
        <span style={{ fontWeight: 700, color: '#0F172A' }}>{money(a.amount)}</span>
      </div>
    ))}
  </div>
);

const EmptyState = () => (
  <div style={{ border: '1px dashed #CBD5E1', borderRadius: 12, padding: '48px 20px', background: '#F8FAFC', textAlign: 'center' }}>
    <WalletOutlined style={{ fontSize: 28, color: '#93C5FD' }} />
    <div style={{ color: '#0F172A', fontWeight: 700, marginTop: 12 }}>No payments yet</div>
    <Text style={{ color: '#64748B' }}>Payments made to this vendor will appear here.</Text>
  </div>
);

/**
 * Vendor payment history — latest first, collapsible, paginated. Each payment shows
 * how it was split across invoices. Refetches on open and after any new payment.
 */
const VendorPaymentHistory = ({ vendorId }) => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['vendorPayments', vendorId],
    queryFn: () => investmentService.getVendorPaymentHistory(vendorId),
    enabled: !!vendorId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const groups = data?.data || [];

  // Backend already returns latest first; just slice the current page.
  const items = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return groups.slice(start, start + PAGE_SIZE).map((group, idx) => ({
      key: String(start + idx),
      label: <PaymentHeader group={group} />,
      children: <Allocations group={group} />,
    }));
  }, [groups, page]);

  if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;
  if (!groups.length) return <EmptyState />;

  return (
    <div>
      <Collapse items={items} expandIconPosition="end" style={{ background: 'transparent' }} />
      {groups.length > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pagination
            current={page}
            pageSize={PAGE_SIZE}
            total={groups.length}
            onChange={setPage}
            showSizeChanger={false}
            showTotal={(t, r) => `${r[0]}–${r[1]} of ${t} payments`}
          />
        </div>
      )}
    </div>
  );
};

export default VendorPaymentHistory;
