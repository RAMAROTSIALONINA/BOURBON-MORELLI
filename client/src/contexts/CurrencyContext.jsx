import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import siteSettingsService, { DEFAULT_SITE_SETTINGS } from '../services/siteSettingsService';

const CurrencyContext = createContext(null);

const LS_KEY = 'selectedCurrency';

const getSavedCurrency = () => {
  try { return localStorage.getItem(LS_KEY) || null; } catch { return null; }
};
const saveCurrency = (code) => {
  try { localStorage.setItem(LS_KEY, code); } catch {}
};

export const CurrencyProvider = ({ children }) => {
  const [config, setConfig] = useState(DEFAULT_SITE_SETTINGS.currency);
  const [code, setCode] = useState(() => getSavedCurrency() || DEFAULT_SITE_SETTINGS.currency.base);

  // Charge la config depuis le serveur (cached)
  useEffect(() => {
    let alive = true;
    siteSettingsService.getSettings().then((v) => {
      if (!alive || !v?.currency) return;
      const merged = { ...DEFAULT_SITE_SETTINGS.currency, ...v.currency };
      setConfig(merged);
      // Si la devise sauvegardée n'est plus activée, revenir à la base
      const saved = getSavedCurrency();
      if (!saved || !merged.enabled.includes(saved)) setCode(merged.base);
    });
    const onChange = (e) => {
      if (e.detail?.currency) {
        const merged = { ...DEFAULT_SITE_SETTINGS.currency, ...e.detail.currency };
        setConfig(merged);
      }
    };
    window.addEventListener('siteSettingsChange', onChange);
    return () => {
      alive = false;
      window.removeEventListener('siteSettingsChange', onChange);
    };
  }, []);

  const value = useMemo(() => {
    const setCurrency = (c) => {
      if (!config.enabled.includes(c)) return;
      setCode(c);
      saveCurrency(c);
    };

    // Convertit un prix stocké en devise base vers la devise sélectionnée
    const convert = (priceInBase) => {
      const n = Number(priceInBase || 0);
      const baseRate = config.rates[config.base] || 1;
      const targetRate = config.rates[code] || 1;
      return (n / baseRate) * targetRate;
    };

    const format = (priceInBase, opts = {}) => {
      const converted = convert(priceInBase);
      const locale = config.locales?.[code] || 'fr-FR';
      // MGA : pas de décimales ; EUR/USD : 2 décimales
      const minFrac = code === 'MGA' ? 0 : (opts.minimumFractionDigits ?? 2);
      const maxFrac = code === 'MGA' ? 0 : (opts.maximumFractionDigits ?? 2);
      try {
        return new Intl.NumberFormat(locale, {
          style: 'currency',
          currency: code,
          minimumFractionDigits: minFrac,
          maximumFractionDigits: maxFrac
        }).format(converted);
      } catch {
        // Fallback si la devise n'est pas supportée par Intl (MGA sur certains navigateurs)
        const symbol = config.symbols?.[code] || code;
        const rounded = converted.toLocaleString(locale, {
          minimumFractionDigits: minFrac,
          maximumFractionDigits: maxFrac
        });
        return `${rounded} ${symbol}`;
      }
    };

    return {
      code,                   // 'EUR' | 'USD' | 'MGA'
      symbol: config.symbols?.[code] || code,
      enabled: config.enabled,
      base: config.base,
      setCurrency,
      convert,
      format
    };
  }, [code, config]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

export const useCurrency = () => {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    // Fallback si un composant est utilisé hors provider
    return {
      code: 'EUR',
      symbol: '€',
      enabled: ['EUR'],
      base: 'EUR',
      setCurrency: () => {},
      convert: (n) => Number(n || 0),
      format: (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(n || 0))
    };
  }
  return ctx;
};

export default CurrencyContext;
