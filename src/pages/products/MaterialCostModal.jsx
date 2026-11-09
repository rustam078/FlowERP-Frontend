import React, { useEffect } from 'react';
import {
    Modal,
    Form,
    DatePicker,
    message,
} from 'antd';
import dayjs from 'dayjs';
import productService from '../../services/productService';
import CurrencyInput from '../../components/common/CurrencyInput';
import { useT } from '../../contexts/LanguageContext';

const MaterialCostModal = ({
    open,
    onClose,
    productId,
    editingMaterialCost,
    onSuccess,
}) => {

    const t = useT();
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();

            form.setFieldsValue({
                cost: editingMaterialCost?.cost ?? undefined,
                salePrice: editingMaterialCost?.salePrice ?? undefined,
                effectiveFrom: editingMaterialCost?.effectiveFrom ? dayjs(editingMaterialCost.effectiveFrom) : dayjs(),
            });
        }
    }, [open, editingMaterialCost]);

    const handleSubmit = async () => {

        try {

            const values = await form.validateFields();

            const payload = {
                cost: values.cost,
                salePrice: (values.salePrice || values.salePrice === 0) ? values.salePrice : null,
                effectiveFrom: values.effectiveFrom.format('YYYY-MM-DD'),
            };

            if (editingMaterialCost?.id) {
                await productService.updateMaterialCost(editingMaterialCost.id, payload);
                message.success(t('products.material.updated', 'Pricing updated successfully.'));
            } else {
                await productService.createMaterialCost(
                    productId,
                    payload
                );
                message.success(t('products.material.added', 'Pricing added successfully.'));
            }

            onSuccess();

            form.resetFields();

        } catch (error) {

            if (error?.errorFields) return;

            message.error(
                error?.response?.data?.message ||
                t('products.material.saveFailed', 'Failed to save pricing.')
            );
        }
    };

    return (
        <Modal
            open={open}
            title={editingMaterialCost ? t('products.material.editTitle', 'Edit Pricing') : t('products.material.addTitle', 'Add Pricing')}
            okText={t('common.save', 'Save')}
            cancelText={t('common.cancel', 'Cancel')}
            destroyOnClose
            onCancel={onClose}
            onOk={handleSubmit}
        >

            <Form
                layout="vertical"
                form={form}
            >

                {/* Cost (CP) and Sale Price (SP) side by side in one row. */}
                <div style={{ display: 'flex', gap: 16 }}>
                    <Form.Item
                        style={{ flex: 1 }}
                        label={t('products.material.costLabel', 'Cost (per piece)')}
                        name="cost"
                        rules={[
                            {
                                required: true,
                                message: t('products.material.costRequired', 'Please enter cost'),
                            },
                        ]}
                    >
                        <CurrencyInput
                            precision={2}
                            placeholder={t('products.material.costPlaceholder', 'e.g. 120')}
                        />
                    </Form.Item>

                    <Form.Item
                        style={{ flex: 1 }}
                        label={t('products.material.saleLabel', 'Sale Price (per piece)')}
                        name="salePrice"
                        rules={[
                            {
                                required: true,
                                message: t('products.material.saleRequired', 'Please enter sale price'),
                            },
                        ]}
                    >
                        <CurrencyInput
                            precision={2}
                            placeholder={t('products.material.salePlaceholder', 'e.g. 150')}
                        />
                    </Form.Item>
                </div>

                <Form.Item
                    label={t('products.material.effectiveFrom', 'Effective From')}
                    name="effectiveFrom"
                    rules={[
                        {
                            required: true,
                            message: t('products.material.dateRequired', 'Please select date'),
                        },
                    ]}
                >
                    <DatePicker
                        style={{ width: '100%' }}
                    />
                </Form.Item>

            </Form>

        </Modal>
    );
};

export default MaterialCostModal;
