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
import About from './pages/About';
import Contact from './pages/Contact';
import Account from './pages/Account';

// Pages Login/Register (créées si nécessaire ou redirigées)
// import Login from './pages/Login';
// import Register from './pages/Register';

// Pages admin
import AdminLogin from './admin/pages/AdminLogin';
import AdminLayout from './admin/components/AdminLayout';

// Styles
import './index.css';

function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Charger le compteur du panier au démarrage
    const updateCartCount = () => {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        // setCartCount(count);
      }
    };

    updateCartCount();

    // Écouter les changements dans le localStorage (pour les autres onglets)
    const handleStorageChange = (e) => {
      if (e.key === 'cart') {
        updateCartCount();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleCheckout = () => {
    // Rediriger vers la page de checkout
    window.location.href = '/checkout';
  };

  // Vérifier si on est sur une page admin
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header public seulement sur les pages non-admin */}
      {!isAdminPage && <Header />}
      
      <main className="flex-grow">
        <Routes>
          {/* Routes publiques */}
          <Route path="/" element={<Home />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/collections/:category" element={<Collections />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          {/* Routes Login/Register - temporairement redirigées */}
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
          
          {/* Routes protégées (compte utilisateur) */}
          <Route path="/account" element={<Account />} />
          <Route path="/account/orders" element={<Account />} />
          <Route path="/account/wishlist" element={<Account />} />
          <Route path="/account/profile" element={<Account />} />
          
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
