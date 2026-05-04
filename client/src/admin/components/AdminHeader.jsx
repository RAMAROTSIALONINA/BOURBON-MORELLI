import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  LogOut,
  Bell,
  ChevronDown,
  Settings,
  X,
  Package,
  ShoppingBag,
  Users
} from 'lucide-react';
import useNotificationStore from '../../services/notificationService';
import productService from '../../services/productService';
import orderService from '../../services/orderService';
import customerService from '../../services/customerService';

// Header Admin Simple et Efficace - Version 2.0
// Gauche: Logo BOURBON MORELLI | Droite: Recherche + Notifications

const AdminHeader = () => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], orders: [], customers: [] });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [adminUser, setAdminUser] = useState(null);
  const navigate = useNavigate();
  const searchCacheRef = useRef({ products: null, orders: null, customers: null, loaded: false });
  const debounceRef = useRef(null);

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
      if (!e.target.closest('[data-search-box]')) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pré-charger les données de recherche (produits, commandes, clients) à la demande
  const ensureSearchData = async () => {
    if (searchCacheRef.current.loaded) return searchCacheRef.current;
    try {
      const [prodRes, orderRes, custRes] = await Promise.allSettled([
        productService.getAllProducts(),
        orderService.getAllOrders(),
        customerService.getAllCustomers()
      ]);
      const extractList = (r, keys) => {
        if (r.status !== 'fulfilled') return [];
        const d = r.value;
        if (Array.isArray(d)) return d;
        for (const k of keys) {
          if (Array.isArray(d?.[k])) return d[k];
          if (Array.isArray(d?.data?.[k])) return d.data[k];
        }
        return Array.isArray(d?.data) ? d.data : [];
      };
      searchCacheRef.current = {
        products: extractList(prodRes, ['products']),
        orders: extractList(orderRes, ['orders']),
        customers: extractList(custRes, ['customers', 'users']),
        loaded: true
      };
    } catch (err) {
      searchCacheRef.current = { products: [], orders: [], customers: [], loaded: true };
    }
    return searchCacheRef.current;
  };

  // Recherche debouncée à chaque frappe
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults({ products: [], orders: [], customers: [] });
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const data = await ensureSearchData();
      const matchProd = (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.sku || '').toLowerCase().includes(q) ||
        (p.slug || '').toLowerCase().includes(q);
      const matchOrder = (o) =>
        String(o.id || '').includes(q) ||
        (o.order_number || '').toLowerCase().includes(q) ||
        (o.customer_name || o.customer?.name || '').toLowerCase().includes(q) ||
        (o.email || o.customer?.email || '').toLowerCase().includes(q) ||
        (o.status || '').toLowerCase().includes(q);
      const matchCust = (c) =>
        (c.name || `${c.first_name || ''} ${c.last_name || ''}`).toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q);

      setSearchResults({
        products: (data.products || []).filter(matchProd).slice(0, 5),
        orders: (data.orders || []).filter(matchOrder).slice(0, 5),
        customers: (data.customers || []).filter(matchCust).slice(0, 5)
      });
      setIsSearching(false);
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery]);

  const goTo = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
    navigate(path);
  };

  const totalResults =
    searchResults.products.length + searchResults.orders.length + searchResults.customers.length;

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
    const q = searchQuery.trim();
    if (!q) return;
    // Si un unique résultat correspond, on y va directement
    if (totalResults === 1) {
      if (searchResults.products[0]) return goTo(`/admin/products`);
      if (searchResults.orders[0]) return goTo(`/admin/orders/${searchResults.orders[0].id}`);
      if (searchResults.customers[0]) return goTo(`/admin/customers/${searchResults.customers[0].id}`);
    }
    // Sinon on ouvre la liste des commandes filtrée (fallback historique)
    navigate(`/admin/orders?search=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
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
              <div className="hidden sm:block relative" data-search-box>
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                    placeholder="Rechercher produits, commandes, clients..."
                    className="w-72 pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setSearchResults({ products: [], orders: [], customers: [] }); }}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700"
                      aria-label="Effacer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </form>

                {/* Dropdown des résultats */}
                {isSearchOpen && searchQuery.trim() && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden text-gray-900">
                    {isSearching ? (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">Recherche…</div>
                    ) : totalResults === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-sm text-gray-600">Aucun résultat pour « {searchQuery} »</p>
                        <p className="text-xs text-gray-400 mt-1">Essayez un nom de produit, un n° de commande ou un email client.</p>
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {searchResults.products.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                              <Package className="h-3.5 w-3.5 text-purple-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Produits</span>
                            </div>
                            {searchResults.products.map((p) => (
                              <button
                                key={`p-${p.id}`}
                                onClick={() => goTo('/admin/products')}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded bg-purple-50 flex items-center justify-center flex-shrink-0">
                                  <Package className="h-4 w-4 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{p.name}</p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {p.sku || 'Sans SKU'} · {Number(p.price || 0).toFixed(2)} EUR
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.orders.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                              <ShoppingBag className="h-3.5 w-3.5 text-blue-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Commandes</span>
                            </div>
                            {searchResults.orders.map((o) => (
                              <button
                                key={`o-${o.id}`}
                                onClick={() => goTo(`/admin/orders/${o.id}`)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center flex-shrink-0">
                                  <ShoppingBag className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    Commande #{o.order_number || o.id}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {o.customer_name || o.customer?.name || 'Client inconnu'} ·{' '}
                                    {Number(o.total_amount || o.total || 0).toFixed(2)} EUR · {o.status}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.customers.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-green-600" />
                              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Clients</span>
                            </div>
                            {searchResults.customers.map((c) => (
                              <button
                                key={`c-${c.id}`}
                                onClick={() => goTo(`/admin/customers/${c.id}`)}
                                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                              >
                                <div className="w-8 h-8 rounded bg-green-50 flex items-center justify-center flex-shrink-0">
                                  <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">
                                    {c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client'}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate">
                                    {c.email || '—'} {c.phone ? `· ${c.phone}` : ''}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {totalResults > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 text-center">
                        <button
                          onClick={handleSearch}
                          className="text-xs font-medium text-gray-700 hover:text-gray-900"
                        >
                          Voir toutes les commandes correspondantes →
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
