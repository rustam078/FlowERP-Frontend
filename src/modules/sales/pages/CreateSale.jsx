import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RemoveIcon from '@mui/icons-material/Remove';
import CloseIcon from '@mui/icons-material/Close';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import salesService from '../services/salesService';
import customerService from '../services/customerService';
import productService from '../services/productService';
import ScanBar from '../../qr/components/ScanBar';
import { mergeScannedUnit } from '../../qr/scanCart';
import { ProductThumb } from '../../../components/common/ProductLabel';
import PaymentConfirmDialog from '../../../components/common/PaymentConfirmDialog';
import { getCurrencySymbol } from '../../../utils/currency';
import { useGstConfig } from '../../../contexts/AppSettingsContext';
import { usePermissions } from '../../../hooks/usePermissions';
import { useT } from '../../../contexts/LanguageContext';

// Walk FIFO batches, pricing each drawn unit at its own batch selling price.
// Returns the exact gross, total cost, weighted-average price and a per-batch breakdown.
const fifoPricing = (batches, quantity) => {
  const qty = Number(quantity) || 0;
  if (!Array.isArray(batches) || !batches.length || qty <= 0) {
    return { gross: 0, cost: 0, avgPrice: 0, breakdown: [] };
  }
  let remaining = qty;
  let gross = 0;
  let cost = 0;
  const breakdown = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    const avail = Number(b.quantityAvailable) || 0;
    if (avail <= 0) continue;
    const take = Math.min(remaining, avail);
    const price = Number(b.sellingPrice) || 0;
    gross += take * price;
    cost += take * (Number(b.unitCost) || 0);
    breakdown.push({ qty: take, price });
    remaining -= take;
  }
  return { gross, cost, avgPrice: qty > 0 ? gross / qty : 0, breakdown };
};

// Per-line money for one cart row: scanned lines use their frozen price, typed lines use FIFO.
const lineDerived = (item) => {
  const qty = Number(item.quantity) || 0;
  const scanned = Boolean(item.serials && item.serials.length);
  if (scanned) {
    const price = Number(item.sellingPrice) || 0;
    const cost = Number(item.cost) || 0;
    return { gross: price * qty, cost: cost * qty, avgPrice: price, breakdown: [{ qty, price }] };
  }
  return fifoPricing(item.saleBatches, qty);
};

const CreateSale = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { gstEnabled, gstPercent } = useGstConfig();
  const { can } = usePermissions();
  const t = useT();
  const [formValues, setFormValues] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    paymentMode: 'CASH',
    paymentProvider: '',
    discount: 0,
    items: [],
  });
  const [customerResults, setCustomerResults] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false); // payment confirmation before completing the sale
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [profitOpen, setProfitOpen] = useState(false); // profit summary side panel
  const [discountText, setDiscountText] = useState('0'); // ₹ amount field text (stored truth = formValues.discount)
  const [pctText, setPctText] = useState('0'); // % field text; the two fields convert into each other
  const [discountMode, setDiscountMode] = useState('PERCENT'); // single field toggles ₹ / % (auto-converts)
  const [previousDue, setPreviousDue] = useState(0); // this customer's outstanding from past sales
  const [receivedText, setReceivedText] = useState('0'); // amount received now (text so no arrows/scroll)

  const anyProductSelected = formValues.items.length > 0;
  const hasValidationIssues = useMemo(() => {
    if (!formValues.customerName.trim()) return true;
    if (!formValues.customerMobile.trim()) return true;
    if (!formValues.items.length) return true;
    for (const item of formValues.items) {
      if (!item.productId) return true;
      if (!item.quantity || Number(item.quantity) <= 0) return true;
      if (item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)) return true;
      // Typed line must resolve a FIFO price once its batches are loaded.
      const scanned = Boolean(item.serials && item.serials.length);
      if (!scanned && Array.isArray(item.saleBatches) && lineDerived(item).avgPrice <= 0) return true;
    }
    return false;
  }, [formValues]);

  // Physical-QR-stock reconciliation prompt (batch-wise) — shown when the backend reports
  // scanned QR whose batch system stock is 0/short (FIFO already drained it).
  const [reconcile, setReconcile] = useState({ open: false, batches: [] });
  const pendingPayloadRef = React.useRef(null);

  const createSaleMutation = useMutation({
    mutationFn: salesService.createSale,
    onSuccess: () => {
      // A new sale changes the dashboard, recent sales, top products, the sales
      // list and stock levels — invalidate them all so every view is fresh.
      queryClient.invalidateQueries({ queryKey: ['salesDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['recentSales'] });
      queryClient.invalidateQueries({ queryKey: ['topProducts'] });
      queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['salesList'] });
      setToast({ open: true, message: t('sales.toast.saleCreated', 'Sale created successfully'), severity: 'success' });
      setTimeout(() => navigate('/sales/list'), 900);
    },
    onError: (error) => {
      const body = error.response?.data;
      if (body?.reconcileNeeded && Array.isArray(body.batches) && body.batches.length) {
        // Ask the user (once per batch) to reconcile physical stock, then resend.
        setReconcile({ open: true, batches: body.batches });
        return;
      }
      setToast({ open: true, message: error.message || t('sales.toast.unableCreate', 'Unable to create sale'), severity: 'error' });
    },
  });

  // User approved reconciliation → resend the same sale, now authorising those batches.
  const handleConfirmReconcile = () => {
    const batchNumbers = reconcile.batches.map((b) => b.batchNumber);
    const base = pendingPayloadRef.current || {};
    setReconcile({ open: false, batches: [] });
    createSaleMutation.mutate({ ...base, reconcileBatches: batchNumbers });
  };

  // Subtotal = sum of every line's FIFO gross (before the order-level discount).
  const subtotal = useMemo(
    () => formValues.items.reduce((sum, item) => (item.productId ? sum + lineDerived(item).gross : sum), 0),
    [formValues.items]
  );
  const totalCostBasis = useMemo(
    () => formValues.items.reduce((sum, item) => (item.productId ? sum + lineDerived(item).cost : sum), 0),
    [formValues.items]
  );
  // One order-level discount, clamped to the subtotal.
  const totalDiscount = Math.min(Math.max(0, Number(formValues.discount) || 0), subtotal);
  const net = subtotal - totalDiscount; // taxable amount after discount
  const totalProfit = net - totalCostBasis;
  const totalProfitPct = totalCostBasis > 0 ? (totalProfit / totalCostBasis) * 100 : null;
  const itemsTotal = subtotal; // gross before discount
  // GST on the net amount (subtotal − discount), only when enabled in Settings.
  const gstAmount = gstEnabled && net > 0 ? (net * (Number(gstPercent) || 0)) / 100 : 0;
  const rawPayable = net + gstAmount;
  // Grand total is always rounded to the nearest whole unit (retail round-off).
  const payable = Math.round(rawPayable);
  const roundOffAmount = payable - rawPayable;

  // Total the customer owes now = this bill + their previous dues; what is left after payment.
  const grandOwed = payable + previousDue;
  const amountReceived = Math.min(Math.max(0, Number(receivedText) || 0), grandOwed);
  const remainingDue = Math.max(0, grandOwed - amountReceived);

  // Fetch the customer's previous outstanding once a full mobile is entered/selected.
  useEffect(() => {
    const mobile = formValues.customerMobile.trim();
    if (mobile.length < 8) { setPreviousDue(0); return undefined; }
    let active = true;
    const timer = window.setTimeout(async () => {
      try {
        const data = await salesService.getCustomerOutstanding(mobile);
        if (active) setPreviousDue(Number(data?.totalOutstanding) || 0);
      } catch { if (active) setPreviousDue(0); }
    }, 450);
    return () => { active = false; window.clearTimeout(timer); };
  }, [formValues.customerMobile]);

  // "Amount received" is not auto-filled — the cashier types it or clicks "Pay full".

  // When items/quantities change: clamp the discount to the subtotal and resync both field texts.
  useEffect(() => {
    const amt = Math.min(Number(formValues.discount) || 0, subtotal);
    setFormValues((prev) => ((Number(prev.discount) || 0) !== amt ? { ...prev, discount: amt } : prev));
    setDiscountText(String(amt));
    setPctText(subtotal > 0 ? String(Math.round((amt / subtotal) * 10000) / 100) : '0');
  }, [subtotal]); // formValues.discount intentionally omitted — typing updates texts directly

  // Allow only digits and a decimal point (no arrows / wheel: fields are type=text).
  const sanitizeNum = (s) => s.replace(/[^0-9.]/g, '');

  // Type the ₹ amount → derive the % field.
  const handleDiscountAmount = (raw) => {
    const clean = sanitizeNum(raw);
    setDiscountText(clean);
    const amt = Math.min(Math.max(0, Number(clean) || 0), subtotal);
    setFormValues((prev) => ({ ...prev, discount: amt }));
    setPctText(subtotal > 0 ? String(Math.round((amt / subtotal) * 10000) / 100) : '0');
  };

  // Type the % → derive the ₹ amount (amount stays the stored source of truth).
  const handleDiscountPercent = (raw) => {
    const clean = sanitizeNum(raw);
    setPctText(clean);
    const pct = Math.min(Math.max(0, Number(clean) || 0), 100);
    const amt = Math.min(Math.round(subtotal * pct) / 100, subtotal);
    setFormValues((prev) => ({ ...prev, discount: amt }));
    setDiscountText(String(amt));
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  // Live validation on blur: show/clear the error for mobile & email as the cursor leaves.
  const validateField = (name, value) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (name === 'customerMobile') {
        if (value && !/^\d{10}$/.test(value)) next.customerMobile = t('sales.validation.mobile10', 'Enter a valid 10-digit number');
        else delete next.customerMobile;
      } else if (name === 'customerEmail') {
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) next.customerEmail = t('sales.validation.email', 'Enter a valid email');
        else delete next.customerEmail;
      }
      return next;
    });
  };

  const updateItem = (index, changes) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.map((item, idx) => (idx === index ? { ...item, ...changes } : item)),
    }));
  };

  const isQuantityExceeded = (item) => (
    item && item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)
  );

  const formatProductLabel = (product) => {
    const code = product?.productCode || product?.barcode || product?.sku || product?.productSKU || product?.code;
    return [product?.productName || product?.name || '', code].filter(Boolean).join(' - ');
  };

  const handleRemoveItem = (index) => {
    setFormValues((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== index) }));
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formValues.customerName.trim()) nextErrors.customerName = t('sales.validation.required', 'Required');
    if (!formValues.customerMobile.trim()) nextErrors.customerMobile = t('sales.validation.required', 'Required');
    else if (!/^\d{10}$/.test(formValues.customerMobile.trim())) nextErrors.customerMobile = t('sales.validation.mobile10', 'Enter a valid 10-digit number');
    if ((formValues.customerEmail || '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((formValues.customerEmail || '').trim())) nextErrors.customerEmail = t('sales.validation.email', 'Enter a valid email');
    if (!formValues.items.length) nextErrors.items = t('sales.validation.addProduct', 'Add at least one product');
    formValues.items.forEach((item, index) => {
      if (!item.quantity || Number(item.quantity) <= 0) nextErrors[`quantity_${index}`] = t('sales.validation.qtyGt0', 'Qty > 0');
      if (item.quantityAvailable != null && Number(item.quantity) > Number(item.quantityAvailable)) nextErrors[`quantity_${index}`] = t('sales.validation.exceedsStock', 'Exceeds stock');
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Open the payment confirmation (only once the form is valid) before actually creating the sale.
  const handleCompleteClick = () => { if (validateForm()) setConfirmOpen(true); };

  const handleSave = () => {
    if (!validateForm()) return;
    setConfirmOpen(false);
    const payload = {
      customerName: formValues.customerName,
      customerMobile: formValues.customerMobile,
      customerEmail: formValues.customerEmail,
      paymentMode: formValues.paymentMode,
      paymentProvider: formValues.paymentProvider,
      discount: totalDiscount, // one order-level discount, split across lines by the backend
      amountReceived, // paid now; shortfall vs (bill + previous due) becomes the customer's due
      items: formValues.items.map((item) => {
        const scanned = Boolean(item.serials && item.serials.length);
        return {
          productId: item.productId,
          quantity: Number(item.quantity),
          // Scanned lines carry their frozen price; typed lines are priced by the backend (FIFO).
          sellingPrice: scanned ? Number(item.sellingPrice) : undefined,
          batchNumber: item.batchNumber || undefined,
          serials: scanned ? item.serials : undefined,
        };
      }),
    };
    pendingPayloadRef.current = payload; // reused if reconciliation is needed
    createSaleMutation.mutate(payload);
  };

  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const data = await customerService.getCustomers(formValues.customerMobile.trim());
      setCustomerResults(data?.content || []);
    } catch (err) {
      setToast({ open: true, message: err.message || t('sales.toast.unableFetchCustomers', 'Unable to fetch customers'), severity: 'error' });
    } finally {
      setCustomerLoading(false);
    }
  };

  useEffect(() => {
    if (!formValues.customerMobile.trim()) {
      setCustomerResults([]);
      setSelectedCustomer(null);
      return;
    }
    const timer = window.setTimeout(fetchCustomers, 400);
    return () => window.clearTimeout(timer);
  }, [formValues.customerMobile]);

  // Load inventory products once for the add-product search.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setProductLoading(true);
      try {
        const list = await productService.getInventoryProducts(0, 200);
        if (!mounted) return;
        setProductOptions(Array.isArray(list) ? list : []);
      } catch (err) {
        setToast({ open: true, message: err.message || t('sales.toast.unableLoadProducts', 'Unable to load products'), severity: 'error' });
      } finally {
        if (mounted) setProductLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleSelectCustomer = (customer) => {
    if (!customer) { setSelectedCustomer(null); return; }
    setSelectedCustomer(customer);
    setReceivedText('0'); // amount received is manual — reset for the new customer
    setFormValues((prev) => ({
      ...prev,
      customerName: customer.name || '',
      customerMobile: customer.mobile || '',
      customerEmail: customer.email || '',
    }));
  };

  // Clear (X) on the mobile field → reset the whole customer (name, email, dues).
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    setReceivedText('0');
    setFormValues((prev) => ({ ...prev, customerName: '', customerMobile: '', customerEmail: '' }));
  };

  // A scanned QR unit → add/merge a batch-bound line at its frozen price.
  const handleScannedUnit = (unit) => {
    const makeNewItem = (u) => ({
      productId: u.productId,
      productName: u.productName,
      quantityAvailable: null,
      quantity: 1,
      sellingPrice: Number(u.printedPrice),
      cost: Number(u.unitCost) || 0,
      discount: 0,
      batchNumber: u.batchNumber,
      serials: [u.serial],
    });
    const { items, error } = mergeScannedUnit(formValues.items, unit, makeNewItem);
    if (error) { setToast({ open: true, message: error, severity: 'error' }); return; }
    setFormValues((prev) => ({ ...prev, items }));
    setToast({ open: true, message: `${t('sales.toast.added', 'Added')} ${unit.serial}`, severity: 'success' });
  };

  // Load a product's FIFO batches so the typed line can price itself; also sets the stock cap.
  const loadSaleBatches = async (productId) => {
    try {
      const batches = await productService.getSaleBatches(productId);
      const totalAvailable = batches.reduce((s, b) => s + (Number(b.quantityAvailable) || 0), 0);
      setFormValues((prev) => ({
        ...prev,
        items: prev.items.map((it) => (
          it.productId === productId && !(it.serials && it.serials.length)
            ? { ...it, saleBatches: batches, quantityAvailable: totalAvailable }
            : it
        )),
      }));
    } catch (err) {
      setToast({ open: true, message: err.message || t('sales.toast.unableLoadBatchPrices', 'Unable to load batch prices'), severity: 'error' });
    }
  };

  // Add a product from the top search: append a new line (FIFO-priced), or if it is already
  // in the cart (typed line), just bump its quantity (respecting stock).
  const handleAddProduct = (product) => {
    if (!product) return;
    const existingIndex = formValues.items.findIndex(
      (it) => it.productId === product.productId && !(it.serials && it.serials.length)
    );
    if (existingIndex !== -1) {
      const it = formValues.items[existingIndex];
      const max = it.quantityAvailable != null ? Number(it.quantityAvailable) : Infinity;
      updateItem(existingIndex, { quantity: Math.min((Number(it.quantity) || 0) + 1, max) });
      return;
    }
    setFormValues((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: product.productId,
          productName: product.productName || product.name,
          quantityAvailable: product?.currentStock ?? product?.quantityAvailable ?? null,
          quantity: 1,
          cost: Number(product?.averageCost) || 0,
          saleBatches: null, // loading — FIFO price appears once batches arrive
        },
      ],
    }));
    loadSaleBatches(product.productId);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Top bar: Back + inline customer fields (no card, one row) */}
      <Stack direction="row" alignItems="flex-start" spacing={1.5} flexWrap="wrap" sx={{ rowGap: 1.5 }}>
        <Button startIcon={<ArrowBackIcon />} variant="text" sx={{ color: '#475569', mt: 0.5 }} onClick={() => navigate(-1)}>
          {t('common.back', 'Back')}
        </Button>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Autocomplete
          freeSolo options={customerResults} loading={customerLoading}
          getOptionLabel={(o) => (typeof o === 'string' ? o : `${o.mobile} — ${o.name}`)}
          filterOptions={(x) => x}
          inputValue={formValues.customerMobile}
          onInputChange={(e, val, reason) => {
            if (reason === 'input') setFormValues((prev) => ({ ...prev, customerMobile: val.replace(/\D/g, '').slice(0, 10) }));
            else if (reason === 'clear') handleClearCustomer();
          }}
          onChange={(e, val, reason) => {
            if (!val || reason === 'clear') { handleClearCustomer(); return; }
            if (typeof val === 'object') handleSelectCustomer(val);
          }}
          sx={{ flex: '1 1 190px', minWidth: 170 }}
          renderInput={(params) => (
            <TextField {...params} label={t('sales.mobile', 'Mobile')} size="small" required
              onBlur={(e) => validateField('customerMobile', e.target.value.replace(/\D/g, ''))}
              error={Boolean(errors.customerMobile)} helperText={errors.customerMobile || ' '} sx={{ bgcolor: '#fff' }} />
          )}
        />
        <TextField
          name="customerName" label={t('sales.customerName', 'Customer name')} size="small" required
          value={formValues.customerName} onChange={handleInputChange}
          error={Boolean(errors.customerName)} helperText={errors.customerName || ' '}
          sx={{ flex: '1 1 200px', minWidth: 170, bgcolor: '#fff' }}
        />
        <TextField
          name="customerEmail" label={t('sales.emailOptional', 'Email (optional)')} size="small"
          value={formValues.customerEmail} onChange={handleInputChange}
          onBlur={(e) => validateField('customerEmail', e.target.value.trim())}
          error={Boolean(errors.customerEmail)} helperText={errors.customerEmail || ' '}
          sx={{ flex: '1 1 200px', minWidth: 170, bgcolor: '#fff' }}
        />
      </Stack>

      <Grid container spacing={3}>
        {/* Products */}
        <Grid item xs={12} lg={8}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagOutlinedIcon sx={{ color: 'var(--theme-primary)', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem', flexGrow: 1 }}>{t('sales.products', 'Products')}</Typography>
              <Chip size="small" label={`${formValues.items.length} ${formValues.items.length === 1 ? t('sales.item', 'item') : t('sales.items', 'items')}`} sx={{ fontWeight: 700, bgcolor: '#F1F5F9', color: '#475569' }} />
            </Stack>

            <Stack spacing={2}>
              <ScanBar onUnit={handleScannedUnit} onError={(m) => setToast({ open: true, message: m, severity: 'error' })} />

              <Autocomplete
                options={productOptions.filter((p) => !formValues.items.some((it) => it.productId === p.productId && !(it.serials && it.serials.length)))}
                loading={productLoading}
                value={null}
                blurOnSelect
                clearOnBlur
                ListboxProps={{ style: { maxHeight: 260 } }}
                popupIcon={<ArrowDropDownIcon />}
                onChange={(e, value) => handleAddProduct(value)}
                getOptionLabel={formatProductLabel}
                isOptionEqualToValue={(o, v) => o.productId === v?.productId}
                renderOption={(props, option) => {
                  const stock = Number(option.currentStock ?? option.quantityAvailable ?? 0);
                  return (
                    <li {...props}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.95rem' }}>{option.productName || option.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{option.productCode || option.barcode || option.sku || option.productSKU || ''}</Typography>
                        </Box>
                        <Chip size="small" label={`Stock: ${stock.toLocaleString('en-IN')}`}
                          sx={{ flexShrink: 0, fontWeight: 700, bgcolor: stock <= 0 ? '#FEF2F2' : 'color-mix(in srgb, var(--theme-primary) 12%, white)', color: stock <= 0 ? '#B91C1C' : 'var(--theme-primary)' }} />
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={t('sales.searchProductPlaceholder', 'Search product by name / code / barcode to add…')}
                    size="small" fullWidth
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: <AddCircleOutlineIcon sx={{ color: 'var(--theme-primary)', ml: 0.5, mr: 0.5 }} fontSize="small" />,
                      endAdornment: (<>{productLoading ? <CircularProgress color="inherit" size={16} /> : null}{params.InputProps.endAdornment}</>),
                    }}
                    sx={{ bgcolor: '#fff' }}
                  />
                )}
              />

              {formValues.items.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 7, color: '#94A3B8', border: '1px dashed #E2E8F0', borderRadius: 3 }}>
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 42, mb: 1, color: '#CBD5E1' }} />
                  <Typography sx={{ fontWeight: 700, color: '#64748B' }}>{t('sales.noProductsAdded', 'No products added')}</Typography>
                  <Typography variant="body2">{t('sales.noProductsHint', 'Search above or scan a QR tag to add items.')}</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table
                    size="small"
                    sx={{
                      '& th': { backgroundColor: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '1px solid #E2E8F0', py: 1 },
                      '& td': { borderBottom: '1px solid #F1F5F9', py: 1 },
                      '& tbody tr:hover': { backgroundColor: '#F8FAFC' },
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: 26 }}>#</TableCell>
                        <TableCell>{t('sales.product', 'Product')}</TableCell>
                        <TableCell align="center" sx={{ width: 140 }}>{t('sales.colQty', 'Qty')}</TableCell>
                        <TableCell align="right" sx={{ width: 150 }}>{t('sales.colMrp', 'MRP')}</TableCell>
                        <TableCell align="right" sx={{ width: 100 }}>{t('common.total', 'Total')}</TableCell>
                        <TableCell sx={{ width: 40 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {formValues.items.map((item, index) => {
                        const scanned = Boolean(item.serials && item.serials.length);
                        const d = lineDerived(item);
                        const loading = !scanned && item.saleBatches == null;
                        const exceeded = isQuantityExceeded(item);
                        return (
                          <TableRow key={`${item.productId}-${index}`} hover>
                            <TableCell sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>{index + 1}</TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={1.25} alignItems="center">
                                <ProductThumb
                                  productId={item.productId}
                                  hasImage={item.hasImage}
                                  size={30}
                                  fallback={
                                    <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <ShoppingBagOutlinedIcon sx={{ color: 'var(--theme-primary)', fontSize: 15 }} />
                                    </Box>
                                  }
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography sx={{ fontWeight: 600, fontSize: '0.86rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 230 }}>{item.productName}</Typography>
                                  <Typography variant="caption" sx={{ color: exceeded ? '#DC2626' : '#94A3B8' }}>
                                    {scanned ? `${item.batchNumber} · ${item.serials.length} ${t('sales.scanned', 'scanned')}` : (item.quantityAvailable != null ? `${t('sales.inStock', 'In stock')}: ${item.quantityAvailable}` : `${t('sales.stock', 'Stock')}: —`)}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              {scanned ? (
                                // Scanned line: quantity is tied to serials, so only the minus stepper (drops a serial).
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.25}>
                                  <IconButton
                                    size="small" sx={{ p: 0.25 }}
                                    disabled={(Number(item.quantity) || 0) <= 1}
                                    onClick={() => {
                                      const cur = Number(item.quantity) || 0;
                                      if (cur <= 1) return;
                                      const serials = item.serials.slice(0, -1);
                                      updateItem(index, { quantity: serials.length, serials });
                                    }}
                                  ><RemoveIcon fontSize="small" /></IconButton>
                                  <Typography sx={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: '0.85rem', color: exceeded ? '#DC2626' : '#0F172A' }}>{item.quantity}</Typography>
                                </Stack>
                              ) : (
                                // Typed line: enter the quantity directly (clamped to available stock).
                                <TextField
                                  type="number" size="small" variant="standard"
                                  value={item.quantity}
                                  onFocus={(e) => e.target.select()}
                                  onChange={(e) => {
                                    const raw = e.target.value;
                                    if (raw === '') { updateItem(index, { quantity: '' }); return; } // allow clearing to retype
                                    const max = item.quantityAvailable != null ? Number(item.quantityAvailable) : Infinity;
                                    updateItem(index, { quantity: Math.min(Number(raw), max) });
                                  }}
                                  onBlur={(e) => {
                                    const max = item.quantityAvailable != null ? Number(item.quantityAvailable) : Infinity;
                                    updateItem(index, { quantity: Math.min(Math.max(1, Number(e.target.value) || 1), max) });
                                  }}
                                  inputProps={{ min: 1, max: item.quantityAvailable ?? undefined, style: { textAlign: 'center', width: 70, fontWeight: 700, padding: '4px 6px', color: exceeded ? '#DC2626' : '#0F172A' } }}
                                  sx={{
                                    '& input[type=number]': { MozAppearance: 'textfield' },
                                    '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': { WebkitAppearance: 'none', margin: 0 },
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {loading ? (
                                <Typography variant="caption" color="text.secondary">{t('common.loading', 'Loading…')}</Typography>
                              ) : (
                                <Tooltip
                                  arrow
                                  placement="left"
                                  disableHoverListener={d.breakdown.length <= 1}
                                  title={
                                    <Box sx={{ py: 0.5, minWidth: 120 }}>
                                      {d.breakdown.map((s, i) => (
                                        <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 0.15 }}>
                                          <span>{s.qty} ×</span>
                                          <span>{getCurrencySymbol()}{Number(s.price).toLocaleString('en-IN')}</span>
                                        </Box>
                                      ))}
                                    </Box>
                                  }
                                >
                                  <Typography sx={{ fontWeight: 700, fontSize: '0.86rem', color: '#0F172A', display: 'inline-block', borderBottom: d.breakdown.length > 1 ? '1px dotted #94A3B8' : 'none', cursor: d.breakdown.length > 1 ? 'help' : 'default' }}>
                                    {getCurrencySymbol()}{Math.round(Number(d.avgPrice || 0)).toLocaleString('en-IN')}
                                  </Typography>
                                </Tooltip>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{getCurrencySymbol()}{Number(d.gross || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" color="error" onClick={() => handleRemoveItem(index)}><DeleteOutlineIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Stack>
          </Box>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: { lg: 'sticky' }, top: 20 }}>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ReceiptLongOutlinedIcon sx={{ color: 'var(--theme-primary)', fontSize: 18 }} />
              </Box>
              <Typography sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.05rem' }}>{t('sales.orderSummary', 'Order Summary')}</Typography>
            </Stack>

            <Stack spacing={2}>
              <Box
                onClick={() => { if (totalCostBasis > 0 && anyProductSelected) setProfitOpen(true); }}
                sx={{ p: 2.25, borderRadius: 0, bgcolor: 'color-mix(in srgb, var(--theme-primary) 10%, white)', border: '1px solid color-mix(in srgb, var(--theme-primary) 25%, white)', cursor: (totalCostBasis > 0 && anyProductSelected) ? 'pointer' : 'default', position: 'relative' }}
              >
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('sales.totalPayable', 'Total Payable')}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '2rem', lineHeight: 1.15, mt: 0.5, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{payable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                {totalDiscount > 0 && <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.25 }}>{t('sales.youSaved', 'You saved')} {getCurrencySymbol()}{totalDiscount.toLocaleString('en-IN')}</Typography>}
                {totalCostBasis > 0 && anyProductSelected && (
                  <Tooltip title={t('sales.viewProfitSummary', 'View profit summary')}>
                    <InsightsOutlinedIcon sx={{ position: 'absolute', top: 12, right: 12, fontSize: 18, color: '#94A3B8' }} />
                  </Tooltip>
                )}
              </Box>

              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('sales.discount', 'Discount')}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ToggleButtonGroup
                      size="small" exclusive value={discountMode}
                      onChange={(e, v) => { if (v) setDiscountMode(v); }}
                      disabled={!anyProductSelected}
                      sx={{ '& .MuiToggleButton-root': { px: 1, py: 0.1, minWidth: 28, fontWeight: 700, lineHeight: 1.6, color: '#64748B', '&.Mui-selected': { color: 'var(--theme-primary)', bgcolor: 'color-mix(in srgb, var(--theme-primary) 12%, white)' } } }}
                    >
                      <ToggleButton value="PERCENT">%</ToggleButton>
                      <ToggleButton value="AMOUNT">{getCurrencySymbol()}</ToggleButton>
                    </ToggleButtonGroup>
                    <TextField
                      type="text" inputMode="decimal" size="small" variant="standard"
                      value={discountMode === 'PERCENT' ? pctText : discountText}
                      disabled={!anyProductSelected}
                      onChange={(e) => (discountMode === 'PERCENT' ? handleDiscountPercent(e.target.value) : handleDiscountAmount(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      InputProps={discountMode === 'PERCENT'
                        ? { endAdornment: <Typography sx={{ color: '#DC2626', ml: 0.25, fontSize: '0.9rem' }}>%</Typography> }
                        : { startAdornment: <Typography sx={{ color: '#DC2626', mr: 0.5, fontSize: '0.9rem' }}>− {getCurrencySymbol()}</Typography> }}
                      inputProps={{ style: { textAlign: 'right', width: 70, fontWeight: 700, color: '#DC2626' } }}
                    />
                  </Stack>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('sales.gst', 'GST')} ({gstEnabled ? (Number(gstPercent) || 0) : 0}%)</Typography>
                  <Typography sx={{ fontWeight: 600 }}>{getCurrencySymbol()}{gstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                </Box>
                {Math.abs(roundOffAmount) > 0.0001 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('sales.roundOff', 'Round off')}</Typography>
                    <Typography sx={{ fontWeight: 600, color: roundOffAmount < 0 ? '#DC2626' : 'var(--theme-primary)' }}>
                      {roundOffAmount >= 0 ? '+ ' : '− '}{getCurrencySymbol()}{Math.abs(roundOffAmount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />

                {/* Credit / udhaari: previous dues + amount received now; the rest stays due. */}
                {previousDue > 0 && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ color: 'var(--theme-primary)', fontSize: '0.9rem', fontWeight: 600 }}>{t('sales.previousDue', 'Previous due')}</Typography>
                      <Typography sx={{ fontWeight: 700, color: 'var(--theme-primary)' }}>{getCurrencySymbol()}{previousDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                    </Box>
                    <Tooltip title={t('sales.clickReceiveFull', 'Click to receive the full amount (clear all)')}>
                      <Box
                        onClick={() => setReceivedText(String(grandOwed))}
                        sx={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer', borderRadius: 1, px: 0.5, '&:hover': { bgcolor: '#F1F5F9' } }}
                      >
                        <Typography sx={{ color: '#0F172A', fontSize: '0.95rem', fontWeight: 800 }}>{t('sales.totalPayableInclDue', 'Total payable (incl. due)')}</Typography>
                        <Typography sx={{ fontWeight: 800, color: '#0F172A', textDecoration: 'underline dotted' }}>{getCurrencySymbol()}{grandOwed.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                      </Box>
                    </Tooltip>
                  </>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Typography sx={{ color: '#64748B', fontSize: '0.9rem' }}>{t('sales.amountReceivedLower', 'Amount received')}</Typography>
                    <Button size="small" onClick={() => setReceivedText(String(grandOwed))}
                      disabled={!anyProductSelected} sx={{ minWidth: 0, px: 0.75, py: 0, fontSize: '0.7rem', fontWeight: 700, textTransform: 'none', color: 'var(--theme-primary)' }}>
                      {t('sales.payFull', 'Pay full')}
                    </Button>
                  </Stack>
                  <TextField
                    type="text" inputMode="decimal" size="small" variant="standard"
                    value={receivedText}
                    disabled={!anyProductSelected}
                    onChange={(e) => {
                      const clean = sanitizeNum(e.target.value);
                      // Can't receive more than the full amount owed — auto-correct to the max.
                      setReceivedText((Number(clean) || 0) > grandOwed ? String(grandOwed) : clean);
                    }}
                    onFocus={(e) => e.target.select()}
                    InputProps={{ startAdornment: <Typography sx={{ color: 'var(--theme-primary)', mr: 0.5, fontSize: '0.9rem' }}>{getCurrencySymbol()}</Typography> }}
                    inputProps={{ style: { textAlign: 'right', width: 90, fontWeight: 700, color: 'var(--theme-primary)' } }}
                  />
                </Box>
                {remainingDue > 0.0001 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>{t('sales.remainingDue', 'Remaining due')}</Typography>
                    <Chip size="small" label={`${getCurrencySymbol()}${remainingDue.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ${amountReceived <= 0 ? t('sales.udhaar', 'UDHAAR') : t('sales.dueTag', 'DUE')}`}
                      sx={{ height: 22, fontWeight: 800, fontSize: '0.72rem', bgcolor: '#FEF2F2', color: '#B91C1C' }} />
                  </Box>
                )}
              </Stack>

              <Divider />

              <TextField label={t('sales.paymentMode', 'Payment Mode')} name="paymentMode" select value={formValues.paymentMode} onChange={handleInputChange} fullWidth size="small" SelectProps={{ native: true }} disabled={!anyProductSelected}>
                <option value="CASH">{t('sales.cash', 'Cash')}</option>
                <option value="UPI">{t('sales.upi', 'UPI')}</option>
                <option value="CREDIT_CARD">{t('sales.creditCard', 'Credit Card')}</option>
                <option value="DEBIT_CARD">{t('sales.debitCard', 'Debit Card')}</option>
                <option value="NET_BANKING">{t('sales.netBanking', 'Net Banking')}</option>
              </TextField>
              {formValues.paymentMode !== 'CASH' ? (
                <TextField label={t('sales.paymentProvider', 'Payment Provider')} name="paymentProvider" value={formValues.paymentProvider} onChange={handleInputChange} fullWidth size="small" disabled={!anyProductSelected} />
              ) : null}

              {can('sales', 'write') && (
                <Button variant="contained" fullWidth startIcon={<CheckCircleOutlineIcon />} onClick={handleCompleteClick} disabled={createSaleMutation.isLoading || hasValidationIssues} sx={{ py: 1.2, fontWeight: 700, fontSize: '0.95rem', boxShadow: '0 8px 20px -6px rgba(37,99,235,0.5)' }}>
                  {createSaleMutation.isLoading ? t('sales.saving', 'Saving…') : t('sales.completeSale', 'Complete Sale')}
                </Button>
              )}
              <Button variant="text" fullWidth onClick={() => navigate(-1)} sx={{ color: '#64748B' }}>{t('common.cancel', 'Cancel')}</Button>
            </Stack>
          </Box>
        </Grid>
      </Grid>

      {/* Profit summary side panel — after-discount profit per line, for pricing/negotiation. */}
      <Drawer anchor="right" open={profitOpen} onClose={() => setProfitOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 620 }, p: 2.5 } }}>
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 0.5 }}>
          <InsightsOutlinedIcon sx={{ color: 'var(--theme-primary)' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', flexGrow: 1 }}>{t('sales.profitSummary', 'Profit Summary')}</Typography>
          <IconButton size="small" onClick={() => setProfitOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </Stack>
        <Typography variant="caption" sx={{ color: '#94A3B8' }}>{t('sales.afterDiscount', 'After discount')}</Typography>

        {/* Per-item breakdown — MRP → discount → selling → cost → profit */}
        <TableContainer sx={{ mt: 1.5, border: '1px solid #E2E8F0', borderRadius: 0 }}>
          <Table size="small" sx={{ '& th': { bgcolor: '#F8FAFC', color: '#64748B', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.03em', py: 0.75 }, '& td': { py: 0.75, fontSize: '0.8rem' } }}>
            <TableHead>
              <TableRow>
                <TableCell>{t('sales.product', 'Product')}</TableCell>
                <TableCell align="right">{t('sales.colMrp', 'MRP')}</TableCell>
                <TableCell align="right">{t('sales.discount', 'Discount')}</TableCell>
                <TableCell align="right">{t('sales.colSelling', 'Selling')}</TableCell>
                <TableCell align="right">{t('sales.colCost', 'Cost')}</TableCell>
                <TableCell align="right">{t('sales.colProfit', 'Profit')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {formValues.items.filter((it) => it.productId).map((item, idx) => {
                const d = lineDerived(item);
                const share = subtotal > 0 ? (d.gross / subtotal) * totalDiscount : 0;
                const sell = d.gross - share; // selling after discount
                const profit = sell - d.cost;
                const pct = d.cost > 0 ? (profit / d.cost) * 100 : null;
                return (
                  <TableRow key={`${item.productId}-${idx}`}>
                    <TableCell sx={{ fontWeight: 600, color: '#0F172A' }}>
                      {item.productName} <span style={{ color: '#94A3B8', fontWeight: 500 }}>× {item.quantity}</span>
                    </TableCell>
                    <TableCell align="right">{getCurrencySymbol()}{d.gross.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ color: '#DC2626' }}>− {getCurrencySymbol()}{share.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0F172A' }}>{getCurrencySymbol()}{sell.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748B' }}>{getCurrencySymbol()}{d.cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: profit >= 0 ? 'var(--theme-primary)' : '#B91C1C', whiteSpace: 'nowrap' }}>
                      {profit >= 0 ? '+' : '−'}{getCurrencySymbol()}{Math.abs(profit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      {pct != null ? <span style={{ fontWeight: 600, fontSize: '0.68rem', opacity: 0.85 }}> ({pct.toFixed(0)}%)</span> : ''}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Bill-style totals */}
        {(() => {
          const customerPays = subtotal - totalDiscount; // what the customer pays after discount
          const netProfit = customerPays - totalCostBasis;
          const netPct = totalCostBasis > 0 ? (netProfit / totalCostBasis) * 100 : null;
          const row = (label, value, opts = {}) => (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.4 }}>
              <Typography sx={{ color: opts.strong ? '#0F172A' : '#64748B', fontSize: opts.strong ? '0.95rem' : '0.88rem', fontWeight: opts.strong ? 800 : 600 }}>{label}</Typography>
              <Typography sx={{ fontWeight: opts.strong ? 800 : 700, color: opts.color || '#0F172A', fontSize: opts.strong ? '1rem' : '0.9rem' }}>{value}</Typography>
            </Box>
          );
          return (
            <Box sx={{ mt: 2, borderRadius: 0, p: 1.75, bgcolor: 'color-mix(in srgb, var(--theme-primary) 6%, white)' }}>
              {row(t('sales.subtotalMrp', 'Subtotal (MRP)'), `${getCurrencySymbol()}${subtotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`)}
              {row(t('sales.discount', 'Discount'), `− ${getCurrencySymbol()}${totalDiscount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { color: '#DC2626' })}
              <Divider sx={{ my: 0.5 }} />
              {row(t('sales.customerPays', 'Customer Pays'), `${getCurrencySymbol()}${customerPays.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`, { strong: true, color: 'var(--theme-primary)' })}
              <Divider sx={{ my: 0.5 }} />
              {row(t('sales.netProfit', 'Net Profit'), `${netProfit >= 0 ? '+' : '−'}${getCurrencySymbol()}${Math.abs(netProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}${netPct != null ? ` (${netProfit >= 0 ? '+' : ''}${netPct.toFixed(1)}%)` : ''}`, { strong: true, color: netProfit >= 0 ? 'var(--theme-primary)' : '#B91C1C' })}
            </Box>
          );
        })()}
      </Drawer>

      <Dialog open={reconcile.open} onClose={() => setReconcile({ open: false, batches: [] })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>{t('sales.reconcileTitle', 'Reconcile physical stock?')}</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('sales.reconcileAlert', 'These batches have 0 / low system stock, but the scanned QR units are still physically available (a direct FIFO sale already deducted the stock). Reconcile the physical stock to continue this sale.')}
          </Alert>
          <Stack spacing={1}>
            {reconcile.batches.map((b) => (
              <Box key={b.batchNumber} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 1.25 }}>
                <Typography sx={{ fontWeight: 700, color: '#0F172A' }}>
                  {b.batchNumber}{b.productName ? ` · ${b.productName}` : ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('sales.systemStock', 'System stock')} {Number(b.available)} · {Number(b.requested)} {t('sales.qrScanned', 'QR scanned')} → {t('sales.reconcile', 'reconcile')} <b style={{ color: 'var(--theme-primary)' }}>+{Number(b.deficit)}</b>
                </Typography>
              </Box>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setReconcile({ open: false, batches: [] })}>{t('sales.noCancel', 'No, cancel')}</Button>
          <Button variant="contained" onClick={handleConfirmReconcile} disabled={createSaleMutation.isLoading}>
            {createSaleMutation.isLoading ? t('sales.processing', 'Processing…') : t('sales.yesReconcile', 'Yes, reconcile & sell')}
          </Button>
        </DialogActions>
      </Dialog>

      <PaymentConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleSave}
        loading={createSaleMutation.isLoading}
        title={t('sales.confirmSale', 'Confirm Sale')}
        confirmText={t('sales.confirmComplete', 'Confirm & Complete')}
        rows={[
          // Payment mode only matters when something is actually being paid.
          ...(amountReceived > 0 ? [{ label: t('sales.paymentMode', 'Payment Mode'), value: (formValues.paymentMode || '-').replace(/_/g, ' ') }] : []),
          { label: t('sales.currentBill', 'Current Bill'), value: `${getCurrencySymbol()}${payable.toLocaleString('en-IN')}` },
          // Previous dues + a combined Total row only matter when the customer already owes.
          ...(previousDue > 0 ? [
            { label: t('sales.previousDues', 'Previous Dues'), value: `${getCurrencySymbol()}${previousDue.toLocaleString('en-IN')}` },
            { label: t('common.total', 'Total'), value: `${getCurrencySymbol()}${grandOwed.toLocaleString('en-IN')}`, strong: true },
          ] : []),
          { label: t('sales.amountReceived', 'Amount Received'), value: `${getCurrencySymbol()}${amountReceived.toLocaleString('en-IN')}`, strong: true },
        ]}
        dueAmount={remainingDue}
        dueText={`${getCurrencySymbol()}${remainingDue.toLocaleString('en-IN')}`}
      />

      <Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1300 }}>
        {toast.open ? (
          <Paper sx={{ px: 3, py: 1.5, borderRadius: 2, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)' }}>
            <Typography color={toast.severity === 'error' ? 'error.main' : 'success.main'}>{toast.message}</Typography>
          </Paper>
        ) : null}
      </Box>
    </Box>
  );
};

export default CreateSale;
