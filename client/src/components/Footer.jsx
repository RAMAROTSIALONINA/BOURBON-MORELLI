import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, CreditCard, Truck, Shield, RefreshCw } from 'lucide-react';
import footerService from '../services/footerService';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [footerData, setFooterData] = useState(null);

  useEffect(() => {
    const loadFooterData = async () => {
      try {
        const response = await footerService.getFooterData();
        if (response.success) {
          setFooterData(response.data);
        }
      } catch (error) {
        console.error('Erreur chargement footer:', error);
      }
    };

    loadFooterData();
  }, []);

  // Données par défaut si chargement ou erreur
  const getDefaultData = () => ({
    contact: [
      { key_name: 'email', value: 'contact@bourbonmorelli.com', label: 'Email' },
      { key_name: 'phone', value: '+33 1 23 45 67 89', label: 'Téléphone' },
      { key_name: 'address', value: 'Antananarivo, Madagascar', label: 'Adresse' }
    ],
    copyright: [
      { key_name: 'copyright_text', value: '© {year} BOURBON MORELLI. Tous droits réservés.', label: 'Texte copyright' }
    ],
    brand: [
      { key_name: 'description', value: 'Découvrez l\'élégance intemporelle de la couture Malgache avec nos créations sur mesure, alliant savoir-faire traditionnel et modernité.' }
    ],
    newsletter: [
      { key_name: 'title', value: 'Abonnez-vous à notre newsletter' },
      { key_name: 'placeholder', value: 'Votre adresse email' },
      { key_name: 'button_text', value: 'S\'abonner' }
    ],
    social: [
      { key_name: 'facebook', value: '#' },
      { key_name: 'instagram', value: '#' },
      { key_name: 'twitter', value: '#' },
      { key_name: 'youtube', value: '#' }
    ],
    features: [
      { key_name: 'payment', value: { title: 'Paiement sécurisé', description: '100% sécurisé avec Stripe et PayPal' } },
      { key_name: 'shipping', value: { title: 'Livraison gratuite', description: 'À partir de 200€ d\'achat' } },
      { key_name: 'satisfaction', value: { title: 'Satisfaction garantie', description: '30 jours pour retourner votre commande' } },
      { key_name: 'returns', value: { title: 'Retours faciles', description: 'Processus de retour simplifié' } }
    ],
    legal: [
      { key_name: 'privacy', value: '/privacy', label: 'Confidentialité' },
      { key_name: 'terms', value: '/terms', label: 'CGV' },
      { key_name: 'legal', value: '/legal', label: 'Mentions légales' },
      { key_name: 'cookies', value: '/cookies', label: 'Cookies' }
    ],
    navigation: [
      { key_name: 'shop_new', value: '/new', label: 'Nouveautés' },
      { key_name: 'shop_bestsellers', value: '/bestsellers', label: 'Meilleures ventes' },
      { key_name: 'shop_sales', value: '/sales', label: 'Promotions' },
      { key_name: 'shop_collections', value: '/collections', label: 'Collections' },
      { key_name: 'customer_account', value: '/account', label: 'Mon compte' },
      { key_name: 'customer_orders', value: '/account/orders', label: 'Historique des commandes' },
      { key_name: 'customer_wishlist', value: '/account/wishlist', label: 'Favoris' },
      { key_name: 'customer_newsletter', value: '/newsletter', label: 'Newsletter' },
      { key_name: 'help_contact', value: '/contact', label: 'Contact' },
      { key_name: 'help_faq', value: '/faq', label: 'FAQ' },
      { key_name: 'help_shipping', value: '/shipping', label: 'Livraison' },
      { key_name: 'help_returns', value: '/returns', label: 'Retours' },
      { key_name: 'help_size_guide', value: '/size-guide', label: 'Guide des tailles' },
      { key_name: 'help_care', value: '/care', label: 'Entretien' },
      { key_name: 'company_about', value: '/about', label: 'À propos' },
      { key_name: 'company_story', value: '/story', label: 'Notre histoire' },
      { key_name: 'company_stores', value: '/stores', label: 'Boutiques' },
      { key_name: 'company_careers', value: '/careers', label: 'Carrières' },
      { key_name: 'company_press', value: '/press', label: 'Presse' },
      { key_name: 'company_sustainability', value: '/sustainability', label: 'Durabilité' }
    ]
  });

  const data = footerData || getDefaultData();

  // Helper pour obtenir les liens par catégorie
  const getLinksByCategory = (category) => {
    if (!data.navigation) return [];
    return data.navigation.filter(link => 
      link.key_name.startsWith(`${category}_`)
    ).map(link => ({
      name: link.label,
      href: link.value
    }));
  };

  // Helper pour obtenir les icônes sociales
  const getSocialIcon = (keyName) => {
    const icons = {
      facebook: Facebook,
      instagram: Instagram,
      twitter: Twitter,
      youtube: Youtube
    };
    return icons[keyName] || Facebook;
  };

  // Helper pour obtenir les icônes de features
  const getFeatureIcon = (keyName) => {
    const icons = {
      payment: CreditCard,
      shipping: Truck,
      satisfaction: Shield,
      returns: RefreshCw
    };
    return icons[keyName] || CreditCard;
  };

  const socialLinks = (data.social || []).map(social => ({
    icon: getSocialIcon(social.key_name),
    href: social.value,
    label: social.label
  }));

  const features = (data.features || []).map(feature => ({
    icon: getFeatureIcon(feature.key_name),
    title: feature.value.title,
    description: feature.value.description
  }));

  const brandDescription = data.brand?.[0]?.value || 'Découvrez l\'élégance intemporelle de la couture Malgache avec nos créations sur mesure, alliant savoir-faire traditionnel et modernité.';
  
  const newsletterData = data.newsletter || {};
  const newsletterTitle = newsletterData.find(item => item.key_name === 'title')?.value || 'Abonnez-vous à notre newsletter';
  const newsletterPlaceholder = newsletterData.find(item => item.key_name === 'placeholder')?.value || 'Votre adresse email';
  const newsletterButtonText = newsletterData.find(item => item.key_name === 'button_text')?.value || 'S\'abonner';

  
  return (
    <footer className="bg-neutral-900 text-white">
      {/* Features section */}
      <div className="border-b border-neutral-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <feature.icon className="w-8 h-8 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-neutral-400 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl font-luxury">BM</span>
              </div>
              <span className="text-2xl font-luxury font-bold">BOURBON MORELLI</span>
            </div>
            
            <p className="text-neutral-400 mb-6 leading-relaxed">
              {brandDescription}
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">{newsletterTitle}</h4>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder={newsletterPlaceholder}
                  className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-neutral-500"
                />
                <button
                  type="submit"
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  {newsletterButtonText}
                </button>
              </form>
            </div>

            {/* Social links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 bg-neutral-800 rounded-full flex items-center justify-center text-neutral-400 hover:bg-primary-500 hover:text-white transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Boutique</h3>
            <ul className="space-y-3">
              {getLinksByCategory('shop').map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer service */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Service client</h3>
            <ul className="space-y-3">
              {getLinksByCategory('customer').map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Company */}
          <div>
            <h3 className="font-semibold text-lg mb-6">Aide & Info</h3>
            <ul className="space-y-3">
              {getLinksByCategory('help').map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
            
            <h3 className="font-semibold text-lg mb-6 mt-8">Entreprise</h3>
            <ul className="space-y-3">
              {getLinksByCategory('company').map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-neutral-400 hover:text-primary-500 transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Contact info */}
      <div className="border-t border-neutral-800">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Mail className="w-5 h-5 text-primary-500" />
              <span className="text-neutral-400">
                {(data.contact?.find(item => item.key_name === 'email')?.value) || 'contact@bourbonmorelli.com'}
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Phone className="w-5 h-5 text-primary-500" />
              <span className="text-neutral-400">
                {(data.contact?.find(item => item.key_name === 'phone')?.value) || '+33 1 23 45 67 89'}
              </span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span className="text-neutral-400">
                {(data.contact?.find(item => item.key_name === 'address')?.value) || 'Antananarivo, Madagascar'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-neutral-400 text-sm">
              {(data.copyright?.[0]?.value || `© ${currentYear} BOURBON MORELLI. Tous droits réservés.`).replace('{year}', currentYear)}
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              {(data.legal || []).map((legal) => (
                <Link
                  key={legal.key_name}
                  to={legal.value}
                  className="text-neutral-400 hover:text-primary-500 transition-colors"
                >
                  {legal.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
