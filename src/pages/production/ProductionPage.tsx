import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Form,
  Input,
  Button,
  DatePicker,
  Select,
  InputNumber,
  Space,
  Statistic,
  notification,
  Divider,
  Tooltip,
  Modal,
  Drawer,
  Tag,
  Dropdown,
  Popover,
  Badge,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  FileAddOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  BarcodeOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  MoreOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { productionService } from '../../services/productionService';
import ReportDownloadDialog from '../../components/common/ReportDownloadDialog';
import { employeeService } from '../../services/employee.service';
import { productService } from '../../services/productService';
import { getProductIconAndLabel } from '../../utils/product-icons';
import ProductLabel from '../../components/common/ProductLabel';
import { IProductionEntry } from '../../types/production';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';

const ProductionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const t = useT();
  const [filterForm] = Form.useForm();

  // Filter popover visibility
  const [filterOpen, setFilterOpen] = useState(false);

  // "View items" modal — lists all products in a production entry
  const [itemsModal, setItemsModal] = useState<{ open: boolean; record: IProductionEntry | null }>({
    open: false,
    record: null,
  });
  const openItems = (record: IProductionEntry) => setItemsModal({ open: true, record });
  const closeItems = () => setItemsModal({ open: false, record: null });

  const handleDownloadPdf = async (record: IProductionEntry) => {
    try {
      await productionService.downloadProductionPdf(record.id);
    } catch (e: any) {
      notification.error({ message: t('production.pdfDownloadFailed', 'PDF download failed'), description: e.message, placement: 'topRight' });
    }
  };
  const handleDownloadExcel = async (record: IProductionEntry) => {
    try {
      await productionService.downloadProductionExcel(record.id);
    } catch (e: any) {
      notification.error({ message: t('production.excelDownloadFailed', 'Excel download failed'), description: e.message, placement: 'topRight' });
    }
  };

  // Active filters for production history table
  const [historyFilters, setHistoryFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    productId?: string;
  }>({});

  // Query 1: Fetch Employees list
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: employeeService.getEmployees,
  });
  const employees = employeesData?.data || [];

  // Query 2: Fetch Products list
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });
  const products = productsData?.data || [];

  // Server-side pagination state (backend page is 0-indexed; table default size 10).
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Query 3: one page of production entries (server-side) for the table.
  const { data: productionPage, isLoading: listLoading } = useQuery({
    queryKey: ['productionRecent', historyFilters, page, pageSize],
    queryFn: () => productionService.getProductionPage({ ...historyFilters, page, size: pageSize }),
  });
  const entries = productionPage?.content || [];
  const totalEntriesCount = productionPage?.totalElements ?? 0;

  // Query 3b: aggregate KPIs for the summary cards (not tied to the current page).
  const { data: productionStats } = useQuery({
    queryKey: ['productionStats', historyFilters],
    queryFn: () => productionService.getProductionStats(historyFilters),
  });

  const quickFilter = Form.useWatch('quickFilter', filterForm) || 'Custom Range';
  const isCustom = quickFilter === 'Custom Range';

  // ── Mutations ────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: productionService.deleteProduction,
    onSuccess: (res) => {
      notification.success({
        message: t('production.success', 'Success'),
        description: res?.message || t('production.deletedSuccess', 'Production entry deleted successfully'),
        placement: 'topRight',
      });
      queryClient.invalidateQueries({ queryKey: ['productionRecent'] });
      queryClient.invalidateQueries({ queryKey: ['productionStats'] });
      queryClient.invalidateQueries({ queryKey: ['employeeDetails'] });
      queryClient.invalidateQueries({ queryKey: ['employeeCalendar'] });
      // Also refresh the cross-page views a production entry feeds into.
      queryClient.invalidateQueries({ queryKey: ['productionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
    },
    onError: (error: any) => {
      notification.error({
        message: t('production.error', 'Error'),
        description: error.message || t('production.deleteFailed', 'Failed to delete entry'),
        placement: 'topRight',
      });
    },
  });

  // ── Currency formatter ──────────────────────────────────

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // ── Delete production entry ─────────────────────────────

  const handleDeleteRow = (record: IProductionEntry) => {
    Modal.confirm({
      title: t('production.deleteTitle', 'Delete Production Entry'),
      icon: <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
      content: t('production.deleteContent', 'This action cannot be undone.'),
      okText: t('common.delete', 'Delete'),
      okType: 'danger',
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        await deleteMutation.mutateAsync(record.id);
      },
    });
  };

  // ── Filter handlers ─────────────────────────────────────

  const handleSearchHistory = (values: any) => {
    setPage(0); // new filter → back to the first page
    setHistoryFilters({
      fromDate: values.fromDate ? values.fromDate.format('YYYY-MM-DD') : undefined,
      toDate: values.toDate ? values.toDate.format('YYYY-MM-DD') : undefined,
      employeeId: values.employeeId,
      productId: values.productId,
    });
    setFilterOpen(false);
  };

  const handleResetHistoryFilters = () => {
    filterForm.resetFields();
    setPage(0);
    setHistoryFilters({});
    setFilterOpen(false);
  };

  // Count of active filters (for the badge on the Filter button)
  const activeFilterCount = Object.values(historyFilters).filter(Boolean).length;

  // Report download uses its own range picker (dialog below), not the table filters.
  const [reportOpen, setReportOpen] = useState(false);

  const handleQuickFilterChange = (val: string) => {
    if (val && val !== 'Custom Range') {
      let fromDateVal = dayjs();
      let toDateVal = dayjs();

      if (val === 'Today') {
        fromDateVal = dayjs().startOf('day');
        toDateVal = dayjs().endOf('day');
      } else if (val === 'Yesterday') {
        fromDateVal = dayjs().subtract(1, 'day').startOf('day');
        toDateVal = dayjs().subtract(1, 'day').endOf('day');
      } else if (val === 'This Week') {
        fromDateVal = dayjs().startOf('week');
        toDateVal = dayjs().endOf('week');
      } else if (val === 'This Month') {
        fromDateVal = dayjs().startOf('month');
        toDateVal = dayjs().endOf('month');
      } else if (val === 'This Quarter') {
        const startMonth = Math.floor(dayjs().month() / 3) * 3;
        fromDateVal = dayjs().month(startMonth).startOf('month');
        toDateVal = dayjs().month(startMonth + 2).endOf('month');
      } else if (val === 'This Year') {
        fromDateVal = dayjs().startOf('year');
        toDateVal = dayjs().endOf('year');
      }

      filterForm.setFieldsValue({ fromDate: fromDateVal, toDate: toDateVal });
      setHistoryFilters({
        fromDate: fromDateVal.format('YYYY-MM-DD'),
        toDate: toDateVal.format('YYYY-MM-DD'),
        employeeId: filterForm.getFieldValue('employeeId'),
        productId: filterForm.getFieldValue('productId'),
      });
    } else if (val === 'Custom Range') {
      filterForm.setFieldsValue({ fromDate: null, toDate: null });
    }
  };

  // ── Table summary stats ─────────────────────────────────

  const statsTotalEntries = productionStats?.totalEntries ?? 0;
  const statsTodayQty = productionStats?.todayQuantity ?? 0;
  const statsTodayAmount = productionStats?.todayAmount ?? 0;
  const statsTotalQty = productionStats?.totalQuantity ?? 0;
  const statsTotalAmount = productionStats?.totalAmount ?? 0;

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  // ── History Table Columns ───────────────────────────────

  const historyColumns = [
    {
      title: t('production.colProductionDate', 'Production Date'),
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: '14%',
      render: (date: string) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        a.productionDate.localeCompare(b.productionDate),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: t('production.colEmployee', 'Employee'),
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: '20%',
      render: (name: string, record: IProductionEntry) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{name}</span>
          <span style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>{record.employeeCode}</span>
        </div>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: t('production.colItems', 'Items'),
      dataIndex: 'productCount',
      key: 'productCount',
      width: '28%',
      render: (_count: number, record: IProductionEntry) => {
        const items = record.items || [];
        const MAX_INLINE = 2;
        const shown = items.slice(0, MAX_INLINE);
        const extra = items.length - shown.length;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            {shown.map((item, i) => (
              <Tag
                key={i}
                style={{ margin: 0, borderRadius: 6, background: '#F1F5F9', border: '1px solid #E2E8F0', color: '#334155', fontWeight: 600, padding: '1px 8px', display: 'inline-flex', alignItems: 'center' }}
              >
                <ProductLabel productId={item.productId} iconName={item.iconName} name={item.productName} hasImage={item.hasImage} size={16} />
                <span style={{ color: 'var(--theme-primary)', marginLeft: 4 }}>×{item.quantity}</span>
              </Tag>
            ))}
            {items.length === 0 && <span style={{ color: '#94A3B8' }}>—</span>}
            {extra > 0 && (
              <Tag
                onClick={() => openItems(record)}
                style={{ margin: 0, cursor: 'pointer', borderRadius: 6, background: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #BFDBFE', color: 'var(--theme-primary)', fontWeight: 700, padding: '1px 8px' }}
              >
                +{extra} {t('production.more', 'more')}
              </Tag>
            )}
            {items.length > 0 && (
              <Tooltip title={t('production.viewAllItems', 'View all items')}>
                <Button
                  type="text"
                  size="small"
                  icon={<AppstoreOutlined style={{ color: '#64748B' }} />}
                  onClick={() => openItems(record)}
                  style={{ height: 22, width: 22, minWidth: 22, padding: 0 }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.productCount || 0) - (b.productCount || 0),
    },
    {
      title: t('production.colQuantity', 'Quantity'),
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      align: 'right' as const,
      width: '12%',
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{(qty || 0).toLocaleString()} {t('production.pcs', 'Pcs')}</span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalQuantity || 0) - (b.totalQuantity || 0),
    },
    {
      title: t('common.amount', 'Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right' as const,
      width: '13%',
      render: (amt: number) => (
        <span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{formatCurrency(amt || 0)}</span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      align: 'center' as const,
      width: '8%',
      render: (_: any, record: IProductionEntry) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: t('production.downloadPdf', 'Download PDF'), onClick: () => handleDownloadPdf(record) },
              { key: 'excel', icon: <FileExcelOutlined style={{ color: 'var(--theme-primary)' }} />, label: t('production.downloadExcel', 'Download Excel'), onClick: () => handleDownloadExcel(record) },
              ...(can('production', 'delete') ? [
                { type: 'divider' as const },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete', 'Delete'), danger: true, onClick: () => handleDeleteRow(record) },
              ] : []),
            ],
          }}
        >
          <Button type="text" size="small" icon={<MoreOutlined style={{ fontSize: '1.1rem', color: '#475569' }} />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <style>{`
          .table-row-even { background-color: #ffffff; }
          .table-row-odd { background-color: #F8FAFC; }
          .row-hover:hover > td { background-color: #F1F5F9 !important; }
        `}</style>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FileAddOutlined style={{ color: 'var(--theme-primary)' }} />
              {t('production.pageTitle', 'Production Management')}
              <HeadingInfo text={t('production.pageInfo', 'Manage daily production entries with piece code based pricing.')} />
            </Typography>
          </div>
          <Space size={10}>
            <Popover
              trigger="click"
              placement="bottomRight"
              open={filterOpen}
              onOpenChange={setFilterOpen}
              content={
                <div style={{ width: 300 }}>
                  <Form
                    form={filterForm}
                    onFinish={handleSearchHistory}
                    layout="vertical"
                    initialValues={{ quickFilter: 'Custom Range' }}
                  >
                    <Form.Item
                      name="quickFilter"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>{t('production.quickFilter', 'Quick Filter')}</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <Select placeholder={t('production.quickFilter', 'Quick Filter')} onChange={handleQuickFilterChange}>
                        <Select.Option value="Today">{t('production.today', 'Today')}</Select.Option>
                        <Select.Option value="Yesterday">{t('production.yesterday', 'Yesterday')}</Select.Option>
                        <Select.Option value="This Week">{t('production.thisWeek', 'This Week')}</Select.Option>
                        <Select.Option value="This Month">{t('production.thisMonth', 'This Month')}</Select.Option>
                        <Select.Option value="This Quarter">{t('production.thisQuarter', 'This Quarter')}</Select.Option>
                        <Select.Option value="This Year">{t('production.thisYear', 'This Year')}</Select.Option>
                        <Select.Option value="Custom Range">{t('production.customRange', 'Custom Range')}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Row gutter={8}>
                      <Col span={12}>
                        <Form.Item
                          name="fromDate"
                          label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>{t('common.from', 'From')}</span>}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker format="DD-MMM-YYYY" disabled={!isCustom} style={{ width: '100%', borderRadius: 6 }} />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          name="toDate"
                          label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>{t('common.to', 'To')}</span>}
                          style={{ marginBottom: 12 }}
                        >
                          <DatePicker format="DD-MMM-YYYY" disabled={!isCustom} style={{ width: '100%', borderRadius: 6 }} />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      name="employeeId"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>{t('production.employee', 'Employee')}</span>}
                      style={{ marginBottom: 12 }}
                    >
                      <Select placeholder={t('production.employee', 'Employee')} allowClear showSearch optionFilterProp="children">
                        {employees.map((emp: any) => (
                          <Select.Option key={emp.id} value={emp.id}>
                            {emp.fullName}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="productId"
                      label={<span style={{ fontWeight: 600, color: '#475569', fontSize: '0.85rem' }}>{t('production.product', 'Product')}</span>}
                      style={{ marginBottom: 16 }}
                    >
                      <Select placeholder={t('production.product', 'Product')} allowClear showSearch optionFilterProp="children" listHeight={190}>
                        {products.filter((p: any) => p.active && p.source != 'PURCHASED')
                          .map((p: any) => (
                            <Select.Option key={p.id} value={p.id}>
                              <ProductLabel productId={p.id} iconName={p.iconName} name={p.name} hasImage={p.hasImage} size={18} />
                            </Select.Option>
                          ))}
                      </Select>
                    </Form.Item>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <Button onClick={handleResetHistoryFilters} icon={<ReloadOutlined />} style={{ borderRadius: 6 }}>
                        {t('common.reset', 'Reset')}
                      </Button>
                      <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ borderRadius: 6 }}>
                        {t('production.apply', 'Apply')}
                      </Button>
                    </div>
                  </Form>
                </div>
              }
            >
              <Badge count={activeFilterCount} size="small">
                <Button icon={<FilterOutlined />} size="large" style={{ borderRadius: 6, fontWeight: 600, height: 44 }}>
                  {t('common.filters', 'Filters')}
                </Button>
              </Badge>
            </Popover>

            <Button
              icon={<DownloadOutlined />}
              size="large"
              onClick={() => setReportOpen(true)}
              style={{ borderRadius: 6, fontWeight: 600, height: 44 }}
            >
              {t('production.downloadReport', 'Download report')}
            </Button>

            {can('production', 'write') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                size="large"
                onClick={() => navigate('/production/new')}
                style={{ borderRadius: 6, fontWeight: 600, height: 44 }}
              >
                {t('production.createEntry', 'Create Production Entry')}
              </Button>
            )}
          </Space>
        </div>

        {/* ── Summary Cards ── */}
        <Row gutter={[16, 16]}>
          {[
            { label: t('production.todaysProduction', "Today's Production"), value: statsTodayQty, suffix: ' ' + t('production.pcs', 'Pcs'), icon: <CheckCircleOutlined style={{ color: 'var(--theme-primary)', marginRight: 8 }} />, color: 'var(--theme-primary)' },
            { label: t('production.todaysAmount', "Today's Amount"), value: statsTodayAmount, formatter: (v: any) => formatCurrency(Number(v)), color: 'var(--theme-primary)' },
            { label: t('production.totalQuantity', 'Total Quantity'), value: statsTotalQty, suffix: ' ' + t('production.pcs', 'Pcs'), icon: <CheckCircleOutlined style={{ color: 'var(--theme-primary)', marginRight: 8 }} />, color: 'var(--theme-primary)' },
            { label: t('production.totalAmount', 'Total Amount'), value: statsTotalAmount, formatter: (v: any) => formatCurrency(Number(v)), color: 'var(--theme-primary)' },
            { label: t('production.totalEntries', 'Total Entries'), value: statsTotalEntries, icon: <FileAddOutlined style={{ color: 'var(--theme-primary)', marginRight: 8 }} />, color: '#0F172A' },
          ].map((stat, i) => (
            <Col key={i} xs={24} sm={12} lg={4} style={{ flex: '1 1 180px', maxWidth: '100%' }}>
              <Card style={cardStyle} bodyStyle={{ padding: 20 }}>
                <Statistic
                  title={<span style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>{stat.label}</span>}
                  value={stat.value}
                  suffix={stat.suffix}
                  prefix={stat.icon}
                  formatter={stat.formatter as any}
                  valueStyle={{ color: stat.color, fontWeight: 800 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* ── Production Table ── */}
        <Card style={cardStyle} bodyStyle={{ padding: '0px 16px' }}>
          <Table
            dataSource={entries}
            columns={historyColumns}
            rowKey="id"
            size="middle"
            pagination={{
              current: page + 1,
              pageSize,
              total: totalEntriesCount,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}–${range[1]} ${t('production.of', 'of')} ${total} ${t('production.entries', 'entries')}`,
              onChange: (p, ps) => { setPage(p - 1); setPageSize(ps); },
            }}
            loading={listLoading}
            scroll={{ x: 'max-content' }}
            rowClassName={(_, index) =>
              index % 2 === 0 ? 'table-row-even row-hover' : 'table-row-odd row-hover'
            }
            locale={{
              emptyText: (
                <div style={{ padding: '48px 16px', color: '#94A3B8', textAlign: 'center' }}>
                  {t('production.emptyTable', 'No production logs found. Click "Create Production Entry" to log new worker outputs.')}
                </div>
              ),
            }}
            style={{ borderRadius: 8, overflow: 'hidden' }}
          />
        </Card>

        <ReportDownloadDialog
          open={reportOpen}
          title={t('production.downloadReportTitle', 'Download production report')}
          onClose={() => setReportOpen(false)}
          onDownload={(format, from, to) => productionService.downloadProductionReport(format, from, to)}
        />

        {/* ── View Items Modal (all products in a production entry) ── */}
        <Modal
          open={itemsModal.open}
          onCancel={closeItems}
          footer={null}
          width={640}
          title={
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A' }}>
              <AppstoreOutlined style={{ color: 'var(--theme-primary)' }} />
              {t('production.productsProduced', 'Products Produced')}
              {itemsModal.record && (
                <span style={{ fontWeight: 500, color: '#64748B', fontSize: '0.8rem' }}>
                  · {itemsModal.record.employeeName} · {itemsModal.record.productionDate ? dayjs(itemsModal.record.productionDate).format('DD MMM YYYY') : ''}
                </span>
              )}
            </span>
          }
        >
          {itemsModal.record && (
            <Table
              dataSource={itemsModal.record.items || []}
              rowKey={(r: any, i?: number) => `${r.productId}-${r.pieceCodeId || i}`}
              size="small"
              pagination={false}
              scroll={{ y: 340 }}
              columns={[
                {
                  title: t('production.colProduct', 'Product'),
                  dataIndex: 'productName',
                  key: 'productName',
                  render: (name: string, item: any) => (
                    <ProductLabel productId={item.productId} iconName={item.iconName} name={name} hasImage={item.hasImage} size={22} nameStyle={{ fontWeight: 600, color: '#0F172A' }} />
                  ),
                },
                {
                  title: t('production.colPieceCode', 'Piece Code'),
                  dataIndex: 'pieceCode',
                  key: 'pieceCode',
                  render: (code: string) => code ? <Tag style={{ borderRadius: 6 }}>{code}</Tag> : <span style={{ color: '#94A3B8' }}>—</span>,
                },
                { title: t('production.qty', 'Qty'), dataIndex: 'quantity', key: 'quantity', align: 'right' as const, render: (q: number) => <span style={{ fontWeight: 600 }}>{(q || 0).toLocaleString('en-IN')}</span> },
                { title: t('production.rate', 'Rate'), dataIndex: 'rate', key: 'rate', align: 'right' as const, render: (r: number) => <span style={{ color: '#64748B' }}>{formatCurrency(r || 0)}</span> },
                { title: t('common.amount', 'Amount'), dataIndex: 'amount', key: 'amount', align: 'right' as const, render: (a: number) => <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{formatCurrency(a || 0)}</span> },
              ]}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row style={{ background: '#F8FAFC' }}>
                    <Table.Summary.Cell index={0} colSpan={2}><span style={{ fontWeight: 800 }}>{t('common.total', 'Total')}</span></Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="right"><span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{(itemsModal.record.totalQuantity || 0).toLocaleString('en-IN')}</span></Table.Summary.Cell>
                    <Table.Summary.Cell index={3} />
                    <Table.Summary.Cell index={4} align="right"><span style={{ fontWeight: 900, color: 'var(--theme-primary)' }}>{formatCurrency(itemsModal.record.totalAmount || 0)}</span></Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          )}
        </Modal>
      </Box>
    </ConfigProvider>
  );
};

export default ProductionPage;
