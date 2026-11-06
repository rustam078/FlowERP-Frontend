import React from 'react';
import { Card, Tag, Divider } from 'antd';
import HeadingInfo from '../../components/common/HeadingInfo';
import {
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  MailOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { IEmployee } from '../../types/employee.types';
import { useT } from '../../contexts/LanguageContext';

interface EmployeeInfoCardProps {
  employee: IEmployee;
}

const Detail: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
    <span style={{ marginTop: 2, color: '#64748B', fontSize: '0.9rem' }}>{icon}</span>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', wordBreak: 'break-word', lineHeight: 1.3 }}>{value}</div>
    </div>
  </div>
);

export const EmployeeInfoCard: React.FC<EmployeeInfoCardProps> = ({ employee }) => {
  const t = useT();
  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  const notProvided = <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.82rem' }}>{t('employees.notProvided', 'Not Provided')}</span>;

  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.05), 0px 10px 15px -3px rgba(15, 23, 42, 0.05)',
        border: '1px solid #E2E8F0',
      }}
      bodyStyle={{ padding: 14 }}
    >
      {/* Header (horizontal to keep the card compact) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: employee.active ? '#DBEAFE' : '#F1F5F9',
            color: employee.active ? '#1E40AF' : '#475569',
            fontSize: '1.15rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px solid ${employee.active ? '#93C5FD' : '#CBD5E1'}`,
            flexShrink: 0,
          }}
        >
          {getInitials(employee.fullName || 'Emp')}
        </div>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', margin: 0, display: 'inline-flex', alignItems: 'center' }}>
            {employee.fullName}
            <HeadingInfo text={t('employees.info.heading', 'Production output, earnings and history for this employee.')} />
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>{employee.employeeCode}</Tag>
            {employee.active ? (
              <Tag color="success" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>{t('employees.status.active', 'Active')}</Tag>
            ) : (
              <Tag color="error" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>{t('employees.status.inactive', 'Inactive')}</Tag>
            )}
          </div>
        </div>
      </div>

      <Divider style={{ margin: '10px 0' }} />

      {/* Details in 2 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
        <Detail
          icon={<MailOutlined />}
          label={t('employees.form.email', 'Email')}
          value={
            employee.email ? (
              <a href={`mailto:${employee.email}`} style={{ color: 'var(--theme-primary)', fontWeight: 500 }}>{employee.email}</a>
            ) : notProvided
          }
        />
        <Detail icon={<PhoneOutlined />} label={t('employees.info.phone', 'Phone Number')} value={employee.mobileNumber || notProvided} />
        <Detail icon={<HomeOutlined />} label={t('employees.form.address', 'Address')} value={employee.address || notProvided} />
        <Detail
          icon={<CalendarOutlined />}
          label={t('employees.form.joiningDate', 'Joining Date')}
          value={employee.joiningDate ? dayjs(employee.joiningDate).format('DD-MMM-YYYY') : '-'}
        />
      </div>
    </Card>
  );
};
