import React from 'react';
import { Drawer, Tag, Button, Descriptions } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { IEmployee } from '../../types/employee.types';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeViewDrawerProps {
  visible: boolean;
  onClose: () => void;
  employee: IEmployee | null;
}

export const EmployeeViewDrawer: React.FC<EmployeeViewDrawerProps> = ({
  visible,
  onClose,
  employee,
}) => {
  const t = useT();
  if (!employee) return null;

  return (
    <Drawer
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
          <UserOutlined style={{ color: 'var(--theme-primary)' }} />
          {t('employees.viewDrawer.title', 'Employee Details')}
        </span>
      }
      placement="right"
      width={700}
      onClose={onClose}
      open={visible}
      bodyStyle={{ backgroundColor: '#F8FAFC', padding: 24 }}
      extra={
        <Button onClick={onClose} icon={<ArrowLeftOutlined />}>
          {t('common.back', 'Back')}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Profile Card */}
        <div style={{ padding: '20px 24px', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t('employees.employeeCode', 'Employee Code')}</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
              {employee.employeeCode}
            </div>
          </div>
          <div>
            {employee.active ? (
              <Tag color="success" style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>{t('employees.status.active', 'Active')}</Tag>
            ) : (
              <Tag color="error" style={{ padding: '4px 12px', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600 }}>{t('employees.status.inactive', 'Inactive')}</Tag>
            )}
          </div>
        </div>

        {/* Detailed Info Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', padding: 24 }}>
          <Descriptions 
            title={<span style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A' }}>{t('employees.viewDrawer.personalDetails', 'Personal & Joining Details')}</span>}
            column={1} 
            bordered 
            labelStyle={{ width: '180px', fontWeight: 600, color: '#475569', backgroundColor: '#F8FAFC' }} 
            contentStyle={{ color: '#0F172A' }}
          >
            <Descriptions.Item label={t('employees.viewDrawer.fullName', 'Full Name')}>
              {employee.fullName}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.form.mobile', 'Mobile Number')}>
              {employee.mobileNumber ? (
                employee.mobileNumber
              ) : (
                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>{t('employees.notProvided', 'Not Provided')}</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.form.address', 'Address')}>
              {employee.address ? (
                employee.address
              ) : (
                <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>{t('employees.notProvided', 'Not Provided')}</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('employees.form.joiningDate', 'Joining Date')}>
              {employee.joiningDate ? dayjs(employee.joiningDate).format('DD-MMM-YYYY') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>
    </Drawer>
  );
};
