import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, Check, X, Home, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { addressService } from '../../services/accountService';

const emptyForm = {
  type: 'shipping',
  first_name: '',
  last_name: '',
  company: '',
  street_address: '',
  apartment: '',
  city: '',
  postal_code: '',
  country: 'Madagascar',
  phone: '',
  is_default: false
};

const Addresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const list = await addressService.list();
      setAddresses(list);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Impossible de charger les adresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setFormData({
      type: addr.type || 'shipping',
      first_name: addr.first_name || '',
      last_name: addr.last_name || '',
      company: addr.company || '',
      street_address: addr.street_address || '',
      apartment: addr.apartment || '',
      city: addr.city || '',
      postal_code: addr.postal_code || '',
      country: addr.country || 'Madagascar',
      phone: addr.phone || '',
      is_default: !!addr.is_default
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const validate = () => {
    const required = ['first_name', 'last_name', 'street_address', 'city', 'postal_code', 'country'];
    for (const f of required) {
      if (!formData[f] || !String(formData[f]).trim()) {
        toast.error('Merci de remplir tous les champs obligatoires');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await addressService.update(editingId, formData);
        toast.success('Adresse mise à jour');
      } else {
        await addressService.create(formData);
        toast.success('Adresse ajoutée');
      }
      closeModal();
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    try {
      await addressService.remove(id);
      toast.success('Adresse supprimée');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const setDefault = async (addr) => {
    try {
      await addressService.update(addr.id, { ...addr, is_default: true });
      toast.success('Adresse par défaut mise à jour');
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    }
  };

  const TypeIcon = ({ type }) => {
    const Icon = type === 'billing' ? Briefcase : Home;
    return <Icon className="w-5 h-5 text-primary-500" />;
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
          <MapPin className="w-6 h-6" />
          Mes adresses
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      {addresses.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-lg">
          <MapPin className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 mb-4">Vous n'avez pas encore d'adresse enregistrée.</p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm"
          >
            <Plus className="w-4 h-4" /> Ajouter une adresse
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div key={a.id} className={`bg-white rounded-lg border p-5 ${a.is_default ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TypeIcon type={a.type} />
                  <span className="text-xs uppercase font-semibold text-neutral-500">
                    {a.type === 'billing' ? 'Facturation' : 'Livraison'}
                  </span>
                  {a.is_default && (
                    <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full">Par défaut</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-neutral-100 rounded" title="Modifier">
                    <Edit2 className="w-4 h-4 text-neutral-600" />
                  </button>
                  <button onClick={() => handleDelete(a.id)} className="p-1.5 hover:bg-red-50 rounded" title="Supprimer">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-neutral-900">{a.first_name} {a.last_name}</p>
              {a.company && <p className="text-sm text-neutral-600">{a.company}</p>}
              <p className="text-sm text-neutral-700 mt-1">
                {a.street_address}
                {a.apartment && `, ${a.apartment}`}
              </p>
              <p className="text-sm text-neutral-700">{a.postal_code} {a.city}</p>
              <p className="text-sm text-neutral-700">{a.country}</p>
              {a.phone && <p className="text-sm text-neutral-500 mt-2">📞 {a.phone}</p>}
              {!a.is_default && (
                <button onClick={() => setDefault(a)} className="mt-3 text-xs text-primary-500 hover:underline flex items-center gap-1">
                  <Check className="w-3 h-3" /> Définir par défaut
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-xl max-w-xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="text-lg font-bold">{editingId ? 'Modifier' : 'Nouvelle'} adresse</h3>
              <button onClick={closeModal} className="p-1 hover:bg-neutral-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                >
                  <option value="shipping">Livraison</option>
                  <option value="billing">Facturation</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Prénom *" value={formData.first_name} onChange={(v) => setFormData({ ...formData, first_name: v })} />
                <Field label="Nom *" value={formData.last_name} onChange={(v) => setFormData({ ...formData, last_name: v })} />
              </div>

              <Field label="Société (facultatif)" value={formData.company} onChange={(v) => setFormData({ ...formData, company: v })} />
              <Field label="Adresse *" value={formData.street_address} onChange={(v) => setFormData({ ...formData, street_address: v })} />
              <Field label="Complément (apt, étage…)" value={formData.apartment} onChange={(v) => setFormData({ ...formData, apartment: v })} />

              <div className="grid grid-cols-2 gap-3">
                <Field label="Code postal *" value={formData.postal_code} onChange={(v) => setFormData({ ...formData, postal_code: v })} />
                <Field label="Ville *" value={formData.city} onChange={(v) => setFormData({ ...formData, city: v })} />
              </div>

              <Field label="Pays *" value={formData.country} onChange={(v) => setFormData({ ...formData, country: v })} />
              <Field label="Téléphone" value={formData.phone} onChange={(v) => setFormData({ ...formData, phone: v })} />

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded"
                />
                Définir comme adresse par défaut
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm hover:bg-primary-600 disabled:opacity-50">
                  {saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
    />
  </div>
);

export default Addresses;
