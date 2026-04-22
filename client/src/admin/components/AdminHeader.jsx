import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Settings,
  X
} from 'lucide-react';
import useNotificationStore from '../../services/notificationService';

// Header Admin Simple et Efficace - Version 2.0
// Gauche: Logo BOURBON MORELLI | Droite: Recherche + Notifications

const AdminHeader = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();

  // Utiliser le store global de notifications
  const {
    notifications,
    unreadCount,
    markAsRead,
    removeNotification,
    clearNotifications
  } = useNotificationStore();

  // Fermer les dropdowns en cliquant à l'extérieur
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-notif-dropdown]') && !e.target.closest('[data-notif-button]')) {
        setIsNotificationsOpen(false);
      }
      if (!e.target.closest('[data-profile-dropdown]') && !e.target.closest('[data-profile-button]')) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem('adminUser');
    if (user) {
      setAdminUser(JSON.parse(user));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setAdminUser(null);
    navigate('/admin/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/admin/orders?search=${encodeURIComponent(searchQuery)}`);
    }
  };

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
              <div className="relative">
                <button
                  data-notif-button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-white hover:bg-gray-800 rounded-full relative"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-5 min-w-[1.25rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-gray-900">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Notifications */}
                {isNotificationsOpen && (
                  <div
                    data-notif-dropdown
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                        <p className="text-xs text-gray-500">
                          {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Tout est à jour'}
                        </p>
                      </div>
                      {notifications.length > 0 && (
                        <button
                          onClick={clearNotifications}
                          className="text-xs text-gray-600 hover:text-red-600 font-medium"
                        >
                          Tout effacer
                        </button>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-12 text-center">
                          <Bell className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Aucune notification</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Les nouvelles commandes apparaîtront ici
                          </p>
                        </div>
                      ) : (
                        [...notifications].reverse().map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markAsRead(n.id);
                              if (n.link) {
                                navigate(n.link);
                                setIsNotificationsOpen(false);
                              }
                            }}
                            className={`px-4 py-3 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                              !n.read ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {!n.read && (
                                <span className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {n.title || 'Notification'}
                                </p>
                                {n.message && (
                                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                    {n.message}
                                  </p>
                                )}
                                {n.time && (
                                  <p className="text-[11px] text-gray-400 mt-1">{n.time}</p>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(n.id);
                                }}
                                className="text-gray-400 hover:text-red-500 flex-shrink-0"
                                aria-label="Supprimer"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                      <Link
                        to="/admin/orders"
                        onClick={() => setIsNotificationsOpen(false)}
                        className="block text-center text-xs font-medium text-gray-700 hover:text-gray-900"
                      >
                        Voir toutes les commandes →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

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
                          {adminUser?.email || 'admin@example.com'}
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
                          <Settings className="h-4 w-4 mr-3" />
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
                    {adminUser?.email || 'admin@example.com'}
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
