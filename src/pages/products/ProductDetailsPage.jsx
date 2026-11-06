import React, { useState, useRef } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
import { sourceLabel } from '../../utils/sourceLabel';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaterialCostModal from './MaterialCostModal';
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
  Input,
  InputNumber,
  DatePicker,
  Popconfirm,
  Tooltip,
  Skeleton,
  Result,
  notification,
  Modal,
  Empty,
  Alert,
  Dropdown,
  Segmented,
  Tag,
  Tabs,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
  BarcodeOutlined,
  CheckCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CalendarOutlined,
  DollarCircleOutlined,
  DollarOutlined,
  ShoppingOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
  MoreOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  EditOutlined,
  RightOutlined,
  FileTextOutlined,
  InboxOutlined,
  QrcodeOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import dayjs from 'dayjs';
import axiosInstance from '../../services/axios';
import { productService } from '../../services/productService';
import { productionService } from '../../services/productionService';
import { getProductIcon } from '../../utils/product-icons';
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';
import GenerateLabelsDialog from '../../modules/qr/components/GenerateLabelsDialog';

/* ─────────────────────────────────────────
   Mini Sparkline (CSS only, no library)
   ───────────────────────────────────────── */
const Sparkline = ({ color = 'var(--theme-primary)' }) => (
  <svg width="80" height="36" viewBox="0 0 80 36" fill="none" style={{ opacity: 0.8 }}>
    <polyline
      points="0,28 12,22 24,26 36,14 48,18 60,8 72,12 80,6"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <defs>
      <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.15" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    </defs>
    <polygon
      points="0,28 12,22 24,26 36,14 48,18 60,8 72,12 80,6 80,36 0,36"
      fill={`url(#grad-${color.replace('#', '')})`}
    />
  </svg>
);

/* ─────────────────────────────────────────
   Sub-component: Live Preview Card inside Drawer
   ───────────────────────────────────────── */
const PieceCodePreview = ({ code, rate, description }) => {
  const t = useT();
  return (
  <div
    style={{
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 12%, white) 0%, #DBEAFE 100%)',
      border: '1.5px solid #93C5FD',
      borderRadius: 12,
      padding: '10px',
      position: 'relative',
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        backgroundColor: 'rgba(37,99,235,0.07)',
      }}
    />
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--theme-primary)', textTransform: 'uppercase', letterSpacing: 1 }}>
      {t('products.preview.live', 'Live Preview')}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
      <div>
        <div style={{ fontWeight: 600, fontSize: '1.25rem', color: '#0F172A', fontFamily: 'monospace', letterSpacing: 1 }}>
          {code || <span style={{ color: '#94A3B8', fontStyle: 'italic', fontFamily: 'inherit', fontWeight: 400 }}>CODE-000</span>}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 400, color: '#64748B', marginBottom: 2 }}>{t('products.preview.fixedRate', 'Fixed Rate')}</div>
        <div style={{ fontWeight: 600, fontSize: '1.5rem', color: 'var(--theme-primary)' }}>
          {rate ? `${getCurrencySymbol()}${Number(rate).toLocaleString('en-IN')}` : <span style={{ color: '#94A3B8', fontSize: '1rem' }}>{getCurrencySymbol()} —</span>}
        </div>
      </div>
    </div>
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: 'var(--theme-primary)', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--theme-primary)', display: 'inline-block' }} />
      {t('products.active', 'Active')}
    </div>
  </div>
  );
};

/* ─────────────────────────────────────────
   Main Component
   ───────────────────────────────────────── */
const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const t = useT();
  const [form] = Form.useForm();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [productionDrawerVisible, setProductionDrawerVisible] = useState(false);
  const [batchSource, setBatchSource] = useState('ALL'); // View All filter: ALL | PURCHASED | MANUFACTURED
  const [batchStatus, setBatchStatus] = useState('ACTIVE'); // View All tab: ACTIVE | SOLD
  const [searchQuery, setSearchQuery] = useState('');
  // Adjust-stock + QR actions on a batch, done right here (mirrors the inventory details page).
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjDir, setAdjDir] = useState('INCREASE');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [qrBatch, setQrBatch] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [previewCode, setPreviewCode] = useState('');
  const [previewRate, setPreviewRate] = useState(null);
  const [previewDesc, setPreviewDesc] = useState('');
  const [materialCostModalOpen, setMaterialCostModalOpen] = useState(false);
  const [editingMaterialCost, setEditingMaterialCost] = useState(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [deletingPieceCodeId, setDeletingPieceCodeId] = useState(null);
  const [togglingPieceCodeId, setTogglingPieceCodeId] = useState(null);

  // Product image controls (upload/replace/remove) shown in the hero header.
  const [imgVersion, setImgVersion] = useState(() => Date.now());
  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef(null);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type?.startsWith('image/')) {
      notification.error({ message: t('products.toast.invalidFile', 'Invalid File'), description: t('products.toast.invalidFileDesc', 'Please select an image file.'), placement: 'topRight', duration: 4 });
      return;
    }
    try {
      setImageUploading(true);
      const res = await productService.uploadImage(productId, file);
      notification.success({ message: t('products.toast.imageUpdated', 'Image Updated'), description: res.message || t('products.toast.imageUpdatedDesc', 'Product image updated.'), placement: 'topRight', duration: 3 });
      setImgVersion(Date.now()); // cache-bust so the new image shows immediately
      await refetchProduct();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      notification.error({ message: t('products.toast.uploadFailed', 'Upload Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setImageUploading(true);
      const res = await productService.deleteImage(productId);
      notification.success({ message: t('products.toast.imageRemoved', 'Image Removed'), description: res.message || t('products.toast.imageRemovedDesc', 'Product image removed.'), placement: 'topRight', duration: 3 });
      setImgVersion(Date.now());
      await refetchProduct();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err) {
      notification.error({ message: t('products.toast.removeFailed', 'Remove Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    } finally {
      setImageUploading(false);
    }
  };

  // ── Queries ──────────────────────────────────────
  const { data: productResponse, isLoading: productLoading, isError: productError, error: productFetchError, refetch: refetchProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productService.getProductById(productId),
    enabled: !!productId,
  });

  const { data: pieceCodesResponse, isLoading: pieceCodesLoading, refetch: refetchPieceCodes } = useQuery({
    queryKey: ['pieceCodes', productId],
    queryFn: () => productService.getPieceCodes(productId),
    enabled: !!productId,
  });

  const { data: productionResponse, isLoading: productionLoading, refetch: refetchProduction } = useQuery({
    queryKey: ['production', { productId }],
    queryFn: () => productionService.getProduction({ productId }),
    enabled: !!productId,
  });
  const { data: materialCostResponse, isLoading: materialCostLoading, } = useQuery({
    queryKey: ['materialCosts', productId],
    queryFn: () => productService.getMaterialCosts(productId),
    enabled: !!productId,
  });

  // Purchase + production totals for the three KPI cards (from inventory batches).
  const { data: stockSummary, isLoading: stockSummaryLoading } = useQuery({
    queryKey: ['productStockSummary', productId],
    queryFn: () => productService.getStockSummary(productId),
    enabled: !!productId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Stock receipts (batches: purchase + production) for the "View All" drawer.
  const { data: batchesResponse, isLoading: batchesLoading } = useQuery({
    queryKey: ['productBatchReceipts', productId],
    queryFn: () => productService.getProductBatches(productId, { page: 0, size: 500 }),
    enabled: !!productId && productionDrawerVisible,
    staleTime: 0,
    refetchOnMount: 'always',
  });


  const materialCosts = materialCostResponse?.data || [];
  const product = productResponse?.data;
  const pieceCodes = pieceCodesResponse?.data || [];
  const productionEntries = productionResponse || [];

  // ── Analytics Computations ──────────────────────
  const totalPieceCodes = pieceCodes.length;
  const activePieceCodes = pieceCodes.filter((pc) => pc.active).length;

  const productProductionItems = React.useMemo(() => {
    const items = [];
    productionEntries.forEach((entry) => {
      if (entry.items && Array.isArray(entry.items)) {
        entry.items.forEach((item) => {
          if (item.productId === productId) {
            items.push({ ...item, productionDate: entry.productionDate, employeeName: entry.employeeName, entryId: entry.id });
          }
        });
      }
    });
    return items.sort((a, b) => new Date(b.productionDate) - new Date(a.productionDate));
  }, [productionEntries, productId]);

  // Stock receipts for the View All drawer, filtered by source + date + batch search.
  const filteredReceipts = React.useMemo(() => {
    const rows = batchesResponse?.batches || [];
    const start = dateRange && dateRange[0] ? dayjs(dateRange[0]) : null;
    const end = dateRange && dateRange[1] ? dayjs(dateRange[1]) : null;
    // Backend already returns batches sorted latest-first (receivedDate, then batchNumber).
    return rows.filter((b) => {
      if (b.status !== batchStatus) return false;
      if (batchSource !== 'ALL' && b.source !== batchSource) return false;
      const day = dayjs(b.receivedDate);
      if (start && day.isBefore(start, 'day')) return false;
      if (end && day.isAfter(end, 'day')) return false;
      return true;
    });
  }, [batchesResponse, batchSource, batchStatus, dateRange]);

  const averageRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : pieceCodes.reduce((a, pc) => a + (pc.rate || 0), 0) / pieceCodes.length, [pieceCodes]);
  const minRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : Math.min(...pieceCodes.map((pc) => pc.rate)), [pieceCodes]);
  const maxRate = React.useMemo(() => pieceCodes.length === 0 ? 0 : Math.max(...pieceCodes.map((pc) => pc.rate)), [pieceCodes]);
  const activeCodes = React.useMemo(() => pieceCodes.filter((pc) => pc.active).sort((a, b) => b.rate - a.rate), [pieceCodes]);
  const maxActiveRate = React.useMemo(() => activeCodes.length === 0 ? 1 : Math.max(...activeCodes.map((pc) => pc.rate)), [activeCodes]);
  const currentMaterialCost = React.useMemo(() => {
    if (!materialCosts.length) return null;

    const today = new Date();
    const applicable = materialCosts
      .map((mc) => ({
        ...mc,
        effectiveDate: mc.effectiveFrom ? new Date(mc.effectiveFrom) : mc.createdAt ? new Date(mc.createdAt) : new Date(0),
      }))
      .filter((mc) => mc.effectiveDate <= today)
      .sort((a, b) => b.effectiveDate - a.effectiveDate);

    if (applicable.length) return applicable[0];

    return materialCosts
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
  }, [materialCosts]);


  const allActivities = React.useMemo(() => {
    const activities = [];

    // Material cost activities
    materialCosts.forEach((mc) => {
      activities.push({
        id: `mc-${mc.id}`,
        type: 'material_cost',
        title: t('products.activity.pricingUpdated', 'Pricing updated'),
        subtitle: `${t('products.activity.cost', 'Cost')} ${getCurrencySymbol()}${Number(mc.cost).toFixed(2)}${(mc.salePrice || mc.salePrice === 0) ? ` · ${t('products.activity.sale', 'Sale')} ${getCurrencySymbol()}${Number(mc.salePrice).toFixed(2)}` : ''}\n${t('products.activity.effectiveFrom', 'Effective From:')} ${dayjs(mc.effectiveFrom).format('DD MMM YYYY')}`,
        date: dayjs(mc.createdAt).format('DD MMM YYYY hh:mm A'),
        dateBy: `${t('products.by', 'by')} ${mc.createdBy || t('products.activity.admin', 'Admin')}`,
        sortDate: new Date(mc.createdAt),
      });
    });

    // Piece code activities
    pieceCodes.forEach((pc) => {
      activities.push({
        id: `pc-${pc.id}`,
        type: 'piece_code',
        title: t('products.activity.pieceCodeCreated', 'Piece code created'),
        subtitle: `${t('products.activity.pieceCode', 'Piece Code')} ${pc.code} (${pc.pieceType || pc.code})\n${t('products.activity.createdWithRate', 'created with rate')} ${getCurrencySymbol()}${Number(pc.rate).toFixed(2)}`,
        date: dayjs(pc.createdAt).format('DD MMM YYYY hh:mm A'),
        dateBy: `${t('products.by', 'by')} ${pc.createdBy || t('products.activity.admin', 'Admin')}`,
        sortDate: new Date(pc.createdAt),
      });
    });

    // Production activities
    productProductionItems.forEach((item) => {
      activities.push({
        id: `prod-${item.entryId}-${item.pieceCodeId}`,
        type: 'production',
        title: t('products.activity.productionCompleted', 'Production completed'),
        subtitle: `${item.employeeName || t('products.activity.unknown', 'Unknown')} ${t('products.activity.produced', 'produced')} ${item.quantity} ${t('products.activity.pcsWord', 'Pcs')}\n(${item.pieceCode || t('products.activity.na', 'N/A')})`,
        date: dayjs(item.productionDate).format('DD MMM YYYY hh:mm A'),
        dateBy: `${t('products.by', 'by')} ${item.employeeName || t('products.activity.unknown', 'Unknown')}`,
        sortDate: new Date(item.productionDate),
      });
    });

    return activities.sort((a, b) => b.sortDate - a.sortDate);
  }, [productProductionItems, pieceCodes, materialCosts]);

  const ACTIVITY_PREVIEW_COUNT = 5;
  const ACTIVITY_MAX = 20;
  const visibleActivities = showAllActivities ? allActivities.slice(0, ACTIVITY_MAX) : allActivities.slice(0, ACTIVITY_PREVIEW_COUNT);
  const hasMoreActivities = allActivities.length > ACTIVITY_PREVIEW_COUNT;

  const getActivityIcon = (type) => {
    switch (type) {
      case 'material_cost':
        return { icon: <DollarOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />, bg: '#DBEAFE' };
      case 'piece_code':
        return { icon: <BarcodeOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />, bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)' };
      case 'production':
        return { icon: <BuildOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />, bg: '#D1FAE5' };
      case 'inventory':
        return { icon: <InboxOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />, bg: '#CFFAFE' };
      case 'product_update':
        return { icon: <EditOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />, bg: 'color-mix(in srgb, var(--theme-primary) 12%, white)' };
      default:
        return { icon: <FileTextOutlined style={{ color: '#64748B', fontSize: '1rem' }} />, bg: '#F1F5F9' };
    }
  };

  // One activity card – shared by preview and expanded views so both look identical.
  const renderActivityCard = (act) => {
    const iconConfig = getActivityIcon(act.type);
    return (
      <div
        key={act.id}
        style={{
          flex: '1 1 220px',
          minWidth: 220,
          maxWidth: 340,
          display: 'flex',
          gap: 12,
          alignItems: 'flex-start',
          padding: '14px 16px',
          borderRadius: 10,
          backgroundColor: '#FAFAFA',
          border: '1px solid #F1F5F9',
          transition: 'box-shadow 0.2s, border-color 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
          e.currentTarget.style.borderColor = '#E2E8F0';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = '#F1F5F9';
        }}
      >
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          backgroundColor: iconConfig.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {iconConfig.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1E293B', marginBottom: 2, wordBreak: 'break-word' }}>
            {act.title}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748B', lineHeight: 1.4, whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
            {act.subtitle}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94A3B8', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <ClockCircleOutlined style={{ fontSize: '0.55rem' }} />
            {act.date}
          </div>
        </div>
      </div>
    );
  };

  // ── Mutations ───────────────────────────────────
  const createPieceCodeMutation = useMutation({
    mutationFn: (data) => productService.createPieceCode(productId, data),
    onSuccess: (res) => {
      notification.success({ message: t('products.toast.pcCreated', 'Piece Code Created'), description: res.message || t('products.toast.createdSuccess', 'Created successfully.'), placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDrawer();
    },
    onError: (err) => {
      notification.error({ message: t('products.toast.creationFailed', 'Creation Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ pieceCodeId, active }) => productService.updatePieceCodeStatus(pieceCodeId, active),
    onSuccess: (res) => {
      notification.success({ message: t('products.toast.statusUpdated', 'Status Updated'), description: res.message || t('products.toast.statusUpdatedShort', 'Status updated.'), placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      notification.error({ message: t('products.toast.updateFailed', 'Update Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 4 });
    },
    onSettled: () => {
      setTogglingPieceCodeId(null);
    },
  });

  const handleTogglePieceCodeStatus = (record) => {
    setTogglingPieceCodeId(record.id);
    updateStatusMutation.mutate({ pieceCodeId: record.id, active: !record.active });
  };

  const deletePieceCodeMutation = useMutation({
    mutationFn: (pieceCodeId) => productService.deletePieceCode(pieceCodeId),
    onSuccess: (res) => {
      if (res.success === false) {
        Modal.warning({ title: t('products.toast.cannotDelete', 'Cannot Delete'), icon: <InfoCircleOutlined style={{ color: 'var(--theme-primary)' }} />, content: res.message || t('products.toast.pcHasHistory', 'This piece code has production history. Deactivate it instead.'), okText: t('products.ok', 'OK') });
        return;
      }
      notification.success({ message: t('products.toast.pcDeleted', 'Piece Code Deleted'), description: res.message || t('products.toast.deletedSuccess', 'Deleted successfully.'), placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['pieceCodes', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const status = err.status || err.response?.status;
      if (status === 409 || status === 400) {
        Modal.warning({ title: t('products.toast.cannotDelete', 'Cannot Delete'), icon: <InfoCircleOutlined style={{ color: 'var(--theme-primary)' }} />, content: err.response?.data?.message || t('products.toast.pcHasHistory', 'This piece code has production history. Deactivate it instead.'), okText: t('products.ok', 'OK') });
      } else {
        notification.error({ message: t('products.toast.deleteFailed', 'Delete Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
      }
    },
    onSettled: () => {
      setDeletingPieceCodeId(null);
    },
  });

  const deletePieceCode = (id) => {
    setDeletingPieceCodeId(id);
    deletePieceCodeMutation.mutate(id);
  };

  const deleteMaterialCostMutation = useMutation({
    mutationFn: (id) => productService.deleteMaterialCost(id),
    onSuccess: (res) => {
      notification.success({ message: t('products.toast.materialDeleted', 'Material Cost Deleted'), description: res.message || t('products.toast.deletedSuccess', 'Deleted successfully.'), placement: 'topRight', duration: 4 });
      queryClient.invalidateQueries({ queryKey: ['materialCosts', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (err) => {
      notification.error({ message: t('products.toast.deleteFailed', 'Delete Failed'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 5 });
    },
  });

  const deleteMaterialCost = (id) => {
    deleteMaterialCostMutation.mutate(id);
  };

  const editMaterialCost = (record) => {
    setEditingMaterialCost(record);
    setMaterialCostModalOpen(true);
  };

  const handleCloseMaterialCostModal = () => {
    setMaterialCostModalOpen(false);
    setEditingMaterialCost(null);
  };

  const handleMaterialCostSuccess = () => {
    setMaterialCostModalOpen(false);
    setEditingMaterialCost(null);
    queryClient.invalidateQueries({ queryKey: ['materialCosts', productId] });
    queryClient.invalidateQueries({ queryKey: ['product', productId] });
  };


  // ── Drawer ──────────────────────────────────────
  const handleOpenDrawer = () => { form.resetFields(); setPreviewCode(''); setPreviewRate(null); setPreviewDesc(''); setDrawerVisible(true); };
  const handleCloseDrawer = () => { setDrawerVisible(false); form.resetFields(); setPreviewCode(''); setPreviewRate(null); setPreviewDesc(''); };
  const handleOpenProductionDrawer = () => setProductionDrawerVisible(true);
  const handleCloseProductionDrawer = () => setProductionDrawerVisible(false);

  // ── Batch adjust / QR (reflects across stock cards, inventory, dashboard) ──
  const openAdjust = (batch) => { setAdjustTarget(batch); setAdjQty(''); setAdjDir('INCREASE'); setAdjError(''); };
  const closeAdjust = () => { if (!adjSaving) setAdjustTarget(null); };

  const refreshStock = () => {
    queryClient.invalidateQueries({ queryKey: ['productStockSummary', productId] });
    queryClient.invalidateQueries({ queryKey: ['productBatchReceipts', productId] });
    queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
    window.dispatchEvent(new Event('inventory-alerts-updated'));
  };

  const submitAdjust = async () => {
    const qty = Number(adjQty);
    if (!qty || qty <= 0) { setAdjError(t('products.adjust.errZero', 'Enter a quantity greater than zero')); return; }
    const available = Number(adjustTarget?.quantityAvailable ?? 0);
    if (adjDir === 'DECREASE' && qty > available) { setAdjError(`${t('products.adjust.errOnlyA', 'Only')} ${available} ${t('products.adjust.errOnlyB', 'unit(s) available in this batch')}`); return; }
    setAdjSaving(true); setAdjError('');
    try {
      await axiosInstance.patch(`/inventory/batches/${adjustTarget.batchId}/adjust`, {
        quantity: qty, direction: adjDir,
      });
      notification.success({ message: `${adjDir === 'INCREASE' ? t('products.adjust.stockIncreased', 'Stock increased by') : t('products.adjust.stockDecreased', 'Stock decreased by')} ${qty}`, placement: 'topRight', duration: 3 });
      setAdjustTarget(null);
      refreshStock();
    } catch (err) {
      setAdjError(err.response?.data?.message || err.message || t('products.adjust.failed', 'Failed to adjust stock'));
    } finally {
      setAdjSaving(false);
    }
  };
  const handleFormChange = (_, v) => { setPreviewCode(v.code || ''); setPreviewRate(v.rate || null); setPreviewDesc(v.description || ''); };
  const handleCreatePieceCode = (values) => {
    createPieceCodeMutation.mutate({ code: values.code.trim().toUpperCase(), rate: Number(values.rate), description: values.description?.trim() || undefined });
  };

  // ── Styles ──────────────────────────────────────
  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  // ── Table Columns ────────────────────────────────
  const columns = [
    {
      title: t('products.col.index', '#'),
      key: 'index',
      width: 44,
      render: (_, __, index) => <span style={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.8rem' }}>{index + 1}</span>,
    },
    {
      title: t('products.col.pieceCode', 'Piece Code'),
      dataIndex: 'code',
      key: 'code',
      // render: (code) => (
      //   <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--theme-primary)', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', padding: '3px 10px', borderRadius: 6, letterSpacing: 0.5, border: '1px solid #C7D2FE' }}>
      //     {code}
      //   </span>
      // ),
      sorter: (a, b) => a.code.localeCompare(b.code),
    },
    {
      title: t('products.col.fixedRate', 'Fixed Rate'),
      dataIndex: 'rate',
      key: 'rate',
      render: (rate) => <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{Number(rate).toLocaleString('en-IN')}</span>,
      sorter: (a, b) => (a.rate || 0) - (b.rate || 0),
    },
    {
      title: t('common.status', 'Status'),
      dataIndex: 'active',
      key: 'status',
      render: (active) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3px 10px',
          borderRadius: 12,
          fontSize: '0.78rem',
          fontWeight: 700,
          color: active ? '#16A34A' : '#DC2626',
          backgroundColor: 'transparent',
          border: `1px solid ${active ? '#16A34A' : '#DC2626'}`,
        }}>
          {active ? t('products.active', 'Active') : t('products.inactive', 'Inactive')}
        </span>
      ),
    },
    {
      title: t('common.actions', 'Actions'),
      key: 'actions',
      width: 140,
      align: 'center',
      render: (_, record) => (
        isPurchasedProduct ? (
          <Tooltip title={t('products.pc.actionsDisabled', 'Piece code actions are not available for purchased products')} placement="top">
            <Space size={6}>
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                disabled
                style={{
                  color: '#94A3B8',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined />}
                disabled
                style={{
                  color: '#94A3B8',
                  backgroundColor: '#F3F4F6',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              />
            </Space>
          </Tooltip>
        ) : (
          <Space size={6}>
            {can('products', 'write') && (
            <Tooltip title={record.active ? t('products.deactivate', 'Deactivate') : t('products.activate', 'Activate')} placement="top">
              <Popconfirm
                title={record.active ? t('products.pc.confirmDeactivate', 'Deactivate this piece code? Once inactive, it will not show in the table.') : t('products.pc.confirmActivate', 'Activate this piece code?')}
                onConfirm={() => handleTogglePieceCodeStatus(record)}
                okText={record.active ? t('products.deactivate', 'Deactivate') : t('products.activate', 'Activate')}
                okButtonProps={{ danger: record.active }}
                cancelText={t('common.cancel', 'Cancel')}
                placement="topRight"
              >
                <Button
                  type="text"
                  size="small"
                  icon={record.active ? <StopOutlined /> : <CheckCircleOutlined />}
                  loading={updateStatusMutation.isLoading && togglingPieceCodeId === record.id}
                  style={{
                    color: record.active ? 'var(--theme-primary)' : 'var(--theme-primary)',
                    backgroundColor: record.active ? 'color-mix(in srgb, var(--theme-primary) 12%, white)' : 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                    border: '1px solid',
                    borderColor: record.active ? '#FDE68A' : '#6EE7B7',
                    borderRadius: 6,
                    width: 28,
                    height: 28,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Popconfirm>
            </Tooltip>
            )}
            {can('products', 'delete') && (
            <Tooltip title={t('common.delete', 'Delete')} placement="top">
              <Popconfirm title={t('products.pc.confirmDelete', 'Delete this piece code?')} description={t('products.pc.deleteIrreversible', 'This action cannot be undone.')} onConfirm={() => deletePieceCode(record.id)} okText={t('common.delete', 'Delete')} okButtonProps={{ danger: true }} cancelText={t('common.cancel', 'Cancel')} placement="topRight">
                <Button type="text" size="small" icon={<DeleteOutlined />} loading={deletePieceCodeMutation.isLoading && deletingPieceCodeId === record.id}
                  style={{ color: '#EF4444', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 6, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
              </Popconfirm>
            </Tooltip>
            )}
          </Space>
        )
      ),
    },
  ];

  // Profit derived from a cost + selling price pair. Returns null when either
  // side is missing so callers can render a neutral placeholder.
  const computeProfit = (cost, salePrice) => {
    const c = Number(cost);
    const s = Number(salePrice);
    if (!salePrice && salePrice !== 0) return null;
    if (Number.isNaN(c) || Number.isNaN(s)) return null;
    const amount = s - c;
    const pct = c > 0 ? (amount / c) * 100 : null;
    return { amount, pct };
  };

  const ProfitBadge = ({ cost, salePrice }) => {
    const profit = computeProfit(cost, salePrice);
    if (!profit) {
      return <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>;
    }
    const positive = profit.amount >= 0;
    const color = positive ? '#16A34A' : '#B91C1C';
    // Plain text (no pill/badge) — just the arrow, %, amount and colour.
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        color, fontSize: '0.82rem', fontWeight: 700,
      }}>
        {positive ? <RiseOutlined style={{ fontSize: '0.72rem' }} /> : <FallOutlined style={{ fontSize: '0.72rem' }} />}
        {profit.pct != null ? `${positive ? '+' : ''}${profit.pct.toFixed(1)}%` : '—'}
        <span style={{ fontWeight: 500, opacity: 0.8 }}>
          ({positive ? '+' : '−'}{getCurrencySymbol()}{Math.abs(profit.amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })})
        </span>
      </span>
    );
  };

  const materialcolumns = [
    {
      title: t('products.col.index', '#'),
      width: 44,
      render: (_, __, index) => index + 1,
    },
    {
      title: t('products.col.effectiveFrom', 'Effective From'),
      dataIndex: 'effectiveFrom',
      render: (date) => (
        <Space size={6}>
          <CalendarOutlined style={{ color: '#64748B' }} />
          {dayjs(date).format('DD-MMM-YYYY')}
        </Space>
      ),
    },
    {
      title: `${t('products.col.cost', 'Cost')} (${getCurrencySymbol()})`,
      dataIndex: 'cost',
      align: 'right',
      render: (value) => (
        <span style={{ fontWeight: 600, color: 'var(--theme-primary)' }}>
          {getCurrencySymbol()}{Number(value).toFixed(2)}
        </span>
      ),
    },
    {
      title: `${t('products.col.salePrice', 'Sale Price')} (${getCurrencySymbol()})`,
      dataIndex: 'salePrice',
      align: 'right',
      render: (value) => (
        value || value === 0 ? (
          <span style={{ fontWeight: 700, color: 'var(--theme-primary)' }}>
            {getCurrencySymbol()}{Number(value).toFixed(2)}
          </span>
        ) : <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>{t('products.notSet', 'Not set')}</span>
      ),
    },
    {
      title: t('products.col.profit', 'Profit'),
      align: 'right',
      render: (_, record) => (
        <ProfitBadge cost={record.cost} salePrice={record.salePrice} />
      ),
    },
    {
      title: t('common.actions', 'Actions'),
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Space>
          {can('products', 'write') && (
          <Tooltip title={t('common.edit', 'Edit')}>
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => editMaterialCost(record)}
            />
          </Tooltip>
          )}
          {can('products', 'delete') && (
          <Popconfirm
            title={t('products.pricing.confirmDelete', 'Delete this pricing row?')}
            onConfirm={() => deleteMaterialCost(record.id)}
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
          )}
        </Space>
      ),
    },
  ];


  // ── Loading / Error States ───────────────────────
  if (productLoading) {
    return (
      <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card style={cardStyle}><Skeleton active paragraph={{ rows: 3 }} /></Card>
          <Row gutter={[16, 16]}>{[1, 2, 3, 4].map(i => <Col xs={24} sm={12} xl={6} key={i}><Card style={cardStyle}><Skeleton active paragraph={{ rows: 2 }} /></Card></Col>)}</Row>
        </Box>
      </ConfigProvider>
    );
  }

  if (productError || !product) {
    return (
      <ConfigProvider theme={{ token: { borderRadius: 8 } }}>
        <Result status="error" title={t('products.notFound.title', 'Product Not Found')} subTitle={productFetchError?.message || t('products.notFound.subtitle', 'Could not retrieve this product.')}
          extra={[
            <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>{t('products.notFound.back', 'Back to Products')}</Button>,
            <Button key="retry" type="primary" icon={<ReloadOutlined />} onClick={() => refetchProduct()}>{t('products.retry', 'Retry')}</Button>,
          ]} />
      </ConfigProvider>
    );
  }

  const productIcon = getProductIcon(product.iconName, product.name);
  const isPurchasedProduct = product.source === 'PURCHASED';

  const sourceIcon =
    product.source === 'PURCHASED'
      ? <ShoppingCartOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
      : product.source === 'MANUFACTURED'
        ? <BuildOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
        : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <ShoppingCartOutlined style={{ color: '#94A3B8', fontSize: '0.8rem' }} />
            <BuildOutlined style={{ color: '#94A3B8', fontSize: '0.8rem' }} />
          </span>
        );

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontFamily: '"Inter", "Helvetica", "Arial", sans-serif' } }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '4px 0' }}>

        {/* ── Breadcrumb bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.88rem' }}>
            <span
              onClick={() => navigate(-1)}
              style={{ color: 'var(--theme-primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <ArrowLeftOutlined />
              {t('common.back', 'Back')}
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>›</span>
            <span
              onClick={() => navigate('/products')}
              style={{ color: 'var(--theme-primary)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              🏠 {t('products.breadcrumb.products', 'Products')}
            </span>
            <span style={{ color: '#CBD5E1', fontSize: '0.75rem' }}>›</span>
            <span style={{ color: '#1E293B', fontWeight: 700 }}>{product.name}</span>
          </div>
        </div>

        {/* ── Hero Product Card (LIGHT) ── */}
        <Card
          style={{ ...cardStyle, background: '#FFFFFF' }}
          bodyStyle={{ padding: '24px 28px' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            {/* Left: Icon + Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Large Product Image / Icon + admin controls */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <div style={{
                  width: 100, height: 100, borderRadius: 16,
                  backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3.5rem', flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  overflow: 'hidden', position: 'relative',
                }}>
                  {product.hasImage ? (
                    <img
                      src={productService.imageUrl(productId, imgVersion)}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span style={{
                    display: product.hasImage ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    width: '100%', height: '100%',
                  }}>
                    {productIcon}
                  </span>
                </div>

                {can('products', 'write') && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageFileChange}
                    />
                    <Tooltip title={product.hasImage ? t('products.changePhoto', 'Change photo') : t('products.addPhoto', 'Add photo')}>
                      <Button
                        size="small"
                        shape="circle"
                        icon={<EditOutlined />}
                        loading={imageUploading}
                        onClick={() => imageInputRef.current?.click()}
                      />
                    </Tooltip>
                    {product.hasImage && (
                      <Popconfirm
                        title={t('products.removePhotoConfirm', 'Remove this photo?')}
                        onConfirm={handleRemoveImage}
                        okText={t('products.remove', 'Remove')}
                        okButtonProps={{ danger: true }}
                        cancelText={t('common.cancel', 'Cancel')}
                        placement="bottomLeft"
                      >
                        <Tooltip title={t('products.removePhoto', 'Remove photo')}>
                          <Button
                            size="small"
                            shape="circle"
                            danger
                            icon={<DeleteOutlined />}
                            disabled={imageUploading}
                          />
                        </Tooltip>
                      </Popconfirm>
                    )}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {/* Name + Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center' }}>
                    {product.name}
                    <HeadingInfo text={t('products.details.info', 'Piece codes, rates, material cost and production history for this product.')} />
                  </h1>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    backgroundColor: 'transparent',
                    color: product.active ? '#16A34A' : '#DC2626',
                    fontSize: '0.72rem', fontWeight: 700,
                    padding: '3px 10px', borderRadius: 20,
                    border: `1px solid ${product.active ? '#16A34A' : '#DC2626'}`,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: product.active ? '#16A34A' : '#DC2626' }} />
                    {product.active ? t('products.active', 'Active') : t('products.inactive', 'Inactive')}
                  </span>
                </div>

                {/* Description */}
                <p style={{ margin: '0 0 14px', color: '#64748B', fontSize: '0.88rem' }}>
                  {product.description || <span style={{ fontStyle: 'italic', color: '#CBD5E1' }}>{t('products.noDescription', 'No description')}</span>}
                </p>

                {/* Metadata Row */}
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <IdcardOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('products.meta.productId', 'Product ID')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>
                        {product.id || '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {sourceIcon}
                    <div>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: '#94A3B8',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {t('products.meta.source', 'Source')}
                      </div>

                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#475569',
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        {product.source ? sourceLabel(t, product.source) : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <CalendarOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('products.meta.createdOn', 'Created On')}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {product.createdAt ? dayjs(product.createdAt).format('DD-MMM-YYYY') : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <ClockCircleOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                    <div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('products.meta.lastUpdated', 'Last Updated')}</div>
                      <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
                        {product.updatedAt ? dayjs(product.updatedAt).format('DD-MMM-YYYY') : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── 3 KPI Metric Cards (all in one row) ── */}
        <Row gutter={[16, 16]}>
          {/* Card 1: Total Qty = purchase + production (with breakdown) */}
          <Col xs={24} sm={8}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>{t('products.kpi.totalQty', 'Total Qty')}</div>
                  {stockSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 80 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      {Number(stockSummary?.totalQty || 0).toLocaleString('en-IN')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>{t('products.kpi.inStockSold', 'Pcs · in stock · Sold')} {Number(stockSummary?.soldQty || 0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span><span style={{ color: '#94A3B8' }}>{t('products.kpi.purchase', 'Purchase')} </span><b style={{ color: '#0F172A' }}>{Number(stockSummary?.purchasedQty || 0).toLocaleString('en-IN')}</b></span>
                    <span><span style={{ color: '#94A3B8' }}>{t('products.kpi.production', 'Production')} </span><b style={{ color: '#0F172A' }}>{Number(stockSummary?.manufacturedQty || 0).toLocaleString('en-IN')}</b></span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingOutlined style={{ color: 'var(--theme-primary)', fontSize: '1.1rem' }} />
                  </div>
                  <Button type="link" size="small" onClick={handleOpenProductionDrawer} style={{ color: 'var(--theme-primary)', fontWeight: 700, padding: 0 }}>{t('products.viewAll', 'View All')}</Button>
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 2: Total Cost = Σ(qty × unit cost), purchase + production */}
          <Col xs={24} sm={8}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>{t('products.kpi.totalCost', 'Total Cost')}</div>
                  {stockSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 100 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>
                      {getCurrencySymbol()}{Number(stockSummary?.totalCost || 0).toLocaleString('en-IN')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>{t('products.kpi.qtyXCost', 'Qty × cost')}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span><span style={{ color: '#94A3B8' }}>{t('products.kpi.purchase', 'Purchase')} </span><b style={{ color: '#0F172A' }}>{getCurrencySymbol()}{Number(stockSummary?.purchasedCost || 0).toLocaleString('en-IN')}</b></span>
                    <span><span style={{ color: '#94A3B8' }}>{t('products.kpi.production', 'Production')} </span><b style={{ color: '#0F172A' }}>{getCurrencySymbol()}{Number(stockSummary?.manufacturedCost || 0).toLocaleString('en-IN')}</b></span>
                  </div>
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarCircleOutlined style={{ color: 'var(--theme-primary)', fontSize: '1.1rem' }} />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 3: Stock Value = Σ(qty × selling price) */}
          <Col xs={24} sm={8}>
            <Card style={cardStyle} bodyStyle={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, marginBottom: 8 }}>{t('products.kpi.stockValue', 'Stock Value')}</div>
                  {stockSummaryLoading ? <Skeleton.Input active size="small" style={{ width: 100 }} /> : (
                    <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--theme-primary)', lineHeight: 1 }}>
                      {getCurrencySymbol()}{Number(stockSummary?.stockValue || 0).toLocaleString('en-IN')}
                    </div>
                  )}
                  <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>{t('products.kpi.atSellingPrice', 'At selling price')}</div>
                  {isPurchasedProduct && Number(stockSummary?.totalQty || 0) > 0 ? (
                    <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 8 }}>
                      {t('products.kpi.avgSalePrice', 'Avg sale price')} <b style={{ color: '#0F172A' }}>{getCurrencySymbol()}{Math.round(Number(stockSummary?.stockValue || 0) / Number(stockSummary?.totalQty || 1)).toLocaleString('en-IN')}</b>{t('products.kpi.perPc', '/pc')}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: 8 }}>{t('products.kpi.qtyXSale', 'Qty × sale price')}</div>
                  )}
                </div>
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RiseOutlined style={{ color: 'var(--theme-primary)', fontSize: '1.1rem' }} />
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* ── Main 2-Column Layout ── */}
        <Row gutter={[20, 20]} align="stretch">
          {/* Left Column: Piece Code Table */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BarcodeOutlined style={{ fontSize: '0.85rem', color: 'var(--theme-primary)' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t('products.pcMgmt.title', 'Piece Code Management')}</span>
                  <Tooltip title={isPurchasedProduct
                    ? t('products.pcMgmt.tooltipPurchased', "Bought products don't use piece codes. Only made products do.")
                    : t('products.pcMgmt.tooltipMade', "A rate can't be changed later. To use a new rate, add a new piece code. Old records stay the same.")}>
                    <InfoCircleOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.8rem', cursor: 'help' }} />
                  </Tooltip>
                </Space>
              }
              extra={
                can('products', 'write') ? (
                <Space>
                  <Tooltip title={isPurchasedProduct ? t('products.pcMgmt.addTooltipPurchased', 'Piece codes do not apply to purchased products') : t('products.pcMgmt.addTooltipMade', 'Add a new piece code')}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenDrawer}
                      disabled={isPurchasedProduct}
                      style={{ borderRadius: 6, fontWeight: 600, height: 34, paddingInline: 18, marginRight: 2 }}
                    >
                      {t('products.addPieceCode', 'Add Piece Code')}
                    </Button>
                  </Tooltip>
                </Space>
                ) : null
              }
              style={{ ...cardStyle, height: '100%' }}
              headStyle={{ padding: '14px 14px' }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                className="custom-table"
                rowKey="id"
                loading={pieceCodesLoading}
                dataSource={pieceCodes.map((pc) => ({ ...pc, key: pc.id }))}
                columns={columns}
                scroll={{ y: 150 }}
                pagination={{
                  defaultPageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '25', '50'],
                  showTotal: (total, range) =>
                    `${t('products.page.showing', 'Showing')} ${range[0]} ${t('products.page.to', 'to')} ${range[1]} ${t('products.page.of', 'of')} ${total} ${t('products.page.entries', 'entries')}`,
                  style: {
                    margin: '12px 20px',
                  },
                }}
                size="small"
              />
            </Card>
          </Col>

          {/* Right Column: Pricing History (cost + sale price + profit) */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space wrap>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <DollarOutlined style={{ fontSize: '0.85rem', color: 'var(--theme-primary)' }} />
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t('products.pricing.title', 'Pricing History')}</span>
                  <Tooltip title={t('products.pricing.tooltip', 'To change the cost or sale price, add a new row. The newest row is always used. A sale shows profit = sale price − cost.')}>
                    <InfoCircleOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.8rem', cursor: 'help' }} />
                  </Tooltip>
                  {currentMaterialCost && (currentMaterialCost.salePrice || currentMaterialCost.salePrice === 0) ? (
                    <ProfitBadge cost={currentMaterialCost.cost} salePrice={currentMaterialCost.salePrice} />
                  ) : null}
                </Space>
              }
              extra={
                can('products', 'write') ? (
                <Space>
                  <Tooltip title={product.source === 'PURCHASED' ? t('products.pricing.addTooltipPurchased', 'Pricing applies to manufactured products. Enable manufacturing to add pricing.') : ''}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      disabled={product.source === 'PURCHASED'}
                      onClick={() => setMaterialCostModalOpen(true)}
                      style={{ borderRadius: 6, fontWeight: 600, height: 34, paddingInline: 18, marginRight: 2 }}
                    >
                      {t('products.pricing.add', 'Add Pricing')}
                    </Button>
                  </Tooltip>
                </Space>
                ) : null
              }
              style={{ ...cardStyle, height: '100%' }}
              headStyle={{ padding: '14px 14px' }}
              bodyStyle={{ padding: 0 }}
            >
              <Table
                className="custom-table"
                rowKey="id"
                loading={materialCostLoading}
                dataSource={materialCosts}
                columns={materialcolumns}
                scroll={{ x: 'max-content', y: 150 }}
                locale={{ emptyText: t('products.pricing.empty', 'No pricing set yet. Add cost & sale price so production and New Sale use them.') }}
                pagination={{
                  defaultPageSize: 5,
                  showSizeChanger: true,
                  pageSizeOptions: ['5', '10', '25', '50'],
                  showTotal: (total, range) =>
                    `${t('products.page.showing', 'Showing')} ${range[0]} ${t('products.page.to', 'to')} ${range[1]} ${t('products.page.of', 'of')} ${total} ${t('products.page.entries', 'entries')}`,
                  style: {
                    margin: '12px 20px',
                  },
                }}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* ── Latest Activity (Full Width) ── */}
        <Card
          title={
            <Space>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockCircleOutlined style={{ fontSize: '0.85rem', color: '#EA580C' }} />
              </div>
              <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{t('products.activity.title', 'Latest Activity')}</span>
            </Space>
          }
          extra={
            hasMoreActivities ? (
              <span
                onClick={() => setShowAllActivities(!showAllActivities)}
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--theme-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#1D4ED8'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
              >
                {showAllActivities ? t('products.showLess', 'Show Less') : t('products.viewAll', 'View All')}
                <RightOutlined style={{ fontSize: '0.7rem', transform: showAllActivities ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s' }} />
              </span>
            ) : null
          }
          style={cardStyle}
          bodyStyle={{ padding: '20px 24px' }}
        >
          {allActivities.length > 0 ? (
            <>
              {/* Wrapping grid – cards never shrink below 220px, so text can't overlap. */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 16,
              }}>
                {visibleActivities.map((act) => renderActivityCard(act))}
              </div>
            </>
          ) : (
            <Empty description={t('products.activity.empty', 'No activity yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Card>

        {/* ── Add Piece Code Drawer ── */}
        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarcodeOutlined style={{ color: 'var(--theme-primary)', fontSize: '0.95rem' }} />
              </div>
              {t('products.addPieceCode', 'Add Piece Code')}
            </span>
          }
          placement="right"
          width={480}
          onClose={handleCloseDrawer}
          open={drawerVisible}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px' }}>
              <Button onClick={handleCloseDrawer} style={{ borderRadius: 8, fontWeight: 600, height: 40 }}>{t('common.cancel', 'Cancel')}</Button>
              <Button type="primary" icon={<PlusOutlined />} loading={createPieceCodeMutation.isPending} onClick={() => form.submit()} style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 20 }}>
                {t('products.createPieceCode', 'Create Piece Code')}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Context */}
            <div style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: '2rem' }}>{productIcon}</div>
              <div>
                <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>{product.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{totalPieceCodes} {t('products.pcDrawer.existingA', 'existing codes ·')} {activePieceCodes} {t('products.pcDrawer.activeB', 'active')}</div>
              </div>
            </div>

            {/* Warning */}
            <div style={{ backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: '0.78rem', color: '#92400E', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <InfoCircleOutlined style={{ color: 'var(--theme-primary)', marginTop: 2, flexShrink: 0 }} />
              <span>{t('products.pcDrawer.warnA', 'Rate is')} <strong>{t('products.pcDrawer.warnStrong', 'permanently fixed')}</strong> {t('products.pcDrawer.warnB', 'and cannot be edited after creation. If pricing changes, create a new piece code.')}</span>
            </div>

            {/* Form */}
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 20 }}>
              <Form form={form} layout="vertical" onFinish={handleCreatePieceCode} onValuesChange={handleFormChange} autoComplete="off" requiredMark={false}>
                <Form.Item name="code" label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.pieceCodeSingle', 'Piece Code *')}</span>}
                  rules={[{ required: true, message: t('products.rule.pcRequired', 'Piece code is required.') }, { whitespace: true, message: t('products.rule.pcBlank', 'Cannot be blank.') }, { pattern: /^[A-Za-z0-9\-_]+$/, message: t('products.rule.pcPattern', 'Only letters, numbers, hyphens, underscores.') }]}>
                  <Input placeholder={t('products.placeholder.pcExample', 'e.g. SHIRT-001')} size="large" style={{ borderRadius: 8, fontFamily: 'monospace', fontWeight: 700 }}
                    onChange={(e) => { form.setFieldValue('code', e.target.value.toUpperCase()); setPreviewCode(e.target.value.toUpperCase()); }} />
                </Form.Item>
                <Form.Item name="rate" label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.fixedRate', 'Fixed Rate')} ({getCurrencySymbol()}) *</span>}
                  rules={[{ required: true, message: t('products.rule.rateRequiredDot', 'Rate is required.') }, { validator: (_, v) => (!v && v !== 0) || Number(v) > 0 ? Promise.resolve() : Promise.reject(`${t('products.rule.rateMustExceed', 'Rate must be >')} ${getCurrencySymbol()}0.`) }]}>
                  <InputNumber placeholder={t('products.placeholder.rateExample', 'e.g. 10')} size="large" min={0.01} precision={2} prefix={getCurrencySymbol()} style={{ width: '100%', borderRadius: 8 }} onChange={(val) => setPreviewRate(val)} />
                </Form.Item>
              </Form>
            </Card>

            {/* Live Preview */}
            <PieceCodePreview code={previewCode} rate={previewRate} description={previewDesc} />
          </div>
        </Drawer>

        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCartOutlined style={{ color: '#0C4A6E', fontSize: '0.95rem' }} />
              </div>
              {t('products.receipts.title', 'Stock Receipts')}
            </span>
          }
          placement="right"
          width={820}
          onClose={handleCloseProductionDrawer}
          open={productionDrawerVisible}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
        >
          <Tabs
            activeKey={batchStatus}
            onChange={setBatchStatus}
            items={[{ key: 'ACTIVE', label: t('products.receipts.tabActive', 'Active') }, { key: 'SOLD', label: t('products.receipts.tabSold', 'Sold') }]}
            tabBarExtraContent={{
              right: (
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates || [null, null])}
                  format="DD-MMM-YY"
                  size="small"
                  style={{ width: 230 }}
                />
              ),
            }}
            style={{ marginBottom: 8 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Segmented
              size="small"
              value={batchSource}
              onChange={setBatchSource}
              options={[{ label: t('common.all', 'All'), value: 'ALL' }, { label: t('products.receipts.segPurchase', 'Purchase'), value: 'PURCHASED' }, { label: t('products.receipts.segProduction', 'Production'), value: 'MANUFACTURED' }]}
            />
            <Button type="link" size="small" onClick={() => { setDateRange([null, null]); setBatchSource('ALL'); }} style={{ color: 'var(--theme-primary)', fontWeight: 700, padding: 0 }}>{t('common.reset', 'Reset')}</Button>
          </div>
          <Table
            loading={batchesLoading}
            columns={[
              {
                title: t('common.date', 'Date'),
                dataIndex: 'receivedDate',
                key: 'receivedDate',
                render: (date) => dayjs(date).format('DD-MMM-YYYY'),
                sorter: (a, b) => new Date(b.receivedDate) - new Date(a.receivedDate),
                defaultSortOrder: 'descend',
              },
              {
                title: t('products.meta.source', 'Source'),
                dataIndex: 'source',
                key: 'source',
                render: (source) => (
                  <Tag color={source === 'PURCHASED' ? 'blue' : 'purple'} style={{ borderRadius: 6, margin: 0 }}>
                    {source === 'PURCHASED' ? t('products.receipts.tag.purchase', 'Purchase') : t('products.receipts.tag.production', 'Production')}
                  </Tag>
                ),
              },
              {
                title: t('products.col.qty', 'Qty'),
                dataIndex: 'totalQuantity',
                key: 'totalQuantity',
                align: 'right',
                render: (q) => q != null ? Number(q).toLocaleString('en-IN') : '-',
              },
              {
                title: t('products.col.sold', 'Sold'),
                key: 'sold',
                align: 'right',
                render: (_, r) => {
                  const sold = (Number(r.totalQuantity) || 0) - (Number(r.quantityAvailable) || 0);
                  return <span style={{ color: sold > 0 ? 'var(--theme-primary)' : '#94A3B8' }}>{sold.toLocaleString('en-IN')}</span>;
                },
              },
              {
                title: t('products.col.left', 'Left'),
                dataIndex: 'quantityAvailable',
                key: 'quantityAvailable',
                align: 'right',
                render: (q) => <b style={{ color: 'var(--theme-primary)' }}>{(Number(q) || 0).toLocaleString('en-IN')}</b>,
              },
              {
                title: `${t('products.col.cost', 'Cost')} (${getCurrencySymbol()})`,
                dataIndex: 'unitCost',
                key: 'unitCost',
                align: 'right',
                render: (c) => c != null ? `${getCurrencySymbol()}${Number(c).toLocaleString('en-IN')}` : '-',
              },
              {
                title: `${t('products.col.sale', 'Sale')} (${getCurrencySymbol()})`,
                dataIndex: 'sellingPrice',
                key: 'sellingPrice',
                align: 'right',
                render: (s) => s != null ? `${getCurrencySymbol()}${Number(s).toLocaleString('en-IN')}` : '-',
              },
              // Adjust qty + QR, only for in-stock batches when the user can edit inventory.
              ...(batchStatus === 'ACTIVE' && can('inventory', 'write') ? [{
                title: t('common.actions', 'Actions'),
                key: 'actions',
                align: 'center',
                render: (_, r) => (Number(r.quantityAvailable) || 0) > 0 ? (
                  <Space size={2}>
                    <Tooltip title={t('products.receipts.adjustTooltip', 'Adjust stock (increase / decrease)')}>
                      <Button type="text" size="small" icon={<SlidersOutlined />} onClick={() => openAdjust(r)} style={{ color: 'var(--theme-primary)' }} />
                    </Tooltip>
                    <Tooltip title={t('products.receipts.qrTooltip', 'Generate QR labels')}>
                      <Button type="text" size="small" icon={<QrcodeOutlined />} onClick={() => setQrBatch({ batchNumber: r.batchNumber, productName: product.name, quantityAvailable: r.quantityAvailable, quantityReceived: r.totalQuantity })} style={{ color: 'var(--theme-primary)' }} />
                    </Tooltip>
                  </Space>
                ) : <span style={{ color: '#CBD5E1' }}>—</span>,
              }] : []),
            ]}
            dataSource={filteredReceipts}
            rowKey={(item) => item.batchId}
            pagination={{ pageSize: 20, showSizeChanger: false, showQuickJumper: true, position: ['bottomRight'] }}
            locale={{ emptyText: t('products.receipts.empty', 'No stock receipts for this product.') }}
            size="small"
          />
        </Drawer>

        {/* Adjust stock modal (batch increase / decrease) */}
        <Modal
          open={Boolean(adjustTarget)}
          onCancel={closeAdjust}
          title={t('products.adjust.title', 'Adjust Stock')}
          okText={adjDir === 'INCREASE' ? t('products.adjust.increase', 'Increase') : t('products.adjust.decrease', 'Decrease')}
          confirmLoading={adjSaving}
          onOk={submitAdjust}
          width={420}
          destroyOnClose
        >
          {adjustTarget && (() => {
            const available = Number(adjustTarget.quantityAvailable || 0);
            const qty = Number(adjQty) || 0;
            const newAvail = adjDir === 'INCREASE' ? available + qty : available - qty;
            return (
              <div>
                <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 12 }}>
                  {t('products.adjust.batch', 'Batch')} <b style={{ color: '#0F172A' }}>{adjustTarget.batchNumber}</b>
                  <span style={{ color: '#CBD5E1', margin: '0 8px' }}>·</span>
                  {t('products.adjust.available', 'Available')} <b style={{ color: 'var(--theme-primary)' }}>{available.toLocaleString('en-IN')}</b>
                </div>
                <Segmented block value={adjDir} onChange={setAdjDir} options={[{ label: t('products.adjust.increaseOpt', '+ Increase'), value: 'INCREASE' }, { label: t('products.adjust.decreaseOpt', '− Decrease'), value: 'DECREASE' }]} style={{ marginBottom: 12 }} />
                <InputNumber min={1} value={adjQty} onChange={(v) => { setAdjQty(v); setAdjError(''); }} placeholder={t('products.adjust.qtyPlaceholder', 'Quantity')} prefix={adjDir === 'INCREASE' ? '+' : '−'} style={{ width: '100%', marginBottom: 12 }} />
                {qty > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#475569', background: 'color-mix(in srgb, var(--theme-primary) 8%, white)', borderRadius: 8, padding: '8px 12px' }}>
                    {t('products.adjust.newAvailable', 'New available:')} <b style={{ color: newAvail < 0 ? '#DC2626' : 'var(--theme-primary)' }}>{newAvail.toLocaleString('en-IN')}</b>
                    <span style={{ color: '#94A3B8', marginLeft: 6 }}>({available.toLocaleString('en-IN')} {adjDir === 'INCREASE' ? '+' : '−'} {qty.toLocaleString('en-IN')})</span>
                  </div>
                )}
                {adjError && <div style={{ color: '#DC2626', fontSize: '0.8rem', marginTop: 8 }}>{adjError}</div>}
              </div>
            );
          })()}
        </Modal>

        {/* QR labels generator for the selected batch */}
        <GenerateLabelsDialog
          open={Boolean(qrBatch)}
          onClose={() => setQrBatch(null)}
          batch={qrBatch}
          onGenerated={refreshStock}
        />

        {/* add material model */}
        <MaterialCostModal
          open={materialCostModalOpen}
          productId={productId}
          editingMaterialCost={editingMaterialCost}
          onClose={handleCloseMaterialCostModal}
          onSuccess={handleMaterialCostSuccess}
        />

      </Box>
    </ConfigProvider>
  );
};

export default ProductDetailsPage;
