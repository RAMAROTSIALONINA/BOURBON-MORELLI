import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search as SearchIcon } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import productServicePublic from '../services/productServicePublic';

const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads/')) return `${BACKEND_URL}${url}`;
  return url;
};

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResults = ({ onAddToCart }) => {
  const queryParams = useQuery();
  const q = (queryParams.get('q') || '').trim();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await productServicePublic.getAllProducts();
        const list = Array.isArray(data) ? data : (data?.products || []);
        const needle = q.toLowerCase();
        const filtered = !needle
          ? []
          : list.filter((p) =>
              (p.name || '').toLowerCase().includes(needle) ||
              (p.description || '').toLowerCase().includes(needle) ||
              (p.short_description || '').toLowerCase().includes(needle) ||
              (p.sku || '').toLowerCase().includes(needle) ||
              (typeof p.category === 'string'
                ? p.category
                : p.category?.name || ''
              ).toLowerCase().includes(needle)
            );

        const formatted = filtered.map((product) => ({
          id: product.id,
          name: product.name,
          slug: product.slug || (product.name || '').toLowerCase().replace(/\s+/g, '-'),
          price: product.price,
          compare_price: product.compare_price || null,
          description: product.description,
          category: {
            name:
              typeof product.category === 'string'
                ? product.category
                : product.category?.name || 'Non catégorisé'
          },
          images:
            product.images && product.images.length > 0
              ? product.images.map((u) => resolveImageUrl(u))
              : ['/images/placeholder-product.jpg'],
          featured: product.status === 'active',
          rating: product.rating || 4,
          reviews_count: product.reviews_count || 0,
          inventory_quantity: product.stock || 0,
          stock: product.stock || 0,
          sizes: Array.isArray(product.sizes)
            ? product.sizes
            : typeof product.sizes === 'string' && product.sizes
            ? product.sizes.split(',').map((s) => s.trim()).filter(Boolean)
            : []
        }));

        setProducts(formatted);
      } catch (err) {
        console.error('Erreur recherche:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [q]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-100">
        <div className="container mx-auto px-4 py-8">
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link to="/" className="text-neutral-600 hover:text-primary-500">
                  Accueil
                </Link>
              </li>
              <li className="text-neutral-400">/</li>
              <li className="text-neutral-900 font-medium">Recherche</li>
            </ol>
          </nav>
          <div className="flex items-center gap-3">
            <SearchIcon className="w-6 h-6 text-neutral-500" />
            <div>
              <h1 className="text-2xl font-luxury font-bold text-neutral-900">
                Résultats pour « {q || '...'} »
              </h1>
              <p className="text-sm text-neutral-500 mt-1">
                {loading
                  ? 'Recherche en cours...'
                  : `${products.length} produit${products.length > 1 ? 's' : ''} trouvé${products.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!q ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <SearchIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-600">Saisissez un terme de recherche dans la barre en haut.</p>
          </div>
        ) : !loading && products.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <SearchIcon className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-neutral-700 font-medium">Aucun produit ne correspond à « {q} »</p>
            <p className="text-sm text-neutral-500 mt-1">
              Essayez un autre mot-clé, ou{' '}
              <Link to="/collections" className="text-primary-600 hover:underline">
                parcourez toutes les collections
              </Link>
              .
            </p>
          </div>
        ) : (
          <ProductGrid products={products} loading={loading} onAddToCart={onAddToCart} />
        )}
      </div>
    </div>
  );
};

export default SearchResults;
