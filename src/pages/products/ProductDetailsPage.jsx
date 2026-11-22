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
  InputNumber,
  Popconfirm,
  Tooltip,
  Skeleton,
  Result,
  notification,
  Modal,
  Segmented,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
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
  LeftOutlined,
  IdcardOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  EditOutlined,
  RightOutlined,
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
import BatchHistorySection from '../../components/products/BatchHistorySection';


/* ─────────────────────────────────────────
   Main Component
   ───────────────────────────────────────── */
const ProductDetailsPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const t = useT();

  // Adjust-stock + QR actions on a batch, done right here (mirrors the inventory details page).
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjQty, setAdjQty] = useState('');
  const [adjDir, setAdjDir] = useState('INCREASE');
  const [adjSaving, setAdjSaving] = useState(false);
  const [adjError, setAdjError] = useState('');
  const [qrBatch, setQrBatch] = useState(null);
  const [materialCostModalOpen, setMaterialCostModalOpen] = useState(false);
  const [editingMaterialCost, setEditingMaterialCost] = useState(null);
  const [pricingPage, setPricingPage] = useState(0); // Pricing History: 2 rows per page

  const PRICING_PAGE_SIZE = 2;

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

  // Stock receipts (batches: purchase + production) — powers the always-visible
  // Batch History section and the "View All" drawer, so it loads on page visit.
  const { data: batchesResponse, isLoading: batchesLoading } = useQuery({
    queryKey: ['productBatchReceipts', productId],
    queryFn: () => productService.getProductBatches(productId, { page: 0, size: 500 }),
    enabled: !!productId,
    staleTime: 0,
    refetchOnMount: 'always',
  });


  const materialCosts = materialCostResponse?.data || [];
  const product = productResponse?.data;
 

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



  // Activate / deactivate (archive) the product itself.
  const productStatusMutation = useMutation({
    mutationFn: (active) => productService.updateProductStatus(productId, active),
    onSuccess: (res) => {
      notification.success({ message: t('products.toast.statusUpdated', 'Status Updated'), description: res.message || t('products.toast.statusUpdatedDesc', 'Product status updated.'), placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      notification.error({ message: t('products.toast.statusError', 'Error Updating Status'), description: err.response?.data?.message || err.message, placement: 'topRight', duration: 4.5 });
    },
  });

  // Deactivating asks first (the product moves to the Archive tab); activating is immediate.
  const handleToggleProductStatus = () => {
    if (!product.active) {
      productStatusMutation.mutate(true);
      return;
    }
    Modal.confirm({
      title: t('products.archive.title', 'Move to Archive'),
      content: (
        <div>
          <p>{t('products.archive.lineA', 'Deactivating "')}{product.name}{t('products.archive.lineB', '" will move it to the Archive tab. It will no longer appear in the active product listing, but can be restored later.')}</p>
          <p style={{ marginBottom: 0 }}>{t('products.archive.confirm', 'Are you sure you want to archive this product?')}</p>
        </div>
      ),
      okText: t('products.archive.ok', 'Archive Product'),
      okButtonProps: { style: { background: 'var(--theme-primary)', borderColor: 'var(--theme-primary)' } },
      cancelText: t('common.cancel', 'Cancel'),
      onOk: () => productStatusMutation.mutate(false),
    });
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

    if (!qty || qty <= 0) {
      setAdjError(
        t('inventory.enterQtyPositive', 'Enter a quantity greater than zero')
      );
      return;
    }

    const available = Number(adjustTarget?.quantityAvailable ?? 0);

    if (adjDir === 'DECREASE' && qty > available) {
      setAdjError(
        `${t('inventory.only', 'Only')} ${available} ${t(
          'inventory.unitsInBatch',
          'unit(s) available in this batch'
        )}`
      );
      return;
    }

    setAdjSaving(true);
    setAdjError('');

    try {
      await axiosInstance.patch(
        `/inventory/batches/${adjustTarget.batchId}/adjust`,
        {
          quantity: qty,
          direction: adjDir,
          remarks: adjRemarks.trim() || undefined,
        }
      );

      setToast({
        open: true,
        message: `${
          adjDir === 'INCREASE'
            ? t('inventory.stockIncreasedBy', 'Stock increased by')
            : t('inventory.stockDecreasedBy', 'Stock decreased by')
        } ${qty}`,
      });

      setAdjustTarget(null);

      // Refresh inventory data
      setRefreshKey((key) => key + 1);

      // Refresh dashboard and alerts
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });

      window.dispatchEvent(new Event('inventory-alerts-updated'));
    } catch (err) {
      setAdjError(
        err.response?.data?.message ||
          err.message ||
          t('inventory.adjustFailed', 'Failed to adjust stock')
      );
    } finally {
      setAdjSaving(false);
    }
  };


  // ── Styles ──────────────────────────────────────
  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.04)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };


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

  // Avg. Sale Price shown in the product info row:
  // purchased → stock value ÷ qty (/pc); manufactured → latest active selling price.
  const sym = getCurrencySymbol();
  const latestSalePrice = currentMaterialCost && (currentMaterialCost.salePrice || currentMaterialCost.salePrice === 0)
    ? Number(currentMaterialCost.salePrice) : null;
  const avgSalePrice = isPurchasedProduct
    ? (Number(stockSummary?.totalQty || 0) > 0
      ? `${sym}${Math.round(Number(stockSummary?.stockValue || 0) / Number(stockSummary?.totalQty || 1)).toLocaleString('en-IN')}${t('products.kpi.perPc', '/pc')}`
      : null)
    : (latestSalePrice != null ? `${sym}${latestSalePrice.toLocaleString('en-IN')}` : null);

  // Pricing History paging — 2 rows at a time, clamped so a deletion never strands us.
  const pricingTotalPages = Math.max(1, Math.ceil(materialCosts.length / PRICING_PAGE_SIZE));
  const pricingSafePage = Math.min(pricingPage, pricingTotalPages - 1);
  const pagedMaterialCosts = materialCosts.slice(pricingSafePage * PRICING_PAGE_SIZE, pricingSafePage * PRICING_PAGE_SIZE + PRICING_PAGE_SIZE);

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', minWidth: 0, flex: '1 1 280px' }}>
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

              {/* Product Info (can shrink inside the card on a phone) */}
              <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                {/* Name + Status */}
                {/* Wraps on a phone: the status tag and the (de)activate button move to the next line instead of overflowing */}
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, rowGap: 8, marginBottom: 4, minWidth: 0 }}>
                  <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', letterSpacing: -0.5, display: 'inline-flex', alignItems: 'center', minWidth: 0, overflowWrap: 'anywhere' }}>
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
                  {/* Deactivate (archive) / activate the product */}
                  {can('products', 'write') && (
                    <Button
                      size="small"
                      danger={product.active}
                      icon={product.active ? <StopOutlined /> : <CheckCircleOutlined />}
                      loading={productStatusMutation.isPending}
                      onClick={handleToggleProductStatus}
                      style={{ borderRadius: 20, fontWeight: 600 }}
                    >
                      {product.active ? t('products.deactivateProduct', 'Deactivate Product') : t('products.activateProduct', 'Activate Product')}
                    </Button>
                  )}
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

                  {avgSalePrice && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <RiseOutlined style={{ color: '#94A3B8', fontSize: '0.85rem' }} />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('products.kpi.avgSalePrice', 'Avg. Sale Price')}</div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{avgSalePrice}</div>
                      </div>
                    </div>
                  )}

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
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...cardStyle, height: 176 }} bodyStyle={{ padding: '14px 16px', height: '100%', overflow: 'hidden' }}>
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
                <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingOutlined style={{ color: 'var(--theme-primary)', fontSize: '1.1rem' }} />
                </div>
              </div>
            </Card>
          </Col>

          {/* Card 2: Total Cost = Σ(qty × unit cost), purchase + production */}
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ ...cardStyle, height: 176 }} bodyStyle={{ padding: '14px 16px', height: '100%', overflow: 'hidden' }}>
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

          {/* Card 3: Pricing History (expands to the remaining width) */}
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
                <Space size={4}>
                  {materialCosts.length > PRICING_PAGE_SIZE && (
                    <>
                      <Button type="text" size="small" icon={<LeftOutlined />} disabled={pricingSafePage === 0} onClick={() => setPricingPage(pricingSafePage - 1)} style={{ width: 26, height: 26 }} />
                      <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, minWidth: 30, textAlign: 'center' }}>{pricingSafePage + 1}/{pricingTotalPages}</span>
                      <Button type="text" size="small" icon={<RightOutlined />} disabled={pricingSafePage >= pricingTotalPages - 1} onClick={() => setPricingPage(pricingSafePage + 1)} style={{ width: 26, height: 26 }} />
                    </>
                  )}
                  {can('products', 'write') ? (
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
                  ) : null}
                </Space>
              }
              style={{ ...cardStyle, height: 176 }}
              headStyle={{ padding: '10px 12px' }}
              bodyStyle={{ padding: 0, overflow: 'hidden' }}
            >
              <Table
                className="custom-table"
                rowKey="id"
                loading={materialCostLoading}
                dataSource={pagedMaterialCosts}
                columns={materialcolumns}
                scroll={{ x: 'max-content' }}
                locale={{ emptyText: t('products.pricing.empty', 'No pricing set yet. Add cost & sale price so production and New Sale use them.') }}
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>

        {/* ── Batch History (same layout/icons as the Inventory module) ── */}
        <BatchHistorySection
          batches={batchesResponse?.batches || []}
          productName={product.name}
          canWrite={can('inventory', 'write')}
          onAdjust={openAdjust}
          onQr={setQrBatch}
        />

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
