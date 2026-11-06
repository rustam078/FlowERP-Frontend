import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ConfigProvider, Card, Row, Col, DatePicker, Segmented, Button, Dropdown, Popover,
  Space, Divider, Table, Tag, Spin, Empty, Tooltip, Select, notification,
} from 'antd';
import {
  ReloadOutlined, FilePdfOutlined, FileExcelOutlined, RiseOutlined, ShoppingCartOutlined,
  DollarCircleOutlined, ToolOutlined, WalletOutlined, InboxOutlined, WarningOutlined,
  TeamOutlined, LineChartOutlined, AreaChartOutlined, BarChartOutlined, FilterOutlined,
  MoreOutlined, LeftOutlined, RightOutlined, FundOutlined, ShopOutlined,
  AppstoreOutlined, PieChartOutlined, RadarChartOutlined,
} from '@ant-design/icons';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, PieChart, Pie, Cell, Legend, BarChart, Bar, Treemap,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import { dashboardService } from '../../services/dashboardService';
import { investmentService, vendorService } from '../../services/investmentService';
import productService from '../../services/productService';
import salesService from '../../modules/sales/services/salesService';
import axiosInstance from '../../services/axios';
import { exportToExcel, exportElementToPdf } from '../../utils/exportUtils';
import { getCurrencySymbol } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { useThemeColor } from '../../contexts/ThemeColorContext';
import { useT } from '../../contexts/LanguageContext';

dayjs.extend(quarterOfYear);

const { RangePicker } = DatePicker;

const num = (v) => new Intl.NumberFormat('en-IN').format(Math.round(Number(v) || 0));
const money = (v) => `${getCurrencySymbol()}${num(v)}`;

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4', '#EF4444'];
// Light pastel fills for the treemap so dark text stays readable.
const TREEMAP_COLORS = ['#BFDBFE', '#BBF7D0', '#FDE68A', '#DDD6FE', '#A5F3FC', '#FBCFE8', '#FECACA', '#C7D2FE'];

const QUICK = {
  Today: () => [dayjs().startOf('day'), dayjs().endOf('day')],
  'This Week': () => [dayjs().startOf('week'), dayjs().endOf('week')],
  'This Month': () => [dayjs().startOf('month'), dayjs().endOf('month')],
  'This Quarter': () => [dayjs().startOf('quarter'), dayjs().endOf('quarter')],
  'This Year': () => [dayjs().startOf('year'), dayjs().endOf('year')],
  'All Time': () => [dayjs('2000-01-01'), dayjs().endOf('day')],
};

const PAGE_SIZE = 12;

const BOARDS = [
  { value: 'overview', label: 'Overview', icon: <FundOutlined /> },
  { value: 'sales', label: 'Sales', icon: <ShoppingCartOutlined /> },
  { value: 'inventory', label: 'Inventory', icon: <InboxOutlined /> },
  { value: 'expenses', label: 'Expenses', icon: <WalletOutlined /> },
  { value: 'employees', label: 'Employees', icon: <TeamOutlined /> },
];

const cardStyle = { borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(15,23,42,0.04)' };

const KpiTile = ({ icon, color, label, value, sub }) => {
  // All KPI icons use the app theme colour (monochrome icons); `color` arg is ignored.
  const { primary } = useThemeColor();
  return (
  <Card style={cardStyle} styles={{ body: { padding: 12 } }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${primary}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { style: { fontSize: 16, color: primary } })}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.15, marginTop: 1 }}>{value}</div>
        {sub != null && <div style={{ fontSize: '0.66rem', fontWeight: 600, color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
      </div>
    </div>
  </Card>
  );
};

const SectionCard = ({ title, icon, extra, children, bodyPad = 12 }) => {
  // Section header icons follow the theme colour too.
  const { primary } = useThemeColor();
  const themedIcon = icon ? React.cloneElement(icon, { style: { ...(icon.props?.style || {}), color: primary } }) : icon;
  return (
  <Card
    style={{ ...cardStyle, height: '100%' }}
    styles={{ body: { padding: bodyPad }, header: { minHeight: 42, padding: '0 12px' } }}
    title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#0F172A', fontSize: '0.85rem' }}>{themedIcon}{title}</span>}
    extra={extra}
  >
    {children}
  </Card>
  );
};

// One chart, three render modes. `series` items carry a `label` + the numeric `dataKey`.
const TrendChart = ({ series, dataKey, color, type, formatter }) => {
  const t = useT();
  if (!series.length) {
    return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description={t('dashboard.empty.noData', 'No data')} /></div>;
  }
  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false} width={58} tickFormatter={formatter} />
      <RTooltip formatter={(v) => formatter(v)} labelStyle={{ fontWeight: 600 }} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
    </>
  );
  if (type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>{axes}
          <Bar dataKey={dataKey} fill={color} radius={[5, 5, 0, 0]} maxBarSize={34} />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>{axes}
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        {axes}
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#fill-${dataKey})`} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Chart-type toggle + chunk pager, shown in a section's `extra` slot.
const ChartToolbar = ({ type, setType, page, totalPages, setPage }) => (
  <Space size={4}>
    {totalPages > 1 && (
      <>
        <Button size="small" type="text" icon={<LeftOutlined />} disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
        <span style={{ fontSize: 11, color: '#94A3B8' }}>{page + 1}/{totalPages}</span>
        <Button size="small" type="text" icon={<RightOutlined />} disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
        <Divider type="vertical" />
      </>
    )}
    <Segmented size="small" value={type} onChange={setType}
      options={[{ value: 'area', icon: <AreaChartOutlined /> }, { value: 'line', icon: <LineChartOutlined /> }, { value: 'bar', icon: <BarChartOutlined /> }]} />
  </Space>
);

// Chunk pager (prev/next) for widgets that page through more items than fit.
const Pager = ({ page, totalPages, setPage }) => (
  totalPages > 1 ? (
    <Space size={4}>
      <Button size="small" type="text" icon={<LeftOutlined />} disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />
      <span style={{ fontSize: 11, color: '#94A3B8' }}>{page + 1}/{totalPages}</span>
      <Button size="small" type="text" icon={<RightOutlined />} disabled={page >= totalPages - 1} onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} />
    </Space>
  ) : null
);

// Horizontal ranked bars (top products / employees / vendors).
const RankBars = ({ data, categoryKey, valueKey, color, formatter, height = 300 }) => {
  const t = useT();
  return (
  <div style={{ height }}>
    {data.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} tickFormatter={formatter} />
          <YAxis type="category" dataKey={categoryKey} tick={{ fontSize: 11, fill: '#475569' }} tickLine={false} axisLine={false} width={110} />
          <RTooltip formatter={(v) => formatter(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
          <Bar dataKey={valueKey} fill={color} radius={[0, 5, 5, 0]} barSize={15} />
        </BarChart>
      </ResponsiveContainer>
    ) : (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description={t('dashboard.empty.noData', 'No data')} /></div>
    )}
  </div>
  );
};

// Treemap cell: each product is a rectangle sized by units sold (its share of total sales).
const TreemapCell = ({ x, y, width, height, index, name, value, depth }) => {
  const t = useT();
  // Only draw the product tiles (leaves). Skipping the root node avoids the
  // full-area overlay that made the labels look like a faint shadow.
  if (depth !== 1 || !name) return null;
  const fill = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
  // Dark text with a white halo (stroke painted behind the fill) → crisp on any tile.
  const haloText = { paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 3, strokeLinejoin: 'round', pointerEvents: 'none' };
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} style={{ fill, stroke: '#fff', strokeWidth: 2 }} />
      {width > 46 && height > 24 ? (
        <text x={x + 8} y={y + 19} fill="#0F172A" fontSize={12} fontWeight={800} style={haloText}>
          {name.length > 16 ? `${name.slice(0, 15)}…` : name}
        </text>
      ) : null}
      {width > 46 && height > 40 ? (
        <text x={x + 8} y={y + 36} fill="#1E293B" fontSize={11} fontWeight={700} style={haloText}>
          {num(value)} {t('dashboard.sub.pcs', 'pcs')}
        </text>
      ) : null}
    </g>
  );
};

const ProductTreemap = ({ data, height = 300 }) => {
  const t = useT();
  const tree = data.filter((p) => (Number(p.quantity) || 0) > 0).map((p) => ({ name: p.name, size: Number(p.quantity) || 0 }));
  return (
    <div style={{ height }}>
      {tree.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={tree} dataKey="size" stroke="#fff" isAnimationActive={false} content={<TreemapCell />}>
            <RTooltip formatter={(v) => `${num(v)} ${t('dashboard.tooltip.unitsSold', 'units sold')}`} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
          </Treemap>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description={t('dashboard.empty.noProductSales', 'No product sales')} /></div>
      )}
    </div>
  );
};

// Generic treemap cell (formatter-aware) — reads a precomputed `disp` string per node.
const GenericTreemapCell = ({ x, y, width, height, index, name, disp, depth }) => {
  if (depth !== 1 || !name) return null;
  const fill = TREEMAP_COLORS[index % TREEMAP_COLORS.length];
  const halo = { paintOrder: 'stroke', stroke: '#ffffff', strokeWidth: 3, strokeLinejoin: 'round', pointerEvents: 'none' };
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={4} style={{ fill, stroke: '#fff', strokeWidth: 2 }} />
      {width > 50 && height > 24 ? <text x={x + 8} y={y + 19} fill="#0F172A" fontSize={12} fontWeight={800} style={halo}>{name.length > 15 ? `${name.slice(0, 14)}…` : name}</text> : null}
      {width > 50 && height > 40 ? <text x={x + 8} y={y + 36} fill="#1E293B" fontSize={11} fontWeight={700} style={halo}>{disp}</text> : null}
    </g>
  );
};

const RankTreemap = ({ data, categoryKey, valueKey, formatter, height = 300 }) => {
  const t = useT();
  const tree = (data || []).filter((d) => (Number(d[valueKey]) || 0) > 0)
    .map((d) => ({ name: d[categoryKey], size: Number(d[valueKey]) || 0, disp: formatter(Number(d[valueKey]) || 0) }));
  return (
    <div style={{ height }}>
      {tree.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={tree} dataKey="size" stroke="#fff" isAnimationActive={false} content={<GenericTreemapCell />}>
            <RTooltip formatter={(v) => formatter(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
          </Treemap>
        </ResponsiveContainer>
      ) : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description={t('dashboard.empty.noData', 'No data')} /></div>}
    </div>
  );
};

// Ranked list rendered as bar / pie / treemap — user toggles, each card sets its own default.
// Bars page through long lists; pie & treemap show the top slice.
const RankCard = ({ title, icon, data, categoryKey = 'name', valueKey, color, formatter, defaultType = 'bar', pageSize = 8, height = 300, showLabels = false, radar = false }) => {
  const [type, setType] = useState(defaultType);
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil((data?.length || 0) / pageSize));
  useEffect(() => { setPage(0); }, [data?.length]);
  // Same paged slice for every mode, so the pager works in bar, pie AND treemap.
  const slice = (data || []).slice(page * pageSize, page * pageSize + pageSize);
  // Radar (spider) is opt-in per card so it only shows where it makes sense (best-sellers).
  const chartOptions = [
    ...(radar ? [{ value: 'radar', icon: <RadarChartOutlined /> }] : []),
    { value: 'bar', icon: <BarChartOutlined /> }, { value: 'pie', icon: <PieChartOutlined /> }, { value: 'treemap', icon: <AppstoreOutlined /> },
  ];
  return (
    <SectionCard
      title={title}
      icon={icon}
      extra={(
        <Space size={4}>
          {type !== 'radar' && <Pager page={page} totalPages={totalPages} setPage={setPage} />}
          <Segmented size="small" value={type} onChange={setType} options={chartOptions} />
        </Space>
      )}
    >
      {type === 'radar'
        ? (
          <ResponsiveContainer width="100%" height={height}>
            <RadarChart data={slice.map((d) => ({ name: `${d[categoryKey] ?? ''} (${formatter(Number(d[valueKey]) || 0)})`, value: Number(d[valueKey]) || 0 }))} outerRadius="70%">
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
              <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
              <Radar dataKey="value" stroke={color || 'var(--theme-primary)'} fill={color || 'var(--theme-primary)'} fillOpacity={0.35} />
              <RTooltip formatter={formatter} />
            </RadarChart>
          </ResponsiveContainer>
        )
        : type === 'pie'
        ? <Donut data={slice.map((d) => ({ label: d[categoryKey], amount: Number(d[valueKey]) || 0 }))} nameKey="label" dataKey="amount" formatter={formatter} height={height} showLabels={showLabels} />
        : type === 'treemap'
          ? <RankTreemap data={slice} categoryKey={categoryKey} valueKey={valueKey} formatter={formatter} height={height} />
          : <RankBars data={slice} categoryKey={categoryKey} valueKey={valueKey} color={color} formatter={formatter} height={height} />}
    </SectionCard>
  );
};

// A breakdown ({label,count,amount}) shown as a donut or a bar — user toggles.
const BreakdownChart = ({ data, type, color = '#2563EB', showLabels = false }) => (
  type === 'bar'
    ? <RankBars data={[...data].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).map((d) => ({ name: d.label, value: Number(d.amount) || 0 }))} categoryKey="name" valueKey="value" color={color} formatter={money} height={260} />
    : <Donut data={data} showLabels={showLabels} />
);

// Donut/bar toggle for a breakdown card's `extra` slot.
const BreakdownToolbar = ({ type, setType }) => (
  <Segmented size="small" value={type} onChange={setType}
    options={[{ value: 'donut', icon: <PieChartOutlined /> }, { value: 'bar', icon: <BarChartOutlined /> }]} />
);

// Custom slice label: a leader line to the slice, name+% anchored left/right by side.
// Tiny slices (< 4%) are left to the legend so labels never overlap or mis-point.
const RADIAN = Math.PI / 180;
const renderDonutLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (!percent) return null; // skip only zero-value slices; every real slice gets a label
  const cos = Math.cos(-RADIAN * midAngle);
  const sin = Math.sin(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + 14) * cos;
  const my = cy + (outerRadius + 14) * sin;
  const right = cos >= 0;
  const ex = mx + (right ? 1 : -1) * 12;
  const pct = percent * 100;
  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${my}`} stroke="#94A3B8" fill="none" />
      <text x={ex + (right ? 4 : -4)} y={my} textAnchor={right ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fill="#475569">
        {`${name} ${pct < 1 ? pct.toFixed(1) : pct.toFixed(0)}%`}
      </text>
    </g>
  );
};

const Donut = ({ data, nameKey = 'label', dataKey = 'amount', height = 260, formatter = money, showLabels = false }) => {
  const t = useT();
  return (
  <div style={{ height }}>
    {data.length ? (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} dataKey={dataKey} nameKey={nameKey} cx="50%" cy="50%"
            innerRadius={showLabels ? 44 : 52} outerRadius={showLabels ? 70 : 86} paddingAngle={2}
            labelLine={false}
            label={showLabels ? renderDonutLabel : false}
          >
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
          <RTooltip formatter={(v) => formatter(v)} contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    ) : (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Empty description={t('dashboard.empty.noData', 'No data')} /></div>
    )}
  </div>
  );
};

const DashboardPage = () => {
  const t = useT();
  const reportRef = useRef(null);
  const { canSeeBoard, can } = usePermissions();
  // Boards the current user may see (ADMIN: all; STAFF: per STAFF_DASHBOARD_BOARDS setting).
  const visibleBoards = useMemo(() => BOARDS.filter((b) => canSeeBoard(b.value)), [canSeeBoard]);
  const [board, setBoard] = useState('overview');
  // If the selected board isn't allowed (or default 'overview' is hidden), fall back to the first allowed.
  useEffect(() => {
    if (visibleBoards.length && !visibleBoards.some((b) => b.value === board)) {
      setBoard(visibleBoards[0].value);
    }
  }, [visibleBoards, board]);
  const [range, setRange] = useState(QUICK['This Month']());
  const [filterLabel, setFilterLabel] = useState('This Month');
  const [filterOpen, setFilterOpen] = useState(false);
  const [revType, setRevType] = useState('area');   // revenue trend default: area
  const [expType, setExpType] = useState('bar');    // monthly spend default: bar
  const [prodChart, setProdChart] = useState('radar'); // best-sellers default: spider/radar
  const [payType, setPayType] = useState('donut');  // payment modes default: donut
  const [catType, setCatType] = useState('donut');  // expense category default: donut
  // Show names on pie slices — toggled from Settings (stored per browser).
  const [showLabels, setShowLabels] = useState(() => { try { return localStorage.getItem('skr_chart_labels') !== 'false'; } catch { return true; } });
  useEffect(() => {
    const h = () => { try { setShowLabels(localStorage.getItem('skr_chart_labels') !== 'false'); } catch { /* ignore */ } };
    window.addEventListener('chart-labels-changed', h);
    window.addEventListener('storage', h);
    return () => { window.removeEventListener('chart-labels-changed', h); window.removeEventListener('storage', h); };
  }, []);
  const [revPage, setRevPage] = useState(0);
  const [expPage, setExpPage] = useState(0);

  const fromDate = range?.[0]?.format('YYYY-MM-DD');
  const toDate = range?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboardOverview', fromDate, toDate],
    queryFn: () => dashboardService.getOverview(fromDate, toDate),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always', // auto-refresh whenever the dashboard is opened
  });

  // Recent sales for the selected range (server-side paginated, newest first).
  const [salesPage, setSalesPage] = useState(0);
  const [salesSize, setSalesSize] = useState(10);
  useEffect(() => { setSalesPage(0); }, [fromDate, toDate]);
  const { data: salesPageData } = useQuery({
    queryKey: ['dashRecentSales', fromDate, toDate, salesPage, salesSize],
    queryFn: () => salesService.getSales({ page: salesPage, size: salesSize, fromDate, toDate }),
    enabled: board === 'overview' || board === 'sales',
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const recentRows = salesPageData?.content || [];
  const recentTotal = salesPageData?.totalElements ?? recentRows.length;

  // Catalogue + vendor counts (current snapshots) for the overview KPIs.
  const { data: productsList } = useQuery({
    queryKey: ['dashProducts'], queryFn: productService.getProducts, enabled: board === 'overview' && can('products', 'view'), staleTime: 5 * 60 * 1000,
  });
  const { data: vendorsList } = useQuery({
    queryKey: ['dashVendors'], queryFn: vendorService.getVendors, enabled: board === 'overview' && can('investment', 'view'), staleTime: 0, refetchOnMount: 'always',
  });
  const productCount = (() => { const a = productsList?.data ?? productsList?.content ?? productsList; return Array.isArray(a) ? a.length : 0; })();
  const vendorCount = (() => { const a = vendorsList?.data ?? vendorsList?.content ?? vendorsList; return Array.isArray(a) ? a.length : 0; })();

  // Inventory board data (current snapshot).
  const { data: inventoryData, isFetching: invFetching } = useQuery({
    queryKey: ['dashboardInventory'],
    queryFn: async () => {
      const [inv, alerts] = await Promise.all([
        axiosInstance.get('/inventory', { params: { page: 0, size: 1000 } }),
        axiosInstance.get('/inventory/alerts'),
      ]);
      return {
        products: inv.data?.content || [],
        alerts: Array.isArray(alerts.data) ? alerts.data : (alerts.data?.content || []),
      };
    },
    enabled: board === 'inventory' && can('inventory', 'view'),
    keepPreviousData: true,
  });

  // Overview daily report (date-wise money in/out).
  const { data: dailyRaw } = useQuery({
    queryKey: ['dashboardDaily', fromDate, toDate],
    queryFn: () => dashboardService.getDaily(fromDate, toDate),
    enabled: board === 'overview' || board === 'sales',
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Expenses board data (date-ranged investments), aggregated client-side.
  const { data: investmentsRaw, isFetching: expFetching } = useQuery({
    queryKey: ['dashboardInvestments', fromDate, toDate],
    queryFn: async () => {
      const res = await investmentService.getInvestments({ fromDate, toDate });
      return res?.data || [];
    },
    enabled: board === 'expenses' && can('investment', 'view'),
    keepPreviousData: true,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Maps a stored range key (English, used for logic) to its translated display label.
  const rangeLabel = (k) => {
    const map = {
      'Today': 'dashboard.range.today', 'This Week': 'dashboard.range.thisWeek',
      'This Month': 'dashboard.range.thisMonth', 'This Quarter': 'dashboard.range.thisQuarter',
      'This Year': 'dashboard.range.thisYear', 'All Time': 'dashboard.range.allTime',
      'Custom': 'dashboard.range.custom',
    };
    return map[k] ? t(map[k], k) : k;
  };

  const applyQuick = (key) => { setRange(QUICK[key]()); setFilterLabel(key); setFilterOpen(false); };
  const applyMonth = (m) => { if (!m) return; setRange([m.startOf('month'), m.endOf('month')]); setFilterLabel(m.format('MMM YYYY')); setFilterOpen(false); };
  const applyCustom = (val) => { if (!val || !val[0] || !val[1]) return; setRange([val[0].startOf('day'), val[1].endOf('day')]); setFilterLabel('Custom'); setFilterOpen(false); };

  // ── Derived: sales/overview ──────────────────────────
  const revenueSeries = useMemo(
    () => (data?.revenueSeries || []).map((p) => ({ ...p, label: dayjs(p.date).format('DD MMM'), revenue: Number(p.revenue) || 0 })),
    [data]
  );
  const revTotalPages = Math.max(1, Math.ceil(revenueSeries.length / PAGE_SIZE));
  useEffect(() => { setRevPage(Math.max(0, Math.ceil(revenueSeries.length / PAGE_SIZE) - 1)); }, [revenueSeries.length]);
  const pagedRevenue = useMemo(() => revenueSeries.slice(revPage * PAGE_SIZE, revPage * PAGE_SIZE + PAGE_SIZE), [revenueSeries, revPage]);

  const paymentBreakdown = data?.paymentBreakdown || [];
  const topProducts = useMemo(() => (data?.topProducts || []).map((p) => ({ ...p, revenue: Number(p.revenue) || 0, quantity: Number(p.quantity) || 0 })), [data]);
  // Top 10 best-sellers for the "Top Products" card (all chart modes).
  const top10Products = useMemo(() => topProducts.slice(0, 10), [topProducts]);
  const topEmployees = useMemo(() => (data?.topEmployees || []).map((e) => ({ ...e, quantity: Number(e.quantity) || 0, earnings: Number(e.earnings) || 0 })), [data]);
  const recentSales = data?.recentSales || [];
  const topCustomers = useMemo(() => (data?.topCustomers || []).map((c) => ({ ...c, orders: Number(c.orders) || 0, spend: Number(c.spend) || 0 })), [data]);

  // ── Derived: expenses ────────────────────────────────
  const investments = investmentsRaw || [];
  const expenseByType = useMemo(() => {
    const m = {};
    investments.forEach((i) => { const k = i.investmentType || 'OTHER'; m[k] = (m[k] || 0) + (Number(i.grandTotal) || 0); });
    return Object.entries(m).map(([label, amount]) => ({ label: label.charAt(0) + label.slice(1).toLowerCase(), amount }));
  }, [investments]);
  const expenseMonthly = useMemo(() => {
    const m = {};
    investments.forEach((i) => { if (!i.purchaseDate) return; const k = dayjs(i.purchaseDate).format('YYYY-MM'); m[k] = (m[k] || 0) + (Number(i.grandTotal) || 0); });
    return Object.keys(m).sort().map((k) => ({ key: k, label: dayjs(k + '-01').format('MMM YY'), amount: m[k] }));
  }, [investments]);
  const expTotalPages = Math.max(1, Math.ceil(expenseMonthly.length / PAGE_SIZE));
  useEffect(() => { setExpPage(Math.max(0, Math.ceil(expenseMonthly.length / PAGE_SIZE) - 1)); }, [expenseMonthly.length]);
  const pagedExpenses = useMemo(() => expenseMonthly.slice(expPage * PAGE_SIZE, expPage * PAGE_SIZE + PAGE_SIZE), [expenseMonthly, expPage]);
  const topVendors = useMemo(() => {
    const m = {};
    investments.forEach((i) => { const k = i.vendorName || '—'; m[k] = (m[k] || 0) + (Number(i.grandTotal) || 0); });
    return Object.entries(m).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
  }, [investments]);
  const expenseTotals = useMemo(() => {
    const total = investments.reduce((s, i) => s + (Number(i.grandTotal) || 0), 0);
    const paid = investments.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
    return { total, paid, due: Math.max(0, total - paid), count: investments.length };
  }, [investments]);

  // ── Derived: inventory ───────────────────────────────
  const invProducts = inventoryData?.products || [];
  const invAlerts = inventoryData?.alerts || [];
  const invByValue = useMemo(
    () => [...invProducts].map((p) => ({ name: p.productName, value: Number(p.stockValue) || 0 })).sort((a, b) => b.value - a.value).slice(0, 8),
    [invProducts]
  );

  const handleExportExcel = () => {
    if (!data) return;
    try {
      exportToExcel([
        { name: 'Summary', rows: [{
          'From Date': data.fromDate, 'To Date': data.toDate, 'Sales Orders': data.salesCount,
          'Sales Revenue': Number(data.salesRevenue) || 0, 'Discount': Number(data.salesDiscount) || 0,
          'Avg Order Value': Number(data.avgOrderValue) || 0, 'Gross Profit': Number(data.grossProfit) || 0,
          'Production Wages': Number(data.productionAmount) || 0, 'Investment / Expense': Number(data.investmentTotal) || 0,
          'Net Cash Flow': Number(data.netProfit) || 0, 'Inventory Value': Number(data.inventoryStockValue) || 0,
          'Inventory Units': Number(data.inventoryUnits) || 0, 'Low Stock': data.lowStockCount,
          'Active Employees': data.activeEmployees, 'Total Employees': data.totalEmployees,
        }] },
        { name: 'Revenue', rows: revenueSeries.map((r) => ({ Date: r.date, Revenue: r.revenue, Orders: r.orders })) },
        { name: 'Top Products', rows: topProducts.map((r) => ({ Product: r.name, Quantity: r.quantity, Revenue: r.revenue })) },
        { name: 'Employees', rows: topEmployees.map((r) => ({ Employee: r.name, Pieces: r.quantity, Earnings: r.earnings })) },
      ], `SKR-Dashboard_${fromDate}_to_${toDate}`);
      notification.success({ message: t('dashboard.export.excelExported', 'Excel exported'), placement: 'topRight' });
    } catch (e) { notification.error({ message: t('dashboard.export.excelFailed', 'Excel export failed'), description: e.message, placement: 'topRight' }); }
  };

  const [exportingPdf, setExportingPdf] = useState(false);
  const handleExportPdf = async () => {
    try { setExportingPdf(true); await exportElementToPdf(reportRef.current, `SKR-Dashboard_${fromDate}_to_${toDate}`); notification.success({ message: t('dashboard.export.pdfExported', 'PDF exported'), placement: 'topRight' }); }
    catch (e) { notification.error({ message: t('dashboard.export.pdfFailed', 'PDF export failed'), description: e.message, placement: 'topRight' }); }
    finally { setExportingPdf(false); }
  };

  const downloadMenu = {
    items: [
      { key: 'excel', icon: <FileExcelOutlined style={{ color: '#059669' }} />, label: t('dashboard.export.downloadExcel', 'Download Excel'), onClick: handleExportExcel },
      { key: 'pdf', icon: <FilePdfOutlined style={{ color: '#DC2626' }} />, label: exportingPdf ? t('dashboard.export.preparingPdf', 'Preparing PDF…') : t('dashboard.export.downloadPdf', 'Download PDF'), onClick: handleExportPdf, disabled: exportingPdf },
    ],
  };

  const filterPanel = (
    <div style={{ width: 300 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>{t('dashboard.filter.quickRanges', 'Quick ranges')}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {Object.keys(QUICK).map((k) => (
          <Button key={k} size="small" type={filterLabel === k ? 'primary' : 'default'} onClick={() => applyQuick(k)} style={{ textAlign: 'left' }}>{rangeLabel(k)}</Button>
        ))}
      </div>
      <Divider style={{ margin: '12px 0' }} />
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>{t('dashboard.filter.particularMonth', 'Particular month')}</div>
      <DatePicker picker="month" style={{ width: '100%' }} onChange={applyMonth} placeholder={t('dashboard.filter.selectMonthYear', 'Select month & year')} />
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', margin: '12px 0 6px' }}>{t('dashboard.filter.customRange', 'Custom date range')}</div>
      <RangePicker style={{ width: '100%' }} format="DD MMM YY" onChange={applyCustom} allowClear={false} />
    </div>
  );

  const kpi = (icon, color, label, value, sub) => ({ icon, color, label, value, sub });

  // Per-board KPI sets.
  const kpiSet = () => {
    if (!data) return [];
    if (board === 'sales') return [
      kpi(<DollarCircleOutlined />, '#2563EB', t('dashboard.kpi.revenue', 'Revenue'), money(data.salesRevenue), `${num(data.salesCount)} ${t('dashboard.sub.orders', 'orders')}`),
      kpi(<DollarCircleOutlined />, '#047857', t('dashboard.kpi.received', 'Received'), money(data.salesReceived), `${money(data.salesDue)} ${t('dashboard.sub.due', 'due')}`),
      kpi(<WalletOutlined />, '#F59E0B', t('dashboard.kpi.discountGiven', 'Discount Given'), money(data.salesDiscount), t('dashboard.sub.inRange', 'in range')),
      kpi(<FundOutlined />, (Number(data.grossProfit) || 0) >= 0 ? '#10B981' : '#EF4444', t('dashboard.kpi.grossProfit', 'Gross Profit'), money(data.grossProfit), t('dashboard.sub.revenueMinusCogs', 'revenue − COGS')),
      kpi(<TeamOutlined />, '#6366F1', t('dashboard.kpi.newCustomers', 'New Customers'), num(data.newCustomerCount), t('dashboard.sub.firstOrderInRange', 'first order in range')),
    ];
    if (board === 'inventory') return [
      kpi(<InboxOutlined />, '#06B6D4', t('dashboard.kpi.stockValue', 'Stock Value'), money(data.inventoryStockValue), t('dashboard.sub.atCost', 'at cost')),
      kpi(<ShopOutlined />, '#2563EB', t('dashboard.kpi.units', 'Units'), num(data.inventoryUnits), t('dashboard.sub.inStock', 'in stock')),
      kpi(<FundOutlined />, '#8B5CF6', t('dashboard.kpi.products', 'Products'), num(invProducts.length), t('dashboard.sub.inCatalogue', 'in catalogue')),
      kpi(<WarningOutlined />, (invAlerts.length || 0) > 0 ? '#EF4444' : '#10B981', t('dashboard.kpi.lowStock', 'Low Stock'), num(invAlerts.length), t('dashboard.sub.toReorder', 'to reorder')),
    ];
    if (board === 'expenses') return [
      kpi(<WalletOutlined />, '#F59E0B', t('dashboard.kpi.totalSpend', 'Total Spend'), money(expenseTotals.total), `${num(expenseTotals.count)} ${t('dashboard.sub.entries', 'entries')}`),
      kpi(<DollarCircleOutlined />, '#10B981', t('dashboard.kpi.paid', 'Paid'), money(expenseTotals.paid), t('dashboard.sub.settled', 'settled')),
      kpi(<RiseOutlined />, (expenseTotals.due || 0) > 0 ? '#EF4444' : '#10B981', t('dashboard.kpi.due', 'Due'), money(expenseTotals.due), t('dashboard.sub.outstanding', 'outstanding')),
      kpi(<ShopOutlined />, '#8B5CF6', t('dashboard.kpi.vendors', 'Vendors'), num(topVendors.length), t('dashboard.sub.billed', 'billed')),
    ];
    if (board === 'employees') return [
      kpi(<ToolOutlined />, '#8B5CF6', t('dashboard.kpi.pieceRatePay', 'Piece-Rate Pay'), money(data.productionAmount), `${num(data.productionQty)} ${t('dashboard.sub.pcsMade', 'pcs made')}`),
      kpi(<TeamOutlined />, '#6366F1', t('dashboard.kpi.activeStaff', 'Active Staff'), num(data.activeEmployees), `${t('dashboard.sub.of', 'of')} ${num(data.totalEmployees)} ${t('dashboard.sub.total', 'total')}`),
      kpi(<FundOutlined />, '#2563EB', t('dashboard.kpi.productionEntries', 'Production Entries'), num(data.productionEntries), t('dashboard.sub.inRange', 'in range')),
      kpi(<RiseOutlined />, '#10B981', t('dashboard.kpi.avgPerWorker', 'Avg / Worker'), money(data.activeEmployees ? (Number(data.productionAmount) || 0) / data.activeEmployees : 0), t('dashboard.sub.pieceRate', 'piece-rate')),
    ];
    // overview — row 1: money flow (all date-ranged); row 2: current snapshots
    const totalSpend = (Number(data.investmentTotal) || 0) + (Number(data.productionAmount) || 0);
    return [
      // Row 1
      kpi(<WalletOutlined />, '#B45309', t('dashboard.kpi.totalSpend', 'Total Spend'), money(totalSpend), t('dashboard.sub.expensePlusWages', 'expense + wages')),
      kpi(<ShopOutlined />, '#F59E0B', t('dashboard.kpi.expenses', 'Expenses'), money(data.investmentTotal), `${money(data.expensesDue)} ${t('dashboard.sub.due', 'due')}`),
      kpi(<ToolOutlined />, '#8B5CF6', t('dashboard.kpi.employeeEarning', 'Employee Earning'), money(data.productionAmount), `${num(data.productionQty)} ${t('dashboard.sub.pcs', 'pcs')}`),
      kpi(<DollarCircleOutlined />, '#2563EB', t('dashboard.kpi.salesRevenue', 'Sales Revenue'), money(data.salesRevenue), `${num(data.salesCount)} ${t('dashboard.sub.orders', 'orders')}`),
      kpi(<DollarCircleOutlined />, '#047857', t('dashboard.kpi.received', 'Received'), money(data.salesReceived), `${money(data.salesDue)} ${t('dashboard.sub.due', 'due')}`),
      kpi(<FundOutlined />, (Number(data.grossProfit) || 0) >= 0 ? '#10B981' : '#EF4444', t('dashboard.kpi.salesProfit', 'Sales Profit'), money(data.grossProfit), t('dashboard.sub.revenueMinusCogs', 'revenue − COGS')),
      kpi(<RiseOutlined />, (Number(data.netProfit) || 0) >= 0 ? '#10B981' : '#EF4444', t('dashboard.kpi.netCashFlow', 'Net Cash Flow'), money(data.netProfit), t('dashboard.sub.salesMinusSpend', 'sales − spend')),
      // Row 2
      kpi(<InboxOutlined />, '#06B6D4', t('dashboard.kpi.inventoryValue', 'Inventory Value'), money(data.inventoryStockValue), `${num(data.inventoryUnits)} ${t('dashboard.sub.units', 'units')}`),
      kpi(<ShopOutlined />, '#0EA5E9', t('dashboard.kpi.totalProducts', 'Total Products'), num(productCount), t('dashboard.sub.inCatalogue', 'in catalogue')),
      kpi(<WarningOutlined />, (data.lowStockCount || 0) > 0 ? '#EF4444' : '#10B981', t('dashboard.kpi.lowStock', 'Low Stock'), num(data.lowStockCount), t('dashboard.sub.toReorder', 'to reorder')),
      kpi(<TeamOutlined />, '#6366F1', t('dashboard.kpi.activeStaff', 'Active Staff'), num(data.activeEmployees), `${t('dashboard.sub.of', 'of')} ${num(data.totalEmployees)} ${t('dashboard.sub.total', 'total')}`),
      kpi(<TeamOutlined />, '#8B5CF6', t('dashboard.kpi.totalVendors', 'Total Vendors'), num(vendorCount), t('dashboard.sub.registered', 'registered')),
    ];
  };

  // ── Overview daily report ────────────────────────────
  const dailyRows = dailyRaw || [];
  const dailyTotals = useMemo(() => dailyRows.reduce((a, r) => {
    a.investment += Number(r.investment) || 0;
    a.wages += Number(r.wages) || 0;
    a.sales += Number(r.sales) || 0;
    a.cogs += Number(r.cogs) || 0;
    return a;
  }, { investment: 0, wages: 0, sales: 0, cogs: 0 }), [dailyRows]);
  const spendTotal = dailyTotals.investment + dailyTotals.wages;
  const netProfit = dailyTotals.sales - spendTotal;

  const dailyDate = (v) => (v ? dayjs(v).format('DD MMM YY') : '—');
  const spendCols = [
    { title: t('common.date', 'Date'), dataIndex: 'date', key: 'd', render: dailyDate },
    { title: t('dashboard.col.investment', 'Investment'), dataIndex: 'investment', key: 'i', align: 'right', render: (v) => money(v) },
    { title: t('dashboard.col.employeeEarnings', 'Employee Earnings'), dataIndex: 'wages', key: 'w', align: 'right', render: (v) => money(v) },
    { title: t('common.total', 'Total'), key: 't', align: 'right', render: (_, r) => <b>{money((Number(r.investment) || 0) + (Number(r.wages) || 0))}</b> },
  ];
  const revCols = [
    { title: t('common.date', 'Date'), dataIndex: 'date', key: 'd', render: dailyDate },
    { title: t('dashboard.col.sales', 'Sales'), dataIndex: 'sales', key: 's', align: 'right', render: (v) => money(v) },
    { title: t('dashboard.col.cogsCost', 'COGS (cost)'), dataIndex: 'cogs', key: 'c', align: 'right', render: (v) => <span style={{ color: '#64748B' }}>{money(v)}</span> },
    { title: t('dashboard.col.grossProfit', 'Gross Profit'), key: 'g', align: 'right', render: (_, r) => { const g = (Number(r.sales) || 0) - (Number(r.cogs) || 0); return <b style={{ color: g >= 0 ? '#047857' : '#B91C1C' }}>{money(g)}</b>; } },
  ];

  const recentColumns = [
    { title: t('dashboard.col.invoice', 'Invoice'), dataIndex: 'invoiceNo', key: 'invoiceNo', render: (v) => <span style={{ fontWeight: 600, color: '#1E293B' }}>{v}</span> },
    { title: t('dashboard.col.customer', 'Customer'), dataIndex: 'customerName', key: 'customerName', render: (v) => v || '—' },
    { title: t('common.amount', 'Amount'), key: 'amount', align: 'right', render: (_, r) => <span style={{ fontWeight: 700, color: '#10B981' }}>{money(r.grandTotal ?? r.amount)}</span> },
    { title: t('dashboard.col.mode', 'Mode'), dataIndex: 'paymentMode', key: 'paymentMode', render: (v) => v || '—' },
    { title: t('common.status', 'Status'), dataIndex: 'paymentStatus', key: 'paymentStatus', render: (v) => <Tag color={v === 'PAID' ? 'green' : v === 'PENDING' ? 'orange' : 'default'}>{(v || '').replace(/_/g, ' ') || '—'}</Tag> },
    { title: t('common.date', 'Date'), key: 'date', render: (_, r) => { const d = r.saleDate ?? r.date; return d ? dayjs(d).format('DD MMM YYYY') : '—'; } },
  ];

  // Per-board KPI tiles-per-row: overview 6, sales 5, others 4.
  const kpiBasis = board === 'overview' ? 'calc(16.66% - 9px)' : board === 'sales' ? 'calc(20% - 8px)' : 'calc(25% - 8px)';

  const revToolbar = <ChartToolbar type={revType} setType={setRevType} page={revPage} totalPages={revTotalPages} setPage={setRevPage} />;
  const expToolbar = <ChartToolbar type={expType} setType={setExpType} page={expPage} totalPages={expTotalPages} setPage={setExpPage} />;

  const busy = isLoading || (board === 'inventory' && invFetching && !inventoryData) || (board === 'expenses' && expFetching && !investmentsRaw);

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontFamily: '"Inter", "Helvetica", "Arial", sans-serif' } }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Toolbar: board dropdown + range filter + refresh + export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Space size={10} wrap>
            <Select
              value={board}
              onChange={setBoard}
              style={{ width: 190 }}
              size="large"
              options={visibleBoards.map((b) => ({ value: b.value, label: <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>{b.icon}{t(`dashboard.board.${b.value}`, b.label)}</span> }))}
            />
            {data && (
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                {dayjs(data.fromDate).format('DD MMM')} – {dayjs(data.toDate).format('DD MMM YYYY')}
              </span>
            )}
          </Space>
          <Space size={8} wrap>
            <Popover trigger="click" placement="bottomRight" open={filterOpen} onOpenChange={setFilterOpen} content={filterPanel}>
              <Button icon={<FilterOutlined />} loading={isFetching}>{rangeLabel(filterLabel)}</Button>
            </Popover>
            <Dropdown menu={downloadMenu} trigger={['click']} placement="bottomRight" disabled={!data}><Button icon={<MoreOutlined />} /></Dropdown>
          </Space>
        </div>

        <Spin spinning={busy}>
          <div ref={reportRef} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* KPI grid (board-specific): 6 per row overview, 5 sales, 4 others */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {kpiSet().map((k) => (
                <div key={k.label} style={{ flex: `1 1 ${kpiBasis}`, minWidth: 148 }}><KpiTile {...k} /></div>
              ))}
            </div>
            {!data && !isLoading ? <Card style={cardStyle}><Empty description={t('dashboard.empty.noData', 'No data')} /></Card> : null}

            {/* ── OVERVIEW ── */}
            {board === 'overview' && (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={16}>
                    <SectionCard title={t('dashboard.section.revenueTrend', 'Sales Revenue Trend (daily)')} icon={<LineChartOutlined style={{ color: '#2563EB' }} />} extra={revToolbar}>
                      <div style={{ height: 260 }}><TrendChart series={pagedRevenue} dataKey="revenue" color="#2563EB" type={revType} formatter={money} /></div>
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={8}>
                    <SectionCard title={t('dashboard.section.receivedByMode', 'Received by Payment Mode (+ Due)')} icon={<DollarCircleOutlined style={{ color: '#10B981' }} />} extra={<BreakdownToolbar type={payType} setType={setPayType} />}><BreakdownChart data={paymentBreakdown} type={payType} color="#10B981" showLabels={showLabels} /></SectionCard>
                  </Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}>
                    <SectionCard
                      title={t('dashboard.section.topProductsQty', 'Top Products (by qty)')}
                      icon={<InboxOutlined style={{ color: '#8B5CF6' }} />}
                      extra={(
                        <Segmented size="small" value={prodChart} onChange={setProdChart}
                          options={[{ value: 'radar', icon: <RadarChartOutlined /> }, { value: 'treemap', icon: <AppstoreOutlined /> }, { value: 'bar', icon: <BarChartOutlined /> }]} />
                      )}
                    >
                      {prodChart === 'radar'
                        ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={top10Products.map((d) => ({ name: `${d.name} (${num(d.quantity)})`, value: Number(d.quantity) || 0 }))} outerRadius="70%">
                              <PolarGrid stroke="#E2E8F0" />
                              <PolarAngleAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                              <PolarRadiusAxis tick={{ fontSize: 10, fill: '#94A3B8' }} />
                              <Radar dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.35} />
                              <RTooltip formatter={num} />
                            </RadarChart>
                          </ResponsiveContainer>
                        )
                        : prodChart === 'bar'
                        ? <RankBars data={top10Products} categoryKey="name" valueKey="quantity" color="#8B5CF6" formatter={num} />
                        : <ProductTreemap data={top10Products} />}
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.employeeProductivity', 'Employee Productivity — pieces produced')} icon={<TeamOutlined style={{ color: '#6366F1' }} />} data={topEmployees} valueKey="quantity" color="#6366F1" formatter={num} /></Col>
                </Row>
                <SectionCard title={`${t('dashboard.section.recentSales', 'Recent Sales')} (${num(recentTotal)})`} icon={<ShoppingCartOutlined style={{ color: '#0EA5E9' }} />} bodyPad={0}>
                  <Table
                    dataSource={recentRows}
                    columns={recentColumns}
                    rowKey={(r) => r.saleId || r.invoiceNo}
                    size="small"
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description={t('dashboard.empty.noSalesInRange', 'No sales in this range')} /> }}
                    pagination={{
                      current: salesPage + 1,
                      pageSize: salesSize,
                      total: recentTotal,
                      size: 'small',
                      showSizeChanger: true,
                      pageSizeOptions: [10, 20, 50, 100],
                      showTotal: (tot) => `${num(tot)} ${t('dashboard.table.salesCountSuffix', 'sales')}`,
                      onChange: (p, s) => { setSalesPage(p - 1); setSalesSize(s); },
                    }}
                  />
                </SectionCard>

                {/* Date-wise money in / out */}
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.dailySpend', 'Daily Spend (Investment + Wages)')} icon={<WalletOutlined style={{ color: '#F59E0B' }} />} bodyPad={0}>
                      <Table
                        dataSource={dailyRows} columns={spendCols} rowKey={(r) => `s-${r.date}`} size="small"
                        pagination={{ pageSize: 7, size: 'small', hideOnSinglePage: true }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.noSpendInRange', 'No spend in this range')} /> }}
                        summary={() => (
                          <Table.Summary fixed>
                            <Table.Summary.Row style={{ background: '#FFFBEB' }}>
                              <Table.Summary.Cell index={0}><b>{t('common.total', 'Total')}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={1} align="right"><b>{money(dailyTotals.investment)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={2} align="right"><b>{money(dailyTotals.wages)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={3} align="right"><b>{money(spendTotal)}</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        )}
                      />
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.dailyRevenue', 'Daily Revenue (Sales vs Cost)')} icon={<DollarCircleOutlined style={{ color: '#10B981' }} />} bodyPad={0}>
                      <Table
                        dataSource={dailyRows} columns={revCols} rowKey={(r) => `r-${r.date}`} size="small"
                        pagination={{ pageSize: 7, size: 'small', hideOnSinglePage: true }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.noSalesInRange', 'No sales in this range')} /> }}
                        summary={() => (
                          <Table.Summary fixed>
                            <Table.Summary.Row style={{ background: '#ECFDF5' }}>
                              <Table.Summary.Cell index={0}><b>{t('common.total', 'Total')}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={1} align="right"><b>{money(dailyTotals.sales)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={2} align="right"><b>{money(dailyTotals.cogs)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={3} align="right"><b>{money(dailyTotals.sales - dailyTotals.cogs)}</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        )}
                      />
                    </SectionCard>
                  </Col>
                </Row>

              </>
            )}

            {/* ── SALES ── */}
            {board === 'sales' && (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={16}>
                    <SectionCard title={t('dashboard.section.revenueTrend', 'Sales Revenue Trend (daily)')} icon={<LineChartOutlined style={{ color: '#2563EB' }} />} extra={revToolbar}>
                      <div style={{ height: 260 }}><TrendChart series={pagedRevenue} dataKey="revenue" color="#2563EB" type={revType} formatter={money} /></div>
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={8}>
                    <SectionCard title={t('dashboard.section.receivedByMode', 'Received by Payment Mode (+ Due)')} icon={<DollarCircleOutlined style={{ color: '#10B981' }} />} extra={<BreakdownToolbar type={payType} setType={setPayType} />}><BreakdownChart data={paymentBreakdown} type={payType} color="#10B981" showLabels={showLabels} /></SectionCard>
                  </Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.bestSelling', 'Best-Selling Products (units sold)')} icon={<InboxOutlined style={{ color: '#8B5CF6' }} />} data={topProducts} valueKey="quantity" color="#8B5CF6" formatter={num} radar defaultType="radar" /></Col>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.highestRevenue', 'Highest-Revenue Products')} icon={<DollarCircleOutlined style={{ color: '#2563EB' }} />} data={[...topProducts].sort((a, b) => b.revenue - a.revenue)} valueKey="revenue" color="#2563EB" formatter={money} defaultType="bar" /></Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}>
                    <RankCard showLabels={showLabels} title={t('dashboard.section.mostVisited', 'Most Visited Customers — by orders')} icon={<TeamOutlined style={{ color: '#6366F1' }} />} data={topCustomers} valueKey="orders" color="#6366F1" formatter={num} defaultType="pie" />
                  </Col>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.topCustomers', 'Top Customers (orders & spend)')} icon={<TeamOutlined style={{ color: '#8B5CF6' }} />} bodyPad={0}>
                      <Table
                        dataSource={topCustomers} rowKey={(r, i) => `${r.mobile}-${i}`} size="small"
                        pagination={false} scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.noCustomersInRange', 'No customers in range')} /> }}
                        columns={[
                          { title: t('dashboard.col.customer', 'Customer'), dataIndex: 'name', key: 'n', render: (v) => <span style={{ fontWeight: 600 }}>{v || t('dashboard.table.walkIn', 'Walk-in')}</span> },
                          { title: t('dashboard.col.mobile', 'Mobile'), dataIndex: 'mobile', key: 'm', render: (v) => v || '—' },
                          { title: t('dashboard.col.orders', 'Orders'), dataIndex: 'orders', key: 'o', align: 'right', render: (v) => num(v) },
                          { title: t('dashboard.col.spend', 'Spend'), dataIndex: 'spend', key: 's', align: 'right', render: (v) => <b>{money(v)}</b> },
                        ]}
                      />
                    </SectionCard>
                  </Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}>
                    <SectionCard title={`${t('dashboard.section.recentSales', 'Recent Sales')} (${num(recentTotal)})`} icon={<ShoppingCartOutlined style={{ color: '#0EA5E9' }} />} bodyPad={0}>
                      <Table
                        dataSource={recentRows} columns={recentColumns} rowKey={(r) => r.saleId || r.invoiceNo} size="small"
                        scroll={{ x: 'max-content' }} locale={{ emptyText: <Empty description={t('dashboard.empty.noSalesInRange', 'No sales in this range')} /> }}
                        pagination={{ current: salesPage + 1, pageSize: salesSize, total: recentTotal, size: 'small', showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100], showTotal: (tot) => `${num(tot)} ${t('dashboard.table.salesCountSuffix', 'sales')}`, onChange: (p, s) => { setSalesPage(p - 1); setSalesSize(s); } }}
                      />
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.dailyRevenue', 'Daily Revenue (Sales vs Cost)')} icon={<DollarCircleOutlined style={{ color: '#10B981' }} />} bodyPad={0}>
                      <Table
                        dataSource={dailyRows} columns={revCols} rowKey={(r) => `sr-${r.date}`} size="small"
                        pagination={{ pageSize: 10, size: 'small', hideOnSinglePage: true }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.noSalesInRange', 'No sales in this range')} /> }}
                        summary={() => (
                          <Table.Summary fixed>
                            <Table.Summary.Row style={{ background: '#ECFDF5' }}>
                              <Table.Summary.Cell index={0}><b>{t('common.total', 'Total')}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={1} align="right"><b>{money(dailyTotals.sales)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={2} align="right"><b>{money(dailyTotals.cogs)}</b></Table.Summary.Cell>
                              <Table.Summary.Cell index={3} align="right"><b>{money(dailyTotals.sales - dailyTotals.cogs)}</b></Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        )}
                      />
                    </SectionCard>
                  </Col>
                </Row>
              </>
            )}

            {/* ── INVENTORY ── */}
            {board === 'inventory' && (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.topProductsByStockValue', 'Top Products by Stock Value')} icon={<InboxOutlined style={{ color: '#06B6D4' }} />}><RankBars data={invByValue} categoryKey="name" valueKey="value" color="#06B6D4" formatter={money} /></SectionCard>
                  </Col>
                  <Col xs={24} lg={12}>
                    <SectionCard title={`${t('dashboard.section.lowStock', 'Low Stock')} (${invAlerts.length})`} icon={<WarningOutlined style={{ color: '#EF4444' }} />} bodyPad={0}>
                      <Table
                        dataSource={invAlerts} rowKey={(r) => r.productId} size="small"
                        pagination={{ pageSize: 6, size: 'small', hideOnSinglePage: true }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.nothingLow', 'Nothing low on stock')} /> }}
                        columns={[
                          { title: t('dashboard.col.product', 'Product'), dataIndex: 'productName', key: 'p' },
                          { title: t('dashboard.col.inStock', 'In Stock'), dataIndex: 'currentStock', key: 's', align: 'right', render: (v) => <span style={{ fontWeight: 700, color: '#DC2626' }}>{num(v)}</span> },
                          { title: t('dashboard.col.threshold', 'Threshold'), dataIndex: 'threshold', key: 't', align: 'right', render: (v) => num(v) },
                        ]}
                      />
                    </SectionCard>
                  </Col>
                </Row>
                <SectionCard title={t('dashboard.section.stockOnHand', 'Stock on Hand')} icon={<ShopOutlined style={{ color: '#2563EB' }} />} bodyPad={0}>
                  <Table
                    dataSource={invProducts} rowKey={(r) => r.productId} size="small"
                    pagination={{ defaultPageSize: 10, size: 'small', showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description={t('dashboard.empty.noProducts', 'No products')} /> }}
                    columns={[
                      { title: t('dashboard.col.product', 'Product'), dataIndex: 'productName', key: 'p', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                      { title: t('dashboard.col.inStock', 'In Stock'), dataIndex: 'currentStock', key: 's', align: 'right', sorter: (a, b) => (a.currentStock || 0) - (b.currentStock || 0), render: (v) => num(v) },
                      { title: t('dashboard.col.avgCost', 'Avg Cost'), dataIndex: 'averageCost', key: 'c', align: 'right', render: (v) => money(v) },
                      { title: t('dashboard.col.stockValue', 'Stock Value'), dataIndex: 'stockValue', key: 'v', align: 'right', defaultSortOrder: 'descend', sorter: (a, b) => (a.stockValue || 0) - (b.stockValue || 0), render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{money(v)}</span> },
                    ]}
                  />
                </SectionCard>
              </>
            )}

            {/* ── EXPENSES ── */}
            {board === 'expenses' && (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={16}>
                    <SectionCard title={t('dashboard.section.monthlySpend', 'Monthly Spend')} icon={<LineChartOutlined style={{ color: '#F59E0B' }} />} extra={expToolbar}>
                      <div style={{ height: 260 }}><TrendChart series={pagedExpenses} dataKey="amount" color="#F59E0B" type={expType} formatter={money} /></div>
                    </SectionCard>
                  </Col>
                  <Col xs={24} lg={8}>
                    <SectionCard title={t('dashboard.section.expensesByCategory', 'Expenses by Category (Purchase vs Overhead)')} icon={<WalletOutlined style={{ color: '#8B5CF6' }} />} extra={<BreakdownToolbar type={catType} setType={setCatType} />}><BreakdownChart data={expenseByType} type={catType} color="#8B5CF6" showLabels={showLabels} /></SectionCard>
                  </Col>
                </Row>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.topVendors', 'Top Vendors (by spend)')} icon={<ShopOutlined style={{ color: '#F59E0B' }} />} data={topVendors} valueKey="amount" color="#F59E0B" formatter={money} defaultType="treemap" /></Col>
                  <Col xs={24} lg={12}>
                    <SectionCard title={t('dashboard.section.recentInvestments', 'Recent Investments')} icon={<WalletOutlined style={{ color: '#2563EB' }} />} bodyPad={0}>
                      <Table
                        dataSource={[...investments].sort((a, b) => dayjs(b.purchaseDate).valueOf() - dayjs(a.purchaseDate).valueOf())}
                        rowKey={(r) => r.id || r.invoiceNumber} size="small"
                        pagination={{ pageSize: 6, size: 'small', hideOnSinglePage: true }}
                        scroll={{ x: 'max-content' }}
                        locale={{ emptyText: <Empty description={t('dashboard.empty.noInvestmentsInRange', 'No investments in range')} /> }}
                        columns={[
                          { title: t('dashboard.col.invoice', 'Invoice'), dataIndex: 'invoiceNumber', key: 'i', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                          { title: t('dashboard.col.vendor', 'Vendor'), dataIndex: 'vendorName', key: 'v', render: (v) => v || '—' },
                          { title: t('dashboard.col.type', 'Type'), dataIndex: 'investmentType', key: 't', render: (v) => <Tag color={v === 'PURCHASE' ? 'blue' : 'orange'}>{v}</Tag> },
                          { title: t('common.amount', 'Amount'), dataIndex: 'grandTotal', key: 'a', align: 'right', render: (v) => <span style={{ fontWeight: 700 }}>{money(v)}</span> },
                          { title: t('common.status', 'Status'), dataIndex: 'paymentStatus', key: 's', render: (v) => <Tag color={v === 'PAID' ? 'green' : v === 'PARTIALLY_PAID' ? 'orange' : 'default'}>{(v || '').replace(/_/g, ' ') || '—'}</Tag> },
                        ]}
                      />
                    </SectionCard>
                  </Col>
                </Row>
              </>
            )}

            {/* ── EMPLOYEES ── */}
            {board === 'employees' && (
              <>
                <Row gutter={[12, 12]}>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.output', 'Output (pieces made)')} icon={<ToolOutlined style={{ color: '#8B5CF6' }} />} data={topEmployees} valueKey="quantity" color="#8B5CF6" formatter={num} /></Col>
                  <Col xs={24} lg={12}><RankCard showLabels={showLabels} title={t('dashboard.section.earnings', 'Earnings (piece-rate)')} icon={<DollarCircleOutlined style={{ color: '#6366F1' }} />} data={[...topEmployees].sort((a, b) => b.earnings - a.earnings)} valueKey="earnings" color="#6366F1" formatter={money} defaultType="pie" /></Col>
                </Row>
                <SectionCard title={t('dashboard.section.employeeEarnings', 'Employee Earnings')} icon={<TeamOutlined style={{ color: '#6366F1' }} />} bodyPad={0}>
                  <Table
                    dataSource={topEmployees} rowKey={(r) => r.name} size="small"
                    pagination={{ pageSize: 10, size: 'small', hideOnSinglePage: true }}
                    scroll={{ x: 'max-content' }}
                    locale={{ emptyText: <Empty description={t('dashboard.empty.noProductionInRange', 'No production in this range')} /> }}
                    columns={[
                      { title: t('dashboard.col.employee', 'Employee'), dataIndex: 'name', key: 'n', render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
                      { title: t('dashboard.col.piecesMade', 'Pieces Made'), dataIndex: 'quantity', key: 'q', align: 'right', sorter: (a, b) => a.quantity - b.quantity, render: (v) => num(v) },
                      { title: t('dashboard.col.earnings', 'Earnings'), dataIndex: 'earnings', key: 'e', align: 'right', defaultSortOrder: 'descend', sorter: (a, b) => a.earnings - b.earnings, render: (v) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{money(v)}</span> },
                    ]}
                  />
                </SectionCard>
              </>
            )}
          </div>
        </Spin>
      </div>
    </ConfigProvider>
  );
};

export default DashboardPage;
