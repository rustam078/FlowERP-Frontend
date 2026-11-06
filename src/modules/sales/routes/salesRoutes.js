import React from 'react';
import { Navigate } from 'react-router-dom';
import SalesDashboard from '../pages/SalesDashboard';
import CreateSale from '../pages/CreateSale';

const salesRoutes = [
  {
    path: '/sales/dashboard',
    element: <SalesDashboard />,
  },
  {
    path: '/sales/new',
    element: <CreateSale />,
  },
  {
    path: '/sales',
    element: <Navigate to="/sales/dashboard" replace />,
  },
];

export default salesRoutes;
