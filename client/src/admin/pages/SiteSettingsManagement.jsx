import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Save, RefreshCw, Upload, X, Image as ImageIcon, AlertCircle, Settings as SettingsIcon } from 'lucide-react';
import siteSettingsService, { DEFAULT_SITE_SETTINGS } from '../../services/siteSettingsService';
import useNotificationStore from '../../services/notificationService';

const API_BASE_URL = 'http://localhost:5003/api';
const BACKEND_URL = 'http://localhost:5003';

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`;
  return `${BACKEND_URL}/${url}`;
};

const uploadImage = async (file) => {
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

const SiteSettingsManagement = () => {
  const [settings, setSettings] = useState(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const value = await siteSettingsService.getSettings({ fresh: true });
      if (value) {
        setSettings({
          ...DEFAULT_SITE_SETTINGS,
          ...value,
          top_bar: { ...DEFAULT_SITE_SETTINGS.top_bar, ...(value.top_bar || {}) },
          currency: {
            ...DEFAULT_SITE_SETTINGS.currency,
            ...(value.currency || {}),
            rates: { ...DEFAULT_SITE_SETTINGS.currency.rates, ...(value.currency?.rates || {}) },
            symbols: { ...DEFAULT_SITE_SETTINGS.currency.symbols, ...(value.currency?.symbols || {}) },
            locales: { ...DEFAULT_SITE_SETTINGS.currency.locales, ...(value.currency?.locales || {}) }
          }
        });
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de charger les paramètres.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      await siteSettingsService.updateSettings(settings);
      addNotification({
        type: 'success',
        category: 'Paramètre',
        title: 'Paramètres enregistrés',
        message: 'Les changements sont visibles sur le site immédiatement.'
      });
    } catch (err) {
      console.error(err);
      addNotification({
        type: 'error',
        category: 'Erreur',
        title: 'Échec de l\u2019enregistrement',
        message: err?.response?.data?.message || err.message || 'Erreur inconnue'
      });
    } finally {
      setSaving(false);
    }
  };

  const setTopBar = (patch) => setSettings((s) => ({ ...s, top_bar: { ...s.top_bar, ...patch } }));

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      if (url) setSettings((s) => ({ ...s, logo: url }));
      else throw new Error('Le serveur n\u2019a pas renvoyé d\u2019URL.');
    } catch (err) {
      addNotification({
        type: 'error',
        category: 'Upload',
        title: 'Échec de l\u2019upload du logo',
        message: err?.response?.data?.message || err.message || 'Erreur inconnue'
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

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
            <SettingsIcon className="w-7 h-7" />
            Identité du site
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Logo et barre supérieure (livraison, devise, langue).
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* LOGO */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">Logo du site</h3>
        <div className="flex items-start gap-6 flex-wrap">
          <div className="w-40 h-40 rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 flex items-center justify-center overflow-hidden relative">
            {settings.logo ? (
              <>
                <img
                  src={resolveImageUrl(settings.logo)}
                  alt="Logo"
                  className="w-full h-full object-contain p-2"
                />
                <button
                  type="button"
                  onClick={() => setSettings((s) => ({ ...s, logo: '' }))}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow"
                  title="Retirer"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <ImageIcon className="w-10 h-10 text-neutral-300" />
            )}
          </div>
          <div className="flex-1 min-w-[240px] space-y-3">
            <p className="text-sm text-neutral-600">
              Format recommandé : PNG transparent, carré, min. 512×512&nbsp;px.
              Si aucun logo n'est défini, l'image par défaut <code>/images/BOURBON MORELLI.png</code> est utilisée.
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 cursor-pointer disabled:opacity-50">
              <Upload className="w-4 h-4" />
              {uploading ? 'Upload…' : 'Téléverser un logo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
            <div>
              <label className="block text-xs font-medium text-neutral-600 mb-1">
                Ou coller une URL
              </label>
              <input
                type="text"
                value={settings.logo || ''}
                onChange={(e) => setSettings((s) => ({ ...s, logo: e.target.value }))}
                placeholder="/uploads/products/mon-logo.png ou https://…"
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TOP BAR */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-4">
          Barre supérieure du site
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Apparaît au-dessus du header sur desktop. Exemple actuel :
          « <span className="italic">{settings.top_bar.shipping_text}</span> »
          — <span className="italic">{settings.top_bar.currency_label}</span> —
          <span className="italic"> {settings.top_bar.language_label}</span>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Message livraison (version longue — ≥ XL)
            </label>
            <input
              type="text"
              value={settings.top_bar.shipping_text}
              onChange={(e) => setTopBar({ shipping_text: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Message livraison (version courte — &lt; XL)
            </label>
            <input
              type="text"
              value={settings.top_bar.shipping_text_short}
              onChange={(e) => setTopBar({ shipping_text_short: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Devise affichée
            </label>
            <input
              type="text"
              value={settings.top_bar.currency_label}
              onChange={(e) => setTopBar({ currency_label: e.target.value })}
              placeholder="EUR $"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Langue affichée
            </label>
            <input
              type="text"
              value={settings.top_bar.language_label}
              onChange={(e) => setTopBar({ language_label: e.target.value })}
              placeholder="FR"
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* DEVISES */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide mb-1">
          Devises et taux de change
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          Devise de base : <code>{settings.currency.base}</code> (les prix sont stockés dans cette devise).
          Les taux indiquent combien valent <b>1 {settings.currency.base}</b> dans chaque devise.
          Exemple : si <code>MGA = 4800</code>, alors 10 {settings.currency.base} → 48 000 Ar.
        </p>

        <div className="space-y-2">
          {settings.currency.enabled.map((c) => (
            <div key={c} className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-2 font-semibold text-neutral-900">{c}</div>
              <div className="col-span-5">
                <label className="block text-[10px] uppercase text-neutral-500 mb-0.5">
                  Taux (1 {settings.currency.base} = ? {c})
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.currency.rates[c] ?? ''}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      currency: {
                        ...s.currency,
                        rates: { ...s.currency.rates, [c]: e.target.value === '' ? '' : Number(e.target.value) }
                      }
                    }))
                  }
                  disabled={c === settings.currency.base}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:bg-neutral-100"
                />
              </div>
              <div className="col-span-3">
                <label className="block text-[10px] uppercase text-neutral-500 mb-0.5">Symbole</label>
                <input
                  type="text"
                  value={settings.currency.symbols[c] ?? ''}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      currency: { ...s.currency, symbols: { ...s.currency.symbols, [c]: e.target.value } }
                    }))
                  }
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="col-span-2 text-right">
                {c !== settings.currency.base && (
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        currency: { ...s.currency, enabled: s.currency.enabled.filter((x) => x !== c) }
                      }))
                    }
                    className="text-xs text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap gap-2 items-center">
          <span className="text-xs text-neutral-500">Ajouter une devise :</span>
          {['EUR', 'USD', 'MGA', 'GBP', 'CHF', 'CAD']
            .filter((c) => !settings.currency.enabled.includes(c))
            .map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setSettings((s) => ({
                    ...s,
                    currency: {
                      ...s.currency,
                      enabled: [...s.currency.enabled, c],
                      rates: { ...s.currency.rates, [c]: s.currency.rates[c] ?? 1 },
                      symbols: { ...s.currency.symbols, [c]: s.currency.symbols[c] ?? c }
                    }
                  }))
                }
                className="px-3 py-1 border border-neutral-200 rounded-full text-xs hover:bg-neutral-50"
              >
                + {c}
              </button>
            ))}
        </div>
      </div>

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

export default SiteSettingsManagement;
