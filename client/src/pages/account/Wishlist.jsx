import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, Star, Eye } from 'lucide-react';
import productDataService from '../../services/productDataService';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      // Charger les favoris depuis localStorage
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const savedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      setWishlist(savedWishlist);
      
      console.log('=== WISHLIST LOADED ===');
      console.log('Items in wishlist:', savedWishlist.length);
    } catch (error) {
      console.error('Erreur chargement favoris:', error);
      setWishlist([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = (productId) => {
    const updatedWishlist = wishlist.filter(item => item.id !== productId);
    setWishlist(updatedWishlist);
    localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
    
    console.log(`Produit ${productId} retiré des favoris`);
  };

  const addToCart = (product) => {
    // Simulation d'ajout au panier
    console.log('Ajout au panier:', product.name);
    // En production, appeler le service panier
    alert(`${product.name} ajouté au panier !`);
  };

  // Ajouter des produits de test aux favoris (pour démonstration)
  const addTestProducts = () => {
    const testProducts = productDataService.getTestWishlistProducts();
    
    localStorage.setItem('wishlist', JSON.stringify(testProducts));
    setWishlist(testProducts);
    console.log('Produits de test ajoutés aux favoris:', testProducts.map(p => p.name));
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<Star key="half" className="w-4 h-4 fill-yellow-200 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mes favoris</h2>
        <p className="text-gray-600">Les produits que vous avez ajoutés à vos favoris</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <Heart className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun favori</h3>
          <p className="text-gray-600 mb-4">Vous n'avez pas encore ajouté de produit à vos favoris.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              onClick={addTestProducts}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Ajouter des produits de test
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Découvrir nos produits
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {wishlist.length} produit{wishlist.length > 1 ? 's' : ''} dans vos favoris
            </p>
            <button className="text-sm text-red-600 hover:text-red-700 transition-colors">
              Vider les favoris
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden group">
                <div className="relative">
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/300x300?text=${encodeURIComponent(product.name)}`;
                      }}
                    />
                  </div>
                  
                  {/* Badge de réduction */}
                  {product.originalPrice && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </div>
                  )}
                  
                  {/* Badge de stock */}
                  {!product.inStock && (
                    <div className="absolute top-2 right-2 bg-gray-800 text-white px-2 py-1 rounded-md text-xs font-medium">
                      Rupture
                    </div>
                  )}
                  
                  {/* Actions rapides */}
                  <div className="absolute top-2 right-2 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {product.category}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>
                  
                  <div className="flex items-center space-x-1 mb-3">
                    {renderStars(product.rating)}
                    <span className="text-xs text-gray-600">
                      ({product.reviews})
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-gray-900">
                          {product.price.toLocaleString('fr-FR')} Ar
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {product.originalPrice.toLocaleString('fr-FR')} Ar
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.inStock}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        product.inStock
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <ShoppingBag className="w-4 h-4" />
                        <span>{product.inStock ? 'Ajouter au panier' : 'Indisponible'}</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => removeFromWishlist(product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Ajouté le {new Date(product.addedDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
