import React, { useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Button,
  DatePicker,
  Select,
  Space,
  Form,
  Tooltip,
  Skeleton,
  Statistic,
  Tag,
  Modal,
  Dropdown,
  notification,
} from 'antd';
import {
  SearchOutlined,
  ReloadOutlined,
  HistoryOutlined,
  InboxOutlined,
  DollarCircleOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  AppstoreOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
  MoreOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
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
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';

const ProductionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const t = useT();
  const [form] = Form.useForm();

  // Filters state mapping directly to query parameters
  const [filters, setFilters] = useState<{
    fromDate?: string;
    toDate?: string;
    employeeId?: string;
    productId?: string;
  }>({});

  // Server-side pagination state (backend page is 0-indexed; default size 20).
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

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
  // Report download uses its own range picker (dialog), independent of the table filters.
  const [reportOpen, setReportOpen] = useState(false);

  const handleDelete = (record: IProductionEntry) => {
    Modal.confirm({
      title: t('production.deleteConfirmTitle', 'Delete production entry?'),
      icon: <ExclamationCircleOutlined />,
      content: `${t('production.deletePrefix', 'This permanently deletes the entry for')} ${record.employeeName} ${t('production.deleteOn', 'on')} ${record.productionDate ? dayjs(record.productionDate).format('DD MMM YYYY') : ''}. ${t('production.cannotBeUndone', 'This cannot be undone.')}`,
      okText: t('common.delete', 'Delete'),
      okButtonProps: { danger: true },
      cancelText: t('common.cancel', 'Cancel'),
      onOk: async () => {
        try {
          await productionService.deleteProduction(record.id);
          notification.success({ message: t('production.entryDeleted', 'Production entry deleted'), placement: 'topRight' });
          refreshAll();
        } catch (e: any) {
          notification.error({ message: t('production.deleteFailedTitle', 'Delete failed'), description: e.message, placement: 'topRight' });
        }
      },
    });
  };

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

  // Query 3a: Fetch the current page of production history entries (server-side).
  const { data: pageResponse, isLoading, refetch } = useQuery({
    queryKey: ['productionHistory', filters, page, pageSize],
    queryFn: () => productionService.getProductionPage({ ...filters, page, size: pageSize }),
    placeholderData: keepPreviousData,
  });
  const productionEntries = pageResponse?.content || [];
  const totalElements = pageResponse?.totalElements || 0;

  // Query 3b: aggregate KPIs for the cards (cheap SQL — not the whole dataset).
  const { data: stats, refetch: refetchTotals } = useQuery({
    queryKey: ['productionHistoryTotals', filters],
    queryFn: () => productionService.getProductionStats(filters),
  });

  // Refresh both the paged rows and the totals aggregate.
  const refreshAll = () => {
    refetch();
    refetchTotals();
  };

  // Currency formatter
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSearch = (values: any) => {
    // Filtering happens on the server — reset to the first page on any filter change.
    setPage(0);
    setFilters({
      fromDate: values.fromDate ? values.fromDate.format('YYYY-MM-DD') : undefined,
      toDate: values.toDate ? values.toDate.format('YYYY-MM-DD') : undefined,
      employeeId: values.employeeId,
      productId: values.productId,
    });
  };

  const handleReset = () => {
    form.resetFields();
    setPage(0);
    setFilters({});
  };

  // KPI aggregates (from the server stats endpoint; month is computed dynamically there).
  const todayQuantity = stats?.todayQuantity ?? 0;
  const thisMonthQuantity = stats?.monthQuantity ?? 0;
  const totalQuantity = stats?.totalQuantity ?? 0;
  const totalAmount = stats?.totalAmount ?? 0;

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  const columns = [
    {
      title: t('production.colProductionDate', 'Production Date'),
      dataIndex: 'productionDate',
      key: 'productionDate',
      width: '15%',
      render: (date: string) => (
        <span style={{ fontWeight: 600, color: '#475569' }}>
          {date ? dayjs(date).format('DD-MMM-YYYY') : '-'}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        a.productionDate.localeCompare(b.productionDate),
    },
    {
      title: t('production.colEmployee', 'Employee'),
      dataIndex: 'employeeName',
      key: 'employeeName',
      width: '20%',
      render: (name: string, record: IProductionEntry) => (
        <div>
          <span style={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>{name}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
            {record.employeeCode}
          </span>
        </div>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.employeeName || '').localeCompare(b.employeeName || ''),
    },
    {
      title: t('production.colItems', 'Items'),
      dataIndex: 'productCount',
      key: 'productCount',
      width: '24%',
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
      title: t('production.totalQuantity', 'Total Quantity'),
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: '12%',
      align: 'right' as const,
      render: (qty: number) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
          {(qty || 0).toLocaleString('en-IN')} {t('production.pcs', 'Pcs')}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalQuantity || 0) - (b.totalQuantity || 0),
    },
    {
      title: t('production.totalAmount', 'Total Amount'),
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: '15%',
      align: 'right' as const,
      render: (amount: number) => (
        <span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>
          {formatCurrency(amount || 0)}
        </span>
      ),
      sorter: (a: IProductionEntry, b: IProductionEntry) =>
        (a.totalAmount || 0) - (b.totalAmount || 0),
    },
    {
      title: t('production.colAction', 'Action'),
      key: 'action',
      width: '8%',
      align: 'center' as const,
      render: (_: any, record: IProductionEntry) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: t('production.downloadPdf', 'Download PDF'), onClick: () => handleDownloadPdf(record) },
              { key: 'excel', icon: <FileExcelOutlined style={{ color: 'var(--theme-primary)' }} />, label: t('production.downloadExcel', 'Download Excel'), onClick: () => handleDownloadExcel(record) },
              ...(can('production', 'delete') ? [
                { type: 'divider' as const },
                { key: 'delete', icon: <DeleteOutlined />, label: t('common.delete', 'Delete'), danger: true, onClick: () => handleDelete(record) },
              ] : []),
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined style={{ fontSize: '1.15rem', color: '#475569' }} />} />
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
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <HistoryOutlined style={{ color: 'var(--theme-primary)' }} />
              {t('production.historyTitle', 'Production History Log')}
              <HeadingInfo text={t('production.historyInfo', 'Review and audit historic enterprise garment production entries.')} />
            </Typography>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => setReportOpen(true)} style={{ borderRadius: 6, fontWeight: 600 }}>
              {t('production.downloadReport', 'Download report')}
            </Button>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={refreshAll}
              style={{ borderRadius: 6, fontWeight: 600 }}
            >
              {t('common.refresh', 'Refresh')}
            </Button>
          </Space>
        </div>

        <ReportDownloadDialog
          open={reportOpen}
          title={t('production.downloadReportTitle', 'Download production report')}
          onClose={() => setReportOpen(false)}
          onDownload={(format, from, to) => productionService.downloadProductionReport(format, from, to)}
        />

        {/* ==================================================
            TOP SUMMARY CARDS (4 KPI Panels)
            ================================================== */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <ClockCircleOutlined style={{ fontSize: '20px', color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{t('production.todayProduction', 'Today Production')}</span>}
                  value={todayQuantity}
                  suffix={t('production.pcs', 'Pcs')}
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid #DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <CalendarOutlined style={{ fontSize: '20px', color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{t('production.thisMonthProduction', 'This Month Production')}</span>}
                  value={thisMonthQuantity}
                  suffix={t('production.pcs', 'Pcs')}
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <InboxOutlined style={{ fontSize: '20px', color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.8rem' }}>{t('production.totalQuantity', 'Total Quantity')}</span>}
                  value={totalQuantity}
                  suffix={t('production.pcs', 'Pcs')}
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--theme-primary)' }}
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px', display: 'flex', alignItems: 'center', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #A7F3D0' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 8, backgroundColor: '#D1FAE5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 16
              }}>
                <DollarCircleOutlined style={{ fontSize: '20px', color: 'var(--theme-primary)' }} />
              </div>
              <div>
                <Statistic
                  title={<span style={{ color: '#065F46', fontWeight: 700, fontSize: '0.8rem' }}>{t('production.totalAmount', 'Total Amount')}</span>}
                  value={totalAmount}
                  formatter={(val) => formatCurrency(Number(val))}
                  valueStyle={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--theme-primary)' }}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Filters Card */}
        <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
          <Form
            form={form}
            onFinish={handleSearch}
            layout="vertical"
            requiredMark={false}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="fromDate" label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('production.fromDate', 'From Date')}</span>}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} format="DD-MMM-YYYY" placeholder={t('production.selectDate', 'Select date')} />
                </Form.Item>
              </Col>
              
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="toDate" label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('production.toDate', 'To Date')}</span>}>
                  <DatePicker style={{ width: '100%', borderRadius: 6 }} format="DD-MMM-YYYY" placeholder={t('production.selectDate', 'Select date')} />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="employeeId" label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('production.employee', 'Employee')}</span>}>
                  <Select
                    placeholder={t('production.searchEmployee', 'Search employee')}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    style={{ borderRadius: 6 }}
                  >
                    {employees.map((emp: any) => (
                      <Select.Option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeCode})
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Form.Item name="productId" label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('production.product', 'Product')}</span>}>
                  <Select
                    placeholder={t('production.searchProduct', 'Search product')}
                    allowClear
                    showSearch
                    optionFilterProp="children"
                    listHeight={190}
                    style={{ borderRadius: 6 }}
                  >
                    {products.map((prod: any) => (
                      <Select.Option key={prod.id} value={prod.id}>
                        <ProductLabel productId={prod.id} iconName={prod.iconName} name={prod.name} hasImage={prod.hasImage} size={18} />
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                style={{ borderRadius: 6, fontWeight: 600 }}
              >
                {t('production.searchFilter', 'Search Filter')}
              </Button>
              <Button
                onClick={handleReset}
                icon={<ReloadOutlined />}
                style={{ borderRadius: 6, fontWeight: 600 }}
              >
                {t('common.reset', 'Reset')}
              </Button>
            </div>
          </Form>
        </Card>

        {/* History Table Card */}
        <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
          {isLoading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : (
            <Table
              dataSource={productionEntries}
              columns={columns}
              rowKey="id"
              pagination={{
                current: page + 1,
                pageSize,
                total: totalElements,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total, range) => `${range[0]}-${range[1]} ${t('production.of', 'of')} ${total} ${t('production.logs', 'logs')}`,
                onChange: (nextPage, nextSize) => {
                  // antd is 1-indexed; the backend is 0-indexed. Reset to the first
                  // page when the page size changes.
                  if (nextSize !== pageSize) {
                    setPageSize(nextSize);
                    setPage(0);
                  } else {
                    setPage(nextPage - 1);
                  }
                },
              }}
              style={{ borderRadius: 12, overflow: 'hidden' }}
              locale={{
                emptyText: (
                  <div style={{ padding: '48px 16px', color: '#94A3B8', textAlign: 'center' }}>
                    {t('production.emptyFiltered', 'No production logs found matching the selected filters.')}
                  </div>
                ),
              }}
            />
          )}
        </Card>

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
              scroll={{ x: 'max-content' }}
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

export default ProductionHistoryPage;
