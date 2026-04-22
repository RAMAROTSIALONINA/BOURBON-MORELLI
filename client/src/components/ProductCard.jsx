import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Star, Eye } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';
import { Link } from 'react-router-dom';
import productDataService from '../services/productDataService';

// Base URL du backend (pour servir les images en bypassant le proxy React)
const BACKEND_URL = 'http://localhost:5003';

// Transforme "/uploads/products/xxx.png" → "http://localhost:5003/uploads/products/xxx.png"
// Laisse inchangé les URLs absolues (http://...) et les chemins /images/... du seed
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

const ProductCard = ({ product, onAddToCart, onAddToWishlist }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Vérifier si le produit est déjà dans les favoris au chargement
  useEffect(() => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    setIsInWishlist(wishlist.some(item => item.id === product.id));
  }, [product.id]);

  // Au survol : afficher automatiquement la 2e image si dispo, sinon garder la 1ère
  const displayedImageIndex = isHovered && product.images?.length > 1 ? 1 : currentImage;

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleAddToWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
    const newIsInWishlist = !isInWishlist;
    
    if (newIsInWishlist) {
      // Ajouter aux favoris en utilisant le service centralisé
      const wishlistItem = productDataService.formatForWishlist(product);
      
      wishlist.push(wishlistItem);
      console.log(`"${product.name}" ajouté aux favoris`);
    } else {
      // Retirer des favoris
      const updatedWishlist = wishlist.filter(item => item.id !== product.id);
      localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
      console.log(`"${product.name}" retiré des favoris`);
      return; // Sortir car on a déjà mis à jour le localStorage
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
    setIsInWishlist(newIsInWishlist);
    
    // Notifier le composant parent
    onAddToWishlist?.(product, newIsInWishlist);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getDiscountPercentage = (price, comparePrice) => {
    if (!comparePrice || comparePrice <= price) return null;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  };

  const discountPercentage = getDiscountPercentage(product.price, product.compare_price);

  return (
    <div
      className="product-card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/product/${product.slug}`} className="block">
        {/* Product images */}
        <div className="product-image-container relative h-80 overflow-hidden bg-neutral-100">
          {/* Badges en haut */}
          {discountPercentage && (
            <div className="absolute top-3 left-3 z-20 bg-red-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-md">
              -{discountPercentage}%
            </div>
          )}

          {product.featured && (
            <div className="absolute top-3 right-3 z-20 bg-primary-500 text-white px-2.5 py-1 rounded-md text-xs font-semibold shadow-md">
              Nouveau
            </div>
          )}

          {/* Zone images : stack d'images avec fondu au survol */}
          {product.images && product.images.length > 0 ? (
            <>
              {product.images.slice(0, 5).map((image, index) => (
                <img
                  key={index}
                  src={resolveImageUrl(image)}
                  alt={product.name}
                  loading="lazy"
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                    displayedImageIndex === index ? 'opacity-100' : 'opacity-0'
                  }`}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/BOURBON MORELLI.png';
                  }}
                />
              ))}
            </>
          ) : (
            <ImagePlaceholder
              className="absolute inset-0 w-full h-full"
              alt={product.name}
              showLogo={false}
            />
          )}

          {/* Hover overlay with actions */}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 z-10 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="flex space-x-2">
              <button
                onClick={handleAddToCart}
                className="bg-white text-neutral-900 p-3 rounded-full hover:bg-primary-500 hover:text-white transition-colors duration-300 transform hover:scale-110"
                title="Ajouter au panier"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>

              <button
                onClick={handleAddToWishlist}
                className={`p-3 rounded-full transition-colors duration-300 transform hover:scale-110 ${
                  isInWishlist
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-neutral-900 hover:bg-red-500 hover:text-white'
                }`}
                title="Ajouter aux favoris"
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>

              <button
                className="bg-white text-neutral-900 p-3 rounded-full hover:bg-primary-500 hover:text-white transition-colors duration-300 transform hover:scale-110"
                title="Aperçu rapide"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Pagination dots (en bas, cliquables) */}
          {product.images && product.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20">
              <div className="flex items-center space-x-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full">
                {product.images.slice(0, 5).map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImage(index);
                    }}
                    className={`transition-all rounded-full ${
                      currentImage === index
                        ? 'w-4 h-1.5 bg-primary-500'
                        : 'w-1.5 h-1.5 bg-neutral-400 hover:bg-neutral-600'
                    }`}
                    aria-label={`Voir vue ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product info */}
        <div className="p-4">
          {/* Category */}
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">
            {product.category?.name || 'Textile'}
          </div>

          {/* Product name */}
          <h3 className="font-luxury text-lg font-semibold text-neutral-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < (product.rating || 4)
                      ? 'text-yellow-400 fill-current'
                      : 'text-neutral-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-neutral-500">
              ({product.reviews_count || 0})
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl font-bold text-neutral-900">
              {formatPrice(product.price)}
            </span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-lg text-neutral-500 line-through">
                {formatPrice(product.compare_price)}
              </span>
            )}
          </div>

          {/* Stock status */}
          {product.inventory_quantity !== undefined && (
            <div className="mb-4">
              {product.inventory_quantity > 0 ? (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600">
                    En stock ({product.inventory_quantity} disponibles)
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-red-600">
                    Rupture de stock
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick add to cart button (mobile) */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors duration-300 lg:hidden"
            disabled={product.inventory_quantity === 0}
          >
            {product.inventory_quantity === 0 ? 'Rupture de stock' : 'Ajouter au panier'}
          </button>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
