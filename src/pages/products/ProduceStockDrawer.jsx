import React, { useMemo, useState } from 'react';
import { Drawer, Input, Checkbox, Avatar, Button, InputNumber, DatePicker, Empty, Modal, notification } from 'antd';
import { SearchOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import ProductLabel from '../../components/common/ProductLabel';
import { getCurrencySymbol } from '../../utils/currency';
import { useT } from '../../contexts/LanguageContext';
import { productService } from '../../services/productService';

const money = (v) => `${getCurrencySymbol()}${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

/**
 * Bulk "Produce / Add Stock" drawer: pick multiple products, enter qty (+ optional cost/selling),
 * one submit creates a MANUFACTURED batch for each. Blank cost/selling fall back to the product's base.
 */
const ProduceStockDrawer = ({ open, onClose, products = [], onDone }) => {
  const t = useT();
  const [date, setDate] = useState(dayjs());
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState({}); // productId -> { quantity, cost, selling, product }
  const [triedSave, setTriedSave] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const active = useMemo(() => (products || []).filter((p) => p.active), [products]);
  const filtered = active.filter((p) => {
    const q = search.trim().toLowerCase();
    return !q || (p.name || '').toLowerCase().includes(q);
  });
  const selectedIds = Object.keys(rows);

  const toggle = (p) => setRows((prev) => {
    const next = { ...prev };
    if (next[p.id]) delete next[p.id];
    else next[p.id] = { quantity: undefined, cost: undefined, selling: undefined, product: p };
    return next;
  });
  const setField = (id, field, val) => setRows((prev) => ({ ...prev, [id]: { ...prev[id], [field]: val } }));

  const isValid = (r) => Number(r.quantity) > 0;
  const totalQty = selectedIds.reduce((s, id) => s + (Number(rows[id].quantity) || 0), 0);

  const reset = () => { setRows({}); setSearch(''); setTriedSave(false); setDate(dayjs()); };
  const close = () => { reset(); onClose(); };

  const handleSaveClick = () => {
    setTriedSave(true);
    if (selectedIds.length === 0) return;
    if (selectedIds.some((id) => !isValid(rows[id]))) return; // red highlight shows; no toast
    setConfirmOpen(true);
  };

  const doSave = async () => {
    setConfirmOpen(false);
    setSaving(true);
    const items = selectedIds.map((id) => ({
      productId: id,
      quantity: Number(rows[id].quantity),
      unitCost: rows[id].cost === undefined || rows[id].cost === null || rows[id].cost === '' ? null : Number(rows[id].cost),
      sellingPrice: rows[id].selling === undefined || rows[id].selling === null || rows[id].selling === '' ? null : Number(rows[id].selling),
    }));
    try {
      await productService.produce({ date: date.format('YYYY-MM-DD'), items });
      notification.success({ message: t('products.produce.savedAll', 'Stock produced successfully'), placement: 'topRight' });
      reset();
      onDone?.();
      onClose();
    } catch (e) {
      notification.error({ message: e.response?.data?.message || e.message || t('products.produce.failed', 'Failed to produce stock'), placement: 'topRight' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open} onClose={close} placement="right" width={520} zIndex={1300}
      title={t('products.produce.title', 'Produce / Add Stock')}
      styles={{ body: { padding: 16 } }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}>
            {selectedIds.length} {t('products.produce.selected', 'selected')} · {totalQty} {t('production.pcs', 'Pcs')}
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button onClick={close}>{t('common.cancel', 'Cancel')}</Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} disabled={selectedIds.length === 0} onClick={handleSaveClick}>
              {t('products.produce.save', 'Produce')}
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: 4 }}>{t('production.productionDate', 'Production Date')}</div>
        <DatePicker value={date} onChange={(d) => d && setDate(d)} format="DD-MMM-YYYY" allowClear={false} style={{ width: 200 }} />
      </div>
      <Input
        allowClear prefix={<SearchOutlined style={{ color: '#94A3B8' }} />}
        placeholder={t('products.produce.searchProduct', 'Search product')}
        value={search} onChange={(e) => setSearch(e.target.value)} style={{ marginBottom: 12 }}
      />
      {filtered.length === 0 ? (
        <Empty description={t('products.produce.noProducts', 'No products')} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 230px)', overflowY: 'auto', marginRight: -8, paddingRight: 8 }}>
          {filtered.map((p) => {
            const row = rows[p.id];
            const checked = !!row;
            const invalid = checked && triedSave && !isValid(row);
            return (
              <div key={p.id} style={{ borderBottom: '1px solid #F1F5F9', padding: '8px 4px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <Checkbox checked={checked} onChange={() => toggle(p)} />
                  <Avatar size={28} style={{ background: 'var(--theme-primary)' }}>{(p.name || '?')[0]?.toUpperCase()}</Avatar>
                  <ProductLabel productId={p.id} iconName={p.iconName} name={p.name} hasImage={p.hasImage} size={18} />
                </label>
                {checked && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, paddingLeft: 34 }}>
                    <InputNumber
                      min={1} placeholder={t('production.qty', 'Qty')} value={row.quantity}
                      onChange={(v) => setField(p.id, 'quantity', v)}
                      style={{ width: '100%', borderColor: invalid ? '#F87171' : undefined, boxShadow: invalid ? '0 0 0 2px rgba(248,113,113,0.2)' : undefined }}
                    />
                    <InputNumber
                      min={0} addonBefore={getCurrencySymbol()} placeholder={t('products.produce.cost', 'Cost')} value={row.cost}
                      onChange={(v) => setField(p.id, 'cost', v)} style={{ width: '100%' }}
                    />
                    <InputNumber
                      min={0} addonBefore={getCurrencySymbol()}
                      placeholder={p.sellingPrice != null ? String(p.sellingPrice) : t('products.produce.selling', 'Selling')}
                      value={row.selling} onChange={(v) => setField(p.id, 'selling', v)} style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={confirmOpen} onCancel={() => setConfirmOpen(false)} onOk={doSave} confirmLoading={saving}
        title={t('products.produce.confirmTitle', 'Confirm Produce')}
        okText={t('products.produce.confirmSave', 'Confirm & Produce')} cancelText={t('common.cancel', 'Cancel')}
        okButtonProps={{ icon: <SaveOutlined /> }} zIndex={1400}
      >
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {selectedIds.map((id) => {
            const r = rows[id];
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #F1F5F9' }}>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>{r.product.name}</span>
                <span style={{ color: '#475569' }}>
                  {r.quantity} {t('production.pcs', 'Pcs')} · {t('products.produce.cost', 'Cost')} {r.cost != null && r.cost !== '' ? money(r.cost) : t('products.produce.base', 'Base')} · {t('products.produce.selling', 'Selling')} {r.selling != null && r.selling !== '' ? money(r.selling) : t('products.produce.base', 'Base')}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>
    </Drawer>
  );
};

export default ProduceStockDrawer;
