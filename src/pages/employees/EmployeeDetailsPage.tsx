import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ConfigProvider,
  Button,
  DatePicker,
  Space,
  Row,
  Col,
  Card,
  Skeleton,
  Result,
  Calendar,
  Select,
  Tooltip,
  Drawer,
  Empty,
  Divider,
  Spin,
  Dropdown,
  notification,
} from 'antd';
import {
  ArrowLeftOutlined,
  FilterOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import { employeeDetailsService } from '../../services/employee-details.service';
import { currentMonthRange } from '../../utils/reportDownload';

import { useEmployeeDetails, useEmployeeCalendar } from '../../hooks/useEmployeeDetails';
import { EmployeeInfoCard } from './EmployeeInfoCard';
import { OverallSummaryCard, CurrentMonthSummaryCard } from './EmployeeSummaryCards';
import { EmployeeProductionHistoryTable } from './EmployeeProductionHistoryTable';
import { CurrentMonthProductPerformance } from './CurrentMonthProductPerformance';
import { ProductWiseEarningsList } from './ProductWiseEarningsList';
import { EmployeeEarningsChart } from './EmployeeEarningsChart';
import { EmployeeProductChart } from './EmployeeProductChart';
import { CurrentMonthCard } from './CurrentMonthCard';
import HeadingInfo from '../../components/common/HeadingInfo';
import ProductLabel from '../../components/common/ProductLabel';
import { useT } from '../../contexts/LanguageContext';

const { RangePicker } = DatePicker;

// Format currency helper
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
};

const EmployeeDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const t = useT();
  const { employeeId } = useParams<{ employeeId: string }>();

  // Base current date for the app
  const currentDateBase = dayjs();

  // Global Filter Type: 'current-month' | 'month' | 'custom' | 'all'
  const [filterType, setFilterType] = useState<'current-month' | 'month' | 'custom' | 'all'>('all');

  // Month select state (for 'month' filter type)
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs>(currentDateBase);

  // Custom date range picker state
  const [pickerDates, setPickerDates] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>([
    currentDateBase.startOf('month'),
    currentDateBase.endOf('month')
  ]);

  // Derived filter range for queries
  const [filterRange, setFilterRange] = useState<{
    fromDate: string | undefined;
    toDate: string | undefined;
  }>({
    fromDate: undefined,
    toDate: undefined, // Default filter is "Show All" (no date range)
  });

  // Calendar Value (month-based focus)
  const [calendarValue, setCalendarValue] = useState<dayjs.Dayjs>(currentDateBase);
  
  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);

  // Handle filter type change
  const handleFilterTypeChange = (type: 'current-month' | 'month' | 'custom' | 'all') => {
    setFilterType(type);
    if (type === 'current-month') {
      setFilterRange({
        fromDate: currentDateBase.startOf('month').format('YYYY-MM-DD'),
        toDate: currentDateBase.endOf('month').format('YYYY-MM-DD'),
      });
      setCalendarValue(currentDateBase);
    } else if (type === 'month') {
      setFilterRange({
        fromDate: selectedMonth.startOf('month').format('YYYY-MM-DD'),
        toDate: selectedMonth.endOf('month').format('YYYY-MM-DD'),
      });
      setCalendarValue(selectedMonth);
    } else if (type === 'custom') {
      if (pickerDates && pickerDates[0] && pickerDates[1]) {
        setFilterRange({
          fromDate: pickerDates[0].format('YYYY-MM-DD'),
          toDate: pickerDates[1].format('YYYY-MM-DD'),
        });
      } else {
        setFilterRange({
          fromDate: undefined,
          toDate: undefined,
        });
      }
    } else if (type === 'all') {
      setFilterRange({
        fromDate: undefined,
        toDate: undefined,
      });
      setCalendarValue(currentDateBase);
    }
  };

  // Handle month picker change
  const handleMonthChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedMonth(date);
      setCalendarValue(date);
      setFilterRange({
        fromDate: date.startOf('month').format('YYYY-MM-DD'),
        toDate: date.endOf('month').format('YYYY-MM-DD'),
      });
    }
  };

  // Filter application handler for custom range
  const handleApplyFilter = () => {
    if (pickerDates && pickerDates[0] && pickerDates[1]) {
      setFilterRange({
        fromDate: pickerDates[0].format('YYYY-MM-DD'),
        toDate: pickerDates[1].format('YYYY-MM-DD'),
      });
    }
  };

  // Derive dates based on local calendar selector (fallback when global filter is not active)
  const localCalendarDates = useMemo(() => {
    return {
      fromDate: calendarValue.startOf('month').format('YYYY-MM-DD'),
      toDate: calendarValue.endOf('month').format('YYYY-MM-DD'),
    };
  }, [calendarValue]);

  // Determine final calendar query dates (Global filter overrides calendar's local filters)
  const calendarFromDate = filterRange.fromDate || localCalendarDates.fromDate;
  const calendarToDate = filterRange.toDate || localCalendarDates.toDate;

  // Download this employee's report for the selected range (defaults to the current month).
  const handleDownloadReport = async (format: 'pdf' | 'excel') => {
    if (!employeeId) return;
    const range = filterRange.fromDate && filterRange.toDate
      ? { fromDate: filterRange.fromDate, toDate: filterRange.toDate }
      : currentMonthRange();
    try {
      await employeeDetailsService.downloadEmployeeReport(format, employeeId, range.fromDate, range.toDate);
    } catch (e: any) {
      notification.error({ message: t('employees.toast.reportFailed', 'Report download failed'), description: e.message, placement: 'topRight' });
    }
  };

  // Update calendar month focus when the query range changes
  useEffect(() => {
    if (calendarFromDate) {
      setCalendarValue(dayjs(calendarFromDate));
    }
  }, [calendarFromDate]);

  // Fetch Employee details using React Query (driven by page-level filters)
  const {
    data: detailsResponse,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useEmployeeDetails(employeeId || '', filterRange.fromDate, filterRange.toDate);

  // Fetch Calendar production data (driven by combined global/local filters)
  const {
    data: calendarResponse,
    isLoading: isCalendarLoading,
    isError: isCalendarError,
    refetch: refetchCalendar,
  } = useEmployeeCalendar(employeeId || '', calendarFromDate, calendarToDate);

  // Current-month figures are ALWAYS for the actual current calendar month,
  // independent of the page filter above (so they never go blank when filtering).
  const currentMonthStart = currentDateBase.startOf('month').format('YYYY-MM-DD');
  const currentMonthEnd = currentDateBase.endOf('month').format('YYYY-MM-DD');
  const { data: currentMonthResponse } = useEmployeeDetails(
    employeeId || '',
    currentMonthStart,
    currentMonthEnd
  );

  const data = detailsResponse?.data;
  const currentMonthData = currentMonthResponse?.data;

  // Build Calendar data map for easy date cell lookup
  const calendarDataMap = useMemo(() => {
    const map: { [key: string]: { totalQuantity: number; totalEarning: number } } = {};
    if (calendarResponse) {
      calendarResponse.forEach((day: any) => {
        map[day.date] = {
          totalQuantity: Number(day.totalQuantity ?? 0),
          totalEarning: Number(day.totalEarning ?? 0),
        };
      });
    }
    return map;
  }, [calendarResponse]);

  // Check if there is any production activity recorded in the calendar response
  const hasCalendarProduction = useMemo(() => {
    return calendarResponse && calendarResponse.some((day: any) => Number(day.totalEarning) > 0);
  }, [calendarResponse]);

  // Filter production history for the selected date to display inside the Drawer
  const productsWorked = useMemo(() => {
    if (!selectedDate || !data?.productionHistory) return [];
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return data.productionHistory.filter((item: any) => item.date === dateStr);
  }, [selectedDate, data?.productionHistory]);

  // Calendar cell click handler
  const handleSelect = (date: dayjs.Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayData = calendarDataMap[dateStr];
    
    // Only open the drawer if the clicked date has earnings
    if (dayData && dayData.totalEarning > 0) {
      setSelectedDate(date);
      setDrawerOpen(true);
    }
    setCalendarValue(date);
  };

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  // Custom date cell renderer for Ant Design Calendar
  const dateCellRender = (current: dayjs.Dayjs) => {
    const dateStr = current.format('YYYY-MM-DD');
    const dayData = calendarDataMap[dateStr];

    if (!dayData || dayData.totalEarning <= 0) {
      return null;
    }

    const { totalQuantity, totalEarning } = dayData;

    // Color brackets:
    // 1 - 999: Light Green
    // 1,000 - 4,999: Medium Green
    // 5,000+: Dark Green
    let bgColor = '';
    let textColor = '';
    let borderColor = '';

    if (totalEarning >= 5000) {
      bgColor = 'var(--theme-primary)'; // Dark Green
      textColor = '#FFFFFF';
      borderColor = 'var(--theme-primary)';
    } else if (totalEarning >= 1000) {
      bgColor = '#A7F3D0'; // Medium Green
      textColor = '#065F46';
      borderColor = '#6EE7B7';
    } else if (totalEarning > 0) {
      bgColor = 'color-mix(in srgb, var(--theme-primary) 12%, white)'; // Light Green
      textColor = '#15803D';
      borderColor = '#BBF7D0';
    }

    const tooltipTitle = (
      <div style={{ padding: '4px' }}>
        <div style={{ fontWeight: 700, marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '2px' }}>
          {current.format('DD MMM YYYY')}
        </div>
        <div style={{ fontSize: '0.85rem' }}>
          {t('employees.calendar.totalEarnings', 'Total Earnings:')} <span style={{ fontWeight: 700 }}>{formatCurrency(totalEarning)}</span>
        </div>
        <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
          {t('employees.calendar.totalQuantity', 'Total Quantity:')} <span style={{ fontWeight: 700 }}>{totalQuantity} {t('employees.pcsLower', 'pcs')}</span>
        </div>
      </div>
    );

    return (
      <Tooltip title={tooltipTitle} color="#1E293B" mouseEnterDelay={0.1}>
        <div
          style={{
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '3px 2px',
            margin: '0',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            width: '100%',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.filter = 'brightness(0.95)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = 'none';
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>
            {formatCurrency(totalEarning)}
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 600, opacity: totalEarning >= 5000 ? 0.95 : 0.85, marginTop: '2px' }}>
            {totalQuantity} {t('employees.pcsLower', 'pcs')}
          </div>
        </div>
      </Tooltip>
    );
  };

  // Ant Design Calendar's cellRender callback
  const cellRender = (current: dayjs.Dayjs, info: any) => {
    if (info.type === 'date') {
      // Return custom JSX only. Returning undefined makes Antd render the default content.
      // Do NOT return info.originNode inside this block to prevent duplicate date numbers.
      return dateCellRender(current) || undefined;
    }
    return undefined;
  };

  // Loading skeleton
  if (isDetailsLoading) {
    return (
      <ConfigProvider
        theme={{
          token: {
                        borderRadius: 8,
          },
        }}
      >
        <Box sx={{ p: 1 }}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Header Skeleton */}
            <Card style={cardStyle} bodyStyle={{ padding: '16px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Skeleton.Button active size="default" style={{ width: 80 }} />
                <Skeleton.Input active size="default" style={{ width: 250 }} />
              </div>
            </Card>

            {/* Row 1 Skeletons */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={8}>
                <Card style={cardStyle} bodyStyle={{ padding: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
                    <Skeleton.Avatar active size={80} shape="circle" style={{ marginBottom: 12 }} />
                    <Skeleton.Input active size="default" style={{ width: 180, marginBottom: 8 }} />
                    <Skeleton.Input active size="small" style={{ width: 120 }} />
                  </div>
                  <Skeleton active paragraph={{ rows: 4 }} title={false} />
                </Card>
              </Col>
              <Col xs={24} lg={16}>
                <Row gutter={[16, 16]}>
                  {[1, 2, 3, 4].map((i) => (
                    <Col xs={24} sm={12} key={i}>
                      <Card style={cardStyle} bodyStyle={{ padding: 24, display: 'flex', alignItems: 'center' }}>
                        <Skeleton.Avatar active size={48} shape="square" style={{ marginRight: 16 }} />
                        <div style={{ flexGrow: 1 }}>
                          <Skeleton.Input active size="small" style={{ width: '60%', marginBottom: 8 }} />
                          <br />
                          <Skeleton.Input active size="default" style={{ width: '80%' }} />
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>

            {/* Columns Skeleton */}
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={10}>
                <Card style={cardStyle}>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
              </Col>
              <Col xs={24} lg={14}>
                <Card style={cardStyle}>
                  <Skeleton active paragraph={{ rows: 8 }} />
                </Card>
              </Col>
            </Row>
          </Space>
        </Box>
      </ConfigProvider>
    );
  }

  // Error boundary response UI
  if (isDetailsError || isCalendarError || !data) {
    return (
      <ConfigProvider
        theme={{
          token: {
                        borderRadius: 8,
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Card style={{ ...cardStyle, maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <Result
              status="error"
              title={t('employees.error.title', 'Failed to Load Employee Details')}
              subTitle={detailsError?.message || t('employees.error.subtitle', 'Employee records could not be fetched.')}
              extra={[
                <Button type="default" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} key="back">
                  {t('employees.error.backToList', 'Back to List')}
                </Button>,
                <Button type="primary" onClick={() => { refetchDetails(); refetchCalendar(); }} key="retry">
                  {t('employees.error.retry', 'Retry')}
                </Button>,
              ]}
            />
          </Card>
        </Box>
      </ConfigProvider>
    );
  }

  const { employee, summary, productSummary, productionHistory, currentMonthProductSummary = [], monthlyEarnings = [] } = data;

  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {/* ==================================================
            HEADER & FILTER SECTION
            ================================================== */}
        <Card style={cardStyle} bodyStyle={{ padding: '10px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            {/* Left: Employee Info & Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/employees')}
                style={{ fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center' }}
              >
                {t('common.back', 'Back')}
              </Button>
              <Dropdown
                trigger={['click']}
                menu={{
                  items: [
                    { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: t('employees.download.pdf', 'Download PDF'), onClick: () => handleDownloadReport('pdf') },
                    { key: 'excel', icon: <FileExcelOutlined style={{ color: 'var(--theme-primary)' }} />, label: t('employees.download.excel', 'Download Excel'), onClick: () => handleDownloadReport('excel') },
                  ],
                }}
              >
                <Button icon={<DownloadOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                  {t('employees.download.report', 'Download report')}
                </Button>
              </Dropdown>
            </div>

            {/* Right: Date Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Space size="middle" align="center" style={{ flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FilterOutlined style={{ color: 'var(--theme-primary)' }} />
                  {t('employees.filter.label', 'Filter by:')}
                </span>
                <Select
                  value={filterType}
                  onChange={(value) => handleFilterTypeChange(value)}
                  style={{ width: 160, borderRadius: 6 }}
                  options={[
                    { value: 'current-month', label: t('employees.filter.currentMonth', 'Current Month') },
                    { value: 'month', label: t('employees.filter.selectMonth', 'Select Month') },
                    { value: 'custom', label: t('employees.filter.customRange', 'Custom Range') },
                    { value: 'all', label: t('employees.filter.showAll', 'Show All') },
                  ]}
                />

                {filterType === 'month' && (
                  <DatePicker
                    picker="month"
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    disabledDate={(current) => {
                      // Do not allow future month/year selections (current local date is June 25, 2026)
                      const maxDate = currentDateBase;
                      return current && current.isAfter(maxDate, 'month');
                    }}
                    format="MMMM YYYY"
                    allowClear={false}
                    style={{ width: 180, borderRadius: 6 }}
                  />
                )}

                {filterType === 'custom' && (
                  <RangePicker
                    value={pickerDates}
                    onChange={(dates) => setPickerDates(dates as any)}
                    format="DD-MMM-YYYY"
                    style={{ minWidth: 260, borderRadius: 6 }}
                    allowClear={false}
                    disabledDate={(current) => {
                      // Do not allow future date selections (current local date is June 25, 2026)
                      const maxDate = currentDateBase;
                      return current && current.isAfter(maxDate, 'day');
                    }}
                  />
                )}
              </Space>
              
              {filterType === 'custom' && (
                <Space size="small">
                  <Button
                    type="primary"
                    onClick={handleApplyFilter}
                    disabled={!pickerDates || !pickerDates[0] || !pickerDates[1]}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    {t('employees.filter.apply', 'Apply Filter')}
                  </Button>
                </Space>
              )}
            </div>
          </div>
        </Card>

        {/* Row 1: left column (compact Employee details + Overall stacked) · right column (Current Month).
            Left cards keep their natural height and do not stretch to the Current Month card. */}
        <style>{`@media (min-width: 992px) { .emp-left-stack { height: 440px; } }`}</style>
        <Row gutter={[14, 14]} style={{ display: 'flex', alignItems: 'flex-start' }}>
          <Col xs={24} lg={16}>
            {/* On desktop the stack matches the Current Month card height; Overall
                Summary flex-grows to fill the space left below the Employee card. */}
            <div className="emp-left-stack" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ flexShrink: 0 }}>
                <EmployeeInfoCard employee={employee} />
              </div>
              <div style={{ flex: '1 1 auto', minHeight: 0 }}>
                <OverallSummaryCard summary={summary} />
              </div>
            </div>
          </Col>
          <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
            <CurrentMonthCard
              summary={currentMonthData?.summary ?? summary}
              products={currentMonthData?.currentMonthProductSummary ?? []}
            />
          </Col>
        </Row>

        {/* Row 2: both graphs — Monthly Earnings Trend + Product Contribution % */}
        <Row gutter={[14, 14]} style={{ display: 'flex', alignItems: 'stretch' }}>
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            <EmployeeEarningsChart data={monthlyEarnings} />
          </Col>
          <Col xs={24} lg={12} style={{ display: 'flex', flexDirection: 'column' }}>
            <EmployeeProductChart data={productSummary} />
          </Col>
        </Row>

        {/* Row 3: Product Wise Earnings (left) + Production Calendar (right) */}
        <Row gutter={[14, 14]} style={{ display: 'flex', alignItems: 'stretch' }}>
          <Col xs={24} lg={10} style={{ display: 'flex', flexDirection: 'column' }}>
            <ProductWiseEarningsList data={productSummary} />
          </Col>
          <Col xs={24} lg={14} style={{ display: 'flex', flexDirection: 'column' }}>
            <Card
              title={
                <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center' }}>
                  {t('employees.calendar.title', 'Production Calendar')}
                  <HeadingInfo text={t('employees.calendar.info', "Daily earnings overview — each cell shows that day's pieces and earnings.")} />
                </span>
              }
              style={{
                ...cardStyle,
                height: '100%',
              }}
              bodyStyle={{ padding: '14px' }}
            >
              {/* Calendar Filters & Month Header Row */}
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: '#475569', fontSize: '0.9rem' }}>{t('employees.calendar.selectMonth', 'Select Month:')}</span>
                  <DatePicker
                    picker="month"
                    value={calendarValue}
                    onChange={(date) => {
                      if (date) {
                        setCalendarValue(date);
                        if (filterType === 'month') {
                          setSelectedMonth(date);
                          setFilterRange({
                            fromDate: date.startOf('month').format('YYYY-MM-DD'),
                            toDate: date.endOf('month').format('YYYY-MM-DD'),
                          });
                        }
                      }
                    }}
                    disabledDate={(current) => {
                      // Do not allow future month/year option (current local date is June 25, 2026)
                      const maxDate = currentDateBase;
                      return current && current.isAfter(maxDate, 'month');
                    }}
                    format="MMMM YYYY"
                    allowClear={false}
                    style={{ width: 180, borderRadius: 6 }}
                    disabled={filterType === 'custom' || filterType === 'current-month'}
                  />
                  {filterType === 'custom' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--theme-primary)', fontWeight: 600 }}>
                      {t('employees.calendar.filteredCustom', 'Filtered by Custom Date Range')}
                    </span>
                  )}
                  {filterType === 'current-month' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--theme-primary)', fontWeight: 600 }}>
                      {t('employees.calendar.filteredCurrent', 'Filtered by Current Month')}
                    </span>
                  )}
                </div>

                {/* Month & Year Header aligned on the right side */}
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', flexShrink: 0 }}>
                  {calendarValue.format('MMMM YYYY')}
                </div>
              </div>

              <Spin spinning={isCalendarLoading} size="large" tip={t('employees.calendar.loading', 'Loading production calendar...')}>
                {!hasCalendarProduction ? (
                  <div style={{ padding: '60px 24px', textAlign: 'center' }}>
                    <Empty
                      description={
                        <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.95rem' }}>
                          {t('employees.calendar.empty', 'No production activity found for selected period.')}
                        </span>
                      }
                    />
                  </div>
                ) : (
                  <div className="custom-calendar-container">
                    <style>{`
                      .custom-calendar-container .ant-picker-cell {
                        overflow: visible !important;
                      }
                      .custom-calendar-container .ant-picker-cell-inner {
                        height: auto !important;
                        min-height: 52px !important;
                        overflow: visible !important;
                      }
                      .custom-calendar-container .ant-picker-calendar-date {
                        min-height: 52px !important;
                        height: auto !important;
                        padding: 2px 4px !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        overflow: visible !important;
                      }
                      .custom-calendar-container .ant-picker-calendar-date-value {
                        line-height: 18px !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 0.85rem !important;
                      }
                      .custom-calendar-container .ant-picker-calendar-date-content {
                        height: auto !important;
                        margin: 0 !important;
                        overflow: visible !important;
                      }
                    `}</style>
                    <Calendar
                      value={calendarValue}
                      onSelect={handleSelect}
                      cellRender={cellRender}
                      fullscreen={true}
                      headerRender={() => null}
                    />
                  </div>
                )}
              </Spin>
            </Card>
          </Col>
        </Row>

        {/* 3. Production History */}
        <Row gutter={[14, 14]} style={{ marginBottom: 8 }}>
          <Col xs={24}>
            <EmployeeProductionHistoryTable data={productionHistory} />
          </Col>
        </Row>
      </Box>

      {/* Production Details Drawer */}
      <Drawer
        title={
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>{t('employees.productionDetails.title', 'Production Details')}</span>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500, marginTop: 4 }}>
              {selectedDate ? selectedDate.format('DD MMM YYYY') : ''}
            </span>
          </div>
        }
        placement="right"
        width={500}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        bodyStyle={{ padding: '14px', display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div className="hide-scrollbar" style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '14px' }}>
          {productsWorked.map((item: any, idx: number) => (
            <div
              key={item.id || idx}
              style={{
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#F8FAFC',
              }}
            >
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', textTransform: 'capitalize' }}>
                <ProductLabel productId={item.productId} iconName={item.iconName} name={item.productName} size={20} />
              </h4>
              <Row gutter={[12, 6]}>
                <Col span={8}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('employees.quantity', 'Quantity')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginTop: 1 }}>{item.quantity} {t('employees.pcsLower', 'pcs')}</div>
                </Col>
                <Col span={8}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('employees.rate', 'Rate')}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginTop: 1 }}>{formatCurrency(item.rate)}</div>
                </Col>
                <Col span={8} style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase' }}>{t('employees.earnings', 'Earnings')}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--theme-primary)', marginTop: 1 }}>{formatCurrency(item.earnings)}</div>
                </Col>
              </Row>
            </div>
          ))}
        </div>

        {/* Drawer Footer summary */}
        <div
          style={{
            borderTop: '2px dashed #E2E8F0',
            paddingTop: '14px',
            marginTop: 'auto',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
            }}
          >
            <Row align="middle">
              <Col span={12}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>{t('common.total', 'Total')}</span>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 500 }}>
                  {productsWorked.reduce((sum: number, item: any) => sum + item.quantity, 0)} {t('employees.pcsLower', 'pcs')}
                </div>
                <div style={{ fontSize: '1.15rem', color: 'var(--theme-primary)', fontWeight: 800, marginTop: 1 }}>
                  {formatCurrency(productsWorked.reduce((sum: number, item: any) => sum + item.earnings, 0))}
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Drawer>
    </ConfigProvider>
  );
};

export default EmployeeDetailsPage;


