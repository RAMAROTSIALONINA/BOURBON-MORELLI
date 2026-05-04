import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  Package,
  ShoppingCart,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Shield,
  Mail,
  Layout,
  Info
} from 'lucide-react';

const AdminSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [adminUser, setAdminUser] = useState(null);

  // Émettre un événement quand la sidebar change d'état
  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    window.dispatchEvent(new CustomEvent('sidebarChange', {
      detail: { collapsed: newCollapsed }
    }));
  };

  React.useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin/login');
  };

  const menuItems = [
    {
      name: 'Tableau de bord',
      href: '/admin/dashboard',
      icon: Home,
      current: location.pathname === '/admin/dashboard'
    },
    {
      name: 'Produits',
      href: '/admin/products',
      icon: Package,
      current: location.pathname.startsWith('/admin/products')
    },
    {
      name: 'Commandes',
      href: '/admin/orders',
      icon: ShoppingCart,
      current: location.pathname.startsWith('/admin/orders')
    },
    {
      name: 'Clients',
      href: '/admin/customers',
      icon: Users,
      current: location.pathname.startsWith('/admin/customers')
    },
    {
      name: 'Utilisateurs',
      href: '/admin/users',
      icon: Shield,
      current: location.pathname.startsWith('/admin/users')
    },
    {
      name: 'Paiements',
      href: '/admin/payments',
      icon: CreditCard,
      current: location.pathname.startsWith('/admin/payments')
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      current: location.pathname.startsWith('/admin/analytics')
    },
    {
      name: 'Rapports',
      href: '/admin/reports',
      icon: FileText,
      current: location.pathname.startsWith('/admin/reports')
    },
    {
      name: 'Contact',
      href: '/admin/contact',
      icon: Mail,
      current: location.pathname.startsWith('/admin/contact')
    },
    {
      name: 'Footer',
      href: '/admin/footer',
      icon: Layout,
      current: location.pathname.startsWith('/admin/footer')
    },
    {
      name: 'À propos',
      href: '/admin/about',
      icon: Info,
      current: location.pathname.startsWith('/admin/about')
    },
    {
      name: 'Historique',
      href: '/admin/history',
      icon: History,
      current: location.pathname.startsWith('/admin/history')
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
      current: location.pathname.startsWith('/admin/settings')
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen z-50 
        bg-gray-900 
        text-white 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">BM</span>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-lg font-bold">Admin</h1>
                <p className="text-xs text-gray-400">BOURBON MORELLI</p>
              </div>
            )}
          </div>
          
          {/* Toggle buttons */}
          <div className="flex items-center space-x-2">
            {/* Desktop collapse toggle */}
            <button
              onClick={toggleCollapse}
              className="hidden lg:block p-1 rounded hover:bg-gray-800"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
            
            {/* Mobile close button */}
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-gray-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${item.current
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-between'}
                `}
              >
                <div className="flex items-center">
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </div>
                {item.current && !isCollapsed && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-gray-800 p-3 space-y-2">
          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {adminUser?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {adminUser?.email || 'admin@example.com'}
                </p>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className={`
              flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200
              ${isCollapsed ? 'justify-center w-full' : 'justify-between w-full'}
              text-gray-300 hover:bg-red-600 hover:text-white
            `}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-3 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;
