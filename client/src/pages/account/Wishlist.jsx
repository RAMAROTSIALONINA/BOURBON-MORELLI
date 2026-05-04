import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { wishlistService } from '../../services/accountService';
import cartService from '../../services/cartService';
import { useCurrency } from '../../contexts/CurrencyContext';

const API_BASE = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  return url;
};

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { format: formatPrice } = useCurrency();

  const load = async () => {
    setLoading(true);
    try {
      const list = await wishlistService.list();
      setItems(list);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Impossible de charger les favoris');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (productId) => {
    try {
      await wishlistService.remove(productId);
      toast.success('Retiré des favoris');
      setItems(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Vider tous les favoris ?')) return;
    try {
      await wishlistService.clear();
      toast.success('Favoris vidés');
      setItems([]);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    }
  };

  const addToCart = (product) => {
    const payload = {
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image_url: product.image,
      images: product.images,
      slug: product.slug
    };
    cartService.addToCart(payload);
    toast.success(`${product.name} ajouté au panier`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-luxury font-bold text-neutral-900 flex items-center gap-2">
          <Heart className="w-6 h-6" />
          Mes favoris
        </h2>
        {items.length > 0 && (
          <button onClick={clearAll} className="text-sm text-red-600 hover:text-red-700">
            Vider les favoris
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-10 text-center">
          <Heart className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
          <h3 className="font-medium text-neutral-900 mb-1">Aucun favori</h3>
          <p className="text-neutral-600 mb-4">Vous n'avez pas encore ajouté de produit à vos favoris.</p>
          <Link to="/products" className="inline-flex px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
            Découvrir nos produits
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-600 mb-4">
            {items.length} produit{items.length > 1 ? 's' : ''} dans vos favoris
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map(p => {
              const inStock = Number(p.stock) > 0;
              const img = p.image || p.images?.[0];
              const hasDiscount = p.compare_price && Number(p.compare_price) > Number(p.price);
              const discount = hasDiscount
                ? Math.round((1 - Number(p.price) / Number(p.compare_price)) * 100)
                : 0;
              return (
                <div key={p.id} className="bg-white rounded-lg border border-neutral-200 overflow-hidden group">
                  <div className="relative aspect-square bg-neutral-100">
                    {img ? (
                      <img
                        src={resolveImageUrl(img)}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-10 h-10 text-neutral-300" />
                      </div>
                    )}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-medium">
                        -{discount}%
                      </span>
                    )}
                    {!inStock && (
                      <span className="absolute top-2 right-2 bg-neutral-800 text-white px-2 py-1 rounded-md text-xs font-medium">
                        Rupture
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    {p.brand && (
                      <span className="text-xs text-neutral-500 uppercase tracking-wide">{p.brand}</span>
                    )}
                    <Link
                      to={p.slug ? `/product/${p.slug}` : '#'}
                      className="block font-medium text-neutral-900 mt-1 line-clamp-2 hover:text-primary-500"
                    >
                      {p.name}
                    </Link>

                    <div className="flex items-center gap-2 mt-2 mb-3">
                      <span className="text-lg font-bold text-neutral-900">
                        {formatPrice(Number(p.price) || 0)}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-neutral-500 line-through">
                          {formatPrice(Number(p.compare_price))}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => addToCart(p)}
                        disabled={!inStock}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                          inStock
                            ? 'bg-primary-500 text-white hover:bg-primary-600'
                            : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        {inStock ? 'Ajouter' : 'Indisponible'}
                      </button>
                      <button
                        onClick={() => remove(p.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {p.added_at && (
                      <p className="mt-3 pt-3 border-t border-neutral-100 text-xs text-neutral-500">
                        Ajouté le {new Date(p.added_at).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Wishlist;
