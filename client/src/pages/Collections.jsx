import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { Filter } from 'lucide-react';
import productServicePublic from '../services/productServicePublic';

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

const Collections = ({ onAddToCart }) => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    console.log('Collections useEffect - category:', category);
    
    const loadProducts = async () => {
      setLoading(true);
      console.log('Loading products from API for category:', category);
      
      try {
        // Récupérer tous les produits depuis l'API
        let productsData = [];
        
        if (category) {
          console.log('Filtrage par catégorie:', category);
          productsData = await productServicePublic.getProductsByCategory(category);
        } else {
          productsData = await productServicePublic.getAllProducts();
        }
        
        // Formater les produits pour le composant ProductGrid
        const formattedProducts = Array.isArray(productsData) ? productsData.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.name.toLowerCase().replace(/\s+/g, '-'),
          price: product.price,
          compare_price: product.compare_price || null,
          description: product.description,
          category: { name: typeof product.category === 'string' ? product.category : product.category?.name || 'Non catégorisé' },
          images: product.images && product.images.length > 0
            ? product.images.map(u => resolveImageUrl(u))
            : ['/images/placeholder-product.jpg'],
          featured: product.status === 'active',
          rating: product.rating || 4,
          reviews_count: product.reviews_count || 0,
          inventory_quantity: product.stock || 0,
          stock: product.stock || 0,
          reviews: product.reviews_count || 0
        })) : [];
        
        console.log('Produits formatés:', formattedProducts.map(p => `${p.name} (${p.category.name})`));
        setProducts(formattedProducts);
        
        // Informations sur la catégorie
        if (category) {
          const categoryNames = {
            'nappes': 'Nappes',
            't-shirts': 'T-Shirts',
            'polos': 'Polos',
            'pantalons': 'Pantalons',
            'nappes-de-table': 'Nappes',
            'tshirt': 'T-Shirts',
            'polo': 'Polos',
            'pantalon': 'Pantalons',
            'vêtements': 'Vêtements',
            'accessoires': 'Accessoires',
            'linge de maison': 'Linge de maison',
            'electronique': 'Electronique',
            'autre': 'Autre'
          };
          
          setCategoryInfo({
            name: categoryNames[category.toLowerCase()] || category.charAt(0).toUpperCase() + category.slice(1),
            description: `Découvrez notre collection de ${categoryNames[category.toLowerCase()] || category} de qualité supérieure.`
          });
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
        // En cas d'erreur, utiliser les données mockées comme fallback
        console.log('Fallback vers les données mockées');
        
        // Importer le service de données mockées uniquement en fallback
        const productDataService = await import('../services/productDataService');
        let fallbackProducts = productDataService.default.getAllProducts();
        
        if (category) {
          fallbackProducts = productDataService.default.getProductsByCategory(category);
        }
        
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [category]);

  const handleAddToCart = (product) => {
    console.log('Ajouté au panier:', product.name);
    // Utiliser la fonction passée depuis App.jsx
    onAddToCart?.(product);
  };

  const handleAddToWishlist = (product, isAdded) => {
    console.log(isAdded ? 'Ajouté aux favoris' : 'Retiré des favoris:', product.name);
    // Logique d'ajout/retrait des favoris ici
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header de catégorie */}
      <div className="bg-white border-b border-neutral-100">
        <div className="container mx-auto px-4 py-8">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li><Link to="/" className="text-neutral-600 hover:text-primary-500">Accueil</Link></li>
              <li className="text-neutral-400">/</li>
              <li><Link to="/collections" className="text-neutral-600 hover:text-primary-500">Collections</Link></li>
              {category && (
                <>
                  <li className="text-neutral-400">/</li>
                  <li className="text-neutral-900 font-medium capitalize">{category}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-luxury font-bold text-neutral-900 mb-2">
                {categoryInfo ? categoryInfo.name : 'Toutes les collections'}
              </h1>
              {categoryInfo && (
                <p className="text-neutral-600">{categoryInfo.description}</p>
              )}
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors">
              <Filter className="w-4 h-4" />
              <span>Filtres</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grille de produits */}
      <div className="container mx-auto px-4 py-8">
        <ProductGrid
          products={products}
          loading={loading}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleAddToWishlist}
        />
      </div>
    </div>
  );
};

export default Collections;
