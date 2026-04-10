import React, { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { User, Package, Heart, CreditCard, MapPin, Star, Settings, LogOut } from 'lucide-react';

const Account = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const menuItems = [
    { id: 'profile', label: 'Mon profil', icon: User, path: '/account' },
    { id: 'orders', label: 'Mes commandes', icon: Package, path: '/account/orders' },
    { id: 'wishlist', label: 'Mes favoris', icon: Heart, path: '/account/wishlist' },
    { id: 'addresses', label: 'Adresses', icon: MapPin, path: '/account/addresses' },
    { id: 'reviews', label: 'Mes avis', icon: Star, path: '/account/reviews' }
  ];

  const handleLogout = () => {
    console.log('Déconnexion');
    // Logique de déconnexion ici
  };

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

          {/* Contenu principal */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
