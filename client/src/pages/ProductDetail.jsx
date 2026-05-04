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
import ImagePlaceholder from '../components/ImagePlaceholder';
import ProductReviews from '../components/ProductReviews';
import { useCurrency } from '../contexts/CurrencyContext';
import { useWishlist } from '../contexts/WishlistContext';

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

const ProductDetail = ({ onAddToCart }) => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const { isInWishlist: isInWL, toggle: toggleWL } = useWishlist();

  // Fonction pour cliquer sur une image et la mettre en grand
  const handleImageClick = (index) => {
    console.log(`Clic sur image ${index + 1}`);
    setSelectedImageIndex(index);
  };

  useEffect(() => {
    console.log('ProductDetail useEffect - slug:', slug);
    
    // Utiliser l'API publique pour récupérer le produit
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('Fetching product from API for slug:', slug);
        
        // Essayer d'abord l'API publique
        try {
          const response = await fetch(`http://localhost:5003/api/public/products`);
          const data = await response.json();
          
          if (data.success && data.products) {
            const foundProduct = data.products.find(p => p.slug === slug);
            console.log('API - Produit trouvé:', foundProduct?.name || 'Non trouvé');
            
            if (foundProduct) {
              // Transformer les données pour correspondre au format attendu
              const transformedProduct = {
                ...foundProduct,
                images: foundProduct.images || ['/images/BOURBON MORELLI.png'],
                inventory_quantity: foundProduct.stock || 0,
                category_name: typeof foundProduct.category === 'string' ? foundProduct.category : foundProduct.category?.name,
                compare_price: foundProduct.compare_price || null,
                sizes: foundProduct.sizes || [],
                variants: [],
                similar_products: []
              };
              
              console.log('=== PRODUCT DETAIL DEBUG ===');
              console.log('Produit trouvé:', foundProduct.name);
              console.log('Images brutes de l\'API:', foundProduct.images);
              console.log('Type d\'images:', typeof foundProduct.images);
              console.log('Est un tableau:', Array.isArray(foundProduct.images));
              console.log('Images transformées:', transformedProduct.images);
              console.log('Nombre d\'images:', transformedProduct.images.length);
              
              // Vérifier si les images sont bien un tableau
              if (Array.isArray(foundProduct.images)) {
                console.log('✅ Images est bien un tableau');
                foundProduct.images.forEach((img, idx) => {
                  console.log(`  Image API ${idx + 1}: "${img}" (type: ${typeof img})`);
                });
              } else {
                console.log('❌ Images n\'est PAS un tableau !');
                console.log('Contenu:', foundProduct.images);
              }
              
              setProduct(transformedProduct);
              setLoading(false);
              return;
            }
          }
        } catch (apiError) {
          console.log('API non disponible, utilisation des données mockées:', apiError.message);
        }
        
        // Fallback vers les données mockées si l'API échoue
        const mockProducts = [
          {
            id: 1,
            name: 'Nappe de Table Luxe',
            slug: 'nappe-de-table-luxe',
            price: 89.99,
            compare_price: 119.99,
            description: 'Une nappe de table élégante en coton premium, parfaite pour les occasions spéciales. Cette nappe apporte une touche de sophistication à votre table avec sa texture douce et son design intemporel.',
            images: ['/images/Nape%20de%20table.PNG', '/images/Nappe%20de%20table1.PNG', '/images/Nappe%20de%20table2.PNG'],
            category: { name: 'Nappes', slug: 'nappes' },
            featured: true,
            rating: 5,
            reviews_count: 12,
            inventory_quantity: 5,
            sizes: ['120x180cm', '140x200cm', '160x240cm'],
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
            sizes: ['S', 'M', 'L', 'XL'],
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
            sizes: ['S', 'M', 'L', 'XL', 'XXL'],
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
            sizes: ['30', '32', '34', '36', '38', '40'],
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
          },
          {
            id: 2,
            name: 'T-shirt Premium',
            slug: 'tshirt-premium',
            price: 39.99,
            compare_price: 59.99,
            description: 'T-shirt en coton bio de haute qualité, confortable et élégant. Parfait pour un usage quotidien avec sa coupe moderne et son tissu respirant.',
            images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
            category: { name: 'T-Shirts', slug: 't-shirts' },
            featured: true,
            rating: 4,
            reviews_count: 8,
            inventory_quantity: 3,
            sizes: ['S', 'M', 'L', 'XL'],
            variants: [
              {
                id: 2,
                name: 'T-shirt Premium Taille M',
                sku: 'TSP002-M',
                price: 39.99,
                inventory_quantity: 1,
                options: [
                  { name: 'Taille', value: 'M' },
                  { name: 'Couleur', value: 'Blanc' }
                ]
              },
              {
                id: 3,
                name: 'T-shirt Premium Taille L',
                sku: 'TSP002-L',
                price: 39.99,
                inventory_quantity: 2,
                options: [
                  { name: 'Taille', value: 'L' },
                  { name: 'Couleur', value: 'Blanc' }
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
      } catch (error) {
        console.error('Error in fetchProduct:', error);
        setLoading(false);
      }
    };
    
    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    if (currentStock === 0) return;

    // Vérifier si une taille est sélectionnée (quand des tailles sont disponibles)
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      alert('Veuillez sélectionner une taille');
      return;
    }

    // Utiliser l'image sélectionnée dans la galerie (miniature cliquée)
    const selectedImage =
      (product.images && product.images[selectedImageIndex]) || product.image_url || product.images?.[0];

    // Créer le produit avec la taille sélectionnée, l'image choisie et le stock disponible
    const base = {
      ...product,
      image_url: selectedImage,
      image: selectedImage,
      stock_quantity: currentStock  // transmis à cartService pour limiter la quantité
    };
    const productWithSize = selectedSize
      ? { ...base, selectedSize, name: `${product.name} - Taille ${selectedSize}` }
      : base;

    // Ajouter la quantité demandée en un seul appel (évite les appels en boucle)
    const result = onAddToCart?.(productWithSize, quantity);

    const sizeInfo = selectedSize ? ` (Taille ${selectedSize})` : '';

    if (result && result.success === false && result.reason === 'stock_exceeded') {
      alert(`Stock insuffisant. Il ne reste que ${result.available} article(s) disponible(s) (vous en avez déjà ${result.current} dans votre panier).`);
      return;
    }

    console.log(`✅ "${product.name}${sizeInfo}" ajouté au panier (x${quantity})`);
    alert(`${product.name}${sizeInfo} ajouté au panier (quantité : ${quantity})`);
  };

  const isInWishlist = product ? isInWL(product.id) : false;
  const handleAddToWishlist = async () => {
    if (!product) return;
    await toggleWL(product.id);
  };

  const { format: formatPrice } = useCurrency();

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
          {/* Images - Toutes les images en grille */}
          <div className="space-y-4">
            <div className="space-y-4">
              {product.images && product.images.length > 0 ? (
                <>
                  {/* Image principale en grand (celle qui est sélectionnée) */}
                  <div className="relative group rounded-lg overflow-hidden bg-neutral-50 aspect-square">
                    <img
                      src={resolveImageUrl(product.images[selectedImageIndex])}
                      alt={`${product.name} - vue ${selectedImageIndex + 1}`}
                      className="block w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/BOURBON MORELLI.png';
                      }}
                    />
                  </div>

                  {/* Toutes les images en vignettes (y compris l'image principale) */}
                  <div className="flex flex-wrap gap-2">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        onMouseEnter={() => setSelectedImageIndex(index)}
                        onClick={() => handleImageClick(index)}
                        className={`relative group rounded-lg overflow-hidden bg-neutral-50 w-20 h-20 flex-shrink-0 cursor-pointer transition-all ${
                          selectedImageIndex === index
                            ? 'ring-2 ring-primary-500'
                            : 'hover:opacity-80 opacity-90'
                        }`}
                      >
                        <img
                          src={resolveImageUrl(image)}
                          alt={`${product.name} - vue ${index + 1}`}
                          className="block w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/images/BOURBON MORELLI.png';
                          }}
                        />
                        
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="col-span-2">
                  <ImagePlaceholder 
                    className="w-full h-64" 
                    alt={product.name}
                    showLogo={false}
                  />
                </div>
              )}
            </div>
            
            {/* Badge de réduction sur la première image */}
            {discountPercentage && product.images && product.images.length > 0 && (
              <div className="text-sm text-neutral-600 text-center">
                <span className="inline-flex items-center bg-red-500 text-white px-3 py-1 rounded-md text-sm font-semibold">
                  -{discountPercentage}% sur ce produit
                </span>
              </div>
            )}
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
                        i < product.rating ? 'text-gray-600 fill-current' : 'text-neutral-300'
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

            {/* Tailles disponibles */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Tailles disponibles</h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg transition-colors ${
                        selectedSize === size
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-neutral-300 hover:border-primary-500 hover:bg-primary-50'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {selectedSize && (
                  <p className="text-sm text-neutral-600 mt-2">
                    Taille sélectionnée : {selectedSize}
                  </p>
                )}
              </div>
            )}

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

        {/* Avis clients */}
        <ProductReviews productId={product.id} />

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
                    src={resolveImageUrl(similarProduct.images?.[0]) || '/images/BOURBON MORELLI.png'}
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
