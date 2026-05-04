import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { wishlistService } from '../services/accountService';

const WishlistContext = createContext(null);

const isLoggedIn = () => !!localStorage.getItem('userToken');

export const WishlistProvider = ({ children }) => {
  // Set d'IDs produits en favoris
  const [ids, setIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isLoggedIn()) {
      setIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const list = await wishlistService.list();
      setIds(new Set(list.map(p => p.id)));
    } catch (err) {
      if (err?.response?.status === 401) {
        // Token invalide ou expiré : purger pour éviter de futures requêtes inutiles
        localStorage.removeItem('userToken');
        localStorage.removeItem('userInfo');
      }
      setIds(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage + à chaque login/logout (listen storage)
  useEffect(() => {
    refresh();
    const onStorage = (e) => {
      if (e.key === 'userToken') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const isInWishlist = useCallback((productId) => ids.has(productId), [ids]);

  const add = useCallback(async (productId) => {
    if (!isLoggedIn()) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      return false;
    }
    try {
      await wishlistService.add(productId);
      setIds(prev => new Set(prev).add(productId));
      toast.success('Ajouté aux favoris');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur');
      return false;
    }
  }, []);

  const remove = useCallback(async (productId) => {
    if (!isLoggedIn()) return false;
    try {
      await wishlistService.remove(productId);
      setIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      toast.success('Retiré des favoris');
      return true;
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur');
      return false;
    }
  }, []);

  const toggle = useCallback(async (productId) => {
    return ids.has(productId) ? remove(productId) : add(productId);
  }, [ids, add, remove]);

  return (
    <WishlistContext.Provider value={{ ids, loading, isInWishlist, add, remove, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside <WishlistProvider>');
  return ctx;
};

export default WishlistContext;
