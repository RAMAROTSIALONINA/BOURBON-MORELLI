import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import AdminLogin from './pages/AdminLogin';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/dashboard" element={<AdminDashboard />} />
      <Route path="/products" element={<AdminDashboard />} />
      <Route path="/products/new" element={<AdminDashboard />} />
      <Route path="/products/:id/edit" element={<AdminDashboard />} />
      <Route path="/orders" element={<AdminDashboard />} />
      <Route path="/orders/:id" element={<AdminDashboard />} />
      <Route path="/customers" element={<AdminDashboard />} />
      <Route path="/customers/:id" element={<AdminDashboard />} />
      <Route path="/users" element={<UserManagement />} />
      <Route path="/payments" element={<AdminDashboard />} />
      <Route path="/payments/:id" element={<AdminDashboard />} />
      <Route path="/analytics" element={<AdminDashboard />} />
      <Route path="/reports" element={<AdminDashboard />} />
      <Route path="/settings" element={<AdminDashboard />} />
      <Route path="/history" element={<AdminDashboard />} />
      <Route path="/search" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
