import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Filter, Grid, List, SlidersHorizontal, ChevronDown } from 'lucide-react';

const ProductGrid = ({ products, loading, onAddToCart, onAddToWishlist }) => {
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState(products);

  // Sorting options
  const sortOptions = [
    { value: 'featured', label: 'Mis en avant' },
    { value: 'price-low', label: 'Prix croissant' },
    { value: 'price-high', label: 'Prix décroissant' },
    { value: 'name-asc', label: 'Nom A-Z' },
    { value: 'name-desc', label: 'Nom Z-A' },
    { value: 'newest', label: 'Nouveautés' },
    { value: 'rating', label: 'Meilleures notes' }
  ];

  // Filter states
  const [filters, setFilters] = useState({
    categories: [],
    priceRange: [0, 1000],
    sizes: [],
    colors: [],
    inStock: true
  });

  // Apply filters and sorting
  useEffect(() => {
    // S'assurer que products est un tableau
    const productsArray = Array.isArray(products) ? products : [];
    let filtered = [...productsArray];

    // Apply category filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => 
        filters.categories.includes(product.category?.name)
      );
    }

    // Apply price filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply size filter
    if (filters.sizes.length > 0) {
      filtered = filtered.filter(product =>
        Array.isArray(product.sizes) &&
        product.sizes.some(s => filters.sizes.includes(s))
      );
    }

    // Apply stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product =>
        product.inventory_quantity > 0
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    setFilteredProducts(filtered);
  }, [products, filters, sortBy]);

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 1000],
      sizes: [],
      colors: [],
      inStock: true
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl overflow-hidden shadow-lg">
              <div className="h-80 bg-neutral-200"></div>
              <div className="p-4">
                <div className="h-4 bg-neutral-200 rounded mb-2"></div>
                <div className="h-4 bg-neutral-200 rounded w-3/4 mb-4"></div>
                <div className="h-6 bg-neutral-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and sort bar */}
      <div className="bg-white rounded-lg shadow-sm border border-neutral-100 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Left side - Filters and results count */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filtres</span>
              {Object.values(filters).some(val => 
                Array.isArray(val) ? val.length > 0 : val !== true
              ) && (
                <span className="bg-primary-500 text-white text-xs px-2 py-1 rounded-full">
                  Actif
                </span>
              )}
            </button>
            
            <span className="text-neutral-600">
              {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Right side - View mode and sort */}
          <div className="flex items-center space-x-4">
            {/* View mode toggle */}
            <div className="flex items-center border border-neutral-200 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-primary-500 text-white' 
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="appearance-none bg-white border border-neutral-200 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="mt-6 pt-6 border-t border-neutral-100">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price range */}
              <div>
                <h3 className="font-medium mb-3">Fourchette de prix</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={filters.priceRange[1]}
                    onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-neutral-600">
                    <span>{filters.priceRange[0]}€</span>
                    <span>{filters.priceRange[1]}€</span>
                  </div>
                </div>
              </div>

              {/* Categories */}
              <div>
                <h3 className="font-medium mb-3">Catégories</h3>
                <div className="space-y-2">
                  {['Nappes', 'T-Shirts', 'Polos', 'Pantalons'].map(category => (
                    <label key={category} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('categories', [...filters.categories, category]);
                          } else {
                            handleFilterChange('categories', filters.categories.filter(c => c !== category));
                          }
                        }}
                        className="rounded text-primary-500 focus:ring-primary-500"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="font-medium mb-3">Tailles</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                    <label key={size} className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={filters.sizes.includes(size)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleFilterChange('sizes', [...filters.sizes, size]);
                          } else {
                            handleFilterChange('sizes', filters.sizes.filter(s => s !== size));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 border rounded flex items-center justify-center text-sm cursor-pointer transition-colors ${
                        filters.sizes.includes(size)
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-neutral-300 hover:border-primary-500'
                      }`}>
                        {size}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Stock filter */}
              <div>
                <h3 className="font-medium mb-3">Disponibilité</h3>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                    className="rounded text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm">En stock uniquement</span>
                </label>
                
                <button
                  onClick={clearFilters}
                  className="mt-4 text-sm text-primary-500 hover:text-primary-600 transition-colors"
                >
                  Effacer tous les filtres
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Products grid/list */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-400 mb-4">
            <Filter className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-luxury font-semibold text-neutral-900 mb-2">
            Aucun produit trouvé
          </h3>
          <p className="text-neutral-600 mb-4">
            Essayez de modifier vos filtres ou votre recherche
          </p>
          <button
            onClick={clearFilters}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Effacer les filtres
          </button>
        </div>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-6'
        }>
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onAddToWishlist={onAddToWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
