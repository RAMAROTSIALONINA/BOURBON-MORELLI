import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Minus, 
  Plus, 
  Truck, 
  Shield, 
  RefreshCw,
  Share2
} from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    console.log('ProductDetail useEffect - slug:', slug);
    
    // Utiliser l'API backend au lieu des données mockées
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('Fetching product from URL:', `/api/products/${slug}`);
        
        const response = await fetch(`/api/products/${slug}`);
        
        if (!response.ok) {
          throw new Error('Product not found');
        }
        
        const productData = await response.json();
        console.log('Product API Response:', productData);
        
        setProduct(productData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching product:', error);
        
        // Fallback vers les données mockées si l'API échoue
        const mockProducts = [
          {
            id: 1,
            name: 'Nappe de Table Luxe',
            slug: 'nappe-de-table-luxe',
            price: 89.99,
            compare_price: 119.99,
            description: 'Une nappe de table élégante en coton premium, parfaite pour les occasions spéciales. Cette nappe apporte une touche de sophistication à votre table avec sa texture douce et son design intemporel.',
            images: ['/images/Nape%20de%20table.PNG', '/images/Nappe%20de%20table1.PNG', '/images/Nape%20de%20table2.PNG'],
            category: { name: 'Nappes', slug: 'nappes' },
            featured: true,
            rating: 5,
            reviews_count: 12,
            inventory_quantity: 5,
            variants: [
              {
                id: 1,
                name: 'Nappe Luxe Taille 140x200',
                sku: 'NPL001-140',
                price: 89.99,
                inventory_quantity: 2,
                options: [
                  { name: 'Taille', value: '140x200 cm' },
                  { name: 'Couleur', value: 'Blanc' }
                ]
              },
              {
                id: 2,
                name: 'Nappe Luxe Taille 180x260',
                sku: 'NPL001-180',
                price: 119.99,
                inventory_quantity: 3,
                options: [
                  { name: 'Taille', value: '180x260 cm' },
                  { name: 'Couleur', value: 'Blanc' }
                ]
              }
            ],
            similar_products: []
          },
          {
            id: 2,
            name: 'T-shirt Premium',
            slug: 'tshirt-premium',
            price: 39.99,
            compare_price: 59.99,
            description: 'T-shirt en coton bio de haute qualité, confortable et durable. Parfait pour un usage quotidien avec son design moderne et épuré.',
            images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
            category: { name: 'T-Shirts', slug: 't-shirts' },
            featured: true,
            rating: 4,
            reviews_count: 8,
            inventory_quantity: 3,
            variants: [
              {
                id: 3,
                name: 'T-shirt Taille M',
                sku: 'TSP001-M',
                price: 39.99,
                inventory_quantity: 1,
                options: [
                  { name: 'Taille', value: 'M' },
                  { name: 'Couleur', value: 'Blanc' }
                ]
              },
              {
                id: 4,
                name: 'T-shirt Taille L',
                sku: 'TSP001-L',
                price: 39.99,
                inventory_quantity: 2,
                options: [
                  { name: 'Taille', value: 'L' },
                  { name: 'Couleur', value: 'Blanc' }
                ]
              }
            ],
            similar_products: []
          },
          {
            id: 3,
            name: 'Polo Classique',
            slug: 'polo-classique',
            price: 49.99,
            compare_price: 69.99,
            description: 'Polo en piqué de coton avec col traditionnel, idéal pour le sport et le casual. Conçu pour offrir confort et style.',
            images: ['/images/Polos.PNG', '/images/Polos%201.PNG', '/images/Polos%202.PNG'],
            category: { name: 'Polos', slug: 'polos' },
            featured: false,
            rating: 4,
            reviews_count: 6,
            inventory_quantity: 15,
            variants: [
              {
                id: 5,
                name: 'Polo Taille M',
                sku: 'PLC001-M',
                price: 49.99,
                inventory_quantity: 5,
                options: [
                  { name: 'Taille', value: 'M' },
                  { name: 'Couleur', value: 'Bleu' }
                ]
              },
              {
                id: 6,
                name: 'Polo Taille L',
                sku: 'PLC001-L',
                price: 49.99,
                inventory_quantity: 10,
                options: [
                  { name: 'Taille', value: 'L' },
                  { name: 'Couleur', value: 'Bleu' }
                ]
              }
            ],
            similar_products: []
          },
          {
            id: 4,
            name: 'Pantalon Chic',
            slug: 'pantalon-chic',
            price: 79.99,
            compare_price: 99.99,
            description: 'Pantalon élégant en laine mélangée, parfait pour le bureau et les événements. Coupe moderne et ajustée pour un look professionnel.',
            images: ['/images/Pantalons.PNG', '/images/Pantalons%201.PNG', '/images/Pantalons%202.PNG'],
            category: { name: 'Pantalons', slug: 'pantalons' },
            featured: true,
            rating: 5,
            reviews_count: 10,
            inventory_quantity: 8,
            variants: [
              {
                id: 7,
                name: 'Pantalon Taille 40',
                sku: 'PCH001-40',
                price: 79.99,
                inventory_quantity: 3,
                options: [
                  { name: 'Taille', value: '40' },
                  { name: 'Couleur', value: 'Noir' }
                ]
              },
              {
                id: 8,
                name: 'Pantalon Taille 42',
                sku: 'PCH001-42',
                price: 79.99,
                inventory_quantity: 5,
                options: [
                  { name: 'Taille', value: '42' },
                  { name: 'Couleur', value: 'Noir' }
                ]
              }
            ],
            similar_products: []
          }
        ];
        
        // Trouver le produit par slug
        const foundProduct = mockProducts.find(p => p.slug === slug);
        console.log('Fallback - Produit trouvé:', foundProduct?.name || 'Non trouvé');
        
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          console.error('Produit non trouvé pour le slug:', slug);
          // Rediriger vers la page 404 ou collections
          window.location.href = '/collections';
        }
        
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    console.log('Ajouté au panier:', product.name, 'Quantité:', quantity);
    // Logique d'ajout au panier ici
  };

  const handleAddToWishlist = () => {
    setIsInWishlist(!isInWishlist);
    console.log(isInWishlist ? 'Retiré des favoris' : 'Ajouté aux favoris:', product.name);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-luxury font-bold mb-4">Produit non trouvé</h1>
          <Link to="/collections" className="btn-luxury">
            Retour aux collections
          </Link>
        </div>
      </div>
    );
  }

  const discountPercentage = getDiscountPercentage(product.price, product.compare_price);
  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.inventory_quantity || product.inventory_quantity;

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-8">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link to="/" className="text-neutral-600 hover:text-primary-500">Accueil</Link></li>
            <li className="text-neutral-400">/</li>
            <li><Link to="/collections" className="text-neutral-600 hover:text-primary-500">Collections</Link></li>
            <li className="text-neutral-400">/</li>
            <li><Link to={`/collections/${product.category_name?.toLowerCase()}`} className="text-neutral-600 hover:text-primary-500">{product.category_name}</Link></li>
            <li className="text-neutral-400">/</li>
            <li className="text-neutral-900 font-medium">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Image principale */}
            <div className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImage] || '/images/BOURBON MORELLI.png'}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = '/images/BOURBON MORELLI.png';
                }}
              />
              
              {discountPercentage && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-20 h-20 border-2 rounded-lg overflow-hidden transition-colors ${
                    selectedImage === index ? 'border-primary-500' : 'border-neutral-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Informations produit */}
          <div className="space-y-6">
            {/* Titre et prix */}
            <div>
              <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-2">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < product.rating ? 'text-yellow-400 fill-current' : 'text-neutral-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-neutral-600">
                  {product.reviews_count} avis
                </span>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-primary-500">
                  {formatPrice(currentPrice)}
                </span>
                {product.compare_price && product.compare_price > currentPrice && (
                  <span className="text-xl text-neutral-500 line-through">
                    {formatPrice(product.compare_price)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <p className="text-neutral-600 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Variantes */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.inventory_quantity === 0}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300'
                      } ${
                        variant.inventory_quantity === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : 'cursor-pointer'
                      }`}
                    >
                      <div className="font-medium">{variant.name}</div>
                      {variant.inventory_quantity === 0 ? (
                        <div className="text-red-500 text-sm">Rupture de stock</div>
                      ) : (
                        <div className="text-neutral-500 text-sm">
                          {variant.inventory_quantity} disponible(s)
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantité et actions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">Quantité</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 text-center border border-neutral-200 rounded-lg py-2"
                    min="1"
                    max={currentStock}
                  />
                  <button
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    className="w-10 h-10 border border-neutral-200 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {currentStock <= 5 && currentStock > 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Plus que {currentStock} article(s) en stock !
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  disabled={currentStock === 0}
                  className="flex-1 bg-primary-500 text-white py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors disabled:bg-neutral-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{currentStock === 0 ? 'Rupture de stock' : 'Ajouter au panier'}</span>
                </button>
                
                <button
                  onClick={handleAddToWishlist}
                  className={`p-3 border rounded-lg transition-colors ${
                    isInWishlist
                      ? 'border-red-500 bg-red-50 text-red-500'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
                </button>

                <button className="p-3 border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Services */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6 border-t border-b border-neutral-200">
              <div className="flex items-center space-x-3">
                <Truck className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="font-medium">Livraison gratuite</div>
                  <div className="text-sm text-neutral-600">À partir de 200€</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="font-medium">Satisfait ou remboursé</div>
                  <div className="text-sm text-neutral-600">30 jours</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="font-medium">Retour facile</div>
                  <div className="text-sm text-neutral-600">Sans frais</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        {product.similar_products && product.similar_products.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-8">
              Vous pourriez aussi aimer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.similar_products.map((similarProduct) => (
                <div key={similarProduct.id} className="card-luxury p-4">
                  <img
                    src={similarProduct.images?.[0] || '/images/BOURBON MORELLI.png'}
                    alt={similarProduct.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                  <h3 className="font-luxury font-semibold mb-2">{similarProduct.name}</h3>
                  <div className="text-primary-500 font-bold mb-4">
                    {formatPrice(similarProduct.price)}
                  </div>
                  <Link
                    to={`/product/${similarProduct.slug}`}
                    className="btn-luxury-outline w-full text-center"
                  >
                    Voir le produit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
