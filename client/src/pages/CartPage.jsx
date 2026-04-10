import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight,
  CreditCard,
  Truck
} from 'lucide-react';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Simuler le chargement du panier
    setTimeout(() => {
      const mockCartItems = [
        {
          id: 1,
          product_id: 1,
          name: 'Nappe de Table Luxe',
          slug: 'nappe-de-table-luxe',
          price: 89.99,
          quantity: 1,
          image: '/images/Nape%20de%20table.PNG',
          images: ['/images/Nape%20de%20table.PNG'],
          category: { name: 'Nappes' }
        },
        {
          id: 2,
          product_id: 2,
          name: 'T-shirt Premium',
          slug: 'tshirt-premium',
          price: 39.99,
          quantity: 1,
          image: '/images/T-shirts1.PNG',
          images: ['/images/T-shirts1.PNG'],
          category: { name: 'T-Shirts' }
        }
      ];

      setCartItems(mockCartItems);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    // Calculer les totaux
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const newShipping = newSubtotal >= 200 ? 0 : newSubtotal > 0 ? 9.99 : 0;
    const newTotal = newSubtotal + newShipping;

    setSubtotal(newSubtotal);
    setShipping(newShipping);
    setTotal(newTotal);
  }, [cartItems]);

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCartItems(items =>
      items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            quantity: newQuantity,
            total: item.price * newQuantity
          };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId) => {
    setCartItems(items => items.filter(item => item.id !== itemId));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-2">
            Mon panier
          </h1>
          <p className="text-neutral-600">
            {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
          </p>
        </div>

        {cartItems.length === 0 ? (
          /* Panier vide */
          <div className="text-center py-16">
            <div className="text-neutral-300 mb-6">
              <ShoppingCart className="w-24 h-24 mx-auto" />
            </div>
            <h2 className="text-2xl font-luxury font-semibold text-neutral-900 mb-4">
              Votre panier est vide
            </h2>
            <p className="text-neutral-600 mb-8">
              Découvrez nos créations uniques et commencez vos achats
            </p>
            <Link
              to="/collections"
              className="btn-luxury"
            >
              Commencer mes achats
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Articles du panier */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex space-x-4">
                    {/* Image produit */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image_url || '/images/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = '/images/placeholder-product.jpg';
                        }}
                      />
                    </div>

                    {/* Détails produit */}
                    <div className="flex-1">
                      <div className="flex justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-neutral-900">
                            <Link to={`/product/${item.slug}`} className="hover:text-primary-500 transition-colors">
                              {item.name}
                            </Link>
                          </h3>
                          {item.variant_name && (
                            <p className="text-sm text-neutral-500">{item.variant_name}</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 border border-neutral-200 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-primary-500">
                            {formatPrice(item.total)}
                          </div>
                          <div className="text-sm text-neutral-500">
                            {formatPrice(item.price)} par article
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Récapitulatif et checkout */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-6">Récapitulatif</h2>

                {/* Calcul des totaux */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Sous-total</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Livraison</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
                    </span>
                  </div>

                  {shipping > 0 && (
                    <div className="text-xs text-primary-500 bg-primary-50 p-2 rounded">
                      Plus que {formatPrice(200 - subtotal)} pour la livraison gratuite !
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-lg">Total</span>
                      <span className="font-bold text-lg text-primary-500">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="w-full bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Commander</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to="/collections"
                    className="w-full border border-neutral-200 text-neutral-700 py-3 rounded-lg font-medium hover:bg-neutral-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <span>Continuer mes achats</span>
                  </Link>
                </div>

                {/* Services */}
                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <Truck className="w-4 h-4 text-primary-500" />
                    <span>Livraison offerte à partir de 200€</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-600">
                    <CreditCard className="w-4 h-4 text-primary-500" />
                    <span>Paiement 100% sécurisé</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
