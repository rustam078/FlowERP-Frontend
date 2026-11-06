import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Box } from '@mui/material';
import { Skeleton, ConfigProvider, Breadcrumb, Modal, notification, Tabs } from 'antd';
import { vendorService } from '../../services/investmentService';

import VendorProfileCard from './components/VendorProfileCard';
import VendorPurchaseHistory from './components/VendorPurchaseHistory';
import VendorPaymentHistory from './components/VendorPaymentHistory';

const VendorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [editModalVisible, setEditModalVisible] = useState(false);

  const { data: vendorData, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: () => vendorService.getVendorById(id),
    enabled: !!id,
  });

  const vendor = vendorData?.data;

  const handleCreateInvestment = () => {
    navigate(`/investment?add=true&vendorId=${id}`);
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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px' }}>
        <Breadcrumb 
          items={[
            { title: <a onClick={() => navigate('/investment?tab=vendors')}>Vendors</a> },
            { title: 'Vendor Details' },
          ]}
          style={{ marginBottom: 16 }}
        />

        {isLoading ? (
          <div>
            <Skeleton active paragraph={{ rows: 4 }} />
            <Skeleton active paragraph={{ rows: 4 }} style={{ marginTop: 32 }} />
            <Skeleton active paragraph={{ rows: 8 }} style={{ marginTop: 32 }} />
          </div>
        ) : vendor ? (
          <>
            <VendorProfileCard
              vendor={vendor}
              onCreateInvestment={handleCreateInvestment}
              summary={{
                totalInvoices: vendor.totalInvoices,
                totalPurchaseAmount: vendor.totalPurchaseAmount,
                lastPurchaseDate: vendor.lastPurchaseDate,
                // Total outstanding (overdue) across this vendor's invoices.
                totalOverdue: (vendor.purchases || []).reduce((sum, inv) => sum + (Number(inv.amountDue) || 0), 0),
              }}
            />

            <Tabs
              defaultActiveKey="purchases"
              items={[
                {
                  key: 'purchases',
                  label: 'Purchase History',
                  children: (
                    <VendorPurchaseHistory
                      invoices={vendor.purchases || []}
                      onAddInvestment={handleCreateInvestment}
                    />
                  ),
                },
                {
                  key: 'payments',
                  label: 'Payment History',
                  children: <VendorPaymentHistory vendorId={id} />,
                },
              ]}
            />
          </>
        ) : (
          <div>Vendor not found.</div>
        )}
      </Box>
    </ConfigProvider>
  );
};

export default VendorDetailsPage;
