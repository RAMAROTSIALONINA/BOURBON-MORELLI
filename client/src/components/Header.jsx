import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import authService from '../services/authService';

const Header = ({ cartCount: propCartCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(propCartCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Synchroniser le cartCount avec les props
    setCartCount(propCartCount);
  }, [propCartCount]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    setIsLoggedIn(authService.isAuthenticated());
  }, [location]);

  const navigation = [
    { name: 'Accueil', href: '/' },
    { 
      name: 'Collections', 
      href: '/collections',
      submenu: [
        { name: 'Nappes', href: '/collections/nappes' },
        { name: 'T-Shirts', href: '/collections/t-shirts' },
        { name: 'Polos', href: '/collections/polos' },
        { name: 'Pantalons', href: '/collections/pantalons' }
      ]
    },
    { name: 'Nouveautés', href: '/new' },
    { name: 'À propos', href: '/about', nowrap: true },
    { name: 'Contact', href: '/contact' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers la page de recherche
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="hidden lg:block border-b border-neutral-100 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-neutral-600 hidden xl:block">Livraison gratuite à partir de 200$</span>
              <span className="text-neutral-600 xl:hidden">Livraison gratuite</span>
            </div>
            <div className="flex items-center space-x-2 lg:space-x-4">
              <button className="text-neutral-600 hover:text-primary-500 transition-colors text-xs lg:text-sm">
                EUR $
              </button>
              <button className="text-neutral-600 hover:text-primary-500 transition-colors text-xs lg:text-sm">
                FR
              </button>
              <Link to="/account" className="text-neutral-600 hover:text-primary-500 transition-colors text-xs lg:text-sm">
                Mon compte
              </Link>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-28 lg:h-32">
          {/* Logo - Desktop */}
          <div className="hidden lg:flex items-center space-x-4 pl-6">
            <Link to="/" className="flex items-center">
              <Logo size="xxlarge" />
            </Link>
          </div>

          {/* Logo - Mobile/Tablet */}
          <div className="flex lg:hidden items-center space-x-3 pl-4">
            <Link to="/" className="flex items-center">
              <Logo size="xlarge" />
            </Link>
          </div>

          {/* Tablet Navigation - simplifiée */}
          <nav className="hidden lg:flex xl:hidden items-center space-x-4 pl-4">
            <Link
              to="/collections"
              className="text-neutral-700 hover:text-primary-500 transition-colors font-medium text-sm"
            >
              Collections
            </Link>
            <Link
              to="/about"
              className="text-neutral-700 hover:text-primary-500 transition-colors font-medium text-sm whitespace-nowrap"
            >
              À propos
            </Link>
          </nav>

          {/* Desktop Navigation - complète */}
          <nav className="hidden xl:flex items-center space-x-6 lg:space-x-8 pl-6">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  to={item.href}
                  className={`flex items-center space-x-1 text-neutral-700 hover:text-primary-500 transition-colors font-medium text-sm lg:text-base ${item.nowrap ? 'whitespace-nowrap' : ''}`}
                >
                  <span>{item.name}</span>
                  {item.submenu && <ChevronDown className="w-3 h-3 lg:w-4 lg:h-4" />}
                </Link>
                
                {/* Dropdown submenu */}
                {item.submenu && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        to={subitem.href}
                        className="block px-4 py-3 text-neutral-700 hover:bg-primary-50 hover:text-primary-500 transition-colors first:rounded-t-lg last:rounded-b-lg"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 lg:space-x-4">
            {/* Search - Tablet */}
            <form onSubmit={handleSearch} className="hidden lg:flex xl:hidden items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-32 pl-8 pr-2 py-1.5 text-sm border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
              </div>
            </form>

            {/* Search - Desktop */}
            <form onSubmit={handleSearch} className="hidden xl:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-48 xl:w-64 pl-10 pr-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </form>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-neutral-700 hover:text-primary-500 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <div className="relative">
              <button
                onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                className="p-2 text-neutral-700 hover:text-primary-500 transition-colors flex items-center"
              >
                <User className="w-6 h-6" />
                <ChevronDown className="w-4 h-4 ml-1" />
              </button>
              
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                  {isLoggedIn ? (
                    <>
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Mon compte
                      </Link>
                      <Link
                        to="/account/orders"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Mes commandes
                      </Link>
                      <button
                        onClick={async () => {
                          try {
                            await authService.logout();
                            setIsLoggedIn(false);
                            setIsAccountMenuOpen(false);
                            window.location.href = '/';
                          } catch (error) {
                            console.error('Erreur de déconnexion:', error);
                            // Même en cas d'erreur, forcer la déconnexion
                            setIsLoggedIn(false);
                            setIsAccountMenuOpen(false);
                            window.location.href = '/';
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Connexion
                      </Link>
                      <Link
                        to="/register"
                        className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        onClick={() => setIsAccountMenuOpen(false)}
                      >
                        Créer un compte
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-neutral-700 hover:text-primary-500 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-neutral-100 py-4 animate-slide-up max-h-screen overflow-y-auto">
            {/* Mobile search - en haut */}
            <form onSubmit={handleSearch} className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              </div>
            </form>
            
            <nav className="space-y-3 pl-4">
              {navigation.map((item) => (
                <div key={item.name} className="border-b border-neutral-50 pb-3 last:border-b-0">
                  <Link
                    to={item.href}
                    className={`block text-neutral-700 hover:text-primary-500 transition-colors font-medium py-2 ${item.nowrap ? 'whitespace-nowrap' : ''}`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 space-y-2 mt-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className="block text-neutral-600 hover:text-primary-500 transition-colors py-2 px-3 rounded-lg hover:bg-neutral-50"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
