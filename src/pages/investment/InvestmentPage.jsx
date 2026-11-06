import React, { useState, useMemo, useEffect } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import PaymentConfirmDialog from '../../components/common/PaymentConfirmDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Drawer,
  Form,
  AutoComplete,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Modal,
  Tag,
  Divider,
  notification,
  Tooltip,
  Empty,
  Skeleton,
  Popover,
  Badge,
  Checkbox,
  Segmented,
} from 'antd';
import {
  PlusOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  StopOutlined,
  CheckCircleOutlined,
  WalletOutlined,
  ShoppingOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  BankOutlined,
  UserOutlined,
  TeamOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TagsOutlined,
  LeftOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { investmentService, vendorService } from '../../services/investmentService';
import { productService } from '../../services/productService';
import { useAppSettings } from '../../contexts/AppSettingsContext';
import { formatMoney, getCurrencySymbol } from '../../utils/currency';
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';

const { Option } = Select;
const { TextArea } = Input;

// ─────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────
const INVESTMENT_TYPES = [
  { value: 'PURCHASE', label: 'Purchase', color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '#BFDBFE' },
  { value: 'OVERHEAD', label: 'Overhead', color: 'var(--theme-primary)', bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '#FDE68A' },
];

const ITEM_TYPES = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'PRODUCT', label: 'Product' },
];

const UNIT_OPTIONS = [
  { key: 'NOS', label: 'Nos' },
  { key: 'PIECE', label: 'Piece' },
  { key: 'METER', label: 'Meter' },
  { key: 'KG', label: 'Kilogram' },
  { key: 'ROLL', label: 'Roll' },
  { key: 'GRAM', label: 'Gram' },
  { key: 'BUNDLE', label: 'Bundle' },
  { key: 'LITER', label: 'Liter' },
  { key: 'BOX', label: 'Box' },
  { key: 'DOZEN', label: 'Dozen' },
  { key: 'PACKET', label: 'Packet' },
  { key: 'PAIR', label: 'Pair' },
];

const getTypeConfig = (type) =>
  INVESTMENT_TYPES.find((t) => t.value === type) || INVESTMENT_TYPES[0];

// ─────────────────────────────────────────
// SHARED STYLES (matching ProductDetailsPage)
// ─────────────────────────────────────────
const cardStyle = {
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
  border: '1px solid #E2E8F0',
  backgroundColor: '#ffffff',
};

// ─────────────────────────────────────────
// STATUS BADGE (pill with dot)
// ─────────────────────────────────────────
const StatusBadge = ({ active }) => {
  const t = useT();
  return (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'transparent',
      color: active ? '#16A34A' : '#DC2626',
      fontSize: '0.72rem',
      fontWeight: 700,
      padding: '3px 10px',
      borderRadius: 20,
      border: `1px solid ${active ? '#16A34A' : '#DC2626'}`,
    }}
  >
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: active ? '#16A34A' : '#DC2626',
      }}
    />
    {active ? t('investment.active', 'Active') : t('investment.inactive', 'Inactive')}
  </span>
  );
};

// ─────────────────────────────────────────
// INVESTMENT TYPE BADGE
// ─────────────────────────────────────────
const TypeBadge = ({ type }) => {
  const t = useT();
  const cfg = getTypeConfig(type);
  return (
    <span
      style={{
        display: 'inline-block',
        backgroundColor: 'transparent',
        color: '#0F172A',
        border: `1px solid ${cfg.border}`,
        borderRadius: 6,
        fontSize: '0.72rem',
        fontWeight: 700,
        padding: '2px 9px',
        letterSpacing: 0.3,
      }}
    >
      {t(`investment.typeOption.${cfg.value}`, cfg.label)}
    </span>
  );
};

// ─────────────────────────────────────────
// KPI SUMMARY CARD
// ─────────────────────────────────────────
const SummaryCard = ({ title, value, icon, iconBg, valueColor = '#0F172A', loading }) => (
  <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          backgroundColor: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, marginBottom: 4 }}>
          {title}
        </div>
        {loading ? (
          <Skeleton.Input active size="small" style={{ width: 100 }} />
        ) : (
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: valueColor, lineHeight: 1.2 }}>
            {value}
          </div>
        )}
      </div>
    </div>
  </Card>
);

// ─────────────────────────────────────────
// EMPTY ROW for add-row tables
// ─────────────────────────────────────────
const makeEmptyRow = (id) => ({
  id,
  itemType: 'PRODUCT',
  itemName: '',
  productId: undefined,
  quantity: undefined,
  unit: 'NOS',
  rate: undefined,
  mrp: undefined,
  amount: 0,
});

const makeEmptyOverheadRow = (id) => ({
  id,
  expenseName: '',
  amount: undefined,
});

// ─────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────
const InvestmentPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { can } = usePermissions();
  const t = useT();

  // Localised labels for enum values used across selects, badges and tables.
  const typeLabel = (v) => t(`investment.typeOption.${v}`, INVESTMENT_TYPES.find((x) => x.value === v)?.label || v);
  const itemTypeLabel = (v) => t(`investment.itemTypeOption.${v}`, ITEM_TYPES.find((x) => x.value === v)?.label || v);
  const unitLabel = (k) => t(`investment.unit.${k}`, UNIT_OPTIONS.find((x) => x.key === k)?.label || k);

  const isAddPage = location.pathname === '/investment/new'; // Add Investment opens as a full page
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryVendorId = queryParams.get('vendorId');
  const queryAdd = queryParams.get('add');
  const tabParam = queryParams.get('tab');
  const isFromVendorDetails = queryAdd === 'true' && !!queryVendorId;

  const [activeTab, setActiveTab] = useState(tabParam === 'vendors' ? 'vendors' : 'investments');

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // ── Investment states ──────────────────
  const [investmentFilters, setInvestmentFilters] = useState({
    fromDate: null,
    toDate: null,
    vendorId: undefined,
    type: undefined,
    paymentStatus: undefined,
    search: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [investmentForm] = Form.useForm();
  const [selectedType, setSelectedType] = useState(undefined);
  const [itemRows, setItemRows] = useState([makeEmptyRow(1)]);
  const [overheadRows, setOverheadRows] = useState([makeEmptyOverheadRow(1)]);
  const [subtotal, setSubtotal] = useState(0);
  const [gst, setGst] = useState(0);
  const [gstManual, setGstManual] = useState(false); // true once the user edits GST % by hand
  const [gstRate, setGstRate] = useState(null); // user-overridden GST percent
  const [discount, setDiscount] = useState(0); // rupee amount — source of truth
  const [discountMode, setDiscountMode] = useState('PERCENT'); // PERCENT (%) or AMOUNT (₹)
  const [discountPct, setDiscountPct] = useState(null); // entered % when mode = PERCENT

  // Default GST % from system settings; auto-applied to new PURCHASE invoices.
  const { gstPercent } = useAppSettings();

  // In % mode the rupee discount follows the subtotal automatically.
  useEffect(() => {
    if (discountMode !== 'PERCENT') return;
    setDiscount(Math.round((subtotal * (Number(discountPct) || 0) / 100) * 100) / 100);
  }, [subtotal, discountPct, discountMode]);

  // GST is entered as a percent. Use the user's override % once edited, else the default %.
  // The rupee amount is derived from the subtotal and snapshotted into the invoice on save.
  const effectiveGstRate = gstRate || 0; // user enters GST % manually; no auto-fill
  useEffect(() => {
    if (selectedType === 'OVERHEAD') return;
    const auto = Math.round((subtotal * effectiveGstRate / 100) * 100) / 100;
    setGst(auto);
  }, [subtotal, effectiveGstRate, selectedType]);

  // ── Vendor states ──────────────────────
  const [vendorModalVisible, setVendorModalVisible] = useState(false);
  const [vendorForm] = Form.useForm();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');
  // Inline "add new vendor" on the investment page (Purchase type).
  const [vendorSearchText, setVendorSearchText] = useState('');
  const [quickVendorOpen, setQuickVendorOpen] = useState(false);
  const [qv, setQv] = useState({ name: '', mobile: '' });
  const [qvSaving, setQvSaving] = useState(false);

  // ── Open modal from URL params ──────────
  useEffect(() => {
    if (queryAdd === 'true' && queryVendorId) {
      navigate(`/investment/new?vendorId=${queryVendorId}`, { replace: true });
    }
  }, [queryAdd, queryVendorId, navigate]);

  // ── Add-investment page: seed defaults once ──
  useEffect(() => {
    if (!isAddPage) return;
    if (!investmentForm.getFieldValue('purchaseDate')) {
      investmentForm.setFieldsValue({ purchaseDate: dayjs() });
    }
    // Purchase is the default type on the add page.
    if (!investmentForm.getFieldValue('type')) {
      setSelectedType('PURCHASE');
      investmentForm.setFieldsValue({ type: 'PURCHASE' });
    }
    const vid = queryParams.get('vendorId');
    if (vid && !investmentForm.getFieldValue('vendorId')) {
      setSelectedType('PURCHASE');
      investmentForm.setFieldsValue({ type: 'PURCHASE', vendorId: vid });
    }
  }, [isAddPage, investmentForm, queryParams]);

  // ── Queries ────────────────────────────
  const { data: investmentsData, isLoading: invLoading, refetch: refetchInvestments } = useQuery({
    queryKey: ['investments', appliedFilters],
    queryFn: () => investmentService.getInvestments(appliedFilters),
  });

  const { data: vendorsData, isLoading: vendorsLoading, refetch: refetchVendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: vendorService.getVendors,
  });



  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
  });

  // Backend returns these already sorted: latest purchaseDate first, then latest createdAt.
  const investments = investmentsData?.data || [];
  const vendors = vendorsData?.data || [];
  const products = productsData?.data || [];

  // ── Investment detail query (for view drawer) ──
  const { data: investmentDetailData, isLoading: invDetailLoading } = useQuery({
    queryKey: ['investment', selectedInvestment?.id],
    queryFn: () => investmentService.getInvestmentById(selectedInvestment?.id),
    enabled: !!selectedInvestment?.id && viewDrawerVisible,
  });
  const investmentDetail = investmentDetailData?.data || selectedInvestment;

  // Round-off outstanding due for the details drawer (display + payment cap).
  const detailDue = Math.max(0, Math.round(
    Number(investmentDetail?.amountDue ?? ((investmentDetail?.grandTotal || 0) - (investmentDetail?.amountPaid || 0)))
  ));

  // ── Payment form state + mutations ─────
  const [payDate, setPayDate] = useState(null);
  const [payMode, setPayMode] = useState('CASH');
  const [payAmount, setPayAmount] = useState(null);
  const [payRef, setPayRef] = useState(''); // optional reference / txn id for non-cash payments

  // Create-time payment fields
  const [createFullPayment, setCreateFullPayment] = useState(false);
  const [createPayAmount, setCreatePayAmount] = useState(null);
  const [createPayMode, setCreatePayMode] = useState('CASH');
  const [createPayRef, setCreatePayRef] = useState(''); // optional txn id / reference for non-cash payments
  const [investConfirmOpen, setInvestConfirmOpen] = useState(false); // payment confirmation before saving the investment
  const [showDues, setShowDues] = useState(false); // slide-open the vendor's previous dues

  // Selected vendor's outstanding (for the create-time payment allocation preview).
  const watchedVendorId = Form.useWatch('vendorId', investmentForm);
  const { data: vendorDetailData } = useQuery({
    queryKey: ['vendorForInvestment', watchedVendorId],
    queryFn: () => vendorService.getVendorById(watchedVendorId),
    enabled: !!watchedVendorId && (addModalVisible || isAddPage) && selectedType === 'PURCHASE',
    // Always pull the live outstanding so a just-made payment is reflected (no stale previous-due).
    staleTime: 0,
    refetchOnMount: 'always',
  });
  const vendorUnpaid = useMemo(() => {
    const purchases = vendorDetailData?.data?.purchases || [];
    return purchases
      .filter((p) => Number(p.amountDue) > 0)
      .sort((a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''));
  }, [vendorDetailData]);
  const vendorOverdue = useMemo(
    () => vendorUnpaid.reduce((s, p) => s + Number(p.amountDue || 0), 0),
    [vendorUnpaid]
  );

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, data }) => investmentService.addPayment(id, data),
    onSuccess: () => {
      notification.success({ message: t('investment.toast.paymentRecorded', 'Payment Recorded'), placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['investment', selectedInvestment?.id] });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
      queryClient.invalidateQueries({ queryKey: ['vendorForInvestment'] });
      if (selectedInvestment?.vendorId) {
        queryClient.invalidateQueries({ queryKey: ['vendor', selectedInvestment.vendorId] });
      }
      setPayAmount(null);
      setPayDate(null);
      setPayMode('CASH');
      setPayRef('');
    },
    onError: (err) => {
      notification.error({
        message: t('investment.toast.paymentFailed', 'Payment Failed'),
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const handleAddPayment = () => {
    if (!payAmount || Number(payAmount) <= 0) {
      notification.warning({ message: t('investment.toast.enterValidPayment', 'Enter a valid payment amount'), placement: 'topRight' });
      return;
    }
    addPaymentMutation.mutate({
      id: selectedInvestment.id,
      data: {
        paymentDate: (payDate || dayjs()).format('YYYY-MM-DD'),
        mode: payMode,
        amount: Math.min(Number(payAmount), detailDue),
        reference: (payMode !== 'CASH' && payRef.trim()) ? payRef.trim() : undefined,
      },
    });
  };

  // Same colours as the Sales table chips (MUI success / info / warning).
  const PAYMENT_STATUS_META = {
    PAID: { color: 'success', label: t('investment.status.paid', 'Paid'), bg: '#10B981' },
    PARTIALLY_PAID: { color: 'processing', label: t('investment.status.partial', 'Partial'), bg: '#06B6D4' },
    PENDING: { color: 'warning', label: t('investment.status.unpaid', 'Unpaid'), bg: '#F59E0B' },
  };

  // ── Summary computations ───────────────
  const totalInvestment = useMemo(
    () => investments.reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const currentMonthInvestment = useMemo(
    () =>
      investments
        .filter((i) => i.purchaseDate && dayjs(i.purchaseDate).isSame(dayjs(), 'month'))
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const previousMonthInvestment = useMemo(
    () =>
      investments
        .filter((i) =>
          i.purchaseDate && dayjs(i.purchaseDate).isSame(dayjs().subtract(1, 'month'), 'month')
        )
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const purchaseTotal = useMemo(
    () =>
      investments
        .filter((i) => i.investmentType === "PURCHASE")
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  const overheadTotal = useMemo(
    () =>
      investments
        .filter((i) => i.investmentType === "OVERHEAD")
        .reduce((s, i) => s + (i.grandTotal || 0), 0),
    [investments]
  );
  // Total outstanding across the currently listed (filtered) invoices.
  const totalDue = useMemo(
    () =>
      investments.reduce(
        (s, i) => s + Math.max(0, (Number(i.grandTotal) || 0) - (Number(i.amountPaid) || 0)),
        0
      ),
    [investments]
  );

  // ── Vendor summary computations ────────
  const totalVendors = vendors.length;
  const activeVendors = vendors.filter((v) => v.active).length;
  const inactiveVendors = vendors.filter((v) => !v.active).length;

  // ── Filtered vendors ───────────────────
  const filteredVendors = useMemo(() => {
    if (!vendorSearch) return vendors;
    const q = vendorSearch.toLowerCase();
    return vendors.filter(
      (v) =>
        v.name?.toLowerCase().includes(q) ||
        v.gstNumber?.toLowerCase().includes(q) ||
        v.mobile?.toLowerCase().includes(q) ||
        v.email?.toLowerCase().includes(q)
    );
  }, [vendors, vendorSearch]);

  // ── Grand total calculation ────────────
  // Round-off the grand total so bill, confirmation and listing all match.
  const grandTotal = Math.round(subtotal + gst - discount);

  const payNow = Number(createPayAmount) || 0;

  // Per-due status for the slider: this bill is paid first, only the leftover clears older dues (oldest first).
  const duesWithStatus = useMemo(() => {
    let remaining = Math.max(0, payNow - grandTotal);
    return vendorUnpaid.map((inv) => {
      const due = Number(inv.amountDue) || 0;
      const pay = Math.min(remaining, due);
      remaining -= pay;
      const status = due > 0 && pay >= due ? 'cleared' : pay > 0 ? 'partial' : 'pending';
      return { ...inv, due, pay, status };
    });
  }, [vendorUnpaid, payNow, grandTotal]);

  // Max payable now = this invoice + vendor's overdue (just this invoice for overhead).
  const maxPayable = Math.round(selectedType === 'PURCHASE' ? (grandTotal + vendorOverdue) : grandTotal);

  // Confirmation due = (this bill + previous dues) - paid, regardless of which clears first.
  const confirmTotalOutstanding = (selectedType === 'OVERHEAD' ? Math.round(subtotal) : grandTotal)
    + (selectedType === 'PURCHASE' ? Math.round(vendorOverdue) : 0);
  const confirmDueRemaining = Math.max(0, confirmTotalOutstanding - payNow);

  // Keep the entered amount within the outstanding balance if totals change.
  useEffect(() => {
    if (createPayAmount != null && Number(createPayAmount) > maxPayable) {
      setCreatePayAmount(Number(maxPayable.toFixed(2)));
    }
  }, [maxPayable]); // eslint-disable-line react-hooks/exhaustive-deps

  const recalcSubtotal = (rows, type) => {
    if (type === 'OVERHEAD') {
      const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      setSubtotal(total);
    } else {
      const total = rows.reduce((s, r) => s + (Number(r.amount) || 0), 0);
      setSubtotal(total);
    }
  };

  // ── Mutations ──────────────────────────
  const createInvestmentMutation = useMutation({
    mutationFn: investmentService.createInvestment,
    onSuccess: (res, variables) => {
      notification.success({
        message: t('investment.toast.investmentSaved', 'Investment Saved'),
        description: res.message || t('investment.toast.investmentSavedDesc', 'Investment created successfully.'),
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['investments'] });
      // Refresh the affected vendor's detail (purchase history/totals) whether the
      // vendor came from the URL param or was picked in the form, plus the vendor list.
      const affectedVendorId = variables?.vendorId || queryVendorId;
      if (affectedVendorId) {
        queryClient.invalidateQueries({ queryKey: ['vendor', affectedVendorId] });
      }
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      queryClient.invalidateQueries({ queryKey: ['vendorForInvestment'] });
      queryClient.invalidateQueries({ queryKey: ['vendorPayments'] });
      handleCloseAddModal();
    },
    onError: (err) => {
      notification.error({
        message: t('investment.toast.saveFailed', 'Save Failed'),
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const createVendorMutation = useMutation({
    mutationFn: vendorService.createVendor,
    onSuccess: (res) => {
      notification.success({
        message: t('investment.toast.vendorSaved', 'Vendor Saved'),
        description: res.message || t('investment.toast.vendorSavedDesc', 'Vendor created successfully.'),
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      handleCloseVendorModal();
    },
    onError: (err) => {
      notification.error({
        message: t('investment.toast.saveFailed', 'Save Failed'),
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: ({ id, data }) => vendorService.updateVendor(id, data),
    onSuccess: (res) => {
      notification.success({
        message: t('investment.toast.vendorUpdated', 'Vendor Updated'),
        description: res.message || t('investment.toast.vendorUpdatedDesc', 'Vendor updated successfully.'),
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      handleCloseVendorModal();
    },
    onError: (err) => {
      notification.error({
        message: t('investment.toast.updateFailed', 'Update Failed'),
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 5,
      });
    },
  });

  const toggleVendorStatusMutation = useMutation({
    mutationFn: ({ id, active }) => vendorService.toggleVendorStatus(id, active),
    onSuccess: (res) => {
      notification.success({
        message: t('investment.toast.statusUpdated', 'Status Updated'),
        description: res.message || t('investment.toast.statusUpdatedDesc', 'Vendor status updated.'),
        placement: 'topRight',
        duration: 3,
      });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (err) => {
      notification.error({
        message: t('investment.toast.updateFailed', 'Update Failed'),
        description: err.response?.data?.message || err.message,
        placement: 'topRight',
        duration: 4,
      });
    },
  });

  // ── Investment handlers ────────────────
  const handleApplyFilters = () => {
    const params = {};
    if (investmentFilters.fromDate)
      params.fromDate = investmentFilters.fromDate.format('YYYY-MM-DD');
    if (investmentFilters.toDate)
      params.toDate = investmentFilters.toDate.format('YYYY-MM-DD');
    if (investmentFilters.vendorId) params.vendorId = investmentFilters.vendorId;
    if (investmentFilters.type) params.type = investmentFilters.type;
    if (investmentFilters.paymentStatus) params.paymentStatus = investmentFilters.paymentStatus;
    if (investmentFilters.search) params.search = investmentFilters.search;
    setAppliedFilters(params);
    setFilterOpen(false);
  };

  const handleResetFilters = () => {
    setInvestmentFilters({ fromDate: null, toDate: null, vendorId: undefined, type: undefined, paymentStatus: undefined, search: '' });
    setAppliedFilters({});
    setFilterOpen(false);
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const handleViewInvestment = (record) => {
    setSelectedInvestment(record);
    setViewDrawerVisible(true);
  };

  const handleDownloadInvoice = async () => {
    const inv = investmentDetail;
    if (!inv?.id) return;
    try {
      setDownloadingInvoice(true);
      await investmentService.downloadInvoicePdf(inv.id, inv.invoiceNumber);
    } catch (e) {
      notification.error({
        message: t('investment.toast.invoiceDownloadFailed', 'Invoice download failed'),
        description: e.response?.data?.message || e.message || t('investment.toast.invoiceDownloadFailedDesc', 'Could not generate the invoice PDF.'),
        placement: 'topRight',
      });
    } finally {
      setDownloadingInvoice(false);
    }
  };

  const handleCloseAddModal = () => {
    setAddModalVisible(false);
    if (isAddPage) navigate('/investment');
    investmentForm.resetFields();
    setSelectedType(undefined);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    setGst(0);
    setGstManual(false);
    setGstRate(null);
    setDiscount(0);
    setDiscountMode('PERCENT');
    setDiscountPct(null);
    setCreateFullPayment(false);
    setCreatePayAmount(null);
    setCreatePayMode('CASH');
    setCreatePayRef('');
    setShowDues(false);
    if (queryAdd === 'true' && queryVendorId) {
      navigate(`/vendors/${queryVendorId}`, { replace: true });
    }
  };

  // Add Investment now opens as a full page.
  const handleOpenAddInvestment = () => {
    navigate('/investment/new');
  };

  // Open the inline vendor quick-add, prefilling the name from the current search.
  const openQuickVendor = () => {
    setQv({ name: vendorSearchText || '', mobile: '' });
    setQuickVendorOpen(true);
  };

  // Validate quick-add fields: name + a unique 10-digit phone. Returns an error or null.
  const quickVendorError = (name, mobile) => {
    if (!name || !mobile) return t('investment.quickVendorError.required', 'Vendor name and phone are required.');
    if (!/^\d{10}$/.test(mobile)) return t('investment.quickVendorError.invalidPhone', 'Enter a valid 10-digit phone number.');
    if (vendors.some((v) => (v.mobile || '').replace(/\D/g, '') === mobile)) return t('investment.quickVendorError.duplicate', 'A vendor with this phone number already exists.');
    return null;
  };

  // Create a vendor (active) right from the investment form and select it.
  const saveQuickVendor = async () => {
    const name = qv.name.trim();
    const mobile = qv.mobile.trim();
    const err = quickVendorError(name, mobile);
    if (err) { notification.error({ message: t('investment.toast.checkDetails', 'Check details'), description: err, placement: 'topRight' }); return; }
    try {
      setQvSaving(true);
      const res = await vendorService.createVendor({ name, mobile, active: true });
      const newId = res?.data?.id || res?.id;
      await refetchVendors();
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      if (newId) investmentForm.setFieldsValue({ vendorId: newId });
      setQuickVendorOpen(false);
      notification.success({ message: t('investment.toast.vendorAdded', 'Vendor added'), description: `${name} ${t('investment.toast.addedAndSelected', 'added and selected.')}`, placement: 'topRight', duration: 3 });
    } catch (e) {
      notification.error({ message: t('investment.toast.failed', 'Failed'), description: e.response?.data?.message || e.message, placement: 'topRight', duration: 5 });
    } finally {
      setQvSaving(false);
    }
  };

  const handleTypeChange = (val) => {
    setSelectedType(val);
    setItemRows([makeEmptyRow(1)]);
    setOverheadRows([makeEmptyOverheadRow(1)]);
    setSubtotal(0);
    setGstManual(false);
    setGstRate(null);
    if (val === 'OVERHEAD') {
      setGst(0);
      setDiscount(0);
      setDiscountMode('PERCENT');
      setDiscountPct(null);
    }
  };

  // ── Item row helpers ───────────────────
  const updateItemRow = (id, field, value) => {
    setItemRows((prev) => {
      const updated = prev.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          newRow.amount = (Number(newRow.quantity) || 0) * (Number(newRow.rate) || 0);
        }
        return newRow;
      });
      recalcSubtotal(updated, selectedType);
      return updated;
    });
  };

  const addItemRow = () => {
    setItemRows((prev) => {
      const newRows = [...prev, makeEmptyRow(Date.now())];
      return newRows;
    });
  };

  const removeItemRow = (id) => {
    setItemRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      recalcSubtotal(updated, selectedType);
      return updated;
    });
  };

  const updateOverheadRow = (id, field, value) => {
    setOverheadRows((prev) => {
      const updated = prev.map((row) => (row.id === id ? { ...row, [field]: value } : row));
      recalcSubtotal(updated, 'OVERHEAD');
      return updated;
    });
  };

  const addOverheadRow = () => {
    setOverheadRows((prev) => [...prev, makeEmptyOverheadRow(Date.now())]);
  };

  const removeOverheadRow = (id) => {
    setOverheadRows((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      recalcSubtotal(updated, 'OVERHEAD');
      return updated;
    });
  };

  // ── Form validity check ─────────────────
  const isFormValid = useMemo(() => {
    if (!selectedType) return false;
    const formValues = investmentForm.getFieldsValue();
    if (!formValues.type) return false;

    if (selectedType === 'PURCHASE') {
      // watchedVendorId is reactive, so quick-add selecting a vendor re-enables the button.
      if (!watchedVendorId) return false;
      const validItems = itemRows.filter((r) => r.itemName && r.quantity > 0 && r.rate > 0);
      if (validItems.length === 0) return false;
    } else {
      const validExpenses = overheadRows.filter((r) => r.expenseName && (Number(r.amount) || 0) > 0);
      if (validExpenses.length === 0) return false;
    }
    return true;
  }, [selectedType, itemRows, overheadRows, watchedVendorId, investmentForm]);

  // Validate the form, then show the payment confirmation before actually saving.
  const requestSaveInvestment = async () => {
    try {
      await investmentForm.validateFields();
      if (selectedType !== 'OVERHEAD') {
        const missingMrp = itemRows.some((r) => r.itemName && r.itemType === 'PRODUCT' && (r.mrp == null || r.mrp === ''));
        if (missingMrp) {
          notification.error({ message: t('investment.toast.mrpRequired', 'Selling price (MRP) is required for every product item.'), placement: 'topRight' });
          return;
        }
      }
      setInvestConfirmOpen(true);
    } catch (_) { /* validation errors are shown on the form */ }
  };

  // ── Save Investment ────────────────────
  const handleSaveInvestment = async () => {
    try {
      const values = await investmentForm.validateFields();

      // Selling price (MRP) is required for every product item.
      if (selectedType !== 'OVERHEAD') {
        const missingMrp = itemRows.some((r) => r.itemName && r.itemType === 'PRODUCT' && (r.mrp == null || r.mrp === ''));
        if (missingMrp) {
          notification.error({ message: t('investment.toast.mrpRequired', 'Selling price (MRP) is required for every product item.'), placement: 'topRight' });
          return;
        }
      }

      let items = [];

      if (selectedType === 'OVERHEAD') {
        items = overheadRows
          .filter((r) => r.expenseName && (Number(r.amount) || 0) > 0)
          .map((r) => ({
            itemType: 'OVERHEAD',
            itemName: r.expenseName,
            quantity: 1,
            unit: 'NOS',
            rate: Number(r.amount) || 0,
          }));
      } else {
        items = itemRows
          .filter((r) => r.itemName)
          .map((r) => ({
            itemType: r.itemType || 'MATERIAL',
            itemName: r.itemName,
            quantity: Number(r.quantity) || 0,
            unit: r.unit || 'PIECE',
            rate: Number(r.rate) || 0,
            // MRP (selling price) for products only; blank → product's default price is used.
            sellingPrice: (r.itemType === 'PRODUCT' && r.mrp != null && r.mrp !== '')
              ? Number(r.mrp) : undefined,
          }));
      }

      const computedGrandTotal = selectedType === 'OVERHEAD'
        ? Math.round(subtotal)
        : Math.round(subtotal + gst - discount);

      const payload = {
        ...(selectedType === 'PURCHASE' ? { vendorId: values.vendorId } : {}),
        investmentType: values.type,
        purchaseDate: values.purchaseDate ? values.purchaseDate.format('YYYY-MM-DD') : undefined,
        invoiceNumber: values.invoiceNumber || undefined,
        items,
        subtotal,
        ...(selectedType === 'PURCHASE' ? {
          gstAmount: gst,
          discountAmount: discount,
        } : {}),
        grandTotal: computedGrandTotal,
        // Optional payment captured at creation (allocated oldest-dues-first on the backend).
        fullPayment: false,
        paymentAmount: createPayAmount ? Number(createPayAmount) : undefined,
        paymentMode: createPayMode,
        paymentReference: (createPayMode !== 'CASH' && createPayRef.trim()) ? createPayRef.trim() : undefined,
        // Payment is recorded as of today by the backend.
      };

      setInvestConfirmOpen(false);
      createInvestmentMutation.mutate(payload);
    } catch (_) {
      // validation error — Ant Design shows field errors automatically
    }
  };

  // ── Vendor handlers ────────────────────
  const handleOpenAddVendor = () => {
    setSelectedVendor(null);
    vendorForm.resetFields();
    vendorForm.setFieldsValue({ active: true });
    setVendorModalVisible(true);
  };

  const handleOpenEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    vendorForm.setFieldsValue({
      name: vendor.name,
      gstNumber: vendor.gstNumber,
      mobile: vendor.mobile,
      email: vendor.email,
      address: vendor.address,
      active: vendor.active,
    });
    setVendorModalVisible(true);
  };

  const handleCloseVendorModal = () => {
    setVendorModalVisible(false);
    setSelectedVendor(null);
    vendorForm.resetFields();
  };

  const handleSaveVendor = async () => {
    try {
      const values = await vendorForm.validateFields();
      if (selectedVendor) {
        updateVendorMutation.mutate({ id: selectedVendor.id, data: values });
      } else {
        createVendorMutation.mutate(values);
      }
    } catch (_) { }
  };

  const handleOpenVendorDrawer = (vendor) => {
    navigate(`/vendors/${vendor.id}`);
  };

  // ── Investment Table Columns ───────────
  const investmentColumns = [
    {
      title: '#',
      key: 'index',
      width: 44,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{i + 1}</span>
      ),
    },
    {
      title: t('investment.col.invoiceNo', 'Invoice No'),
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1E293B', fontSize: '0.85rem' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: t('investment.col.vendor', 'Vendor'),
      dataIndex: 'vendorName',
      key: 'vendorName',
      render: (val, record) => (
        record.vendorId ? (
          <a onClick={(e) => { e.stopPropagation(); navigate(`/vendors/${record.vendorId}`); }} style={{ fontWeight: 600, color: '#0F172A', cursor: 'pointer' }}>
            {val || '—'}
          </a>
        ) : (
          <span style={{ fontWeight: 600, color: '#0F172A' }}>{val || '—'}</span>
        )
      ),
    },
    {
      title: t('investment.col.type', 'Type'),
      dataIndex: 'investmentType',
      key: 'investmentType',
      render: (val) => <TypeBadge type={val} />,
    },
    {
      title: t('investment.col.purchaseDate', 'Purchase Date'),
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (val) => (
        <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>
          {val ? dayjs(val).format('DD-MMM-YYYY') : '—'}
        </span>
      ),
      sorter: (a, b) => (a.purchaseDate || '').localeCompare(b.purchaseDate || ''),
    },
    {
      title: t('investment.col.items', 'Items'),
      dataIndex: 'itemCount',
      key: 'itemCount',
      align: 'center',
      render: (val) => (
        <span
          style={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontWeight: 700,
            fontSize: '0.8rem',
            padding: '2px 10px',
            borderRadius: 20,
          }}
        >
          {val ?? (Array.isArray(val) ? val.length : '—')}
        </span>
      ),
    },
    {
      title: t('investment.col.grandTotal', 'Grand Total'),
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (val) => (
        <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
          {getCurrencySymbol()}{Math.round(Number(val || 0)).toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0),
    },
    {
      // Actual cash received in this invoice's own transaction (can clear previous dues too).
      title: t('investment.col.amountReceived', 'Amount Received'),
      dataIndex: 'amountReceived',
      key: 'amountReceived',
      render: (val) => (
        <span style={{ fontWeight: 700, color: Number(val) > 0 ? 'var(--theme-primary)' : '#94A3B8', fontSize: '0.88rem' }}>
          {getCurrencySymbol()}{Math.round(Number(val || 0)).toLocaleString('en-IN')}
        </span>
      ),
      sorter: (a, b) => (a.amountReceived || 0) - (b.amountReceived || 0),
    },
    {
      title: t('investment.col.payment', 'Payment'),
      key: 'paymentStatus',
      align: 'left',
      width: 200,
      filters: [
        { text: t('investment.status.paid', 'Paid'), value: 'PAID' },
        { text: t('investment.status.partial', 'Partial'), value: 'PARTIALLY_PAID' },
        { text: t('investment.status.unpaid', 'Unpaid'), value: 'PENDING' },
      ],
      onFilter: (value, record) => (record.paymentStatus || 'PENDING') === value,
      render: (_, record) => {
        const meta = PAYMENT_STATUS_META[record.paymentStatus] || PAYMENT_STATUS_META.PENDING;
        const due = Math.max(0, Math.round(Number(record.grandTotal || 0) - Number(record.amountPaid || 0)));
        // Status on the left, due to its right, on one line (nowrap) even for 6-7 digit amounts.
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 6, flexWrap: 'nowrap', whiteSpace: 'nowrap' }}>
            <Tag style={{ background: meta.bg, border: 'none', color: '#fff', fontWeight: 700, borderRadius: 16, fontSize: '0.82rem', padding: '2px 10px', margin: 0, flexShrink: 0 }}>{meta.label}</Tag>
            {record.paymentStatus !== 'PAID' && due > 0 && (
              <span style={{ color: '#B91C1C', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{t('investment.duePrefix', 'Due')} {getCurrencySymbol()}{due.toLocaleString('en-IN')}</span>
            )}
          </div>
        );
      },
    },
    {
      title: t('investment.col.action', 'Action'),
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        record.investmentType !== 'OVERHEAD' ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Tooltip title={t('investment.tooltip.downloadInvoice', 'Download Invoice PDF')} placement="top">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined style={{ fontSize: 17, fontWeight: 700 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  investmentService.downloadInvoicePdf(record.id, record.invoiceNumber).catch((err) =>
                    notification.error({
                      message: t('investment.toast.invoiceDownloadFailed', 'Invoice download failed'),
                      description: err.response?.data?.message || err.message || t('investment.toast.invoiceDownloadFailedDesc', 'Could not generate the invoice PDF.'),
                      placement: 'topRight',
                    })
                  );
                }}
                style={{ color: 'var(--theme-primary)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
            <Tooltip title={t('investment.tooltip.printInvoice', 'Print Invoice')} placement="top">
              <Button
                type="text"
                size="small"
                icon={<PrinterOutlined style={{ fontSize: 17, fontWeight: 700 }} />}
                onClick={(e) => {
                  e.stopPropagation();
                  investmentService.printInvoicePdf(record.id).catch((err) =>
                    notification.error({
                      message: t('investment.toast.invoicePrintFailed', 'Invoice print failed'),
                      description: err.response?.data?.message || err.message || t('investment.toast.invoiceDownloadFailedDesc', 'Could not generate the invoice PDF.'),
                      placement: 'topRight',
                    })
                  );
                }}
                style={{ color: 'var(--theme-primary)', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Tooltip>
          </div>
        ) : <span style={{ color: '#CBD5E1' }}>—</span>
      ),
    },
  ];

  // ── Vendor Table Columns ───────────────
  const vendorColumns = [
    {
      title: '#',
      key: 'index',
      width: 44,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{i + 1}</span>
      ),
    },
    {
      title: t('investment.vendorCol.name', 'Vendor Name'),
      dataIndex: 'name',
      key: 'name',
      render: (val) => <span style={{ fontWeight: 700, color: '#0F172A' }}>{val}</span>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('investment.vendorCol.gstNumber', 'GST Number'),
      dataIndex: 'gstNumber',
      key: 'gstNumber',
      render: (val) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#475569', fontSize: '0.83rem' }}>
          {val || '—'}
        </span>
      ),
    },
    {
      title: t('investment.vendorCol.phone', 'Phone'),
      dataIndex: 'mobile',
      key: 'mobile',
      render: (val) => (
        <span style={{ color: '#0F172A', fontWeight: 500 }}>{val || '—'}</span>
      ),
    },
    {
      title: t('investment.vendorCol.email', 'Email'),
      dataIndex: 'email',
      key: 'email',
      render: (val) =>
        val ? (
          <a
            href={`mailto:${val}`}
            style={{ color: 'var(--theme-primary)', fontWeight: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            {val}
          </a>
        ) : (
          <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.85rem' }}>{t('investment.vendorCol.notProvided', 'Not Provided')}</span>
        ),
    },
    {
      title: t('common.status', 'Status'),
      dataIndex: 'active',
      key: 'active',
      render: (val) => <StatusBadge active={val} />,
      filters: [
        { text: t('investment.active', 'Active'), value: true },
        { text: t('investment.inactive', 'Inactive'), value: false },
      ],
      onFilter: (value, record) => record.active === value,
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space size={6}>
          {can('investment', 'write') && (
          <Tooltip title={t('investment.tooltip.editVendor', 'Edit Vendor')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => { e.stopPropagation(); handleOpenEditVendor(record); }}
              style={{
                color: 'var(--theme-primary)',
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                border: '1px solid #DDD6FE',
                borderRadius: 6,
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
          </Tooltip>
          )}
          {can('investment', 'write') && (record.active ? (
            <Tooltip title={t('investment.tooltip.deactivate', 'Deactivate')}>
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                onClick={(e) => { e.stopPropagation(); toggleVendorStatusMutation.mutate({ id: record.id, active: false }); }}
                loading={toggleVendorStatusMutation.isPending}
                style={{
                  color: '#EA580C',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FED7AA',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          ) : (
            <Tooltip title={t('investment.tooltip.activate', 'Activate')}>
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={(e) => { e.stopPropagation(); toggleVendorStatusMutation.mutate({ id: record.id, active: true }); }}
                loading={toggleVendorStatusMutation.isPending}
                style={{
                  color: 'var(--theme-primary)',
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                  border: '1px solid #BBF7D0',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Tooltip>
          ))}
        </Space>
      ),
    },
  ];

  // ── Item rows columns (for Add Investment modal) ──
  const purchaseItemColumns = [
    {
      title: t('investment.itemCol.sno', 'S.No'),
      width: 48,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.78rem' }}>{i + 1}</span>
      ),
    },
    {
      title: t('investment.itemCol.itemType', 'Item Type'),
      width: 110,
      render: (_, record) => (
        <Select
          value={record.itemType}
          onChange={(val) => updateItemRow(record.id, 'itemType', val)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
        >
          {ITEM_TYPES.map((it) => (
            <Option key={it.value} value={it.value}>{itemTypeLabel(it.value)}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: t('investment.itemCol.itemName', 'Item Name'),
      width: 150,
      render: (_, record) => {
        // Suggest matching product names ONLY for PRODUCT rows, and only while typing.
        const q = (record.itemName || '').trim().toLowerCase();
        const opts = (record.itemType === 'PRODUCT' && q)
          ? products.filter((p) => { const n = (p.name || '').toLowerCase(); return n.includes(q) && n !== q; }).map((p) => ({ value: p.name }))
          : [];
        return (
          <AutoComplete
            className="inv-item-auto"
            placeholder={t('investment.itemCol.itemNamePlaceholder', 'Item name')}
            value={record.itemName}
            onChange={(val) => updateItemRow(record.id, 'itemName', val)}
            options={opts}
            style={{ width: '100%', fontSize: '0.82rem' }}
            size="small"
            variant="borderless"
          />
        );
      },
    },
    {
      title: t('investment.itemCol.qty', 'Qty'),
      width: 80,
      render: (_, record) => (
        <InputNumber
          min={0}
          value={record.quantity}
          onChange={(val) => updateItemRow(record.id, 'quantity', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: t('investment.itemCol.unit', 'Unit'),
      width: 100,
      render: (_, record) => (
        <Select
          value={record.unit}
          onChange={(val) => updateItemRow(record.id, 'unit', val)}
          style={{ width: '100%' }}
          size="small"
          variant="borderless"
        >
          {UNIT_OPTIONS.map((u) => (
            <Option key={u.key} value={u.key}>{unitLabel(u.key)}</Option>
          ))}
        </Select>
      ),
    },
    {
      title: `${t('investment.itemCol.rate', 'Rate')} (${getCurrencySymbol()})`,
      width: 100,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.rate}
          onChange={(val) => updateItemRow(record.id, 'rate', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: (
        <Tooltip title={t('investment.itemCol.mrpTooltip', 'Selling price (MRP) for this stock — required for every product.')}>
          <span>{t('investment.itemCol.mrp', 'MRP')} ({getCurrencySymbol()}) <span style={{ color: '#DC2626' }}>*</span></span>
        </Tooltip>
      ),
      width: 110,
      render: (_, record) =>
        record.itemType === 'PRODUCT' ? (
          <InputNumber
            min={0}
            precision={2}
            value={record.mrp}
            onChange={(val) => updateItemRow(record.id, 'mrp', val)}
            placeholder="0"
            controls={false}
            style={{ width: '100%', fontSize: '0.82rem' }}
            size="small"
            variant="borderless"
          />
        ) : (
          <span style={{ color: '#CBD5E1', fontSize: '0.8rem' }}>—</span>
        ),
    },
    {
      title: `${t('common.amount', 'Amount')} (${getCurrencySymbol()})`,
      width: 100,
      render: (_, record) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)', fontSize: '0.85rem' }}>
          {Number(record.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: '',
      width: 40,
      render: (_, record) =>
        itemRows.length > 1 ? (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeItemRow(record.id)}
            style={{ color: '#EF4444' }}
          />
        ) : null,
    },
  ];

  const overheadItemColumns = [
    {
      title: t('investment.itemCol.sno', 'S.No'),
      width: 48,
      render: (_, __, i) => (
        <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.78rem' }}>{i + 1}</span>
      ),
    },
    {
      title: t('investment.overheadCol.expenseName', 'Expense Name'),
      width: 150,
      render: (_, record) => (
        <Input
          placeholder={t('investment.overheadCol.expenseNamePlaceholder', 'Expense name')}
          value={record.expenseName}
          onChange={(e) => updateOverheadRow(record.id, 'expenseName', e.target.value)}
          style={{ fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: `${t('common.amount', 'Amount')} (${getCurrencySymbol()})`,
      width: 150,
      render: (_, record) => (
        <InputNumber
          min={0}
          precision={2}
          value={record.amount}
          onChange={(val) => updateOverheadRow(record.id, 'amount', val)}
          placeholder="0"
          controls={false}
          style={{ width: '100%', fontSize: '0.82rem' }}
          size="small"
          variant="borderless"
        />
      ),
    },
    {
      title: '',
      width: 40,
      render: (_, record) =>
        overheadRows.length > 1 ? (
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => removeOverheadRow(record.id)}
            style={{ color: '#EF4444' }}
          />
        ) : null,
    },
  ];

  // ── View Drawer Items Table ────────────
  const drawerItemColumns = [
    {
      title: t('investment.drawerCol.item', 'Item'),
      dataIndex: "itemName",
      key: "itemName",
      render: (v, r) => v || r.expenseName || "—",
    },
    {
      title: t('investment.drawerCol.qty', 'Qty'),
      dataIndex: "quantity",
      key: "quantity",
      width: 70,
      render: (v) => v ?? "—",
    },
    {
      title: t('investment.drawerCol.unit', 'Unit'),
      dataIndex: "unit",
      key: "unit",
      width: 70,
      render: (v) => v || "—",
    },
    {
      title: t('investment.drawerCol.rate', 'Rate'),
      dataIndex: "rate",
      key: "rate",
      width: 90,
      render: (v) =>
        v != null ? `${getCurrencySymbol()}${Number(v).toLocaleString("en-IN")}` : "—",
    },
    {
      title: t('common.amount', 'Amount'),
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 110,
      render: (v) => (
        <span style={{ fontWeight: 700, color: "var(--theme-primary)" }}>
          {getCurrencySymbol()}{Number(v || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  // ── Vendor recent investments columns ──
  const recentInvColumns = [
    {
      title: t('investment.recentCol.reference', 'Reference'),
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{v || '—'}</span>,
    },
    {
      title: t('common.date', 'Date'),
      dataIndex: 'purchaseDate',
      key: 'purchaseDate',
      render: (v) => (v ? dayjs(v).format('DD-MMM-YYYY') : '—'),
    },
    {
      title: t('common.amount', 'Amount'),
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: (v) => (
        <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
          {getCurrencySymbol()}{Math.round(Number(v || 0)).toLocaleString('en-IN')}
        </span>
      ),
    },
  ];

  // ── Tab style helper ───────────────────
  const tabStyle = (tab) => ({
    padding: '14px 28px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: activeTab === tab ? 700 : 500,
    color: activeTab === tab ? 'var(--theme-primary)' : '#64748B',
    borderBottom: activeTab === tab ? '2px solid var(--theme-primary)' : '2px solid transparent',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  });

  const inlineInputStyle = {
    borderRadius: 8,
    height: 36,
    fontSize: '0.85rem',
  };

  const labelStyle = {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: '#64748B',
    marginBottom: 4,
    display: 'block',
  };

  // Bill-style rows for the totals / payment summary (right column).
  const billRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '5px 0', fontSize: '0.86rem' };
  const billLabel = { color: '#64748B', fontWeight: 500 };
  const billValue = { color: '#0F172A', fontWeight: 600, fontVariantNumeric: 'tabular-nums' };
  const billDivider = { borderTop: '1px dashed #CBD5E1', margin: '8px 0' };

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
        components: {
          Form: {
            itemMarginBottom: 12,
          },
        },
      }}
    >
      {!isAddPage && (
      <>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>

        {/* ── Page Header ── */}
        {/* <div>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, color: '#0F172A' }}>
            Investment &amp; Vendor
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage raw material purchases, purchased products and business expenses.
          </Typography>
        </div> */}

        {/* ── Tabs ── */}
        <Card style={{ ...cardStyle, padding: 0, overflow: 'hidden' }} styles={{ body: { padding: 0 } }}>
          {/* Tab Bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#FAFAFA',
              borderRadius: '12px 12px 0 0',
            }}
          >
            <div style={tabStyle('investments')} onClick={() => setActiveTab('investments')}>
              {t('investment.tab.investments', 'Investments')}
            </div>
            <div style={tabStyle('vendors')} onClick={() => setActiveTab('vendors')}>
              {t('investment.tab.vendors', 'Vendors')}
            </div>
          </div>

          {/* ════════════════════════════════════
              INVESTMENTS TAB
          ════════════════════════════════════ */}
          {activeTab === 'investments' && (
            <div style={{ padding: '24px' }}>

              {/* Header Row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 24,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                    {t('investment.title', 'Investment')}
                    <HeadingInfo text={t('investment.headingInfo', 'Manage raw material purchases, purchased products and business expenses.')} />
                  </div>
                  {/* Compact inline summary (left of the filter) */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginTop: 6, color: '#334155', fontSize: '0.78rem', fontWeight: 600 }}>
                    <span>
                      <span style={{ color: 'var(--theme-primary)' }}>{t('investment.summary.currentMonth', 'Current Month:')}</span>
                      <span style={{ marginLeft: 4, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{currentMonthInvestment.toLocaleString('en-IN')}</span>
                    </span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span>
                      <span style={{ color: 'var(--theme-primary)' }}>{t('investment.summary.total', 'Total:')}</span>
                      <span style={{ marginLeft: 4, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{totalInvestment.toLocaleString('en-IN')}</span>
                    </span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span>
                      <span style={{ color: 'var(--theme-primary)' }}>{t('investment.summary.purchase', 'Purchase:')}</span>
                      <span style={{ marginLeft: 4, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{purchaseTotal.toLocaleString('en-IN')}</span>
                    </span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span>
                      <span style={{ color: 'var(--theme-primary)' }}>{t('investment.summary.overhead', 'Overhead:')}</span>
                      <span style={{ marginLeft: 4, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{overheadTotal.toLocaleString('en-IN')}</span>
                    </span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span
                      onClick={() => setAppliedFilters((p) => ({ ...p, paymentStatus: p.paymentStatus === 'DUE' ? undefined : 'DUE' }))}
                      title={appliedFilters.paymentStatus === 'DUE' ? t('investment.dueFilterOn', 'Showing only records with a pending due — click to clear') : t('investment.dueFilterOff', 'Click to show only records with a pending due')}
                      style={{
                        cursor: 'pointer',
                        fontWeight: appliedFilters.paymentStatus === 'DUE' ? 800 : 'inherit',
                        padding: appliedFilters.paymentStatus === 'DUE' ? '1px 7px' : 0,
                        borderRadius: 6,
                        backgroundColor: appliedFilters.paymentStatus === 'DUE' ? 'rgba(185,28,28,0.1)' : 'transparent',
                        border: appliedFilters.paymentStatus === 'DUE' ? '1px solid #B91C1C' : '1px solid transparent',
                      }}
                    >
                      <span style={{ color: '#B91C1C' }}>{t('investment.summary.due', 'Due:')}</span>
                      <span style={{ marginLeft: 4, color: '#DC2626' }}>{getCurrencySymbol()}{totalDue.toLocaleString('en-IN')}</span>
                      {appliedFilters.paymentStatus === 'DUE' ? <span style={{ marginLeft: 6, color: '#B91C1C' }}>✕</span> : null}
                    </span>
                  </div>
                </div>
                <Space size={10} style={{ flexShrink: 0 }}>
                  <Popover
                    trigger="click"
                    placement="leftTop"
                    open={filterOpen}
                    onOpenChange={setFilterOpen}
                    content={
                      <div style={{ width: 260 }}>
                        <span style={labelStyle}>{t('investment.filter.dateFrom', 'Date From')}</span>
                        <DatePicker
                          value={investmentFilters.fromDate}
                          onChange={(d) => setInvestmentFilters((p) => ({ ...p, fromDate: d }))}
                          format="DD-MM-YYYY"
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 12 }}
                          placeholder="dd-mm-yyyy"
                        />
                        <span style={labelStyle}>{t('investment.filter.dateTo', 'Date To')}</span>
                        <DatePicker
                          value={investmentFilters.toDate}
                          onChange={(d) => setInvestmentFilters((p) => ({ ...p, toDate: d }))}
                          format="DD-MM-YYYY"
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 12 }}
                          placeholder="dd-mm-yyyy"
                        />
                        <span style={labelStyle}>{t('investment.filter.vendor', 'Vendor')}</span>
                        <Select
                          value={investmentFilters.vendorId}
                          onChange={(v) => setInvestmentFilters((p) => ({ ...p, vendorId: v }))}
                          placeholder={t('investment.filter.allVendors', 'All Vendors')}
                          allowClear
                          style={{ width: '100%', marginBottom: 12 }}
                        >
                          {vendors.map((v) => (
                            <Option key={v.id} value={v.id}>{v.name}</Option>
                          ))}
                        </Select>
                        <span style={labelStyle}>{t('investment.filter.investmentType', 'Investment Type')}</span>
                        <Select
                          value={investmentFilters.type}
                          onChange={(v) => setInvestmentFilters((p) => ({ ...p, type: v }))}
                          placeholder={t('investment.filter.allTypes', 'All Types')}
                          allowClear
                          style={{ width: '100%', marginBottom: 12 }}
                        >
                          {INVESTMENT_TYPES.map((ty) => (
                            <Option key={ty.value} value={ty.value}>{typeLabel(ty.value)}</Option>
                          ))}
                        </Select>
                        <span style={labelStyle}>{t('investment.filter.paymentStatus', 'Payment Status')}</span>
                        <Select
                          value={investmentFilters.paymentStatus}
                          onChange={(v) => setInvestmentFilters((p) => ({ ...p, paymentStatus: v }))}
                          placeholder={t('investment.filter.allPayments', 'All Payments')}
                          allowClear
                          style={{ width: '100%', marginBottom: 12 }}
                        >
                          <Option value="PAID">{t('investment.status.paid', 'Paid')}</Option>
                          <Option value="PARTIALLY_PAID">{t('investment.status.partial', 'Partial')}</Option>
                          <Option value="PENDING">{t('investment.status.unpaid', 'Unpaid')}</Option>
                        </Select>
                        <span style={labelStyle}>{t('common.search', 'Search')}</span>
                        <Input
                          value={investmentFilters.search}
                          onChange={(e) => setInvestmentFilters((p) => ({ ...p, search: e.target.value }))}
                          placeholder={t('investment.filter.searchPlaceholder', 'Invoice number …')}
                          prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                          style={{ ...inlineInputStyle, width: '100%', marginBottom: 16 }}
                          allowClear
                          onPressEnter={handleApplyFilters}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <Button onClick={handleResetFilters} icon={<ReloadOutlined />} style={{ borderRadius: 8 }}>
                            {t('common.reset', 'Reset')}
                          </Button>
                          <Button type="primary" onClick={handleApplyFilters} icon={<SearchOutlined />} style={{ borderRadius: 8 }}>
                            {t('common.search', 'Search')}
                          </Button>
                        </div>
                      </div>
                    }
                  >
                    <Badge count={activeFilterCount} size="small">
                      <Button icon={<FilterOutlined />} style={{ borderRadius: 8, fontWeight: 600, height: 38 }}>
                        {t('common.filters', 'Filters')}
                      </Button>
                    </Badge>
                  </Popover>
                  {can('investment', 'write') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddInvestment}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      height: 38,
                      paddingInline: 18,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    }}
                  >
                    {t('investment.addInvestment', 'Add Investment')}
                  </Button>
                  )}
                </Space>
              </div>

              {/* Investments Table — flush to the outer card (cancels the 24px wrapper padding) */}
              <Card style={{ ...cardStyle, borderRadius: 0, border: 'none', boxShadow: 'none', margin: '0 -24px -24px -24px' }} styles={{ body: { padding: 0 } }}>
                <Table
                  className="custom-table"
                  size="small"
                  rowKey="id"
                  dataSource={investments
                    .filter((i) => {
                      if (!appliedFilters.paymentStatus) return true;
                      const st = i.paymentStatus || 'PENDING';
                      // "DUE" (from the Due stat click) = anything still owing: unpaid or partial.
                      return appliedFilters.paymentStatus === 'DUE' ? st !== 'PAID' : st === appliedFilters.paymentStatus;
                    })
                    .map((i) => ({ ...i, key: i.id }))}
                  columns={investmentColumns}
                  loading={invLoading}
                  onRow={(record) => ({
                    onClick: () => handleViewInvestment(record),
                    style: { cursor: 'pointer' },
                  })}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    showTotal: (total, range) =>
                      `${t('investment.pagination.showing', 'Showing')} ${range[0]} ${t('investment.pagination.to', 'to')} ${range[1]} ${t('investment.pagination.of', 'of')} ${total} ${t('investment.pagination.entries', 'entries')}`,
                    style: { margin: '12px 20px' },
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                              {t('investment.empty.noInvestmentsTitle', 'No Investments Found')}
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: '0.83rem' }}>
                              {t('investment.empty.noInvestmentsDesc', 'Click "Add Investment" to record your first investment.')}
                            </div>
                          </div>
                        }
                      />
                    ),
                  }}
                  style={{ borderRadius: 0, overflow: 'hidden' }}
                  sticky
                />
              </Card>
            </div>
          )}

          {/* ════════════════════════════════════
              VENDORS TAB
          ════════════════════════════════════ */}
          {activeTab === 'vendors' && (
            <div style={{ padding: '24px' }}>

              {/* Compact Header Row: title + inline counts + search + add */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                    {t('investment.vendorMgmt', 'Vendor Management')}
                    <HeadingInfo text={t('investment.vendorMgmtInfo', 'Manage suppliers and vendor information.')} />
                  </div>
                  <div style={{ marginTop: 4, fontSize: '0.85rem', fontWeight: 600, color: '#334155', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span><span style={{ color: 'var(--theme-primary)' }}>{t('investment.vendorSummary.total', 'Total:')}</span> {totalVendors}</span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span><span style={{ color: 'var(--theme-primary)' }}>{t('investment.vendorSummary.active', 'Active:')}</span> {activeVendors}</span>
                    <span style={{ color: '#CBD5E1' }}>|</span>
                    <span><span style={{ color: '#DC2626' }}>{t('investment.vendorSummary.inactive', 'Inactive:')}</span> {inactiveVendors}</span>
                  </div>
                </div>
                <Space size={10} wrap>
                  <Input
                    placeholder={t('investment.vendorSearchPlaceholder', 'Search by name, GST, phone, email…')}
                    prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
                    value={vendorSearch}
                    onChange={(e) => setVendorSearch(e.target.value)}
                    allowClear
                    style={{ width: 300, borderRadius: 8, height: 38 }}
                  />
                  {can('investment', 'write') && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenAddVendor}
                    style={{
                      borderRadius: 8,
                      fontWeight: 700,
                      height: 38,
                      paddingInline: 18,
                      boxShadow: '0 2px 8px rgba(37,99,235,0.3)',
                    }}
                  >
                    {t('investment.addVendor', 'Add Vendor')}
                  </Button>
                  )}
                </Space>
              </div>

              {/* Vendors Table — flush to the outer card (cancels the 24px wrapper padding) */}
              <Card style={{ ...cardStyle, borderRadius: 0, border: 'none', boxShadow: 'none', margin: '0 -24px -24px -24px' }} styles={{ body: { padding: 0 } }}>
                <Table
                  className="custom-table"
                  size="small"
                  rowKey="id"
                  dataSource={filteredVendors.map((v) => ({ ...v, key: v.id }))}
                  columns={vendorColumns}
                  loading={vendorsLoading}
                  onRow={(record) => ({
                    onClick: () => handleOpenVendorDrawer(record),
                    style: { cursor: 'pointer' },
                  })}
                  pagination={{
                    defaultPageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '25', '50'],
                    showTotal: (total, range) =>
                      `${t('investment.pagination.showing', 'Showing')} ${range[0]} ${t('investment.pagination.to', 'to')} ${range[1]} ${t('investment.pagination.of', 'of')} ${total} ${t('investment.pagination.entries', 'entries')}`,
                    style: { margin: '12px 20px' },
                  }}
                  locale={{
                    emptyText: (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                          <div style={{ padding: '16px 0' }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>
                              {t('investment.empty.noVendorsTitle', 'No Vendors Found')}
                            </div>
                            <div style={{ color: '#94A3B8', fontSize: '0.83rem' }}>
                              {t('investment.empty.noVendorsDesc', 'Click "Add Vendor" to register your first vendor.')}
                            </div>
                          </div>
                        }
                      />
                    ),
                  }}
                  style={{ borderRadius: 0, overflow: 'hidden' }}
                  sticky
                />
              </Card>
            </div>
          )}
        </Card>
      </Box>

      {/* ════════════════════════════════════
          VIEW INVESTMENT DRAWER
      ════════════════════════════════════ */}
      <Drawer
        title={
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '1rem',
              fontWeight: 800,
              color: '#0F172A',
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileTextOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.95rem' }} />
            </div>
            {t('investment.drawer.title', 'Investment Details')}
          </span>
        }
        placement="right"
        width={580}
        onClose={() => { setViewDrawerVisible(false); setSelectedInvestment(null); }}
        open={viewDrawerVisible}
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: 16 }}
        extra={
          investmentDetail && investmentDetail.investmentType !== 'OVERHEAD' ? (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={downloadingInvoice}
              onClick={handleDownloadInvoice}
            >
              {t('investment.drawer.invoicePdf', 'Invoice PDF')}
            </Button>
          ) : null
        }
      >
        {invDetailLoading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : investmentDetail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Info Card */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0', marginTop: 6 }} bodyStyle={{ padding: '12px 16px' }}>
              <Row gutter={[10, 8]}>
                {[
                  { label: t('investment.drawer.invoiceNumber', 'Invoice Number'), value: investmentDetail.invoiceNumber || '—' },
                  {
                    label: t('investment.drawer.vendor', 'Vendor'),
                    value: investmentDetail.vendorId ? (
                      <a
                        onClick={() => navigate(`/vendors/${investmentDetail.vendorId}`)}
                        style={{ color: 'var(--theme-primary)', fontWeight: 600, cursor: 'pointer' }}
                      >
                        {investmentDetail.vendorName || '—'}
                      </a>
                    ) : (investmentDetail.vendorName || '—'),
                  },
                  {
                    label: t('investment.drawer.purchaseDate', 'Purchase Date'),
                    value: investmentDetail.purchaseDate
                      ? dayjs(investmentDetail.purchaseDate).format('DD-MMM-YYYY')
                      : '—',
                  },
                  {
                    label: t('investment.drawer.type', 'Type'),
                    value: <TypeBadge type={investmentDetail.investmentType} />,
                  },
                ].map(({ label, value }) => (
                  <Col xs={6} key={label}>
                    <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 1 }}>
                      {label}
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0F172A' }}>
                      {value}
                    </div>
                  </Col>
                ))}
                {investmentDetail.remarks && (
                  <Col xs={24}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
                      {t('investment.drawer.remarks', 'Remarks')}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                      {investmentDetail.remarks}
                    </div>
                  </Col>
                )}
              </Row>
            </Card>

            <Divider style={{ margin: '0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{t('investment.drawer.items', 'Items')}</span>
            </Divider>

            {/* Items Table */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 0 }}>
              <Table
                dataSource={(investmentDetail.items || []).map((it, idx) => ({ ...it, key: idx }))}
                columns={drawerItemColumns}
                pagination={false}
                size="small"
                style={{ borderRadius: 10, overflow: 'hidden' }}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('investment.empty.noItems', 'No items')} /> }}
              />
            </Card>

            <Divider style={{ margin: '0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{t('investment.drawer.summary', 'Summary')}</span>
            </Divider>

            {/* Totals Card */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '12px 16px' }}>
              {[
                { label: t('investment.drawer.subtotal', 'Subtotal'), value: investmentDetail.subTotal, color: '#0F172A' },
                { label: t('investment.drawer.gst', 'GST'), value: investmentDetail.gstAmount, color: '#0F172A' },
                { label: t('investment.drawer.discount', 'Discount'), value: investmentDetail.discountAmount, color: '#DC2626', prefix: '− ' },
              ].map(({ label, value, color, prefix }) => (
                <div
                  key={label}
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: '0.82rem' }}
                >
                  <span style={{ color: '#64748B', fontWeight: 500 }}>{label}</span>
                  <span style={{ color, fontWeight: 600 }}>
                    {prefix || ''}{getCurrencySymbol()}{Number(value || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
              <Divider style={{ margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{t('investment.drawer.grandTotal', 'Grand Total')}</span>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--theme-primary)' }}>
                  {getCurrencySymbol()}{Math.round(Number(investmentDetail.grandTotal || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </Card>

            <Divider style={{ margin: '0', borderColor: '#E2E8F0' }}>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{t('investment.drawer.payments', 'Payments')}</span>
            </Divider>

            {/* Payment summary + add form + history */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '12px 16px' }}>
              {/* Summary row */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                <div style={{ flex: '1 1 110px', background: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #BBF7D0', borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: 700 }}>{t('investment.drawer.paid', 'Paid')}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{Number(investmentDetail.amountPaid || 0).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ flex: '1 1 110px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700 }}>{t('investment.drawer.due', 'Due')}</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#DC2626' }}>{getCurrencySymbol()}{detailDue.toLocaleString('en-IN')}</div>
                </div>
                <div style={{ flex: '1 1 110px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 10px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#475569', fontWeight: 700 }}>{t('common.status', 'Status')}</div>
                  <Tag style={{ marginTop: 2, background: (PAYMENT_STATUS_META[investmentDetail.paymentStatus] || PAYMENT_STATUS_META.PENDING).bg, border: 'none', color: '#fff', fontWeight: 700, borderRadius: 16, fontSize: '0.82rem', padding: '2px 10px' }}>
                    {(PAYMENT_STATUS_META[investmentDetail.paymentStatus] || PAYMENT_STATUS_META.PENDING).label}
                  </Tag>
                </div>
              </div>

              {/* Add payment form (hidden once fully paid) */}
              {investmentDetail.paymentStatus !== 'PAID' && (
                <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px dashed #E2E8F0' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <InputNumber
                      value={payAmount}
                      onChange={(v) => setPayAmount(v == null ? null : Math.min(v, detailDue))}
                      min={0}
                      max={detailDue}
                      placeholder={t('common.amount', 'Amount')}
                      prefix={getCurrencySymbol()}
                      style={{ width: 130 }}
                    />
                    <Select value={payMode} onChange={setPayMode} style={{ width: 130 }}>
                      <Option value="CASH">{t('investment.mode.cash', 'Cash')}</Option>
                      <Option value="UPI">{t('investment.mode.upi', 'UPI')}</Option>
                      <Option value="CREDIT_CARD">{t('investment.mode.creditCard', 'Credit Card')}</Option>
                      <Option value="DEBIT_CARD">{t('investment.mode.debitCard', 'Debit Card')}</Option>
                      <Option value="NET_BANKING">{t('investment.mode.netBanking', 'Net Banking')}</Option>
                    </Select>
                    <DatePicker
                      value={payDate || dayjs()}
                      onChange={setPayDate}
                      format="DD-MMM-YYYY"
                      allowClear={false}
                      placeholder={t('investment.drawer.paymentDatePlaceholder', 'Payment date')}
                      style={{ width: 150 }}
                      disabledDate={(d) =>
                        d && (
                          d.isAfter(dayjs(), 'day') ||
                          (investmentDetail.purchaseDate && d.isBefore(dayjs(investmentDetail.purchaseDate), 'day'))
                        )
                      }
                    />
                    <Button type="primary" icon={<PlusOutlined />} loading={addPaymentMutation.isPending} onClick={handleAddPayment} style={{ borderRadius: 8 }}>
                      {t('common.add', 'Add')}
                    </Button>
                  </div>
                  {payMode !== 'CASH' && (
                    <Input
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                      placeholder={t('investment.drawer.referencePlaceholder', 'Reference / txn id (optional)')}
                      maxLength={120}
                      style={{ marginTop: 8, maxWidth: 267 }}
                    />
                  )}
                </div>
              )}

              {/* Payment history */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', marginBottom: 8 }}>{t('investment.drawer.paymentHistory', 'Payment History')}</div>
              {(investmentDetail.payments && investmentDetail.payments.length > 0) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {investmentDetail.payments.map((p) => {
                    const isOrigin = p.groupOrigin && p.allocations && p.allocations.length > 1;
                    const clearedElsewhere = !isOrigin && p.clearedFromInvoice;
                    // Origin invoice shows the whole transaction; cleared invoices show only their part.
                    const headline = isOrigin ? Number(p.groupTotal || 0) : Number(p.amount);
                    return (
                    <div key={p.id} style={{ padding: '8px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.85rem' }}>{dayjs(p.paymentDate).format('DD-MMM-YYYY')}</span>
                          <Tag style={{ borderRadius: 6 }}>{p.mode}</Tag>
                          {p.reference ? <span style={{ color: '#64748B', fontSize: '0.78rem' }}>{t('investment.drawer.ref', 'Ref:')} {p.reference}</span> : null}
                        </div>
                        <span style={{ fontWeight: 800, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{headline.toLocaleString('en-IN')}</span>
                      </div>
                      {/* Origin invoice: where each part of the payment went (this invoice + previous dues). */}
                      {isOrigin && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #E2E8F0' }}>
                          {p.allocations.map((a, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.78rem', color: a.thisInvoice ? 'var(--theme-primary)' : '#475569', fontWeight: a.thisInvoice ? 700 : 500 }}>
                              <span>{a.thisInvoice ? t('investment.drawer.thisInvoice', 'This invoice') : `${a.invoiceNumber || t('investment.invoice', 'Invoice')} ${t('investment.drawer.previousDueSuffix', '(previous due)')}`}</span>
                              <span>{getCurrencySymbol()}{Number(a.amount).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Cleared by a payment made on another invoice — reference only. */}
                      {clearedElsewhere && (
                        <div style={{ marginTop: 6, fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                          {t('investment.drawer.clearedVia', 'Cleared via payment on')} {dayjs(p.paymentDate).format('DD-MMM-YYYY')} · {p.clearedFromInvoice}
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              ) : (
                <div style={{ color: '#94A3B8', fontSize: '0.83rem', padding: '8px 0' }}>{t('investment.empty.noPayments', 'No payments recorded yet.')}</div>
              )}
            </Card>
          </div>
        ) : (
          <Empty description={t('investment.empty.noDetails', 'No details available')} />
        )}
      </Drawer>
        </>
        )}

      {/* ════════════════════════════════════
          ADD INVESTMENT — FULL PAGE
      ════════════════════════════════════ */}
      {isAddPage && (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <Button onClick={handleCloseAddModal} icon={<ArrowLeftOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>{t('common.back', 'Back')}</Button>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WalletOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />
            </div>
            {t('investment.addNewInvestment', 'Add New Investment')}
          </span>
        </div>
        <Form
          form={investmentForm}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
          {/* Two columns: left = type + items, right = totals + payment */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* ── LEFT: Investment Type + Purchase Items ── */}
          <Box sx={{ flex: '1 1 460px', minWidth: 0 }}>
          {/* Section 1: Header Fields */}
          <Card
            style={{ borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 12 }}
            bodyStyle={{ padding: '12px 16px' }}
          >
            <Row gutter={[16, 0]}>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="type"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.form.investmentType', 'Investment Type')} *</span>}
                  rules={[{ required: true, message: t('investment.form.typeRequired', 'Please select a type.') }]}
                >
                  <Select
                    placeholder={t('investment.form.selectType', 'Select Type')}
                    style={{ borderRadius: 8 }}
                    size="middle"
                    onChange={handleTypeChange}
                    disabled={isFromVendorDetails}
                  >
                    {INVESTMENT_TYPES.map((t) => (
                      <Option key={t.value} value={t.value}>
                        <TypeBadge type={t.value} />
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              {/* Vendor — only for PURCHASE */}
              {selectedType === 'PURCHASE' && (
                <Col xs={24} sm={12} lg={8}>
                  <Form.Item
                    name="vendorId"
                    label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.form.vendor', 'Vendor')} *</span>}
                    rules={[{ required: true, message: t('investment.form.vendorRequired', 'Please select a vendor.') }]}
                  >
                    <Select
                      placeholder={t('investment.form.selectVendor', 'Select or search vendor')}
                      style={{ borderRadius: 8 }}
                      size="middle"
                      showSearch
                      optionFilterProp="children"
                      onSearch={setVendorSearchText}
                      disabled={isFromVendorDetails}
                      dropdownRender={(menu) => (
                        <>
                          {menu}
                          <Divider style={{ margin: '6px 0' }} />
                          <div style={{ padding: '2px 8px 6px' }}>
                            <Button
                              type="link"
                              icon={<PlusOutlined />}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={openQuickVendor}
                              style={{ padding: 0, fontWeight: 600 }}
                            >
                              {t('common.add', 'Add')} {vendorSearchText ? `"${vendorSearchText}"` : t('investment.form.newVendor', 'new vendor')}
                            </Button>
                          </div>
                        </>
                      )}
                    >
                      {vendors.map((v) => (
                        <Option key={v.id} value={v.id}>{v.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              )}
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="purchaseDate"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.form.purchaseDate', 'Purchase Date')} *</span>}
                  rules={[{ required: true, message: t('investment.form.dateRequired', 'Please select a date.') }]}
                >
                  <DatePicker
                    format="DD-MM-YYYY"
                    style={{ width: '100%', borderRadius: 8 }}
                    size="middle"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <Form.Item
                  name="invoiceNumber"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.form.invoiceNumber', 'Invoice Number')}</span>}
                >
                  <Input placeholder={t('investment.form.invoiceAuto', 'Auto Generated if left blank')} style={{ borderRadius: 8 }} size="middle" />
                </Form.Item>
              </Col>
              {/* GST / Discount / Other — only for PURCHASE */}
              {selectedType === 'PURCHASE' && (
                <>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>
                        {t('investment.form.gstPercent', 'GST %')}
                        <span style={{ fontWeight: 500, color: '#6B7280' }}> = {getCurrencySymbol()}{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </span>}
                    >
                      <InputNumber
                        min={0}
                        max={100}
                        precision={2}
                        value={gstRate}
                        onChange={(v) => { setGstRate(v ?? 0); setGstManual(true); }}
                        style={{ width: '100%', borderRadius: 8 }}
                        size="middle"
                        placeholder="0"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={8} lg={8}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: '#374151' }}>
                        {t('investment.form.discount', 'Discount')}
                        {discountMode === 'PERCENT' && (
                          <span style={{ fontWeight: 500, color: '#6B7280' }}> = {getCurrencySymbol()}{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        )}
                      </span>}
                    >
                      <InputNumber
                        min={0}
                        max={discountMode === 'PERCENT' ? 100 : undefined}
                        precision={2}
                        controls={false}
                        value={discountMode === 'PERCENT' ? discountPct : discount}
                        onChange={(v) => (discountMode === 'PERCENT' ? setDiscountPct(v ?? 0) : setDiscount(v || 0))}
                        className="skr-discount-input"
                        addonBefore={
                          <Segmented
                            size="small"
                            value={discountMode}
                            onChange={setDiscountMode}
                            options={[{ label: '%', value: 'PERCENT' }, { label: getCurrencySymbol(), value: 'AMOUNT' }]}
                          />
                        }
                        style={{ width: '100%' }}
                        size="middle"
                        placeholder={discountMode === 'PERCENT' ? '0' : '0.00'}
                      />
                    </Form.Item>
                  </Col>
                </>
              )}
            </Row>
          </Card>

          {/* Inline add-new-vendor panel (Purchase type) */}
          {selectedType === 'PURCHASE' && quickVendorOpen && (
            <Card style={{ borderRadius: 10, border: '1px solid var(--theme-primary)', marginBottom: 12 }} bodyStyle={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>{t('investment.quickVendor.title', 'Add new vendor')}</span>
                <Button type="text" size="small" onClick={() => setQuickVendorOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
              </div>
              <Row gutter={[12, 8]}>
                <Col xs={24} sm={12}>
                  <div style={labelStyle}>{t('investment.quickVendor.name', 'Name')} *</div>
                  <Input value={qv.name} onChange={(e) => setQv((p) => ({ ...p, name: e.target.value }))} placeholder={t('investment.quickVendor.namePlaceholder', 'Vendor name')} style={{ borderRadius: 8 }} />
                </Col>
                <Col xs={24} sm={12}>
                  <div style={labelStyle}>{t('investment.quickVendor.phone', 'Phone')} *</div>
                  <Input
                    value={qv.mobile}
                    onChange={(e) => setQv((p) => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder={t('investment.quickVendor.phonePlaceholder', '10-digit phone number')}
                    maxLength={10}
                    style={{ borderRadius: 8 }}
                  />
                </Col>
              </Row>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                <Button type="primary" loading={qvSaving} onClick={saveQuickVendor} style={{ borderRadius: 8, fontWeight: 700 }}>{t('investment.quickVendor.addSelect', 'Add & select')}</Button>
              </div>
            </Card>
          )}

          {/* Dynamic Items Section */}
          {selectedType && (
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                  {selectedType === 'OVERHEAD' ? t('investment.expenseItems', 'Expense Items') : t('investment.purchaseItems', 'Purchase Items')}
                </span>
              }
              style={{ borderRadius: 10, border: '1px solid #E2E8F0', marginBottom: 12 }}
              bodyStyle={{ padding: '0 0 8px 0' }}
            >
              <Table
                dataSource={
                  selectedType === 'OVERHEAD'
                    ? overheadRows.map((r) => ({ ...r, key: r.id }))
                    : itemRows.map((r) => ({ ...r, key: r.id }))
                }
                columns={selectedType === 'OVERHEAD' ? overheadItemColumns : purchaseItemColumns}
                pagination={false}
                size="small"
                className="skr-item-table"
                style={{ overflow: 'hidden' }}
              />
              <div style={{ padding: '12px 16px 0' }}>
                <Button
                  icon={<PlusOutlined />}
                  onClick={selectedType === 'OVERHEAD' ? addOverheadRow : addItemRow}
                  style={{
                    borderRadius: 8,
                    borderColor: 'var(--theme-primary)',
                    color: 'var(--theme-primary)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                  }}
                >
                  {t('common.add', 'Add')} {selectedType === 'OVERHEAD' ? t('investment.expense', 'Expense') : t('investment.item', 'Item')}
                </Button>
              </div>
            </Card>
          )}
          </Box>
          {/* ── RIGHT: Totals + Payment ── */}
          <Box sx={{ flex: '1 1 320px', minWidth: 300 }}>
          {/* Bill summary */}
          <Card
            style={{
              borderRadius: 10,
              border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)',
              marginBottom: 12,
            }}
            bodyStyle={{ padding: '14px 18px', background: 'color-mix(in srgb, var(--theme-primary) 10%, white)', borderRadius: 10 }}
          >
            <div style={billRow}>
              <span style={billLabel}>{t('investment.bill.subtotal', 'Subtotal')}</span>
              <span style={billValue}>{getCurrencySymbol()}{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {selectedType === 'PURCHASE' && (
              <>
                <div style={billRow}>
                  <span style={billLabel}>{t('investment.bill.gst', 'GST')}</span>
                  <span style={billValue}>+ {getCurrencySymbol()}{gst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={billRow}>
                  <span style={billLabel}>{t('investment.bill.discount', 'Discount')}</span>
                  <span style={billValue}>− {getCurrencySymbol()}{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </>
            )}
            <div style={billDivider} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ color: '#0F172A', fontWeight: 700, fontSize: '0.92rem' }}>{t('investment.bill.grandTotal', 'Grand Total')}</span>
              <span style={{ color: 'var(--theme-primary)', fontWeight: 700, fontSize: '1.1rem', fontVariantNumeric: 'tabular-nums' }}>
                {getCurrencySymbol()}{(selectedType === 'OVERHEAD' ? Math.round(subtotal) : grandTotal).toLocaleString('en-IN')}
              </span>
            </div>
          </Card>

          {/* Payment — bill style, captured at creation (clears oldest vendor dues first) */}
          <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0', position: 'relative', overflow: 'hidden' }} bodyStyle={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>{t('investment.bill.payment', 'Payment')}</span>
              {selectedType === 'PURCHASE' && vendorOverdue > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDues((s) => !s)}
                  style={{
                    cursor: 'pointer', borderRadius: 999, padding: '2px 10px', fontSize: '0.74rem', fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    color: 'var(--theme-primary)',
                    background: 'color-mix(in srgb, var(--theme-primary) 10%, white)',
                    border: '1px solid color-mix(in srgb, var(--theme-primary) 35%, white)',
                  }}
                >
                  <LeftOutlined style={{ fontSize: 10, transform: showDues ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s ease' }} />
                  {t('investment.bill.previousDues', 'Previous dues')} ({vendorUnpaid.length})
                </button>
              )}
            </div>

            {/* Click-outside backdrop: closes the dues panel (sits just below it) */}
            {showDues && (
              <div onClick={() => setShowDues(false)} style={{ position: 'absolute', inset: 0, zIndex: 19 }} />
            )}

            {/* Previous dues — slides in from the right, over the payment form (half width, themed) */}
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', zIndex: 20,
              background: 'color-mix(in srgb, var(--theme-primary) 8%, white)',
              borderLeft: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)',
              boxShadow: '-6px 0 18px rgba(15,23,42,0.12)',
              transform: showDues ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s ease',
              padding: '14px 16px', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--theme-primary)', fontSize: '0.86rem' }}>{t('investment.bill.previousDuesOldest', 'Previous dues · oldest first')}</span>
                <CloseOutlined onClick={() => setShowDues(false)} style={{ cursor: 'pointer', color: 'var(--theme-primary)', fontSize: 13 }} />
              </div>
              {payNow > 0 && (
                <div style={{ fontSize: '0.7rem', color: '#64748B', marginBottom: 8 }}>
                  <CheckCircleOutlined style={{ color: '#16A34A' }} /> {t('investment.bill.cleared', 'cleared')} · <span style={{ color: '#D97706', fontWeight: 700 }}>●</span> {t('investment.bill.partial', 'partial')} · <span style={{ color: '#C0C0C0', fontWeight: 700 }}>●</span> {t('investment.bill.pending', 'pending')}
                </div>
              )}
              <div style={{ overflowY: 'auto' }}>
                {duesWithStatus.map((inv) => {
                  const cleared = inv.status === 'cleared';
                  const partial = inv.status === 'partial';
                  const rowColor = cleared ? '#16A34A' : partial ? '#D97706' : '#C0C0C0';
                  return (
                    <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', padding: '5px 0', borderBottom: '1px dashed #EEF2F7', opacity: payNow > 0 && inv.status === 'pending' ? 0.6 : 1 }}>
                      <span style={{ color: '#0F172A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {payNow > 0 && (cleared
                          ? <CheckCircleOutlined style={{ color: '#16A34A', fontSize: 13 }} />
                          : <span style={{ color: rowColor, fontSize: 11 }}>●</span>)}
                        {inv.invoiceNumber || t('investment.invoice', 'Invoice')}
                        <span style={{ color: '#94A3B8', fontWeight: 500 }}>
                          {inv.purchaseDate ? dayjs(inv.purchaseDate).format('DD MMM YYYY') : ''}
                        </span>
                      </span>
                      <span style={{ color: 'var(--theme-primary)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {getCurrencySymbol()}{inv.due.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 10, fontWeight: 800 }}>
                <span style={{ color: '#0F172A' }}>{t('investment.bill.totalOverdue', 'Total overdue')}</span>
                <span style={{ color: 'var(--theme-primary)', fontVariantNumeric: 'tabular-nums' }}>{getCurrencySymbol()}{vendorOverdue.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {selectedType === 'PURCHASE' && (
              <>
                <div style={billRow}>
                  <span style={billLabel}>{t('investment.bill.thisInvoice', 'This invoice')}</span>
                  <span style={billValue}>{getCurrencySymbol()}{grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={billRow}>
                  <span style={billLabel}>{t('investment.bill.previousOverdue', 'Previous overdue')}</span>
                  <span style={billValue}>{getCurrencySymbol()}{vendorOverdue.toLocaleString('en-IN')}</span>
                </div>
                <div style={billDivider} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>{t('investment.bill.totalOutstanding', 'Total outstanding')}</span>
                  <span style={{ color: 'var(--theme-primary)', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
                    {getCurrencySymbol()}{Math.round(grandTotal + vendorOverdue).toLocaleString('en-IN')}
                  </span>
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <InputNumber
                className="skr-bottomline"
                value={createPayAmount}
                onChange={(v) => setCreatePayAmount(v == null ? null : Math.min(Number(v), maxPayable))}
                min={0}
                max={maxPayable}
                prefix={getCurrencySymbol()}
                placeholder={t('investment.bill.amountPayingNow', 'Amount paying now')}
                controls={false}
                variant="borderless"
                style={{ flex: 1, minWidth: 150 }}
              />
              <Select className="skr-bottomline" value={createPayMode} onChange={setCreatePayMode} style={{ width: 130 }} variant="borderless">
                <Option value="CASH">{t('investment.mode.cash', 'Cash')}</Option>
                <Option value="UPI">{t('investment.mode.upi', 'UPI')}</Option>
                <Option value="CREDIT_CARD">{t('investment.mode.creditCard', 'Credit Card')}</Option>
                <Option value="DEBIT_CARD">{t('investment.mode.debitCard', 'Debit Card')}</Option>
                <Option value="NET_BANKING">{t('investment.mode.netBanking', 'Net Banking')}</Option>
              </Select>
            </div>

            {createPayMode !== 'CASH' && (Number(createPayAmount) || 0) > 0 && (
              <Input
                className="skr-bottomline"
                value={createPayRef}
                onChange={(e) => setCreatePayRef(e.target.value)}
                placeholder={t('investment.bill.paymentRefPlaceholder', 'Payment reference / txn id (optional)')}
                variant="borderless"
                style={{ marginTop: 8 }}
                maxLength={120}
              />
            )}

            {/* Action buttons live inside the payment card */}
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 8, marginTop: 16 }}>
              <Button onClick={handleCloseAddModal} style={{ borderRadius: 8, fontWeight: 600 }}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="primary"
                loading={createInvestmentMutation.isPending}
                onClick={requestSaveInvestment}
                disabled={!isFormValid}
                style={{ borderRadius: 8, fontWeight: 700 }}
              >
                {t('investment.saveInvestment', 'Save Investment')}
              </Button>
            </div>
          </Card>

          <PaymentConfirmDialog
            open={investConfirmOpen}
            onCancel={() => setInvestConfirmOpen(false)}
            onConfirm={handleSaveInvestment}
            loading={createInvestmentMutation.isPending}
            title={t('investment.confirm.title', 'Confirm Investment')}
            confirmText={t('investment.confirm.confirmText', 'Confirm & Save')}
            rows={[
              // Payment mode only matters when something is actually being paid.
              ...(payNow > 0 ? [{ label: t('investment.confirm.paymentMode', 'Payment Mode'), value: (createPayMode || '-').replace(/_/g, ' ') }] : []),
              { label: t('investment.confirm.currentBill', 'Current Bill'), value: `${getCurrencySymbol()}${(selectedType === 'OVERHEAD' ? Math.round(subtotal) : grandTotal).toLocaleString('en-IN')}` },
              // Previous dues + a combined Total row only matter when the vendor already owes.
              ...(selectedType === 'PURCHASE' && vendorOverdue > 0 ? [
                { label: t('investment.confirm.previousDues', 'Previous Dues'), value: `${getCurrencySymbol()}${Math.round(vendorOverdue).toLocaleString('en-IN')}` },
                { label: t('common.total', 'Total'), value: `${getCurrencySymbol()}${confirmTotalOutstanding.toLocaleString('en-IN')}`, strong: true },
              ] : []),
              { label: t('investment.confirm.amountPaid', 'Amount Paid'), value: `${getCurrencySymbol()}${payNow.toLocaleString('en-IN')}`, strong: true },
            ]}
            dueAmount={confirmDueRemaining}
            dueText={`${getCurrencySymbol()}${confirmDueRemaining.toLocaleString('en-IN')}`}
          />
          </Box>
          </Box>
        </Form>
      </Box>
      )}

      {/* ════════════════════════════════════
          ADD / EDIT VENDOR MODAL
      ════════════════════════════════════ */}
      <Modal
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.95rem' }} />
            </div>
            {selectedVendor ? t('investment.vendorModal.editTitle', 'Edit Vendor') : t('investment.vendorModal.addTitle', 'Add New Vendor')}
          </span>
        }
        open={vendorModalVisible}
        onCancel={handleCloseVendorModal}
        width={600}
        footer={null}
        destroyOnClose
        bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
      >
        <Form
          form={vendorForm}
          layout="vertical"
          requiredMark={false}
          autoComplete="off"
        >
          <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: '18px 20px' }}>
            <Row gutter={[16, 0]}>
              {/* New vendors are Active by default; status is toggled from the vendor list. */}
              <Form.Item name="active" initialValue={true} hidden>
                <Input />
              </Form.Item>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="name"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.vendorModal.name', 'Vendor Name')} *</span>}
                  rules={[{ required: true, message: t('investment.vendorModal.nameRequired', 'Vendor name is required.') }]}
                >
                  <Input placeholder={t('investment.vendorModal.namePlaceholder', 'Enter vendor name')} style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="mobile"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.vendorModal.phone', 'Phone')} *</span>}
                  validateTrigger="onBlur"
                  rules={[
                    { required: true, message: t('investment.vendorModal.phoneRequired', 'Phone is required.') },
                    { pattern: /^\d{10}$/, message: t('investment.vendorModal.phoneInvalid', 'Enter a valid 10-digit number') },
                  ]}
                >
                  <Input placeholder={t('investment.vendorModal.phonePlaceholder', 'Enter phone number')} maxLength={10} style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="gstNumber"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.vendorModal.gstNumber', 'GST Number')}</span>}
                >
                  <Input placeholder={t('investment.vendorModal.gstPlaceholder', 'Enter GST number')} style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="email"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.vendorModal.email', 'Email')}</span>}
                  validateTrigger="onBlur"
                  rules={[{ type: 'email', message: t('investment.vendorModal.emailInvalid', 'Please enter a valid email.') }]}
                >
                  <Input placeholder={t('investment.vendorModal.emailPlaceholder', 'Enter email address')} style={{ borderRadius: 8 }} size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  name="address"
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('investment.vendorModal.address', 'Address')} *</span>}
                  rules={[{ required: true, message: t('investment.vendorModal.addressRequired', 'Address is required.') }]}
                >
                  <TextArea
                    placeholder={t('investment.vendorModal.addressPlaceholder', 'Enter full address')}
                    rows={3}
                    style={{ borderRadius: 8 }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <Button onClick={handleCloseVendorModal} style={{ borderRadius: 8, fontWeight: 600, height: 40 }}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              loading={createVendorMutation.isPending || updateVendorMutation.isPending}
              onClick={handleSaveVendor}
              style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 24 }}
            >
              {selectedVendor ? t('investment.vendorModal.updateVendor', 'Update Vendor') : t('investment.vendorModal.saveVendor', 'Save Vendor')}
            </Button>
          </div>
        </Form>
      </Modal>

    </ConfigProvider>
  );
};

export default InvestmentPage;
