import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, Edit2, Trash2, Package, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { reviewService } from '../../services/accountService';

const API_BASE = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_BASE}${url}`;
  return url;
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({ rating: 5, title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await reviewService.list({ page: 1, limit: 50 });
      setReviews(list);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Impossible de charger les avis');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (r) => {
    setEditing(r);
    setFormData({
      rating: r.rating || 5,
      title: r.title || '',
      content: r.content || ''
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setFormData({ rating: 5, title: '', content: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Titre et contenu requis');
      return;
    }
    if (formData.content.length < 20) {
      toast.error('Minimum 20 caractères');
      return;
    }
    setSaving(true);
    try {
      await reviewService.update(editing.id, formData);
      toast.success('Avis mis à jour');
      closeEdit();
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cet avis ?')) return;
    try {
      await reviewService.remove(id);
      toast.success('Avis supprimé');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    }
  };

  const renderStars = (rating, interactive = false, onChange = null) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = i <= rating;
        const cls = filled ? 'w-5 h-5 fill-gray-600 text-gray-600' : 'w-5 h-5 text-gray-300';
        return interactive ? (
          <button key={i} type="button" onClick={() => onChange(i)} className="hover:scale-110 transition-transform">
            <Star className={cls} />
          </button>
        ) : (
          <Star key={i} className={cls} />
        );
      })}
      <span className="ml-2 text-sm text-gray-600">({rating}.0)</span>
    </div>
  );

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
          <MessageSquare className="w-6 h-6" />
          Mes avis
        </h2>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-neutral-50 rounded-lg p-10 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-neutral-300 mb-3" />
          <h3 className="font-medium text-neutral-900 mb-1">Aucun avis</h3>
          <p className="text-neutral-600 mb-4">Vous n'avez pas encore publié d'avis sur un produit.</p>
          <Link to="/products" className="inline-flex px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm">
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-white rounded-lg border border-neutral-200 p-5">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {r.product_image ? (
                    <img src={resolveImageUrl(r.product_image)} alt={r.product_name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <Package className="w-8 h-8 text-neutral-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <Link to={r.product_slug ? `/product/${r.product_slug}` : '#'} className="font-semibold text-neutral-900 hover:text-primary-500 truncate block">
                        {r.product_name || 'Produit'}
                      </Link>
                      <div className="mt-1">{renderStars(r.rating)}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-neutral-500">
                        {r.created_at && new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-neutral-100 rounded" title="Modifier">
                        <Edit2 className="w-4 h-4 text-neutral-600" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 hover:bg-red-50 rounded" title="Supprimer">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                  {r.title && <h4 className="font-medium text-neutral-900 mb-1">{r.title}</h4>}
                  {r.content && <p className="text-sm text-neutral-700 whitespace-pre-line">{r.content}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal édition */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeEdit}>
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">Modifier mon avis</h3>
              <button onClick={closeEdit} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <p className="text-sm text-neutral-600 mb-1">Produit</p>
                <p className="font-medium">{editing.product_name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Note</label>
                {renderStars(formData.rating, true, (rating) => setFormData(p => ({ ...p, rating })))}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Avis</label>
                <textarea
                  rows={4}
                  value={formData.content}
                  onChange={(e) => setFormData(p => ({ ...p, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-neutral-500">{formData.content.length}/20 caractères minimum</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={closeEdit} className="px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50">
                  {saving ? 'Enregistrement…' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reviews;
