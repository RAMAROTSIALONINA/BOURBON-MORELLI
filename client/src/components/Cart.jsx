import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return '/images/BOURBON MORELLI.png';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    return `${BACKEND_URL}/${url.replace(/^\//, '')}`;
  }
  return url;
};

const Cart = ({ isOpen, onClose, onCheckout }) => {
  const [cartItems, setCartItems] = useState([]);

  // Charger le panier depuis localStorage au montage
  useEffect(() => {
    // Nettoyage unique des anciennes données de démo (Nappe + T-shirt forcés)
    const CART_CLEANUP_FLAG = 'cart_demo_cleaned_v1';
    if (!localStorage.getItem(CART_CLEANUP_FLAG)) {
      try {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        const isDemoCart = Array.isArray(stored) && stored.some(
          (it) => it?.name === 'Nappe de Table Luxe' || it?.name === 'T-shirt Premium'
        );
        if (isDemoCart) {
          localStorage.removeItem('cart');
          console.log('🧹 Anciennes données de démo supprimées du panier');
        }
      } catch (e) { /* ignore */ }
      localStorage.setItem(CART_CLEANUP_FLAG, '1');
    }

    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]');
      if (Array.isArray(stored)) {
        setCartItems(stored);
      }
    } catch (e) {
      setCartItems([]);
    }
  }, []);

  // Recharger à chaque ouverture (au cas où ajouté depuis une autre page)
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(stored)) {
          setCartItems(stored);
        }
      } catch (e) {
        setCartItems([]);
      }
    }
  }, [isOpen]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const removeItem = (itemId) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedItems);
    localStorage.setItem('cart', JSON.stringify(updatedItems));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const calculateSubtotal = () => {
    console.log('🧮 Début calcul subtotal, cartItems:', cartItems);
    console.log('🔍 Longueur cartItems:', cartItems.length);
    
    if (cartItems.length === 0) {
      console.log('⚠️ Panier vide, retour 0');
      return 0;
    }
    
    const result = cartItems.reduce((total, item, index) => {
      console.log(`🔍 Item ${index}:`, item);
      console.log(`🔍 Types: price=${typeof item.price}, quantity=${typeof item.quantity}`);
      
      // Vérifications de type robustes
      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0;
      const quantity = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
      const itemTotal = price * quantity;
      
      console.log(`🧮 Calcul item ${index}: ${item.name} = ${price} × ${quantity} = ${itemTotal}`);
      console.log(`🧮 Total en cours: ${total} + ${itemTotal} = ${total + itemTotal}`);
      
      return total + itemTotal;
    }, 0);
    
    console.log('🧮 Résultat final subtotal:', result);
    return result;
  };

  const calculateShipping = () => {
    const subtotal = calculateSubtotal();
    return subtotal >= 200 ? 0 : subtotal > 0 ? 9.99 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping();
  };

  const handleCheckout = () => {
    onClose();
    onCheckout?.();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-100">
            <h2 className="text-xl font-luxury font-bold text-neutral-900">
              Mon panier ({cartItems.length})
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-neutral-300 mb-4">
                  <ShoppingBag className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-luxury font-semibold text-neutral-900 mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-neutral-600 mb-6">
                  Découvrez nos créations uniques
                </p>
                <Link
                  to="/collections"
                  onClick={onClose}
                  className="inline-block bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
                >
                  Commencer mes achats
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex space-x-4 p-4 bg-neutral-50 rounded-lg">
                    {/* Product image */}
                    <div className="flex-shrink-0">
                      <img
                        src={resolveImageUrl(item.image_url || item.images?.[0] || item.image)}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg"
                        onLoad={(e) => {
                          console.log(`Cart Image chargée: ${item.name} -> ${e.target.src}`);
                        }}
                        onError={(e) => {
                          console.error(`Cart Image ERROR: ${item.name} -> ${e.target.src}`);
                          e.target.src = '/images/BOURBON MORELLI.png';
                        }}
                      />
                    </div>

                    {/* Product details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-neutral-900 truncate">
                        {item.name}
                      </h4>
                      {item.variant && (
                        <p className="text-sm text-neutral-500">
                          {item.variant}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-semibold text-primary-500">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-sm text-neutral-500">
                          {formatPrice(item.price)} par article
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-neutral-100 p-6 space-y-4">
              {/* Clear cart */}
              <div className="flex justify-end">
                <button
                  onClick={clearCart}
                  className="text-sm text-neutral-500 hover:text-red-500 transition-colors"
                >
                  Vider le panier
                </button>
              </div>

              {/* Order summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Sous-total</span>
                  <span className="font-medium">{formatPrice(calculateSubtotal())}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Livraison</span>
                  <span className="font-medium">
                    {calculateShipping() === 0 ? 'Gratuite' : formatPrice(calculateShipping())}
                  </span>
                </div>
                {calculateSubtotal() < 200 && calculateSubtotal() > 0 && (
                  <p className="text-xs text-primary-500">
                    Livraison offerte à partir de 200€
                  </p>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-neutral-100 pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold text-primary-500">
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Commander</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Continue shopping */}
              <Link
                to="/collections"
                onClick={onClose}
                className="block text-center text-neutral-600 hover:text-primary-500 transition-colors text-sm"
              >
                Continuer mes achats
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Cart;
