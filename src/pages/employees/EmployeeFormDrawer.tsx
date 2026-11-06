import React, { useEffect } from 'react';
import { Drawer, Form, Input, DatePicker, Select, Button, Space } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, MailOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { IEmployee } from '../../types/employee.types';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeFormDrawerProps {
  visible: boolean;
  onClose: () => void;
  employee: IEmployee | null;
  onSubmit: (values: any) => Promise<void>;
  loading: boolean;
}

export const EmployeeFormDrawer: React.FC<EmployeeFormDrawerProps> = ({
  visible,
  onClose,
  employee,
  onSubmit,
  loading,
}) => {
  const [form] = Form.useForm();
  const t = useT();
  const isEdit = !!employee;

  useEffect(() => {
    if (visible) {
      if (employee) {
        form.setFieldsValue({
          fullName: employee.fullName,
          email: employee.email || '',
          mobileNumber: employee.mobileNumber || '',
          address: employee.address || '',
          active: employee.active,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          joiningDate: dayjs(), // default joining date to today
          active: true,
        });
      }
    }
  }, [visible, employee, form]);

  const handleFinish = async (values: any) => {
    const formattedValues: any = {
      ...values,
      fullName: values.fullName?.trim(),
      email: values.email?.trim(),
      mobileNumber: values.mobileNumber?.trim() || '',
      address: values.address?.trim() || '',
    };

    if (values.joiningDate) {
      formattedValues.joiningDate = values.joiningDate.format('YYYY-MM-DD');
    } else if (employee?.joiningDate) {
      formattedValues.joiningDate = employee.joiningDate;
    }

    try {
      await onSubmit(formattedValues);
      form.resetFields();
    } catch (err: any) {
      // Error handling is managed by the caller
    }
  };

  return (
    <Drawer
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
          {isEdit ? <EditOutlined style={{ color: 'var(--theme-primary)' }} /> : <PlusOutlined style={{ color: 'var(--theme-primary)' }} />}
          {isEdit ? t('employees.form.editTitle', 'Edit Employee') : t('employees.form.addTitle', 'Add Employee')}
        </span>
      }
      placement="right"
      width={500}
      onClose={onClose}
      open={visible}
      bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, padding: '10px 16px', borderTop: '1px solid #E2E8F0', backgroundColor: '#ffffff' }}>
          <Space>
            <Button onClick={onClose} disabled={loading}>
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="primary"
              loading={loading}
              onClick={() => form.submit()}
              style={{ backgroundColor: 'var(--theme-primary)', borderColor: 'var(--theme-primary)', fontWeight: 600 }}
            >
              {isEdit ? t('employees.form.saveChanges', 'Save Changes') : t('employees.form.saveEmployee', 'Save Employee')}
            </Button>
          </Space>
        </div>
      }
      footerStyle={{ padding: 0 }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        requiredMark={true}
        autoComplete="off"
      >
        <Form.Item
          name="fullName"
          label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('employees.form.name', 'Employee Name')}</span>}
          rules={[{ required: true, message: t('employees.form.nameRequired', 'Employee Name is required.') }]}
        >
          <Input placeholder={t('employees.form.namePlaceholder', 'Enter employee full name')} size="large" prefix={<UserOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('employees.form.email', 'Email')}</span>}
          validateTrigger="onBlur"
          rules={[
            { required: true, message: t('employees.form.emailRequired', 'Email is required.') },
            { type: 'email', message: t('employees.form.emailInvalid', 'Please enter a valid email format.') },
          ]}
        >
          <Input placeholder={t('employees.form.emailPlaceholder', 'Enter employee email')} type="email" size="large" prefix={<MailOutlined style={{ color: '#94A3B8' }} />} />
        </Form.Item>

        <Form.Item
          name="mobileNumber"
          label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('employees.form.mobile', 'Mobile Number')}</span>}
          validateTrigger="onBlur"
          rules={[
            {
              pattern: /^\d*$/,
              message: t('employees.form.mobileNumeric', 'Mobile number must contain numeric characters only.'),
            },
            {
              max: 15,
              message: t('employees.form.mobileMax', 'Mobile number cannot exceed 15 digits.'),
            },
          ]}
        >
          <Input placeholder={t('employees.form.mobilePlaceholder', 'Enter mobile number (optional)')} size="large" />
        </Form.Item>

        {!isEdit && (
          <Form.Item
            name="joiningDate"
            label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('employees.form.joiningDate', 'Joining Date')}</span>}
            rules={[{ required: true, message: t('employees.form.joiningRequired', 'Joining Date is required.') }]}
          >
            <DatePicker style={{ width: '100%' }} size="large" format="YYYY-MM-DD" />
          </Form.Item>
        )}

        <Form.Item
          name="address"
          label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('employees.form.address', 'Address')}</span>}
        >
          <Input.TextArea placeholder={t('employees.form.addressPlaceholder', 'Enter residential address (optional)')} rows={4} size="large" />
        </Form.Item>

        {isEdit && (
          <Form.Item
            name="active"
            label={<span style={{ fontWeight: 600, color: '#475569' }}>{t('common.status', 'Status')}</span>}
            rules={[{ required: true }]}
          >
            <Select size="large">
              <Select.Option value={true}>{t('employees.status.active', 'Active')}</Select.Option>
              <Select.Option value={false}>{t('employees.status.inactive', 'Inactive')}</Select.Option>
            </Select>
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
};
