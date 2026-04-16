import React, { useState, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { User, Package, Heart, MapPin, Star, LogOut } from 'lucide-react';
import authService from '../services/authService';

const Account = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mettre à jour l'onglet actif selon l'URL
  useEffect(() => {
    const path = location.pathname;
    if (path === '/account' || path === '/account/profile') {
      setActiveTab('profile');
    } else if (path === '/account/orders') {
      setActiveTab('orders');
    } else if (path === '/account/wishlist') {
      setActiveTab('wishlist');
    } else if (path === '/account/addresses') {
      setActiveTab('addresses');
    } else if (path === '/account/reviews') {
      setActiveTab('reviews');
    }
  }, [location.pathname]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const userInfo = authService.getUserInfo();
          setUser(userInfo);
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Erreur de chargement utilisateur:', error);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [navigate]);

  const menuItems = [
    { id: 'profile', label: 'Mon profil', icon: User, path: '/account' },
    { id: 'orders', label: 'Mes commandes', icon: Package, path: '/account/orders' },
    { id: 'wishlist', label: 'Mes favoris', icon: Heart, path: '/account/wishlist' },
    { id: 'addresses', label: 'Adresses', icon: MapPin, path: '/account/addresses' },
    { id: 'reviews', label: 'Mes avis', icon: Star, path: '/account/reviews' }
  ];

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/');
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      // Forcer la déconnexion même en cas d'erreur
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Menu latéral */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-luxury font-bold text-neutral-900 mb-6">
                Mon compte
              </h2>
              
              {/* Infos utilisateur */}
              {user && (
                <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <nav className="space-y-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary-50 text-primary-500'
                        : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-8 pt-8 border-t">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 text-red-500 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </div>
          </div>

          {/* Contenu principal - Affiche les sous-pages */}
          <div className="lg:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
