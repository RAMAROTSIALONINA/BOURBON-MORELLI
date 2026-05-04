import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminRoutes from '../AdminRoutes';
import ContactNotifier from './ContactNotifier';

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleSidebarChange = (event) => {
      if (event.detail) setIsCollapsed(event.detail.collapsed);
    };
    window.addEventListener('sidebarChange', handleSidebarChange);
    return () => window.removeEventListener('sidebarChange', handleSidebarChange);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Poller global des nouveaux messages de contact */}
      <ContactNotifier />

      {/* Admin Sidebar (fixe) */}
      <AdminSidebar />

      {/* Main content area — marge dynamique pour compenser la sidebar fixe */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
        }`}
      >
        {/* Admin Header */}
        <AdminHeader />

        {/* Page content */}
        <main className="bg-gray-50 pt-16">
          <div className="px-6 py-6">
            <AdminRoutes />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
