import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Star, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService } from '../services/accountService';

const API = 'http://localhost:5003/api';
const isLoggedIn = () => !!localStorage.getItem('userToken');
const getCurrentUserId = () => {
  try { return JSON.parse(localStorage.getItem('userInfo') || 'null')?.id; } catch { return null; }
};

const Stars = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => {
      const filled = i <= value;
      const cls = filled ? 'w-5 h-5 fill-gray-600 text-gray-600' : 'w-5 h-5 text-neutral-300';
      return onChange ? (
        <button key={i} type="button" onClick={() => onChange(i)} className="hover:scale-110 transition-transform">
          <Star className={cls} />
        </button>
      ) : (
        <Star key={i} className={cls} />
      );
    })}
  </div>
);

const ProductReviews = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = getCurrentUserId();
  const ownReview = reviews.find(r => r.user_id === currentUserId);

  const load = async () => {
    setLoading(true);
    try {
      // Endpoint public : avis d'un produit
      const { data } = await axios.get(`${API}/public/products/${productId}/reviews`).catch(() => ({ data: null }));
      if (data?.reviews) {
        setReviews(data.reviews);
      } else {
        setReviews([]);
      }
    } catch (err) {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) load();
    // eslint-disable-next-line
  }, [productId]);

  // Pré-remplir si l'utilisateur a déjà un avis
  useEffect(() => {
    if (ownReview) {
      setRating(ownReview.rating);
      setTitle(ownReview.title || '');
      setContent(ownReview.content || '');
    }
  }, [ownReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn()) {
      toast.error('Connectez-vous pour laisser un avis');
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      toast.error('Minimum 10 caractères pour le contenu');
      return;
    }
    setSubmitting(true);
    try {
      if (ownReview) {
        await reviewService.update(ownReview.id, { rating, title, content });
        toast.success('Avis mis à jour');
      } else {
        await reviewService.create({ product_id: productId, rating, title, content });
        toast.success('Avis publié');
      }
      await load();
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erreur';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ownReview || !window.confirm('Supprimer votre avis ?')) return;
    try {
      await reviewService.remove(ownReview.id);
      toast.success('Avis supprimé');
      setRating(5); setTitle(''); setContent('');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Erreur');
    }
  };

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="text-2xl font-luxury font-bold text-neutral-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Avis clients
      </h2>

      {/* Formulaire */}
      <div className="bg-neutral-50 rounded-lg p-5 mb-8">
        <h3 className="font-semibold mb-3">
          {ownReview ? 'Modifier votre avis' : 'Laisser un avis'}
        </h3>
        {!isLoggedIn() ? (
          <p className="text-sm text-neutral-600">Connectez-vous pour laisser un avis sur ce produit.</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Note</label>
              <Stars value={rating} onChange={setRating} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Titre (facultatif)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Résumez votre expérience"
                maxLength={150}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Votre avis</label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Partagez votre expérience (min. 10 caractères)"
              />
              <p className="mt-1 text-xs text-neutral-500">{content.length} caractères</p>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement…' : ownReview ? 'Mettre à jour' : 'Publier mon avis'}
              </button>
              {ownReview && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
                >
                  Supprimer mon avis
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Liste des avis */}
      {loading ? (
        <p className="text-sm text-neutral-500">Chargement des avis…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-neutral-500">Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm font-medium text-neutral-900">
                    {r.first_name || 'Client'} {r.last_name ? r.last_name.charAt(0) + '.' : ''}
                  </span>
                </div>
                <span className="text-xs text-neutral-500">
                  {r.created_at && new Date(r.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {r.title && <h4 className="font-medium text-neutral-900 mb-1">{r.title}</h4>}
              {r.content && <p className="text-sm text-neutral-700 whitespace-pre-line">{r.content}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
