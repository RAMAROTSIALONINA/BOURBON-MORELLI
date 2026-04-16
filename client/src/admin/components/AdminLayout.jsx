import React from 'react';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminRoutes from '../AdminRoutes';

const AdminLayout = () => {
  // const [sidebarWidth, setSidebarWidth] = useState('64'); // w-16 = 4rem = 64px en collapsed
  // const [isCollapsed, setIsCollapsed] = useState(false);

  // useEffect(() => {
  //   // Écouter les changements de la sidebar
  //   const handleSidebarChange = (event) => {
  //     if (event.detail) {
  //       setIsCollapsed(event.detail.collapsed);
  //       setSidebarWidth(event.detail.collapsed ? '64' : '256'); // w-16 = 64px, w-64 = 256px
  //     }
  //   };

  //   window.addEventListener('sidebarChange', handleSidebarChange);
  //   return () => window.removeEventListener('sidebarChange', handleSidebarChange);
  // }, []);

  // const handleToggleSidebar = () => {
  //   const newCollapsed = !isCollapsed;
  //   setIsCollapsed(newCollapsed);
  //   setSidebarWidth(newCollapsed ? '64' : '256');
  //   window.dispatchEvent(new CustomEvent('sidebarChange', {
  //     detail: { collapsed: newCollapsed }
  //   }));
  // };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <AdminSidebar />
      
      {/* Main content area */}
      <div className="flex-1">
        {/* Admin Header */}
        <AdminHeader />
        
        {/* Page content */}
        <main className="bg-gray-50">
          <div className="px-6 py-6">
            <AdminRoutes />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
