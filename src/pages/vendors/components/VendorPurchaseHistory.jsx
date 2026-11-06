import React, { useState, useMemo } from 'react';
import { Typography, Empty, Button, Input, DatePicker, Space, Pagination, Tag, Popover, Badge, Select } from 'antd';
import { ShoppingOutlined, PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import PurchaseInvoiceCard from './PurchaseInvoiceCard';
import { usePermissions } from '../../../hooks/usePermissions';

dayjs.extend(isBetween);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PAGE_SIZE = 5;

const VendorPurchaseHistory = ({ invoices = [], onAddInvestment }) => {
  const { can } = usePermissions();
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter from ALL records (not paginated)
  const filteredInvoices = useMemo(() => {
    let result = [...invoices];

    // Filter by invoice number (contains, case insensitive)
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      result = result.filter((inv) =>
        inv.invoiceNumber?.toLowerCase().includes(q)
      );
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const from = dayjs(dateRange[0]).startOf('day');
      const to = dayjs(dateRange[1]).endOf('day');
      result = result.filter((inv) => {
        const d = dayjs(inv.purchaseDate);
        return d.isAfter(from.subtract(1, 'ms')) && d.isBefore(to.add(1, 'ms'));
      });
    }

    // Filter by payment status — Unpaid also includes partially-paid (anything still owing).
    if (paymentStatus === 'PAID') {
      result = result.filter((inv) => (inv.paymentStatus || 'PENDING') === 'PAID');
    } else if (paymentStatus === 'UNPAID') {
      result = result.filter((inv) => (inv.paymentStatus || 'PENDING') !== 'PAID');
    }

    return result;
  }, [invoices, searchText, dateRange, paymentStatus]);

  // Paginate the filtered results
  const totalFiltered = filteredInvoices.length;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredInvoices.slice(start, start + PAGE_SIZE);
  }, [filteredInvoices, currentPage]);

  const handleSearch = (value) => {
    setSearchText(value);
    setCurrentPage(1); // reset page on search
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    setCurrentPage(1); // reset page on filter
  };

  const hasFilters = searchText.trim() || (dateRange && dateRange[0]) || paymentStatus;

  if (!invoices || invoices.length === 0) {
    return (
      <div style={{ marginTop: 32 }}>
        <Title level={4} style={{ fontWeight: 800, color: '#0F172A', marginBottom: 20 }}>
          Purchase History
        </Title>
        <div style={{ 
          border: '1px dashed #CBD5E1', 
          borderRadius: 12, 
          padding: '60px 20px', 
          backgroundColor: '#F8FAFC',
          textAlign: 'center'
        }}>
          <Empty
            image={
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <ShoppingOutlined style={{ fontSize: 28, color: '#93C5FD' }} />
              </div>
            }
            description={
              <div>
                <div style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>
                  No purchases found
                </div>
                <Text style={{ color: '#64748B' }}>
                  This vendor does not have any purchases yet.
                </Text>
              </div>
            }
          >
            {can('investment', 'write') && (
            <Button
              type="default"
              icon={<PlusOutlined />}
              onClick={onAddInvestment}
              style={{ marginTop: 16, color: 'var(--theme-primary)', borderColor: 'var(--theme-primary)', fontWeight: 600, borderRadius: 6 }}
            >
              Create Investment
            </Button>
            )}
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 32 }}>
      {/* Header with filter popover */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Purchase History
          {totalFiltered !== invoices.length && (
            <Tag color="blue" style={{ marginLeft: 12, fontWeight: 500, fontSize: '0.78rem' }}>
              {totalFiltered} of {invoices.length}
            </Tag>
          )}
        </Title>
        <Popover
          trigger="click"
          placement="bottomRight"
          content={
            <div style={{ width: 280 }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Invoice No</div>
              <Input
                placeholder="e.g. INV-000001"
                allowClear
                value={searchText}
                prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ borderRadius: 6, marginBottom: 12 }}
              />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Date range</div>
              <RangePicker
                format="DD MMM YYYY"
                placeholder={['From Date', 'To Date']}
                value={dateRange}
                onChange={handleDateChange}
                style={{ borderRadius: 6, width: '100%', marginBottom: 12 }}
              />
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 6 }}>Payment Status</div>
              <Select
                placeholder="All Payments"
                allowClear
                value={paymentStatus}
                onChange={(v) => { setPaymentStatus(v); setCurrentPage(1); }}
                style={{ width: '100%', marginBottom: 12 }}
                options={[
                  { value: 'PAID', label: 'Paid' },
                  { value: 'UNPAID', label: 'Unpaid (incl. partial)' },
                ]}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  disabled={!hasFilters}
                  onClick={() => { setSearchText(''); setDateRange(null); setPaymentStatus(undefined); setCurrentPage(1); }}
                  style={{ borderRadius: 6, color: '#64748B' }}
                >
                  Clear
                </Button>
              </div>
            </div>
          }
        >
          <Badge count={(searchText.trim() ? 1 : 0) + (dateRange && dateRange[0] ? 1 : 0) + (paymentStatus ? 1 : 0)} size="small">
            <Button icon={<FilterOutlined />} style={{ borderRadius: 8 }}>Filters</Button>
          </Badge>
        </Popover>
      </div>

      {/* Invoice Cards */}
      {paginatedInvoices.length === 0 ? (
        <div style={{
          border: '1px dashed #CBD5E1',
          borderRadius: 12,
          padding: '40px 20px',
          backgroundColor: '#F8FAFC',
          textAlign: 'center',
        }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <div style={{ color: '#0F172A', fontWeight: 700, marginBottom: 4 }}>
                  No matching purchases
                </div>
                <Text style={{ color: '#64748B', fontSize: '0.85rem' }}>
                  Try adjusting your search or date filter.
                </Text>
              </div>
            }
          />
        </div>
      ) : (
        <div>
          {paginatedInvoices.map((invoice, index) => (
            <PurchaseInvoiceCard key={invoice.id || invoice.invoiceNumber || index} invoice={invoice} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalFiltered > PAGE_SIZE && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={totalFiltered}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}–${range[1]} of ${total} invoices`}
          />
        </div>
      )}

      {/* Footer empty state */}
      {paginatedInvoices.length > 0 && !hasFilters && (
        <div style={{
          border: '1px dashed #CBD5E1',
          borderRadius: 12,
          padding: '24px 20px',
          backgroundColor: '#F8FAFC',
          textAlign: 'center',
          marginTop: 16,
        }}>
          <ShoppingOutlined style={{ fontSize: 24, color: '#CBD5E1', marginBottom: 8, display: 'block' }} />
          <Text style={{ color: '#94A3B8', fontSize: '0.85rem' }}>
            No more purchases found for this vendor.
          </Text>
        </div>
      )}
    </div>
  );
};

export default VendorPurchaseHistory;
