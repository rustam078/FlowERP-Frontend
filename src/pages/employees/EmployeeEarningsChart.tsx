import React, { useEffect, useState } from 'react';
import { Card, Segmented, Button, Space } from 'antd';
import { BarChartOutlined, LineChartOutlined, AreaChartOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { IMonthlyEarningsTrend } from '../../types/employee-details.types';
import { getCurrencySymbol } from '../../utils/currency';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeEarningsChartProps {
  data: IMonthlyEarningsTrend[];
}

const WINDOW = 12; // months shown at once before paging kicks in

export const EmployeeEarningsChart: React.FC<EmployeeEarningsChartProps> = ({ data }) => {
  const t = useT();
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [offset, setOffset] = useState(0); // months skipped from the most-recent end

  useEffect(() => setOffset(0), [data]);

  const total = data.length;
  const end = Math.max(0, total - offset);
  const start = Math.max(0, end - WINDOW);
  const view = data.slice(start, end);
  const canOlder = start > 0;
  const canNewer = offset > 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 8, boxShadow: '0px 4px 6px -1px rgba(15, 23, 42, 0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>{payload[0].payload.month}</p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#2563EB' }}>{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12, fontWeight: 500 }} />
      <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${getCurrencySymbol()}${val}`} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} width={50} />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
    </>
  );

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>{t('employees.chart.earningsTrend', 'Monthly Earnings Trend')}</span>}
      extra={
        <Space size="small">
          {total > WINDOW && (
            <Space size={2}>
              <Button size="small" type="text" icon={<LeftOutlined />} disabled={!canOlder} onClick={() => setOffset((o) => o + WINDOW)} />
              <Button size="small" type="text" icon={<RightOutlined />} disabled={!canNewer} onClick={() => setOffset((o) => Math.max(0, o - WINDOW))} />
            </Space>
          )}
          <Segmented
            size="small"
            value={chartType}
            onChange={(v) => setChartType(v as 'bar' | 'line' | 'area')}
            options={[
              { value: 'bar', icon: <BarChartOutlined /> },
              { value: 'line', icon: <LineChartOutlined /> },
              { value: 'area', icon: <AreaChartOutlined /> },
            ]}
          />
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)', border: '1px solid #E2E8F0', height: '100%' }}
      bodyStyle={{ padding: '24px 16px 12px 16px' }}
    >
      <div style={{ width: '100%', height: 300 }}>
        {view.length === 0 ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.95rem' }}>
            {t('employees.chart.noData', 'No data available for the selected range.')}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={view} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                {axes}
                <Bar dataKey="earnings" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={view} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                {axes}
                <Line type="monotone" dataKey="earnings" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
              </LineChart>
            ) : (
              <AreaChart data={view} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="empEarnFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                {axes}
                <Area type="monotone" dataKey="earnings" stroke="#2563EB" strokeWidth={2.5} fill="url(#empEarnFill)" />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
