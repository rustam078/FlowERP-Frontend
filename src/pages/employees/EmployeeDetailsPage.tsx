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
import AttendanceCalendar from './AttendanceCalendar';
import PayrollAccountCard from './PayrollAccountCard';
import SalaryOverviewPanel from './SalaryOverviewPanel';
import PayrollSummaryCards from './PayrollSummaryCards';
import { useQuery as usePayrollQuery } from '@tanstack/react-query';
import { employeeService as employeeSvc } from '../../services/employee.service';
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

  // Page-level payroll totals for the summary cards + Salary Overview panel.
  const { data: payrollResp } = usePayrollQuery({
    queryKey: ['payroll', employeeId, 'overview'],
    queryFn: () => employeeSvc.getPayroll(employeeId!, { txnSize: 5, slipSize: 10 }),
    enabled: !!employeeId,
  });
  const payroll = payrollResp?.data;
  // Undefined = let the card pick its first tab (slips for monthly, piece for piece-rate).
  const [activeTab, setActiveTab] = React.useState<string | undefined>(undefined);
  // Bumped by "Record Leave" to open the apply-leave modal in the attendance tab.
  const [leaveSignal, setLeaveSignal] = React.useState(0);

  // Date filter shown inside the employee header card (top-right).
  const filterControls = (
    <Space size="small" wrap>
      <Select value={filterType} onChange={(v) => handleFilterTypeChange(v)} style={{ width: 170 }}
        suffixIcon={<FilterOutlined style={{ color: 'var(--theme-primary)' }} />}
        options={[
          { value: 'current-month', label: t('employees.filter.currentMonth', 'Current Month') },
          { value: 'month', label: t('employees.filter.selectMonth', 'Select Month') },
          { value: 'custom', label: t('employees.filter.customRange', 'Custom Range') },
          { value: 'all', label: t('employees.filter.showAll', 'Show All') },
        ]}
      />
      {filterType === 'month' && (
        <DatePicker picker="month" value={selectedMonth} onChange={handleMonthChange}
          disabledDate={(c) => c && c.isAfter(currentDateBase, 'month')} format="MMM YYYY" allowClear={false} style={{ width: 170 }} />
      )}
      {filterType === 'custom' && (
        <>
          <RangePicker value={pickerDates} onChange={(d) => setPickerDates(d as any)} format="DD-MMM-YYYY" allowClear={false}
            disabledDate={(c) => c && c.isAfter(currentDateBase, 'day')} style={{ width: 250 }} />
          <Button type="primary" onClick={handleApplyFilter} disabled={!pickerDates || !pickerDates[0] || !pickerDates[1]}>{t('employees.filter.apply', 'Apply')}</Button>
        </>
      )}
    </Space>
  );

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
  const isMonthly = employee?.paymentType === 'MONTHLY'; // monthly staff have no piece-work sections

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
        {/* Back to employee list */}
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')} style={{ alignSelf: 'flex-start', fontWeight: 600, color: '#475569', paddingLeft: 0 }}>
          {t('common.back', 'Back')}
        </Button>

        {/* Employee info + filter (top-right) + summary cards — all in one card */}
        <EmployeeInfoCard
          employee={employee}
          extra={filterControls}
          footer={payroll ? <PayrollSummaryCards payroll={payroll} /> : undefined}
        />

        {/* Payroll tabs (left: Transaction / Payslip / Piece Work / Attendance) + Salary Overview (right) */}
        <Row gutter={[14, 14]} style={{ marginBottom: 8, display: 'flex', alignItems: 'stretch' }}>
          <Col xs={24} lg={16} style={{ display: 'flex', flexDirection: 'column' }}>
            {employeeId && (
              <PayrollAccountCard
                employeeId={employeeId}
                fromDate={filterRange.fromDate}
                toDate={filterRange.toDate}
                productionHistory={productionHistory}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                leaveSignal={leaveSignal}
              />
            )}
          </Col>
          <Col xs={24} lg={8} style={{ display: 'flex', flexDirection: 'column' }}>
            {employeeId && <SalaryOverviewPanel employeeId={employeeId} payroll={payroll} isMonthly={isMonthly} onRecordLeave={() => { setActiveTab('attendance'); setLeaveSignal((s) => s + 1); }} />}
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


