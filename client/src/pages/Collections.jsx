import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { Filter } from 'lucide-react';

const Collections = () => {
  const { category } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState(null);

  useEffect(() => {
    console.log('Collections useEffect - category:', category);
    
    // Utiliser l'API backend au lieu des données mockées
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const url = category ? `/api/products?category=${category}` : '/api/products';
        console.log('Fetching from URL:', url);
        
        const response = await fetch(url);
        const data = await response.json();
        
        console.log('API Response:', data);
        
        if (data.products) {
          setProducts(data.products);
        } else {
          setProducts(data);
        }
        
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
      } catch (error) {
        console.error('Error fetching products:', error);
        
        // Fallback vers les données mockées si l'API échoue
        const mockProducts = [
          {
            id: 1,
            name: 'Nappe de Table Luxe',
            slug: 'nappe-de-table-luxe',
            price: 89.99,
            compare_price: 119.99,
            description: 'Une nappe de table élégante en coton premium',
            category: { name: 'Nappes' },
            images: ['/images/Nape%20de%20table.PNG', '/images/Nape%20de%20table1.PNG', '/images/Nape%20de%20table2.PNG'],
            featured: true,
            rating: 5,
            reviews_count: 12,
            inventory_quantity: 5
          },
          {
            id: 2,
            name: 'T-shirt Premium',
            slug: 'tshirt-premium',
            price: 39.99,
            description: 'T-shirt en coton bio de haute qualité',
            category: { name: 'T-Shirts' },
            images: ['/images/T-shirts1.PNG', '/images/T-shirts2.PNG', '/images/T-shirts3.PNG'],
            featured: true,
            rating: 4,
            reviews_count: 8,
            inventory_quantity: 3
          },
          {
            id: 3,
            name: 'Polo Classique',
            slug: 'polo-classique',
            price: 49.99,
            description: 'Polo en piqué de coton avec col traditionnel',
            category: { name: 'Polos' },
            images: ['/images/Polos.PNG', '/images/Polos%201.PNG', '/images/Polos%202.PNG'],
            featured: false,
            rating: 4,
            reviews_count: 6,
            inventory_quantity: 15
          },
          {
            id: 4,
            name: 'Pantalon Chic',
            slug: 'pantalon-chic',
            price: 79.99,
            description: 'Pantalon élégant en laine mélangée',
            category: { name: 'Pantalons' },
            images: ['/images/Pantalons.PNG', '/images/Pantalons%201.PNG', '/images/Pantalons%202.PNG'],
            featured: true,
            rating: 5,
            reviews_count: 10,
            inventory_quantity: 8
          }
        ];

        // Filtrer par catégorie si spécifiée
        let filteredProducts = mockProducts;
        
        if (category) {
          console.log('Filtrage fallback pour catégorie:', category);
          filteredProducts = mockProducts.filter(p => {
            const categoryName = p.category.name.toLowerCase();
            const categorySlug = p.category.name.toLowerCase().replace(/\s+/g, '-');
            const requestedCategory = category.toLowerCase();
            
            console.log('Fallback - Produit:', p.name, 'Catégorie:', categoryName, 'Slug:', categorySlug, 'Recherché:', requestedCategory);
            
            const matches = categoryName === requestedCategory || categorySlug === requestedCategory;
            console.log('Fallback - Matches:', matches);
            return matches;
          });
          
          console.log('Fallback - Produits filtrés:', filteredProducts.map(p => `${p.name} (${p.category.name})`));
        }

        console.log('Produits finaux envoyés à ProductGrid:', filteredProducts.map(p => `${p.name} (${p.category.name})`));
        setProducts(filteredProducts);
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [category]);

  const handleAddToCart = (product) => {
    console.log('Ajouté au panier:', product.name);
    // Logique d'ajout au panier ici
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
