import axios from 'axios';

const API_BASE_URL = 'http://localhost:5003/api';
const KEY = 'site';

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const DEFAULT_SITE_SETTINGS = {
  logo: '', // URL ou chemin /uploads/... ; vide = fallback sur /images/BOURBON MORELLI.png
  top_bar: {
    shipping_text: 'Livraison gratuite à partir de 200$',
    shipping_text_short: 'Livraison gratuite',
    currency_label: 'EUR $',
    language_label: 'FR'
  },
  // Devises : base = devise dans laquelle les prix sont stockés en DB
  // enabled = devises disponibles à la sélection côté client
  // rates  = multiplicateur depuis la base (1 EUR = rates[X] X)
  // symbols = symbole affiché
  // locale  = locale utilisée pour Intl.NumberFormat
  currency: {
    base: 'EUR',
    enabled: ['EUR', 'USD', 'MGA'],
    rates: { EUR: 1, USD: 1.08, MGA: 4800 },
    symbols: { EUR: '€', USD: '$', MGA: 'Ar' },
    locales: { EUR: 'fr-FR', USD: 'en-US', MGA: 'fr-FR' }
  }
};

// Cache module-level : une seule requête par chargement de page pour les composants publics
let cachePromise = null;

const siteSettingsService = {
  async getSettings({ fresh = false } = {}) {
    if (!fresh && cachePromise) return cachePromise;
    cachePromise = axios
      .get(`${API_BASE_URL}/site-settings/${KEY}`)
      .then((r) => r.data?.value || null)
      .catch(() => null);
    return cachePromise;
  },

  async updateSettings(value) {
    const { data } = await axios.put(
      `${API_BASE_URL}/site-settings/${KEY}`,
      { value },
      { headers: getAuthHeaders() }
    );
    cachePromise = Promise.resolve(data?.value || value);
    // Notifie les composants écoutant les changements en direct
    window.dispatchEvent(new CustomEvent('siteSettingsChange', { detail: data?.value || value }));
    return data?.value || null;
  },

  invalidateCache() {
    cachePromise = null;
  }
};

export default siteSettingsService;
