import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, CreditCard, Truck, Shield, RefreshCw } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    shop: [
      { name: 'Nouveautés', href: '/new' },
      { name: 'Meilleures ventes', href: '/bestsellers' },
      { name: 'Promotions', href: '/sales' },
      { name: 'Collections', href: '/collections' },
    ],
    customer: [
      { name: 'Mon compte', href: '/account' },
      { name: 'Historique des commandes', href: '/account/orders' },
      { name: 'Favoris', href: '/account/wishlist' },
      { name: 'Newsletter', href: '/newsletter' },
    ],
    help: [
      { name: 'Contact', href: '/contact' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Livraison', href: '/shipping' },
      { name: 'Retours', href: '/returns' },
      { name: 'Guide des tailles', href: '/size-guide' },
      { name: 'Entretien', href: '/care' },
    ],
    company: [
      { name: 'À propos', href: '/about' },
      { name: 'Notre histoire', href: '/story' },
      { name: 'Boutiques', href: '/stores' },
      { name: 'Carrières', href: '/careers' },
      { name: 'Presse', href: '/press' },
      { name: 'Durabilité', href: '/sustainability' },
    ]
  };

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ];

  const features = [
    {
      icon: CreditCard,
      title: 'Paiement sécurisé',
      description: '100% sécurisé avec Stripe et PayPal'
    },
    {
      icon: Truck,
      title: 'Livraison gratuite',
      description: 'À partir de 200€ d\'achat'
    },
    {
      icon: Shield,
      title: 'Satisfaction garantie',
      description: '30 jours pour retourner votre commande'
    },
    {
      icon: RefreshCw,
      title: 'Retours faciles',
      description: 'Processus de retour simplifié'
    }
  ];

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
              Découvrez l'élégance intemporelle de la couture Malgache avec nos créations 
              sur mesure, alliant savoir-faire traditionnel et modernité.
            </p>

            {/* Newsletter */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Abonnez-vous à notre newsletter</h4>
              <form className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-white placeholder-neutral-500"
                />
                <button
                  type="submit"
                  className="bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
                >
                  S'abonner
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
              {footerLinks.shop.map((link) => (
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
              {footerLinks.customer.map((link) => (
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
              {footerLinks.help.map((link) => (
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
              {footerLinks.company.map((link) => (
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
              <span className="text-neutral-400">contact@bourbonmorelli.com</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <Phone className="w-5 h-5 text-primary-500" />
              <span className="text-neutral-400">+33 1 23 45 67 89</span>
            </div>
            <div className="flex items-center justify-center md:justify-start space-x-3">
              <MapPin className="w-5 h-5 text-primary-500" />
              <span className="text-neutral-400">Antananarivo, Madagascar</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-neutral-400 text-sm">
              © {currentYear} BOURBON MORELLI. Tous droits réservés.
            </div>
            
            <div className="flex items-center space-x-6 text-sm">
              <Link to="/privacy" className="text-neutral-400 hover:text-primary-500 transition-colors">
                Confidentialité
              </Link>
              <Link to="/terms" className="text-neutral-400 hover:text-primary-500 transition-colors">
                CGV
              </Link>
              <Link to="/legal" className="text-neutral-400 hover:text-primary-500 transition-colors">
                Mentions légales
              </Link>
              <Link to="/cookies" className="text-neutral-400 hover:text-primary-500 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
