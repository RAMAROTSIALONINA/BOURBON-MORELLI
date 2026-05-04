import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Info, Plus, Trash2, Save, RefreshCw, ExternalLink, AlertCircle, User as UserIcon, X } from 'lucide-react';
import aboutService from '../../services/aboutService';
import useNotificationStore from '../../services/notificationService';

const API_BASE_URL = 'http://localhost:5003/api';
const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return null;
  
  // Debug : afficher l'URL originale
  console.log('Original URL:', url);
  
  // URLs absolues (http, https, data:)
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    console.log('Absolute URL, returning as-is:', url);
    return url;
  }
  
  // URLs relatives commençant par /uploads/
  if (url.startsWith('/uploads/')) {
    const fullUrl = `${BACKEND_URL}${url}`;
    console.log('Uploads URL, converted to:', fullUrl);
    return fullUrl;
  }
  
  // URLs relatives sans / au début
  if (url.startsWith('uploads/')) {
    const fullUrl = `${BACKEND_URL}/${url}`;
    console.log('Relative uploads URL, converted to:', fullUrl);
    return fullUrl;
  }
  
  // Autres URLs relatives
  if (!url.startsWith('/')) {
    const fullUrl = `${BACKEND_URL}/${url}`;
    console.log('Other relative URL, converted to:', fullUrl);
    return fullUrl;
  }
  
  console.log('URL already absolute:', url);
  return url;
};

const uploadPhoto = async (file) => {
  const token = localStorage.getItem('adminToken');
  const fd = new FormData();
  fd.append('image', file);
  const { data } = await axios.post(`${API_BASE_URL}/upload/image`, fd, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'multipart/form-data'
    }
  });
  return data?.url || null;
};

const ICON_OPTIONS = ['Award', 'Heart', 'Users', 'Target', 'Star', 'Shield', 'Gift', 'Sparkles'];

const emptyAbout = {
  hero: { title: '', subtitle: '' },
  story: { title: '', paragraphs: [''], image_caption: '' },
  values: [],
  milestones: [],
  team: [],
  testimonials: [],
  cta: { title: '', subtitle: '' }
};

const AboutManagement = () => {
  const [data, setData] = useState(emptyAbout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await aboutService.getAbout();
      if (value) {
        setData({
          ...emptyAbout,
          ...value,
          hero: { ...emptyAbout.hero, ...(value.hero || {}) },
          story: { ...emptyAbout.story, ...(value.story || {}) },
          cta: { ...emptyAbout.cta, ...(value.cta || {}) },
          values: Array.isArray(value.values) ? value.values : [],
          milestones: Array.isArray(value.milestones) ? value.milestones : [],
          team: Array.isArray(value.team) ? value.team : [],
          testimonials: Array.isArray(value.testimonials) ? value.testimonials : []
        });
      }
    } catch (err) {
      console.error(err);
      setError("Impossible de charger le contenu. Vérifie le backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await aboutService.updateAbout(data);
      addNotification({
        type: 'success',
        category: 'Paramètre',
        title: 'Page À propos mise à jour',
        message: 'Les modifications sont visibles publiquement immédiatement.'
      });
    } catch (err) {
      console.error(err);
      addNotification({
        type: 'error',
        category: 'Erreur',
        title: 'Échec de l’enregistrement',
        message: err?.response?.data?.message || err.message || 'Erreur inconnue'
      });
    } finally {
      setSaving(false);
    }
  };

  // Helpers de mutation immuable
  const setHero = (patch) => setData((d) => ({ ...d, hero: { ...d.hero, ...patch } }));
  const setStory = (patch) => setData((d) => ({ ...d, story: { ...d.story, ...patch } }));
  const setCta = (patch) => setData((d) => ({ ...d, cta: { ...d.cta, ...patch } }));

  const updateParagraph = (idx, val) =>
    setData((d) => ({
      ...d,
      story: { ...d.story, paragraphs: d.story.paragraphs.map((p, i) => (i === idx ? val : p)) }
    }));
  const addParagraph = () =>
    setData((d) => ({ ...d, story: { ...d.story, paragraphs: [...d.story.paragraphs, ''] } }));
  const removeParagraph = (idx) =>
    setData((d) => ({
      ...d,
      story: { ...d.story, paragraphs: d.story.paragraphs.filter((_, i) => i !== idx) }
    }));

  const updateListItem = (key, idx, patch) =>
    setData((d) => ({
      ...d,
      [key]: d[key].map((item, i) => (i === idx ? { ...item, ...patch } : item))
    }));
  const addListItem = (key, template) =>
    setData((d) => ({ ...d, [key]: [...d[key], { ...template }] }));
  const removeListItem = (key, idx) =>
    setData((d) => ({ ...d, [key]: d[key].filter((_, i) => i !== idx) }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Info className="w-7 h-7" />
            Page « À propos »
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Modifie ici le contenu affiché sur <code>/about</code>. Les changements sont publiés immédiatement.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/about"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50"
          >
            <ExternalLink className="w-4 h-4" /> Voir la page
          </a>
          <button
            onClick={load}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50"
          >
            <RefreshCw className="w-4 h-4" /> Recharger
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* HERO */}
      <Section title="Hero (en-tête)">
        <FieldText label="Titre" value={data.hero.title} onChange={(v) => setHero({ title: v })} />
        <FieldText label="Sous-titre" value={data.hero.subtitle} onChange={(v) => setHero({ subtitle: v })} />
      </Section>

      {/* STORY */}
      <Section title="Notre histoire">
        <FieldText label="Titre de la section" value={data.story.title} onChange={(v) => setStory({ title: v })} />
        <FieldText
          label="Légende de l'image (côté droit)"
          value={data.story.image_caption}
          onChange={(v) => setStory({ image_caption: v })}
        />
        <div className="space-y-2">
          <label className="block text-sm font-medium text-neutral-700">Paragraphes</label>
          {data.story.paragraphs.map((p, idx) => (
            <div key={idx} className="flex gap-2">
              <textarea
                value={p}
                onChange={(e) => updateParagraph(idx, e.target.value)}
                rows={3}
                className="flex-1 px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                onClick={() => removeParagraph(idx)}
                disabled={data.story.paragraphs.length <= 1}
                className="px-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addParagraph}
            className="text-sm text-neutral-700 hover:text-neutral-900 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Ajouter un paragraphe
          </button>
        </div>
      </Section>

      {/* VALUES */}
      <Section
        title="Valeurs"
        actions={
          <AddButton
            onClick={() => addListItem('values', { icon: 'Star', title: '', description: '' })}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.values.map((v, idx) => (
            <Card key={idx} onRemove={() => removeListItem('values', idx)} label={`Valeur ${idx + 1}`}>
              <FieldSelect
                label="Icône"
                value={v.icon}
                onChange={(val) => updateListItem('values', idx, { icon: val })}
                options={ICON_OPTIONS}
              />
              <FieldText
                label="Titre"
                value={v.title}
                onChange={(val) => updateListItem('values', idx, { title: val })}
              />
              <FieldTextarea
                label="Description"
                value={v.description}
                onChange={(val) => updateListItem('values', idx, { description: val })}
              />
            </Card>
          ))}
        </div>
      </Section>

      {/* MILESTONES */}
      <Section
        title="Parcours / Jalons"
        actions={
          <AddButton
            onClick={() =>
              addListItem('milestones', { year: new Date().getFullYear().toString(), title: '', description: '' })
            }
          />
        }
      >
        <div className="space-y-3">
          {data.milestones.map((m, idx) => (
            <Card key={idx} onRemove={() => removeListItem('milestones', idx)} label={`Jalon ${idx + 1}`}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <FieldText
                  label="Année"
                  value={m.year}
                  onChange={(val) => updateListItem('milestones', idx, { year: val })}
                />
                <div className="sm:col-span-3">
                  <FieldText
                    label="Titre"
                    value={m.title}
                    onChange={(val) => updateListItem('milestones', idx, { title: val })}
                  />
                </div>
              </div>
              <FieldTextarea
                label="Description"
                value={m.description}
                onChange={(val) => updateListItem('milestones', idx, { description: val })}
              />
            </Card>
          ))}
        </div>
      </Section>

      {/* TEAM */}
      <Section
        title="Équipe / Fondateurs"
        actions={
          <AddButton onClick={() => addListItem('team', { name: '', role: '', bio: '', photo: '' })} />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.team.map((t, idx) => (
            <Card key={idx} onRemove={() => removeListItem('team', idx)} label={`Membre ${idx + 1}`}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo de profil</label>
                {t.photo ? (
                  <div className="relative inline-block">
                    <img 
                      src={resolveImageUrl(t.photo)} 
                      alt={t.name || "Profil"} 
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                      style={{ minHeight: '128px', minWidth: '128px' }}
                    />
                    <button
                      type="button"
                      onClick={() => updateListItem('team', idx, { photo: '' })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <UserIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                      const url = await uploadPhoto(file);
                      if (url) {
                        updateListItem('team', idx, { photo: url });
                      } else {
                        addNotification({
                          type: 'error',
                          category: 'Upload',
                          title: 'Échec de l\u2019upload',
                          message: 'Le serveur n\u2019a pas renvoyé d\u2019URL.'
                        });
                      }
                    } catch (err) {
                      console.error('Upload error:', err);
                      addNotification({
                        type: 'error',
                        category: 'Upload',
                        title: 'Échec de l\u2019upload',
                        message: err?.response?.data?.message || err.message || 'Erreur inconnue'
                      });
                    } finally {
                      e.target.value = '';
                    }
                  }}
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <FieldText
                label="Nom"
                value={t.name}
                onChange={(val) => updateListItem('team', idx, { name: val })}
              />
              <FieldText
                label="Rôle"
                value={t.role}
                onChange={(val) => updateListItem('team', idx, { role: val })}
              />
              <FieldTextarea
                label="Bio"
                value={t.bio}
                onChange={(val) => updateListItem('team', idx, { bio: val })}
              />
            </Card>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section
        title="Témoignages clients"
        actions={
          <AddButton
            onClick={() => addListItem('testimonials', { name: '', location: '', quote: '' })}
          />
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.testimonials.map((t, idx) => (
            <Card key={idx} onRemove={() => removeListItem('testimonials', idx)} label={`Avis ${idx + 1}`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldText
                  label="Nom"
                  value={t.name}
                  onChange={(val) => updateListItem('testimonials', idx, { name: val })}
                />
                <FieldText
                  label="Lieu"
                  value={t.location}
                  onChange={(val) => updateListItem('testimonials', idx, { location: val })}
                />
              </div>
              <FieldTextarea
                label="Citation"
                value={t.quote}
                onChange={(val) => updateListItem('testimonials', idx, { quote: val })}
              />
            </Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section title="Appel à l'action (bas de page)">
        <FieldText label="Titre" value={data.cta.title} onChange={(v) => setCta({ title: v })} />
        <FieldTextarea
          label="Sous-titre"
          value={data.cta.subtitle}
          onChange={(v) => setCta({ subtitle: v })}
        />
      </Section>

      {/* Save barre flottante en bas */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-full shadow-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  );
};

// --- Sub-components --------------------------------------------------------
const Section = ({ title, actions, children }) => (
  <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
    <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 bg-neutral-50">
      <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide">{title}</h3>
      {actions}
    </div>
    <div className="p-5 space-y-3">{children}</div>
  </div>
);

const AddButton = ({ onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs font-medium hover:bg-neutral-50"
  >
    <Plus className="w-3.5 h-3.5" /> Ajouter
  </button>
);

const Card = ({ label, onRemove, children }) => (
  <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3 relative">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-neutral-500 uppercase">{label}</span>
      <button
        onClick={onRemove}
        className="p-1 text-red-600 hover:bg-red-50 rounded"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
    {children}
  </div>
);

const FieldText = ({ label, value, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
    />
  </div>
);

const FieldTextarea = ({ label, value, onChange, rows = 3 }) => (
  <div>
    <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
    />
  </div>
);

const FieldSelect = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-xs font-medium text-neutral-600 mb-1">{label}</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900"
    >
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  </div>
);

export default AboutManagement;
