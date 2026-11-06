import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ConfigProvider, Card, Collapse, Select, InputNumber, Button, DatePicker,
  Drawer, Checkbox, Input, Tag, Avatar, Empty, notification, Breadcrumb, Tooltip, Modal,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, SaveOutlined, UserAddOutlined, TeamOutlined,
  AppstoreOutlined, ShoppingOutlined, DollarOutlined, SearchOutlined,
} from '@ant-design/icons';
import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

import { productionService } from '../../services/productionService';
import { employeeService } from '../../services/employee.service';
import { productService } from '../../services/productService';
import ProductLabel from '../../components/common/ProductLabel';
import { getCurrencySymbol } from '../../utils/currency';
import { useT } from '../../contexts/LanguageContext';

// One product line inside an employee card. amount is derived (qty × rate).
interface ProdRow { key: number; productId?: string; pieceCodeId?: string; quantity?: number; rate: number; }
interface EmpBlock { key: number; employeeId: string; employeeName: string; employeeCode?: string; products: ProdRow[]; }

let seq = 1;
const nextKey = () => seq++;
const emptyRow = (): ProdRow => ({ key: nextKey(), rate: 0 });
const isValidRow = (r: ProdRow) => !!r.productId && !!r.pieceCodeId && Number(r.quantity) > 0;

// Pick the piece code to auto-select: the only one, else the latest (by createdAt / id).
const pickPieceCode = (codes: any[]): any => {
  if (!codes?.length) return undefined;
  if (codes.length === 1) return codes[0];
  return [...codes].sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || '')) ||
    String(b.id).localeCompare(String(a.id)))[0];
};

const fmtMoney = (v: number) =>
  `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Draft persistence: keep the in-progress bulk entry across reload / back, clear on submit.
const DRAFT_KEY = 'skr_bulk_production_draft';
const loadDraft = () => { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } };

// Avatar initials: first letter of first + last name (e.g. "Rustam Ali" → "RA").
const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '';
  return ((parts[0][0] || '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
};

const BulkProductionEntry: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useT();

  // Restore any saved draft once (and bump the key counter past restored keys).
  const draft0 = useMemo(() => {
    const d = loadDraft();
    if (d?.employees?.length) {
      const maxK = Math.max(0, ...d.employees.flatMap((e: any) => [e.key, ...(e.products || []).map((p: any) => p.key)]));
      if (seq <= maxK) seq = maxK + 1;
    }
    return d;
  }, []);
  const [productionDate, setProductionDate] = useState(draft0?.date ? dayjs(draft0.date) : dayjs());
  const [employees, setEmployees] = useState<EmpBlock[]>(draft0?.employees || []);
  const [activeKey, setActiveKey] = useState<string | undefined>(draft0?.employees?.[0] ? String(draft0.employees[0].key) : undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [triedSave, setTriedSave] = useState(false); // show red "data missing" only after a save attempt
  const [confirmOpen, setConfirmOpen] = useState(false); // summary confirmation before saving
  // Piece codes cached per product (shared across employees) + per-product loading flag.
  const [pcByProduct, setPcByProduct] = useState<Record<string, any[]>>({});

  // Auto-save the draft on any change; remove it when the form is emptied.
  useEffect(() => {
    try {
      if (employees.length) localStorage.setItem(DRAFT_KEY, JSON.stringify({ date: productionDate.format('YYYY-MM-DD'), employees }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch { /* storage unavailable */ }
  }, [employees, productionDate]);

  // On restore, fetch piece codes for already-selected products so the Code labels render.
  useEffect(() => {
    const ids = [...new Set((draft0?.employees || []).flatMap((e: any) => (e.products || []).map((p: any) => p.productId)).filter(Boolean))] as string[];
    ids.forEach(async (id) => {
      try { const codes = (await productService.getActivePieceCodes(id))?.data || []; setPcByProduct((prev) => ({ ...prev, [id]: codes })); } catch { /* ignore */ }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: employeesData } = useQuery({ queryKey: ['employees'], queryFn: employeeService.getEmployees });
  const { data: productsData } = useQuery({ queryKey: ['products'], queryFn: productService.getProducts });
  const allEmployees = (employeesData?.data || []).filter((e: any) => e.active);
  // Only manufacturable products can be produced.
  const prodOptions = useMemo(
    () => (productsData?.data || []).filter((p: any) => p.active && p.source !== 'PURCHASED'),
    [productsData]
  );

  // Employees not yet added (for the Add Employee modal).
  const addedIds = new Set(employees.map((e) => e.employeeId));
  const selectableEmployees = allEmployees.filter((e: any) => !addedIds.has(e.id));
  const filteredSelectable = selectableEmployees.filter((e: any) => {
    const q = empSearch.trim().toLowerCase();
    return !q || e.fullName?.toLowerCase().includes(q) || String(e.employeeCode || '').toLowerCase().includes(q);
  });

  // ── Mutators on the employees tree ──────────────────────
  const updateEmp = (empKey: number, fn: (e: EmpBlock) => EmpBlock) =>
    setEmployees((prev) => prev.map((e) => (e.key === empKey ? fn(e) : e)));

  const updateRow = (empKey: number, rowKey: number, patch: Partial<ProdRow>) =>
    updateEmp(empKey, (e) => ({ ...e, products: e.products.map((r) => (r.key === rowKey ? { ...r, ...patch } : r)) }));

  const openAddDrawer = () => { setSelectedIds([]); setEmpSearch(''); setAddOpen(true); };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  // Add all checked employees as cards at once; open the first new one.
  const addSelectedEmployees = () => {
    if (selectedIds.length === 0) { notification.warning({ message: t('production.bulk.valSelectEmp', 'Select an employee.'), placement: 'topRight' }); return; }
    const blocks: EmpBlock[] = selectedIds.map((id) => {
      const emp = allEmployees.find((e: any) => e.id === id);
      return { key: nextKey(), employeeId: emp.id, employeeName: emp.fullName, employeeCode: emp.employeeCode, products: [emptyRow()] };
    });
    setEmployees((prev) => [...prev, ...blocks]);
    setActiveKey(String(blocks[0].key));
    setSelectedIds([]);
    setAddOpen(false);
  };

  // Load piece codes once per product, then auto-select + set rate on the row.
  const onProductChange = async (empKey: number, rowKey: number, productId: string) => {
    updateRow(empKey, rowKey, { productId, pieceCodeId: undefined, rate: 0 });
    let codes = pcByProduct[productId];
    if (!codes) {
      try { codes = (await productService.getActivePieceCodes(productId))?.data || []; }
      catch { codes = []; }
      setPcByProduct((prev) => ({ ...prev, [productId]: codes! }));
    }
    const pc = pickPieceCode(codes);
    if (pc) updateRow(empKey, rowKey, { productId, pieceCodeId: pc.id, rate: Number(pc.rate) || 0 });
  };

  const onPieceCodeChange = (empKey: number, rowKey: number, pieceCodeId: string, productId?: string) => {
    const pc = (pcByProduct[productId || ''] || []).find((c) => c.id === pieceCodeId);
    updateRow(empKey, rowKey, { pieceCodeId, rate: Number(pc?.rate) || 0 });
  };

  // Products still selectable for a row = manufacturable minus those used by sibling rows.
  const rowProductOptions = (emp: EmpBlock, row: ProdRow) => {
    const used = new Set(emp.products.filter((r) => r.key !== row.key && r.productId).map((r) => r.productId));
    return prodOptions.filter((p: any) => p.id === row.productId || !used.has(p.id));
  };

  // ── Totals ──────────────────────────────────────────────
  const empTotals = (e: EmpBlock) => {
    const qty = e.products.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
    const amt = e.products.reduce((s, r) => s + (Number(r.quantity) || 0) * (Number(r.rate) || 0), 0);
    return { qty, amt };
  };
  const totals = useMemo(() => {
    let products = 0, qty = 0, amt = 0;
    employees.forEach((e) => e.products.forEach((r) => {
      if (r.productId) products += 1;
      qty += Number(r.quantity) || 0;
      amt += (Number(r.quantity) || 0) * (Number(r.rate) || 0);
    }));
    return { employees: employees.length, products, qty, amt };
  }, [employees]);

  // ── Save all (loop one POST per employee; each stays a separate entry) ──
  // Validate, then open the confirmation popup (actual save happens on OK).
  // Front-end validation only highlights the incomplete card red — no toast (toasts are for API errors).
  const handleSaveClick = () => {
    setTriedSave(true);
    if (employees.length === 0) return;
    if (employees.some((e) => !e.products.some(isValidRow))) return;
    setConfirmOpen(true);
  };

  const doSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    const date = productionDate.format('YYYY-MM-DD');
    const failed: EmpBlock[] = [];
    let ok = 0;
    for (const emp of employees) {
      const items = emp.products.filter(isValidRow).map((r) => ({
        productId: r.productId!, pieceCodeId: r.pieceCodeId!,
        quantity: Number(r.quantity), rate: Number(r.rate), amount: Number(r.quantity) * Number(r.rate),
      }));
      try { await productionService.createProduction({ employeeId: emp.employeeId, productionDate: date, items }); ok += 1; }
      catch { failed.push(emp); }
    }
    setSaving(false);
    ['productionRecent', 'productionStats', 'employeeDetails', 'employeeCalendar', 'productionHistory', 'production']
      .forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

    if (failed.length === 0) {
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } // submitted → clear draft
      notification.success({ message: t('production.success', 'Success'), description: t('production.bulk.savedAll', 'All production entries saved.'), placement: 'topRight' });
      navigate('/production');
    } else {
      setEmployees(failed); // keep only failed ones for retry
      setActiveKey(failed[0] ? String(failed[0].key) : undefined);
      notification.warning({
        message: t('production.bulk.savedPartial', 'Some entries failed'),
        description: `${ok} ${t('production.bulk.saved', 'saved')}, ${failed.length} ${t('production.bulk.failedWord', 'failed')}: ${failed.map((e) => e.employeeName).join(', ')}`,
        placement: 'topRight',
      });
    }
  };

  const cardStyle = { borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15,23,42,0.05)' };

  // One product row (manual grid; rate & amount are read-only/derived).
  const renderRow = (emp: EmpBlock, row: ProdRow, idx: number) => {
    const qty = Number(row.quantity) || 0;
    const codes = pcByProduct[row.productId || ''] || [];
    return (
      <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '28px 1fr 150px 90px 90px 110px 40px', gap: 8, alignItems: 'center', padding: '6px 0', borderTop: idx === 0 ? 'none' : '1px solid #F1F5F9' }}>
        <span style={{ color: '#94A3B8', fontWeight: 700, fontSize: '0.8rem' }}>{idx + 1}</span>
        <Select
          placeholder={t('production.colProduct', 'Product')}
          value={row.productId}
          onChange={(v) => onProductChange(emp.key, row.key, v)}
          showSearch optionFilterProp="label" size="middle" variant="borderless" className="bpe-field"
          style={{ width: '100%' }}
        >
          {rowProductOptions(emp, row).map((p: any) => (
            <Select.Option key={p.id} value={p.id} label={p.name}>
              <ProductLabel productId={p.id} iconName={p.iconName} name={p.name} hasImage={p.hasImage} size={18} />
            </Select.Option>
          ))}
        </Select>
        <Select
          placeholder={t('production.code', 'Code')}
          value={row.pieceCodeId}
          onChange={(v) => onPieceCodeChange(emp.key, row.key, v, row.productId)}
          disabled={!row.productId} showSearch optionFilterProp="label" size="middle" variant="borderless" className="bpe-field"
          style={{ width: '100%' }}
          notFoundContent={t('production.noCodes', 'No codes')}
        >
          {codes.map((pc: any) => (
            <Select.Option key={pc.id} value={pc.id} label={pc.code}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{pc.code}</span>
                <span style={{ color: 'var(--theme-primary)', fontWeight: 700 }}>{fmtMoney(pc.rate)}</span>
              </div>
            </Select.Option>
          ))}
        </Select>
        <InputNumber
          min={1} controls={false} placeholder={t('production.qty', 'Qty')} value={row.quantity}
          onChange={(v) => updateRow(emp.key, row.key, { quantity: v as number })}
          variant="borderless" className="bpe-field" style={{ width: '100%' }}
        />
        <span style={{ textAlign: 'right', color: '#64748B', fontWeight: 600 }}>{fmtMoney(row.rate)}</span>
        <span style={{ textAlign: 'right', color: '#0F172A', fontWeight: 800 }}>{fmtMoney(qty * row.rate)}</span>
        <Tooltip title={t('common.delete', 'Delete')}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />}
            disabled={emp.products.length <= 1}
            onClick={() => updateEmp(emp.key, (e) => ({ ...e, products: e.products.filter((r) => r.key !== row.key) }))}
          />
        </Tooltip>
      </div>
    );
  };

  return (
    <ConfigProvider theme={{ token: { borderRadius: 8, fontFamily: '"Inter","Helvetica","Arial",sans-serif' } }}>
      <Box>
        {/* Row fields: bottom-border only, even when focused/active */}
        <style>{`
          .bpe-field.ant-select .ant-select-selector { border: none !important; box-shadow: none !important; border-radius: 0 !important; background: transparent !important; }
          .bpe-field.ant-select { border-bottom: 1px solid #CBD5E1 !important; }
          .bpe-field.ant-select.ant-select-focused { border-bottom-color: var(--theme-primary) !important; }
          .bpe-field.ant-input-number { border: none !important; border-bottom: 1px solid #CBD5E1 !important; box-shadow: none !important; border-radius: 0 !important; background: transparent !important; }
          .bpe-field.ant-input-number-focused { border-bottom-color: var(--theme-primary) !important; }
        `}</style>
        {/* Header */}
        <Breadcrumb
          style={{ marginBottom: 8 }}
          items={[{ title: t('production.pageTitle', 'Production Management') }, { title: t('production.bulk.title', 'Bulk Production Entry') }]}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppstoreOutlined style={{ fontSize: 26, color: 'var(--theme-primary)' }} />
            <div>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>{t('production.bulk.title', 'Bulk Production Entry')}</Typography>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t('production.productionDate', 'Production Date')}</div>
              <DatePicker value={productionDate} onChange={(d) => d && setProductionDate(d)} format="DD-MMM-YYYY" allowClear={false} style={{ width: 200 }} />
            </div>
            <Button type="primary" icon={<UserAddOutlined />} size="large" onClick={openAddDrawer} style={{ fontWeight: 600 }}>
              {t('production.bulk.addEmployee', 'Add Employee')}
            </Button>
          </div>
        </div>

        {/* Two columns: left = employee cards (grow), right = fixed summary + actions */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: 'flex-start' }}>
         <Box sx={{ width: { xs: '100%', lg: '70%' }, minWidth: 0, maxHeight: { lg: 'calc(100vh - 200px)' }, overflowY: { lg: 'auto' }, pr: { lg: 0.5 } }}>
        {employees.length === 0 ? (
          <Card style={cardStyle} bodyStyle={{ padding: 48, minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Empty
              image={<TeamOutlined style={{ fontSize: 52, color: '#CBD5E1' }} />}
              description={
                <div>
                  <div style={{ fontWeight: 700, color: '#334155', fontSize: '1rem' }}>{t('production.bulk.noEmployee', 'No Employee Added Yet!')}</div>
                  <div style={{ color: '#94A3B8', marginTop: 4 }}>{t('production.bulk.noEmployeeHint', 'Click "Add Employee" to start adding production data.')}</div>
                </div>
              }
            />
          </Card>
        ) : (
          <Collapse accordion bordered={false} activeKey={activeKey} onChange={(k) => setActiveKey(Array.isArray(k) ? k[0] : k)} style={{ background: 'transparent', display: 'flex', flexDirection: 'column', gap: 10 }} items={employees.map((emp) => {
            const tot = empTotals(emp);
            const usedCount = emp.products.filter((r) => r.productId).length;
            const canAddMore = usedCount < prodOptions.length;
            const incomplete = triedSave && !emp.products.some(isValidRow); // red only after a save attempt
            return {
              key: String(emp.key),
              style: { background: '#fff', borderRadius: 12, border: incomplete ? '1px solid #F87171' : 'none', boxShadow: incomplete ? '0 0 0 2px rgba(248,113,113,0.25)' : '0 1px 3px rgba(15,23,42,0.08)', overflow: 'hidden' },
              label: (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar style={{ background: 'var(--theme-primary)' }}>{initials(emp.employeeName)}</Avatar>
                    <div>
                      <span style={{ fontWeight: 800, color: '#0F172A' }}>{emp.employeeName}</span>
                      <Tag style={{ marginLeft: 8, borderRadius: 6 }}>{usedCount} {t('production.bulk.productsWord', 'Products')}</Tag>
                      {incomplete && <Tag color="error" style={{ marginLeft: 4, borderRadius: 6 }}>{t('production.bulk.dataMissing', 'Data missing')}</Tag>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>{t('common.total', 'Total')}: {tot.qty} {t('production.pcs', 'Pcs')} · <span style={{ color: 'var(--theme-primary)', fontWeight: 800 }}>{fmtMoney(tot.amt)}</span></span>
                    <Tooltip title={t('common.delete', 'Delete')}>
                      <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); setEmployees((prev) => prev.filter((x) => x.key !== emp.key)); }} />
                    </Tooltip>
                  </div>
                </div>
              ),
              children: (
                <div>
                  {/* column header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 150px 90px 90px 110px 40px', gap: 8, padding: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                    <span>#</span><span>{t('production.colProduct', 'Product')}</span><span>{t('production.code', 'Code')}</span>
                    <span>{t('production.colQuantity', 'Quantity')}</span><span style={{ textAlign: 'right' }}>{t('production.rate', 'Rate')}</span>
                    <span style={{ textAlign: 'right' }}>{t('common.amount', 'Amount')}</span><span />
                  </div>
                  {emp.products.map((row, idx) => renderRow(emp, row, idx))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTop: '1px solid #E2E8F0', paddingTop: 10 }}>
                    <Button type="dashed" icon={<PlusOutlined />} disabled={!canAddMore}
                      onClick={() => updateEmp(emp.key, (e) => ({ ...e, products: [...e.products, emptyRow()] }))}>
                      {canAddMore ? t('production.bulk.addProduct', 'Add Product') : t('production.bulk.allAdded', 'All products added')}
                    </Button>
                    <span style={{ fontWeight: 700, color: '#0F172A' }}>
                      {t('production.bulk.employeeTotal', 'Employee Total')}: <span style={{ color: 'var(--theme-primary)' }}>{tot.qty} {t('production.pcs', 'Pcs')} · {fmtMoney(tot.amt)}</span>
                    </span>
                  </div>
                </div>
              ),
            };
          })} />
        )}
         </Box>

         {/* Right: fixed summary (2×2 stats) + actions */}
         <Box sx={{ width: { xs: '100%', lg: '30%' }, position: { lg: 'sticky' }, top: 16 }}>
           <Card style={cardStyle} bodyStyle={{ padding: 16 }}>
             <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>{t('production.bulk.summary', 'Summary')}</div>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
               <Stat icon={<TeamOutlined />} label={t('production.bulk.totalEmployees', 'Total Employees')} value={totals.employees} />
               <Stat icon={<ShoppingOutlined />} label={t('production.bulk.totalProducts', 'Total Products')} value={totals.products} />
               <Stat icon={<AppstoreOutlined />} label={t('production.totalQuantity', 'Total Quantity')} value={`${totals.qty} ${t('production.pcs', 'Pcs')}`} />
               <Stat icon={<DollarOutlined />} label={t('production.totalAmount', 'Total Amount')} value={fmtMoney(totals.amt)} highlight />
             </div>
             <Button type="primary" block size="large" icon={<SaveOutlined />} loading={saving} disabled={employees.length === 0} onClick={handleSaveClick} style={{ marginTop: 14, fontWeight: 700 }}>
               {t('production.bulk.saveAll', 'Save All Production Entries')}
             </Button>
             <Button block size="large" onClick={() => navigate('/production')} style={{ marginTop: 8 }}>
               {t('common.cancel', 'Cancel')}
             </Button>
           </Card>
         </Box>
        </Box>

        {/* Add Employee drawer — search + multi-select checkboxes */}
        <Drawer
          open={addOpen} onClose={() => setAddOpen(false)} placement="right" width={380}
          title={t('production.bulk.addEmployee', 'Add Employee')}
          zIndex={1300}
          styles={{ body: { padding: 16 } }}
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <Button onClick={() => setAddOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
              <Button type="primary" icon={<PlusOutlined />} disabled={selectedIds.length === 0} onClick={addSelectedEmployees}>
                {t('production.bulk.addSelected', 'Add Selected')} ({selectedIds.length})
              </Button>
            </div>
          }
        >
          <Input
            allowClear prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
            placeholder={t('production.bulk.searchEmployee', 'Search employee')}
            value={empSearch} onChange={(e) => setEmpSearch(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          {filteredSelectable.length === 0 ? (
            <Empty description={t('production.bulk.allEmployeesAdded', 'All employees added')} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredSelectable.map((e: any) => (
                <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', borderBottom: '1px solid #F1F5F9', cursor: 'pointer' }}>
                  <Checkbox checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} />
                  <Avatar size={28} style={{ background: 'var(--theme-primary)' }}>{initials(e.fullName)}</Avatar>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{e.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{e.employeeCode}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </Drawer>

        {/* Confirmation popup with summary before saving */}
        <Modal
          open={confirmOpen} onCancel={() => setConfirmOpen(false)} onOk={doSave} confirmLoading={saving}
          title={t('production.bulk.confirmTitle', 'Confirm Production Entries')}
          okText={t('production.bulk.confirmSave', 'Confirm & Save')} cancelText={t('common.cancel', 'Cancel')}
          okButtonProps={{ icon: <SaveOutlined /> }} zIndex={1300}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '8px 0 14px' }}>
            <Stat icon={<TeamOutlined />} label={t('production.bulk.totalEmployees', 'Total Employees')} value={totals.employees} />
            <Stat icon={<ShoppingOutlined />} label={t('production.bulk.totalProducts', 'Total Products')} value={totals.products} />
            <Stat icon={<AppstoreOutlined />} label={t('production.totalQuantity', 'Total Quantity')} value={`${totals.qty} ${t('production.pcs', 'Pcs')}`} />
            <Stat icon={<DollarOutlined />} label={t('production.totalAmount', 'Total Amount')} value={fmtMoney(totals.amt)} highlight />
          </div>
          <div style={{ maxHeight: 220, overflowY: 'auto' }}>
            {employees.map((emp) => {
              const tt = empTotals(emp);
              return (
                <div key={emp.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar size={24} style={{ background: 'var(--theme-primary)' }}>{initials(emp.employeeName)}</Avatar>
                    <span style={{ fontWeight: 600, color: '#0F172A' }}>{emp.employeeName}</span>
                  </div>
                  <span style={{ color: '#475569' }}>{tt.qty} {t('production.pcs', 'Pcs')} · <b style={{ color: 'var(--theme-primary)' }}>{fmtMoney(tt.amt)}</b></span>
                </div>
              );
            })}
          </div>
        </Modal>
      </Box>
    </ConfigProvider>
  );
};

// Stat tile for the right summary panel (2×2 grid).
const Stat: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; highlight?: boolean }> = ({ icon, label, value, highlight }) => (
  <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', background: highlight ? 'color-mix(in srgb, var(--theme-primary) 10%, white)' : '#fff' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.72rem', fontWeight: 600 }}>
      <span style={{ color: 'var(--theme-primary)', fontSize: 15 }}>{icon}</span>{label}
    </div>
    <div style={{ fontWeight: 800, color: highlight ? 'var(--theme-primary)' : '#0F172A', fontSize: '1.05rem', marginTop: 4 }}>{value}</div>
  </div>
);

export default BulkProductionEntry;
