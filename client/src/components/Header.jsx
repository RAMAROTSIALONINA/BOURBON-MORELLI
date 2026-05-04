import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, X, ChevronDown } from 'lucide-react';
import Logo from './Logo';
import authService from '../services/authService';
import productServicePublic from '../services/productServicePublic';
import siteSettingsService, { DEFAULT_SITE_SETTINGS } from '../services/siteSettingsService';
import { useCurrency } from '../contexts/CurrencyContext';

const BACKEND_URL = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

const Header = ({ cartCount: propCartCount = 0 }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(propCartCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [categories, setCategories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [topBar, setTopBar] = useState(DEFAULT_SITE_SETTINGS.top_bar);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const { code: currencyCode, enabled: currencyList, symbol: currencySymbol, setCurrency, format: formatPrice } = useCurrency();
  const productCacheRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    let alive = true;
    siteSettingsService.getSettings().then((v) => {
      if (!alive) return;
      if (v?.top_bar) setTopBar({ ...DEFAULT_SITE_SETTINGS.top_bar, ...v.top_bar });
    });
    const onChange = (e) => {
      if (e.detail?.top_bar) setTopBar({ ...DEFAULT_SITE_SETTINGS.top_bar, ...e.detail.top_bar });
    };
    window.addEventListener('siteSettingsChange', onChange);
    return () => {
      alive = false;
      window.removeEventListener('siteSettingsChange', onChange);
    };
  }, []);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetch('http://localhost:5003/api/categories');
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.categories || data.data || []);
        setCategories(list.filter(c => !c.parent_id));
      } catch (err) {
        console.error('Erreur chargement catégories header:', err);
      }
    };
    loadCategories();
  }, []);

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
      submenu: categories.length > 0
        ? categories.map(c => ({ name: c.name, href: `/collections/${c.slug}` }))
        : [
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
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setIsMenuOpen(false);
    }
  };

  // Pré-charger la liste des produits à la 1ère frappe, puis filtrer en mémoire
  const ensureProducts = async () => {
    if (productCacheRef.current) return productCacheRef.current;
    try {
      const data = await productServicePublic.getAllProducts();
      productCacheRef.current = Array.isArray(data) ? data : (data?.products || []);
    } catch (err) {
      console.error('Erreur chargement produits pour recherche:', err);
      productCacheRef.current = [];
    }
    return productCacheRef.current;
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      const list = await ensureProducts();
      const filtered = list
        .filter((p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (typeof p.category === 'string' ? p.category : p.category?.name || '')
            .toLowerCase()
            .includes(q)
        )
        .slice(0, 6);
      setSearchResults(filtered);
      setIsSearching(false);
    }, 250);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
  }, [searchQuery]);

  // Fermer le dropdown de recherche en cliquant à l'extérieur
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-search-box]')) setIsSearchOpen(false);
      if (!e.target.closest('[data-currency-box]')) setIsCurrencyMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const goToProduct = (p) => {
    const slug = p.slug || (p.name || '').toLowerCase().replace(/\s+/g, '-');
    setSearchQuery('');
    setIsSearchOpen(false);
    setIsMenuOpen(false);
    navigate(`/product/${slug}`);
  };

  // Dropdown de suggestions (partagé entre les deux tailles d'écran)
  const SearchDropdown = ({ widthClass = 'w-80' }) => {
    if (!isSearchOpen || !searchQuery.trim()) return null;
    return (
      <div
        className={`absolute right-0 mt-2 ${widthClass} bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden`}
      >
        {isSearching ? (
          <div className="px-4 py-6 text-center text-sm text-neutral-500">Recherche…</div>
        ) : searchResults.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-neutral-700">Aucun produit pour « {searchQuery} »</p>
            <p className="text-xs text-neutral-400 mt-1">Essayez un autre mot-clé.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {searchResults.map((p) => {
              const img = Array.isArray(p.images) && p.images[0] ? resolveImageUrl(p.images[0]) : null;
              return (
                <button
                  key={p.id}
                  onClick={() => goToProduct(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0 flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
                    {img ? (
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/images/BOURBON MORELLI.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-300">
                        <Search className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{p.name}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {(typeof p.category === 'string' ? p.category : p.category?.name) || 'Produit'} ·{' '}
                      {formatPrice(p.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="px-4 py-2 border-t border-neutral-100 bg-neutral-50 text-center">
          <button
            onClick={handleSearch}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            Voir tous les résultats pour « {searchQuery} » →
          </button>
        </div>
      </div>
    );
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* === Desktop (lg+) : logo centré au-dessus, menu en dessous === */}
        <div className="hidden lg:block">
          {/* Row 1 : livraison (gauche) + logo (centré) + devise/langue (droite) */}
          <div className="relative flex items-center justify-center h-40 xl:h-44">
            {/* Livraison à gauche */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 text-sm">
              <span className="text-neutral-600 hidden xl:block">{topBar.shipping_text}</span>
              <span className="text-neutral-600 xl:hidden">{topBar.shipping_text_short}</span>
            </div>
            {/* Logo centré */}
            <Link to="/" className="flex items-center justify-center">
              <Logo size="xxlarge" />
            </Link>
            {/* Devise + langue à droite */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-4 text-sm">
              {/* Dropdown devise */}
              <div className="relative" data-currency-box>
                <button
                  onClick={() => setIsCurrencyMenuOpen((o) => !o)}
                  className="text-neutral-600 hover:text-primary-500 transition-colors flex items-center gap-1"
                >
                  <span>{currencyCode} {currencySymbol}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
                {isCurrencyMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
                    {currencyList.map((c) => (
                      <button
                        key={c}
                        onClick={() => { setCurrency(c); setIsCurrencyMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 flex items-center justify-between ${
                          c === currencyCode ? 'text-primary-500 font-medium' : 'text-neutral-700'
                        }`}
                      >
                        <span>{c}</span>
                        {c === currencyCode && <span className="text-primary-500">✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="text-neutral-600 hover:text-primary-500 transition-colors">
                {topBar.language_label}
              </button>
            </div>
          </div>

          {/* Row 2 : menu centré + actions à droite (même ligne) */}
          <div className="relative flex items-center justify-center py-3 border-t border-neutral-100">
            <nav className="flex items-center space-x-6 xl:space-x-10">
              {navigation.map((item) => (
                <div key={item.name} className="relative group">
                  <Link
                    to={item.href}
                    className={`flex items-center space-x-1 text-neutral-700 hover:text-primary-500 transition-colors font-medium text-sm xl:text-base ${item.nowrap ? 'whitespace-nowrap' : ''}`}
                  >
                    <span>{item.name}</span>
                    {item.submenu && <ChevronDown className="w-3 h-3 xl:w-4 xl:h-4" />}
                  </Link>
                  {item.submenu && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform group-hover:translate-y-0 translate-y-2 z-40">
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

            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center space-x-4">
              {/* Search desktop */}
              <div className="hidden xl:block relative" data-search-box>
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                      onFocus={() => setIsSearchOpen(true)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                      placeholder="Rechercher un produit..."
                      className="w-48 xl:w-72 pl-10 pr-4 py-2 text-neutral-900 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  </div>
                </form>
                <SearchDropdown widthClass="w-96" />
              </div>
              {/* Search tablet */}
              <div className="lg:block xl:hidden relative" data-search-box>
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                      onFocus={() => setIsSearchOpen(true)}
                      onKeyDown={(e) => { if (e.key === 'Escape') setIsSearchOpen(false); }}
                      placeholder="Rechercher..."
                      className="w-40 pl-8 pr-2 py-1.5 text-sm text-neutral-900 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                  </div>
                </form>
                <SearchDropdown widthClass="w-80" />
              </div>
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
                        <Link to="/account" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setIsAccountMenuOpen(false)}>Mon compte</Link>
                        <Link to="/account/orders" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setIsAccountMenuOpen(false)}>Mes commandes</Link>
                        <button
                          onClick={async () => {
                            try { await authService.logout(); } catch (e) { console.error(e); }
                            setIsLoggedIn(false);
                            setIsAccountMenuOpen(false);
                            window.location.href = '/';
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                        >
                          Déconnexion
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setIsAccountMenuOpen(false)}>Connexion</Link>
                        <Link to="/register" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50" onClick={() => setIsAccountMenuOpen(false)}>Créer un compte</Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* === Mobile (< lg) : logo à gauche + actions à droite === */}
        <div className="flex lg:hidden items-center justify-between h-24">
          <div className="flex items-center pl-2 h-full flex-shrink-0">
            <Link to="/" className="flex items-center h-full">
              <Logo size="xlarge" />
            </Link>
          </div>
          <div className="flex items-center space-x-2">
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
