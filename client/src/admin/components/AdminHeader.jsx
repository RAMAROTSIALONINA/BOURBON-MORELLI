import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  LogOut, 
  User,
  ChevronDown,
  Menu,
  X,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Package
} from 'lucide-react';

// Header Admin Simple et Efficace - Version 2.0
// Gauche: Logo BOURBON MORELLI | Droite: Recherche + Notifications

const AdminHeader = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Nouvelle commande #1234',
      message: 'Jean Dupont vient de passer une commande de 129.99',
      type: 'order',
      time: 'Il y a 2 min',
      read: false,
      icon: ShoppingCart,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Nouveau message',
      message: 'Marie Martin a envoyé une demande de support',
      type: 'message',
      time: 'Il y a 15 min',
      read: false,
      icon: MessageSquare,
      color: 'green'
    },
    {
      id: 3,
      title: 'Commande en attente',
      message: 'Commande #1233 nécessite validation',
      type: 'order',
      time: 'Il y a 1h',
      read: true,
      icon: ShoppingCart,
      color: 'yellow'
    },
    {
      id: 4,
      title: 'Message client',
      message: 'Pierre Durand demande des informations sur un produit',
      type: 'message',
      time: 'Il y a 2h',
      read: true,
      icon: MessageSquare,
      color: 'purple'
    }
  ]);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Header Admin Simple et Efficace - NOUVEAU */}
      <header className="bg-gray-900 text-white sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* GAUCHE - Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-gray-900 font-bold text-lg">BM</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BOURBON MORELLI</h1>
                <p className="text-xs text-gray-400">Admin</p>
              </div>
            </div>

            {/* DROITE - Recherche + Notifications */}
            <div className="flex items-center space-x-4">
              {/* Recherche */}
              <div className="hidden sm:block">
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher produits, commandes..."
                    className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </form>
              </div>

              {/* Notifications */}
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-white hover:bg-gray-800 rounded-full relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-500 border-2 border-white"></span>
                )}
              </button>

              {/* Profil */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-800"
                >
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="text-gray-900 font-bold text-sm">
                      {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {/* Dropdown Profil */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {adminUser?.name || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {adminUser?.email || 'admin@bourbonmorelli.com'}
                        </p>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/admin/users"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Gestion utilisateurs
                        </Link>
                        <Link
                          to="/admin/settings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-4 w-4 mr-3" />
                          Paramètres
                        </Link>
                      </div>
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile navigation menu */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-gray-600 bg-opacity-75 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BM</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold">Admin</h1>
                  <p className="text-xs text-gray-500">BOURBON MORELLI</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Mobile search */}
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher produits, commandes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </form>
            </div>

            {/* User section */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-700 font-bold text-sm">
                    {adminUser?.name?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {adminUser?.name || 'Admin'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {adminUser?.email || 'admin@bourbonmorelli.com'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AdminHeader;
