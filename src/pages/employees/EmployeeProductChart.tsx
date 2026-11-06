import React, { useEffect, useState } from 'react';
import { Card, Segmented, Button, Space } from 'antd';
import { PieChartOutlined, BarChartOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { IProductSummary } from '../../types/employee-details.types';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeProductChartProps {
  data: IProductSummary[];
}

const COLORS = ['#2563EB', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];
const WINDOW = 6; // products shown at once before paging kicks in

export const EmployeeProductChart: React.FC<EmployeeProductChartProps> = ({ data }) => {
  const t = useT();
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie');
  const [offset, setOffset] = useState(0);

  useEffect(() => setOffset(0), [data]);

  // Highest contribution first, then page through in windows.
  const sorted = [...data].sort((a, b) => (b.contributionPercentage || 0) - (a.contributionPercentage || 0));
  const total = sorted.length;
  const start = Math.min(offset, Math.max(0, total - 1));
  const view = sorted.slice(start, start + WINDOW);
  const canPrev = start > 0;
  const canNext = start + WINDOW < total;

  const chartData = view.map((item) => ({
    name: item.productName,
    value: item.contributionPercentage,
    qty: item.quantityProduced,
  }));

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, value, name } = props;
    if (!value || value === 0) return null;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 6) * cos;
    const sy = cy + (outerRadius + 6) * sin;
    const mx = cx + (outerRadius + 18) * cos;
    const my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 16;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#94A3B8" fill="none" strokeWidth={1.5} />
        <circle cx={sx} cy={sy} r={3} fill="#94A3B8" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 6} y={ey} textAnchor={textAnchor} fill="#1E293B" dominantBaseline="middle" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>
          {`${name} (${value}%)`}
        </text>
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #E2E8F0', padding: '8px 12px', borderRadius: 8, boxShadow: '0px 4px 6px -1px rgba(15, 23, 42, 0.1)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>{d.name}</p>
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: payload[0].color || '#2563EB' }}>{t('employees.chart.contribution', 'Contribution')}: {d.value}%</p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>{t('employees.chart.qtyProduced', 'Qty Produced')}: {d.qty} {t('employees.pcs', 'Pcs')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card
      title={<span style={{ color: '#0F172A', fontWeight: 700, fontSize: '1.1rem' }}>{t('employees.chart.productContribution', 'Product Contribution %')}</span>}
      extra={
        <Space size="small">
          {total > WINDOW && (
            <Space size={2}>
              <Button size="small" type="text" icon={<LeftOutlined />} disabled={!canPrev} onClick={() => setOffset((o) => Math.max(0, o - WINDOW))} />
              <Button size="small" type="text" icon={<RightOutlined />} disabled={!canNext} onClick={() => setOffset((o) => o + WINDOW)} />
            </Space>
          )}
          <Segmented
            size="small"
            value={chartType}
            onChange={(v) => setChartType(v as 'pie' | 'bar')}
            options={[
              { value: 'pie', icon: <PieChartOutlined /> },
              { value: 'bar', icon: <BarChartOutlined /> },
            ]}
          />
        </Space>
      }
      style={{ borderRadius: 12, boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)', border: '1px solid #E2E8F0', height: '100%' }}
      bodyStyle={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
    >
      <div style={{ width: '100%', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {view.length === 0 ? (
          <div style={{ color: '#94A3B8', fontSize: '0.95rem' }}>{t('employees.chart.noData', 'No data available for the selected range.')}</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie data={chartData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" label={renderCustomizedLabel} labelLine={false}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" align="center" iconType="circle" iconSize={8} formatter={(value, _entry: any, index) => {
                  const percent = chartData[index]?.value || 0;
                  return <span style={{ color: '#475569', fontWeight: 500, fontSize: '0.85rem' }}>{value} ({percent}%)</span>;
                }} />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};
