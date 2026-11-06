import React, { useEffect, useState } from 'react';
import HeadingInfo from '../../components/common/HeadingInfo';
import { getCurrencySymbol } from '../../utils/currency';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ConfigProvider,
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Space,
  notification,
  Empty,
  Popover,
  Tooltip,
  Popconfirm,
  Dropdown,
  Tag,
  Select,
  Drawer,
  Modal,
  Tabs,
  Upload,
  InputNumber,
} from 'antd';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  InboxOutlined,
  TagsOutlined,
  FilterOutlined,
  EyeOutlined,
  BarcodeOutlined,
  MoreOutlined,
  StopOutlined,
  ReloadOutlined,
  BuildOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Box } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { getProductIcon, PRODUCT_ICONS, PRODUCT_ICON_LABELS } from '../../utils/product-icons';
import { usePermissions } from '../../hooks/usePermissions';
import { useT } from '../../contexts/LanguageContext';

/* ─────────────────────────────────────────────────────────
   Icon Picker (Popover grid)
   ───────────────────────────────────────────────────────── */
const IconPicker = ({ value, onChange }) => {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredIcons = Object.keys(PRODUCT_ICONS).filter(
    (key) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      PRODUCT_ICON_LABELS[key].toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = value ? PRODUCT_ICON_LABELS[value] : '';
  const selectedEmoji = value ? PRODUCT_ICONS[value] : '';

  const handleSelect = (key) => {
    if (onChange) onChange(key);
    setOpen(false);
  };

  const content = (
    <div style={{ width: '300px', padding: '4px' }}>
      <Input
        placeholder={t('products.iconPicker.searchPlaceholder', 'Search icons...')}
        prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 12, borderRadius: 6 }}
        autoFocus
      />
      <div
        className="hide-scrollbar"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          maxHeight: '220px',
          overflowY: 'auto',
          padding: 2,
        }}
      >
        {filteredIcons.map((key) => {
          const emoji = PRODUCT_ICONS[key];
          const label = PRODUCT_ICON_LABELS[key];
          const isSelected = value === key;
          return (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 2px',
                borderRadius: 8,
                border: isSelected ? '2px solid var(--theme-primary)' : '1px solid #E2E8F0',
                backgroundColor: isSelected ? 'color-mix(in srgb, var(--theme-primary) 12%, white)' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#C7D2FE';
                  e.currentTarget.style.backgroundColor = '#F8FAFC';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.backgroundColor = '#ffffff';
                }
              }}
            >
              <span style={{ fontSize: '1.4rem', marginBottom: 2 }}>{emoji}</span>
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  color: '#475569',
                  textTransform: 'capitalize',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
      overlayStyle={{ zIndex: 1050 }}
    >
      <div
        style={{
          width: '100%',
          height: '40px',
          border: '1px solid #D9D9D9',
          borderRadius: 8,
          padding: '4px 11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          backgroundColor: '#ffffff',
          transition: 'all 0.3s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--theme-primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D9D9D9'; }}
      >
        {value ? (
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>
            {selectedEmoji} {selectedLabel}
          </span>
        ) : (
          <span style={{ color: '#BFBFBF', fontSize: '0.9rem' }}>{t('products.iconPicker.empty', 'Search and select an icon')}</span>
        )}
        <span style={{ color: '#BFBFBF', fontSize: '0.8rem' }}>▼</span>
      </div>
    </Popover>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Products Page Component
   ───────────────────────────────────────────────────────── */
const ProductsPage = () => {
  const t = useT();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can, isAdmin } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const [form] = Form.useForm();
  const [enableForm] = Form.useForm();
  const [enableTarget, setEnableTarget] = useState(null); // purchased product being enabled for manufacturing
  const [searchText, setSearchText] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Optional image selected in the create form (uploaded after the product is created).
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);

  const clearNewImage = () => {
    setNewImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setNewImageFile(null);
  };

  const handleSelectImage = (file) => {
    // Replace any previously selected file and refresh the preview.
    setNewImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setNewImageFile(file);
  };

  useEffect(() => {
    const tabValue = searchParams.get('tab');
    if (['manufacture', 'purchase', 'all', 'archive'].includes(tabValue)) {
      setActiveTab(tabValue);
    }
  }, [searchParams]);

  // ── Fetch products ─────────────────────────────────────
  const { data: productsData, isLoading: productsLoading, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: productService.getProducts,
    // Auto-refresh on open — no manual refresh button needed.
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const products = productsData?.data || [];
  const manufactureProducts = products.filter((p) => p.source !== 'PURCHASED');
  const purchaseProducts = products.filter((p) => p.source === 'PURCHASED');

  // ── Stats ──────────────────────────────────────────────
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active).length;
  const inactiveProducts = products.filter((p) => !p.active).length;
  const totalPieceCodesAcrossAll = products.reduce(
    (sum, p) => sum + (p.activePieceCodes || 0),
    0
  );

  // ── Mutations ──────────────────────────────────────────
  const createProductMutation = useMutation({
    mutationFn: async (values) => {
      const result = await productService.createProduct(values);
      // Optional image: upload only after the product exists. Never fail the
      // create over an image error — the product is already saved.
      if (newImageFile && result?.data?.id) {
        try {
          await productService.uploadImage(result.data.id, newImageFile);
        } catch (imgErr) {
          notification.warning({
            message: t('products.toast.imageUploadFailed', 'Image Upload Failed'),
            description: t('products.toast.imageUploadFailedDesc', 'The product was created, but its image could not be uploaded. You can add it later from the product page.'),
            placement: 'topRight',
            duration: 5,
          });
        }
      }
      return result;
    },
    onSuccess: (res) => {
      notification.success({
        message: t('products.toast.created', 'Product Created'),
        description: res.message || t('products.toast.createdDesc', 'Product created successfully.'),
        placement: 'topRight',
        duration: 4,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashProducts'] }); // dashboard "Total Products" count
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
      refetchProducts();
      form.resetFields();
      clearNewImage();
      setDrawerOpen(false);
    },
    onError: (err) => {
      notification.error({
        message: t('products.toast.createFailed', 'Product Creation Failed'),
        description: err.message || t('products.toast.createFailedDesc', 'An error occurred while saving the product.'),
        placement: 'topRight',
        duration: 4.5,
      });
    },
  });

  // Enable manufacturing on a purchased-only product (source → BOTH + piece codes + pricing).
  const enableManufacturingMutation = useMutation({
    mutationFn: ({ id, values }) => productService.enableManufacturing(id, values),
    onSuccess: () => {
      notification.success({ message: t('products.toast.mfgEnabled', 'Manufacturing Enabled'), description: t('products.toast.mfgEnabledDesc', 'Product can now be produced.'), placement: 'topRight', duration: 3 });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
      refetchProducts();
      setEnableTarget(null);
      enableForm.resetFields();
    },
    onError: (err) => {
      notification.error({ message: t('products.toast.mfgFailed', 'Could not enable manufacturing'), description: err.message || t('products.toast.genericError', 'An error occurred.'), placement: 'topRight', duration: 4.5 });
    },
  });

  const openEnableManufacturing = (product) => {
    setEnableTarget(product);
    enableForm.setFieldsValue({ pieceCodes: [{}], cost: undefined, sellingPrice: undefined });
  };

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, active }) => productService.updateProductStatus(id, active),
    onSuccess: (res) => {
      notification.success({
        message: t('products.toast.statusUpdated', 'Status Updated'),
        description: res.message || t('products.toast.statusUpdatedDesc', 'Product status updated.'),
        placement: 'topRight',
        duration: 3,
      });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => {
      const errorMsg = err.response?.data?.message || err.message || t('products.toast.statusErrorDesc', 'Failed to toggle status.');
      notification.error({
        message: t('products.toast.statusError', 'Error Updating Status'),
        description: errorMsg,
        placement: 'topRight',
        duration: 4.5,
      });
    },
  });

  const handleToggleStatus = (record) => {
    if (record.active) {
      Modal.confirm({
        title: t('products.archive.title', 'Move to Archive'),
        content: (
          <div>
            <p>
              {t('products.archive.lineA', 'Deactivating "')}{record.name}{t('products.archive.lineB', '" will move it to the Archive tab. It will no longer appear in the active product listing, but can be restored later.')}
            </p>
            <p style={{ marginBottom: 0 }}>
              {t('products.archive.confirm', 'Are you sure you want to archive this product?')}
            </p>
          </div>
        ),
        okText: t('products.archive.ok', 'Archive Product'),
        okType: 'danger',
        cancelText: t('common.cancel', 'Cancel'),
        onOk() {
          toggleStatusMutation.mutate({ id: record.id, active: false });
        },
      });
    } else {
      toggleStatusMutation.mutate({ id: record.id, active: true });
    }
  };

  const onFinishProduct = (values) => {
    const normalizedName = values.name?.trim().toLowerCase();
    if (!normalizedName) {
      notification.warning({
        message: t('products.toast.invalidName', 'Invalid Product Name'),
        description: t('products.toast.invalidNameDesc', 'Please provide a valid product name before saving.'),
        placement: 'topRight',
        duration: 4,
      });
      return;
    }

    const existingProduct = products.find(
      (p) => p.name?.trim().toLowerCase() === normalizedName
    );

    if (existingProduct) {
      if (existingProduct.active) {
        notification.warning({
          message: t('products.toast.exists', 'Product Already Exists'),
          description: `${t('products.toast.existsDescA', 'A product named "')}${values.name}${t('products.toast.existsDescB', '" already exists and is active. Please choose a different name or restore the archived product instead.')}`,
          placement: 'topRight',
          duration: 5,
        });
      } else {
        Modal.confirm({
          title: t('products.restore.title', 'Restore Archived Product'),
          content: (
            <div>
              <p>
                {t('products.restore.lineA', 'A product named "')}{values.name}{t('products.restore.lineB', '" already exists in the Archive. Would you like to restore it instead of creating a duplicate?')}
              </p>
              <p style={{ marginBottom: 0 }}>
                {t('products.restore.note', 'Once restored, it will appear again in the active Products list.')}
              </p>
            </div>
          ),
          okText: t('products.restore.ok', 'Restore Product'),
          cancelText: t('common.cancel', 'Cancel'),
          onOk() {
            toggleStatusMutation.mutate({ id: existingProduct.id, active: true });
          },
        });
      }
      return;
    }

    createProductMutation.mutate(values);
  };

  // ── Client-side filtering & sorting ────────────────────
  const filteredProducts = React.useMemo(() => {
    let sourceFiltered = products;
    if (activeTab === 'manufacture') {
      sourceFiltered = products.filter((p) => p.source !== 'PURCHASED' && p.active);
    } else if (activeTab === 'purchase') {
      sourceFiltered = products.filter((p) => (p.source === 'PURCHASED' || p.source === 'BOTH') && p.active);
    } else if (activeTab === 'archive') {
      sourceFiltered = products.filter((p) => !p.active);
    } else {
      sourceFiltered = products.filter((p) => p.active);
    }

    let result = [...sourceFiltered];

    // Search filter
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchText, sortBy, activeTab]);

  const cardStyle = {
    borderRadius: 12,
    boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
    border: '1px solid #E2E8F0',
    backgroundColor: '#ffffff',
  };

  return (
    <ConfigProvider
      theme={{
        token: {
                    borderRadius: 8,
          fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '4px 0' }}>
        
        {/* ── Page Header Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#0F172A', letterSpacing: -0.5, display: 'flex', alignItems: 'center' }}>
              {t('products.directory.title', 'Product Directory')}
              <HeadingInfo text={t('products.directory.info', 'Manage garment products, piece rates, and production codes')} />
            </h2>
          </div>
          
          {/* Aligned Toolbar Filters */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <Input
              placeholder={t('products.searchPlaceholder', 'Search products...')}
              prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              style={{ width: 220, borderRadius: 8, height: 38 }}
            />

            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 160, height: 38 }}
              size="large"
              options={[
                { value: 'newest', label: t('products.sort.newest', 'Sort: Newest') },
                { value: 'oldest', label: t('products.sort.oldest', 'Sort: Oldest') },
                { value: 'name', label: t('products.sort.name', 'Sort: Alphabetical') },
              ]}
            />

            {can('products', 'write') && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setDrawerOpen(true)}
                style={{ borderRadius: 8, fontWeight: 700, height: 38, paddingInline: 18 }}
              >
                {t('products.addProduct', 'Add Product')}
              </Button>
            )}
          </div>
        </div>

        {/* ── Product Cards Grid Section ── */}
        <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              const nextParams = new URLSearchParams(searchParams);
              nextParams.set('tab', key);
              setSearchParams(nextParams);
            }}
            items={[
              { key: 'all', label: t('common.all', 'All') },
              { key: 'manufacture', label: t('products.tab.manufacture', 'Manufacture') },
              { key: 'purchase', label: t('products.tab.purchase', 'Purchase') },
              { key: 'archive', label: t('products.tab.archive', 'Archive') },
            ]}
            style={{ flex: 1 }}
          />
          <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 500 }}>
            {t('products.showing', 'Showing')} {filteredProducts.length} {t('products.productsWord', 'products')}
          </div>
        </div>
        {filteredProducts.length > 0 ? (
          <Row gutter={[12, 12]} align="stretch">
            {filteredProducts.map((product) => {
              const productIcon = getProductIcon(product.iconName, product.name);

              const openDetails = () => {
                // Product details is admin-only — staff cannot drill in.
                if (!isAdmin) return;
                const nextParams = new URLSearchParams(searchParams);
                nextParams.set('tab', activeTab);
                navigate(`/products/${product.id}?${nextParams.toString()}`);
              };

              const dropdownMenu = {
                items: [
                  ...(product.source === 'PURCHASED' ? [{
                    key: 'enable-manufacturing',
                    label: t('products.enableManufacturing', 'Enable Manufacturing'),
                    icon: <BuildOutlined style={{ color: 'var(--theme-primary)' }} />,
                    onClick: () => openEnableManufacturing(product),
                  }] : []),
                  {
                    key: 'toggle-status',
                    label: product.active ? t('products.deactivateProduct', 'Deactivate Product') : t('products.activateProduct', 'Activate Product'),
                    icon: product.active ? <StopOutlined style={{ color: '#EA580C' }} /> : <CheckCircleOutlined style={{ color: 'var(--theme-primary)' }} />,
                    onClick: () => handleToggleStatus(product),
                  },
                ],
              };

              return (
                <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
                  <div className="product-card" style={{ ...cardStyle, height: '100%', display: 'flex', flexDirection: 'column' }} onClick={openDetails}>
                    {/* Image / icon area */}
                    <div
                      style={{
                        position: 'relative',
                        height: 130,
                        background: 'linear-gradient(135deg, #F8FAFC 0%, color-mix(in srgb, var(--theme-primary) 12%, white) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3.4rem',
                        borderBottom: '1px solid #F1F5F9',
                        overflow: 'hidden',
                      }}
                    >
                      {product.hasImage ? (
                        <img
                          src={productService.imageUrl(product.id)}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            // Image missing/failed — fall back to the product icon.
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <span
                        style={{
                          display: product.hasImage ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {productIcon}
                      </span>

                      {/* Status badge (top-left) */}
                      <span
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          backgroundColor: product.active ? 'color-mix(in srgb, var(--theme-primary) 12%, white)' : '#FEF2F2',
                          color: product.active ? 'var(--theme-primary)' : '#DC2626',
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 10,
                        }}
                      >
                        {product.active ? t('products.active', 'Active') : t('products.inactive', 'Inactive')}
                      </span>

                      {/* Kebab (top-right corner) */}
                      {can('products', 'write') && (
                      <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }} onClick={(e) => e.stopPropagation()}>
                        <Dropdown menu={dropdownMenu} trigger={['click']} placement="bottomRight">
                          <Button
                            type="text"
                            size="small"
                            icon={<MoreOutlined style={{ fontSize: '1.05rem', color: '#334155' }} />}
                            style={{
                              width: 26, height: 26, padding: 0, borderRadius: '50%',
                              background: '#ffffff', boxShadow: '0 1px 4px rgba(15,23,42,0.18)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}
                          />
                        </Dropdown>
                      </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '10px 12px 12px' }}>
                      <div
                        title={product.name}
                        style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      >
                        {product.name}
                      </div>
                      {/* Current/latest list price; hover shows per-batch prices when they vary */}
                      <Tooltip
                        title={(product.batchSalePrices && product.batchSalePrices.length > 1) ? (
                          <div style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>{t('products.batchPrices', 'Batch prices')} ({product.batchSalePrices.length})</div>
                            {product.batchSalePrices.map((p, i) => (
                              <div key={i}>{getCurrencySymbol()}{Number(p).toLocaleString('en-IN')}</div>
                            ))}
                            <div style={{ marginTop: 3, opacity: 0.85 }}>
                              {t('products.range', 'Range')} {getCurrencySymbol()}{Number(product.batchSalePrices[0]).toLocaleString('en-IN')}–{getCurrencySymbol()}{Number(product.batchSalePrices[product.batchSalePrices.length - 1]).toLocaleString('en-IN')}
                            </div>
                          </div>
                        ) : ''}
                      >
                        <div style={{
                          marginTop: 4, fontSize: '1rem', fontWeight: 800, color: 'var(--theme-primary)', display: 'inline-block',
                          cursor: (product.batchSalePrices && product.batchSalePrices.length > 1) ? 'help' : 'default',
                          borderBottom: (product.batchSalePrices && product.batchSalePrices.length > 1) ? '1px dotted #94A3B8' : 'none',
                        }}>
                          {product.sellingPrice != null
                            ? `${getCurrencySymbol()}${Number(product.sellingPrice).toLocaleString('en-IN')}`
                            : <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94A3B8' }}>{t('products.noPriceSet', 'No price set')}</span>}
                        </div>
                      </Tooltip>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'nowrap', minWidth: 0 }}>
                        <span
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap',
                            fontSize: '0.68rem', fontWeight: 700,
                            color: product.source === 'PURCHASED' ? 'var(--theme-primary)' : product.source === 'BOTH' ? 'var(--theme-primary)' : '#0C4A6E',
                            backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                            padding: '2px 7px', borderRadius: 6,
                          }}
                        >
                          {product.source === 'PURCHASED' ? <ShoppingOutlined /> : <BuildOutlined />}
                          {product.source === 'PURCHASED' ? t('products.source.purchased', 'Purchased') : product.source === 'BOTH' ? t('products.source.both', 'Both') : t('products.source.made', 'Made')}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748B', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', padding: '2px 7px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, whiteSpace: 'nowrap' }}>
                          <InboxOutlined style={{ fontSize: '0.7rem' }} />
                          {Number(product.availableQty || 0).toLocaleString('en-IN')} {t('products.pcs', 'pcs')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card style={cardStyle} bodyStyle={{ padding: 48 }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem', marginBottom: 6 }}>{t('products.empty.title', 'No Products Found')}</div>
                  <div style={{ color: '#94A3B8', fontSize: '0.85rem', marginBottom: 16 }}>
                    {t('products.empty.desc', 'No products matched your search or status filter. Get started by adding a product!')}
                  </div>
                  {can('products', 'write') && (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)} style={{ borderRadius: 8, fontWeight: 600 }}>
                      {t('products.empty.addFirst', 'Add Your First Product')}
                    </Button>
                  )}
                </div>
              }
            />
          </Card>
        )}

        {/* ── Add Product Drawer ── */}
        <Drawer
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: 'color-mix(in srgb, var(--theme-primary) 12%, white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PlusOutlined style={{ color: 'var(--theme-primary)', fontSize: '1rem' }} />
              </div>
              {t('products.drawer.addTitle', 'Add New Product')}
            </span>
          }
          placement="right"
          width={460}
          onClose={() => {
            setDrawerOpen(false);
            form.resetFields();
            clearNewImage();
          }}
          open={drawerOpen}
          bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px' }}>
              <Button
                onClick={() => {
                  setDrawerOpen(false);
                  form.resetFields();
                  clearNewImage();
                }}
                style={{ borderRadius: 8, fontWeight: 600, height: 40 }}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={createProductMutation.isPending}
                onClick={() => form.submit()}
                style={{ borderRadius: 8, fontWeight: 700, height: 40, paddingInline: 20 }}
              >
                {t('products.saveProduct', 'Save Product')}
              </Button>
            </div>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinishProduct}
            autoComplete="off"
            requiredMark={false}
            initialValues={{ pieceCodes: [{}] }}
          >
            <Card style={{ borderRadius: 10, border: '1px solid #E2E8F0' }} bodyStyle={{ padding: 20 }}>
              <Form.Item
                name="name"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.name', 'Product Name *')}</span>}
                rules={[
                  { required: true, message: t('products.rule.nameRequired', 'Product Name is mandatory.') },
                  { whitespace: true, message: t('products.rule.nameEmpty', 'Product Name cannot be empty.') },
                ]}
              >
                <Input
                  placeholder={t('products.placeholder.name', 'e.g. Shirt, T-Shirt, Kurta')}
                  size="large"
                  id="product-name"
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                name="iconName"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.icon', 'Product Icon *')}</span>}
                rules={[{ required: true, message: t('products.rule.iconRequired', 'Product Icon is mandatory.') }]}
              >
                <IconPicker />
              </Form.Item>

              {/* Costing + selling price (selling price becomes effective today in Pricing History). */}
              <div style={{ display: 'flex', gap: 12 }}>
                <Form.Item
                  name="cost"
                  style={{ flex: 1 }}
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.costPrice', 'Cost Price *')}</span>}
                  rules={[{ required: true, message: t('products.rule.costRequired', 'Cost price is mandatory.') }]}
                >
                  <InputNumber min={0} size="large" addonBefore={getCurrencySymbol()} placeholder="0" style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item
                  name="sellingPrice"
                  style={{ flex: 1 }}
                  label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.sellingPrice', 'Selling Price *')}</span>}
                  rules={[{ required: true, message: t('products.rule.sellingRequired', 'Selling price is mandatory.') }]}
                >
                  <InputNumber min={0} size="large" addonBefore={getCurrencySymbol()} placeholder="0" style={{ width: '100%' }} />
                </Form.Item>
              </div>

              {/* One or more piece codes, each with its rate. */}
              <div style={{ fontWeight: 700, color: '#374151', marginBottom: 8 }}>{t('products.field.pieceCodes', 'Piece Codes *')}</div>
              <Form.List name="pieceCodes">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'flex-start' }}>
                        <Form.Item
                          {...restField}
                          name={[name, 'code']}
                          style={{ flex: 1, marginBottom: 0 }}
                          getValueFromEvent={(e) => (e.target.value || '').toUpperCase()}
                          rules={[{ required: true, message: t('products.rule.codeRequired', 'Code required') }, { whitespace: true, message: t('products.rule.codeRequired', 'Code required') }]}
                        >
                          <Input placeholder={t('products.placeholder.pieceCode', 'Piece code')} size="large" style={{ borderRadius: 8, textTransform: 'uppercase' }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'rate']}
                          style={{ flex: 1, marginBottom: 0 }}
                          rules={[{ required: true, message: t('products.rule.rateRequired', 'Rate required') }]}
                        >
                          <InputNumber min={0.01} placeholder="0" size="large" addonBefore={getCurrencySymbol()} style={{ width: '100%' }} />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginTop: 2 }} />
                        )}
                      </div>
                    ))}
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ borderRadius: 8, marginBottom: 16 }}>
                      {t('products.addPieceCode', 'Add Piece Code')}
                    </Button>
                  </>
                )}
              </Form.List>

              <Form.Item
                name="description"
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.description', 'Description')} <span style={{ fontWeight: 400, color: '#94A3B8' }}>{t('products.optional', '(optional)')}</span></span>}
              >
                <Input.TextArea
                  placeholder={t('products.placeholder.description', 'Enter product description...')}
                  rows={4}
                  style={{ borderRadius: 8 }}
                />
              </Form.Item>

              <Form.Item
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.image', 'Product Image')} <span style={{ fontWeight: 400, color: '#94A3B8' }}>{t('products.optional', '(optional)')}</span></span>}
                style={{ marginBottom: 0 }}
              >
                {newImagePreview ? (
                  <div style={{ position: 'relative', width: 104, height: 104 }}>
                    <img
                      src={newImagePreview}
                      alt="Selected product"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0' }}
                    />
                    <Button
                      type="text"
                      size="small"
                      onClick={clearNewImage}
                      title={t('products.removeImage', 'Remove image')}
                      style={{
                        position: 'absolute', top: -8, right: -8, width: 22, height: 22, padding: 0,
                        borderRadius: '50%', background: '#ffffff', color: '#EF4444',
                        boxShadow: '0 1px 4px rgba(15,23,42,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, lineHeight: 1,
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <Upload
                    listType="picture-card"
                    maxCount={1}
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      handleSelectImage(file);
                      return false; // prevent auto-upload; we upload after create
                    }}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8, fontSize: '0.78rem' }}>{t('products.upload', 'Upload')}</div>
                    </div>
                  </Upload>
                )}
              </Form.Item>
            </Card>
          </Form>
        </Drawer>

        {/* Enable Manufacturing: purchased product → BOTH, with piece codes + pricing. */}
        <Modal
          open={Boolean(enableTarget)}
          title={`${t('products.enableMfg.title', 'Enable Manufacturing')}${enableTarget ? ` — ${enableTarget.name}` : ''}`}
          onCancel={() => { setEnableTarget(null); enableForm.resetFields(); }}
          okText={t('products.enableMfg.title', 'Enable Manufacturing')}
          confirmLoading={enableManufacturingMutation.isPending}
          onOk={() => enableForm.submit()}
          destroyOnClose
        >
          <Form
            form={enableForm}
            layout="vertical"
            requiredMark={false}
            initialValues={{ pieceCodes: [{}] }}
            onFinish={(values) => enableManufacturingMutation.mutate({ id: enableTarget.id, values })}
          >
            <div style={{ display: 'flex', gap: 12 }}>
              <Form.Item name="cost" style={{ flex: 1 }}
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.costPrice', 'Cost Price *')}</span>}
                rules={[{ required: true, message: t('products.rule.costRequired', 'Cost price is mandatory.') }]}>
                <InputNumber min={0} prefix={getCurrencySymbol()} placeholder="0" controls={false} style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
              <Form.Item name="sellingPrice" style={{ flex: 1 }}
                label={<span style={{ fontWeight: 700, color: '#374151' }}>{t('products.field.sellingPrice', 'Selling Price *')}</span>}
                rules={[{ required: true, message: t('products.rule.sellingRequired', 'Selling price is mandatory.') }]}>
                <InputNumber min={0} prefix={getCurrencySymbol()} placeholder="0" controls={false} style={{ width: '100%', borderRadius: 8 }} />
              </Form.Item>
            </div>

            <div style={{ fontWeight: 700, color: '#374151', marginBottom: 6 }}>{t('products.field.pieceCodes', 'Piece Codes *')}</div>
            <Form.List name="pieceCodes">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                    <div style={{ flex: 2, fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.04em' }}>{t('products.col.code', 'CODE')}</div>
                    <div style={{ flex: 1, fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.04em' }}>{t('products.col.rate', 'RATE')}</div>
                    <div style={{ width: 32 }} />
                  </div>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                      <Form.Item {...restField} name={[name, 'code']} style={{ flex: 2, marginBottom: 0 }}
                        getValueFromEvent={(e) => (e.target.value || '').toUpperCase()}
                        rules={[{ required: true, message: t('products.rule.codeRequired', 'Code required') }, { whitespace: true, message: t('products.rule.codeRequired', 'Code required') }]}>
                        <Input placeholder={t('products.placeholder.codeExample', 'e.g. SHIRT-01')} style={{ borderRadius: 8, textTransform: 'uppercase' }} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'rate']} style={{ flex: 1, marginBottom: 0 }}
                        rules={[{ required: true, message: t('products.rule.rateRequired', 'Rate required') }]}>
                        <InputNumber min={0.01} placeholder="0" prefix={getCurrencySymbol()} controls={false} style={{ width: '100%', borderRadius: 8 }} />
                      </Form.Item>
                      <div style={{ width: 32, display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
                        {fields.length > 1 && (
                          <Button type="text" danger size="small" icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                        )}
                      </div>
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} style={{ borderRadius: 8, marginTop: 2 }}>
                    {t('products.addPieceCode', 'Add Piece Code')}
                  </Button>
                </>
              )}
            </Form.List>
          </Form>
        </Modal>

        {/* CSS Hover Transitions for Grid Cards */}
        <style>{`
          .product-card {
            cursor: pointer;
            overflow: hidden;
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .product-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 16px 24px -8px rgba(0, 0, 0, 0.12) !important;
            border-color: var(--theme-primary) !important;
          }
        `}</style>

      </Box>
    </ConfigProvider>
  );
};

export default ProductsPage;
