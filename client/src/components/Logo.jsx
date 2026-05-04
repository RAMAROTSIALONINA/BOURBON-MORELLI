import React, { useEffect, useState } from 'react';
import siteSettingsService from '../services/siteSettingsService';

const BACKEND_URL = 'http://localhost:5003';
const resolveImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('/uploads') || url.startsWith('/api')) return `${BACKEND_URL}${url}`;
  return url; // /images/... sert côté client
};

const DEFAULT_LOGO = '/images/BOURBON MORELLI.png';

const Logo = ({ className = '', size = 'medium' }) => {
  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xlarge: 'h-24 w-24',
    xxlarge: 'h-48 w-48',
    full: 'h-64 w-64'
  };

  const [logoSrc, setLogoSrc] = useState(DEFAULT_LOGO);

  useEffect(() => {
    let alive = true;
    siteSettingsService.getSettings().then((v) => {
      if (!alive) return;
      const url = v?.logo ? resolveImageUrl(v.logo) : null;
      setLogoSrc(url || DEFAULT_LOGO);
    });
    const onChange = (e) => {
      const url = e.detail?.logo ? resolveImageUrl(e.detail.logo) : null;
      setLogoSrc(url || DEFAULT_LOGO);
    };
    window.addEventListener('siteSettingsChange', onChange);
    return () => {
      alive = false;
      window.removeEventListener('siteSettingsChange', onChange);
    };
  }, []);

  return (
    <div className={`${sizeClasses[size]} ${className} flex items-center justify-center max-h-full max-w-full`}>
      <img
        src={logoSrc}
        alt="BOURBON MORELLI"
        className="w-full h-full object-contain"
        onError={(e) => {
          if (e.target.src !== window.location.origin + DEFAULT_LOGO && !e.target.src.endsWith(DEFAULT_LOGO)) {
            e.target.src = DEFAULT_LOGO;
            return;
          }
          e.target.style.display = 'none';
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'block';
        }}
      />
      <div
        className="w-full h-full flex items-center justify-center bg-primary-500 text-white rounded-lg font-luxury font-bold text-xs"
        style={{ display: 'none' }}
      >
        BM
      </div>
    </div>
  );
};

export default Logo;
