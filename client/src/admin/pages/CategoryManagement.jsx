import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, X, Save, Tag } from 'lucide-react';
import useNotificationStore from '../../services/notificationService';

const BACKEND_URL = 'http://localhost:5003';

const CategoryManagement = () => {
  const addNotification = useNotificationStore(s => s.addNotification);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', sort_order: 0 });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.categories || data.data || []);
      setCategories(list);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
      setError('Impossible de charger les catégories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData({ name: '', description: '', sort_order: 0 });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (cat) => {
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      sort_order: cat.sort_order || 0
    });
    setEditingId(cat.id);
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Vous devez être connecté en tant qu\'admin');
      return;
    }

    try {
      const url = editingId
        ? `${BACKEND_URL}/api/categories/${editingId}`
        : `${BACKEND_URL}/api/categories`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Erreur');
        return;
      }

      setSuccess(editingId ? 'Catégorie modifiée' : 'Catégorie créée');
      addNotification({
        type: editingId ? 'info' : 'success',
        category: 'Paramètre',
        title: editingId ? 'Catégorie modifiée' : 'Catégorie créée',
        message: `Catégorie "${formData.name}" ${editingId ? 'mise à jour' : 'ajoutée'}`
      });
      resetForm();
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Erreur réseau');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Supprimer la catégorie "${cat.name}" ?`)) return;
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/categories/${cat.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || data.error || 'Erreur');
        return;
      }
      setSuccess('Catégorie supprimée');
      addNotification({
        type: 'warning',
        category: 'Paramètre',
        title: 'Catégorie supprimée',
        message: `Catégorie "${cat.name}" retirée`
      });
      loadCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur réseau');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Tag className="w-6 h-6" /> Gestion des Catégories
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Les catégories créées ici apparaissent dans le formulaire produit et sur la page Collections.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg hover:bg-neutral-800"
        >
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg">
          {success}
        </div>
      )}

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in"
          onClick={resetForm}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                  </h3>
                  <p className="text-xs text-white/80">
                    {editingId ? 'Mettez à jour les informations' : 'Créer une nouvelle catégorie'}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                  <span className="font-semibold">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Nom de la catégorie <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Ex: Accessoires, Chaussures..."
                  autoFocus
                  required
                />
                {formData.name && (
                  <p className="text-xs text-neutral-500 mt-1.5">
                    URL : <span className="font-mono text-neutral-900">/collections/{formData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none"
                  placeholder="Description affichée sur la page Collections..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  Ordre d'affichage
                </label>
                <input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-32 px-4 py-2.5 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  min="0"
                />
                <p className="text-xs text-neutral-500 mt-1.5">
                  Plus petit = affiché en premier
                </p>
              </div>

              {/* Footer buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-neutral-900 text-white px-5 py-2.5 rounded-lg hover:bg-neutral-800 transition font-medium shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {editingId ? 'Enregistrer' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Chargement...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-neutral-500">Aucune catégorie</div>
        ) : (
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Nom</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Slug</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-neutral-600">Description</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Produits</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-neutral-600">Ordre</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3 font-medium text-neutral-900">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-neutral-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-sm text-neutral-600 max-w-xs truncate">
                    {cat.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <span className="inline-block bg-neutral-100 text-neutral-900 px-2 py-0.5 rounded">
                      {cat.product_count || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-neutral-600">
                    {cat.sort_order || 0}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CategoryManagement;
