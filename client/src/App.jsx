import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Cart from './components/Cart';
import { Toaster } from 'react-hot-toast';

// Pages publiques
import Home from './pages/Home';
import Collections from './pages/Collections';
import ProductDetail from './pages/ProductDetail';
import CartPage from './pages/CartPage';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import TestPaymentGuide from './pages/TestPaymentGuide';
import About from './pages/About';
import Contact from './pages/Contact';
import Account from './pages/Account';

// Pages Login/Register
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Sous-pages du compte
import AccountIndex from './pages/account/index';
import Profile from './pages/account/Profile';
import Orders from './pages/account/Orders';
import Wishlist from './pages/account/Wishlist';
import Addresses from './pages/account/Addresses';
import Reviews from './pages/account/Reviews';

// Pages admin
import AdminLogin from './admin/pages/AdminLogin';
import AdminLayout from './admin/components/AdminLayout';

// Services
import cartService from './services/cartService';

// Styles
import './index.css';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Initialiser le compteur du panier
    setCartCount(cartService.getCartCount());

    // Écouter les mises à jour du panier
    const handleCartUpdate = () => {
      setCartCount(cartService.getCartCount());
    };

    // Écouter les événements custom du cartService
    window.addEventListener('cartUpdate', handleCartUpdate);
    
    // S'abonner au cartService
    const unsubscribe = cartService.subscribe(() => {
      setCartCount(cartService.getCartCount());
    });

    // Écouter les changements dans le localStorage (pour les autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        setCartCount(cartService.getCartCount());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('cartUpdate', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
      unsubscribe();
    };
  }, []);

  const handleCheckout = () => {
    // Rediriger vers la page de checkout
    window.location.href = '/checkout';
  };

  const handleAddToCart = (product) => {
    // Utiliser le cartService pour ajouter au panier
    cartService.addToCart(product);
    setCartCount(cartService.getCartCount());
  };

  // Vérifier si on est sur une page admin
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header public seulement sur les pages non-admin */}
      {!isAdminPage && <Header cartCount={cartCount} />}
      
      <main className={`flex-grow ${isAdminPage ? '' : 'pt-32 lg:pt-36'}`}>
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections onAddToCart={handleAddToCart} />} />
          <Route path="/collections/:category" element={<Collections onAddToCart={handleAddToCart} />} />
          <Route path="/product/:slug" element={<ProductDetail onAddToCart={handleAddToCart} />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/test-payments" element={<TestPaymentGuide />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Routes Login/Register */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Routes protégées (compte utilisateur) */}
          <Route path="/account" element={<Account />}>
            <Route index element={<AccountIndex />} />
            <Route path="profile" element={<Profile />} />
            <Route path="orders" element={<Orders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="reviews" element={<Reviews />} />
          </Route>
          
          {/* Routes admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          
          {/* Route par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      
      {/* Footer seulement sur les pages non-admin */}
      {!isAdminPage && <Footer />}
      
      {/* Panier latéral seulement sur les pages non-admin */}
      {!isAdminPage && (
        <Cart
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onCheckout={handleCheckout}
        />
      )}
      
      {/* Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#eab308',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

// Wrapper pour fournir le contexte Router
function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter;
