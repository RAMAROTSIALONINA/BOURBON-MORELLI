import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { Filter } from 'lucide-react';
import productDataService from '../services/productDataService';

const Collections = ({ onAddToCart }) => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState(null);

  // Utiliser le service centralisé pour les produits
  const getAllProducts = () => {
    return productDataService.getAllProducts();
  };

  useEffect(() => {
    console.log('Collections useEffect - category:', category);
    
    const loadProducts = async () => {
      setLoading(true);
      console.log('Loading products from mock data for category:', category);
      
      // Filtrer par catégorie si spécifiée
      let filteredProducts = getAllProducts();
      
      if (category) {
        console.log('Filtrage par catégorie:', category);
        filteredProducts = productDataService.getProductsByCategory(category);
        console.log('Produits filtrés:', filteredProducts.map(p => `${p.name} (${p.category.name})`));
      }

      console.log('Produits finaux:', filteredProducts.map(p => `${p.name} (${p.category.name})`));
      setProducts(filteredProducts);
      
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
          'pantalon': 'Pantalons'
        };
        
        setCategoryInfo({
          name: categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1),
          description: `Découvrez notre collection de ${categoryNames[category] || category} de qualité supérieure.`
        });
      }
      
      setLoading(false);
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
