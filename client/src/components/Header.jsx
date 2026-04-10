import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Simuler le compteur du panier (à remplacer avec l'API)
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    }
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
    { name: 'À propos', href: '/about' },
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
      <div className="container mx-auto px-4">
        {/* Top bar */}
        <div className="hidden lg:block border-b border-neutral-100 py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center space-x-4">
              <span className="text-neutral-600">Livraison gratuite à partir de 200€</span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-neutral-600 hover:text-primary-500 transition-colors">
                EUR €
              </button>
              <button className="text-neutral-600 hover:text-primary-500 transition-colors">
                FR
              </button>
              <Link to="/account" className="text-neutral-600 hover:text-primary-500 transition-colors">
                Mon compte
              </Link>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="flex items-center justify-between h-28">
          {/* Logo */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-4">
              <Logo size="xlarge" />
              <div className="hidden lg:block">
                <h1 className="text-3xl font-luxury font-bold text-neutral-900">
                  BOURBON MORELLI
                </h1>
                <p className="text-sm text-primary-500 font-medium">HAUTE COUTURE</p>
              </div>
            </Link>
          </div>

          {/* Mobile Logo */}
          <div className="flex items-center space-x-3 lg:hidden">
            <Link to="/" className="flex items-center space-x-3">
              <Logo size="large" />
              <div>
                <h1 className="text-xl font-luxury font-bold text-neutral-900">
                  BOURBON MORELLI
                </h1>
                <p className="text-xs text-primary-500 font-medium">HAUTE COUTURE</p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative group">
                <Link
                  to={item.href}
                  className="flex items-center space-x-1 text-neutral-700 hover:text-primary-500 transition-colors font-medium"
                >
                  <span>{item.name}</span>
                  {item.submenu && <ChevronDown className="w-4 h-4" />}
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
          <div className="flex items-center space-x-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-64 pl-10 pr-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            <Link to="/account" className="p-2 text-neutral-700 hover:text-primary-500 transition-colors">
              <User className="w-6 h-6" />
            </Link>

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
          <div className="lg:hidden border-t border-neutral-100 py-4 animate-slide-up">
            <nav className="space-y-4">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    className="block text-neutral-700 hover:text-primary-500 transition-colors font-medium py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 space-y-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          to={subitem.href}
                          className="block text-neutral-600 hover:text-primary-500 transition-colors py-1"
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
            
            {/* Mobile search */}
            <form onSubmit={handleSearch} className="mt-4">
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
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
